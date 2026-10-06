// Publishing the public site (spec section 9, plans P3.5, P4.3 and P4.4).
//
// Two halves. The admin's Publish now button calls publishNow(), which hands the work to a
// publisher chosen by PUBLISH_MODE. The portal does the real publish, publishSite(), from its
// */15 cron (publishIfDue) and from /internal/publish, which the admin reaches through the
// PORTAL service binding. The real publish lives in the portal because the portal already
// runs the cron, and so the admin never holds the deploy hook or a token.
//
// PUBLISH_MODE on the admin
//   mark    the default when unset. Records the site as published and builds nothing, for a
//           site that reads the database live.
//   hook, commit or portal
//           asks the portal, through the PORTAL service binding, to publish now. The portal
//           keeps the bookkeeping, so this side only reports what it answered.
//
// PUBLISH_MODE on the portal, which does the work
//   hook    the default (Alex, 2026-10-06). POSTs the Cloudflare Workers Builds deploy hook of
//           the site Worker (secret PUBLISH_HOOK_URL). The build in the site repository,
//           alexharper24/puppyconnection-site (decision D10), fetches /data/export.json from the
//           portal, the same bytes lib/shape.js gives, builds every page and deploys. The
//           Worker's own work is one request, which fits the free plan's 10 ms of CPU, where the
//           commit below measured 13 to 50 ms. Without PUBLISH_HOOK_URL it does nothing and says so.
//   commit  writes data/*.json as ONE commit through the Git Data API (lib/github.js) to
//           GITHUB_REPO on GITHUB_BRANCH under PUBLISH_DIR, and the commit starts the build.
//           Kept for later, for example on Workers Paid. Without GITHUB_TOKEN it does nothing.
// Either way no photo is published to the repository (decision D11). The site Worker serves
// every photo from R2 at /media.

import { now } from './util.js';
import { auditStmt } from './store.js';
import { alertOps } from './mail.js';
import { exportSite } from './shape.js';
import { githubMissing, gitBlobSha, branchTree, commitChanges } from './github.js';

const publishers = {
  mark: {
    name: 'mark',
    async publish() { return { sha: 'marked' }; },
  },
  portal: {
    name: 'portal',
    delegates: true,
    async publish(env, generation, actor = { type: 'operator', email: 'unknown' }) {
      if (!env.PORTAL || typeof env.PORTAL.fetch !== 'function') throw new Error('PUBLISH_MODE is portal, but the PORTAL service binding is missing.');
      const res = await env.PORTAL.fetch('https://portal.internal/internal/publish', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ generation, actor }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.sha) {
        const e = new Error(out.error || `The portal could not publish the site (${res.status}).`);
        e.recorded = !!out.recorded;
        e.off = !!out.off;
        throw e;
      }
      return out;
    },
  },
};

// The admin hands every real mode to the portal, which reads its own PUBLISH_MODE.
publishers.hook = { ...publishers.portal, name: 'hook' };
publishers.commit = { ...publishers.portal, name: 'commit' };

export function publisher(env) {
  const p = publishers[env.PUBLISH_MODE || 'mark'];
  if (!p) throw new Error(`PUBLISH_MODE "${env.PUBLISH_MODE}" is not a publisher.`);
  return p;
}

/** What the Publish screen shows: the site state, and how many changes are waiting. */
export async function siteStatus(env) {
  const s = await env.DB.prepare('SELECT * FROM site_state WHERE id = 1').first();
  const lastFail = await env.DB.prepare("SELECT at, actor FROM audit_log WHERE action = 'site.publish_failed' ORDER BY id DESC LIMIT 1").first();
  return {
    mode: publisher(env).name, dirty: !!s.dirty, dirty_since: s.dirty_since, generation: s.generation,
    published_generation: s.published_generation, waiting: s.generation - s.published_generation,
    last_publish_at: s.last_publish_at, last_publish_sha: s.last_publish_sha, last_error: s.last_error,
    last_error_at: s.last_error && lastFail ? lastFail.at : null,
  };
}

