// The Wix side and the R2 side of the photo refresh (Alex, 2026-11-01, docs/batch-2026-11-01-wix-photo-refresh.md).
// ops/wix_photo_refresh.py makes the plan, the served copies, the focus points, the checks and the migration; this
// script does the two steps that talk to Wix and to R2, with the fetch, strip and put that copy-wix-photos.mjs uses.
//
//   node app/ops/wix-photo-refresh-r2.mjs fetch [--ids a,b] [--limit n]
//   node app/ops/wix-photo-refresh-r2.mjs upload [--ids a,b] [--limit n] [--dry-run]
//
// fetch downloads each new photo's original, the address with any /v1/ rendition removed, one Wix request at a time
// with a pause. It strips the metadata the way the portal does (lib/images.js cleanImage). Stripping also removes
// EXIF orientation, so an original that asks to be rotated, and one cleanImage cannot take (AVIF, or over 15 MB),
// is stored as Wix's full-size JPEG copy instead, which Wix rotates as the original asks. The box asked for is
// square at the longest side Wix reports, because Wix never enlarges a fit copy and the reported width and height
// may be before or after the rotation. The raw original is kept beside it for the checks.
//
// upload puts each new photo's original and its three served copies into R2 at
// uploads/<breeder id>/<photo id>.<ext> plus .display, .card and .share, the scheme copy-wix-photos.mjs uses. The
// photo ids are new (<puppy id>-wx-<media hash>), and before any put the script refuses a key that a photo row in
// the plan's backup already names. It never deletes an object. uploaded.json lists what is up, so a rerun skips it.
// WIX_REFRESH_STATE moves the working folder, as in the Python script.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanImage } from '../lib/images.js';
import { bare, jpegOrientation } from './copy-wix-photos.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const STATE = process.env.WIX_REFRESH_STATE || path.join(APP, '.state/wix-photo-refresh');
const FILES = path.join(STATE, 'files');
const WRANGLER = process.env.WRANGLER_JS || 'C:/Git_Repos/teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js';
const BUCKET = 'puppyconnection-files';
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const WIX_GAP_MS = 400;
process.env.CLOUDFLARE_ACCOUNT_ID ||= '4f6e9dc25ab751960763628b06e6c108';

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (o) => fs.appendFileSync(path.join(STATE, `${cmd}.log.jsonl`), `${JSON.stringify({ at: new Date().toISOString(), ...o })}\n`);

const plan = JSON.parse(fs.readFileSync(path.join(STATE, 'plan.json'), 'utf8'));
let todo = plan.puppies.flatMap((p) => p.order.filter((o) => o.kind === 'new').map((o) => ({ ...o, breeder_id: p.breeder_id, puppy_id: p.puppy_id })));
if (opt('ids')) { const want = new Set(opt('ids').split(',')); todo = todo.filter((o) => want.has(o.id)); }
if (opt('limit')) todo = todo.slice(0, Number(opt('limit')));

// ---- Wix: one request at a time with a pause, backing off on 429 and 5xx, stopping after five refusals in a row
let refusals = 0;
async function wixGet(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await sleep(WIX_GAP_MS * (attempt ? 4 ** attempt : 1));
    let res;
    try { res = await fetch(url, { headers: { 'user-agent': 'puppyconnection-photo-refresh' } }); } catch (e) { res = { ok: false, status: e.message }; }
    if (res.ok) { refusals = 0; return new Uint8Array(await res.arrayBuffer()); }
    if (res.status === 404) throw new Error('HTTP 404 from Wix');
    if ([403, 429, 503].includes(res.status)) refusals += 1;
    if (refusals >= 5) { console.error(`Wix refused ${refusals} requests in a row (last HTTP ${res.status}), so the run stops`); process.exit(2); }
  }
  throw new Error(`Wix did not answer ${url}`);
}

async function fetchOne(o) {
  const meta = path.join(FILES, `${o.id}.json`);
  if (fs.existsSync(meta) && fs.existsSync(path.join(FILES, `${o.id}.full`))) return 'kept';
  const src = bare(o.src);
  const raw = await wixGet(src);
  fs.writeFileSync(path.join(FILES, `${o.id}.raw`), raw);
  let method = 'original', img, why = null;
  const orientation = jpegOrientation(raw);
  try {
    if (orientation !== 1) throw new Error(`EXIF orientation ${orientation}`);
    img = cleanImage(raw);
  } catch (e) {
    why = e.message;
    method = 'wix-rotated-copy';
    const edge = Math.max(o.wix_w || 0, o.wix_h || 0) || 6000;
    const name = src.split('/').pop().replace(/\.\w+$/, '');
    img = cleanImage(await wixGet(`${src}/v1/fit/w_${edge},h_${edge},q_95/${name}.jpg`));
  }
  fs.writeFileSync(path.join(FILES, `${o.id}.full`), img.bytes);
  const m = { id: o.id, puppy_id: o.puppy_id, breeder_id: o.breeder_id, mid: o.mid, src, method, why, orientation,
    type: img.type, key: `uploads/${o.breeder_id}/${o.id}.${EXT[img.type]}`, bytes: img.bytes.length,
    w: img.size?.w ?? null, h: img.size?.h ?? null, raw_bytes: raw.length, wix_w: o.wix_w, wix_h: o.wix_h };
  fs.writeFileSync(meta, JSON.stringify(m));
  if (method !== 'original') log({ id: o.id, note: `stored Wix's full-size copy (${why})` });
  return method;
}

