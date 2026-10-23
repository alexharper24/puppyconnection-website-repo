// Copy every listing photo still served from Wix into Puppy Connection's own R2 bucket, and point
// its row at the copy (workplan C2, Alex 2026-10-22). It works on the staging rows that already
// exist, where wix-import.mjs builds rows in a copy database, and it reuses that script's fetch,
// metadata stripping (lib/images.js cleanImage) and four-at-a-time wrangler upload.
//
// For each photo with no r2_key and a static.wixstatic.com external_url, it:
//   - downloads the original Wix holds, the address with any /v1/ rendition removed, and keeps
//     its format;
//   - strips the metadata the way the import and the portal do;
//   - makes the card copy the portal makes for a breeder's upload, at most 640 px on its longest
//     edge, from Wix's own resized copy, so narrow slots do not load the whole original;
//   - puts both into R2 at uploads/<breeder id>/<photo id>.<ext> and <key>.card (decision D11);
//   - records r2_key, content_type and bytes, and width, height and aspect only where missing.
//     external_url stays on the row as the record of where the photo came from.
//
// Stripping an original also removes its EXIF orientation, so an original that asks to be
// rotated would show sideways. Wix applies the rotation in its resized copies, so such a photo,
// and one cleanImage cannot take (AVIF, or over 15 MB), is stored as Wix's full-size JPEG copy
// instead, at the width and height the row already records. Each case is listed in the log.
//
//   node app/ops/copy-wix-photos.mjs [--limit n] [--ids a,b,c] [--batch 100] [--dry-run]
//
//   --limit n     stop after n photos (the first run on 10)
//   --ids a,b     only these photo ids
//   --batch n     photos per batch, one progress line and one D1 write each (default 100)
//   --retry       try again the photos in failures.json, which a normal run skips
//   --dry-run     list what would be copied and change nothing
//
// It is safe to stop and run again. A row is written only after both its files are in R2, the
// UPDATE names r2_key IS NULL, a file already put is listed in uploaded.json and is not put
// again, and a downloaded file is kept in app/.state/wix-photo-copy/files and not fetched again.
// It never deletes or changes a Wix file and never deletes a photo row. Requests to Wix go one at
// a time with a pause between them, and the run stops if Wix refuses five in a row.
// Back up D1 first (README, "Schema changes"), and confirm the export printed "Downloaded".

import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanImage } from '../lib/images.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || 'C:/Git_Repos/teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js';
const CONFIG = path.join(APP, 'portal/wrangler.hosted.jsonc');
const BUCKET = 'puppyconnection-files';
const STATE = path.join(APP, '.state/wix-photo-copy');
const FILES = path.join(STATE, 'files');
const LEDGER = path.join(STATE, 'uploaded.json');
const FAILURES = path.join(STATE, 'failures.json');
const LOG = path.join(STATE, 'log.jsonl');
process.env.CLOUDFLARE_ACCOUNT_ID ||= '4f6e9dc25ab751960763628b06e6c108';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const WIX_GAP_MS = 250;
const CARD_EDGE = 640;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

/** The original Wix holds behind a rendition address. */
export const bare = (url) => (/wixstatic\.com/.test(url) && url.includes('/v1/') ? url.split('/v1/')[0] : url);

/** The EXIF orientation of a JPEG, 1 when it has none. */
export function jpegOrientation(b) {
  if (!(b[0] === 0xff && b[1] === 0xd8)) return 1;
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    if (marker === 0xda) break;
    const len = (b[i + 2] << 8) | b[i + 3];
    if (marker === 0xe1 && String.fromCharCode(...b.subarray(i + 4, i + 8)) === 'Exif') {
      const t = i + 10;
      const le = b[t] === 0x49;
      const u16 = (o) => (le ? b[t + o] | (b[t + o + 1] << 8) : (b[t + o] << 8) | b[t + o + 1]);
      const u32 = (o) => (le ? (b[t + o] | (b[t + o + 1] << 8) | (b[t + o + 2] << 16)) + b[t + o + 3] * 0x1000000
        : b[t + o] * 0x1000000 + ((b[t + o + 1] << 16) | (b[t + o + 2] << 8) | b[t + o + 3]));
      const ifd = u32(4);
      const n = u16(ifd);
      for (let k = 0; k < n; k += 1) {
        const e = ifd + 2 + k * 12;
        if (u16(e) === 0x0112) return u16(e + 8) || 1;
      }
      return 1;
    }
    i += 2 + len;
  }
  return 1;
}