// The generation read at the start is what gets recorded, never the current one, so a change
// that lands while the publish runs keeps the site dirty and the next run picks it up.
function recordSuccess(env, gen, sha, actor, name, detail) {
  return [
    env.DB.prepare(
      `UPDATE site_state SET published_generation = MAX(published_generation, ?), last_publish_at = ?, last_publish_sha = ?, last_error = NULL,
         dirty = CASE WHEN generation <= ? THEN 0 ELSE 1 END, dirty_since = CASE WHEN generation <= ? THEN NULL ELSE dirty_since END
       WHERE id = 1`,
    ).bind(gen, now(), sha, gen, gen),
    auditStmt(env, actor.type, actor.email, 'site.publish', 'site', name, null, { generation: gen, sha, ...detail }),
  ];
}

async function recordFailure(env, gen, actor, name, msg) {
  const before = await env.DB.prepare('SELECT last_error FROM site_state WHERE id = 1').first();
  await env.DB.batch([
    env.DB.prepare('UPDATE site_state SET last_error = ? WHERE id = 1').bind(msg),
    auditStmt(env, actor.type, actor.email, 'site.publish_failed', 'site', name, null, { generation: gen, error: msg }),
  ]);
  // One alert per distinct error, so a lapsed token does not email every fifteen minutes.
  if (before?.last_error !== msg) await alertOps(env, 'The public site could not be published', msg).catch(() => {});
}

/**
 * Publish everything up to the current generation, from the admin's button. A failure is kept
 * in site_state.last_error and the audit log, and cleared by the next good publish.
 */
export async function publishNow(env, actor) {
  const s = await env.DB.prepare('SELECT generation FROM site_state WHERE id = 1').first();
  const gen = s.generation;
  const p = publisher(env);
  try {
    const r = await p.publish(env, gen, actor);
    if (p.delegates) return { ok: true, generation: r.generation, sha: r.sha, nothing: !!r.nothing };
    await env.DB.batch(recordSuccess(env, gen, r.sha, actor, p.name, {}));
    return { ok: true, generation: gen, sha: r.sha };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    // The portal records its own failures. Only what never reached it is recorded here, and a
    // portal without its token has nothing to record, because it only says so.
    if (!e.recorded && !e.off) await recordFailure(env, gen, actor, p.name, msg);
    return { ok: false, error: msg, off: !!e.off };
  }
}

const DIR = (env) => String(env.PUBLISH_DIR ?? '').replace(/^\/+|\/+$/g, '');
const join = (dir, p) => (dir ? `${dir}/${p}` : p);

/** The portal's publish method: hook unless PUBLISH_MODE says commit. */
export const portalMode = (env) => (env.PUBLISH_MODE === 'commit' ? 'commit' : 'hook');

/** What is missing before the portal can publish in its mode, or null. */
export function publishMissing(env) {
  return portalMode(env) === 'commit' ? githubMissing(env) : hookMissing(env);
}

/** What is missing before the deploy hook can be called, or null. */
export function hookMissing(env) {
  const u = env.PUBLISH_HOOK_URL;
  if (!u) return 'PUBLISH_HOOK_URL is not set, so the site is not rebuilt. Alex creates the Workers Builds deploy hook and sets it (launch checklist L16).';
  // A deployed Worker only ever calls Cloudflare's API. The local test runs a stand-in hook.
  const local = env.DEV_MODE === 'local' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u);
  if (!local && !/^https:\/\/api\.cloudflare\.com\//.test(u)) return 'PUBLISH_HOOK_URL is not a Cloudflare deploy hook address, so it was not called.';
  return null;
}

/**
 * The real publish, run by the portal. Returns { ok, sha, generation, nothing, ... }, or
 * { ok: false, error, recorded } after recording the failure, or { ok: false, off: true, error }
 * without touching anything when the mode is not set up.
 */
export async function publishSite(env, actor = { type: 'system', email: 'publish' }) {
  return portalMode(env) === 'commit' ? publishCommit(env, actor) : publishHook(env, actor);
}

/**
 * Hook mode. Starts one site build for everything up to the generation read here. Once the hook
 * accepts, that generation counts as published, so the same changes never start a second build,
 * and the build itself reads the data when it runs, which is at least this new.
 */
