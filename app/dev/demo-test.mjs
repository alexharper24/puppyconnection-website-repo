// The demo data and Reset demo data (plan P5.1), and the seed's breeder names.
//
// Part 1 runs lib/demo.js against a copy of the local database on Node (dev/node-env.mjs), with
// DEV_MODE staging, since the reset refuses every other mode. It adds a made-up visitor breeder
// with a litter, puppy, photo, payment, views, a note and a sign-in, then proves the reset backs
// up first, removes every breeder that is not seed data, loads the three demo breeders at their
// stages, and leaves the seed listings, breeds, settings, terms and operators exactly as they were.
// Part 2 asks the local admin on 8788, which runs DEV_MODE local, and proves it refuses.
//
//   node app/dev/demo-test.mjs        after node app/dev/setup.mjs, with pc-admin on 8788

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { d1, r2, localD1File } from './node-env.mjs';
import { resetDemo, demoResetAllowed, RESET_PHRASE } from '../lib/demo.js';

const ADMIN = 'http://localhost:8788';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-demo-'));
let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

const SEED_TABLES = {
  breeders: "SELECT * FROM breeders WHERE id LIKE 'seed-%' ORDER BY id",
  breeder_profiles: "SELECT * FROM breeder_profiles WHERE breeder_id LIKE 'seed-%' ORDER BY breeder_id",
  litters: "SELECT * FROM litters WHERE breeder_id LIKE 'seed-%' ORDER BY id",
  puppies: "SELECT * FROM puppies WHERE breeder_id LIKE 'seed-%' ORDER BY id",
  photos: "SELECT * FROM photos WHERE breeder_id LIKE 'seed-%' ORDER BY id",
  breeds: 'SELECT * FROM breeds ORDER BY id',
  settings: 'SELECT * FROM settings ORDER BY key',
  terms_versions: 'SELECT * FROM terms_versions ORDER BY version',
  people: 'SELECT * FROM people ORDER BY email',
};

