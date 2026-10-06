// Publishing the public site (spec section 9, plans P3.5, P4.3 and P4.4).
//
// Two halves. The admin's Publish now button calls publishNow(), which hands the work to a
// publisher chosen by PUBLISH_MODE. The portal does the real publish, publishSite(), from its
// */15 cron (publishIfDue) and from /internal/publish, which the admin reaches through the
// PORTAL service binding. The real publish lives in the portal because the portal already
// runs the cron, and so the admin never holds the GitHub token.
//
// PUBLISH_MODE (on the admin)
//   mark    the default. Records the site as published. The staging site reads the database
//           live, so there is nothing to build, and this only clears "changes waiting".
//   portal  asks the portal, through the PORTAL service binding, to publish now. The portal
//           keeps the bookkeeping, so this side only reports what it answered.
//
// publishSite() writes data/*.json (lib/shape.js) and every uploaded photo the pages need that
// the repository does not have yet, as ONE commit through the Git Data API (lib/github.js),
// under PUBLISH_DIR (default "site") in GITHUB_REPO. Without GITHUB_TOKEN it changes nothing
// and says so.

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

// The most new files one publish sends. Each is one request to GitHub, and the free Workers plan
// allows 50 outside requests per run, six of which the publish needs for itself.
const maxFiles = (env) => Math.max(1, Number(env.PUBLISH_MAX_FILES) || 40);
const DIR = (env) => String(env.PUBLISH_DIR ?? 'site').replace(/^\/+|\/+$/g, '');
const join = (dir, p) => (dir ? `${dir}/${p}` : p);

/**
 * The real publish, run by the portal. Returns { ok, sha, generation, files, photos, nothing }
 * or { ok: false, error, recorded } after recording the failure, or { ok: false, off: true,
 * error } without touching anything when GitHub is not set up.
 */
export async function publishSite(env, actor = { type: 'system', email: 'publish' }) {
  const missing = githubMissing(env);
  if (missing) return { ok: false, off: true, error: missing };
  const { generation: gen } = await env.DB.prepare('SELECT generation FROM site_state WHERE id = 1').first();
  const dir = DIR(env);
  try {
    const exp = await exportSite(env);
    const base = await branchTree(env, dir ? `${dir}/` : '');
    const enc = new TextEncoder();
    const dataChanges = [];
    for (const [p, t] of Object.entries(exp.files)) {
      const bytes = enc.encode(t);
      if (base.paths.get(join(dir, p)) !== await gitBlobSha(bytes)) dataChanges.push({ path: join(dir, p), bytes, binary: false });
    }
    // A photo's or logo's file name never changes its content, so one already in the tree is
    // already published. Anything else comes from R2. A card copy older uploads lack is the
    // full file again, so no page points at a file that is not there.
    const missingFiles = [];
    const files = [];
    let waitingFiles = 0;
    for (const u of exp.uploads) {
      if (base.paths.has(join(dir, u.path))) continue;
      if (files.length >= maxFiles(env)) { waitingFiles += 1; continue; }
      const obj = (await env.FILES.get(u.key)) || (u.fallback ? await env.FILES.get(u.fallback) : null);
      if (!obj) { missingFiles.push(u.path); continue; }
      files.push({ path: join(dir, u.path), bytes: new Uint8Array(await obj.arrayBuffer()), binary: true, upload: u });
    }
    // More new files than one run may send (the free plan allows 50 outside requests per run).
    // This run commits photos only, ahead of the data that names them, and the site stays dirty so
    // the next run carries on. The data goes up in the run that has every file it points at.
    const partial = waitingFiles > 0;
    const changes = partial ? files : [...dataChanges, ...files];
    const photoIds = [...new Set(exp.uploads.filter((u) => u.kind === 'photo' && !u.committed
      && (base.paths.has(join(dir, u.path)) || files.some((c) => c.upload === u))).map((u) => u.id))];
    const photos = files.length;

    let sha = base.parent;
    if (changes.length) {
      const c = exp.counts;
      sha = await commitChanges(env, base, changes, partial
        ? `Publish ${photos} photo files ahead of the data\n\n${waitingFiles} more wait for the next run, generation ${gen}, by ${actor.email}.\nWritten by the Puppy Connection publish.`
        : `Publish the site: ${c.puppies} puppies from ${c.breeders} breeders\n\n`
        + `${changes.length - photos} data file${changes.length - photos === 1 ? '' : 's'} and ${photos} photo file${photos === 1 ? '' : 's'}, `
        + `generation ${gen}, by ${actor.email}.\nWritten by the Puppy Connection publish. data/*.json belongs to the database, so do not edit it here.`);
    }
    if (partial) {
      const t = now();
      const stmts = [
        env.DB.prepare('UPDATE site_state SET last_error = NULL WHERE id = 1'),
        auditStmt(env, actor.type, actor.email, 'site.publish_photos', 'site', 'github', null, { generation: gen, sha, photos, waiting: waitingFiles }),
      ];
      for (let i = 0; i < photoIds.length; i += 90) {
        const ids = photoIds.slice(i, i + 90);
        stmts.push(env.DB.prepare(`UPDATE photos SET committed_at = ? WHERE committed_at IS NULL AND id IN (${ids.map(() => '?').join(',')})`).bind(t, ...ids));
      }
      await env.DB.batch(stmts);
      return { ok: true, partial: true, sha, generation: gen, files: 0, photos, waiting_files: waitingFiles, missing: missingFiles };
    }
    const t = now();
    const stmts = recordSuccess(env, gen, sha, actor, 'github', {
      files: changes.length - photos, photos, nothing: !changes.length, ...(missingFiles.length ? { missing: missingFiles.slice(0, 20) } : {}),
    });
    for (let i = 0; i < photoIds.length; i += 90) {
      const ids = photoIds.slice(i, i + 90);
      stmts.push(env.DB.prepare(`UPDATE photos SET committed_at = ? WHERE committed_at IS NULL AND id IN (${ids.map(() => '?').join(',')})`).bind(t, ...ids));
    }
    await env.DB.batch(stmts);
    return { ok: true, sha, generation: gen, files: changes.length - photos, photos, nothing: !changes.length, missing: missingFiles };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    await recordFailure(env, gen, actor, 'github', msg);
    return { ok: false, error: msg, recorded: true };
  }
}

/**
 * The cron's half (spec 9). Nothing happens unless the site has changes waiting and the first
 * of them is at least 60 seconds old, so a burst of edits becomes one commit.
 */
export async function publishIfDue(env, { minAgeMs = 60000 } = {}) {
  const s = await env.DB.prepare('SELECT generation, published_generation, dirty_since FROM site_state WHERE id = 1').first();
  const waiting = s.generation - s.published_generation;
  if (waiting <= 0) return { waiting: 0 };
  const age = s.dirty_since ? Date.now() - Date.parse(s.dirty_since) : Infinity;
  if (age < minAgeMs) return { waiting, wait: true, age_seconds: Math.floor(age / 1000) };
  const missing = githubMissing(env);
  if (missing) return { waiting, off: true, reason: missing };
  const r = await publishSite(env, { type: 'system', email: 'publish-cron' });
  // A failure is already recorded and alerted once by publishSite, so the job does not alert again.
  if (!r.ok) return { waiting, failed: r.error };
  return { waiting, sha: r.sha, generation: r.generation, files: r.files, photos: r.photos, nothing: r.nothing };
}
