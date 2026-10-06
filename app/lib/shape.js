// The published data files (spec section 9, plan P4.3). The publish writes these into the site
// repository (alexharper24/puppyconnection-site, decision D10) and the generator
// (build/generate.mjs there, app/build/generate.mjs here) builds every public page from them.
// They are read ONLY from the public views and the breeds table (spec 4.1), so nothing private
// can reach the repository, and the same database always gives the same bytes, so an unchanged
// file drops out of the commit by its blob SHA.
//
//   data/breeds.json     every breed, with the guide text an operator writes in the admin
//   data/breeders.json   every public breeder, with the profile extras from plan P2.3
//   data/litters.json    every public litter
//   data/puppies.json    every public puppy, with its photos
//
// No photo is committed (decision D11). Every photo with a file in R2, uploaded by a breeder or
// brought in by the Wix import, is named as media/<photo id> with its card copy at
// media/<photo id>/card, which the site Worker serves from R2 (lib/media.js). A logo or kennel
// photo is named as brand/<breeder id>/logo or /kennel, with a v= that changes when the breeder
// replaces it. A Wix photo not imported yet keeps its Wix address. The addresses are relative, so
// they work from every page, which all sit at the root.

import { brandUrl } from './store.js';

export const DATA_FILES = ['data/breeds.json', 'data/breeders.json', 'data/litters.json', 'data/puppies.json'];

const paras = (s) => String(s || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const text = (o) => `${JSON.stringify(o, null, 1)}\n`;

/** Where the site serves a puppy photo that has a file in R2, and its card copy. */
export function photoPath(photo) {
  return { src: `media/${photo.id}`, card: `media/${photo.id}/card` };
}

/** Where the site serves a logo or kennel photo, from its R2 key brand/<breeder id>/<name>. */
export function brandPath(breederId, kind, key) {
  const url = brandUrl('', breederId, kind, key);
  if (!url) return null;
  const [where, v] = url.slice(1).split('?');
  return { src: `${where}?${v}`, card: `${where}?size=card&${v}` };
}

/** Everything a publish writes. files maps each data path to its text. */
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
    `SELECT id, puppy_id, r2_key, external_url, aspect FROM photos
      WHERE puppy_id IN (SELECT id FROM public_puppies) ORDER BY puppy_id, position, id`,
  ).all()).results) (photos[r.puppy_id] ||= []).push(r);


  const files = {
    'data/breeds.json': text(breeds.map((b) => ({ slug: b.slug, name: b.name, guide: paras(b.guide) }))),
    'data/breeders.json': text(breeders.map((b) => ({
      slug: b.slug, name: b.business_name, city: b.city, state: b.state, phone: b.public_phone, email: b.public_email,
      website: b.website_url, facebook: b.facebook_url, about: paras(b.description),
      logo: brandPath(b.breeder_id, 'logo', b.logo_key), kennel_photo: brandPath(b.breeder_id, 'kennel', b.kennel_key), breeds: raised[b.breeder_id] || [],
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
      photos: (photos[p.id] || []).map((ph) => (ph.r2_key
        ? { ...photoPath(ph), aspect: ph.aspect }
        : { src: ph.external_url, card: null, aspect: ph.aspect })),
    }))),
  };
  return { generation: site.generation, files, counts: { breeds: breeds.length, breeders: breeders.length, litters: litters.length, puppies: puppies.length } };
}
