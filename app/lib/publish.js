// Publishing the public site (plan P3.5), behind one interface so the admin's Publish now
// button stays the same when the real publish arrives. P4.3 builds the pages and the commit,
// and P4.4 reaches them from the admin through a service binding to the portal.
//
// PUBLISH_MODE
//   mark    the default. Records the site as published. The staging site reads the database
//           live, so there is nothing to build, and this only clears "changes waiting".
//   portal  P4.4. Asks the portal Worker, through the PORTAL service binding, to build and
//           commit the site, and records the commit it answers with. The portal route does not
//           exist yet, so this mode fails with a clear error until P4.4 adds it.

import { now } from './util.js';
import { auditStmt } from './store.js';

const publishers = {
  mark: {
    name: 'mark',
    async publish() { return { sha: 'marked' }; },
  },
  portal: {
    name: 'portal',
    async publish(env, generation) {
      if (!env.PORTAL || typeof env.PORTAL.fetch !== 'function') throw new Error('PUBLISH_MODE is portal, but the PORTAL service binding is missing.');
      const res = await env.PORTAL.fetch('https://portal.internal/internal/publish', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ generation }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.sha) throw new Error(out.error || `The portal could not publish the site (${res.status}).`);
      return { sha: out.sha };
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

/**
 * Publish everything up to the current generation. A change that lands while the publish runs
 * keeps the site marked dirty, because only the generation that was read is recorded. A failure
 * is kept in site_state.last_error and the audit log, and cleared by the next good publish.
 */
export async function publishNow(env, actor) {
  const s = await env.DB.prepare('SELECT generation FROM site_state WHERE id = 1').first();
  const gen = s.generation;
  const p = publisher(env);
  try {
    const r = await p.publish(env, gen);
    const t = now();
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE site_state SET published_generation = ?, last_publish_at = ?, last_publish_sha = ?, last_error = NULL,
           dirty = CASE WHEN generation = ? THEN 0 ELSE 1 END, dirty_since = CASE WHEN generation = ? THEN NULL ELSE dirty_since END
         WHERE id = 1`,
      ).bind(gen, t, r.sha, gen, gen),
      auditStmt(env, actor.type, actor.email, 'site.publish', 'site', p.name, null, { generation: gen, sha: r.sha }),
    ]);
    return { ok: true, generation: gen, sha: r.sha };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    await env.DB.batch([
      env.DB.prepare('UPDATE site_state SET last_error = ? WHERE id = 1').bind(msg),
      auditStmt(env, actor.type, actor.email, 'site.publish_failed', 'site', p.name, null, { generation: gen, error: msg }),
    ]);
    return { ok: false, error: msg };
  }
}