// Tried three times, because one dropped connection stopped the first full run after batch 10
// (2026-10-23). Every write here is safe to send twice.
function d1(sql) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const raw = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--remote', '--config', CONFIG, '--json', '--command', sql],
        { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).toString();
      const res = JSON.parse(raw.slice(raw.indexOf('[')));
      if (!res.every((r) => r.success)) throw new Error(`D1 reported a failure: ${raw.slice(0, 500)}`);
      return res;
    } catch (e) {
      if (attempt >= 3) throw e;
      execFileSync(process.execPath, ['-e', `setTimeout(() => {}, ${5000 * attempt})`]);
    }
  }
}

// ---- Wix, one request at a time with a pause, stopping if it keeps refusing
let wixChain = Promise.resolve();
let refusals = 0;
class Refused extends Error {}
function wixFetch(url) {
  const run = wixChain.then(async () => {
    let res;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await sleep(WIX_GAP_MS * (attempt + 1));
      try { res = await fetch(url, { headers: { 'user-agent': 'puppyconnection-photo-copy' } }); } catch (e) { res = { ok: false, status: e.message }; }
      if (res.ok) break;
      if (res.status === 404) break;
    }
    if (!res.ok) {
      if ([403, 429, 503].includes(res.status)) refusals += 1;
      if (refusals >= 5) throw new Refused(`Wix refused ${refusals} requests in a row (last HTTP ${res.status}), so the run stops`);
      throw new Error(`HTTP ${res.status} from Wix`);
    }
    refusals = 0;
    return new Uint8Array(await res.arrayBuffer());
  });
  wixChain = run.catch(() => {});
  return run;
}

// ---- R2, through wrangler, each put tried three times in all
function putOnce(key, file, type) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [WRANGLER, 'r2', 'object', 'put', `${BUCKET}/${key}`, '--file', file, '--content-type', type, '--remote'],
      { cwd: APP, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve(code === 0 ? null : err.trim().split('\n').filter(Boolean).pop() || `exit ${code}`));
  });
}
async function put(key, file, type, done) {
  if (done.has(key)) return;
  let e = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    e = await putOnce(key, file, type);
    if (!e) { done.add(key); return; }
    await sleep(1500 * (attempt + 1));
  }
  throw new Error(`R2 put ${key}: ${e}`);
}

/** Fetch (or reuse), strip and store one photo's full and card files. Returns the row values. */
async function prepare(p) {
  const src = bare(p.external_url);
  const name = src.split('/').pop();
  const fullFile = path.join(FILES, `${p.id}.full`);
  const cardFile = path.join(FILES, `${p.id}.card`);
  const metaFile = path.join(FILES, `${p.id}.json`);
  if (fs.existsSync(metaFile) && fs.existsSync(fullFile) && fs.existsSync(cardFile)) return JSON.parse(fs.readFileSync(metaFile, 'utf8'));

  let method = 'original', img, orientation = 1, why = null;
  const raw = await wixFetch(src);
  try {
    orientation = jpegOrientation(raw);
    if (orientation !== 1) throw new Error(`EXIF orientation ${orientation}`);
    img = cleanImage(raw);
  } catch (e) {
    // Wix's own full-size JPEG copy, rotated as the original asks. Wix never enlarges a fit copy,
    // so asking for the recorded size, or a large box where none is recorded, gives the full size.
    why = e.message;
    method = 'wix-full-copy';
    const w = p.width || 5000, h = p.height || 5000;
    img = cleanImage(await wixFetch(`${src}/v1/fit/w_${w},h_${h},q_95/${name.replace(/\.\w+$/, '')}.jpg`));
  }
  const card = cleanImage(await wixFetch(`${src}/v1/fit/w_${CARD_EDGE},h_${CARD_EDGE},q_85/${name.replace(/\.\w+$/, '')}.jpg`));
  const key = `uploads/${p.breeder_id}/${p.id}.${EXT[img.type]}`;
  fs.writeFileSync(fullFile, img.bytes);
  fs.writeFileSync(cardFile, card.bytes);
  const meta = { id: p.id, key, type: img.type, bytes: img.bytes.length, w: img.size?.w ?? null, h: img.size?.h ?? null,
    card_type: card.type, card_bytes: card.bytes.length, card_w: card.size?.w ?? null, card_h: card.size?.h ?? null, method, why, orientation, src };
  fs.writeFileSync(metaFile, JSON.stringify(meta));
  return meta;
}

/** The row's UPDATE. Size and aspect only where missing, and only while the row has no r2_key. */
function updateSql(p, m) {
  const sets = [`r2_key = ${q(m.key)}`, `content_type = ${q(m.type)}`, `bytes = ${m.bytes}`];
  if (m.w && m.h) {
    sets.push(`width = COALESCE(width, ${m.w})`, `height = COALESCE(height, ${m.h})`, `aspect = COALESCE(aspect, ${Math.round((m.w / m.h) * 1000) / 1000})`);
  }
  return `UPDATE photos SET ${sets.join(', ')} WHERE id = ${q(p.id)} AND r2_key IS NULL;`;
}

