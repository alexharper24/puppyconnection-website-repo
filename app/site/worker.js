// The public site for the hosted test deployment. Serves the concept's pages (copied and
// patched by dev/build-site.mjs), and builds data/data.js live from the database's public
// views on every request, so a listing appears the moment it is paid for. It also serves
// uploaded photos, but only those belonging to a public puppy.
//
// This stands in for spec section 9 (the cron publish, the commit and the generator) while
// the site is in test. It reads the database and never writes to it. It is deployed without
// DEV_MODE, so gate() lets every request through, the same as the real public site.

import { gate, json } from '../lib/util.js';
import { buildExport, siteDataJs } from '../lib/export.js';

// data.js is built from several queries, and every page loads it. One build is kept per
// isolate for MEMO_MS, and browsers keep it for a minute and then revalidate by ETag, so
// moving between pages costs nothing. A new listing shows within about a minute and a half.
// The Cache API would be the next step, but it does nothing on workers.dev.
const MEMO_MS = 30_000;
let memo = null;

async function buildDataJs(request, env) {
  const origin = new URL(request.url).origin;
  const baseRes = await env.ASSETS.fetch(new Request(`${origin}/data/base.json`));
  const base = await baseRes.json();
  const exp = await buildExport(env, `${origin}/media`);
  const body = siteDataJs(base, exp, 'Built live from the database public views.');
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(body));
  const etag = `"${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')}"`;
  return { at: Date.now(), origin, body, etag };
}

async function dataJs(request, env) {
  const origin = new URL(request.url).origin;
  if (!memo || memo.origin !== origin || Date.now() - memo.at > MEMO_MS) memo = await buildDataJs(request, env);
  const headers = {
    'content-type': 'application/javascript; charset=utf-8',
    'cache-control': 'public, max-age=60, stale-while-revalidate=300',
    etag: memo.etag,
  };
  // Cloudflare weakens the ETag to W/"..." when it compresses the response, so compare the value.
  const asked = (request.headers.get('if-none-match') || '').split(',').map((s) => s.trim().replace(/^W\//, ''));
  if (asked.includes(memo.etag)) return new Response(null, { status: 304, headers });
  return new Response(memo.body, { headers });
}

// Stylesheets and scripts are linked with ?v=N and the number changes with the file, so a
// versioned request can be kept for a year. Images keep their names when replaced, so they
// get a week. Pages keep the platform default and revalidate on every visit.
function cacheFor(url) {
  if (/^\/(css|js)\//.test(url.pathname) && url.searchParams.has('v')) return 'public, max-age=31536000, immutable';
  if (url.pathname.startsWith('/img/') || url.pathname === '/favicon.ico') return 'public, max-age=604800';
  return null;
}

async function asset(request, env, url) {
  const res = await env.ASSETS.fetch(request);
  const cc = cacheFor(url);
  if (!cc || (res.status !== 200 && res.status !== 304)) return res;
  const out = new Response(res.body, res);
  out.headers.set('cache-control', cc);
  return out;
}

async function media(env, id, card) {
  const photo = await env.DB.prepare(
    'SELECT p.r2_key, p.content_type FROM photos p WHERE p.id = ? AND p.puppy_id IN (SELECT id FROM public_puppies)',
  ).bind(id).first();
  if (!photo?.r2_key) return new Response('Not found.', { status: 404 });
  // The card copy is the small one the portal makes at upload. Older photos have none and
  // are served whole. A photo id never changes its file, so browsers keep it for a day.
  const obj = (card && await env.FILES.get(`${photo.r2_key}.card`)) || await env.FILES.get(photo.r2_key);
  if (!obj) return new Response('Not found.', { status: 404 });
  return new Response(obj.body, {
    headers: { 'content-type': obj.httpMetadata?.contentType || photo.content_type, 'cache-control': 'public, max-age=86400' },
  });
}

export default {
  async fetch(request, env) {
    const locked = gate(request, env);
    if (locked) return locked;
    const url = new URL(request.url);
    try {
      if (url.pathname === '/data/data.js') return await dataJs(request, env);
      const m = url.pathname.match(/^\/media\/([\w-]+)(\/card)?$/);
      if (m) return await media(env, m[1], !!m[2]);
      if (url.pathname === '/data/base.json') return new Response('Not found.', { status: 404 });
      return await asset(request, env, url);
    } catch (e) {
      console.error(e);
      return json({ error: 'Something went wrong.' }, 500);
    }
  },
};
