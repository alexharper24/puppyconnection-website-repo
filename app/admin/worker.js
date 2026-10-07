// Amber's operator screens (spec sections 6.4 and 7). Behind Cloudflare Access when deployed,
// and behind DEV_IDENTITY on localhost in the simulation. Everything an operator does to a
// breeder's record keeps that record's breeder_id and is written to the audit log (test 8).

import {
  now, addDays, slugify, clean, cents, HttpError, notFound, bad, json, readJson,
  requireSameOrigin, SECURITY_HEADERS, withHeaders, gate, showTestNotices, ulid,
} from '../lib/util.js';
import {
  loadBreeder, settings, auditStmt, dirtyStmt, checkVersion, littersWithPuppies, photoUrl,
  profileFields, profileStmt, profileBefore, noticeContactChange, breederBreeds, brandUrl, serveBrand,
  litterFields, puppyFields, litterInput, puppyInput, currentTerms, contactChanges,
} from '../lib/store.js';
import { sendMail } from '../lib/mail.js';
import { identify } from './identity.js';
import { buildExport } from '../lib/export.js';
import { runJob, JOBS } from '../lib/jobs.js';
import { provider, handleEvent } from '../lib/payments.js';
import { siteStatus, publishNow } from '../lib/publish.js';
import { csvResponse } from '../lib/csv.js';
import { resetDemo, demoResetAllowed, RESET_PHRASE } from '../lib/demo.js';

/** The scheduled jobs, their last run, and a way to run one now (lib/jobs.js). */
async function listJobs(req, env) {
  const { results } = await env.DB.prepare('SELECT * FROM job_runs').all();
  const by = Object.fromEntries(results.map((r) => [r.job, r]));
  return json(Object.keys(JOBS).map((job) => ({ job, ...(by[job] || {}), last_result: by[job]?.last_result ? JSON.parse(by[job].last_result) : null })));
}
async function runJobNow(req, env, ctx, name, who) {
  requireSameOrigin(req);
  if (!JOBS[name]) throw notFound();
  const r = await runJob(env, name);
  await auditStmt(env, 'operator', who.email, 'job.run', 'job', name, null, r).run();
  return json(r, r.ok ? 200 : 500);
}

async function whoami(req, env, ctx, id, who) {
  return json({ email: who.email, name: who.person.name, role: who.person.role, dev: who.dev,
    payments_mode: env.PAYMENTS_MODE || 'off', email_mode: env.EMAIL_MODE || 'off', portal: env.PORTAL_ORIGIN,
    // Plan P7.3. Staging shows no test-copy notice, but the mailbox link stays while EMAIL_MODE is log.
    notices: showTestNotices(env),
    // Plan P5.1. Reset demo data shows its button only where the server allows it.
    demo_reset: demoResetAllowed(env), demo_phrase: RESET_PHRASE });
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
    // Plan P2.7. Breeders who asked to close their account and have not been followed up yet.
    close_requests: await one('SELECT COUNT(DISTINCT breeder_id) AS n FROM account_requests WHERE withdrawn_at IS NULL AND resolved_at IS NULL'),
  });
}

// ------------------------------------------------------------------ breeders

async function listBreeders(req, env) {
  const status = new URL(req.url).searchParams.get('status');
  const where = status === 'closing' ? 'WHERE b.id IN (SELECT breeder_id FROM account_requests WHERE withdrawn_at IS NULL AND resolved_at IS NULL)'
    : status === 'queue' ? "WHERE b.status = 'pending' AND b.profile_submitted_at IS NOT NULL"
    : status === 'signing_up' ? "WHERE b.status = 'pending' AND b.profile_submitted_at IS NULL"
      : status ? 'WHERE b.status = ?' : '';
  const binds = status && !['queue', 'signing_up', 'closing'].includes(status) ? [status] : [];
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
  // Plan P2.3 and P2.7. The optional profile extras, and an open request to close the account.
  const extras = {
    facebook_url: b.facebook_url || null, breeds: await breederBreeds(env, id),
    logo_url: brandUrl('', id, 'logo', b.logo_key), kennel_url: brandUrl('', id, 'kennel', b.kennel_key),
  };
  const closeRequest = await env.DB.prepare(
    'SELECT id, reason, created_at FROM account_requests WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1',
  ).bind(id).first();
  // Plan P3.2 and P3.4. The private notes, newest first, and which terms version they accepted.
  const terms = await currentTerms(env);
  const breeds = (await env.DB.prepare('SELECT id, name FROM breeds ORDER BY name').all()).results;
  return json({ breeder: b, litters, checkouts, audit, extras, close_request: closeRequest || null, notes: await notesFor(env, id),
    terms: { current: terms.version, accepted: b.terms_version || null }, breeds });
}