export async function main() {
  fs.mkdirSync(FILES, { recursive: true });
  const done = new Set(fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : []);
  const failures = fs.existsSync(FAILURES) ? JSON.parse(fs.readFileSync(FAILURES, 'utf8')) : {};
  const saveLedger = () => fs.writeFileSync(LEDGER, JSON.stringify([...done].sort()));
  const saveFailures = () => fs.writeFileSync(FAILURES, JSON.stringify(failures, null, 1));
  const log = (o) => fs.appendFileSync(LOG, `${JSON.stringify({ at: new Date().toISOString(), ...o })}\n`);

  const ids = opt('ids') ? opt('ids').split(',').map((s) => s.trim()).filter(Boolean) : null;
  const rows = d1(`SELECT id, breeder_id, puppy_id, external_url, width, height FROM photos
    WHERE r2_key IS NULL AND external_url LIKE 'https://static.wixstatic.com/%'${ids ? ` AND id IN (${ids.map(q).join(',')})` : ''} ORDER BY id`)[0].results;
  let todo = rows.filter((r) => flag('retry') || ids || !failures[r.id]);
  if (opt('limit')) todo = todo.slice(0, Number(opt('limit')));
  const skipped = rows.length - todo.length;
  console.log(`photos on Wix with no copy: ${rows.length}. This run: ${todo.length}${skipped ? `, ${skipped} left for later or listed in failures.json` : ''}`);
  if (flag('dry-run')) { for (const r of todo.slice(0, 20)) console.log(`  ${r.id} -> uploads/${r.breeder_id}/${r.id}.<ext>  from ${bare(r.external_url)}`); return { ok: true }; }

  const size = Number(opt('batch', 100));
  let copied = 0, failed = 0, batchNo = 0;
  const started = Date.now();
  for (let at = 0; at < todo.length; at += size) {
    batchNo += 1;
    const batch = todo.slice(at, at + size);
    const queue = batch.slice();
    const ready = [];
    let stop = null;
    async function worker() {
      for (let p = queue.shift(); p && !stop; p = queue.shift()) {
        try {
          const m = await prepare(p);
          await put(m.key, path.join(FILES, `${p.id}.full`), m.type, done);
          await put(`${m.key}.card`, path.join(FILES, `${p.id}.card`), m.card_type, done);
          ready.push({ p, m });
          if (m.method !== 'original' || (p.width && m.w && (p.width !== m.w || p.height !== m.h))) {
            log({ id: p.id, note: m.method !== 'original' ? `stored Wix's full-size copy (${m.why})` : `size differs from the row: row ${p.width}x${p.height}, file ${m.w}x${m.h}`, method: m.method, row: [p.width, p.height], file: [m.w, m.h] });
          }
        } catch (e) {
          if (e instanceof Refused) { stop = e; break; }
          failures[p.id] = { reason: e.message, url: p.external_url, at: new Date().toISOString() };
          failed += 1;
          log({ id: p.id, failed: e.message });
        }
      }
    }
    await Promise.all(Array.from({ length: 4 }, worker));
    saveLedger();
    // One D1 write per batch, split to stay inside a Windows command line.
    let chunk = [];
    const flush = () => { if (chunk.length) { d1(chunk.join('\n')); chunk = []; } };
    for (const { p, m } of ready) {
      const s = updateSql(p, m);
      if (chunk.join('\n').length + s.length > 18000) flush();
      chunk.push(s);
      delete failures[p.id];
    }
    flush();
    copied += ready.length;
    saveFailures();
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`batch ${batchNo}: ${ready.length} copied, ${batch.length - ready.length} failed. In all ${copied} of ${todo.length} copied, ${failed} failed, ${mins} min`);
    if (stop) { console.error(stop.message); break; }
  }

  if (copied) {
    // The site publishes the new addresses on its next run, and the audit says who did it.
    d1(`UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, ${q(new Date().toISOString())}), generation = generation + 1 WHERE id = 1;
      INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
      VALUES (${q(new Date().toISOString())}, 'system', 'claude', 'photos.copy_from_wix', 'site', 'wix', NULL, ${q(JSON.stringify({ copied, failed, bucket: BUCKET }))});`);
  }
  console.log(`${failed ? 'BAD ' : 'ok  '} copied ${copied} photos to ${BUCKET}${failed ? `, ${failed} failed (see ${path.relative(process.cwd(), FAILURES)})` : ''}`);
  return { ok: !failed, copied, failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((r) => process.exit(r.ok ? 0 : 1)).catch((e) => { console.error(e); process.exit(1); });
}
