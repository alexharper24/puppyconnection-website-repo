// The retention schedule the privacy policy states (launch workplan D1, Alex 2026-10-24), run every
// morning by the daily job in lib/jobs.js and from the admin's Run now. portal/legal.js says the
// same rules in plain words, so a change here is a change there in the same commit.
//
//   activity record    audit_log rows older than 2 years are deleted
//   payment records    checkouts older than 7 years go, with their items, payments, disputes and
//                      holds, and Stripe event receipts older than 7 years
//   page and search    puppy_stats and breed_searches are kept, because they hold nothing about a
//   counts             visitor. Nothing here touches them, except the counts of a closed account's
//                      own puppies, which go with those puppies
//   unsubscribed       the address, its state, the date and its unsubscribe link stay, so it is
//                      never emailed again. The name, how and when it joined, the import batch,
//                      its send rows for finished emails and its list emails in the email log go
//   closed accounts    30 days after an operator marks the close request closed, the profile,
//                      breeds raised, photos, videos, documents, litters, puppies, saved parents,
//                      people on the account and every session go, with their files in R2 and
//                      their videos at Stream. The breeders row stays, suspended, because the
//                      payment records and the activity record still name it for their periods.
//                      The reference goes with them (Alex, 2026-10-24). Operator notes and listing
//                      reports stay on their own 2 years, and the close request and email log stay.
//   notes, reports     operator_notes and listing_reports older than 2 years by created_at are
//                      deleted, whoever they are about (Alex, 2026-10-24)
//
// Every delete names its table and its bound, never a whole table. Each run writes one audit row per
// account removed and per batch of old rows deleted, and the activity record is pruned only below
// the highest id that existed when the run started, so this run's own rows are never pruned. Each
// step is capped (LIMITS), and anything over a cap waits for the next morning, so the job stays
// inside the Workers Free limits: 10 ms CPU, 50 outside requests, 1,000 Cloudflare service calls.
// A run that stops partway changes nothing the next run cannot finish, and a second run after a
// complete one changes nothing.

import { now } from './util.js';
import { auditStmt, dirtyStmt } from './store.js';
import { streamMode, removeVideo } from './stream.js';

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

export const KEEP = { auditYears: 2, paymentYears: 7, closeDays: 30 };
export const LIMITS = {
  auditBatch: 1000, auditBatches: 3,          // activity rows, per batch and batches per run
  checkoutBatch: 40, checkoutBatches: 3,      // 40 keeps each IN list under D1's 100 bound values
  eventBatch: 500,                            // Stripe event receipts and loose disputes per run
  unsubBatch: 1000,                           // unsubscribed rows tidied, send rows and log rows per run
  noteBatch: 500, noteBatches: 2,             // operator notes and listing reports, each table
  accounts: 2,                                // closed accounts removed per run
  videos: 5,                                  // Stream deletes per run, each an outside request
  listPages: 5,                               // R2 list calls per prefix per account
};

// Where a breeder's files live in R2, each followed by the breeder id and a slash.
export const FILE_PREFIXES = ['uploads', 'brand', 'parents', 'docs', 'private'];

function yearsBefore(ms, years) {
  const d = new Date(ms);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return iso(d.getTime());
}

/** The cutoffs for a run at nowMs, for the job and for the tests. */
export function cutoffs(nowMs = Date.now()) {
  return { audit: yearsBefore(nowMs, KEEP.auditYears), payment: yearsBefore(nowMs, KEEP.paymentYears), close: iso(nowMs - KEEP.closeDays * DAY) };
}

const marks = (n) => Array(n).fill('?').join(',');
const audit = (env, action, entity, id, after) => auditStmt(env, 'system', 'retention', action, entity, id, null, after);

/**
 * Activity older than two years, oldest first, in batches. Never above ceiling, the highest id
 * when the run started. The batch is the same ordered subquery in the count and in the delete,
 * read through audit_log_at, and no other writer can add a row older than two years in between.
 */
