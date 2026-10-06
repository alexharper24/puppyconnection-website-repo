// The public data, read only from the views (spec 4.1), in the shape the concept's
// data/data.js uses so the existing pages render it unchanged. Shared by the admin's
// /api/export (which the local preview script reads) and the hosted site Worker, which
// serves it live. The real build replaces this with the generator's export (spec 9).

import { slugify } from './util.js';
import { brandUrl } from './store.js';

/**
 * The address the concept groups a breeder under, meaning their website's host, or a
 * stand-in "<slug>.puppyconnection" when they have none (dev/site-copy.mjs keeps the stand-in
 * from showing as a website).
 */
export function siteDomain(b) {
  try { return b.website_url ? new URL(b.website_url).hostname.replace(/^www\./, '') : `${b.slug}.puppyconnection`; } catch { return `${b.slug}.puppyconnection`; }
}

/** The slug the public site's breeder page answers to, breeder.html?slug=<this> (plan P2.2). */
export function siteBreederSlug(b) {
  return slugify(siteDomain(b).replace(/\.[a-z]+$/, ''));
}

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

/** mediaBase is where uploaded photos are served from, such as "https://portal.../media". */
export async function buildExport(env, mediaBase) {
  const breeders = (await env.DB.prepare('SELECT * FROM public_breeders').all()).results;
  const byBreeder = Object.fromEntries(breeders.map((b) => [b.breeder_id, b]));
  const litters = (await env.DB.prepare('SELECT l.*, br.name AS breed FROM public_litters l JOIN breeds br ON br.id = l.breed_id').all()).results;
  const byLitter = Object.fromEntries(litters.map((l) => [l.id, l]));
  const puppies = (await env.DB.prepare('SELECT * FROM public_puppies ORDER BY published_at DESC, slug').all()).results;
  const photos = {};
  if (puppies.length) {
    const rows = (await env.DB.prepare(
      'SELECT id, puppy_id, r2_key, external_url, aspect FROM photos WHERE puppy_id IN (SELECT id FROM public_puppies) ORDER BY puppy_id, position',
    ).all()).results;
    for (const r of rows) (photos[r.puppy_id] ||= []).push(r);
  }
  const perLitter = {};
  for (const p of puppies) perLitter[p.litter_id] = (perLitter[p.litter_id] || 0) + 1;
  const domainOf = siteDomain;

  const listings = puppies.map((p) => {
    const b = byBreeder[p.breeder_id];
    const l = byLitter[p.litter_id] || {};
    const ph = photos[p.id] || [];
    return {
      slug: p.slug, name: `${p.name} - ${l.breed}`, price: p.price_cents == null ? null : p.price_cents / 100,
      in_stock: p.availability !== 'placed', birthdate: fmtDate(l.born_on), ready_date: fmtDate(l.ready_on),
      deposit: p.deposit_cents == null ? null : p.deposit_cents / 100,
      mom_weight: l.mom_weight_lb != null ? `${l.mom_weight_lb} lbs` : null,
      dad_weight: l.dad_weight_lb != null ? `${l.dad_weight_lb} lbs` : null,
      breeder_phone: b.public_phone, breeder_email: b.public_email, hypoallergenic: !!p.hypoallergenic,
      includes: JSON.parse(p.includes_json || '[]'), description: p.description,
      images: ph.map((x) => (x.r2_key ? `${mediaBase}/${x.id}` : x.external_url)),
      breeder_domain: b.slug === 'unassigned' ? null : domainOf(b), puppy_name: p.name, breed: l.breed,
      litter: perLitter[p.litter_id] > 1 ? p.litter_id : null, demo_breeder: null,
      status: p.availability === 'placed' ? 'adopted' : p.availability, note: null,
      breeder_name: b.slug === 'unassigned' ? null : b.business_name, breeder_url: p.breeder_url,
      breeder_url_tier: p.breeder_url ? 'puppy' : null, lead_aspect: ph[0]?.aspect || 1.5,
    };
  });
  // Plan P2.3. The optional extras ride along in each profile for the site to use. The site
  // shows the logo today (dev/site-copy.mjs). The kennel photo, breeds and Facebook page have
  // no place on the concept's pages yet and wait for the generated pages (P4.3).
  const brandBase = mediaBase.replace(/\/media$/, '');
  const raised = {};
  for (const r of (await env.DB.prepare(
    `SELECT bb.breeder_id, br.name FROM breeder_breeds bb JOIN breeds br ON br.id = bb.breed_id
      WHERE bb.breeder_id IN (SELECT breeder_id FROM public_breeders) ORDER BY br.name`,
  ).all()).results) (raised[r.breeder_id] ||= []).push(r.name);
  const profiles = breeders.filter((b) => b.slug !== 'unassigned').map((b) => ({
    slug: siteBreederSlug(b), name: b.business_name, people: [b.city, b.state].filter(Boolean).join(', '),
    kennel: b.business_name, body: String(b.description || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean),
    logo: brandUrl(brandBase, b.breeder_id, 'logo', b.logo_key), kennel_photo: brandUrl(brandBase, b.breeder_id, 'kennel', b.kennel_key),
    breeds: raised[b.breeder_id] || [], facebook: b.facebook_url || null,
  }));
  const site = await env.DB.prepare('SELECT generation FROM site_state WHERE id = 1').first();
  return { generation: site.generation, listings, profiles };
}

/**
 * data/data.js for the concept's pages. The breed and profile records keep the concept's
 * own copy (guides, photos), with counts recomputed from what is public now, and new breeders'
 * profiles added. base is { breeds, profiles } read from the concept's data/data.js.
 */
export function siteDataJs(base, exp, note) {
  const breeds = base.breeds.map((b) => ({ ...b }));
  const counts = {};
  for (const l of exp.listings) counts[l.breed] = (counts[l.breed] || 0) + 1;
  for (const b of breeds) { b.live_count = counts[b.name] || 0; b.demo_count = counts[b.name] || 0; }
  for (const name of Object.keys(counts)) {
    if (!breeds.some((b) => b.name === name)) {
      breeds.push({ name, slug: slugify(name), live_count: counts[name], demo_count: counts[name], guide: [], photo: null, photo_aspect: null });
    }
  }
  const profiles = base.profiles.slice();
  for (const p of exp.profiles) if (!profiles.some((x) => x.slug === p.slug)) profiles.push(p);
  return `// ${note}\nwindow.PC_LISTINGS=${JSON.stringify(exp.listings)};\nwindow.PC_BREEDS=${JSON.stringify(breeds)};\nwindow.PC_BREEDERS=${JSON.stringify(profiles)};\n`;
}