// ------------------------------------------------------------------ operator notes (plan P3.2)

// Private to operators. The breeder never sees them, and neither the site export nor a report
// reads this table. The audit row records that a note was added, never what it says.
const notesFor = async (env, breederId) => (await env.DB.prepare(
  'SELECT id, author, body, created_at FROM operator_notes WHERE breeder_id = ? ORDER BY created_at DESC, id DESC',
).bind(breederId).all()).results;

async function addNote(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const text = clean((await readJson(req)).body, 4000);
  if (!text) throw bad('Write the note first.');
  if (!(await env.DB.prepare('SELECT 1 AS x FROM breeders WHERE id = ?').bind(id).first())) throw notFound();
  const noteId = ulid();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO operator_notes (id, breeder_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)').bind(noteId, id, who.email, text, now()),
    auditStmt(env, 'operator', who.email, 'breeder.note', 'breeder', id, null, { note: noteId }),
  ]);
  return json(await notesFor(env, id), 201);
}

/** Mark a breeder's request to close their account as followed up. Nothing is deleted. */
async function resolveClose(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const t = now();
  const r = await env.DB.batch([
    env.DB.prepare('UPDATE account_requests SET resolved_at = ?, resolved_by = ? WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NULL').bind(t, who.email, id),
    auditStmt(env, 'operator', who.email, 'account.close_handled', 'breeder', id, null, null),
  ]);
  if (!r[0].meta.changes) throw notFound();
  return breederDetail(req, env, ctx, id);
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

/**
 * An operator edits a breeder's profile on their behalf. The write is checked exactly as the
 * portal checks it, recorded in the audit as done by the operator, and a change to the public
 * phone, email or website is emailed to the breeder (plan P6.6). P3.1 gives it a screen.
 */
async function editProfile(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const body = await readJson(req);
  const f = profileFields(body);
  const stmts = [
    profileStmt(env, id, f, body.version),
    auditStmt(env, 'operator', who.email, 'profile.update', 'breeder', id, profileBefore(b), f),
  ];
  if (b.status === 'approved') stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'profile');
  noticeContactChange(env, ctx, b, f, 'operator');
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
    ).bind(t, s.listingDays > 0 ? addDays(base, s.listingDays) : null, t, id),
    auditStmt(env, 'operator', who.email, 'puppy.comp', 'puppy', id, { payment_state: p.payment_state, publication_state: p.publication_state },
      { breeder_id: p.breeder_id, days: s.listingDays }),
    dirtyStmt(env),
  ]);
  return json({ ok: true });
}

/**
 * Acting on a breeder's behalf (plan P3.1). The body may carry only the fields that change; the
 * rest come from the stored row, and the whole result passes the same puppyFields() rules the
 * portal uses. The row keeps its breeder_id, and the audit names the operator.
 */
async function editPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  if (p.publication_state === 'archived') throw bad('The breeder removed that puppy.');
  const f = puppyFields({ ...puppyInput(p), ...body });
  const res = await env.DB.batch([
    env.DB.prepare(
      `UPDATE puppies SET name = ?, sex = ?, color = ?, price_cents = ?, deposit_cents = ?, description = ?, breeder_url = ?,
         includes_json = ?, availability = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND version = ?`,
    ).bind(f.name, f.sex, f.color, f.price_cents, f.deposit_cents, f.description, f.breeder_url, f.includes_json, f.availability, now(), id, Number(body.version)),
    auditStmt(env, 'operator', who.email, 'puppy.update', 'puppy', id, { ...puppyInput(p), breeder_id: p.breeder_id }, { ...f, breeder_id: p.breeder_id }),
    dirtyStmt(env),
  ]);
  checkVersion(res[0], 'puppy');
  return json({ ok: true });
}

