// The Wix import (spec M8, plan P4.7). Every harvested Wix listing becomes a comped, published
// puppy under the breeder Amber pairs it with, with its photos fetched from Wix, stripped of
// metadata and stored as uploads, then checked: counts match and every photo is present.
//
// It works on a COPY of the database and a folder standing in for R2, never on the live
// database. Moving the copy and the photos to D1 and R2 at launch is a separate, reviewed step
// (docs/launch-checklist.md).
//
//   node app/ops/wix-import.mjs --pairing <file> [options]
//
//   --pairing <file>     which breeder each listing belongs to (shape: dev/fixtures/pairing-made-up.json)
//   --listings <file>    the harvest, default _harvest/data/listings.json
//   --db <file>          the copy to import into, default app/.state/import-copy/puppyconnection.sqlite.
//                        Made from the local D1 database the first time, unless --fresh
//   --files <folder>     the R2 stand-in, default app/.state/import-copy/r2
//   --fresh              start the copy from schema.sql alone instead of the local database
//   --drop-seed          remove the local simulation's seed rows from the copy first, because the
//                        seed is itself a rehearsal of this import and holds the same slugs
//   --image-host <url>   fetch photos from here instead of https://static.wixstatic.com (tests)
//   --limit <n>          import only the first n paired listings (a quick real-Wix check)
//   --allow-unpaired     import what is paired even when some listings are not
//   --dry-run            change nothing and fetch nothing, and print what would happen
//
// Running it again changes nothing that is already in place: ids come from the listing slugs,
// rows are inserted only when missing, and a photo already stored is not fetched again.

import fs from 'node:fs';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { d1, r2, freshSchema, localD1File } from '../dev/node-env.mjs';
import { cleanImage } from '../lib/images.js';
import { dirtyStmt, auditStmt } from '../lib/store.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const REPO = path.resolve(APP, '..');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);

