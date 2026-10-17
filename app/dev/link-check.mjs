// Walk every internal link on a built site and check its target (launch item G1).
//
//   node app/dev/link-check.mjs [folder]      default app/.preview/static-site
//
// For each <a href> on each page that points inside the site (a relative address, or one under
// --base), the target file must exist, or _redirects must send it somewhere that does. A link
// with a #fragment must land on an element with that id in the target page. Links to the portal,
// tel:, mailto: and other sites are not followed. Exit 1 on any broken link.
//
// Where an anchor lands below the sticky header is a browser question, so --anchors writes the
// list of distinct page#id targets as JSON for the browser check, which opens each one at desktop
// and 375px and asserts the target's top sits at or below the header's bottom.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(HERE, '../.preview/static-site'));
const base = (args.find((a) => a.startsWith('--base=')) || '--base=').slice(7);
const anchorsOut = (args.find((a) => a.startsWith('--anchors=')) || '').slice(10);

const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
const text = Object.fromEntries(pages.map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]));
const ids = {};
const idsOf = (f) => (ids[f] ||= new Set([...text[f].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));

// _redirects: "from to code", where a trailing * on from matches the rest.
const redirects = fs.existsSync(path.join(dir, '_redirects'))
  ? fs.readFileSync(path.join(dir, '_redirects'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/))
  : [];
const redirected = (p) => {
  for (const [from, to] of redirects) {
    if (from.endsWith('*') ? p.startsWith(from.slice(0, -1)) : p === from) return to;
  }
  return null;
};

const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const broken = [];
const anchors = new Set();
let checked = 0;
for (const f of pages) {
  for (const m of text[f].matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
    let href = unescape(m[1]);
    if (base && href.startsWith(base)) href = href.slice(base.length);
    if (/^(https?:|mailto:|tel:|sms:|javascript:|\/\/)/i.test(href)) continue;
    checked += 1;
    const [pathPart, frag] = href.split('#');
    let target = pathPart.split('?')[0];
    if (target === '') target = f;
    else if (target.startsWith('/')) {
      if (target === '/') target = 'index.html';
      else if (fs.existsSync(path.join(dir, target.slice(1))) && !fs.statSync(path.join(dir, target.slice(1))).isDirectory()) target = target.slice(1);
      else {
        const to = redirected(target);
        if (!to) { broken.push(`${f}: ${href} (no file and no redirect)`); continue; }
        if (/^https?:/.test(to)) continue;
        target = to === '/' ? 'index.html' : to.replace(/^\//, '');
      }
    } else target = path.posix.normalize(target);
    if (target.endsWith('/')) target += 'index.html';
    if (!text[target]) {
      if (!fs.existsSync(path.join(dir, target))) broken.push(`${f}: ${href} (no ${target})`);
      continue;
    }
    if (frag) {
      if (!idsOf(target).has(decodeURIComponent(frag))) broken.push(`${f}: ${href} (no id="${frag}" in ${target})`);
      else anchors.add(`${target}#${frag}`);
    }
  }
}

if (anchorsOut) fs.writeFileSync(anchorsOut, JSON.stringify([...anchors].sort(), null, 1));
console.log(`${pages.length} pages, ${checked} internal links, ${anchors.size} distinct in-page targets, ${broken.length} broken`);
for (const b of broken.slice(0, 60)) console.log(`  BROKEN ${b}`);
if (broken.length > 60) console.log(`  ... and ${broken.length - 60} more`);
process.exit(broken.length ? 1 : 0);
