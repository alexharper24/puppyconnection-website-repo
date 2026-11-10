// The public site Worker for the generated pages (spec section 9, decisions D10 and D11).
//
// This is the source of worker/site.js in the site repository, alexharper24/puppyconnection-site,
// copied there by app/build/sync-site-repo.mjs with lib/util.js, lib/stats.js and lib/media.js.
// Change it here and send it across deliberately. Its imports name ../lib/, which is app/lib
// here and lib/ at the root of the site repository.
//
// Cloudflare serves the generated pages straight from the assets folder. This Worker runs only
// for the paths in run_worker_first (wrangler.jsonc there):
//   /                     the home page, because html_handling "none" turns off / -> index.html
//   /index.html           a 301 to /, so Google keeps one address for the home page (2026-11-04)
//   /media/<id>[/card|/share]  a puppy photo from R2, uploaded or imported, only while its puppy is
//                         public. /share is the JPEG for og:image, where a photo has one
//   /media/parent/<id>[/card]  a saved mom or dad's photo, only while it is on a public litter
//   /media/doc/<id>       a document marked public, of a public puppy or parent (migrations/0050)
//   /brand/<id>/<kind>    a breeder's logo or kennel photo, only while the breeder is public
//   /api/build            this build's record, the generation it fetched, for the portal's
//                         build check (app/lib/publish.js, checkBuild), never cached
//   /api/beacon           the view and click count (plan P2.5), which stores a number per puppy
//                         per day and nothing about the visitor
//   /api/report/daily     the daily view and click counts for the client reporting dashboard,
//                         refused with 403 unless x-report-key matches the REPORT_KEY secret
// It reads the database's public views and writes only the count.
//
// The staging site at site.puppyconnection.workers.dev runs app/site/worker.js instead, which
// reads the database live, until Workers Builds is connected to the site repository.

import { recordBeacon } from '../lib/stats.js';
import { serveMedia, serveBrand, serveParentPhoto, serveDocument } from '../lib/media.js';
import { reportDaily } from '../lib/report-daily.js';

const notFound = () => new Response('Not found.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });

// A puppy or parent photo from the edge cache when Cloudflare holds one, so a crawl that asks for hundreds of photos at
// once reads the database and the file store once per photo an hour rather than on every request. A failed first try
// is tried once more. Ahrefs met a 503 on 2026-11-07 and a 500 on 2026-11-02 for photos that load normally (Alex,
// 2026-11-07). An hour at the edge means a photo taken down stays reachable at its address for up to an hour, the
// same as a browser that already holds it for a day. Only a found photo is cached; a 404 never is.
const EDGE_SECONDS = 3600;
async function cachedPhoto(request, ctx, make) {
  if (request.method !== 'GET' || typeof caches === 'undefined') return (await make()) || notFound();
  const key = new Request(new URL(request.url).origin + new URL(request.url).pathname, { method: 'GET' });
  const hit = await caches.default.match(key);
  if (hit) return hit;
  let res;
  try { res = await make(); } catch (e) { console.error('photo first try failed', e); res = await make(); }
  if (!res) return notFound();
  const stored = new Response(res.body, res);
  stored.headers.set('cache-control', `public, max-age=${EDGE_SECONDS}`);
  const out = stored.clone();
  out.headers.set('cache-control', 'public, max-age=86400');
  if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(key, stored));
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/') return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
      if (url.pathname === '/index.html') return Response.redirect(new URL('/' + url.search, url).href, 301);
      const m = url.pathname.match(/^\/media\/([\w-]+)(?:\/(card|share))?$/);
      if (m) return cachedPhoto(request, ctx, () => serveMedia(env, m[1], { card: m[2] === 'card', share: m[2] === 'share' }));
      const pm = url.pathname.match(/^\/media\/parent\/([\w-]+)(\/card)?$/);
      if (pm) return cachedPhoto(request, ctx, () => serveParentPhoto(env, pm[1], { card: !!pm[2] }));
      const dm = url.pathname.match(/^\/media\/doc\/([\w-]+)$/);
      if (dm) return (await serveDocument(env, dm[1])) || notFound();
      const b = url.pathname.match(/^\/brand\/([\w-]+)\/(logo|kennel)$/);
      if (b) return (await serveBrand(env, b[1], b[2], { card: url.searchParams.get('size') === 'card' })) || notFound();
      if (url.pathname === '/api/build') {
        const r = await env.ASSETS.fetch(new Request(new URL('/build.json', url)));
        if (!r.ok) return notFound();
        return new Response(r.body, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      }
      if (url.pathname === '/api/beacon') return (await recordBeacon(request, env)).response;
      // The client reporting dashboard's nightly read of the daily counts, refused without its key.
      if (url.pathname === '/api/report/daily') return await reportDaily(request, env, url);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error(e);
      return new Response('Something went wrong.', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
  },
};
