// Photos and brand images served from R2 (plan P2.3, decision D11).
//
// Every puppy photo, whether a breeder uploaded it or the Wix import brought it in, lives in R2
// under uploads/<breeder id>/<photo id>.<ext>, with a small ".card" copy beside it when the
// browser made one. The public site serves it at /media/<photo id> and /media/<photo id>/card,
// and only while its puppy is public. A logo or kennel photo lives under brand/<breeder id>/ and
// is served at /brand/<breeder id>/logo or /kennel, to anyone only while the breeder is public.
// A saved parent's photo and a public document (migrations/0050) are served at /media/parent/<id>
// and /media/doc/<id>, only while the parent is on a public litter or the document is public.
//
// Imported only by small Workers, so this file must not import anything heavier than itself.
// The site repository (alexharper24/puppyconnection-site) carries a copy, made by
// app/build/sync-site-repo.mjs.

export const BRAND = { logo: 'logo_key', kennel: 'kennel_key' };

/**
 * A puppy photo by its id, or null when it should answer 404. A photo id never changes its
 * file, so browsers keep it for a day. Older uploads have no card copy and are served whole.
 * A photo copied from Wix keeps its original at r2_key as the record and is served from the
 * copies beside it (ops/photo_copies.py): ".display", 1600 px WebP, for the photo itself, and
 * ".share", 1200 px JPEG, for og:image. A breeder's upload was drawn at 1600 px by the portal
 * and has neither, so it is served whole as before.
 */
export async function serveMedia(env, id, { card = false, share = false } = {}) {
  const photo = await env.DB.prepare(
    // A photo the quality check sent back or is holding is never public (migrations/0018).
    // EXISTS on the one puppy lets D1 look it up by key, 4 rows read, where "puppy_id IN (SELECT id
    // FROM public_puppies)" built the whole view for every photo, 853 rows (measured 2026-10-24, B13).
    "SELECT p.r2_key, p.content_type FROM photos p WHERE p.id = ? AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.id = p.puppy_id) AND (p.quality IS NULL OR p.quality = 'pass')",
  ).bind(id).first();
  if (!photo?.r2_key) return null;
  const k = photo.r2_key;
  const obj = (card && await env.FILES.get(`${k}.card`))
    || (share && await env.FILES.get(`${k}.share`))
    || (!card && await env.FILES.get(`${k}.display`))
    || await env.FILES.get(k);
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

/**
 * A saved mom or dad's photo (migrations/0050), under parents/<breeder id>/ with a ".card" copy.
 * Anyone may have it while the parent is on a public litter (public_parents); otherwise only a
 * caller that allowPrivate(row) says may see it. Returns null when it should answer 404.
 */
export async function serveParentPhoto(env, id, { card = false, allowPrivate = async () => false } = {}) {
  const row = await env.DB.prepare(
    'SELECT d.photo_key, d.breeder_id, EXISTS (SELECT 1 FROM public_parents pp WHERE pp.id = d.id) AS pub FROM parent_dogs d WHERE d.id = ?',
  ).bind(id).first();
  if (!row || !row.photo_key) return null;
  if (!row.pub && !(await allowPrivate(row))) return null;
  const obj = (card && await env.FILES.get(`${row.photo_key}.card`)) || await env.FILES.get(row.photo_key);
  if (!obj) return null;
  return new Response(obj.body, {
    headers: { 'content-type': obj.httpMetadata?.contentType || 'application/octet-stream', 'cache-control': row.pub ? 'public, max-age=86400' : 'private, no-store' },
  });
}

/**
 * A health record, guarantee or pedigree (migrations/0050). The site gives anyone only what
 * public_documents names, a public document of a public puppy or parent, kept under docs/ in R2.
 * The admin passes allowPrivate for operators, so a private one is served only to signed-in staff.
 * The file was checked by its first bytes at upload, and nosniff keeps the browser to that type.
 */
export async function serveDocument(env, id, { allowPrivate = async () => false } = {}) {
  const row = await env.DB.prepare(
    'SELECT d.*, EXISTS (SELECT 1 FROM public_documents pd WHERE pd.id = d.id) AS pub FROM documents d WHERE d.id = ?',
  ).bind(id).first();
  if (!row) return null;
  if (!row.pub && !(await allowPrivate(row))) return null;
  const obj = await env.FILES.get(row.r2_key);
  if (!obj) return null;
  const ext = String(row.r2_key).split('.').pop();
  const name = `${String(row.title || 'document').replace(/[^\w .()-]+/g, '').trim().slice(0, 80) || 'document'}.${ext}`;
  return new Response(obj.body, {
    headers: {
      'content-type': row.content_type, 'x-content-type-options': 'nosniff',
      'content-disposition': `inline; filename="${name}"`,
      // A document marked private later must not stay in a cache for long.
      'cache-control': row.pub ? 'public, max-age=300' : 'private, no-store',
    },
  });
}
