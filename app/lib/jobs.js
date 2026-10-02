// The scheduled jobs (spec section 10), shared so the portal's cron and the admin's
// "Run now" button run exactly the same code.
//
// The free Workers plan allows five cron triggers per account, so the portal uses two:
//   */15 * * * *   reconcile   checkouts left open or paid without a listing
//   0 13 * * *     daily       expiry warnings and expiry, housekeeping, then the backup
// 13:00 UTC is 8 or 9 in the morning in Indiana, so warnings arrive at the start of the day.
// Each job records its last run in job_runs, which the admin shows.

import { now } from './util.js';
import { settings, auditStmt, dirtyStmt } from './store.js';
import { sendMail, alertOps } from './mail.js';
import { provider, releaseCheckout, fulfillCheckout } from './payments.js';

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

async function record(env, job, fn) {
  const started = now();
  try {
    const result = await fn();
    await env.DB.prepare(`INSERT INTO job_runs (job, last_run_at, last_result, last_error) VALUES (?, ?, ?, NULL)
      ON CONFLICT (job) DO UPDATE SET last_run_at = excluded.last_run_at, last_result = excluded.last_result, last_error = NULL`)
      .bind(job, started, JSON.stringify(result)).run();
    return { job, ok: true, ...result };
  } catch (e) {
    console.error(`job ${job} failed`, e);
    await env.DB.prepare(`INSERT INTO job_runs (job, last_run_at, last_result, last_error) VALUES (?, ?, NULL, ?)
      ON CONFLICT (job) DO UPDATE SET last_run_at = excluded.last_run_at, last_error = excluded.last_error`)
      .bind(job, started, String(e.message || e)).run();
    await alertOps(env, `${job} job failed`, String(e.stack || e)).catch(() => {});
    return { job, ok: false, error: String(e.message || e) };
  }
}

// Live listings that run out within warn_days get one warning each, grouped into one email
// per breeder. Past their date, they come off the site and the breeder is told how to renew.
async function expiry(env) {
  const s = await settings(env);
  const t = now(), soon = iso(Date.now() + s.warnDays * DAY);
  const portal = env.PORTAL_ORIGIN || '';
  const live = `p.publication_state = 'published' AND p.payment_state IN ('paid','comped')`;

  const { results: warn } = await env.DB.prepare(
    `SELECT p.id, p.name, p.expires_at, b.id AS breeder_id, b.email FROM puppies p JOIN breeders b ON b.id = p.breeder_id
      WHERE ${live} AND p.expires_at > ? AND p.expires_at <= ? AND p.expiry_warned_at IS NULL AND b.legacy = 0`,
  ).bind(t, soon).all();
  const { results: gone } = await env.DB.prepare(
    `SELECT p.id, p.name, b.id AS breeder_id, b.email, b.legacy FROM puppies p JOIN breeders b ON b.id = p.breeder_id
      WHERE ${live} AND p.expires_at <= ?`,
  ).bind(t).all();

  const byBreeder = (rows) => rows.reduce((m, r) => ((m[r.breeder_id] ||= { email: r.email, legacy: r.legacy, rows: [] }).rows.push(r), m), {});
  let warned = 0, expired = 0;
  for (const [, g] of Object.entries(byBreeder(warn))) {
    await env.DB.batch(g.rows.map((r) => env.DB.prepare('UPDATE puppies SET expiry_warned_at = ? WHERE id = ? AND expiry_warned_at IS NULL').bind(t, r.id)));
    await sendMail(env, g.email, 'expiring_soon', { items: g.rows.map((r) => ({ name: r.name, until: r.expires_at.slice(0, 10) })), portalUrl: `${portal}/#/pay` });
    warned += g.rows.length;
  }
  for (const [, g] of Object.entries(byBreeder(gone))) {
    await env.DB.batch([
      ...g.rows.map((r) => env.DB.prepare(`UPDATE puppies SET publication_state = 'expired', updated_at = ?, version = version + 1 WHERE id = ? AND publication_state = 'published'`).bind(t, r.id)),
      ...g.rows.map((r) => auditStmt(env, 'system', 'expiry', 'listing.expire', 'puppy', r.id, null, null)),
      dirtyStmt(env),
    ]);
    // Imported Wix listings have no real inbox behind them, so only real breeders are told.
    if (!g.legacy) await sendMail(env, g.email, 'expired', { names: g.rows.map((r) => r.name), portalUrl: `${portal}/#/pay` });
    expired += g.rows.length;
  }
  return { warned, expired };
}