/** A litter edited on the breeder's behalf (plan P3.1), under the portal's litterFields() rules. */
async function editLitter(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const l = await env.DB.prepare('SELECT * FROM litters WHERE id = ?').bind(id).first();
  if (!l) throw notFound();
  if (l.archived_at) throw bad('The breeder removed that litter.');
  const f = litterFields({ ...litterInput(l), ...body });
  if (!(await env.DB.prepare('SELECT 1 AS x FROM breeds WHERE id = ?').bind(f.breed_id).first())) throw bad('Choose a breed from the list.');
  const stmts = [
    env.DB.prepare(
      `UPDATE litters SET breed_id = ?, born_on = ?, ready_on = ?, mom_weight_lb = ?, dad_weight_lb = ?, description = ?,
         updated_at = ?, version = version + 1 WHERE id = ? AND version = ?`,
    ).bind(f.breed_id, f.born_on, f.ready_on, f.mom_weight_lb, f.dad_weight_lb, f.description, now(), id, Number(body.version)),
    auditStmt(env, 'operator', who.email, 'litter.update', 'litter', id, { ...litterInput(l), breeder_id: l.breeder_id }, { ...f, breeder_id: l.breeder_id }),
  ];
  if (await env.DB.prepare('SELECT 1 AS x FROM public_puppies WHERE litter_id = ? LIMIT 1').bind(id).first()) stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'litter');
  return json({ ok: true });
}

// ------------------------------------------------------------------ money, audit, settings