async function pruneAudit(env, cut, ceiling) {
  let rows = 0, batches = 0;
  const pick = 'SELECT id FROM audit_log WHERE at < ? AND id <= ? ORDER BY at, id LIMIT ?';
  const seen = pick.replace('SELECT id', 'SELECT id, at');
  for (let i = 0; i < LIMITS.auditBatches; i += 1) {
    const r = await env.DB.prepare(`SELECT COUNT(*) AS n, MIN(at) AS first, MAX(at) AS last FROM (${seen})`).bind(cut, ceiling, LIMITS.auditBatch).first();
    if (!r || !r.n) break;
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM audit_log WHERE id IN (${pick})`).bind(cut, ceiling, LIMITS.auditBatch),
      audit(env, 'retention.activity_deleted', 'audit_log', `before ${cut}`, { rows: r.n, older_than: cut, from: r.first, to: r.last }),
    ]);
    rows += r.n; batches += 1;
    if (r.n < LIMITS.auditBatch) break;
  }
  return { rows, batches };
}

/**
 * Operator notes and listing reports older than two years, oldest first, in batches. Each table's
 * batch is the same ordered subquery in the count and in the delete, read through its created_at
 * index (migrations/0060).
 */
async function pruneOld(env, table, cut) {
  let rows = 0;
  const pick = `SELECT id FROM ${table} WHERE created_at < ? ORDER BY created_at, id LIMIT ?`;
  for (let i = 0; i < LIMITS.noteBatches; i += 1) {
    const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM (${pick})`).bind(cut, LIMITS.noteBatch).first();
    if (!r || !r.n) break;
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${pick})`).bind(cut, LIMITS.noteBatch),
      audit(env, `retention.${table}_deleted`, table, `before ${cut}`, { rows: r.n, older_than: cut }),
    ]);
    rows += r.n;
    if (r.n < LIMITS.noteBatch) break;
  }
  return rows;
}

/** Payment records older than seven years, a batch of checkouts at a time, children first. */
async function prunePayments(env, cut) {
  let checkouts = 0, batches = 0;
  for (let i = 0; i < LIMITS.checkoutBatches; i += 1) {
    const ids = (await env.DB.prepare('SELECT id FROM checkouts WHERE created_at < ? ORDER BY created_at, id LIMIT ?')
      .bind(cut, LIMITS.checkoutBatch).all()).results.map((r) => r.id);
    if (!ids.length) break;
    const m = marks(ids.length);
    const r = await env.DB.batch([
      env.DB.prepare(`DELETE FROM disputes WHERE checkout_id IN (${m})`).bind(...ids),
      env.DB.prepare(`DELETE FROM disputes WHERE payment_intent IN (SELECT stripe_payment_intent_id FROM payments WHERE checkout_id IN (${m}))`).bind(...ids),
      env.DB.prepare(`DELETE FROM payments WHERE checkout_id IN (${m})`).bind(...ids),
      env.DB.prepare(`DELETE FROM puppy_holds WHERE checkout_id IN (${m})`).bind(...ids),
      env.DB.prepare(`DELETE FROM sim_sessions WHERE client_reference_id IN (${m})`).bind(...ids),
      env.DB.prepare(`DELETE FROM checkout_items WHERE checkout_id IN (${m})`).bind(...ids),
      env.DB.prepare(`DELETE FROM checkouts WHERE id IN (${m}) AND created_at < ?`).bind(...ids, cut),
      audit(env, 'retention.payments_deleted', 'checkout', `before ${cut}`, { checkouts: ids.length, older_than: cut }),
    ]);
    checkouts += r[6].meta.changes; batches += 1;
    if (ids.length < LIMITS.checkoutBatch) break;
  }
  // Stripe's event receipts, and any dispute no checkout led to, on the same seven years.
  const ev = await env.DB.prepare('SELECT COUNT(*) AS n FROM (SELECT 1 FROM stripe_events WHERE received_at < ? LIMIT ?)').bind(cut, LIMITS.eventBatch).first();
  const dp = await env.DB.prepare('SELECT COUNT(*) AS n FROM (SELECT 1 FROM disputes WHERE opened_at < ? LIMIT ?)').bind(cut, LIMITS.eventBatch).first();
  if (ev.n || dp.n) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM stripe_events WHERE rowid IN (SELECT rowid FROM stripe_events WHERE received_at < ? ORDER BY received_at LIMIT ?)').bind(cut, LIMITS.eventBatch),
      env.DB.prepare('DELETE FROM disputes WHERE rowid IN (SELECT rowid FROM disputes WHERE opened_at < ? ORDER BY opened_at LIMIT ?)').bind(cut, LIMITS.eventBatch),
      audit(env, 'retention.payment_events_deleted', 'stripe_event', `before ${cut}`, { events: ev.n, disputes: dp.n, older_than: cut }),
    ]);
    batches += 1;
  }
  return { checkouts, events: ev.n, disputes: dp.n, batches };
}

/** An unsubscribed address keeps only what stops it being emailed again. */
async function tidyUnsubscribed(env) {
  const lim = LIMITS.unsubBatch;
  const tidy = `SELECT id FROM subscribers WHERE status = 'unsubscribed'
     AND (name IS NOT NULL OR source IS NOT NULL OR import_batch IS NOT NULL OR created_at IS NOT COALESCE(unsubscribed_at, created_at)) LIMIT ?`;
  const sends = `SELECT cs.rowid FROM campaign_sends cs JOIN subscribers s ON s.id = cs.subscriber_id JOIN campaigns c ON c.id = cs.campaign_id
     WHERE s.status = 'unsubscribed' AND c.status = 'sent' LIMIT ?`;
  // to_addr first, so the comparison uses email_log_to (migrations/0060). Both columns hold the
  // address as lowercased by lib/subscribers.js.
  const logs = `SELECT e.id FROM subscribers s JOIN email_log e ON e.to_addr = s.email WHERE s.status = 'unsubscribed' AND e.template = 'campaign' LIMIT ?`;
  const n = async (sql) => (await env.DB.prepare(`SELECT COUNT(*) AS n FROM (${sql})`).bind(lim).first()).n;
  const counts = { rows: await n(tidy), sends: await n(sends), log: await n(logs) };
  if (!counts.rows && !counts.sends && !counts.log) return { ...counts, batches: 0 };
  await env.DB.batch([
    env.DB.prepare(`UPDATE subscribers SET name = NULL, source = NULL, import_batch = NULL, created_at = COALESCE(unsubscribed_at, created_at) WHERE id IN (${tidy})`).bind(lim),
    env.DB.prepare(`DELETE FROM campaign_sends WHERE rowid IN (${sends})`).bind(lim),
    env.DB.prepare(`DELETE FROM email_log WHERE id IN (${logs})`).bind(lim),
    audit(env, 'retention.unsubscribed_tidied', 'subscriber', 'unsubscribed', counts),
  ]);
  return { ...counts, batches: 1 };
}

/** Accounts due for removal: a close resolved KEEP.closeDays ago or more, not withdrawn, not done. */
export async function dueAccounts(env, closeCut, limit = LIMITS.accounts) {
  return (await env.DB.prepare(
    `SELECT ar.breeder_id, MIN(ar.resolved_at) AS resolved_at FROM account_requests ar JOIN breeders b ON b.id = ar.breeder_id
      WHERE ar.resolved_at IS NOT NULL AND ar.withdrawn_at IS NULL AND ar.removed_at IS NULL AND ar.resolved_at <= ?
      GROUP BY ar.breeder_id ORDER BY MIN(ar.resolved_at), ar.breeder_id LIMIT ?`,
  ).bind(closeCut, limit).all()).results;
}

/** Every R2 key of one breeder: under each prefix, and every key a row names, with card copies. */
async function accountFiles(env, id) {
  const keys = new Set();
  let complete = true;
  for (const p of FILE_PREFIXES) {
    let cursor;
    for (let page = 0; ; page += 1) {
      if (page >= LIMITS.listPages) { complete = false; break; }
      const r = await env.FILES.list({ prefix: `${p}/${id}/`, ...(cursor ? { cursor } : {}) });
      for (const o of r.objects) keys.add(o.key);
      if (!r.truncated) break;
      cursor = r.cursor;
    }
  }
  const one = async (sql) => (await env.DB.prepare(sql).bind(id).all()).results;
  for (const r of await one('SELECT r2_key AS k FROM photos WHERE breeder_id = ? AND r2_key IS NOT NULL')) keys.add(r.k).add(`${r.k}.card`);
  for (const r of await one('SELECT photo_key AS k FROM parent_dogs WHERE breeder_id = ? AND photo_key IS NOT NULL')) keys.add(r.k).add(`${r.k}.card`);
  for (const r of await one('SELECT r2_key AS k FROM documents WHERE breeder_id = ?')) keys.add(r.k);
  for (const r of await one('SELECT logo_key, kennel_key FROM breeder_profiles WHERE breeder_id = ?')) {
    for (const k of [r.logo_key, r.kennel_key]) if (k) keys.add(k).add(`${k}.card`);
  }
  return { keys: [...keys], complete };
}

/** A video's file, at Stream or in the local and staging stand-in. */
async function dropVideo(env, uid) {
  if (streamMode(env)) return removeVideo(env, uid);
  // Video was switched off after this one was stored. The stand-in's copy is the only one there can be.
  await env.FILES.delete(`videos/${uid}`);
}

/**
 * Remove one closed account. Answers { done, ... }. done is false when a cap stopped it, and the
 * next run carries on, because each step can be repeated.
 */
async function removeAccount(env, acct, budget) {
  const id = acct.breeder_id;
  if (!id) return { done: false };
  // Videos first, because each is an outside request at Stream and the run allows few of them.
  const vids = (await env.DB.prepare('SELECT id, stream_uid FROM puppy_videos WHERE breeder_id = ? ORDER BY id LIMIT ?').bind(id, budget.videos + 1).all()).results;
  const now_ = vids.slice(0, budget.videos);
  for (const v of now_) await dropVideo(env, v.stream_uid);
  if (now_.length) await env.DB.prepare(`DELETE FROM puppy_videos WHERE breeder_id = ? AND id IN (${marks(now_.length)})`).bind(id, ...now_.map((v) => v.id)).run();
  budget.videos -= now_.length;
  if (vids.length > now_.length) return { breeder_id: id, done: false, videos: now_.length, waiting: 'videos' };

  const files = await accountFiles(env, id);
  const inPuppies = 'SELECT id FROM puppies WHERE breeder_id = ?';
  const steps = [
    ['checkout_items_named', `UPDATE checkout_items SET puppy_name = (SELECT p.name FROM puppies p WHERE p.id = checkout_items.puppy_id)
       WHERE breeder_id = ? AND puppy_name IS NULL`],
    ['holds', `DELETE FROM puppy_holds WHERE puppy_id IN (${inPuppies})`],
    ['puppy_counts', `DELETE FROM puppy_stats WHERE puppy_id IN (${inPuppies})`],
    ['photos', 'DELETE FROM photos WHERE breeder_id = ?'],
    ['videos', 'DELETE FROM puppy_videos WHERE breeder_id = ?'],
    ['documents', 'DELETE FROM documents WHERE breeder_id = ?'],
    ['puppies', 'DELETE FROM puppies WHERE breeder_id = ?'],
    ['litters', 'DELETE FROM litters WHERE breeder_id = ?'],
    ['parents', 'DELETE FROM parent_dogs WHERE breeder_id = ?'],
    ['breeds_raised', 'DELETE FROM breeder_breeds WHERE breeder_id = ?'],
    ['people', 'DELETE FROM breeder_members WHERE breeder_id = ?'],
    ['reference', 'DELETE FROM breeder_references WHERE breeder_id = ?'],
    ['sessions', 'DELETE FROM sessions WHERE breeder_id = ?'],
    ['profile', 'DELETE FROM breeder_profiles WHERE breeder_id = ?'],
  ];
  const t = now();
  const r = await env.DB.batch([
    ...steps.map(([, sql]) => env.DB.prepare(sql).bind(id)),
    // Suspended keeps a later sign-in from building a new public page on the old account, and the
    // reason says why in the admin.
    env.DB.prepare(`UPDATE breeders SET status = CASE WHEN status IN ('approved','pending') THEN 'suspended' ELSE status END,
        status_reason = ?, updated_at = ?, version = version + 1 WHERE id = ?`).bind(`Account closed. Its information was removed on ${t.slice(0, 10)}.`, t, id),
    dirtyStmt(env),
  ]);
  const removed = Object.fromEntries(steps.map(([name], i) => [name, r[i].meta.changes]));
  removed.videos += now_.length;

  // Files after the rows, so the site never points at a missing file. R2 takes 1,000 keys a call.
  for (let i = 0; i < files.keys.length; i += 1000) await env.FILES.delete(files.keys.slice(i, i + 1000));
  if (!files.complete) return { breeder_id: id, done: false, files: files.keys.length, waiting: 'files' };

  await env.DB.batch([
    env.DB.prepare('UPDATE account_requests SET removed_at = ? WHERE breeder_id = ? AND resolved_at IS NOT NULL AND withdrawn_at IS NULL AND removed_at IS NULL').bind(t, id),
    audit(env, 'account.removed', 'breeder', id, { resolved_at: acct.resolved_at, ...removed, files: files.keys.length }),
  ]);
  return { breeder_id: id, done: true, ...removed, files: files.keys.length };
}

/** The daily job. nowMs moves the clock for the tests. */
export async function retentionJob(env, { nowMs = Date.now() } = {}) {
  const cut = cutoffs(nowMs);
  // The activity record as it stood before this run, so nothing this run writes can be pruned by it.
  const ceiling = (await env.DB.prepare('SELECT COALESCE(MAX(id), 0) AS n FROM audit_log').first()).n;
  const budget = { videos: LIMITS.videos };
  const accounts = [];
  for (const a of await dueAccounts(env, cut.close)) accounts.push(await removeAccount(env, a, budget));
  const payments = await prunePayments(env, cut.payment);
  const unsubscribed = await tidyUnsubscribed(env);
  const notes = await pruneOld(env, 'operator_notes', cut.audit);
  const reports = await pruneOld(env, 'listing_reports', cut.audit);
  const activity = await pruneAudit(env, cut.audit, ceiling);
  return {
    accounts_removed: accounts.filter((a) => a.done).length,
    accounts_waiting: accounts.filter((a) => !a.done).length,
    accounts,
    activity_deleted: activity.rows,
    notes_deleted: notes,
    reports_deleted: reports,
    checkouts_deleted: payments.checkouts,
    payment_events_deleted: payments.events + payments.disputes,
    unsubscribed_tidied: unsubscribed.rows,
    unsubscribed_sends_deleted: unsubscribed.sends,
    unsubscribed_log_deleted: unsubscribed.log,
  };
}
