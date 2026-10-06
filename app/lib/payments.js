// Checkout creation, fulfillment and payment events (spec section 8).
//
// Two providers share one interface, chosen by PAYMENTS_MODE:
//   sim     the local simulation. A Checkout Session is a row in sim_sessions and "Stripe"
//           is a page served by the portal at /sim/checkout/<id>. Everything else, meaning
//           the holds, the checkout rows, fulfillCheckout's batch and the event handling,
//           is the production code path.
//   stripe  the real thing, bolted in later. It needs STRIPE_SECRET_KEY, STRIPE_PRICE_ID and
//           STRIPE_WEBHOOK_SECRET, and STRIPE_MODE of "test" or "live". Written to the spec
//           and not yet run against Stripe, so treat its first test-mode run as M5.

import { now, ulid, addMinutes, bad, HttpError, timingSafeEqual } from './util.js';
import { owned, settings, auditStmt, dirtyStmt } from './store.js';
import { sendMail, alertOps } from './mail.js';

const STRIPE_API = 'https://api.stripe.com/v1';
const HOLD_MINUTES = 60;

const secs = (iso) => Math.floor(new Date(iso).getTime() / 1000);
const isoFromSecs = (s) => now(new Date(s * 1000));

// ---------------------------------------------------------------- providers

function form(params, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => (typeof item === 'object' ? form(item, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item))));
    else if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

const stripeProvider = {
  name: 'stripe',
  async call(env, method, path, params, idempotencyKey) {
    // STRIPE_API_VERSION pins the shape of every object (spec 3). Set it to the version the
    // webhook endpoint is created on, read from the Stripe Dashboard when the account exists.
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_API_VERSION) throw new HttpError(503, 'Payments are not set up yet.');
    const headers = { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'stripe-version': env.STRIPE_API_VERSION };
    let url = `${STRIPE_API}${path}`;
    let body;
    if (method === 'GET') { if (params) url += `?${form(params)}`; } else {
      headers['content-type'] = 'application/x-www-form-urlencoded';
      body = form(params || {}).toString();
    }
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
    const res = await fetch(url, { method, headers, body });
    const data = await res.json();
    if (!res.ok) throw new HttpError(502, `Stripe: ${data.error?.message || res.status}`);
    return data;
  },
  priceId: (env) => env.STRIPE_PRICE_ID,
  livemode: (env) => env.STRIPE_MODE === 'live',
  async ensureCustomer(env, breeder) {
    if (breeder.stripe_customer_id) return breeder.stripe_customer_id;
    const c = await this.call(env, 'POST', '/customers', {
      email: breeder.email, name: breeder.business_name, metadata: { breeder_id: breeder.id },
    }, `customer-${breeder.id}`);
    await env.DB.prepare('UPDATE breeders SET stripe_customer_id = ? WHERE id = ?').bind(c.id, breeder.id).run();
    return c.id;
  },
  async createSession(env, o) {
    const s = await this.call(env, 'POST', '/checkout/sessions', {
      mode: 'payment',
      line_items: [{ price: o.priceId, quantity: o.quantity }],
      payment_method_types: ['card'],
      customer: o.customer,
      client_reference_id: o.checkoutId,
      metadata: { checkout_id: o.checkoutId, breeder_id: o.breederId },
      payment_intent_data: { metadata: { checkout_id: o.checkoutId }, description: o.description },
      submit_type: 'pay',
      expires_at: secs(o.expiresAt),
      success_url: `${o.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${o.origin}/checkout/cancel?c=${o.checkoutId}`,
    }, o.checkoutId);
    return { id: s.id, url: s.url, amount_total: s.amount_total, expires_at: isoFromSecs(s.expires_at) };
  },
  retrieveSession(env, id) {
    return this.call(env, 'GET', `/checkout/sessions/${encodeURIComponent(id)}`, { expand: ['line_items'] });
  },
  async expireSession(env, id) {
    try { await this.call(env, 'POST', `/checkout/sessions/${encodeURIComponent(id)}/expire`, {}); } catch (e) {
      console.warn('expire failed (the session may already be complete or expired)', e.message);
    }
  },
  /**
   * Plan P3.8. Refund a whole listing payment. Stripe answers with the refund and later sends
   * charge.refunded, which handleEvent turns into applyRefund, so this returns no event. Not yet
   * run against Stripe, and the admin route refuses it until P4.5 proves it.
   */
  async refund(env, paymentIntent) {
    await this.call(env, 'POST', '/refunds', { payment_intent: paymentIntent, reason: 'requested_by_customer' }, `refund-${paymentIntent}`);
    return null;
  },
};