async function listCheckouts(req, env) {
  const status = new URL(req.url).searchParams.get('status');
  const { results } = await env.DB.prepare(
    `SELECT c.*, bp.business_name,
            (SELECT group_concat(p.name, ', ') FROM checkout_items i JOIN puppies p ON p.id = i.puppy_id WHERE i.checkout_id = c.id) AS puppies,
            (SELECT status FROM payments pay WHERE pay.checkout_id = c.id) AS payment_status,
            (SELECT d.status FROM disputes d WHERE d.checkout_id = c.id ORDER BY d.opened_at DESC LIMIT 1) AS dispute_status,
            (SELECT COUNT(*) FROM disputes d WHERE d.checkout_id = c.id AND d.closed_at IS NULL) AS dispute_open
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
  // 0 means listings stay up until removed (D8), so 0 is allowed.
  listing_days: (v) => /^\d{1,3}$/.test(v),
  warn_days: (v) => /^\d{1,2}$/.test(v),
  suspended_listings_visible: (v) => v === '0' || v === '1',
  min_photos: (v) => /^\d$/.test(v),
  max_photos: (v) => /^\d{1,2}$/.test(v) && Number(v) >= 1,
  // terms_version is no longer typed in here. Publishing on the Terms screen sets it (plan P3.4).
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

// ------------------------------------------------------------------ breeds (plan P3.3)

async function listBreedsAdmin(req, env) {
  const { results } = await env.DB.prepare(
    `SELECT b.id, b.slug, b.name, b.guide, b.guide_updated_at,
            (SELECT COUNT(*) FROM public_puppies pp JOIN litters l ON l.id = pp.litter_id WHERE l.breed_id = b.id) AS live,
            (SELECT COUNT(*) FROM puppies p JOIN litters l ON l.id = p.litter_id WHERE l.breed_id = b.id AND p.publication_state != 'archived') AS puppies,
            (SELECT COUNT(*) FROM breeder_breeds bb WHERE bb.breed_id = b.id) AS breeders
       FROM breeds b ORDER BY b.name`,
  ).all();
  return json(results);
}

async function breedClash(env, name, slug, exceptId) {
  const r = await env.DB.prepare('SELECT name, slug FROM breeds WHERE (lower(name) = lower(?) OR slug = ?) AND id != ?').bind(name, slug || '', exceptId || '').first();
  if (!r) return null;
  return r.name.toLowerCase() === name.toLowerCase() ? `There is already a breed called ${r.name}.` : `The address ${slug} is already used by ${r.name}.`;
}

/** Add a breed. Its slug is the address of its page on the site, so it must be unique. */
async function addBreed(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const name = clean(body.name, 60);
  if (!name) throw bad('Give the breed a name.');
  const slug = slugify(body.slug || name);
  if (!slug) throw bad('The breed needs a web address made of letters and numbers.');
  const clash = await breedClash(env, name, slug, null);
  if (clash) throw bad(clash);
  let newId = `breed-${slug}`;
  if (await env.DB.prepare('SELECT 1 AS x FROM breeds WHERE id = ?').bind(newId).first()) newId = `breed-${slug}-${ulid().slice(-6).toLowerCase()}`;
  const guide = clean(body.guide, 20000);
  const t = now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO breeds (id, slug, name, guide, guide_updated_at) VALUES (?, ?, ?, ?, ?)').bind(newId, slug, name, guide, guide ? t : null),
    auditStmt(env, 'operator', who.email, 'breed.add', 'breed', newId, null, { name, slug, guide_chars: guide ? guide.length : 0 }),
  ]);
  return json({ id: newId, slug, name }, 201);
}

/**
 * Rename a breed or edit its guide text. The slug stays as it was, because it is the address
 * of the breed's page and changing it would break links to it.
 */
async function editBreed(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const b = await env.DB.prepare('SELECT * FROM breeds WHERE id = ?').bind(id).first();
  if (!b) throw notFound();
  const name = body.name === undefined ? b.name : clean(body.name, 60);
  if (!name) throw bad('Give the breed a name.');
  const clash = name.toLowerCase() !== b.name.toLowerCase() ? await breedClash(env, name, null, id) : null;
  if (clash) throw bad(clash);
  const guide = body.guide === undefined ? b.guide : clean(body.guide, 20000);
  const t = now();
  const guideChanged = (guide || null) !== (b.guide || null);
  await env.DB.batch([
    env.DB.prepare('UPDATE breeds SET name = ?, guide = ?, guide_updated_at = ? WHERE id = ?').bind(name, guide, guideChanged ? t : b.guide_updated_at, id),
    auditStmt(env, 'operator', who.email, 'breed.update', 'breed', id, { name: b.name, guide_chars: (b.guide || '').length }, { name, guide_chars: (guide || '').length }),
    dirtyStmt(env),
  ]);
  return json({ ok: true });
}

// ------------------------------------------------------------------ listing terms (plan P3.4)

async function termsState(req, env) {
  const current = await currentTerms(env);
  const draft = await env.DB.prepare("SELECT body, updated_at, updated_by FROM terms_versions WHERE version = 'draft'").first();
  const { results: versions } = await env.DB.prepare(
    "SELECT version, published_at, published_by, length(body) AS chars FROM terms_versions WHERE version != 'draft' ORDER BY published_at DESC",
  ).all();
  const counts = await env.DB.prepare(
    `SELECT SUM(CASE WHEN terms_version = ? THEN 1 ELSE 0 END) AS accepted, SUM(CASE WHEN terms_version = ? THEN 0 ELSE 1 END) AS waiting
       FROM breeders WHERE profile_submitted_at IS NOT NULL AND status != 'declined' AND legacy = 0`,
  ).bind(current.version, current.version).first();
  return json({ current, draft: draft || { body: current.body, updated_at: null, updated_by: null }, versions,
    accepted: counts.accepted || 0, waiting: counts.waiting || 0 });
}

async function saveTermsDraft(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = String((await readJson(req)).body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 60000);
  if (!body) throw bad('The terms cannot be empty.');
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO terms_versions (version, body, updated_at, updated_by) VALUES ('draft', ?, ?, ?)
       ON CONFLICT (version) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(body, t, who.email),
    auditStmt(env, 'operator', who.email, 'terms.draft', 'terms', 'draft', null, { chars: body.length }),
  ]);
  return termsState(req, env);
}

/**
 * Publish the draft as a new version. It becomes the version every new sign-up accepts, and
 * every breeder who accepted an older one is asked to accept it on their next visit.
 */
async function publishTerms(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const draft = await env.DB.prepare("SELECT body FROM terms_versions WHERE version = 'draft'").first();
  if (!draft || !draft.body.trim()) throw bad('Write the terms and save the draft first.');
  const current = await currentTerms(env);
  if (draft.body === current.body) throw bad('The draft is the same as the terms already published.');
  const t = now();
  const base = t.slice(0, 10);
  let version = base;
  for (let i = 2; await env.DB.prepare('SELECT 1 AS x FROM terms_versions WHERE version = ?').bind(version).first(); i += 1) version = `${base}-${i}`;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO terms_versions (version, body, updated_at, updated_by, published_at, published_by) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(version, draft.body, t, who.email, t, who.email),
    env.DB.prepare("UPDATE settings SET value = ? WHERE key = 'terms_version'").bind(version),
    auditStmt(env, 'operator', who.email, 'terms.publish', 'terms', version, { version: current.version }, { version, chars: draft.body.length }),
  ]);
  return termsState(req, env);
}

// ------------------------------------------------------------------ publish (plan P3.5)

async function siteScreen(req, env) {
  const { results: recent } = await env.DB.prepare(
    "SELECT at, actor, action, after_json FROM audit_log WHERE action IN ('site.publish', 'site.publish_failed') ORDER BY id DESC LIMIT 10",
  ).all();
  return json({ ...(await siteStatus(env)), recent: recent.map((r) => ({ at: r.at, actor: r.actor, ok: r.action === 'site.publish', detail: r.after_json ? JSON.parse(r.after_json) : null })) });
}

async function publishSite(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const r = await publishNow(env, { type: 'operator', email: who.email });
  return json({ ...r, site: await siteStatus(env) }, r.ok ? 200 : r.off ? 503 : 502);
}

// ------------------------------------------------------------------ email log (plan P3.6)

const EMAIL_LOG_MAX = 1000;

/** The newest sends, searched on the server when q is given, so older mail can still be found. */
async function emailLog(req, env) {
  const q = clean(new URL(req.url).searchParams.get('q'), 200);
  const where = q ? 'WHERE to_addr LIKE ? OR template LIKE ? OR status LIKE ?' : '';
  const like = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];
  const { results } = await env.DB.prepare(`SELECT id, to_addr, template, sent_at, provider_id, status FROM email_log ${where} ORDER BY id DESC LIMIT ${EMAIL_LOG_MAX}`).bind(...like).all();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM email_log ${where}`).bind(...like).first();
  return json({ rows: results, total: total.n, limit: EMAIL_LOG_MAX });
}

