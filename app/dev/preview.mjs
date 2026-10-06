// Build a local preview of the public site from the simulation database.
//
//   node app/dev/preview.mjs      then open http://localhost:8789 (the pc-preview server)
//
// Copies the concept site into app/.preview (site-copy.mjs, with its patches), writes its
// data/data.js from the admin Worker's export, which reads only the public views, and marks
// the changes as published. This stands in for spec section 9, where a cron job commits the
// export and CI runs the real generator. The hosted test deployment does the same thing live
// in the site Worker instead (site/worker.js).

import fs from 'node:fs';
import path from 'node:path';
import { copyConcept, REPO } from './site-copy.mjs';
import { siteDataJs } from '../lib/export.js';

const OUT = path.join(REPO, 'app/.preview');
const ADMIN = process.env.ADMIN || 'http://localhost:8788';

const res = await fetch(`${ADMIN}/api/export`);
if (!res.ok) { console.error(`export failed: ${res.status} ${await res.text()}`); process.exit(1); }
const exp = await res.json();

const base = copyConcept(OUT, { portalOrigin: process.env.PORTAL || 'http://localhost:8787' });
fs.writeFileSync(path.join(OUT, 'data/data.js'), siteDataJs(base, exp, 'Local preview, built by app/dev/preview.mjs from the simulation database.'));

// A banner on every page so a local preview is never mistaken for the live site.
const stamp = new Date().toLocaleString('en-US');
const banner = `<div style="background:#1f2a36;color:#fff;font:14px system-ui;padding:.5rem 1rem;text-align:center">Local preview built from the simulation database at ${stamp}. ${exp.listings.length} public listings.</div>`;
for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.html'))) {
  const p = path.join(OUT, f);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/<body([^>]*)>/, `<body$1>${banner}`));
}

const mark = await fetch(`${ADMIN}/api/site/published`, {
  method: 'POST', headers: { 'content-type': 'application/json', origin: ADMIN }, body: JSON.stringify({ generation: exp.generation }),
});
console.log(`preview built: ${exp.listings.length} listings, ${exp.profiles.length} breeder profiles${mark.ok ? ', marked published' : ''}`);
console.log('open http://localhost:8789 (python -m http.server 8789 --directory app/.preview)');
