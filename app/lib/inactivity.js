// The photo-based listing schedule (launch workplan A12, migrations/0030), which replaced the
// week-by-week schedule of A2 on Amber's rule of 2026-10-19: a listing stays up with no end date
// while the breeder keeps its photos current, meaning a new photo at least every four weeks.
//
// The clock is last_photo_at, the newest photo that passed the photo check. Nothing else resets
// it, not a price change and not a breeder saying the puppy is still available. A listing with
// no new photo moves one step at a time, each step waiting its full week, so no email is skipped:
//   week 4   email: it goes offline in two weeks unless a new photo is added
//   week 5   email: it goes offline next week
//   week 6   offline: off the site. A new photo brings it straight back, free
//   week 12  removed: off the site and out of the free window. It stays in the breeder's
//            dashboard, where it relists through the normal checkout without being entered again
// The weeks are the inactivity_days setting, in days. No clock runs before photo_clock_start, the
// go-live date (migrations/0033). Stage names stay reminded_1 and reminded_2
// for the two warnings, because the column's CHECK constraint is from migration 0020.
//
// Adopted puppies, puppies on an operator hold and imported Wix listings whose breeder has never
// signed in are left out. The wording of each email is in lib/mail.js.

import { now } from './util.js';
import { auditStmt, dirtyStmt, settings } from './store.js';
import { sendMail } from './mail.js';

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

export async function inactivitySettings(env) {
  const { results } = await env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('inactivity_days', 'photo_clock_start')").all();
  const v = Object.fromEntries(results.map((r) => [r.key, r.value]));
  const [r1, r2, off, gone] = String(v.inactivity_days || '28,35,42,84').split(',').map(Number);
  // migrations/0033. No clock runs before photo_clock_start, the go-live date Alex sets (2026-10-19),
  // so every listing counts its four weeks from that day at the earliest. Empty means no hold.
  const start = /^\d{4}-\d{2}-\d{2}$/.test(v.photo_clock_start || '') ? `${v.photo_clock_start}T00:00:00Z` : '';
  return { r1, r2, off, gone, start };
}

/** The date the clock runs from, for a puppy row and its breeder, never before the go-live date. */
export function anchorOf(p, b, s = {}) {
  const own = p.last_photo_at || p.published_at || p.created_at;
  const a = b && b.legacy && b.first_signin_at && b.first_signin_at > own ? b.first_signin_at : own;
  return s.start && a < s.start ? s.start : a;
}

/**
 * Where a puppy is in the schedule and by when the breeder must add a photo, for the portal's
 * banner and standing line. Returns null for a listing that needs nothing yet.
 *   { stage: 'warned' | 'offline' | 'removed', by }  by is when the next step happens
 */
export function scheduleFor(p, b, s) {
  const a = Date.parse(anchorOf(p, b, s));
  const since = p.stage_at ? Date.parse(p.stage_at) : null;
  const later = (...ms) => iso(Math.max(...ms));
  if (p.inactive_stage === 'reminded_1') return { stage: 'warned', by: later(a + s.off * DAY, since + 2 * 7 * DAY) };
  if (p.inactive_stage === 'reminded_2') return { stage: 'warned', by: later(a + s.off * DAY, since + 7 * DAY) };
  if (p.inactive_stage === 'offline') return { stage: 'offline', by: later(a + s.gone * DAY, since + (s.gone - s.off) * DAY) };
  if (p.inactive_stage === 'removed') return { stage: 'removed', by: null };
  return null;
}

/**
 * What a new photo that passed the check does to its puppy. It restarts the clock and clears a
 * warning, brings an offline listing back free, and lifts an admin's take-offline-for-photos hold
 * placed before the photo (workplan A14). A removed listing only gets its clock restarted, because
 * it comes back by paying. Returns the statements for the caller's batch.
 */
