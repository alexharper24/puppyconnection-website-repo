// The published data files (spec section 9, plan P4.3). The publish writes these into the site
// repository (alexharper24/puppyconnection-site, decision D10) and the generator
// (build/generate.mjs there, app/build/generate.mjs here) builds every public page from them.
// They are read ONLY from the public views and the breeds table (spec 4.1), so nothing private
// can reach the repository, and the same database always gives the same bytes, so an unchanged
// file drops out of the commit by its blob SHA.
//
//   data/breeds.json     every breed, with the guide text an operator writes in the admin
//   data/breeders.json   every public breeder, with the profile extras from plan P2.3
//   data/litters.json    every public litter, with its saved mom and dad (migrations/0050)
//   data/puppies.json    every public puppy, with its photos and public documents
//
// No photo is committed (decision D11). Every photo with a file in R2, uploaded by a breeder or
// brought in by the Wix import, is named as media/<photo id> with its card copy at
// media/<photo id>/card, which the site Worker serves from R2 (lib/media.js). A logo or kennel
// photo is named as brand/<breeder id>/logo or /kennel, with a v= that changes when the breeder
// replaces it. A Wix photo not imported yet keeps its Wix address. The addresses are relative, so
// they work from every page, which all sit at the root.

import { brandUrl } from './store.js';
import { videoUrls } from './stream.js';
import { gonePuppies } from './inactivity.js';
import { testLabels, DOC_KINDS, docVersion } from './parents.js';
import { breedList } from './healthtests.js';

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
  const breeds = (await db.prepare('SELECT id, slug, name, guide, photo_id FROM breeds ORDER BY name').all()).results;
  const breedSlug = Object.fromEntries(breeds.map((b) => [b.id, b.slug]));
  // Workplan A2. Puppies the inactivity schedule took off the site. Their old addresses forward to
  // the breed page, so each breed carries the slugs (all of which were public before).
  const gone = {};
  for (const g of await gonePuppies(env)) (gone[g.breed] ||= []).push(g.legacy_slug ? { slug: g.slug, legacy_slug: g.legacy_slug } : { slug: g.slug });
  const breeders = (await db.prepare('SELECT * FROM public_breeders ORDER BY slug').all()).results;
  const breederSlug = Object.fromEntries(breeders.map((b) => [b.breeder_id, b.slug]));
  const raised = {};
  for (const r of (await db.prepare(
    `SELECT bb.breeder_id, br.slug FROM breeder_breeds bb JOIN breeds br ON br.id = bb.breed_id
      WHERE bb.breeder_id IN (SELECT breeder_id FROM public_breeders) ORDER BY br.slug`,
  ).all()).results) (raised[r.breeder_id] ||= []).push(r.slug);
  const litters = (await db.prepare('SELECT * FROM public_litters ORDER BY id').all()).results;
  const puppies = (await db.prepare('SELECT * FROM public_puppies ORDER BY published_at DESC, slug').all()).results;
  // Workplan A8. When an adopted puppy leaves the sitemap and becomes noindex.
  const indexDays = Number((await db.prepare("SELECT value FROM settings WHERE key = 'adopted_index_days'").first())?.value ?? 30);
  const unlistAfter = (p) => (p.availability === 'placed' && p.placed_at ? new Date(Date.parse(p.placed_at) + indexDays * 86400000).toISOString().slice(0, 19) + 'Z' : null);
  const photos = {};
  // Size and focus point from ops/measure_photos.py, carried only once a photo has been measured.
  const framing = (ph) => (ph.width && ph.height ? { w: ph.width, h: ph.height, fx: ph.focus_x ?? 0.5, fy: ph.focus_y ?? 0.38 } : {});
  // Only photos that passed the quality check or were never checked (migrations/0018).
  for (const r of (await db.prepare(
    `SELECT id, puppy_id, r2_key, external_url, aspect, width, height, focus_x, focus_y FROM photos
      WHERE puppy_id IN (SELECT id FROM public_puppies) AND (quality IS NULL OR quality = 'pass') ORDER BY puppy_id, position, id`,
  ).all()).results) (photos[r.puppy_id] ||= []).push(r);
  const photoSrc = {};
  for (const list of Object.values(photos)) for (const r of list) photoSrc[r.id] = r.r2_key ? photoPath(r).src : r.external_url;
  // Workplan A3. Only videos Stream has finished with, on public puppies.
  const videos = {};
  for (const r of (await db.prepare(
    `SELECT puppy_id, stream_uid, duration_s FROM puppy_videos
      WHERE status = 'ready' AND puppy_id IN (SELECT id FROM public_puppies) ORDER BY puppy_id, position, id`,
  ).all()).results) (videos[r.puppy_id] ||= []).push({ ...videoUrls(env, r.stream_uid, env.PORTAL_ORIGIN || ''), duration: r.duration_s });

  // Workplan A19 and A20. The saved parents of public litters, and only public documents of public
  // puppies and parents, each read from its public view. A parent photo is named media/parent/<id>
  // with a v= that changes with the file, and a document media/doc/<id>.
  const docs = { puppy: {}, parent: {} };
  // The v= changes when the breeder turns the file (Alex, 2026-11-01), so a family's browser fetches it fresh.
  for (const d of (await db.prepare('SELECT id, puppy_id, parent_id, kind, title, content_type, r2_key FROM public_documents ORDER BY id').all()).results) {
    const one = { title: d.title, kind: DOC_KINDS[d.kind] || d.kind, src: `media/doc/${d.id}?v=${docVersion(d.r2_key)}`, pdf: d.content_type === 'application/pdf' };
    if (d.puppy_id) (docs.puppy[d.puppy_id] ||= []).push(one); else (docs.parent[d.parent_id] ||= []).push(one);
  }
  const breedName = Object.fromEntries([...breedList().map((b) => [b.slug, b.name]), ...breeds.map((b) => [b.slug, b.name])]);
  const parents = {};
  for (const d of (await db.prepare('SELECT * FROM public_parents ORDER BY id').all()).results) {
    const v = d.photo_key ? String(d.photo_key).split('/').pop().split('.')[0].slice(-10).toLowerCase() : null;
    parents[d.id] = {
      name: d.name, breed: breedName[d.breed] || null, registry: d.registry || null, registration: d.registration || null,
      tests: testLabels(d.health_tests_json), other_tests: paras(d.health_other), pedigree: paras(d.pedigree),
      photo: v ? { src: `media/parent/${d.id}?v=${v}`, card: `media/parent/${d.id}/card?v=${v}` } : null, documents: docs.parent[d.id] || [],
    };
  }

  const files = {
    // The breed's chosen photo (migrations/0043), named by the same src its puppy's photo carries,
    // and only while that photo is public. Otherwise the site picks one from the listings.
    'data/breeds.json': text(breeds.map((b) => ({ slug: b.slug, name: b.name, guide: paras(b.guide), ...(photoSrc[b.photo_id] ? { photo: photoSrc[b.photo_id] } : {}), ...(gone[b.slug] ? { gone: gone[b.slug] } : {}) }))),
    'data/breeders.json': text(breeders.map((b) => ({
      slug: b.slug, name: b.business_name, city: b.city, state: b.state, phone: b.public_phone, email: b.public_email,
      website: b.website_url, facebook: b.facebook_url, about: paras(b.description),
      logo: brandPath(b.breeder_id, 'logo', b.logo_key), kennel_photo: brandPath(b.breeder_id, 'kennel', b.kennel_key), breeds: raised[b.breeder_id] || [],
    }))),
    'data/litters.json': text(litters.map((l) => ({
      id: l.id, breeder: breederSlug[l.breeder_id], breed: breedSlug[l.breed_id], born_on: l.born_on, ready_on: l.ready_on,
      mom_weight_lb: l.mom_weight_lb, dad_weight_lb: l.dad_weight_lb, about: paras(l.description),
      mom: parents[l.mom_id] || null, dad: parents[l.dad_id] || null,
    }))),
    'data/puppies.json': text(puppies.map((p) => ({
      slug: p.slug, name: p.name, breeder: breederSlug[p.breeder_id], litter: p.litter_id, sex: p.sex, color: p.color, coat: p.coat || null,
      price: p.price_cents == null ? null : p.price_cents / 100, deposit: p.deposit_cents == null ? null : p.deposit_cents / 100,
      availability: p.availability, hypoallergenic: !!p.hypoallergenic, includes: JSON.parse(p.includes_json || '[]'),
      about: paras(p.description), breeder_url: p.breeder_url, legacy_slug: p.legacy_slug || null, published_at: p.published_at,
      registry: p.registry || null, markings: p.markings || null, health: paras(p.health_notes), vaccinations: paras(p.vaccinations),
      deworming: paras(p.deworming), disclosures: paras(p.disclosures), deposit_url: p.deposit_url || null, videos: videos[p.id] || [],
      placed_at: p.placed_at || null, unlist_after: unlistAfter(p), documents: docs.puppy[p.id] || [],
      photos: (photos[p.id] || []).map((ph) => ({ ...(ph.r2_key
        ? { ...photoPath(ph), aspect: ph.aspect }
        : { src: ph.external_url, card: null, aspect: ph.aspect }), ...framing(ph) })),
    }))),
  };
  return { generation: site.generation, files, counts: { breeds: breeds.length, breeders: breeders.length, litters: litters.length, puppies: puppies.length } };
}
