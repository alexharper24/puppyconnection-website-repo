// Amber's operator screens (spec sections 6.4 and 7). Behind Cloudflare Access when deployed,
// and behind DEV_IDENTITY on localhost in the simulation. Everything an operator does to a
// breeder's record keeps that record's breeder_id and is written to the audit log (test 8).

import {
  now, addDays, slugify, clean, cents, HttpError, notFound, bad, json, readJson,
  requireSameOrigin, SECURITY_HEADERS, withHeaders, gate,
} from '../lib/util.js';
import { loadBreeder, settings, auditStmt, dirtyStmt, checkVersion, littersWithPuppies, photoUrl } from '../lib/store.js';
import { sendMail } from '../lib/mail.js';
import { identify } from './identity.js';
import { buildExport } from '../lib/export.js';

async function whoami(req, env, ctx, id, who) {
  return json({ email: who.email, name: who.person.name, role: who.person.role, dev: who.dev,
    payments_mode: env.PAYMENTS_MODE || 'off', email_mode: env.EMAIL_MODE || 'off', portal: env.PORTAL_ORIGIN });
}

async function stats(req, env) {
  const one = (sql, ...b) => env.DB.prepare(sql).bind(...b).first().then((r) => r.n);
  const t = now();
  const site = await env.DB.prepare('SELECT * FROM site_state WHERE id = 1').first();
  return json({
    queue: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NOT NULL"),
    signing_up: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NULL"),
    approved: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'approved'"),
    suspended: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'suspended'"),
    declined: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'declined'"),
    public_puppies: await one('SELECT COUNT(*) AS n FROM public_puppies'),
    drafts: await one("SELECT COUNT(*) AS n FROM puppies WHERE publication_state = 'draft'"),
    held: await one('SELECT COUNT(*) AS n FROM puppies WHERE operator_hold = 1'),
    open_checkouts: await one("SELECT COUNT(*) AS n FROM checkouts WHERE status = 'open' AND expires_at > ?", t),
    needs_review: await one("SELECT COUNT(*) AS n FROM checkouts WHERE status = 'needs_review'"),
    unpublished_changes: site.generation - site.published_generation,
  });
}

// ------------------------------------------------------------------ breeders

async function listBreeders(req, env) {
  const status = new URL(req.url).searchParams.get('status');
  const where = status === 'queue' ? "WHERE b.status = 'pending' AND b.profile_submitted_at IS NOT NULL"
    : status === 'signing_up' ? "WHERE b.status = 'pending' AND b.profile_submitted_at IS NULL"
      : status ? 'WHERE b.status = ?' : '';
  const binds = status && !['queue', 'signing_up'].includes(status) ? [status] : [];
  const { results } = await env.DB.prepare(
    `SELECT b.id, b.email, b.status, b.created_at, b.profile_submitted_at, b.decided_at, b.legacy,
            p.business_name, p.city, p.state, p.slug,
            (SELECT COUNT(*) FROM puppies x WHERE x.breeder_id = b.id AND x.publication_state != 'archived') AS puppies,
            (SELECT COUNT(*) FROM public_puppies x WHERE x.breeder_id = b.id) AS public_puppies
       FROM breeders b LEFT JOIN breeder_profiles p ON p.breeder_id = b.id ${where}
      ORDER BY b.profile_submitted_at IS NULL, b.profile_submitted_at, b.created_at DESC`,
  ).bind(...binds).all();
  return json(results);
}

async function breederDetail(req, env, ctx, id) {
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const litters = await littersWithPuppies(env, id);
  const pub = new Set((await env.DB.prepare('SELECT id FROM public_puppies WHERE breeder_id = ?').bind(id).all()).results.map((r) => r.id));
  for (const l of litters) for (const p of l.puppies) {
    p.photos = p.photos.map((ph) => ({ id: ph.id, url: photoUrl(ph) }));
    p.is_public = pub.has(p.id);
  }
  const checkouts = (await env.DB.prepare('SELECT * FROM checkouts WHERE breeder_id = ? ORDER BY created_at DESC LIMIT 50').bind(id).all()).results;
  const audit = (await env.DB.prepare(
    `SELECT at, actor_type, actor, action, entity, entity_id FROM audit_log
      WHERE (entity = 'breeder' AND entity_id = ?)
         OR entity_id IN (SELECT id FROM puppies WHERE breeder_id = ?)
         OR entity_id IN (SELECT id FROM litters WHERE breeder_id = ?)
         OR entity_id IN (SELECT id FROM checkouts WHERE breeder_id = ?)
      ORDER BY id DESC LIMIT 60`,
  ).bind(id, id, id, id).all()).results;
  return json({ breeder: b, litters, checkouts, audit });
}