const slugify = (s) => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const isoDate = (s) => { const m = String(s || '').match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/); return m && MONTHS[m[1]] ? `${m[3]}-${String(MONTHS[m[1]]).padStart(2, '0')}-${m[2].padStart(2, '0')}` : null; };
const weight = (v) => { const m = String(v ?? '').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
const cents = (v) => { const n = Number(String(v ?? '').replace(/[$,\s]/g, '')); return v == null || v === '' || !Number.isFinite(n) ? null : Math.round(n * 100); };
const ALIASES = { 'Mini Poodle': 'Miniature Poodle' };
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const NOW = new Date().toISOString().slice(0, 19) + 'Z';

function fail(msg) { console.error(`wix-import: ${msg}`); process.exit(1); }

export async function main() {
  const pairingFile = opt('pairing');
  if (!pairingFile) fail('--pairing <file> is required. The real pairing waits on Amber (decision d8).');
  const listings = JSON.parse(fs.readFileSync(path.resolve(opt('listings', path.join(REPO, '_harvest/data/listings.json'))), 'utf8'));
  const pairing = JSON.parse(fs.readFileSync(path.resolve(pairingFile), 'utf8'));
  const dbFile = path.resolve(opt('db', path.join(APP, '.state/import-copy/puppyconnection.sqlite')));
  const filesDir = path.resolve(opt('files', path.join(APP, '.state/import-copy/r2')));
  const dry = flag('dry-run');
  const imageHost = opt('image-host');
  if (pairing.made_up) console.log('NOTE: this pairing file is marked made_up. It is a test file, not Amber\'s pairing.');

  // ---- check the pairing before touching anything
  const bySlug = Object.fromEntries(listings.map((l) => [l.slug, l]));
  const unknown = Object.keys(pairing.listings || {}).filter((s) => !bySlug[s]);
  if (unknown.length) fail(`the pairing names ${unknown.length} listing(s) the harvest does not have: ${unknown.slice(0, 5).join(', ')}`);
  const noBreeder = Object.entries(pairing.listings).filter(([, k]) => !pairing.breeders?.[k]);
  if (noBreeder.length) fail(`the pairing sends ${noBreeder.length} listing(s) to a breeder it does not define: ${noBreeder.slice(0, 5).map((x) => x.join(' -> ')).join(', ')}`);
  for (const [k, b] of Object.entries(pairing.breeders)) {
    if (!b.business_name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.sign_in_email || '')) fail(`breeder ${k} needs a business_name and a sign_in_email`);
  }
  const emails = Object.values(pairing.breeders).map((b) => b.sign_in_email.toLowerCase());
  if (new Set(emails).size !== emails.length) fail('two breeders in the pairing share a sign-in address');
  const unpaired = listings.filter((l) => !pairing.listings[l.slug]).map((l) => l.slug);
  if (unpaired.length && !flag('allow-unpaired')) fail(`${unpaired.length} listing(s) have no breeder in the pairing (${unpaired.slice(0, 5).join(', ')}). Add them, or pass --allow-unpaired.`);
  let todo = listings.filter((l) => pairing.listings[l.slug]);
  if (opt('limit')) todo = todo.slice(0, Number(opt('limit')));

  // ---- the copy. A dry run works on a throwaway snapshot of whatever the real run would use.
  const exists = fs.existsSync(dbFile);
  let target = dbFile;
  if (dry) target = path.join(os.tmpdir(), `pc-import-dry-${process.pid}.sqlite`);
  else fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  if (dry) fs.rmSync(target, { force: true });
  if (dry && exists) snapshot(dbFile, target);
  if (!exists && !flag('fresh')) { snapshot(localD1File(), target); if (!dry) console.log(`copied the local database to ${dbFile}`); }
  const db = d1(target);
  if (!exists && flag('fresh')) await freshSchema(db);
  const files = r2(filesDir);
  const env = { DB: db, FILES: files };

  if (flag('drop-seed')) {
    const n = (await db.prepare("SELECT COUNT(*) AS n FROM puppies WHERE id LIKE 'seed-%'").first()).n;
    if (n) {
      db.raw.exec('PRAGMA foreign_keys = OFF; BEGIN;');
      for (const t of ['photos', 'puppy_stats', 'checkout_items', 'puppy_holds']) db.raw.exec(`DELETE FROM ${t} WHERE puppy_id LIKE 'seed-%'`);
      db.raw.exec("DELETE FROM puppies WHERE id LIKE 'seed-%'; DELETE FROM litters WHERE id LIKE 'seed-%'; DELETE FROM breeder_breeds WHERE breeder_id LIKE 'seed-%'; DELETE FROM breeder_profiles WHERE breeder_id LIKE 'seed-%'; DELETE FROM breeders WHERE id LIKE 'seed-%';");
      db.raw.exec('COMMIT; PRAGMA foreign_keys = ON;');
      console.log(`removed the ${n} seed puppies from the copy`);
    }
  }

  // ---- plan every row
  const plan = { breeders: [], breeds: [], litters: [], puppies: [], photos: [], conflicts: [] };
  const existingBreeder = {};
  for (const r of (await db.prepare('SELECT id, email FROM breeders').all()).results) existingBreeder[r.email.toLowerCase()] = r.id;
  const breedByName = {};
  for (const r of (await db.prepare('SELECT id, name FROM breeds').all()).results) breedByName[r.name.toLowerCase()] = r.id;
  const slugOwner = {};
  for (const r of (await db.prepare('SELECT id, slug FROM puppies').all()).results) slugOwner[r.slug] = r.id;
  const profileSlugs = new Set((await db.prepare('SELECT slug FROM breeder_profiles WHERE slug IS NOT NULL').all()).results.map((r) => r.slug));

  const breederId = {};
  for (const key of new Set(todo.map((l) => pairing.listings[l.slug]))) {
    const b = pairing.breeders[key];
    const have = existingBreeder[b.sign_in_email.toLowerCase()];
    breederId[key] = have || `wix-b-${slugify(key)}`;
    // A breeder who already signed up keeps their own profile, and the listings join it.
    if (!have) plan.breeders.push({ key, id: breederId[key], ...b, slug: profileSlugs.has(slugify(key)) ? `${slugify(key)}-wix` : slugify(key) });
  }
  const litterIds = new Set();
  for (const l of todo) {
    const key = pairing.listings[l.slug];
    const name = ALIASES[l.breed] || l.breed;
    if (!name) { plan.conflicts.push(`${l.slug} names no breed`); continue; }
    let breedId = breedByName[name.toLowerCase()];
    if (!breedId) { breedId = `breed-${slugify(name)}`; breedByName[name.toLowerCase()] = breedId; plan.breeds.push({ id: breedId, slug: slugify(name), name }); }
    const born = isoDate(l.birthdate);
    const litterId = born ? `wix-l-${slugify(key)}-${slugify(name)}-${born}` : `wix-l-${l.slug}`;
    if (!litterIds.has(litterId)) {
      litterIds.add(litterId);
      plan.litters.push({ id: litterId, breeder_id: breederId[key], breed_id: breedId, born_on: born, ready_on: isoDate(l.ready_date), mom: weight(l.mom_weight), dad: weight(l.dad_weight) });
    }
    const pid = `wix-p-${l.slug}`;
    if (slugOwner[l.slug] && slugOwner[l.slug] !== pid) { plan.conflicts.push(`${l.slug} is already used by puppy ${slugOwner[l.slug]}`); continue; }
    plan.puppies.push({ id: pid, l, breeder_id: breederId[key], litter_id: litterId, isNew: !slugOwner[l.slug] });
    (l.images || []).forEach((url, i) => plan.photos.push({ id: `wix-ph-${l.slug}-${i}`, puppy_id: pid, breeder_id: breederId[key], url, position: i }));
  }

  const haveRows = new Set((await db.prepare("SELECT id FROM photos WHERE id LIKE 'wix-ph-%'").all()).results.map((r) => r.id));
  const fetchNeeded = plan.photos.filter((p) => !haveRows.has(p.id));
  console.log(`${dry ? 'would import' : 'importing'}: ${plan.breeders.length} new breeders (${Object.keys(breederId).length} in all), ${plan.breeds.length} new breeds, `
    + `${plan.litters.length} litters, ${plan.puppies.length} puppies (${plan.puppies.filter((p) => p.isNew).length} new), `
    + `${plan.photos.length} photos (${fetchNeeded.length} to fetch)${unpaired.length ? `, ${unpaired.length} listings left out as unpaired` : ''}`);
  if (plan.conflicts.length) {
    console.log(`conflicts (not imported): ${plan.conflicts.length}\n  ${plan.conflicts.slice(0, 10).join('\n  ')}`);
  }
  if (dry) { db.close(); fs.rmSync(target, { force: true }); return { dry: true, plan, fetchNeeded: fetchNeeded.length, conflicts: plan.conflicts.length }; }

  // ---- write the rows, one transaction
  const S = (sql, ...b) => db.prepare(sql).bind(...b);
  const stmts = [];
  for (const b of plan.breeders) {
    stmts.push(S(`INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
      VALUES (?, ?, 'approved', NULL, ?, 'legacy-wix', NULL, ?, 'wix-import', 1, ?, ?)`, b.id, b.sign_in_email, NOW, NOW, NOW, NOW));
    stmts.push(S(`INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, b.id, b.business_name, b.slug, b.public_phone, b.public_email, b.website, b.city, b.state, NOW));
  }
  for (const b of plan.breeds) stmts.push(S('INSERT OR IGNORE INTO breeds (id, slug, name) VALUES (?, ?, ?)', b.id, b.slug, b.name));
  for (const l of plan.litters) {
    stmts.push(S(`INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, legacy_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom, l.dad, l.id, NOW, NOW));
  }
  for (const p of plan.puppies) {
    const l = p.l;
    stmts.push(S(`INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, price_cents, deposit_cents, description, includes_json, hypoallergenic,
        payment_state, publication_state, availability, published_at, expires_at, legacy_slug, legacy_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'comped', 'published', ?, ?, NULL, ?, ?, ?, ?)`,
    p.id, p.breeder_id, p.litter_id, l.slug, l.puppy_name || l.name, cents(l.price), cents(l.deposit), l.description || null,
    JSON.stringify(l.includes || []), l.hypoallergenic ? 1 : 0, l.placed ? 'placed' : 'available', NOW, l.slug,
    `https://www.puppy-connection.com/product-page/${l.slug}`, NOW, NOW));
  }
  await db.batch(stmts);

  // ---- photos: fetch, strip, store, then record
  let fetched = 0, failed = [];
  const queue = fetchNeeded.slice();
  const host = imageHost ? imageHost.replace(/\/$/, '') : null;
  async function worker() {
    for (let p = queue.shift(); p; p = queue.shift()) {
      const url = host ? p.url.replace(/^https:\/\/static\.wixstatic\.com/, host) : p.url;
      try {
        let res;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          res = await fetch(url, { headers: { 'user-agent': 'puppyconnection-import' } });
          if (res.ok) break;
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const img = cleanImage(new Uint8Array(await res.arrayBuffer()));
        const key = `uploads/${p.breeder_id}/${p.id}.${EXT[img.type]}`;
        await files.put(key, img.bytes, { httpMetadata: { contentType: img.type } });
        const aspect = img.size && img.size.h ? Math.round((img.size.w / img.size.h) * 1000) / 1000 : null;
        await S(`INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, r2_key, external_url, content_type, bytes, position, aspect, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, p.id, p.breeder_id, p.puppy_id, key, p.url, img.type, img.bytes.length, p.position, aspect, NOW).run();
        fetched += 1;
      } catch (e) { failed.push(`${p.id}: ${e.message}`); }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await db.batch([dirtyStmt(env), auditStmt(env, 'system', 'wix-import', 'import.wix', 'site', 'wix', null,
    { puppies: plan.puppies.length, photos: plan.photos.length, fetched, failed: failed.length, made_up: !!pairing.made_up })]);
  if (failed.length) console.log(`photos that could not be fetched: ${failed.length}\n  ${failed.slice(0, 10).join('\n  ')}`);

  // ---- prove it
  const check = await verify(db, files, todo, plan);
  db.close();
  return { plan, fetched, failed: failed.length, ...check };
}

/** Counts match the harvest, every photo row has its file, and every puppy is public. */
export async function verify(db, files, todo, plan) {
  const lines = [];
  let ok = true;
  const line = (name, want, got) => { const pass = want === got; ok = ok && pass; lines.push(`${pass ? 'ok  ' : 'BAD '} ${name}: expected ${want}, found ${got}`); };
  const want = plan.puppies.map((p) => p.id);
  const q = async (sql) => (await db.prepare(sql).first()).n;
  const inList = (ids) => ids.map((x) => `'${x.replace(/'/g, "''")}'`).join(',') || "''";
  line('imported puppies', want.length, await q(`SELECT COUNT(*) AS n FROM puppies WHERE id IN (${inList(want)})`));
  line('of them public on the site', want.length, await q(`SELECT COUNT(*) AS n FROM public_puppies WHERE id IN (${inList(want)})`));
  line('placed puppies', todo.filter((l) => l.placed && plan.puppies.some((p) => p.l === l)).length, await q(`SELECT COUNT(*) AS n FROM puppies WHERE availability = 'placed' AND id IN (${inList(want)})`));
  const wantPhotos = plan.photos.length;
  line('photo rows', wantPhotos, await q(`SELECT COUNT(*) AS n FROM photos WHERE puppy_id IN (${inList(want)})`));
  const rows = (await db.prepare(`SELECT id, r2_key, bytes FROM photos WHERE puppy_id IN (${inList(want)})`).all()).results;
  let present = 0;
  for (const r of rows) { const o = r.r2_key && await files.get(r.r2_key); if (o && o.size === r.bytes && o.size > 0) present += 1; }
  line('photos present in the file store, at the size recorded', wantPhotos, present);
  console.log(lines.join('\n'));
  return { ok, lines };
}

/** A consistent copy of a SQLite file, including anything still in its write-ahead log. */
function snapshot(from, to) {
  const src = new DatabaseSync(from, { readOnly: true });
  src.exec(`VACUUM INTO '${to.replace(/'/g, "''")}'`);
  src.close();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((r) => { if (r.dry) process.exit(r.conflicts ? 1 : 0); process.exit(r.ok && !r.failed && !r.plan.conflicts.length ? 0 : 1); })
    .catch((e) => { console.error(e); process.exit(1); });
}