export async function publishHook(env, actor = { type: 'system', email: 'publish' }) {
  const missing = hookMissing(env);
  if (missing) return { ok: false, off: true, error: missing };
  const s = await env.DB.prepare('SELECT generation, published_generation, last_publish_sha FROM site_state WHERE id = 1').first();
  const gen = s.generation;
  if (gen <= s.published_generation) return { ok: true, nothing: true, sha: s.last_publish_sha || 'nothing', generation: gen };
  try {
    const res = await fetch(env.PUBLISH_HOOK_URL, { method: 'POST', headers: { 'user-agent': 'puppyconnection-publish' } });
    const text = await res.text();
    // The address is the secret, so it never goes into a message, only the answer does.
    if (!res.ok) throw new Error(`The deploy hook answered ${res.status}: ${text.slice(0, 200)}`);
    let out = {};
    try { out = JSON.parse(text); } catch { /* an empty or plain answer is still accepted */ }
    if (out && out.success === false) throw new Error(`The deploy hook refused the build: ${JSON.stringify(out.errors || out).slice(0, 200)}`);
    const id = (out && out.result && (out.result.build_uuid || out.result.id)) || 'accepted';
    const sha = `hook:${String(id).slice(0, 60)}`;
    await env.DB.batch(recordSuccess(env, gen, sha, actor, 'hook', { build: id }));
    return { ok: true, sha, generation: gen, build: id };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    await recordFailure(env, gen, actor, 'hook', msg);
    return { ok: false, error: msg, recorded: true };
  }
}

/**
 * Commit mode, kept for later. Writes data/*.json as one commit, and the commit starts the build.
 */
export async function publishCommit(env, actor = { type: 'system', email: 'publish' }) {
  const missing = githubMissing(env);
  if (missing) return { ok: false, off: true, error: missing };
  const { generation: gen } = await env.DB.prepare('SELECT generation FROM site_state WHERE id = 1').first();
  const dir = DIR(env);
  try {
    const exp = await exportSite(env);
    const base = await branchTree(env, dir ? `${dir}/` : '');
    const enc = new TextEncoder();
    const changes = [];
    for (const [p, t] of Object.entries(exp.files)) {
      const bytes = enc.encode(t);
      if (base.paths.get(join(dir, p)) !== await gitBlobSha(bytes)) changes.push({ path: join(dir, p), bytes, binary: false });
    }
    let sha = base.parent;
    if (changes.length) {
      const c = exp.counts;
      sha = await commitChanges(env, base, changes, `Publish the site: ${c.puppies} puppies from ${c.breeders} breeders\n\n`
        + `${changes.map((x) => x.path).join(', ')}, generation ${gen}, by ${actor.email}.\n`
        + 'Written by the Puppy Connection publish. data/*.json belongs to the database, so do not edit it here.');
    }
    await env.DB.batch(recordSuccess(env, gen, sha, actor, 'github', { files: changes.length, nothing: !changes.length }));
    return { ok: true, sha, generation: gen, files: changes.length, nothing: !changes.length };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    await recordFailure(env, gen, actor, 'github', msg);
    return { ok: false, error: msg, recorded: true };
  }
}

/**
 * The cron's half (spec 9). Nothing happens unless the site has changes waiting and the first
 * of them is at least 60 seconds old, so a burst of edits becomes one build. In hook mode it also
 * waits while the last build may still be running (PUBLISH_HOOK_GAP_SECONDS, default 180), so a
 * Publish now just before the cron does not start a second build on top of the first.
 */
export async function publishIfDue(env, { minAgeMs = 60000 } = {}) {
  const s = await env.DB.prepare('SELECT generation, published_generation, dirty_since, last_publish_at FROM site_state WHERE id = 1').first();
  const waiting = s.generation - s.published_generation;
  if (waiting <= 0) return { waiting: 0 };
  const age = s.dirty_since ? Date.now() - Date.parse(s.dirty_since) : Infinity;
  if (age < minAgeMs) return { waiting, wait: true, age_seconds: Math.floor(age / 1000) };
  const missing = publishMissing(env);
  if (missing) return { waiting, off: true, reason: missing };
  if (portalMode(env) === 'hook' && s.last_publish_at) {
    const gap = Number(env.PUBLISH_HOOK_GAP_SECONDS ?? 180) * 1000;
    const since = Date.now() - Date.parse(s.last_publish_at);
    if (since < gap) return { waiting, wait: true, build_running: true, since_seconds: Math.floor(since / 1000) };
  }
  const r = await publishSite(env, { type: 'system', email: 'publish-cron' });
  // A failure is already recorded and alerted once by publishSite, so the job does not alert again.
  if (!r.ok) return { waiting, failed: r.error };
  return { waiting, mode: portalMode(env), sha: r.sha, generation: r.generation, files: r.files, build: r.build, nothing: r.nothing };
}