async function uniqueSlug(env, name, breederId) {
  const base = slugify(name) || 'breeder';
  for (let i = 0; i < 50; i += 1) {
    const s = i ? `${base}-${i + 1}` : base;
    const taken = await env.DB.prepare('SELECT breeder_id FROM breeder_profiles WHERE slug = ? AND breeder_id != ?').bind(s, breederId).first();
    if (!taken) return s;
  }
  throw bad('Could not make a unique address for this breeder.');
}

async function decide(req, env, ctx, id, who, action) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const t = now();
  const rules = {
    approve: { from: ['pending'], to: 'approved', mail: 'approved' },
    decline: { from: ['pending'], to: 'declined', mail: 'declined' },
    suspend: { from: ['approved'], to: 'suspended', mail: 'suspended' },
    reinstate: { from: ['suspended'], to: 'approved', mail: 'reinstated' },
    reopen: { from: ['declined'], to: 'pending', mail: null },
  }[action];
  if (!rules.from.includes(b.status)) throw bad(`A ${b.status} breeder cannot be ${action}d.`);
  if (action === 'approve' && !b.profile_submitted_at) throw bad('This breeder has not submitted their profile yet.');
  const reason = clean(body.reason, 1000);
  if ((action === 'decline' || action === 'suspend') && !reason) throw bad('Add a private reason, for the record.');

  const stmts = [
    env.DB.prepare(
      `UPDATE breeders SET status = ?, decided_at = ?, decided_by = ?, status_reason = ?, updated_at = ?, version = version + 1
         ${action === 'reopen' ? ', profile_submitted_at = NULL' : ''}
       WHERE id = ? AND status = ?`,
    ).bind(rules.to, t, who.email, reason, t, id, b.status),
    auditStmt(env, 'operator', who.email, `breeder.${action}`, 'breeder', id, { status: b.status }, { status: rules.to, reason }),
  ];
  if (action === 'approve' && !b.slug) {
    stmts.push(env.DB.prepare('UPDATE breeder_profiles SET slug = ? WHERE breeder_id = ?').bind(await uniqueSlug(env, b.business_name, id), id));
  }
  if (action !== 'decline' && action !== 'reopen') stmts.push(dirtyStmt(env));
  const res = await env.DB.batch(stmts);
  checkVersion(res[0], 'breeder');
  if (rules.mail) {
    ctx.waitUntil(sendMail(env, b.email, rules.mail, {
      business: b.business_name, portalUrl: env.PORTAL_ORIGIN || '', message: clean(body.message, 2000),
    }).catch((e) => console.error(e)));
  }
  return breederDetail(req, env, ctx, id);
}

async function changeEmail(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const { email } = await readJson(req);
  const addr = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) throw bad('Enter a valid email address.');
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const t = now();
  try {
    await env.DB.batch([
      env.DB.prepare('UPDATE breeders SET email = ?, updated_at = ? WHERE id = ?').bind(addr, t, id),
      env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND revoked_at IS NULL').bind(t, id),
      auditStmt(env, 'operator', who.email, 'breeder.email', 'breeder', id, { email: b.email }, { email: addr }),
    ]);
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) throw bad('Another account already uses that address.');
    throw e;
  }
  return breederDetail(req, env, ctx, id);
}

// ------------------------------------------------------------------ listings