export async function photoPassedStmts(env, puppyId, photoAt, actor = { type: 'system', email: 'photo check' }) {
  const p = await env.DB.prepare('SELECT id, inactive_stage, publication_state, operator_hold, hold_kind, hold_at FROM puppies WHERE id = ?').bind(puppyId).first();
  if (!p) return [];
  const t = now();
  const at = photoAt || t;
  const stmts = [env.DB.prepare(
    `UPDATE puppies SET last_photo_at = CASE WHEN last_photo_at IS NULL OR last_photo_at < ? THEN ? ELSE last_photo_at END,
       inactive_stage = CASE WHEN inactive_stage IN ('reminded_1','reminded_2') THEN NULL ELSE inactive_stage END,
       stage_at = CASE WHEN inactive_stage IN ('reminded_1','reminded_2') THEN NULL ELSE stage_at END
     WHERE id = ?`,
  ).bind(at, at, puppyId)];
  let back = false;
  if (p.inactive_stage === 'offline' && p.publication_state === 'expired') {
    stmts.push(env.DB.prepare(`UPDATE puppies SET publication_state = 'published', inactive_stage = NULL, stage_at = NULL, inactive_at = NULL,
        updated_at = ?, version = version + 1 WHERE id = ? AND inactive_stage = 'offline'`).bind(t, puppyId));
    stmts.push(auditStmt(env, actor.type, actor.email, 'listing.photo_return', 'puppy', puppyId, { stage: 'offline' }, { free: true }));
    back = true;
  }
  if (p.operator_hold && p.hold_kind === 'photos' && p.hold_at && p.hold_at <= at) {
    stmts.push(env.DB.prepare(`UPDATE puppies SET operator_hold = 0, hold_kind = NULL, hold_reason = NULL, hold_at = NULL,
        updated_at = ?, version = version + 1 WHERE id = ? AND hold_kind = 'photos'`).bind(t, puppyId));
    stmts.push(auditStmt(env, actor.type, actor.email, 'puppy.photo_hold_lifted', 'puppy', puppyId, { operator_hold: 1 }, { operator_hold: 0 }));
    back = true;
  }
  // A photo that brought a listing back, or landed on a public one, changes the site.
  if (back) stmts.push(dirtyStmt(env));
  return stmts;
}

