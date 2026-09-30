// The public site for the hosted test deployment. Serves the concept's pages (copied and
// patched by dev/build-site.mjs), and builds data/data.js live from the database's public
// views on every request, so a listing appears the moment it is paid for. It also serves
// uploaded photos, but only those belonging to a public puppy.
//
// This stands in for spec section 9 (the cron publish, the commit and the generator) while
// the site is in test. It reads the database and never writes to it.

import { gate, json } from '../lib/util.js';
import { buildExport, siteDataJs } from '../lib/export.js';

async function dataJs(request, env) {
  const origin = new URL(request.url).origin;
  const baseRes = await env.ASSETS.fetch(new Request(`${origin}/data/base.json`));
  const base = await baseRes.json();
  const exp = await buildExport(env, `${origin}/media`);
  return new Response(siteDataJs(base, exp, 'Built live from the database public views.'), {
    headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function media(env, id) {
  const photo = await env.DB.prepare(
    'SELECT p.r2_key, p.content_type FROM photos p WHERE p.id = ? AND p.puppy_id IN (SELECT id FROM public_puppies)',
  ).bind(id).first();
  if (!photo?.r2_key) return new Response('Not found.', { status: 404 });
  const obj = await env.FILES.get(photo.r2_key);
  if (!obj) return new Response('Not found.', { status: 404 });
  return new Response(obj.body, { headers: { 'content-type': photo.content_type, 'cache-control': 'public, max-age=300' } });
}

export default {
  async fetch(request, env) {
    const locked = gate(request, env);
    if (locked) return locked;
    const url = new URL(request.url);
    try {
      if (url.pathname === '/data/data.js') return await dataJs(request, env);
      const m = url.pathname.match(/^\/media\/([\w-]+)$/);
      if (m) return await media(env, m[1]);
      if (url.pathname === '/data/base.json') return new Response('Not found.', { status: 404 });
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error(e);
      return json({ error: 'Something went wrong.' }, 500);
    }
  },
};