async function listListings(req, env) {
  const u = new URL(req.url).searchParams;
  const filter = u.get('filter') || 'public';
  const where = {
    public: 'p.id IN (SELECT id FROM public_puppies)',
    drafts: "p.publication_state = 'draft'",
    expired: "p.publication_state = 'expired'",
    held: 'p.operator_hold = 1',
    all: "p.publication_state != 'archived'",
  }[filter];
  if (!where) throw bad('Unknown filter.');
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.name, p.breeder_id, p.price_cents, p.payment_state, p.publication_state, p.availability,
            p.operator_hold, p.expires_at, p.version, br.name AS breed, bp.business_name,
            (SELECT COUNT(*) FROM photos ph WHERE ph.puppy_id = p.id) AS photos,
            (SELECT ph.id FROM photos ph WHERE ph.puppy_id = p.id ORDER BY ph.position LIMIT 1) AS cover_id,
            (SELECT COALESCE(ph.external_url, '') FROM photos ph WHERE ph.puppy_id = p.id ORDER BY ph.position LIMIT 1) AS cover_ext,
            p.id IN (SELECT id FROM public_puppies) AS is_public
       FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
       JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id
      WHERE ${where} ORDER BY p.updated_at DESC LIMIT 400`,
  ).all();
  for (const r of results) r.cover = r.cover_ext ? `${r.cover_ext}/v1/fill/w_120,h_90,al_t,q_80/i.jpg` : r.cover_id ? `/media/${r.cover_id}` : null;
  return json(results);
}

async function holdPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const { on } = await readJson(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  await env.DB.batch([
    env.DB.prepare('UPDATE puppies SET operator_hold = ?, updated_at = ?, version = version + 1 WHERE id = ?').bind(on ? 1 : 0, now(), id),
    auditStmt(env, 'operator', who.email, on ? 'puppy.hold' : 'puppy.release', 'puppy', id, { operator_hold: p.operator_hold }, { operator_hold: on ? 1 : 0, breeder_id: p.breeder_id }),
    dirtyStmt(env),
  ]);
  return json({ ok: true });
}

/** A listing Amber grants without payment, which the Wix migration needs (spec 5). */
async function compPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  if (p.publication_state === 'archived') throw bad('That puppy was removed by the breeder.');
  const s = await settings(env);
  const t = now();
  const base = p.expires_at && p.expires_at > t ? p.expires_at : t;
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE puppies SET payment_state = CASE WHEN payment_state = 'paid' THEN 'paid' ELSE 'comped' END,
         publication_state = 'published', published_at = COALESCE(published_at, ?), expires_at = ?, updated_at = ?, version = version + 1
       WHERE id = ?`,
    ).bind(t, addDays(base, s.listingDays), t, id),
    auditStmt(env, 'operator', who.email, 'puppy.comp', 'puppy', id, { payment_state: p.payment_state, publication_state: p.publication_state },
      { breeder_id: p.breeder_id, days: s.listingDays }),
    dirtyStmt(env),
  ]);
  return json({ ok: true });
}

/** Acting on a breeder's behalf. The row keeps its breeder_id, and the audit names Amber. */
async function editPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  const availability = String(body.availability || p.availability);
  if (!['available', 'pending', 'placed'].includes(availability)) throw bad('Status is available, pending or placed.');
  const name = clean(body.name, 80) || p.name;
  const price = body.price === undefined ? p.price_cents : cents(body.price);
  const res = await env.DB.batch([
    env.DB.prepare('UPDATE puppies SET name = ?, price_cents = ?, availability = ?, updated_at = ?, version = version + 1 WHERE id = ? AND version = ?')
      .bind(name, price, availability, now(), id, Number(body.version)),
    auditStmt(env, 'operator', who.email, 'puppy.update', 'puppy', id,
      { name: p.name, price_cents: p.price_cents, availability: p.availability, breeder_id: p.breeder_id },
      { name, price_cents: price, availability, breeder_id: p.breeder_id }),
    dirtyStmt(env),
  ]);
  checkVersion(res[0], 'puppy');
  return json({ ok: true });
}

// ------------------------------------------------------------------ money, audit, settings

async function listCheckouts(req, env) {
  const status = new URL(req.url).searchParams.get('status');
  const { results } = await env.DB.prepare(
    `SELECT c.*, bp.business_name,
            (SELECT group_concat(p.name, ', ') FROM checkout_items i JOIN puppies p ON p.id = i.puppy_id WHERE i.checkout_id = c.id) AS puppies,
            (SELECT status FROM payments pay WHERE pay.checkout_id = c.id) AS payment_status
       FROM checkouts c JOIN breeder_profiles bp ON bp.breeder_id = c.breeder_id
      ${status ? 'WHERE c.status = ?' : ''} ORDER BY c.created_at DESC LIMIT 200`,
  ).bind(...(status ? [status] : [])).all();
  return json(results);
}

async function auditList(req, env) {
  const { results } = await env.DB.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').all();
  return json(results);
}

async function getSettings(req, env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings ORDER BY key').all();
  return json(results);
}

const EDITABLE = {
  listing_days: (v) => /^\d{1,3}$/.test(v) && Number(v) >= 1,
  warn_days: (v) => /^\d{1,2}$/.test(v),
  suspended_listings_visible: (v) => v === '0' || v === '1',
  min_photos: (v) => /^\d$/.test(v),
  max_photos: (v) => /^\d{1,2}$/.test(v) && Number(v) >= 1,
  terms_version: (v) => /^[\w.-]{1,40}$/.test(v),
};

async function putSettings(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const stmts = [];
  for (const [k, v] of Object.entries(body)) {
    const ok = EDITABLE[k];
    if (!ok) throw bad(`${k} is not editable here.`);
    if (!ok(String(v))) throw bad(`${k} has an invalid value.`);
    stmts.push(env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(String(v), k));
    stmts.push(auditStmt(env, 'operator', who.email, 'settings.update', 'settings', k, null, { value: String(v) }));
  }
  if (!stmts.length) throw bad('Nothing to change.');
  stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return getSettings(req, env);
}

// ------------------------------------------------------------------ export for the site

