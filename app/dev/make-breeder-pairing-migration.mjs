// Write migration 0023, the second breeder pairing, from the 2026-10-18 Wix re-inventory
// (hs-seo-data/puppyconnection/2026-10-18-wix-reinventory) and the staging rows as they are now.
//
//   node app/dev/make-breeder-pairing-migration.mjs <reinventory folder> [--out migrations/0023_breeder_pairing_round_2.sql]
//
// Reads assign.json (each staging puppy's kennel and corrections), assign_new.json and
// new_listings.json (the live listings staging lacks), listings.json (their full text) and
// kennels.json (the new kennels' profile facts, checked by hand). Staging is read through
// wrangler, so the litters split and moved are the ones the database holds today. It refuses to run
// once the migration is applied, because the new listings' slugs are then taken.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanListing } from '../lib/wixtext.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const SRC = path.resolve(process.argv[2] || '');
const outArg = process.argv.indexOf('--out');
const out = path.resolve(APP, outArg > 0 ? process.argv[outArg + 1] : 'migrations/0023_breeder_pairing_round_2.sql');
const read = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

function d1(query) {
  const args = [WRANGLER, 'd1', 'execute', 'puppyconnection', '--json', '--command', query, '--remote', '--config', path.join(APP, 'portal/wrangler.hosted.jsonc')];
  const raw = execFileSync(process.execPath, args, { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(raw.slice(raw.indexOf('[')))[0].results;
}

const assign = read('assign.json');
const assignNew = read('assign_new.json');
const newListings = Object.fromEntries(read('new_listings.json').map((l) => [l.slug, l]));
const fullText = Object.fromEntries(read('listings.json').listings.map((l) => [l.slug, l.description]));
const kennels = read('kennels.json');

const STAMP = '2026-10-18T20:00:00Z';
const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const slugify = (s) => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const isoDate = (s) => { const m = String(s || '').match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/); return m && MONTHS[m[1]] ? `${m[3]}-${String(MONTHS[m[1]]).padStart(2, '0')}-${m[2].padStart(2, '0')}` : null; };
const weight = (v) => { const m = String(v ?? '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
const cents = (v) => { const n = Number(String(v ?? '').replace(/[$,\s]/g, '')); return v == null || v === '' || !Number.isFinite(n) ? null : Math.round(n * 100); };

// Breeders already in the directory, by the website their listings print.
const EXISTING = {
  'chainolakescompanions.com': 'seed-chainolakescompanions', 'heartlandminischnauzers.com': 'seed-heartlandminischnauzers',
  'blessyourpawspuppies.com': 'seed-blessyourpawspuppies', 'kingdomfamilycompanions.com': 'seed-kingdomfamilycompanions',
  'windingstreamscompanions.com': 'seed-windingstreamscompanions', 'cornerstonecavaliers.com': 'seed-cornerstonecavaliers',
};
const alias = {};
for (const [k, v] of Object.entries(kennels)) for (const a of v.aliases || []) alias[a] = k;
const breederOf = (key) => (key == null ? null : EXISTING[key] || kennels[alias[key] || key]?.id || (() => { throw new Error(`no breeder for ${key}`); })());
const kennelById = Object.fromEntries(Object.values(kennels).map((k) => [k.id, k]));

// ---- staging as it is now
const pups = Object.fromEntries(d1('SELECT p.id, p.slug, p.breeder_id, p.litter_id, p.availability, p.price_cents, p.publication_state, p.breeder_url, l.breed_id FROM puppies p JOIN litters l ON l.id = p.litter_id').map((r) => [r.id, r]));
const litters = Object.fromEntries(d1('SELECT * FROM litters').map((r) => [r.id, r]));
const breeds = Object.fromEntries(d1('SELECT id, name FROM breeds').map((r) => [r.name.toLowerCase(), r.id]));
const slugsTaken = new Set(Object.values(pups).map((p) => p.slug));
const maxSeed = Math.max(...Object.keys(pups).filter((id) => /^seed-p-\d+$/.test(id)).map((id) => Number(id.slice(7))));

const sql = [];
const section = (t) => sql.push('', `-- ${t}`);

// ---- 1. the new kennels
section('New breeders. Each Responsible Dog Breeder Network member kennel gets its own page, and so do Teapup, Sweet Puppy Paws and County Line Kennel. Sign-in addresses are <slug>@breeders.test, like the other imported breeders, until each kennel signs up.');
for (const k of Object.values(kennels)) {
  sql.push(`INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES (${q(k.id)}, ${q(`${k.slug}@breeders.test`)}, 'approved', ${q(STAMP)}, ${q(STAMP)}, 'legacy-wix', ${q(STAMP)}, ${q(STAMP)}, 'migration 0023', 1, ${q(STAMP)}, ${q(STAMP)});`);
  sql.push(`INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES (${q(k.id)}, ${q(k.business_name)}, ${q(k.slug)}, ${q(k.public_phone)}, ${q(k.public_email)}, ${q(k.website_url)}, ${q(k.city)}, ${q(k.state)}, ${q(k.facebook_url)}, ${q(STAMP)}); -- from ${k.source}`);
}

// ---- 2. moves, by litter
const moves = {};          // puppy id -> { to, url }
const archive = [];
const touchedBreeds = new Set();
for (const a of assign) {
  const p = pups[a.id];
  if (!p) throw new Error(`staging has no ${a.id}`);
  if (a.changes.archive) { archive.push([a, a.changes.archive]); continue; }
  const to = breederOf(a.kennel);
  if (to) touchedBreeds.add(`${to}|${p.breed_id}`);
  if (to && to !== p.breeder_id) moves[a.id] = { to, url: a.url || kennelById[to]?.website_url || null, basis: a.basis, kennel: a.kennel };
}
section(`Moves. ${Object.keys(moves).length} puppies go to the kennel their live Wix listing names. A litter whose puppies all go to one kennel moves whole; otherwise the moving puppies get a copy of their litter under their kennel.`);
sql.push('PRAGMA defer_foreign_keys = true;');
const byLitter = {};
for (const p of Object.values(pups)) (byLitter[p.litter_id] ||= []).push(p);
let split = 0, whole = 0;
for (const [lid, members] of Object.entries(byLitter)) {
  const finals = members.map((p) => (moves[p.id] ? moves[p.id].to : p.breeder_id));
  const moving = members.filter((p) => moves[p.id]);
  if (!moving.length) continue;
  const l = litters[lid];
  if (new Set(finals).size === 1) {
    whole += 1;
    sql.push('-- group');
    sql.push(`UPDATE litters SET breeder_id = ${q(finals[0])}, updated_at = ${q(STAMP)}, version = version + 1 WHERE id = ${q(lid)} AND breeder_id <> ${q(finals[0])};`);
    for (const p of moving) sql.push(movePuppy(p, lid));
  } else {
    for (const to of new Set(moving.map((p) => moves[p.id].to))) {
      split += 1;
      sql.push('-- group');
      const nid = `${lid}--${kennelById[to]?.slug || to.replace(/^seed-/, '')}`;
      sql.push(`INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES (${q(nid)}, ${q(to)}, ${q(l.breed_id)}, ${q(l.born_on)}, ${q(l.ready_on)}, ${q(l.mom_weight_lb)}, ${q(l.dad_weight_lb)}, ${q(l.description)}, ${q(l.archived_at)}, ${q(l.legacy_id)}, ${q(STAMP)}, ${q(STAMP)}, 1);`);
      for (const p of moving.filter((x) => moves[x.id].to === to)) sql.push(movePuppy(p, nid));
    }
  }
}
function movePuppy(p, litterId) {
  const m = moves[p.id];
  // A link to the puppy's own page on the network site (set by migration 0015) is more exact than
  // the kennel's page, so it stays.
  if (/responsibledogbreeder\.com\/puppies\//.test(p.breeder_url || '')) m.url = null;
  return [
    `UPDATE puppies SET breeder_id = ${q(m.to)}, litter_id = ${q(litterId)}${m.url ? `, breeder_url = ${q(m.url)}` : ''}, updated_at = ${q(STAMP)}, version = version + 1 WHERE id = ${q(p.id)} AND breeder_id <> ${q(m.to)}; -- ${p.slug}: ${m.basis}`,
    `UPDATE photos SET breeder_id = ${q(m.to)} WHERE puppy_id = ${q(p.id)};`,
    `UPDATE puppy_videos SET breeder_id = ${q(m.to)} WHERE puppy_id = ${q(p.id)};`,
    `UPDATE listing_reports SET breeder_id = ${q(m.to)} WHERE puppy_id = ${q(p.id)};`,
  ].join('\n');
}

// ---- 3. status and price from the live listing
section('Status and price from the live Wix listing. The placed_at triggers (migration 0019) stamp each puppy marked placed.');
let nStatus = 0, nPrice = 0;
for (const a of assign) {
  if (a.changes.archive) continue;
  if (a.changes.availability) { nStatus += 1; sql.push(`UPDATE puppies SET availability = ${q(a.changes.availability)}, updated_at = ${q(STAMP)}, version = version + 1 WHERE id = ${q(a.id)} AND availability <> ${q(a.changes.availability)}; -- ${a.slug}`); }
  if (a.changes.price_cents != null) { nPrice += 1; sql.push(`UPDATE puppies SET price_cents = ${a.changes.price_cents}, updated_at = ${q(STAMP)}, version = version + 1 WHERE id = ${q(a.id)} AND price_cents IS NOT ${a.changes.price_cents}; -- ${a.slug}, was ${a.price_cents}`); }
}

// ---- 4. archives
section(`Archives. ${archive.length} puppies are no longer in the live Wix store: still available or reserved here, under Peaceful Paws or the unassigned breeder, or adopted under the network with no text naming a kennel.`);
for (const [a, why] of archive) sql.push(`UPDATE puppies SET publication_state = 'archived', updated_at = ${q(STAMP)}, version = version + 1 WHERE id = ${q(a.id)} AND publication_state <> 'archived'; -- ${a.slug}: ${why}`);

// ---- 5. the live listings staging lacks
section(`New listings. ${assignNew.length} live Wix listings staging did not have, added like the seeded puppies: comped, published, photos served from Wix until the photo move.`);
let n = maxSeed;
const ALIASES = { 'mini poodle': 'miniature poodle', 'mini dachshund': 'miniature dachshund', shihpoo: 'shih-poo' };
for (const a of assignNew) {
  const w = newListings[a.slug];
  if (!w) throw new Error(`new_listings.json lacks ${a.slug}`);
  if (slugsTaken.has(a.slug)) throw new Error(`slug ${a.slug} is already taken`);
  const l = cleanListing({ ...w, description: fullText[a.slug] || w.description });
  const raw = String(l.breed || '').replace(/\s+/g, ' ').trim();
  const key = ALIASES[raw.toLowerCase()] || raw.toLowerCase();
  let breedId = breeds[key];
  if (!breedId) {
    const name = key === 'shih-poo' ? 'Shih-poo' : raw;
    breedId = `breed-${slugify(name)}`;
    breeds[key] = breedId;
    sql.push(`INSERT OR IGNORE INTO breeds (id, slug, name) VALUES (${q(breedId)}, ${q(slugify(name))}, ${q(name)});`);
  }
  const to = breederOf(a.kennel) || 'seed-unassigned';
  touchedBreeds.add(`${to}|${breedId}`);
  n += 1;
  const pid = `seed-p-${String(n).padStart(4, '0')}`;
  sql.push('-- group');
  const lid = `seed-l-solo-${a.slug}`;
  const availability = { sold: 'placed', reserved: 'pending', available: 'available' }[a.status];
  sql.push(`INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES (${q(lid)}, ${q(to)}, ${q(breedId)}, ${q(isoDate(l.birthdate))}, ${q(isoDate(l.ready_date))}, ${q(weight(l.mom_weight))}, ${q(weight(l.dad_weight))}, ${q(l.parent_colors || null)}, NULL, ${q(STAMP)}, ${q(STAMP)});`);
  sql.push(`INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES (${q(pid)}, ${q(to)}, ${q(lid)}, ${q(a.slug)}, ${q(l.puppy_name || l.name)}, ${q(l.form_color || null)}, ${q(cents(a.price_stated ?? l.price))}, ${q(cents(l.deposit))},
  ${q(l.description)}, ${q(a.url || kennelById[to]?.website_url || null)}, ${q(JSON.stringify(l.includes || []))}, ${l.hypoallergenic ? 1 : 0},
  'comped', 'published', ${q(availability)}, ${q(STAMP)}, NULL, ${q(a.slug)}, ${q(STAMP)}, ${q(STAMP)}); -- ${a.basis || 'no breeder named, so unassigned'}`);
  (l.images || []).forEach((url, i) => {
    sql.push(`INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES (${q(`${pid}-img${i}`)}, ${q(to)}, ${q(pid)}, ${q(url)}, ${i}, 1.333, 1400, 1050, ${q(STAMP)});`);
  });
}

// ---- 6. breeds each breeder raises, for the breeder pages
section('Breeds each breeder raises, from the puppies it now holds.');
for (const k of [...touchedBreeds].sort()) {
  const [b, br] = k.split('|');
  if (b !== 'seed-unassigned') sql.push(`INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES (${q(b)}, ${q(br)});`);
}

// ---- 7. Peaceful Paws
section('Peaceful Paws Puppies. No live listing names it (Alex, 2026-10-18: "if peaceful paws puppies are no more remove them"), so it is suspended, which takes it off the public site, and its phone is corrected from 574-457-8231, the number on teapup.com, to the one on its own site.');
sql.push(`UPDATE breeder_profiles SET public_phone = '517-320-4080', updated_at = ${q(STAMP)}, version = version + 1 WHERE breeder_id = 'seed-peacefulpawspuppies' AND public_phone IS NOT '517-320-4080';`);
sql.push(`UPDATE breeders SET status = 'suspended', status_reason = 'No live Wix listing names it, so it is off the public site (Alex, 2026-10-18)', decided_at = ${q(STAMP)}, decided_by = 'migration 0023', updated_at = ${q(STAMP)}, version = version + 1 WHERE id = 'seed-peacefulpawspuppies' AND status <> 'suspended';`);

section('Mark the site changed, so the next scheduled publish rebuilds it (as migration 0022 does).');
sql.push("UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;");

const head = `-- 2026-10-18. Breeder pairing, second round, written by dev/make-breeder-pairing-migration.mjs from the
-- Wix re-inventory in hs-seo-data/puppyconnection/2026-10-18-wix-reinventory (review.html). Alex, 2026-10-18:
-- "show kennels in rdbn show each with its own breeder page. if those listings without a breeder are not on the
-- current live site remove them. for toast if it links to that kennel then it should get its own ... if peaceful
-- paws puppies are no more remove them. elowin, malcolm, and smurf are ambers other website kingdom family
-- companion. and then proceed with the rest."
-- Each puppy goes to the kennel whose address its live listing prints, checked against the phone on the
-- kennel's own site or network page. Smurf is held, because its only contact is Bless Your Paws' number.
-- Run once on staging after a backup, with ops/d1-apply.mjs, because the moves need PRAGMA defer_foreign_keys,
-- which hosted D1 honors only inside one d1 execute --command (README), and a "-- group" line starts statements
-- that must go in the same command. Every insert is OR IGNORE and every update names its row, so a second
-- run changes nothing it has not already changed.`;
fs.writeFileSync(out, `${head}\n${sql.join('\n')}\n`);
console.log(`${path.relative(APP, out)}: ${Object.keys(kennels).length} breeders, ${Object.keys(moves).length} moves (${whole} litters whole, ${split} split), ${nStatus} statuses, ${nPrice} prices, ${archive.length} archives, ${assignNew.length} new listings`);