// ------------------------------------------------------------------ reports (plan P3.7)

async function reportData(env) {
  const paid = (await env.DB.prepare(
    `SELECT substr(c.paid_at, 1, 7) AS month, SUM(c.quantity) AS paid_listings, SUM(c.amount_total_cents) AS revenue_cents,
            SUM(CASE WHEN pay.status = 'refunded' THEN pay.amount_cents ELSE 0 END) AS refunded_cents
       FROM checkouts c LEFT JOIN payments pay ON pay.checkout_id = c.id
      WHERE c.status = 'paid' AND c.paid_at IS NOT NULL GROUP BY 1`,
  ).all()).results;
  const comped = (await env.DB.prepare(
    "SELECT substr(published_at, 1, 7) AS month, COUNT(*) AS comped FROM puppies WHERE payment_state = 'comped' AND published_at IS NOT NULL GROUP BY 1",
  ).all()).results;
  const byMonth = {};
  for (const r of paid) byMonth[r.month] = { month: r.month, paid_listings: r.paid_listings, comped_listings: 0, revenue_cents: r.revenue_cents, refunded_cents: r.refunded_cents };
  for (const r of comped) (byMonth[r.month] ||= { month: r.month, paid_listings: 0, comped_listings: 0, revenue_cents: 0, refunded_cents: 0 }).comped_listings = r.comped;
  const months = Object.values(byMonth).sort((a, b) => (a.month < b.month ? 1 : -1));

  const breeds = (await env.DB.prepare(
    `SELECT br.name AS breed,
            SUM(CASE WHEN p.id IN (SELECT id FROM public_puppies) THEN 1 ELSE 0 END) AS live,
            SUM(CASE WHEN p.availability = 'placed' THEN 1 ELSE 0 END) AS placed,
            SUM(CASE WHEN p.publication_state = 'draft' THEN 1 ELSE 0 END) AS draft
       FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
      WHERE p.publication_state != 'archived' GROUP BY br.id ORDER BY live DESC, br.name`,
  ).all()).results;
  const one = (sql) => env.DB.prepare(sql).first().then((r) => r.n);
  const summary = {
    live: await one('SELECT COUNT(*) AS n FROM public_puppies'),
    placed: await one("SELECT COUNT(*) AS n FROM puppies WHERE availability = 'placed' AND publication_state != 'archived'"),
    draft: await one("SELECT COUNT(*) AS n FROM puppies WHERE publication_state = 'draft'"),
    held: await one('SELECT COUNT(*) AS n FROM puppies WHERE operator_hold = 1'),
    approved_breeders: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'approved'"),
  };
  const since = addDays(now(), -30).slice(0, 10);
  const views = (await env.DB.prepare(
    `SELECT p.id, p.name, br.name AS breed, bp.business_name,
            SUM(s.views) AS views, SUM(s.clicks) AS clicks,
            SUM(CASE WHEN s.day >= ? THEN s.views ELSE 0 END) AS views_30, SUM(CASE WHEN s.day >= ? THEN s.clicks ELSE 0 END) AS clicks_30,
            p.id IN (SELECT id FROM public_puppies) AS is_public
       FROM puppy_stats s JOIN puppies p ON p.id = s.puppy_id JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
       JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id
      GROUP BY p.id ORDER BY views DESC, clicks DESC LIMIT 25`,
  ).bind(since, since).all()).results;
  return { months, breeds, summary, views };
}