const simProvider = {
  name: 'sim',
  priceId: () => 'price_sim_listing',
  livemode: () => false,
  async ensureCustomer() { return null; },
  async createSession(env, o) {
    const id = `cs_sim_${ulid()}`;
    const exp = secs(o.expiresAt);
    await env.DB.prepare(
      `INSERT INTO sim_sessions (id, status, payment_status, client_reference_id, price_id, quantity, unit_amount,
         amount_total, currency, customer_email, success_url, cancel_url, created, expires_at)
       VALUES (?, 'open', 'unpaid', ?, ?, ?, ?, ?, 'usd', ?, ?, ?, ?, ?)`,
    ).bind(id, o.checkoutId, o.priceId, o.quantity, o.unitAmount, o.quantity * o.unitAmount, o.email,
      `${o.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, `${o.origin}/checkout/cancel?c=${o.checkoutId}`,
      Math.floor(Date.now() / 1000), exp).run();
    return { id, url: `${o.origin}/sim/checkout/${id}`, amount_total: o.quantity * o.unitAmount, expires_at: isoFromSecs(exp) };
  },
  async retrieveSession(env, id) {
    const r = await env.DB.prepare('SELECT * FROM sim_sessions WHERE id = ?').bind(id).first();
    if (!r) throw new HttpError(404, 'No such checkout session.');
    let status = r.status;
    if (status === 'open' && r.expires_at < Date.now() / 1000) status = 'expired';
    return {
      id: r.id, object: 'checkout.session', mode: 'payment', livemode: false, status,
      payment_status: r.payment_status, client_reference_id: r.client_reference_id, currency: r.currency,
      amount_total: r.amount_total, payment_intent: r.payment_intent, expires_at: r.expires_at,
      customer_email: r.customer_email, success_url: r.success_url, cancel_url: r.cancel_url,
      line_items: { data: [{ quantity: r.quantity, price: { id: r.price_id, unit_amount: r.unit_amount } }] },
    };
  },
  async expireSession(env, id) {
    await env.DB.prepare("UPDATE sim_sessions SET status = 'expired' WHERE id = ? AND status = 'open'").bind(id).run();
  },
  /** The simulated card payment. Returns the event Stripe would send. */
  async pay(env, id) {
    const pi = `pi_sim_${ulid()}`;
    const r = await env.DB.prepare(
      `UPDATE sim_sessions SET status = 'complete', payment_status = 'paid', payment_intent = ?
        WHERE id = ? AND status = 'open' AND expires_at > ?`,
    ).bind(pi, id, Math.floor(Date.now() / 1000)).run();
    if (r.meta.changes !== 1) throw new HttpError(409, 'This checkout is no longer open.');
    return { id: `evt_sim_${ulid()}`, type: 'checkout.session.completed', livemode: false,
      data: { object: await this.retrieveSession(env, id) } };
  },
  /** Plan P3.8. The practice refund. Returns the charge.refunded event Stripe would send. */
  async refund(env, paymentIntent) {
    const pay = await env.DB.prepare('SELECT * FROM payments WHERE stripe_payment_intent_id = ?').bind(paymentIntent).first();
    if (!pay) throw new HttpError(404, 'No such payment.');
    return { id: `evt_sim_${ulid()}`, type: 'charge.refunded', livemode: false,
      data: { object: { id: pay.stripe_charge_id || `ch_sim_${ulid()}`, object: 'charge', payment_intent: paymentIntent,
        amount: pay.amount_cents, amount_refunded: pay.amount_cents } } };
  },
  /**
   * Plan P3.8. A practice dispute, opened or closed as won or lost. Returns the
   * charge.dispute.created or charge.dispute.closed event Stripe would send.
   */
  async dispute(env, paymentIntent, action, reason) {
    const pay = await env.DB.prepare('SELECT * FROM payments WHERE stripe_payment_intent_id = ?').bind(paymentIntent).first();
    if (!pay) throw new HttpError(404, 'No such payment.');
    const open = await env.DB.prepare('SELECT id FROM disputes WHERE payment_intent = ? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1').bind(paymentIntent).first();
    if (action === 'open') {
      if (open) throw bad('This payment already has an open dispute.');
      return { id: `evt_sim_${ulid()}`, type: 'charge.dispute.created', livemode: false,
        data: { object: { id: `dp_sim_${ulid()}`, object: 'dispute', payment_intent: paymentIntent, amount: pay.amount_cents, reason: reason || 'general', status: 'needs_response' } } };
    }
    if (!open) throw bad('This payment has no open dispute.');
    return { id: `evt_sim_${ulid()}`, type: 'charge.dispute.closed', livemode: false,
      data: { object: { id: open.id, object: 'dispute', payment_intent: paymentIntent, amount: pay.amount_cents, reason: reason || null, status: action === 'won' ? 'won' : 'lost' } } };
  },
};

export function provider(env) {
  if (env.PAYMENTS_MODE === 'sim') return simProvider;
  if (env.PAYMENTS_MODE === 'stripe') return stripeProvider;
  throw new HttpError(503, 'Payments are not set up yet.');
}

export const sim = simProvider;

// ---------------------------------------------------------------- creating a checkout

/**
 * Which puppies can be paid for right now, and why the others cannot (spec 8.3 step 1).
 * Shared by the checkout route and the portal's Pay screen, so they never disagree.
 */
export async function payability(env, puppy, s, photoCount, heldBy) {
  if (puppy.publication_state === 'archived') return 'Removed from your listings.';
  if (puppy.operator_hold) return 'Paused by Puppy Connection. Contact us to restore it.';
  if (heldBy) return 'Already in a checkout that has not finished.';
  if (!puppy.name || puppy.price_cents == null) return 'Needs a name and a price.';
  if (photoCount < s.minPhotos) return `Needs at least ${s.minPhotos} photo${s.minPhotos === 1 ? '' : 's'}.`;
  if (puppy.publication_state === 'published') {
    // With no expiry (listing_days 0) one payment lists a puppy for good, so it is never paid for twice.
    if (s.listingDays <= 0 || !puppy.expires_at) return 'Already listed.';
    const soon = new Date(Date.now() + s.warnDays * 86400000).toISOString();
    if (puppy.expires_at > soon) return 'Already listed. Renewal opens near the expiry date.';
  }
  return null;
}

export async function createCheckout(env, breeder, puppyIds, origin) {
  if (!Array.isArray(puppyIds) || !puppyIds.length) throw bad('Choose at least one puppy.');
  const ids = [...new Set(puppyIds.map(String))];
  if (ids.length > 50) throw bad('Up to 50 puppies can be paid for at once.');
  const s = await settings(env);
  const p = provider(env);
  const t = now();

  const puppies = [];
  const problems = [];
  for (const id of ids) {
    const pup = await owned(env, 'puppy', id, breeder.id);
    const photos = (await env.DB.prepare('SELECT COUNT(*) AS n FROM photos WHERE puppy_id = ?').bind(id).first()).n;
    const hold = await env.DB.prepare('SELECT checkout_id FROM puppy_holds WHERE puppy_id = ? AND expires_at > ?').bind(id, t).first();
    const why = await payability(env, pup, s, photos, hold?.checkout_id);
    if (why) problems.push({ puppy: pup.name, reason: why }); else puppies.push(pup);
  }
  if (problems.length) throw bad('Some puppies cannot be paid for yet.', { problems });

  const checkoutId = ulid();
  const qty = puppies.length;
  const total = qty * s.feeCents;
  const holdUntil = addMinutes(t, HOLD_MINUTES + 5);
  const marks = puppies.map(() => '?').join(',');
  try {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM puppy_holds WHERE puppy_id IN (${marks}) AND expires_at <= ?`).bind(...puppies.map((x) => x.id), t),
      env.DB.prepare(
        `INSERT INTO checkouts (id, breeder_id, status, price_id, quantity, unit_amount_cents, amount_total_cents, currency, created_at)
         VALUES (?, ?, 'creating', ?, ?, ?, ?, 'usd', ?)`,
      ).bind(checkoutId, breeder.id, p.priceId(env), qty, s.feeCents, total, t),
      ...puppies.map((x) => env.DB.prepare('INSERT INTO checkout_items (checkout_id, puppy_id, breeder_id) VALUES (?, ?, ?)').bind(checkoutId, x.id, breeder.id)),
      ...puppies.map((x) => env.DB.prepare('INSERT INTO puppy_holds (puppy_id, checkout_id, expires_at) VALUES (?, ?, ?)').bind(x.id, checkoutId, holdUntil)),
      auditStmt(env, 'breeder', breeder.email, 'checkout.create', 'checkout', checkoutId, null, { puppies: puppies.map((x) => x.id), total }),
    ]);
  } catch (e) {
    if (/UNIQUE|PRIMARY KEY|constraint/i.test(String(e.message))) {
      throw new HttpError(409, 'One of these puppies is already in a checkout that has not finished. Finish or cancel it first.');
    }
    throw e;
  }

  let session;
  try {
    const customer = await p.ensureCustomer(env, breeder);
    session = await p.createSession(env, {
      checkoutId, breederId: breeder.id, priceId: p.priceId(env), quantity: qty, unitAmount: s.feeCents,
      customer, email: breeder.email, origin, expiresAt: addMinutes(t, HOLD_MINUTES),
      description: `${qty} puppy listing${qty === 1 ? '' : 's'}, Puppy Connection`,
    });
  } catch (e) {
    await releaseCheckout(env, checkoutId, 'failed');
    throw e instanceof HttpError ? e : new HttpError(502, 'The payment page could not be opened. Please try again.');
  }

  if (session.amount_total !== total) {
    await p.expireSession(env, session.id);
    await releaseCheckout(env, checkoutId, 'failed');
    await alertOps(env, 'Price mismatch at checkout', `Checkout ${checkoutId} expected ${total} cents and the payment provider quoted ${session.amount_total}. The listing price in Stripe and the fee_cents setting disagree.`);
    throw new HttpError(502, 'The listing fee is misconfigured, so the payment was stopped. Puppy Connection has been told.');
  }

  await env.DB.batch([
    env.DB.prepare("UPDATE checkouts SET status = 'open', stripe_session_id = ?, expires_at = ? WHERE id = ? AND status = 'creating'")
      .bind(session.id, session.expires_at, checkoutId),
    env.DB.prepare('UPDATE puppy_holds SET expires_at = ? WHERE checkout_id = ?').bind(addMinutes(session.expires_at, 5), checkoutId),
  ]);
  return { checkout_id: checkoutId, url: session.url };
}

