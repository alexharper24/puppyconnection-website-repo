// Check each staged parent photo with the app's own code and find its focus point (Alex, 2026-11-13,
// docs/batch-2026-11-13-wix-parent-photos.md). For each parent in plan.json: lib/images.js cleanImage on the full and
// card copies (it must find nothing to strip, so the bytes go up unchanged), its size from dimensions(), and the
// dog detector's point on the full photo with the lib/focus.js rule, the same call storeParentPhoto makes on upload.
// The detector is dev/photo-focus under wrangler dev on DETECTOR (default http://127.0.0.1:8799).
//
//   node app/ops/wix_parent_photos_check.mjs <state folder>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanImage } from '../lib/images.js';
import { dogFocus } from '../lib/focus.js';

const state = process.argv[2];
const DETECTOR = process.env.DETECTOR || 'http://127.0.0.1:8799';
const PLAN = process.env.PLAN || 'plan.json';
const plan = JSON.parse(readFileSync(join(state, PLAN), 'utf8'));
let bad = 0;
for (const p of plan.parents.filter((x) => x.key)) {
  const out = {};
  for (const name of ['full', 'card']) {
    const raw = new Uint8Array(readFileSync(join(state, 'staged', `${p.parent_id}.${name}.webp`)));
    const img = cleanImage(raw);
    const same = img.bytes.length === raw.length;
    if (!same || img.type !== 'image/webp' || !img.size) bad++;
    out[name] = { bytes: raw.length, type: img.type, w: img.size && img.size.w, h: img.size && img.size.h, unchanged_by_clean: same };
  }
  const full = readFileSync(join(state, 'staged', `${p.parent_id}.full.webp`));
  const r = await fetch(DETECTOR, { method: 'POST', body: full });
  const j = await r.json();
  const focus = j.boxes ? dogFocus(j.boxes, out.full.w, out.full.h) : null;
  p.checked = { ...out, focus, detector_error: j.error || null };
  console.log(`${p.name.padEnd(10)} full ${out.full.w}x${out.full.h} ${out.full.bytes} B clean=${out.full.unchanged_by_clean} card ${out.card.w}x${out.card.h} clean=${out.card.unchanged_by_clean} focus ${focus ? `${focus.fx}, ${focus.fy}` : 'none'}${j.error ? ' ERR ' + j.error : ''}`);
}
writeFileSync(join(state, PLAN), JSON.stringify(plan, null, 1));
console.log(bad ? `${bad} copies failed the clean check` : 'every copy passes cleanImage unchanged');
process.exit(bad ? 1 : 0);