try {
  // ---------------------------------------------------------------- part 1, the reset on Node
  const snap = path.join(TMP, 'copy.sqlite');
  const src = new DatabaseSync(localD1File(), { readOnly: true });
  src.exec(`VACUUM INTO '${snap.replace(/'/g, "''")}'`);
  src.close();
  const db = d1(snap);
  const FILES = r2();
  const q = (sql, ...b) => db.raw.prepare(sql).all(...b);
  const one = (sql, ...b) => db.raw.prepare(sql).get(...b);
  const count = (sql, ...b) => one(sql, ...b).n;

  // The seed's names (task 0): a breeder with only a domain gets a name made from it.
  const name = (id) => one('SELECT business_name AS n FROM breeder_profiles WHERE breeder_id = ?', id)?.n;
  check('a breeder named only by its domain gets a readable name', name('seed-heartlandminischnauzers') === 'Heartland Mini Schnauzers', name('seed-heartlandminischnauzers'));
  check('... and so do the other three', name('seed-cornerstonecavaliers') === 'Cornerstone Cavaliers' && name('seed-blessyourpawspuppies') === 'Bless Your Paws Puppies'
    && name('seed-windingstreamscompanions') === 'Winding Streams Companions');
  const unassigned = q("SELECT breeder_id FROM breeder_profiles WHERE business_name = 'Unassigned Wix listings'").map((r) => r.breeder_id);
  check('"Unassigned Wix listings" names only the listings with no breeder', unassigned.length === 1 && unassigned[0] === 'seed-unassigned', unassigned.join(', '));

  // A visitor who signed up through the portal, with something in every table the reset clears.
  const t = new Date().toISOString().slice(0, 19) + 'Z';
  db.raw.exec(`
    INSERT INTO breeders (id, email, status, email_verified_at, created_at, updated_at) VALUES ('01VISITORTEST', 'visitor@breeders.test', 'approved', '${t}', '${t}', '${t}');
    INSERT INTO breeder_profiles (breeder_id, business_name, slug, logo_key, updated_at) VALUES ('01VISITORTEST', 'Visitor Test Kennel', 'visitor-test-kennel', 'brand/01VISITORTEST/logo-x.png', '${t}');
    INSERT INTO breeder_breeds (breeder_id, breed_id) VALUES ('01VISITORTEST', 'breed-cavapoo');
    INSERT INTO litters (id, breeder_id, breed_id, created_at, updated_at) VALUES ('01VLITTER', '01VISITORTEST', 'breed-cavapoo', '${t}', '${t}');
    INSERT INTO puppies (id, breeder_id, litter_id, slug, name, price_cents, payment_state, publication_state, published_at, created_at, updated_at)
      VALUES ('01VPUPPY', '01VISITORTEST', '01VLITTER', 'visitor-test-puppy', 'Visitor Pup', 100000, 'paid', 'published', '${t}', '${t}', '${t}');
    INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES ('01VPHOTO', '01VISITORTEST', '01VPUPPY', 'uploads/01VISITORTEST/01VPHOTO.jpg', 'image/jpeg', 0, '${t}');
    INSERT INTO checkouts (id, breeder_id, status, stripe_session_id, stripe_payment_intent_id, price_id, quantity, unit_amount_cents, amount_total_cents, created_at)
      VALUES ('01VCHECKOUT', '01VISITORTEST', 'paid', 'cs_sim_visitor', 'pi_sim_visitor', 'price_sim_listing', 1, 1499, 1499, '${t}');
    INSERT INTO checkout_items (checkout_id, puppy_id, breeder_id) VALUES ('01VCHECKOUT', '01VPUPPY', '01VISITORTEST');
    INSERT INTO payments (stripe_payment_intent_id, checkout_id, amount_cents, status, created_at, updated_at) VALUES ('pi_sim_visitor', '01VCHECKOUT', 1499, 'disputed', '${t}', '${t}');
    INSERT INTO disputes (id, payment_intent, checkout_id, status, opened_at, updated_at) VALUES ('dp_visitor', 'pi_sim_visitor', '01VCHECKOUT', 'needs_response', '${t}', '${t}');
    INSERT INTO sim_sessions (id, status, payment_status, client_reference_id, price_id, quantity, unit_amount, amount_total, currency, success_url, cancel_url, created, expires_at)
      VALUES ('cs_sim_visitor', 'complete', 'paid', '01VCHECKOUT', 'price_sim_listing', 1, 1499, 1499, 'usd', '/s', '/c', 1, 2);
    INSERT INTO puppy_stats (puppy_id, day, views, clicks) VALUES ('01VPUPPY', '2026-10-01', 5, 1);
    INSERT INTO puppy_stats (puppy_id, day, views, clicks) VALUES ('seed-p-0001', '2026-10-01', 2, 0);
    INSERT INTO operator_notes (id, breeder_id, author, body, created_at) VALUES ('01VNOTE', '01VISITORTEST', 'amber@puppyconnection.test', 'visitor note', '${t}');
    INSERT INTO account_requests (id, breeder_id, kind, created_at) VALUES ('01VREQ', '01VISITORTEST', 'close', '${t}');
    INSERT INTO sessions (token_hash, breeder_id, created_at, expires_at, last_seen_at) VALUES ('visitor-session', '01VISITORTEST', '${t}', '2099-01-01T00:00:00Z', '${t}');
    INSERT INTO login_tokens (token_hash, email, purpose, created_at, expires_at) VALUES ('visitor-signup', 'someone@breeders.test', 'signup', '${t}', '2099-01-01T00:00:00Z');
    INSERT INTO dev_mailbox (to_addr, subject, body, sent_at) VALUES ('visitor@breeders.test', 'hello', 'body', '${t}');
  `);
  await FILES.put('uploads/01VISITORTEST/01VPHOTO.jpg', new Uint8Array([1, 2, 3]));
  await FILES.put('uploads/01VISITORTEST/01VPHOTO.jpg.card', new Uint8Array([1, 2]));
  await FILES.put('brand/01VISITORTEST/logo-x.png', new Uint8Array([4]));

  const seedBefore = Object.fromEntries(Object.entries(SEED_TABLES).map(([k, sql]) => [k, JSON.stringify(q(sql))]));
  const nonSeedBefore = count("SELECT COUNT(*) AS n FROM breeders WHERE id NOT LIKE 'seed-%'");
  const seedPuppies = count("SELECT COUNT(*) AS n FROM puppies WHERE breeder_id LIKE 'seed-%'");
  check('the copy has seed listings and breeders that are not seed data', seedPuppies >= 273 && nonSeedBefore >= 1, `${seedPuppies} seed puppies, ${nonSeedBefore} others`);

  // Refused outside staging, before anything is backed up or changed.
  for (const mode of [undefined, 'local', 'hosted-test', 'hosted-open', 'hosted-access', 'Staging']) {
    let err = null;
    try { await resetDemo({ DB: db, FILES, DEV_MODE: mode }, 'amber@puppyconnection.test', RESET_PHRASE); } catch (e) { err = e; }
    check(`refused with DEV_MODE ${mode === undefined ? 'unset (production)' : mode}`, err && err.status === 403 && /only on the staging copy/.test(err.message), err && err.message);
  }
  check('only staging allows it', demoResetAllowed({ DEV_MODE: 'staging' }) && !demoResetAllowed({}) && !demoResetAllowed({ DEV_MODE: 'local' }));
  for (const typed of [undefined, '', 'reset demo', 'RESET', 'yes']) {
    let err = null;
    try { await resetDemo({ DB: db, FILES, DEV_MODE: 'staging' }, 'amber@puppyconnection.test', typed); } catch (e) { err = e; }
    check(`refused when the confirmation is ${JSON.stringify(typed)}`, err && err.status === 400 && /Type RESET DEMO/.test(err.message), err && err.message);
  }
  check('a refusal backs nothing up and changes nothing', (await FILES.list({ prefix: 'backups/' })).objects.length === 0
    && count("SELECT COUNT(*) AS n FROM breeders WHERE id NOT LIKE 'seed-%'") === nonSeedBefore);

  // The reset.
  const env = { DB: db, FILES, DEV_MODE: 'staging' };
  const r = await resetDemo(env, 'amber@puppyconnection.test', ` ${RESET_PHRASE} `);
  check('the reset answers ok with the backup it took', r.ok && /^backups\/\d{4}-\d\d-\d\d\.json\.gz$/.test(r.backup), JSON.stringify(r));
  const bk = await FILES.get(r.backup);
  const dump = bk && JSON.parse(zlib.gunzipSync(Buffer.from(await bk.arrayBuffer())).toString('utf8'));
  check('the backup was taken BEFORE the reset, so it still holds the visitor', !!dump && dump.tables.breeders.some((b) => b.id === '01VISITORTEST')
    && dump.tables.breeders.length === JSON.parse(seedBefore.breeders).length + nonSeedBefore, dump ? `${dump.tables.breeders.length} breeders` : 'no backup');
  check('the reset reports what it removed', r.removed.breeders === nonSeedBefore && r.removed.files >= 3, JSON.stringify(r.removed));

  const others = q("SELECT id FROM breeders WHERE id NOT LIKE 'seed-%' ORDER BY id").map((x) => x.id);
  check('every breeder that is not seed data is gone, and the three demo breeders are back', JSON.stringify(others) === JSON.stringify(['demo-buttercup', 'demo-maplebrook', 'demo-thistledown']), others.join(', '));
  for (const [tbl, col] of [['litters', 'breeder_id'], ['puppies', 'breeder_id'], ['photos', 'breeder_id'], ['checkouts', 'breeder_id'], ['breeder_breeds', 'breeder_id'],
    ['operator_notes', 'breeder_id'], ['account_requests', 'breeder_id'], ['breeder_profiles', 'breeder_id']]) {
    check(`nothing of the visitor's is left in ${tbl}`, count(`SELECT COUNT(*) AS n FROM ${tbl} WHERE ${col} = '01VISITORTEST'`) === 0);
  }
  check('their payment, dispute and practice checkout session are gone', count("SELECT COUNT(*) AS n FROM payments WHERE checkout_id = '01VCHECKOUT'") === 0
    && count("SELECT COUNT(*) AS n FROM disputes WHERE id = 'dp_visitor'") === 0 && count("SELECT COUNT(*) AS n FROM sim_sessions WHERE id = 'cs_sim_visitor'") === 0);
  check('sign-ins, sessions and the test mailbox are cleared', count('SELECT COUNT(*) AS n FROM sessions') === 0 && count('SELECT COUNT(*) AS n FROM login_tokens') === 0
    && count('SELECT COUNT(*) AS n FROM dev_mailbox') === 0);
  check('view counts are cleared except the demo ones', count("SELECT COUNT(*) AS n FROM puppy_stats WHERE puppy_id NOT LIKE 'demo-%'") === 0);
  check("the visitor's photo, its card copy and their logo are removed from storage", !(await FILES.get('uploads/01VISITORTEST/01VPHOTO.jpg'))
    && !(await FILES.get('uploads/01VISITORTEST/01VPHOTO.jpg.card')) && !(await FILES.get('brand/01VISITORTEST/logo-x.png')));

  for (const [k, before] of Object.entries(seedBefore)) check(`seed ${k} are exactly as they were`, JSON.stringify(q(SEED_TABLES[k])) === before);
  check('no foreign key is left dangling', q('PRAGMA foreign_key_check').length === 0, JSON.stringify(q('PRAGMA foreign_key_check').slice(0, 3)));

  // The three stages.
  const b = (id) => one('SELECT b.*, p.* FROM breeders b JOIN breeder_profiles p ON p.breeder_id = b.id WHERE b.id = ?', id);
  const terms = one("SELECT value FROM settings WHERE key = 'terms_version'").value;
  const fee = Number(one("SELECT value FROM settings WHERE key = 'fee_cents'").value);
  const bc = b('demo-buttercup'), th = b('demo-thistledown'), mb = b('demo-maplebrook');
  check('Buttercup Lane Puppies is signing up: email checked, profile part filled, not submitted', bc.status === 'pending' && bc.email_verified_at && !bc.profile_submitted_at
    && bc.business_name === 'Buttercup Lane Puppies' && bc.city && !bc.public_phone && bc.email.endsWith('@breeders.test'));
  check('Thistledown Pups is waiting for approval with the current terms accepted', th.status === 'pending' && th.profile_submitted_at && th.terms_version === terms && th.terms_accepted_at
    && th.public_phone && th.city && th.state === 'IN');
  check('Maple Brook Doodles is approved with a slug, logo and kennel photo', mb.status === 'approved' && mb.slug === 'maple-brook-doodles' && mb.logo_key && mb.kennel_key);
  check('Maple Brook has two litters', count("SELECT COUNT(*) AS n FROM litters WHERE breeder_id = 'demo-maplebrook'") === 2);
  const pups = Object.fromEntries(q(`SELECT p.*, (SELECT COUNT(*) FROM photos f WHERE f.puppy_id = p.id) AS photos FROM puppies p WHERE breeder_id = 'demo-maplebrook'`).map((p) => [p.name, p]));
  check('three puppies are listed through the practice payment', ['Maple', 'Biscuit', 'Clover'].every((n) => pups[n].payment_state === 'paid' && pups[n].publication_state === 'published' && pups[n].photos === 1));
  check('Biscuit is placed', pups.Biscuit.availability === 'placed');
  check('Pepper is a draft with a photo, ready to pay for', pups.Pepper.publication_state === 'draft' && pups.Pepper.photos === 1);
  check('Juniper is a draft that still needs a photo', pups.Juniper.publication_state === 'draft' && pups.Juniper.photos === 0);
  const co = one("SELECT * FROM checkouts WHERE id = 'demo-co-maplebrook'");
  check('the practice payment is three listing fees, paid and fulfilled', co.status === 'paid' && co.fulfilled_at && co.quantity === 3 && co.amount_total_cents === 3 * fee
    && one("SELECT amount_cents AS n FROM payments WHERE checkout_id = 'demo-co-maplebrook'").n === 3 * fee, JSON.stringify(co));
  check('the listed puppies have views and clicks', count("SELECT SUM(views) AS n FROM puppy_stats WHERE puppy_id LIKE 'demo-%'") > 20
    && count("SELECT SUM(clicks) AS n FROM puppy_stats WHERE puppy_id LIKE 'demo-%'") > 0);
  check('Maple Brook has a private operator note', count("SELECT COUNT(*) AS n FROM operator_notes WHERE breeder_id = 'demo-maplebrook'") === 1);
  const pub = q("SELECT name FROM public_puppies WHERE breeder_id = 'demo-maplebrook' ORDER BY name").map((x) => x.name);
  check('the public site shows the three listed puppies and no drafts', JSON.stringify(pub) === JSON.stringify(['Biscuit', 'Clover', 'Maple']), pub.join(', '));
  check('the two breeders still pending are not on the public site', count("SELECT COUNT(*) AS n FROM public_breeders WHERE breeder_id IN ('demo-buttercup', 'demo-thistledown')") === 0);
  const files = await Promise.all(['uploads/demo-maplebrook/demo-p-maple-1.png', 'brand/demo-maplebrook/logo-demo.png', 'brand/demo-maplebrook/kennel-demo.png'].map((k) => FILES.get(k)));
  check('the demo pictures are in storage as PNGs', files.every((f) => f && f.body[1] === 0x50 && f.body[2] === 0x4e && f.body[3] === 0x47));
  check('the reset is in the activity log with its backup', count("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'demo.reset' AND actor = 'amber@puppyconnection.test'") === 1);
  check('the site is marked as having changes to publish', one('SELECT dirty FROM site_state WHERE id = 1').dirty === 1);

  // A second reset gives the same state, and keeps the demo pictures.
  const snapshot = () => JSON.stringify(['breeders', 'breeder_profiles', 'litters', 'puppies', 'photos', 'checkouts', 'payments', 'puppy_stats', 'operator_notes']
    .map((tbl) => q(`SELECT * FROM ${tbl} ${tbl === 'breeders' ? 'WHERE id' : tbl === 'puppy_stats' ? 'WHERE puppy_id' : 'WHERE ' + (tbl === 'payments' ? 'checkout_id' : 'breeder_id')} LIKE 'demo-%'`)
      .map((row) => { const c = { ...row }; for (const k of Object.keys(c)) if (/_at$|^created$|^expires_at$|^day$/.test(k)) delete c[k]; return c; })));
  const first = snapshot();
  const r2nd = await resetDemo(env, 'amber@puppyconnection.test', RESET_PHRASE);
  check('a second reset gives the same demo data', r2nd.ok && snapshot() === first && r2nd.removed.breeders === 3);
  check('... and the demo pictures are still there', !!(await FILES.get('uploads/demo-maplebrook/demo-p-maple-1.png')) && !!(await FILES.get('brand/demo-maplebrook/logo-demo.png')));
  check('... and the seed listings are still exactly as they were', JSON.stringify(q(SEED_TABLES.puppies)) === seedBefore.puppies && JSON.stringify(q(SEED_TABLES.photos)) === seedBefore.photos);
  db.close();

  // ---------------------------------------------------------------- part 2, the local admin refuses
  const H = { origin: ADMIN, 'content-type': 'application/json' };
  const who = await fetch(`${ADMIN}/api/whoami`).then((x) => x.json());
  check('the local admin says Reset demo data is off', who.demo_reset === false && who.demo_phrase === RESET_PHRASE, JSON.stringify(who));
  const statsBefore = await fetch(`${ADMIN}/api/stats`).then((x) => x.json());
  const jobsBefore = await fetch(`${ADMIN}/api/jobs`).then((x) => x.json());
  const res = await fetch(`${ADMIN}/api/demo/reset`, { method: 'POST', headers: H, body: JSON.stringify({ confirm: RESET_PHRASE }) });
  const body = await res.json();
  check('the local admin refuses the reset with 403', res.status === 403 && /only on the staging copy/.test(body.error), `${res.status} ${JSON.stringify(body)}`);
  const statsAfter = await fetch(`${ADMIN}/api/stats`).then((x) => x.json());
  check('... and the listings are untouched', statsAfter.public_puppies === statsBefore.public_puppies && statsAfter.approved === statsBefore.approved);
  const jobsAfter = await fetch(`${ADMIN}/api/jobs`).then((x) => x.json());
  const backupRun = (j) => (j.find((x) => x.job === 'backup') || {}).last_run_at || null;
  check('... and no backup ran', backupRun(jobsAfter) === backupRun(jobsBefore));
  const cross = await fetch(`${ADMIN}/api/demo/reset`, { method: 'POST', headers: { ...H, origin: 'https://evil.example' }, body: JSON.stringify({ confirm: RESET_PHRASE }) });
  check('a request from another origin is refused', cross.status === 403);
} catch (e) {
  check('the test ran to the end', false, e.stack);
} finally {
  try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); } catch { /* left in the temp folder */ }
}
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