/** Close an unpaid checkout and free its puppies. Never touches a fulfilled one. */
export async function releaseCheckout(env, checkoutId, status) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE checkouts SET status = ? WHERE id = ? AND fulfilled_at IS NULL AND status IN ('creating','open')`).bind(status, checkoutId),
    env.DB.prepare('DELETE FROM puppy_holds WHERE checkout_id = ?').bind(checkoutId),
  ]);
}

// ---------------------------------------------------------------- fulfillment

/**
 * The one function that publishes a paid listing (spec 8.5). Called from the webhook, the
 * success page and reconciliation, possibly at the same moment, and safe every time:
 * every statement is guarded on fulfilled_at IS NULL, the last one sets it, and D1 runs a
 * batch as one transaction, sequentially.
 */
export async function fulfillCheckout(env, sessionId, source, ctx) {
  const p = provider(env);
  const s = await p.retrieveSession(env, sessionId);
  const co = await env.DB.prepare('SELECT * FROM checkouts WHERE id = ?').bind(s.client_reference_id || '').first();
  if (!co) {
    await alertOps(env, 'Payment for an unknown checkout', `Session ${sessionId} names checkout "${s.client_reference_id}", which is not in the database.`);
    return { status: 'unknown' };
  }
  if (co.fulfilled_at) return { status: 'paid', won: false, checkoutId: co.id };

  const qty = (s.line_items?.data || []).reduce((n, li) => n + (li.quantity || 0), 0);
  const priceOk = (s.line_items?.data || []).every((li) => li.price?.id === co.price_id);
  const problems = [];
  if (co.stripe_session_id !== s.id) problems.push('session id does not match the checkout');
  if (s.mode !== 'payment') problems.push(`mode is ${s.mode}`);
  if (s.currency !== co.currency) problems.push(`currency is ${s.currency}`);
  if (s.amount_total !== co.amount_total_cents) problems.push(`amount ${s.amount_total} against ${co.amount_total_cents} expected`);
  if (qty !== co.quantity) problems.push(`quantity ${qty} against ${co.quantity}`);
  if (!priceOk) problems.push('price id differs');
  if (!!s.livemode !== p.livemode(env)) problems.push('live and test mode disagree');
  if (problems.length) {
    await env.DB.prepare("UPDATE checkouts SET status = 'needs_review', review_reason = ? WHERE id = ? AND fulfilled_at IS NULL")
      .bind(problems.join('; '), co.id).run();
    await alertOps(env, 'A payment needs review', `Checkout ${co.id}: ${problems.join('; ')}. Nothing was published.`);
    return { status: 'needs_review', problems };
  }
  if (s.payment_status !== 'paid') return { status: 'unpaid' };

  const st = await settings(env);
  const t = now();
  const unfulfilled = 'EXISTS (SELECT 1 FROM checkouts WHERE id = ? AND fulfilled_at IS NULL)';
  const res = await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO payments (stripe_payment_intent_id, checkout_id, amount_cents, status, created_at, updated_at)
       VALUES (?, ?, ?, 'succeeded', ?, ?)`,
    ).bind(s.payment_intent, co.id, s.amount_total, t, t),
    env.DB.prepare(
      `INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, after_json)
       SELECT ?, 'stripe', ?, 'checkout.fulfill', 'checkout', ?, ? WHERE ${unfulfilled}`,
    ).bind(t, source, co.id, JSON.stringify({ session: s.id, payment_intent: s.payment_intent }), co.id),
    env.DB.prepare(
      `UPDATE puppies
          SET payment_state = 'paid', publication_state = 'published',
              published_at = COALESCE(published_at, ?),
              expires_at = CASE WHEN ? > 0 THEN strftime('%Y-%m-%dT%H:%M:%SZ',
                             CASE WHEN expires_at IS NOT NULL AND expires_at > ? THEN expires_at ELSE ? END,
                             '+' || ? || ' days') ELSE NULL END,
              expiry_warned_at = NULL, version = version + 1, updated_at = ?
        WHERE id IN (SELECT puppy_id FROM checkout_items WHERE checkout_id = ?)
          AND breeder_id = ? AND publication_state != 'archived' AND ${unfulfilled}`,
    ).bind(t, st.listingDays, t, t, st.listingDays, t, co.id, co.breeder_id, co.id),
    env.DB.prepare('DELETE FROM puppy_holds WHERE checkout_id = ?').bind(co.id),
    env.DB.prepare(
      `UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, ?), generation = generation + 1
        WHERE id = 1 AND ${unfulfilled}`,
    ).bind(t, co.id),
    env.DB.prepare(
      `UPDATE checkouts SET status = 'paid', paid_at = ?, fulfilled_at = ?, stripe_payment_intent_id = ?
        WHERE id = ? AND fulfilled_at IS NULL`,
    ).bind(t, t, s.payment_intent, co.id),
  ]);

  const won = res[5].meta.changes === 1;
  const published = res[2].meta.changes;
  if (won) {
    const after = (async () => {
      if (published < co.quantity) {
        await alertOps(env, 'Paid for a removed puppy', `Checkout ${co.id} paid for ${co.quantity} puppies but ${published} could be published, because the rest were removed after checkout began. Decide on a refund in Stripe.`);
      }
      const b = await env.DB.prepare('SELECT email FROM breeders WHERE id = ?').bind(co.breeder_id).first();
      const { results } = await env.DB.prepare(
        'SELECT p.name FROM puppies p JOIN checkout_items i ON i.puppy_id = p.id WHERE i.checkout_id = ? ORDER BY p.name',
      ).bind(co.id).all();
      await sendMail(env, b.email, 'listings_live', { names: results.map((r) => r.name), portalUrl: env.PORTAL_ORIGIN || '' });
    })().catch((e) => console.error('post-fulfillment work failed', e));
    if (ctx?.waitUntil) ctx.waitUntil(after); else await after;
  }
  return { status: 'paid', won, published, checkoutId: co.id };
}

