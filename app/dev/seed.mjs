// Build the local simulation's starting data from the concept's data/data.js.
//
//   node app/dev/seed.mjs            writes app/.state/seed.sql (setup.mjs runs it)
//
// This is also the first rehearsal of the Wix migration (spec M8): every harvested listing
// becomes a comped, published puppy in a litter, under the breeder its listing names.
// Listings that name no breeder go under one "Unassigned" breeder, because the concept's
// pairing is staged and the real one waits on Amber (spec decision d8).
//
// Sign-in addresses are <slug>@breeders.test so nothing in the simulation can reach a real
// inbox. Public phone and email are the ones the live Wix listings already show.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.join(REPO, 'app/.state/seed.sql');

const src = fs.readFileSync(path.join(REPO, 'data/data.js'), 'utf8');
const grab = (name) => JSON.parse(src.match(new RegExp(`window\\.${name}\\s*=\\s*(\\[.*?\\]);`, 's'))[1]);
const LISTINGS = grab('PC_LISTINGS');
const BREEDS = grab('PC_BREEDS');

const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const NOW = new Date().toISOString().slice(0, 19) + 'Z';
const EXPIRES = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 19) + 'Z';
const slugify = (s) => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
function isoDate(s) {
  const m = String(s || '').match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (!m || !MONTHS[m[1]]) return null;
  return `${m[3]}-${String(MONTHS[m[1]]).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}
const weight = (v) => { const m = String(v ?? '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };

const sql = ['PRAGMA defer_foreign_keys = true;'];

// Operator. The same address is DEV_IDENTITY in admin/.dev.vars, which is how the local
// admin Worker stands in for Cloudflare Access.
sql.push(`INSERT OR IGNORE INTO people (email, name, role, added_at) VALUES ('amber@puppyconnection.test', 'Amber (simulation)', 'owner', ${q(NOW)});`);

const breedId = {};
for (const b of BREEDS) {
  breedId[b.name] = `breed-${b.slug}`;
  sql.push(`INSERT OR IGNORE INTO breeds (id, slug, name) VALUES (${q(breedId[b.name])}, ${q(b.slug)}, ${q(b.name)});`);
}

const breeders = {};
function breederFor(l) {
  const key = l.breeder_domain || 'unassigned';
  if (breeders[key]) return breeders[key];
  const slug = l.breeder_domain ? slugify(l.breeder_domain.replace(/\.[a-z]+$/, '')) : 'unassigned';
  const b = {
    id: `seed-${slug}`, slug, email: `${slug}@breeders.test`,
    name: l.breeder_name || 'Unassigned Wix listings',
    website: l.breeder_domain ? `https://${l.breeder_domain}` : null,
    phone: l.breeder_phone || null, pubEmail: l.breeder_email || null,
    description: l.breeder_domain ? null : 'Listings imported from Wix whose breeder is not confirmed yet.',
  };
  breeders[key] = b;
  sql.push(`INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
VALUES (${q(b.id)}, ${q(b.email)}, 'approved', ${q(NOW)}, ${q(NOW)}, 'legacy-wix', ${q(NOW)}, ${q(NOW)}, 'seed', 1, ${q(NOW)}, ${q(NOW)});`);
  sql.push(`INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, description, updated_at)
VALUES (${q(b.id)}, ${q(b.name)}, ${q(b.slug)}, ${q(b.phone)}, ${q(b.pubEmail)}, ${q(b.website)}, ${q(b.description)}, ${q(NOW)});`);
  return b;
}

const ALIASES = { 'Mini Poodle': 'Miniature Poodle' };
const litters = {};
let n = 0;
for (const l of LISTINGS) {
  const b = breederFor(l);
  // "Mini Poodle" is the same breed under the alias the keyword config already maps. Any
  // other breed a listing names but PC_BREEDS lacks gets its own row rather than being dropped.
  const breedName = ALIASES[l.breed] || l.breed;
  if (!breedId[breedName]) {
    breedId[breedName] = `breed-${slugify(breedName)}`;
    sql.push(`INSERT OR IGNORE INTO breeds (id, slug, name) VALUES (${q(breedId[breedName])}, ${q(slugify(breedName))}, ${q(breedName)});`);
    console.log(`added breed "${breedName}", named by ${l.slug} but missing from PC_BREEDS`);
  }
  const bid = breedId[breedName];
  const litterKey = l.litter || `solo-${l.slug}`;
  const litterId = `seed-l-${slugify(litterKey)}`;
  if (!litters[litterId]) {
    litters[litterId] = true;
    sql.push(`INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, legacy_id, created_at, updated_at)
VALUES (${q(litterId)}, ${q(b.id)}, ${q(bid)}, ${q(isoDate(l.birthdate))}, ${q(isoDate(l.ready_date))}, ${q(weight(l.mom_weight))}, ${q(weight(l.dad_weight))}, ${q(l.litter)}, ${q(NOW)}, ${q(NOW)});`);
  }
  n += 1;
  const pid = `seed-p-${String(n).padStart(4, '0')}`;
  const availability = l.status === 'adopted' ? 'placed' : l.status === 'pending' ? 'pending' : 'available';
  sql.push(`INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
VALUES (${q(pid)}, ${q(b.id)}, ${q(litterId)}, ${q(l.slug)}, ${q(l.puppy_name || l.name)}, ${q(l.price != null ? Math.round(l.price * 100) : null)},
  ${q(l.deposit != null ? Math.round(l.deposit * 100) : null)}, ${q(l.description)}, ${q(l.breeder_url)}, ${q(JSON.stringify(l.includes || []))}, ${l.hypoallergenic ? 1 : 0},
  'comped', 'published', ${q(availability)}, ${q(NOW)}, ${q(EXPIRES)}, ${q(l.slug)}, ${q(NOW)}, ${q(NOW)});`);
  (l.images || []).forEach((url, i) => {
    sql.push(`INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, created_at)
VALUES (${q(`${pid}-img${i}`)}, ${q(b.id)}, ${q(pid)}, ${q(url)}, ${i}, ${q(i === 0 ? l.lead_aspect : null)}, ${q(NOW)});`);
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sql.join('\n') + '\n');
console.log(`seed.sql: ${Object.keys(breedId).length} breeds, ${Object.keys(breeders).length} breeders, ${Object.keys(litters).length} litters, ${n} puppies`);
