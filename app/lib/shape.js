// The published data files (spec section 9, plan P4.3). The publish writes these into the site
// repository and the generator (app/build/generate.mjs) builds every public page from them.
// They are read ONLY from the public views and the breeds table (spec 4.1), so nothing private
// can reach the repository, and the same database always gives the same bytes, so an unchanged
// file drops out of the commit by its blob SHA.
//
//   data/breeds.json     every breed, with the guide text an operator writes in the admin
//   data/breeders.json   every public breeder, with the profile extras from plan P2.3
//   data/litters.json    every public litter
//   data/puppies.json    every public puppy, with its photos
//
// An uploaded photo is committed beside the data as img/p/<photo id>.<ext>, with its small card
// copy as img/p/<photo id>.card.<ext>. A logo or kennel photo goes to img/b/<breeder id>/ under
// its R2 file name, which changes whenever the breeder replaces it. A photo imported from Wix and
// not yet moved into R2 keeps its Wix address.

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export const DATA_FILES = ['data/breeds.json', 'data/breeders.json', 'data/litters.json', 'data/puppies.json'];

const paras = (s) => String(s || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const text = (o) => `${JSON.stringify(o, null, 1)}\n`;

/** Where an uploaded puppy photo lives in the site, and its card copy. */
export function photoPath(photo) {
  const ext = EXT[photo.content_type] || String(photo.r2_key).split('.').pop().toLowerCase();
  return { src: `img/p/${photo.id}.${ext}`, card: `img/p/${photo.id}.card.${ext}` };
}

/** Where a logo or kennel photo lives in the site, from its R2 key brand/<breeder id>/<name>. */
export function brandPath(breederId, key) {
  if (!key) return null;
  const name = String(key).split('/').pop().toLowerCase();
  const dot = name.lastIndexOf('.');
  return { src: `img/b/${breederId}/${name}`, card: `img/b/${breederId}/${name.slice(0, dot)}.card${name.slice(dot)}` };
}

const byText = (k) => (a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0);

/**
 * Everything a publish writes. files maps each data path to its text. uploads lists every R2
 * object the pages need, as { kind, id, key, path }, with each card copy as its own entry
 * (kind 'photo-card' or 'brand-card') pointing at the full file as a fallback.
 */
export async function exportSite(env) {
  const db = env.DB;
  const site = await db.prepare('SELECT generation FROM site_state WHERE id = 1').first();
  const breeds = (await db.prepare('SELECT id, slug, name, guide FROM breeds ORDER BY name').all()).results;
  const breedSlug = Object.fromEntries(breeds.map((b) => [b.id, b.slug]));
  const breeders = (await db.prepare('SELECT * FROM public_breeders ORDER BY slug').all()).results;
  const breederSlug = Object.fromEntries(breeders.map((b) => [b.breeder_id, b.slug]));
  const raised = {};
  for (const r of (await db.prepare(
    `SELECT bb.breeder_id, br.slug FROM breeder_breeds bb JOIN breeds br ON br.id = bb.breed_id
      WHERE bb.breeder_id IN (SELECT breeder_id FROM public_breeders) ORDER BY br.slug`,
  ).all()).results) (raised[r.breeder_id] ||= []).push(r.slug);
  const litters = (await db.prepare('SELECT * FROM public_litters ORDER BY id').all()).results;
  const puppies = (await db.prepare('SELECT * FROM public_puppies ORDER BY published_at DESC, slug').all()).results;
  const photos = {};
  for (const r of (await db.prepare(
    `SELECT id, puppy_id, r2_key, external_url, content_type, aspect, committed_at FROM photos
      WHERE puppy_id IN (SELECT id FROM public_puppies) ORDER BY puppy_id, position, id`,
  ).all()).results) (photos[r.puppy_id] ||= []).push(r);

  const uploads = [];
  const brand = (b, kind, key) => {
    const p = brandPath(b.breeder_id, key);
    if (!p) return null;
    uploads.push({ kind: 'brand', id: b.breeder_id, key, path: p.src });
    uploads.push({ kind: 'brand-card', id: b.breeder_id, key: `${key}.card`, fallback: key, path: p.card });
    return p;
  };

  const files = {
    'data/breeds.json': text(breeds.map((b) => ({ slug: b.slug, name: b.name, guide: paras(b.guide) }))),
    'data/breeders.json': text(breeders.map((b) => ({
      slug: b.slug, name: b.business_name, city: b.city, state: b.state, phone: b.public_phone, email: b.public_email,
      website: b.website_url, facebook: b.facebook_url, about: paras(b.description),
      logo: brand(b, 'logo', b.logo_key), kennel_photo: brand(b, 'kennel', b.kennel_key), breeds: raised[b.breeder_id] || [],
    }))),
    'data/litters.json': text(litters.map((l) => ({
      id: l.id, breeder: breederSlug[l.breeder_id], breed: breedSlug[l.breed_id], born_on: l.born_on, ready_on: l.ready_on,
      mom_weight_lb: l.mom_weight_lb, dad_weight_lb: l.dad_weight_lb, about: paras(l.description),
    }))),
    'data/puppies.json': text(puppies.map((p) => ({
      slug: p.slug, name: p.name, breeder: breederSlug[p.breeder_id], litter: p.litter_id, sex: p.sex, color: p.color,
      price: p.price_cents == null ? null : p.price_cents / 100, deposit: p.deposit_cents == null ? null : p.deposit_cents / 100,
      availability: p.availability, hypoallergenic: !!p.hypoallergenic, includes: JSON.parse(p.includes_json || '[]'),
      about: paras(p.description), breeder_url: p.breeder_url, legacy_slug: p.legacy_slug || null, published_at: p.published_at,
      photos: (photos[p.id] || []).map((ph) => {
        if (!ph.r2_key) return { src: ph.external_url, card: null, aspect: ph.aspect };
        const at = photoPath(ph);
        uploads.push({ kind: 'photo', id: ph.id, key: ph.r2_key, path: at.src, committed: !!ph.committed_at });
        uploads.push({ kind: 'photo-card', id: ph.id, key: `${ph.r2_key}.card`, fallback: ph.r2_key, path: at.card, committed: !!ph.committed_at });
        return { src: at.src, card: at.card, aspect: ph.aspect };
      }),
    }))),
  };
  uploads.sort(byText('path'));
  return { generation: site.generation, files, uploads, counts: { breeds: breeds.length, breeders: breeders.length, litters: litters.length, puppies: puppies.length } };
}