/** The daily job. It moves each listing at most one step a run. */
export async function inactivityJob(env, { portalOrigin = env.PORTAL_ORIGIN || '' } = {}) {
  const s = await inactivitySettings(env);
  const fee = (await settings(env)).feeCents;
  const t = Date.now(), at = (days) => iso(t - days * DAY), week = at(7), offlineWait = at(s.gone - s.off);
  // A listing is in the schedule when it is paid for and live or taken offline by the schedule,
  // not adopted, not on hold, and its breeder has signed in at least once.
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.slug, p.breeder_id, p.inactive_stage, p.stage_at, p.publication_state, b.email,
            CASE WHEN b.legacy = 1 AND b.first_signin_at > COALESCE(p.last_photo_at, p.published_at, p.created_at)
                 THEN b.first_signin_at ELSE COALESCE(p.last_photo_at, p.published_at, p.created_at) END AS anchor
       FROM puppies p JOIN breeders b ON b.id = p.breeder_id
      WHERE p.payment_state IN ('paid','comped') AND p.operator_hold = 0 AND p.availability != 'placed'
        AND b.first_signin_at IS NOT NULL AND b.status = 'approved'
        AND (p.publication_state = 'published' OR (p.publication_state = 'expired' AND p.inactive_stage = 'offline'))`,
  ).all();
  const moves = { reminded_1: [], reminded_2: [], offline: [], removed: [] };
  for (const p of results) {
    if (s.start && p.anchor < s.start) p.anchor = s.start;
    const stage = p.inactive_stage, since = p.stage_at || '';
    if (stage === 'offline') { if (p.anchor <= at(s.gone) && since <= offlineWait) moves.removed.push(p); continue; }
    if (p.publication_state !== 'published') continue;
    if (stage === 'reminded_2') { if (p.anchor <= at(s.off) && since <= week) moves.offline.push(p); continue; }
    if (stage === 'reminded_1') { if (p.anchor <= at(s.r2) && since <= week) moves.reminded_2.push(p); continue; }
    if (!stage && p.anchor <= at(s.r1)) moves.reminded_1.push(p);
  }
  const stamp = now();
  const day = (ms) => iso(ms).slice(0, 10);
  const photoLink = (p) => `${portalOrigin}/#/litters?photos=${p.id}`;
  const byBreeder = (rows) => rows.reduce((m, r) => ((m[r.breeder_id] ||= { email: r.email, rows: [] }).rows.push(r), m), {});
  for (const step of ['reminded_1', 'reminded_2']) {
    for (const g of Object.values(byBreeder(moves[step]))) {
      const stmts = [];
      for (const p of g.rows) {
        stmts.push(env.DB.prepare('UPDATE puppies SET inactive_stage = ?, stage_at = ? WHERE id = ? AND inactive_stage IS ?')
          .bind(step, stamp, p.id, step === 'reminded_1' ? null : 'reminded_1'));
        stmts.push(auditStmt(env, 'system', 'inactivity', `listing.${step}`, 'puppy', p.id, null, null));
      }
      await env.DB.batch(stmts);
      const first = step === 'reminded_1';
      await sendMail(env, g.email, 'photo_reminder', {
        items: g.rows.map((p) => ({ name: p.name, link: photoLink(p) })), first,
        offlineOn: day(Math.max(Date.parse(p0(g).anchor) + s.off * DAY, t + (first ? 14 : 7) * DAY)), portalUrl: `${portalOrigin}/#/litters`,
      });
    }
  }
  for (const g of Object.values(byBreeder(moves.offline))) {
    await env.DB.batch([
      ...g.rows.map((p) => env.DB.prepare(`UPDATE puppies SET publication_state = 'expired', inactive_stage = 'offline', stage_at = ?, inactive_at = ?,
          updated_at = ?, version = version + 1 WHERE id = ? AND inactive_stage = 'reminded_2'`).bind(stamp, stamp, stamp, p.id)),
      ...g.rows.map((p) => auditStmt(env, 'system', 'inactivity', 'listing.offline', 'puppy', p.id, null, null)),
      dirtyStmt(env),
    ]);
    await sendMail(env, g.email, 'listing_offline', {
      items: g.rows.map((p) => ({ name: p.name, link: photoLink(p) })),
      freeUntil: day(Math.max(Date.parse(p0(g).anchor) + s.gone * DAY, t + (s.gone - s.off) * DAY)), portalUrl: `${portalOrigin}/#/litters`,
    });
  }
  for (const g of Object.values(byBreeder(moves.removed))) {
    await env.DB.batch([
      ...g.rows.map((p) => env.DB.prepare("UPDATE puppies SET inactive_stage = 'removed', stage_at = ? WHERE id = ? AND inactive_stage = 'offline'").bind(stamp, p.id)),
      ...g.rows.map((p) => auditStmt(env, 'system', 'inactivity', 'listing.removed', 'puppy', p.id, null, null)),
    ]);
    await sendMail(env, g.email, 'listing_removed', { names: g.rows.map((p) => p.name), feeCents: fee, portalUrl: `${portalOrigin}/#/litters` });
  }
  return { checked: results.length, reminded_1: moves.reminded_1.length, reminded_2: moves.reminded_2.length, offline: moves.offline.length, removed: moves.removed.length };
}

// The earliest clock in a breeder's group, so the one date in the email is never later than the
// first listing's step.
const p0 = (g) => g.rows.reduce((a, b) => (b.anchor < a.anchor ? b : a));

/** Puppies the schedule took off the site, for the generator's forwards to the breed page. */
export async function gonePuppies(env) {
  return (await env.DB.prepare(
    `SELECT p.slug, p.legacy_slug, br.slug AS breed FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
      WHERE p.inactive_stage IN ('offline','removed') AND p.publication_state = 'expired' ORDER BY p.slug`,
  ).all()).results;
}