async function exportData(req, env) {
  return json(await buildExport(env, `${env.PORTAL_ORIGIN || ''}/media`));
}

async function markPublished(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const { generation } = await readJson(req);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE site_state SET published_generation = ?, last_publish_at = ?, last_publish_sha = 'local-preview',
         dirty = CASE WHEN generation = ? THEN 0 ELSE 1 END, dirty_since = CASE WHEN generation = ? THEN NULL ELSE dirty_since END
       WHERE id = 1`,
    ).bind(Number(generation), now(), Number(generation), Number(generation)),
    auditStmt(env, 'operator', who.email, 'site.publish', 'site', 'preview', null, { generation }),
  ]);
  return json({ ok: true });
}

async function media(req, env, ctx, id) {
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo?.r2_key) throw notFound();
  const obj = await env.FILES.get(photo.r2_key);
  if (!obj) throw notFound();
  return new Response(obj.body, { headers: { 'content-type': photo.content_type || 'application/octet-stream', 'cache-control': 'private, no-store' } });
}

/** Every test email, for the operator. Only in a test mode, behind the admin's own gate. */
async function devMail(req, env) {
  if (env.EMAIL_MODE !== 'log' || !['local', 'hosted-test'].includes(env.DEV_MODE)) throw notFound();
  const { results } = await env.DB.prepare('SELECT * FROM dev_mailbox ORDER BY id DESC LIMIT 60').all();
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rows = results.map((m) => `<article class="mail"><header><b>${e(m.subject)}</b><span>${e(m.to_addr)} at ${e(m.sent_at)}</span></header><pre>${e(m.body)}</pre></article>`).join('');
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All test mail | Puppy Connection</title><link rel="stylesheet" href="/portal.css"></head>
<body class="plain"><main class="plain-card"><p class="sim-flag">Every test email, newest first. Nothing is really sent.</p><h1>All test mail</h1>${rows || '<p>No mail yet.</p>'}<p><a href="/">Back to the admin</a></p></main></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

const ROUTES = [
  ['GET', /^\/dev\/mail$/, devMail],
  ['GET', /^\/api\/whoami$/, whoami],
  ['GET', /^\/api\/stats$/, stats],
  ['GET', /^\/api\/breeders$/, listBreeders],
  ['GET', /^\/api\/breeders\/([\w-]+)$/, breederDetail],
  ['POST', /^\/api\/breeders\/([\w-]+)\/(approve|decline|suspend|reinstate|reopen)$/, null],
  ['PUT', /^\/api\/breeders\/([\w-]+)\/email$/, changeEmail],
  ['GET', /^\/api\/listings$/, listListings],
  ['POST', /^\/api\/puppies\/([\w-]+)\/hold$/, holdPuppy],
  ['POST', /^\/api\/puppies\/([\w-]+)\/comp$/, compPuppy],
  ['PUT', /^\/api\/puppies\/([\w-]+)$/, editPuppy],
  ['GET', /^\/api\/checkouts$/, listCheckouts],
  ['GET', /^\/api\/audit$/, auditList],
  ['GET', /^\/api\/settings$/, getSettings],
  ['PUT', /^\/api\/settings$/, putSettings],
  ['GET', /^\/api\/export$/, exportData],
  ['POST', /^\/api\/site\/published$/, markPublished],
  ['GET', /^\/media\/([\w-]+)$/, media],
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const locked = gate(request, env);
    if (locked) return locked;
    try {
      const who = await identify(request, env, ctx);
      if (!who.ok) {
        const wantsHtml = (request.headers.get('accept') || '').includes('text/html');
        if (wantsHtml) {
          return new Response(`<!doctype html><meta charset="utf-8"><title>Not signed in</title><p style="font:16px system-ui;margin:3rem">${who.reason}</p>`,
            { status: who.status, headers: { 'content-type': 'text/html; charset=utf-8', ...SECURITY_HEADERS } });
        }
        return json({ error: who.reason }, who.status);
      }
      for (const [method, rx, fn] of ROUTES) {
        const m = url.pathname.match(rx);
        if (!m || request.method !== method) continue;
        const res = fn ? await fn(request, env, ctx, m[1], who) : await decide(request, env, ctx, m[1], who, m[2]);
        return withHeaders(res, SECURITY_HEADERS);
      }
      if (url.pathname.startsWith('/api/')) throw notFound();
      const asset = await env.ASSETS.fetch(new Request(new URL(url.pathname === '/' ? '/index.html' : url.pathname, url), request));
      return withHeaders(asset, SECURITY_HEADERS);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, ...(e.extra || {}) }, e.status);
      console.error(e);
      return json({ error: 'Something went wrong.' }, 500);
    }
  },
};
