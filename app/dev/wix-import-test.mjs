// Tests the Wix import (app/ops/wix-import.mjs, plan P4.7) with the MADE-UP pairing file in
// dev/fixtures/pairing-made-up.json, against a stand-in Wix image host on 8797 that answers every
// photo address with the test JPEG (which carries GPS data, so stripping is proven too).
//
//   node app/dev/wix-import-test.mjs         needs a local database (node app/dev/setup.mjs)
//
// It imports into a copy of the local database in a temporary folder, so the local database and
// app/.state/import-copy are left alone. The real pairing waits on Amber (decision d8).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { APP, localD1File, d1 } from './node-env.mjs';
import { exportSite } from '../lib/shape.js';

const REPO = path.resolve(APP, '..');
const WRANGLER = path.resolve(REPO, '../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-import-'));
const PAIRING = path.join(APP, 'dev/fixtures/pairing-made-up.json');
const JPEG = fs.readFileSync(path.join(APP, 'dev/fixtures/gps-test.jpg'));
let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

let hits = 0;
const wix = http.createServer((req, res) => {
  hits += 1;
  if (/missing/.test(req.url)) { res.statusCode = 404; return res.end(); }
  res.setHeader('content-type', 'image/jpeg'); res.end(JPEG);
}).listen(8797);

// Asynchronous, because the stand-in Wix host runs in this process and must keep answering.
function run(args, { expectFail = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(APP, 'ops/wix-import.mjs'), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => { if (code && !expectFail) console.log(out); resolve({ code, out }); });
  });
}
const count = (file, sql) => { const db = new DatabaseSync(file, { readOnly: true }); try { return db.prepare(sql).get().n; } finally { db.close(); } };

