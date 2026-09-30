// Build a local preview of the public site from the simulation database.
//
//   node app/dev/preview.mjs      then open http://localhost:8789 (the pc-preview server)
//
// Copies the concept site into app/.preview, replaces its data/data.js with the admin
// Worker's export (which reads only the public views), and marks the changes as published.
// This stands in for spec section 9, where a cron job commits the export and CI runs the
// real generator. The concept's pages render the export unchanged except for two patches to
// the preview's own copy of js/main.js, noted below, and the live concept is never touched.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.join(REPO, 'app/.preview');
const ADMIN = process.env.ADMIN || 'http://localhost:8788';

const res = await fetch(`${ADMIN}/api/export`);
if (!res.ok) { console.error(`export failed: ${res.status} ${await res.text()}`); process.exit(1); }
const exp = await res.json();

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(REPO)) {
  if (/\.(html|txt|xml)$/.test(f)) fs.copyFileSync(path.join(REPO, f), path.join(OUT, f));
}
for (const dir of ['css', 'js', 'img']) fs.cpSync(path.join(REPO, dir), path.join(OUT, dir), { recursive: true });
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });

// Breed and profile records keep the concept's own copy (guides, photos), with the counts
// recomputed from what is actually public now.
const src = fs.readFileSync(path.join(REPO, 'data/data.js'), 'utf8');
const grab = (name) => JSON.parse(src.match(new RegExp(`window\\.${name}\\s*=\\s*(\\[.*?\\]);`, 's'))[1]);
const breeds = grab('PC_BREEDS');
const counts = {};
for (const l of exp.listings) counts[l.breed] = (counts[l.breed] || 0) + 1;
for (const b of breeds) { b.live_count = counts[b.name] || 0; b.demo_count = counts[b.name] || 0; }
for (const name of Object.keys(counts)) {
  if (!breeds.some((b) => b.name === name)) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    breeds.push({ name, slug, live_count: counts[name], demo_count: counts[name], guide: [], photo: null, photo_aspect: null });
  }
}
const profiles = grab('PC_BREEDERS');
for (const p of exp.profiles) { if (!profiles.some((x) => x.slug === p.slug)) profiles.push(p); }

fs.writeFileSync(path.join(OUT, 'data/data.js'),
  '// Local preview, built by app/dev/preview.mjs from the simulation database. Not the live data.\n' +
  `window.PC_LISTINGS=${JSON.stringify(exp.listings)};\nwindow.PC_BREEDS=${JSON.stringify(breeds)};\nwindow.PC_BREEDERS=${JSON.stringify(profiles)};\n`);

// Patch 1. The concept's image helpers assume every photo is a Wix media URL and append a
// Wix transform. Uploaded photos are served by the portal, so they pass through unchanged.
// Patch 2. A breeder page finds its profile copy by ?profile=, and falls back to the first
// demo profile. The preview also matches by ?slug= so a new breeder's own words show.
let js = fs.readFileSync(path.join(OUT, 'js/main.js'), 'utf8').replace(/\r\n/g, '\n');   // the checkout may be CRLF
const patches = [
  ["  function wix(base, w, h) {\n    if (!base) return '';", "  function wix(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return base;"],
  ["  function wixFit(base, w, h) {\n    if (!base) return '';", "  function wixFit(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return base;"],
  ['var prof = BREEDERS.filter(function (x) { return x.slug === pslug; })[0];', 'var prof = BREEDERS.filter(function (x) { return x.slug === (pslug || bslug); })[0];'],
  // Patch 3. The concept groups a breeder's listings by the breeder's domain. A breeder with
  // no website gets a stand-in "<slug>.puppyconnection" from the export so the grouping still
  // works, and these keep that stand-in from being shown or linked as if it were a website.
  ["var site = l.breeder_url || (l.breeder_domain ? 'https://' + l.breeder_domain : null);",
    "var site = l.breeder_url || (l.breeder_domain && !/\\.puppyconnection$/.test(l.breeder_domain) ? 'https://' + l.breeder_domain : null);"],
  // The grouping keeps the stand-in as its key and blanks the domain it displays, which covers
  // the directory cards and the breeder header in one place.
  ["if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: l.breeder_domain, listings: [] };",
    "if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: /\\.puppyconnection$/.test(l.breeder_domain) ? '' : l.breeder_domain, listings: [] };"],
  ["'<li><a href=\"https://' + esc(biz.domain) + '\" target=\"_blank\" rel=\"noopener\"><b>Website</b> ' + esc(biz.domain) + '</a></li>' +",
    "(biz.domain ? '<li><a href=\"https://' + esc(biz.domain) + '\" target=\"_blank\" rel=\"noopener\"><b>Website</b> ' + esc(biz.domain) + '</a></li>' : '') +"],
  // Patch 4. The concept labels every breeder page's copy as a demo example. A breeder whose
  // own profile matched in patch 2 is showing their own words, so the note is dropped.
  ["(biz ? '<p class=\"demo-note\">Profile copy below is an example",
    "(biz && !prof ? '<p class=\"demo-note\">Profile copy below is an example"],
];
for (const [a, b] of patches) {
  if (!js.includes(a)) { console.error(`preview patch no longer matches js/main.js:\n${a}`); process.exit(1); }
  js = js.replace(a, b);
}
fs.writeFileSync(path.join(OUT, 'js/main.js'), js);

// A banner on every page so a preview is never mistaken for the live site.
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
