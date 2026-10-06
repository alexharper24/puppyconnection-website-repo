// Copy the concept site into a folder and patch that copy's js/main.js so it renders data
// from the database. Used by preview.mjs (local) and build-site.mjs (the hosted site
// Worker). The live concept in the repo root is never changed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../..');

// Patch 1. The concept's image helpers assume every photo is a Wix media URL and append a
// Wix transform. Uploaded photos are served from our own /media, so they pass through.
// Patch 2. A breeder page finds its profile copy by ?profile=. The copy also matches by
// ?slug=, so a new breeder's own words show on their page.
// Patch 3. The concept groups a breeder's listings by the breeder's domain. A breeder with
// no website gets a stand-in "<slug>.puppyconnection" from the export so the grouping still
// works, and these keep that stand-in from being shown or linked as if it were a website.
const PATCHES = [
  ["  function wix(base, w, h) {\n    if (!base) return '';", "  function wix(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return pcMedia(base, w);"],
  ["  function wixFit(base, w, h) {\n    if (!base) return '';", "  function wixFit(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return pcMedia(base, w);"],
  // Patch 1b. An uploaded photo has a full copy and a small card copy, and a slot 640 px wide
  // or less (cards, thumbnails, the breeder page photo) takes the card copy.
  ["  /* \"fit\" letterboxes", "  function pcMedia(base, w) {\n    return w <= 640 && /\\/media\\/[\\w-]+$/.test(base) ? base + '/card' : base;\n  }\n  /* \"fit\" letterboxes"],
  ['var prof = BREEDERS.filter(function (x) { return x.slug === pslug; })[0];', 'var prof = BREEDERS.filter(function (x) { return x.slug === (pslug || bslug); })[0];'],
  ["var site = l.breeder_url || (l.breeder_domain ? 'https://' + l.breeder_domain : null);",
    "var site = l.breeder_url || (l.breeder_domain && !/\\.puppyconnection$/.test(l.breeder_domain) ? 'https://' + l.breeder_domain : null);"],
  ["if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: l.breeder_domain, listings: [] };",
    "if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: /\\.puppyconnection$/.test(l.breeder_domain) ? '' : l.breeder_domain, listings: [] };"],
  ["'<li><a href=\"https://' + esc(biz.domain) + '\" target=\"_blank\" rel=\"noopener\"><b>Website</b> ' + esc(biz.domain) + '</a></li>' +",
    "(biz.domain ? '<li><a href=\"https://' + esc(biz.domain) + '\" target=\"_blank\" rel=\"noopener\"><b>Website</b> ' + esc(biz.domain) + '</a></li>' : '') +"],
  // Patch 5 (plan P2.5). A puppy page counts one view, and a click on the breeder's website,
  // phone or email link counts one click through to the breeder. The beacon carries only the
  // kind and the puppy's slug, sets no cookie, and a failure is silent.
  ["  /* \"fit\" letterboxes", "  function pcBeacon(k, s) {\n    try {\n      var body = JSON.stringify({ k: k, s: s });\n      if (navigator.sendBeacon) navigator.sendBeacon('/api/beacon', new Blob([body], { type: 'text/plain' }));\n      else fetch('/api/beacon', { method: 'POST', body: body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(function () {});\n    } catch (e) { /* counting never gets in the way of the page */ }\n  }\n  /* \"fit\" letterboxes"],
  ["    var d = document.querySelector('#dDesc');",
    "    if (l && l.slug === qs('slug')) {\n      pcBeacon('view', l.slug);\n      document.querySelector('#dBreeder').addEventListener('click', function (e) {\n        if (e.target.closest && e.target.closest('.contact-list a')) pcBeacon('click', l.slug);\n      });\n    }\n    var d = document.querySelector('#dDesc');"],
  // Patch 6 (plan P2.3). A breeder who uploaded a logo in the portal has it on their page. The
  // export also carries the kennel photo, breeds and Facebook page, which the concept's pages
  // have no place for yet, so they wait for the generated pages (P4.3).
  ["      } else { logo.hidden = true; }",
    "      } else if (prof && prof.logo) {\n        logo.innerHTML = '<img src=\"' + esc(prof.logo) + '\" alt=\"' + esc(name) + ' logo\" loading=\"lazy\" decoding=\"async\">';\n      } else { logo.hidden = true; }"],
];

// Patch 4 (plan P7.1). The privacy policy and listing terms live on the portal, so every
// copied page's footer links to them under "Breeders". The concept itself is unchanged.
const FOOTER_ANCHOR = '<li><a href="list-with-us.html#pricing">Pricing</a></li>';
export const DEFAULT_PORTAL = 'https://portal.puppyconnection.workers.dev';

/**
 * Copy the site into out and patch it. Returns the concept's breed and profile records.
 * portalOrigin is where the footer's privacy and terms links point.
 */
export function copyConcept(out, { portalOrigin = DEFAULT_PORTAL } = {}) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'data'), { recursive: true });
  const legal = `<li><a href="${portalOrigin}/privacy">Privacy</a></li><li><a href="${portalOrigin}/terms">Listing terms</a></li>`;
  for (const f of fs.readdirSync(REPO)) {
    if (/\.html$/.test(f)) {
      const page = fs.readFileSync(path.join(REPO, f), 'utf8');
      if (page.includes('<footer') && !page.includes(FOOTER_ANCHOR)) throw new Error(`site footer patch no longer matches ${f}`);
      fs.writeFileSync(path.join(out, f), page.replace(FOOTER_ANCHOR, `${FOOTER_ANCHOR}${legal}`));
    } else if (/\.(txt|xml)$/.test(f)) fs.copyFileSync(path.join(REPO, f), path.join(out, f));
  }
  for (const dir of ['css', 'js', 'img']) fs.cpSync(path.join(REPO, dir), path.join(out, dir), { recursive: true });

  let js = fs.readFileSync(path.join(out, 'js/main.js'), 'utf8').replace(/\r\n/g, '\n');   // the checkout may be CRLF
  for (const [a, b] of PATCHES) {
    if (!js.includes(a)) throw new Error(`site patch no longer matches js/main.js:\n${a}`);
    js = js.replace(a, b);
  }
  fs.writeFileSync(path.join(out, 'js/main.js'), js);

  const src = fs.readFileSync(path.join(REPO, 'data/data.js'), 'utf8');
  const grab = (name) => JSON.parse(src.match(new RegExp(`window\\.${name}\\s*=\\s*(\\[.*?\\]);`, 's'))[1]);
  return { breeds: grab('PC_BREEDS'), profiles: grab('PC_BREEDERS') };
}