async function reports(req, env) {
  return json(await reportData(env));
}

const dollars = (c) => (c == null ? null : (c / 100).toFixed(2));
const REPORT_CSV = {
  months: (d) => [['Month', 'Paid listings', 'Comped listings', 'Revenue (USD)', 'Refunded (USD)', 'Net (USD)'],
    d.months.map((m) => [m.month, m.paid_listings, m.comped_listings, dollars(m.revenue_cents), dollars(m.refunded_cents), dollars(m.revenue_cents - m.refunded_cents)])],
  breeds: (d) => [['Breed', 'Live on the site', 'Marked placed', 'Drafts'], d.breeds.map((b) => [b.breed, b.live, b.placed, b.draft])],
  summary: (d) => [['Measure', 'Count'], [['Live on the site', d.summary.live], ['Marked placed', d.summary.placed], ['Drafts', d.summary.draft],
    ['On hold', d.summary.held], ['Approved breeders', d.summary.approved_breeders]]],
  views: (d) => [['Puppy', 'Breed', 'Breeder', 'Views', 'Clicks', 'Views, last 30 days', 'Clicks, last 30 days', 'Live'],
    d.views.map((v) => [v.name, v.breed, v.business_name, v.views, v.clicks, v.views_30, v.clicks_30, v.is_public ? 'yes' : 'no'])],
};

async function reportCsv(req, env, ctx, name) {
  const make = REPORT_CSV[name];
  if (!make) throw notFound();
  const [header, rows] = make(await reportData(env));
  return csvResponse(`puppy-connection-${name}-${now().slice(0, 10)}.csv`, header, rows);
}

// ------------------------------------------------------------------ refunds and disputes (plan P3.8)

async function paymentFor(env, checkoutId) {
  const co = await env.DB.prepare('SELECT * FROM checkouts WHERE id = ?').bind(checkoutId).first();
  if (!co) throw notFound();
  const pay = await env.DB.prepare('SELECT * FROM payments WHERE checkout_id = ?').bind(checkoutId).first();
  if (!pay) throw bad('This checkout has no payment.');
  return { co, pay };
}

// Only the practice provider is driven from here for now. The Stripe provider's refund() is
// written to the same interface, and Stripe's own charge.refunded and dispute events already
// take the same path through handleEvent. P4.5 proves it in test mode and lifts this check.
function practiceOnly(env) {
  const p = provider(env);
  if (p.name !== 'sim') throw new HttpError(503, 'Refunds and disputes are handled in the Stripe Dashboard until the Stripe provider is proven. Its refund and dispute events still take listings down and show here.');
  return p;
}

/** Refund a whole listing payment. The puppies it paid for come off the site, and the breeder is emailed. */
async function refundCheckout(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const reason = clean((await readJson(req)).reason, 500);
  if (!reason) throw bad('Add a private reason, for the record.');
  const p = practiceOnly(env);
  const { pay } = await paymentFor(env, id);
  if (pay.status === 'refunded') throw bad('This payment was already refunded.');
  const event = await p.refund(env, pay.stripe_payment_intent_id);
  const result = event ? await handleEvent(env, event, ctx, { type: 'operator', email: who.email, reason }) : 'sent to the payment provider';
  return json({ ok: true, result });
}