// Sign-in links and sessions are kept a little past their use for the audit trail, then
// removed. Holds outlive their checkout only if a release failed, so stale ones go too.
async function housekeeping(env) {
  const dayAgo = iso(Date.now() - DAY), weekAgo = iso(Date.now() - 7 * DAY), t = now();
  const r = await env.DB.batch([
    env.DB.prepare('DELETE FROM login_tokens WHERE (used_at IS NOT NULL OR expires_at < ?) AND created_at < ?').bind(t, dayAgo),
    env.DB.prepare('DELETE FROM sessions WHERE (expires_at < ? OR revoked_at IS NOT NULL) AND COALESCE(revoked_at, expires_at) < ?').bind(t, weekAgo),
    env.DB.prepare('DELETE FROM puppy_holds WHERE expires_at < ?').bind(iso(Date.now() - 3600000)),
    env.DB.prepare('DELETE FROM dev_mailbox WHERE sent_at < ?').bind(iso(Date.now() - 14 * DAY)),
  ]);
  const [tokens, sessions, holds, mail] = r.map((x) => x.meta.changes);
  return { tokens, sessions, holds, test_mail: mail };
}

// Spec 8.6. A checkout still open past its expiry is closed and its puppies released. A
// checkout marked paid with no fulfillment is fulfilled now, because money arrived and the
// listing must go live whatever happened to the webhook.
async function reconcile(env) {
  const t = now();
  const { results: stale } = await env.DB.prepare(`SELECT id, stripe_session_id FROM checkouts WHERE status IN ('creating','open') AND expires_at < ?`).bind(t).all();
  for (const c of stale) {
    if (c.stripe_session_id) await provider(env).expireSession(env, c.stripe_session_id);
    await releaseCheckout(env, c.id, 'expired');
  }
  const { results: unfulfilled } = await env.DB.prepare(`SELECT stripe_session_id FROM checkouts WHERE status = 'paid' AND fulfilled_at IS NULL AND stripe_session_id IS NOT NULL`).all();
  let fulfilled = 0;
  for (const c of unfulfilled) {
    const r = await fulfillCheckout(env, c.stripe_session_id, 'reconcile');
    if (r && r.won) fulfilled += 1;
  }
  if (fulfilled) await alertOps(env, 'Reconciliation published paid listings', `${fulfilled} paid checkout(s) had no live listing and were fulfilled by the reconciliation job.`);
  return { closed: stale.length, fulfilled };
}

// Every table as JSON, gzipped, one file per day in the photo bucket under backups/. The
// media route serves only rows in photos, so nothing under backups/ is reachable from outside.
const BACKUP_TABLES = ['breeders', 'breeder_profiles', 'people', 'breeds', 'litters', 'puppies', 'photos', 'checkouts', 'checkout_items',
  'puppy_holds', 'payments', 'stripe_events', 'settings', 'site_state', 'audit_log', 'email_log', 'job_runs'];
async function backup(env) {
  const dump = { taken_at: now(), tables: {} };
  let rows = 0;
  for (const tbl of BACKUP_TABLES) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${tbl}`).all();
    dump.tables[tbl] = results; rows += results.length;
  }
  const gz = new Response(new Blob([JSON.stringify(dump)]).stream().pipeThrough(new CompressionStream('gzip')));
  const bytes = new Uint8Array(await gz.arrayBuffer());
  const key = `backups/${dump.taken_at.slice(0, 10)}.json.gz`;
  await env.FILES.put(key, bytes, { httpMetadata: { contentType: 'application/gzip' } });
  // Keep 90 days. R2 lifecycle rules would do this, but they need dashboard setup, so the job does it.
  const cutoff = `backups/${iso(Date.now() - 90 * DAY).slice(0, 10)}`;
  const old = await env.FILES.list({ prefix: 'backups/' });
  const drop = old.objects.map((o) => o.key).filter((k) => k < cutoff);
  if (drop.length) await env.FILES.delete(drop);
  return { key, rows, bytes: bytes.length, pruned: drop.length };
}

export const JOBS = { expiry, housekeeping, reconcile, backup };

export function runJob(env, name) {
  if (!JOBS[name]) throw new Error(`Unknown job ${name}`);
  return record(env, name, () => JOBS[name](env));
}

/** The cron entry point. */
export async function scheduled(event, env) {
  if (event.cron === '*/15 * * * *') return [await runJob(env, 'reconcile')];
  const out = [];
  for (const j of ['expiry', 'housekeeping', 'backup']) out.push(await runJob(env, j));
  return out;
}