try {
  const listings = JSON.parse(fs.readFileSync(path.join(REPO, '_harvest/data/listings.json'), 'utf8'));
  const pairing = JSON.parse(fs.readFileSync(PAIRING, 'utf8'));
  const photoTotal = listings.reduce((n, l) => n + (l.images || []).length, 0);
  check('the test pairing file is marked as made up', pairing.made_up === true && /MADE UP/.test(pairing.about));
  const local = localD1File();
  const localBefore = count(local, 'SELECT COUNT(*) AS n FROM puppies');
  const db = path.join(TMP, 'copy.sqlite'), files = path.join(TMP, 'r2');
  const common = ['--pairing', PAIRING, '--db', db, '--files', files, '--image-host', 'http://localhost:8797', '--drop-seed'];

  const dry = await run([...common, '--dry-run']);
  check('a dry run reports what it would import', dry.code === 0 && /would import: 9 new breeders .*273 puppies \(273 new\), 2343 photos \(2343 to fetch\)/.test(dry.out), dry.out);
  check('... and fetches nothing and writes no copy', hits === 0 && !fs.existsSync(db) && !fs.existsSync(files));

  const first = await run(common);
  check('the import runs and its own checks pass', first.code === 0 && !/BAD/.test(first.out), first.out.slice(-800));
  check(`all ${listings.length} listings are imported as puppies`, count(db, "SELECT COUNT(*) AS n FROM puppies WHERE id LIKE 'wix-p-%'") === listings.length);
  check('every one is comped and published, and public on the site', count(db, "SELECT COUNT(*) AS n FROM puppies WHERE id LIKE 'wix-p-%' AND payment_state = 'comped' AND publication_state = 'published'") === listings.length
    && count(db, "SELECT COUNT(*) AS n FROM public_puppies WHERE id LIKE 'wix-p-%'") === listings.length);
  check('placed listings come in as placed', count(db, "SELECT COUNT(*) AS n FROM puppies WHERE id LIKE 'wix-p-%' AND availability = 'placed'") === listings.filter((l) => l.placed).length);
  check(`all ${photoTotal} photos have rows`, count(db, "SELECT COUNT(*) AS n FROM photos WHERE id LIKE 'wix-ph-%'") === photoTotal);
  const stored = fs.readdirSync(files, { recursive: true }).filter((f) => fs.statSync(path.join(files, f)).isFile());
  check(`all ${photoTotal} photos are in the file store`, stored.length === photoTotal, `${stored.length}`);
  const sample = fs.readFileSync(path.join(files, stored[0]));
  check('their GPS and camera details are stripped', !sample.includes(Buffer.from('Exif')) && sample.length < JPEG.length && sample[0] === 0xff && sample[1] === 0xd8);
  check('each breeder from the pairing is approved and marked as imported', count(db, "SELECT COUNT(*) AS n FROM breeders WHERE id LIKE 'wix-b-%' AND status = 'approved' AND legacy = 1") === Object.keys(pairing.breeders).length);
  check('each breeder has the sign-in address from the pairing, where the emailed link goes', count(db, "SELECT COUNT(*) AS n FROM breeders WHERE email LIKE '%@breeders.test' AND id LIKE 'wix-b-%'") === Object.keys(pairing.breeders).length);
  check('each puppy keeps its Wix slug and address for the 301 map', count(db, "SELECT COUNT(*) AS n FROM puppies WHERE id LIKE 'wix-p-%' AND legacy_slug = slug AND legacy_url LIKE 'https://www.puppy-connection.com/product-page/%'") === listings.length);
  check('the import is audited and marks the site for publishing', count(db, "SELECT COUNT(*) AS n FROM audit_log WHERE action = 'import.wix'") === 1 && count(db, 'SELECT dirty AS n FROM site_state') === 1);
  check('the local database itself is untouched', count(local, 'SELECT COUNT(*) AS n FROM puppies') === localBefore);

  // Decision D11: each photo sits under the portal's own upload key with its Wix address kept, and
  // the published data names it at media/<id>, which the site Worker serves from R2.
  check('each imported photo has the upload key the /media route serves, and keeps its Wix address',
    count(db, "SELECT COUNT(*) AS n FROM photos WHERE id LIKE 'wix-ph-%' AND r2_key = 'uploads/' || breeder_id || '/' || id || '.jpg' AND external_url LIKE 'https://static.wixstatic.com/%'") === photoTotal);
  {
    const copy = d1(db);
    const exp = await exportSite({ DB: copy });
    copy.close();
    const all = JSON.parse(exp.files['data/puppies.json']).filter((p) => listings.some((l) => l.slug === p.slug)).flatMap((p) => p.photos);
    check('the published data names every imported photo at media/<id>, none at Wix', all.length === photoTotal && all.every((ph) => /^media\/wix-ph-[\w-]+$/.test(ph.src) && ph.card === `${ph.src}/card`), JSON.stringify(all.slice(0, 2)));
  }

  // --upload-to copies the stored files into R2, here wrangler's local R2 in a temporary folder.
  const small = ['--pairing', PAIRING, '--db', path.join(TMP, 'small.sqlite'), '--files', path.join(TMP, 'r2small'), '--image-host', 'http://localhost:8797', '--drop-seed', '--allow-unpaired', '--limit', '1'];
  const wr = path.join(TMP, 'wrangler-r2');
  const up1 = await run([...small, '--upload-to', 'puppyconnection-files', '--upload-local', wr]);
  const smallPhotos = count(path.join(TMP, 'small.sqlite'), "SELECT COUNT(*) AS n FROM photos WHERE id LIKE 'wix-ph-%'");
  check(`--upload-to copies each imported photo into R2 (${smallPhotos} for one listing)`, up1.code === 0 && smallPhotos > 0 && new RegExp(`ok   copied ${smallPhotos} photos to puppyconnection-files`).test(up1.out), up1.out.slice(-600));
  const ledger = JSON.parse(fs.readFileSync(path.join(TMP, 'r2small', '.uploaded-puppyconnection-files-local.json'), 'utf8'));
  const firstKey = ledger[0];
  const back = path.join(TMP, 'back.jpg');
  const got = spawnSync(process.execPath, [WRANGLER, 'r2', 'object', 'get', `puppyconnection-files/${firstKey}`, '--file', back, '--local', '--persist-to', wr], { cwd: TMP });
  check('... and a copied photo reads back from R2 byte for byte', got.status === 0 && fs.existsSync(back) && fs.readFileSync(back).equals(fs.readFileSync(path.join(TMP, 'r2small', ...firstKey.split('/')))), String(got.stderr).slice(-300));
  const up2 = await run([...small, '--upload-to', 'puppyconnection-files', '--upload-local', wr]);
  check('a second run copies nothing it already copied', up2.code === 0 && new RegExp(`${smallPhotos} photos, ${smallPhotos} already there, 0 to copy`).test(up2.out), up2.out.slice(-400));

  const hitsAfterFirst = hits;
  const again = await run(common);
  check('running it again succeeds', again.code === 0 && /273 puppies \(0 new\), 2343 photos \(0 to fetch\)/.test(again.out), again.out.slice(0, 400));
  check('... fetches nothing and duplicates nothing', hits === hitsAfterFirst && count(db, "SELECT COUNT(*) AS n FROM photos WHERE id LIKE 'wix-ph-%'") === photoTotal
    && count(db, "SELECT COUNT(*) AS n FROM puppies WHERE id LIKE 'wix-p-%'") === listings.length && count(db, "SELECT COUNT(*) AS n FROM breeders WHERE id LIKE 'wix-b-%'") === Object.keys(pairing.breeders).length);

  // A pairing that leaves a listing out, or names one that does not exist, is refused.
  const short = { ...pairing, listings: { ...pairing.listings } };
  delete short.listings[listings[0].slug];
  fs.writeFileSync(path.join(TMP, 'short.json'), JSON.stringify(short));
  const s = await run(['--pairing', path.join(TMP, 'short.json'), '--db', path.join(TMP, 'other.sqlite'), '--files', files, '--dry-run'], { expectFail: true });
  check('a listing missing from the pairing stops the import', s.code === 1 && /1 listing\(s\) have no breeder/.test(s.out), s.out);
  const extra = { ...pairing, listings: { ...pairing.listings, 'no-such-puppy': Object.keys(pairing.breeders)[0] } };
  fs.writeFileSync(path.join(TMP, 'extra.json'), JSON.stringify(extra));
  const x = await run(['--pairing', path.join(TMP, 'extra.json'), '--db', path.join(TMP, 'other.sqlite'), '--files', files, '--dry-run'], { expectFail: true });
  check('a pairing naming a listing the harvest lacks is refused', x.code === 1 && /does not have: no-such-puppy/.test(x.out), x.out);
  // Without --drop-seed, the seed's puppies hold the same slugs, and the import says so rather than doubling them.
  const clash = await run(['--pairing', PAIRING, '--db', path.join(TMP, 'clash.sqlite'), '--files', path.join(TMP, 'r2b'), '--image-host', 'http://localhost:8797', '--dry-run'], { expectFail: true });
  check('a slug another puppy already uses is reported as a conflict, not imported twice', clash.code === 1 && /conflicts \(not imported\): 273/.test(clash.out), clash.out.slice(0, 400));
} catch (e) {
  check('the test ran to the end', false, e.stack);
} finally {
  wix.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