/** Record a practice dispute opening, or closing as won or lost. Listings are not changed. */
async function disputeCheckout(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const action = String(body.action || '');
  if (!['open', 'won', 'lost'].includes(action)) throw bad('A dispute is opened, won or lost.');
  const p = practiceOnly(env);
  const { pay } = await paymentFor(env, id);
  const event = await p.dispute(env, pay.stripe_payment_intent_id, action, clean(body.reason, 200));
  const result = await handleEvent(env, event, ctx, { type: 'operator', email: who.email });
  return json({ ok: true, result });
}

// ------------------------------------------------------------------ needs attention (plan P3.9)

async function attention(req, env) {
  const one = (sql, ...b) => env.DB.prepare(sql).bind(...b).first().then((r) => r.n);
  const site = await siteStatus(env);
  const { results: failedJobs } = await env.DB.prepare('SELECT job, last_run_at, last_error FROM job_runs WHERE last_error IS NOT NULL').all();
  // Public contact details changed in the last week, after the breeder first submitted their
  // profile (before that nothing is public, so every sign-up would show here).
  const { results: rows } = await env.DB.prepare(
    `SELECT a.at, a.actor_type, a.action, a.entity_id, a.before_json, a.after_json, bp.business_name, b.email
       FROM audit_log a JOIN breeders b ON b.id = a.entity_id LEFT JOIN breeder_profiles bp ON bp.breeder_id = b.id
      WHERE a.entity = 'breeder' AND a.action IN ('profile.update', 'profile.extras') AND a.at > ?
        AND b.profile_submitted_at IS NOT NULL AND a.at > b.profile_submitted_at ORDER BY a.id DESC`,
  ).bind(addDays(now(), -7)).all();
  const contact = {};
  for (const r of rows) {
    const before = JSON.parse(r.before_json || '{}'), after = JSON.parse(r.after_json || '{}');
    const labels = r.action === 'profile.extras'
      ? ((before.facebook_url || null) !== (after.facebook_url || null) ? ['Facebook page'] : [])
      : contactChanges(before, after).map((c) => c.label);
    if (!labels.length) continue;
    const c = (contact[r.entity_id] ||= { breeder_id: r.entity_id, business_name: r.business_name || r.email, at: r.at, fields: [], by: [] });
    for (const l of labels) if (!c.fields.includes(l)) c.fields.push(l);
    if (!c.by.includes(r.actor_type)) c.by.push(r.actor_type);
  }
  return json({
    queue: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NOT NULL"),
    needs_review: await one("SELECT COUNT(*) AS n FROM checkouts WHERE status = 'needs_review'"),
    open_disputes: await one('SELECT COUNT(*) AS n FROM disputes WHERE closed_at IS NULL'),
    publish_error: site.last_error ? { error: site.last_error, at: site.last_error_at } : null,
    failed_jobs: failedJobs,
    close_requests: await one('SELECT COUNT(DISTINCT breeder_id) AS n FROM account_requests WHERE withdrawn_at IS NULL AND resolved_at IS NULL'),
    contact_changes: Object.values(contact),
    held: await one('SELECT COUNT(*) AS n FROM puppies WHERE operator_hold = 1'),
    unpublished_changes: site.waiting,
    // The breeder link check (lib/jobs.js, links): live links that fail or now land on a home page.
    broken_links: (await env.DB.prepare(
      `SELECT lc.url, lc.verdict, lc.failing_since, p.name AS puppy, bp.business_name, p.breeder_id
         FROM link_checks lc JOIN public_puppies p ON p.breeder_url = lc.url
         LEFT JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id WHERE lc.verdict <> 'ok'
       UNION ALL
       SELECT lc.url, lc.verdict, lc.failing_since, NULL, pb.business_name, pb.breeder_id
         FROM link_checks lc JOIN public_breeders pb ON pb.website_url = lc.url WHERE lc.verdict <> 'ok'
       ORDER BY failing_since`,
    ).all()).results,
  });
}

async function media(req, env, ctx, id, card) {
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo?.r2_key) throw notFound();
  // The small card copy the portal makes at upload, or the full photo when there is none.
  const obj = (card && await env.FILES.get(`${photo.r2_key}.card`)) || await env.FILES.get(photo.r2_key);
  if (!obj) throw notFound();
  return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || photo.content_type || 'application/octet-stream', 'cache-control': 'private, no-store' } });
}

