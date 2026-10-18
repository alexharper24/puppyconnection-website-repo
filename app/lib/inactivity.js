// The week-by-week inactivity schedule (launch workplan A2, migrations/0020).
//
// A listing that has had no meaningful update moves one step at a time, each step waiting its
// full week, so a listing never skips a reminder:
//   day 14  reminder, with a one-click Still available link per puppy
//   day 21  second reminder, with fresh links
//   day 28  offline: off the site, and the breeder is told it can come back free
//   day 42  removed from the directory. The record is kept, and its page forwards to the breed page
// Bringing a listing back is free within reactivate_days (42) of going offline. After that it is
// listed again by paying, like a new listing. The days are the inactivity_days setting.
//
// Adopted puppies, puppies on an operator hold and imported Wix listings whose breeder has never
// signed in are left out. The wording of each email is in lib/mail.js.

import { now, randomToken, sha256hex } from './util.js';
import { auditStmt, dirtyStmt } from './store.js';
import { sendMail } from './mail.js';

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

export async function inactivitySettings(env) {
  const { results } = await env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('inactivity_days', 'reactivate_days')").all();
  const s = Object.fromEntries(results.map((r) => [r.key, r.value]));
  const [r1, r2, off, gone] = String(s.inactivity_days || '14,21,28,42').split(',').map(Number);
  return { r1, r2, off, gone, reactivate: Number(s.reactivate_days || 42) };
}

/** Statements that record a meaningful update and clear any reminder in progress. */
export function freshStmt(env, puppyId) {
  return env.DB.prepare(
    `UPDATE puppies SET last_update_at = ?, still_token_hash = NULL,
       inactive_stage = CASE WHEN inactive_stage IN ('reminded_1','reminded_2') THEN NULL ELSE inactive_stage END,
       stage_at = CASE WHEN inactive_stage IN ('reminded_1','reminded_2') THEN NULL ELSE stage_at END
     WHERE id = ?`,
  ).bind(now(), puppyId);
}

/** Whether an offline or removed listing can still come back free, and until when. */
export function reactivation(p, s) {
  if (!p.inactive_at || !['offline', 'removed'].includes(p.inactive_stage)) return null;
  const until = iso(Date.parse(p.inactive_at) + s.reactivate * DAY);
  return { until, free: until > now() };
}

/**
 * Bring an offline or removed listing back. Within the window it goes straight back on the site.
 * After it, it returns to a draft to be paid for again. Returns { relisted, until }.
 */