// ---- R2 through wrangler, each put tried three times
function putOnce(key, file, type) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [WRANGLER, 'r2', 'object', 'put', `${BUCKET}/${key}`, '--file', file, '--content-type', type, '--remote'],
      { cwd: APP, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve(code === 0 ? null : err.trim().split('\n').filter(Boolean).pop() || `exit ${code}`));
  });
}

async function main() {
  fs.mkdirSync(FILES, { recursive: true });
  if (cmd === 'fetch') {
    const counts = {};
    let n = 0;
    for (const o of todo) {
      n += 1;
      try { const r = await fetchOne(o); counts[r] = (counts[r] || 0) + 1; } catch (e) { counts.failed = (counts.failed || 0) + 1; log({ id: o.id, failed: e.message }); }
      if (n % 25 === 0 || n === todo.length) console.log(`fetch ${n} of ${todo.length} ${JSON.stringify(counts)}`);
    }
    return counts.failed ? 1 : 0;
  }
  if (cmd === 'upload') {
    // Keys a photo row already names in the plan's backup, which this must never overwrite.
    const taken = new Set(JSON.parse(fs.readFileSync(path.join(STATE, 'taken-keys.json'), 'utf8')));
    const ledgerFile = path.join(STATE, 'uploaded.json');
    const done = new Set(fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : []);
    const jobs = [];
    for (const o of todo) {
      const m = JSON.parse(fs.readFileSync(path.join(FILES, `${o.id}.json`), 'utf8'));
      if (!/-wx-[0-9a-f]{12}$/.test(o.id)) throw new Error(`${o.id} is not a new photo id`);
      const parts = [[m.key, `${o.id}.full`, m.type], [`${m.key}.display`, `${o.id}.display.webp`, 'image/webp'],
        [`${m.key}.card`, `${o.id}.card.webp`, 'image/webp'], [`${m.key}.share`, `${o.id}.share.jpg`, 'image/jpeg']];
      for (const [key, file, type] of parts) {
        if (taken.has(key) || taken.has(key.replace(/\.(display|card|share)$/, ''))) throw new Error(`${key} is already named by a photo row, so nothing is put`);
        if (!fs.existsSync(path.join(FILES, file))) throw new Error(`${file} is missing, so nothing is put`);
        if (!done.has(key)) jobs.push([key, path.join(FILES, file), type]);
      }
    }
    console.log(`upload: ${todo.length} photos, ${jobs.length} objects to put, ${done.size} already up`);
    if (flag('dry-run')) { jobs.slice(0, 8).forEach((j) => console.log('  ', j[0])); return 0; }
    let failed = 0, put = 0;
    const save = () => fs.writeFileSync(ledgerFile, JSON.stringify([...done].sort()));
    const queue = jobs.slice();
    async function worker() {
      for (let j = queue.shift(); j; j = queue.shift()) {
        let e = null;
        for (let attempt = 0; attempt < 3; attempt += 1) { e = await putOnce(...j); if (!e) break; await sleep(1500 * (attempt + 1)); }
        if (e) { failed += 1; log({ key: j[0], failed: e }); if (/auth|permission|10000|403/i.test(e)) { console.error(`R2 refused ${j[0]}: ${e}`); process.exit(3); } continue; }
        done.add(j[0]); put += 1;
        if (put % 100 === 0) { save(); console.log(`  ${put} of ${jobs.length} put, ${failed} failed`); }
      }
    }
    await Promise.all(Array.from({ length: Number(opt('uploads', 4)) }, worker));
    save();
    console.log(`${failed ? 'BAD ' : 'ok  '} put ${put} objects into ${BUCKET}${failed ? `, ${failed} failed (upload.log.jsonl)` : ''}`);
    return failed ? 1 : 0;
  }
  console.error('usage: wix-photo-refresh-r2.mjs fetch|upload [--ids a,b] [--limit n] [--dry-run]');
  return 1;
}

main().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(1); });