/** A breeder's logo or kennel photo. Operators see them whether or not the breeder is public. */
async function brand(req, env, id, kind) {
  const res = await serveBrand(env, id, kind, { card: new URL(req.url).searchParams.get('size') === 'card', allowPrivate: async () => true });
  if (!res) throw notFound();
  res.headers.set('cache-control', 'private, no-store');
  return res;
}

/** Every test email, for the operator. Only in a test mode, behind the admin's own gate. */
// Plan P5.1. Staging only, after a backup, with the phrase typed (lib/demo.js).
async function demoReset(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  return json(await resetDemo(env, who.email, body.confirm));
}

async function devMail(req, env) {
  if (env.EMAIL_MODE !== 'log' || !['local', 'hosted-test', 'hosted-access', 'staging'].includes(env.DEV_MODE)) throw notFound();
  const { results } = await env.DB.prepare('SELECT * FROM dev_mailbox ORDER BY id DESC LIMIT 60').all();
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rows = results.map((m) => `<article class="mail"><header><b>${e(m.subject)}</b><span>${e(m.to_addr)} at ${e(m.sent_at)}</span></header><pre>${e(m.body)}</pre></article>`).join('');
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All test mail | Puppy Connection</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/portal.css?v=8"></head>
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
  ['PUT', /^\/api\/breeders\/([\w-]+)\/profile$/, editProfile],
  ['POST', /^\/api\/breeders\/([\w-]+)\/notes$/, addNote],
  ['POST', /^\/api\/breeders\/([\w-]+)\/close-request\/resolve$/, resolveClose],
  ['GET', /^\/brand\/([\w-]+)\/logo$/, (r, e, c, id) => brand(r, e, id, 'logo')],
  ['GET', /^\/brand\/([\w-]+)\/kennel$/, (r, e, c, id) => brand(r, e, id, 'kennel')],
  ['GET', /^\/api\/listings$/, listListings],
  ['POST', /^\/api\/puppies\/([\w-]+)\/hold$/, holdPuppy],
  ['POST', /^\/api\/puppies\/([\w-]+)\/comp$/, compPuppy],
  ['PUT', /^\/api\/puppies\/([\w-]+)$/, editPuppy],
  ['PUT', /^\/api\/litters\/([\w-]+)$/, editLitter],
  ['GET', /^\/api\/breeds$/, listBreedsAdmin],
  ['POST', /^\/api\/breeds$/, addBreed],
  ['PUT', /^\/api\/breeds\/([\w-]+)$/, editBreed],
  ['GET', /^\/api\/terms$/, termsState],
  ['PUT', /^\/api\/terms\/draft$/, saveTermsDraft],
  ['POST', /^\/api\/terms\/publish$/, publishTerms],
  ['GET', /^\/api\/site$/, siteScreen],
  ['POST', /^\/api\/site\/publish$/, publishSite],
  ['GET', /^\/api\/email-log$/, emailLog],
  ['GET', /^\/api\/reports$/, reports],
  ['GET', /^\/api\/reports\/(months|breeds|summary|views)\.csv$/, reportCsv],
  ['POST', /^\/api\/checkouts\/([\w-]+)\/refund$/, refundCheckout],
  ['POST', /^\/api\/checkouts\/([\w-]+)\/dispute$/, disputeCheckout],
  ['GET', /^\/api\/attention$/, attention],
  ['GET', /^\/api\/checkouts$/, listCheckouts],
  ['GET', /^\/api\/audit$/, auditList],
  ['GET', /^\/api\/settings$/, getSettings],
  ['GET', /^\/api\/jobs$/, listJobs],
  ['POST', /^\/api\/jobs\/(\w+)\/run$/, runJobNow],
  ['POST', /^\/api\/demo\/reset$/, demoReset],
  ['PUT', /^\/api\/settings$/, putSettings],
  ['GET', /^\/api\/export$/, exportData],
  ['POST', /^\/api\/site\/published$/, markPublished],
  ['GET', /^\/media\/([\w-]+)$/, media],
  ['GET', /^\/media\/([\w-]+)\/card$/, (r, e, c, id, who) => media(r, e, c, id, true)],
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