// ---------------------------------------------------------------- events

/**
 * Plan P3.8. The one path a refund takes, whether an operator pressed Refund (the practice
 * provider hands back the charge.refunded event) or Stripe sent charge.refunded on its own. A
 * full refund takes the puppies it paid for off the site (payment_state refunded, back to a
 * draft the breeder can see), records it, and emails the breeder. A partial refund is recorded
 * and the operators are told, and the listings stay up until someone decides.
 */
export async function applyRefund(env, charge, ctx, actor = { type: 'stripe', email: 'webhook' }) {
  const t = now();
  const pay = await env.DB.prepare('SELECT * FROM payments WHERE stripe_payment_intent_id = ?').bind(charge.payment_intent || '').first();
  if (!pay) {
    await alertOps(env, 'A refund for an unknown payment', `Charge ${charge.id} for payment ${charge.payment_intent} was refunded, and that payment is not in the database.`);
    return 'unknown payment';
  }
  if (pay.status === 'refunded') return 'already refunded';
  const full = charge.amount_refunded >= charge.amount;
  const setPay = env.DB.prepare('UPDATE payments SET status = ?, stripe_charge_id = ?, updated_at = ? WHERE stripe_payment_intent_id = ?')
    .bind(full ? 'refunded' : 'partially_refunded', charge.id, t, pay.stripe_payment_intent_id);
  const audit = (action, after) => auditStmt(env, actor.type, actor.email, action, 'checkout', pay.checkout_id,
    { payment_status: pay.status }, { payment_intent: pay.stripe_payment_intent_id, refunded_cents: charge.amount_refunded, ...after });
  if (!full) {
    await env.DB.batch([setPay, audit('payment.refund_partial', { reason: actor.reason || null })]);
    await alertOps(env, 'A listing payment was partly refunded', `Payment ${pay.stripe_payment_intent_id} was partly refunded. The listings stay up until you decide.`);
    return 'partial refund recorded';
  }
  const co = await env.DB.prepare('SELECT * FROM checkouts WHERE id = ?').bind(pay.checkout_id).first();
  // A puppy that a later payment also covers (a renewal, when listings expire) stays up.
  const res = await env.DB.batch([
    setPay,
    env.DB.prepare(
      `UPDATE puppies SET payment_state = 'refunded',
              publication_state = CASE WHEN publication_state = 'archived' THEN 'archived' ELSE 'draft' END,
              expires_at = NULL, expiry_warned_at = NULL, updated_at = ?, version = version + 1
        WHERE id IN (SELECT puppy_id FROM checkout_items WHERE checkout_id = ?) AND breeder_id = ? AND payment_state = 'paid'
          AND NOT EXISTS (SELECT 1 FROM checkout_items i2 JOIN checkouts c2 ON c2.id = i2.checkout_id JOIN payments p2 ON p2.checkout_id = c2.id
                           WHERE i2.puppy_id = puppies.id AND c2.id != ? AND p2.status = 'succeeded' AND c2.paid_at > ?)`,
    ).bind(t, co.id, co.breeder_id, co.id, co.paid_at || ''),
    audit('payment.refund', { reason: actor.reason || null }),
    dirtyStmt(env),
  ]);
  const down = res[1].meta.changes;
  const after = (async () => {
    const b = await env.DB.prepare('SELECT email, legacy FROM breeders WHERE id = ?').bind(co.breeder_id).first();
    const { results } = await env.DB.prepare(
      'SELECT p.name FROM puppies p JOIN checkout_items i ON i.puppy_id = p.id WHERE i.checkout_id = ? ORDER BY p.name',
    ).bind(co.id).all();
    if (b && !b.legacy) await sendMail(env, b.email, 'listing_refunded', { names: results.map((r) => r.name), amountCents: charge.amount_refunded, portalUrl: env.PORTAL_ORIGIN || '' });
    if (actor.type !== 'operator') await alertOps(env, 'A listing payment was refunded', `Payment ${pay.stripe_payment_intent_id} was refunded in full, so ${down} listing(s) came off the site.`);
  })().catch((e) => console.error('post-refund work failed', e));
  if (ctx?.waitUntil) ctx.waitUntil(after); else await after;
  return `refunded, ${down} off the site`;
}