export async function reactivate(env, p, actor) {
  const s = await inactivitySettings(env);
  const r = reactivation(p, s);
  if (!r) return { relisted: false, error: 'That listing is not offline.' };
  const t = now();
  if (r.free) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE puppies SET publication_state = 'published', inactive_stage = NULL, stage_at = NULL, inactive_at = NULL,
          last_update_at = ?, still_token_hash = NULL, updated_at = ?, version = version + 1 WHERE id = ?`).bind(t, t, p.id),
      auditStmt(env, actor.type, actor.email, 'listing.reactivate', 'puppy', p.id, { stage: p.inactive_stage }, { free: true }),
      dirtyStmt(env),
    ]);
    return { relisted: true };
  }
  await env.DB.batch([
    env.DB.prepare(`UPDATE puppies SET publication_state = 'draft', payment_state = 'unpaid', inactive_stage = NULL, stage_at = NULL,
        inactive_at = NULL, last_update_at = ?, updated_at = ?, version = version + 1 WHERE id = ?`).bind(t, t, p.id),
    auditStmt(env, actor.type, actor.email, 'listing.reactivate', 'puppy', p.id, { stage: p.inactive_stage }, { free: false }),
    dirtyStmt(env),
  ]);
  return { relisted: false, draft: true };
}

/** The Still available link. Returns the puppy it kept listed, or null for a used or unknown link. */
export async function stillAvailable(env, token) {
  if (!token || token.length < 20) return null;
  const hash = await sha256hex(token);
  const p = await env.DB.prepare(
    "SELECT id, name, breeder_id FROM puppies WHERE still_token_hash = ? AND inactive_stage IN ('reminded_1','reminded_2') AND publication_state = 'published'",
  ).bind(hash).first();
  if (!p) return null;
  await env.DB.batch([freshStmt(env, p.id), auditStmt(env, 'breeder', 'still available link', 'listing.still_available', 'puppy', p.id, null, null)]);
  return p;
}

/** The daily job. It moves each listing at most one step a run. */
export async function inactivityJob(env, { portalOrigin = env.PORTAL_ORIGIN || '' } = {}) {
  const s = await inactivitySettings(env);
  const t = Date.now(), at = (days) => iso(t - days * DAY), week = at(7), twoWeeks = at(14);
  // A listing is in the schedule when it is paid for and live or taken offline by the schedule,
  // not adopted, not on hold, and its breeder has signed in at least once.
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.slug, p.breeder_id, p.inactive_stage, p.stage_at, p.publication_state, b.email, b.status AS breeder_status,
            CASE WHEN b.legacy = 1 AND b.first_signin_at > COALESCE(p.last_update_at, p.published_at, p.created_at)
                 THEN b.first_signin_at ELSE COALESCE(p.last_update_at, p.published_at, p.created_at) END AS anchor
       FROM puppies p JOIN breeders b ON b.id = p.breeder_id
      WHERE p.payment_state IN ('paid','comped') AND p.operator_hold = 0 AND p.availability != 'placed'
        AND b.first_signin_at IS NOT NULL AND b.status = 'approved'
        AND (p.publication_state = 'published' OR (p.publication_state = 'expired' AND p.inactive_stage = 'offline'))`,
  ).all();
  const moves = { reminded_1: [], reminded_2: [], offline: [], removed: [] };
  for (const p of results) {
    const stage = p.inactive_stage, since = p.stage_at || '';
    if (stage === 'offline') { if (p.anchor <= at(s.gone) && since <= twoWeeks) moves.removed.push(p); continue; }
    if (p.publication_state !== 'published') continue;
    if (stage === 'reminded_2') { if (p.anchor <= at(s.off) && since <= week) moves.offline.push(p); continue; }
    if (stage === 'reminded_1') { if (p.anchor <= at(s.r2) && since <= week) moves.reminded_2.push(p); continue; }
    if (!stage && p.anchor <= at(s.r1)) moves.reminded_1.push(p);
  }
  const stamp = now();
  const byBreeder = (rows) => rows.reduce((m, r) => ((m[r.breeder_id] ||= { email: r.email, rows: [] }).rows.push(r), m), {});
  for (const step of ['reminded_1', 'reminded_2']) {
    for (const g of Object.values(byBreeder(moves[step]))) {
      const items = [];
      const stmts = [];
      for (const p of g.rows) {
        const token = randomToken();
        items.push({ name: p.name, link: `${portalOrigin}/still-available?t=${token}` });
        stmts.push(env.DB.prepare('UPDATE puppies SET inactive_stage = ?, stage_at = ?, still_token_hash = ? WHERE id = ? AND inactive_stage IS ?')
          .bind(step, stamp, await sha256hex(token), p.id, step === 'reminded_1' ? null : 'reminded_1'));
        stmts.push(auditStmt(env, 'system', 'inactivity', `listing.${step}`, 'puppy', p.id, null, null));
      }
      await env.DB.batch(stmts);
      await sendMail(env, g.email, 'inactive_reminder', { items, second: step === 'reminded_2', offlineInDays: s.off - (step === 'reminded_1' ? s.r1 : s.r2), portalUrl: `${portalOrigin}/#/litters` });
    }
  }
  for (const g of Object.values(byBreeder(moves.offline))) {
    await env.DB.batch([
      ...g.rows.map((p) => env.DB.prepare(`UPDATE puppies SET publication_state = 'expired', inactive_stage = 'offline', stage_at = ?, inactive_at = ?,
          still_token_hash = NULL, updated_at = ?, version = version + 1 WHERE id = ? AND inactive_stage = 'reminded_2'`).bind(stamp, stamp, stamp, p.id)),
      ...g.rows.map((p) => auditStmt(env, 'system', 'inactivity', 'listing.offline', 'puppy', p.id, null, null)),
      dirtyStmt(env),
    ]);
    await sendMail(env, g.email, 'listing_offline', { names: g.rows.map((p) => p.name), freeUntil: iso(t + s.reactivate * DAY).slice(0, 10), portalUrl: `${portalOrigin}/#/litters` });
  }
  for (const g of Object.values(byBreeder(moves.removed))) {
    await env.DB.batch([
      ...g.rows.map((p) => env.DB.prepare("UPDATE puppies SET inactive_stage = 'removed', stage_at = ? WHERE id = ? AND inactive_stage = 'offline'").bind(stamp, p.id)),
      ...g.rows.map((p) => auditStmt(env, 'system', 'inactivity', 'listing.removed', 'puppy', p.id, null, null)),
    ]);
    await sendMail(env, g.email, 'listing_removed', { names: g.rows.map((p) => p.name), portalUrl: `${portalOrigin}/#/litters` });
  }
  return { checked: results.length, reminded_1: moves.reminded_1.length, reminded_2: moves.reminded_2.length, offline: moves.offline.length, removed: moves.removed.length };
}

/** Puppies the schedule took off the site, for the generator's forwards to the breed page. */
export async function gonePuppies(env) {
  return (await env.DB.prepare(
    `SELECT p.slug, p.legacy_slug, br.slug AS breed FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
      WHERE p.inactive_stage IN ('offline','removed') AND p.publication_state = 'expired' ORDER BY p.slug`,
  ).all()).results;
}
