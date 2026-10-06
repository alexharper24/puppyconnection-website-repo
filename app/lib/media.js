// Photos and brand images served from R2 (plan P2.3, decision D11).
//
// Every puppy photo, whether a breeder uploaded it or the Wix import brought it in, lives in R2
// under uploads/<breeder id>/<photo id>.<ext>, with a small ".card" copy beside it when the
// browser made one. The public site serves it at /media/<photo id> and /media/<photo id>/card,
// and only while its puppy is public. A logo or kennel photo lives under brand/<breeder id>/ and
// is served at /brand/<breeder id>/logo or /kennel, to anyone only while the breeder is public.
//
// Imported only by small Workers, so this file must not import anything heavier than itself.
// The site repository (alexharper24/puppyconnection-site) carries a copy, made by
// app/build/sync-site-repo.mjs.

export const BRAND = { logo: 'logo_key', kennel: 'kennel_key' };

/**
 * A puppy photo by its id, or null when it should answer 404. A photo id never changes its
 * file, so browsers keep it for a day. Older uploads have no card copy and are served whole.
 */
export async function serveMedia(env, id, { card = false } = {}) {
  const photo = await env.DB.prepare(
    'SELECT p.r2_key, p.content_type FROM photos p WHERE p.id = ? AND p.puppy_id IN (SELECT id FROM public_puppies)',
  ).bind(id).first();
  if (!photo?.r2_key) return null;
  const obj = (card && await env.FILES.get(`${photo.r2_key}.card`)) || await env.FILES.get(photo.r2_key);
  if (!obj) return null;
  return new Response(obj.body, {
    headers: { 'content-type': obj.httpMetadata?.contentType || photo.content_type, 'cache-control': 'public, max-age=86400' },
  });
}

/**
 * A logo or kennel photo. Anyone may have it while the breeder is public; otherwise only a
 * caller that allowPrivate() says may see it (the breeder themselves, or an operator).
 * Returns null when it should answer 404.
 */
export async function serveBrand(env, breederId, kind, { card = false, allowPrivate = async () => false } = {}) {
  const col = BRAND[kind];
  if (!col || !breederId) return null;
  const row = await env.DB.prepare(
    `SELECT p.${col} AS k, EXISTS (SELECT 1 FROM public_breeders pb WHERE pb.breeder_id = p.breeder_id) AS pub
       FROM breeder_profiles p WHERE p.breeder_id = ?`,
  ).bind(breederId).first();
  if (!row || !row.k) return null;
  if (!row.pub && !(await allowPrivate())) return null;
  const obj = (card && await env.FILES.get(`${row.k}.card`)) || await env.FILES.get(row.k);
  if (!obj) return null;
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': row.pub ? 'public, max-age=86400' : 'private, no-store',
    },
  });
}