/** Plan P3.8. A dispute opened or closed, recorded and shown. Listings are not changed. */
async function recordDispute(env, type, d, actor) {
  const t = now();
  const pay = await env.DB.prepare('SELECT checkout_id FROM payments WHERE stripe_payment_intent_id = ?').bind(d.payment_intent || '').first();
  const opened = type === 'charge.dispute.created';
  const payStatus = opened ? 'disputed' : d.status === 'won' ? 'dispute_won' : d.status === 'lost' ? 'dispute_lost' : 'disputed';
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO disputes (id, payment_intent, checkout_id, status, reason, amount_cents, opened_at, closed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET status = excluded.status, reason = COALESCE(excluded.reason, disputes.reason),
         closed_at = COALESCE(excluded.closed_at, disputes.closed_at), updated_at = excluded.updated_at`,
    ).bind(d.id, d.payment_intent, pay?.checkout_id || null, d.status || 'needs_response', d.reason || null, d.amount ?? null, t,
      type === 'charge.dispute.closed' ? t : null, t),
    env.DB.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE stripe_payment_intent_id = ?').bind(payStatus, t, d.payment_intent),
    auditStmt(env, actor.type, actor.email, opened ? 'payment.dispute_open' : 'payment.dispute_close', 'checkout', pay?.checkout_id || d.payment_intent || 'unknown',
      null, { dispute: d.id, status: d.status, reason: d.reason || null }),
  ]);
  await alertOps(env, 'A listing payment is disputed', `Payment ${d.payment_intent}: ${payStatus.replace('_', ' ')}. The listing stays up until you decide.`);
  return payStatus;
}

/** Dispatch one verified event (spec 8.4). Returns a short result for the log. */
export async function handleEvent(env, event, ctx, actor = { type: 'stripe', email: 'webhook' }) {
  const p = provider(env);
  if (!!event.livemode !== p.livemode(env)) return 'ignored: mode mismatch';
  const t = now();
  await env.DB.prepare('INSERT OR IGNORE INTO stripe_events (event_id, type, livemode, received_at) VALUES (?, ?, ?, ?)')
    .bind(event.id, event.type, event.livemode ? 1 : 0, t).run();
  const seen = await env.DB.prepare('SELECT processed_at FROM stripe_events WHERE event_id = ?').bind(event.id).first();
  if (seen?.processed_at) return 'duplicate';

  const obj = event.data?.object || {};
  let result = 'ignored';
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      result = (await fulfillCheckout(env, obj.id, 'webhook', ctx)).status;
      break;
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      const co = await env.DB.prepare('SELECT id FROM checkouts WHERE stripe_session_id = ?').bind(obj.id).first();
      if (co) await releaseCheckout(env, co.id, event.type.endsWith('failed') ? 'failed' : 'expired');
      result = co ? 'released' : 'unknown session';
      break;
    }
    // Plan P3.8. A full refund takes the listings down, whoever started it.
    case 'charge.refunded':
      result = await applyRefund(env, obj, ctx, actor);
      break;
    case 'charge.dispute.created':
    case 'charge.dispute.closed':
      result = await recordDispute(env, event.type, obj, actor);
      break;
    default:
      break;
  }
  await env.DB.prepare('UPDATE stripe_events SET processed_at = ?, result = ? WHERE event_id = ?').bind(now(), result, event.id).run();
  return result;
}

/** Verify Stripe's webhook signature by hand (spec 8.2). Returns the parsed event. */
export async function verifyStripe(request, secret, toleranceSec = 300) {
  const raw = await request.text();
  let t = null;
  const sigs = [];
  for (const item of (request.headers.get('stripe-signature') || '').split(',')) {
    const i = item.indexOf('=');
    const k = item.slice(0, i).trim();
    const v = item.slice(i + 1).trim();
    if (k === 't') t = v;
    else if (k === 'v1') sigs.push(v);
  }
  if (!t || !sigs.length) throw bad('No Stripe signature.');
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) throw bad('Stale Stripe signature.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${raw}`)))]
    .map((x) => x.toString(16).padStart(2, '0')).join('');
  if (!sigs.some((s) => timingSafeEqual(s, mac))) throw bad('Bad Stripe signature.');
  return JSON.parse(raw);
}
