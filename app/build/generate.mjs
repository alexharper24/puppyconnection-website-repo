// The public site generator (spec section 9, plan P4.3). It builds every public page from the
// data files the publish commits (lib/shape.js), in the concept site's look: the concept's head,
// header, footer, css/style.css and js/main.js, with one static page per puppy, breed and breeder.
// Node only, no npm.
//
// It runs in two places. The site repository (alexharper24/puppyconnection-site, decision D10)
// carries a copy at build/generate.mjs, beside the concept's files in templates/, and Cloudflare
// Workers Builds runs it there through build/ci-build.sh after each publish, over the data that
// build/fetch-data.mjs fetches from the portal, then check_site.py as a gate, then deploys the
// pages with the site Worker. This file is the source of that copy:
// change it here, test it here, and send it across with app/build/sync-site-repo.mjs.
//
//   node build/generate.mjs --data <folder holding data/*.json> --out <folder>
//        [--templates <folder>] [--base https://site.puppyconnection.workers.dev/]
//        [--portal https://portal...] [--indexable]
//
// --templates is the folder holding the concept's index.html, puppies.html, list-with-us.html,
// css/, img/ and js/main.js. It defaults to ../templates beside this file when that exists (the
// site repository) and to the repository root otherwise (this repository, where the concept is).
//
// No photo is copied or committed (decision D11). The data names each photo as media/<id> or
// brand/<breeder id>/<kind>, which the site Worker serves from R2, or as a Wix address for a
// photo not imported yet.
//
// Without --indexable (or SITE_INDEXABLE=1) every page carries noindex and robots.txt turns
// crawlers away, which is right for staging and for review. Launch turns it on (launch L-list).
//
// Addresses never change once published, so links and search results keep working:
//   puppy-<puppy slug>.html, breed-<breed slug>.html, breeder-<breeder slug>.html
// beside the concept's index.html, puppies.html, breeds.html, breeders.html and
// list-with-us.html. They are flat at the root so check_site.py, which reads the root, checks
// every page. The concept's old puppy.html?slug= style addresses become small pages that send
// the visitor on, and each imported Wix /product-page/<slug> gets a 301 in _redirects.

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { INFO_PAGES } from './info-pages.mjs';
import { loadGuides, loadHighlights } from './guides.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../..');
/** The concept's files: ../templates in the site repository, the repository root here. */
export function templatesDir(given) {
  if (given) return path.resolve(given);
  const beside = path.resolve(HERE, '../templates');
  return fs.existsSync(path.join(beside, 'index.html')) ? beside : REPO;
}
const CONCEPT_BASE = 'https://alexharper24.github.io/puppyconnection-website-repo/';
const FOOTER_ANCHOR = '<li><a href="list-with-us.html#pricing">Pricing</a></li>';

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => (n == null ? '' : `$${Number(n).toLocaleString('en-US')}`);
const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d\d)-(\d\d)/); return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : null; };
const shortDate = (iso) => (longDate(iso) || '').replace(/,? \d{4}$/, '');
const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : `${t.slice(0, t.lastIndexOf(' ', n - 1) > 40 ? t.lastIndexOf(' ', n - 1) : n - 1)}...`; };

// The concept's image helpers, for photos still on Wix. A photo in R2 is served by the site Worker
// at media/<id>, and a slot 640 px wide or less takes its card copy at media/<id>/card.
const isWix = (u) => /wixstatic\.com/.test(u || '');
function wix(base, w, h) { return `${base}/v1/fill/w_${w},h_${h},al_t,q_82,usm_0.66_1.00_0.01,enc_auto/i.jpg`; }
function wixFit(base, w, h) { return `${base}/v1/fit/w_${w},h_${h},q_85,enc_auto/i.jpg`; }
// A measured photo (ops/measure_photos.py) is cropped to the slot's shape around its focus point,
// the part of the frame that holds the puppy, and then scaled. Anchoring to the top edge instead
// kept empty wall above a puppy sitting low in a tall photo.
function wixCrop(photo, w, h) {
  const t = w / h;
  const [cw, ch] = photo.w / photo.h < t ? [photo.w, Math.round(photo.w / t)] : [Math.round(photo.h * t), photo.h];
  const x = Math.min(Math.max(Math.round(photo.fx * photo.w - cw / 2), 0), photo.w - cw);
  const y = Math.min(Math.max(Math.round(photo.fy * photo.h - ch / 2), 0), photo.h - ch);
  return `${photo.src}/v1/crop/x_${x},y_${y},w_${cw},h_${ch}/fill/w_${w},h_${h},al_c,q_82,usm_0.66_1.00_0.01,enc_auto/i.jpg`;
}
function fill(photo, w, h) {
  if (!photo) return '';
  if (isWix(photo.src)) return photo.w && photo.h ? wixCrop(photo, w, h) : wix(photo.src, w, h);
  return w <= 640 && photo.card ? photo.card : photo.src;
}

// The photo that stands for a breed or a breeder on a card. It is chosen from every photo of the
// puppies still available, preferring a landscape photo, which fills a 3:2 card with little crop,
// and one wide enough not to be enlarged. Unmeasured photos rank below measured good ones.
function photoScore(ph, i) {
  const a = ph.aspect || (ph.w && ph.h ? ph.w / ph.h : null);
  const shape = a == null ? 0.4 : a >= 1.25 && a <= 1.8 ? 1 : a >= 1 ? 0.65 : 0.3;
  const width = ph.w ? Math.min(ph.w, a && a < 1.5 ? ph.w : ph.h * 1.5, 900) / 900 : 0.5;
  return shape * 0.6 + width * 0.4 + (i === 0 ? 0.05 : 0);
}
function fit(photo, w, h) { if (!photo) return ''; return isWix(photo.src) ? wixFit(photo.src, w, h) : (w <= 640 && photo.card ? photo.card : photo.src); }

export const pageFor = { puppy: (s) => `puppy-${s}.html`, breed: (s) => `breed-${s}.html`, breeder: (s) => `breeder-${s}.html`, guide: (s) => `guide-${s}.html` };

// Whether a breed page names the breeders behind its puppies in its body copy (SEO plan P13).
// Off until the Wix pairing is confirmed, see the breed page below.
export const SHOW_BREED_BREEDERS = false;

// js/main.js is copied with these changes, each of which must still match the concept's file.
const MAIN_PATCHES = [
  // Photos in R2 are served by the site Worker at media/<id>, and narrow slots take the card copy.
  ["  function wix(base, w, h) {\n    if (!base) return '';", "  function wix(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return pcLocal(base, w);\n    if (base.indexOf('/v1/') > 0) return base;"],
  ["  function wixFit(base, w, h) {\n    if (!base) return '';", "  function wixFit(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return pcLocal(base, w);"],
  ["  /* \"fit\" letterboxes", "  function pcLocal(base, w) {\n    return w <= 640 && /^media\\/[\\w-]+$/.test(base) ? base + '/card' : base;\n  }\n  /* \"fit\" letterboxes"],
  // Breeder pages are named by the breeder's own slug, not their website.
  ['function breederSlug(l) { return l.breeder_domain ?', 'function breederSlug(l) { return l.breeder_slug || null; } function pcOldSlug(l) { return l.breeder_domain ?'],
  // A breeder with no website gets a stand-in domain for grouping, never shown as a website.
  ["if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: l.breeder_domain, listings: [] };",
    "if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: /\\.puppyconnection$/.test(l.breeder_domain) ? (l.breeder_place || '') : l.breeder_domain, listings: [] };"],
  // The static pages carry the concept's ids for its styles, so these renderers only run where
  // the page loads the listing data (the home page and the puppy browser).
  ["if (document.querySelector('#detail')) {", "if (document.querySelector('#detail') && L.length) {"],
  ["if (document.querySelector('#breederIndex')) {", "if (document.querySelector('#breederIndex') && L.length) {"],
  ["if (document.querySelector('#profile')) {", "if (document.querySelector('#profile') && L.length) {"],
  ["if (document.querySelector('#breedPage')) {", "if (document.querySelector('#breedPage') && L.length) {"],
  ["if (document.querySelector('#breedIndex')) {", "if (document.querySelector('#breedIndex') && L.length) {"],
];

function patchMain(js) {
  js = js.replace(/\r\n/g, '\n');
  for (const [a, b] of MAIN_PATCHES) {
    if (!js.includes(a)) throw new Error(`generate.mjs: a js/main.js patch no longer matches:\n${a}`);
    js = js.replace(a, b);
  }
  // The search links through pageHref(), which the flag switches to the static pages.
  if (!js.includes('var STATIC_PAGES = false;')) throw new Error('generate.mjs: js/main.js no longer has the STATIC_PAGES flag');
  js = js.replace('var STATIC_PAGES = false;', 'var STATIC_PAGES = true;');
  // Every query-string address becomes the static page's address.
  js = js.replace(/(puppy|breed|breeder)\.html\?slug=' \+ esc\((.+?)\) \+(\s*)'"/g, "$1-' + esc($2) +$3'.html\"")
    .replace("'breed.html?slug=' + encodeURIComponent(heroSel.value)", "'breed-' + encodeURIComponent(heroSel.value) + '.html'");
  // The concept's written-profile examples are not part of the generated site.
  js = js.replace("breeder.html?profile=' + esc(x.slug) + '\"", 'breeders.html"');
  const left = js.match(/(puppy|breed|breeder)\.html\?/g);
  if (left) throw new Error(`generate.mjs: js/main.js still links to a query-string page (${left.join(', ')})`);
  return js;
}

// The small script every generated page loads: the gallery and the view and click counts (plan
// P2.5). The counts go to /api/beacon on the site Worker, carry only the kind and the puppy's
// slug, set no cookie, and a failure is silent.
const PAGES_JS = `/* Puppy Connection generated pages. Written by app/build/generate.mjs. */
(function () {
  'use strict';
  function beacon(k, s) {
    try {
      var body = JSON.stringify({ k: k, s: s });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/beacon', new Blob([body], { type: 'text/plain' }));
      else fetch('/api/beacon', { method: 'POST', body: body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(function () {});
    } catch (e) { /* counting never gets in the way of the page */ }
  }
  var page = document.querySelector('[data-puppy]');
  if (page) {
    var slug = page.getAttribute('data-puppy');
    beacon('view', slug);
    var box = document.querySelector('#detail');
    if (box) box.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.contact-list a, .puppy-out')) beacon('click', slug); });
  }
  var gal = document.querySelector('#dGallery');
  var main = document.querySelector('#dMain img');
  if (gal && main) {
    gal.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      gal.querySelectorAll('button').forEach(function (x) { x.removeAttribute('aria-current'); });
      btn.setAttribute('aria-current', 'true');
      main.src = btn.getAttribute('data-full');
    });
    var prev = document.querySelector('.thumb-nav.prev');
    var next = document.querySelector('.thumb-nav.next');
    if (prev && next) {
      var sync = function () {
        var over = gal.scrollWidth - gal.clientWidth;
        prev.hidden = over < 8 || gal.scrollLeft < 8;
        next.hidden = over < 8 || gal.scrollLeft > over - 8;
      };
      var go = function (dir) { gal.scrollLeft += dir * Math.max(gal.clientWidth - 84, 84); sync(); };
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      gal.addEventListener('scroll', sync);
      addEventListener('resize', sync);
      sync();
    }
  }
})();
`;

/** Read the data files and join them into what the pages need. */
export function loadData(dataDir) {
  const read = (f) => {
    const file = path.join(dataDir, 'data', f);
    if (!fs.existsSync(file)) throw new Error(`generate.mjs: ${file} is missing. The publish writes data/*.json, so nothing can be built until it has run once.`);
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  };
  const breeds = read('breeds.json'), breeders = read('breeders.json'), litters = read('litters.json'), puppies = read('puppies.json');
  const breedBy = Object.fromEntries(breeds.map((b) => [b.slug, b]));
  const breederBy = Object.fromEntries(breeders.map((b) => [b.slug, b]));
  const litterBy = Object.fromEntries(litters.map((l) => [l.id, l]));
  const perLitter = {};
  for (const p of puppies) perLitter[p.litter] = (perLitter[p.litter] || 0) + 1;
  for (const p of puppies) {
    p.l = litterBy[p.litter] || {};
    p.b = breedBy[p.l.breed] || { slug: p.l.breed, name: p.l.breed };
    p.br = breederBy[p.breeder] || null;
    p.placed = p.availability === 'placed';
    p.mates = perLitter[p.litter] || 1;
  }
  return { breeds, breeders, litters, puppies, breedBy, breederBy };
}

const realBreeder = (b) => b && b.slug !== 'unassigned';
const place = (b) => [b.city, b.state].filter(Boolean).join(', ');
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
// Available first, then pending, then placed, and newest first within each.
const order = { available: 0, pending: 1, placed: 2 };
const byStanding = (a, b) => (order[a.availability] - order[b.availability]) || String(b.published_at).localeCompare(String(a.published_at)) || a.slug.localeCompare(b.slug);

export function build({ dataDir, out, templates, guides = path.resolve(HERE, '../content/guides'), highlights = path.resolve(HERE, '../content/breeds'), base = 'https://site.puppyconnection.workers.dev/', portal = 'https://portal.puppyconnection.workers.dev', indexable = false, strictCopy = false }) {
  if (!base.endsWith('/')) base += '/';
  const T = templatesDir(templates);
  const D = loadData(dataDir);
  // A breeder link that several puppies share is the breeder's listings page, not one puppy's own
  // page, so it is labeled that way (Alex, 2026-10-11: each puppy's own page as a button).
  const urlUses = {};
  for (const p of D.puppies) if (p.breeder_url) urlUses[p.breeder_url] = (urlUses[p.breeder_url] || 0) + 1;
  const ownPage = (p) => !!p.breeder_url && urlUses[p.breeder_url] === 1;
  const concept = (f) => fs.readFileSync(path.join(T, f), 'utf8').replace(/\r\n/g, '\n');
  const idx = concept('index.html');
  const cssV = (idx.match(/css\/style\.css\?v=(\d+)/) || [])[1];
  const head0 = idx.slice(0, idx.indexOf('<title>'));
  const hdr = idx.slice(idx.indexOf('<a class="skip-link"'), idx.indexOf('<main id="home">'));
  let ftr = idx.slice(idx.indexOf('<footer class="site-footer">'), idx.indexOf('</footer>') + '</footer>'.length);
  // The footer's base line carries the copyright, this year's, and the Privacy and Listing terms
  // links, which live on the portal (Alex, 2026-10-11: "where is the copyright info").
  const legalLinks = `<p class="foot-legal"><a href="${portal}/privacy">Privacy</a><a href="${portal}/terms">Listing terms</a></p>`;
  const withLegal = (h) => {
    if (!h.includes('<p class="foot-legal"></p>')) throw new Error('generate.mjs: the footer base line is missing its legal-links slot');
    return h.replace('<p class="foot-legal"></p>', legalLinks).replace(/&copy; \d{4}/, `&copy; ${new Date().getFullYear()}`);
  };
  ftr = withLegal(ftr);
  // The site's own pages get a footer column on the generated site only, because the concept at the
  // repository root does not have them and check_site.py would find the links broken there.
  const FOOTER_END = '    </div>\n    <div class="foot-base">';
  const chev = (ftr.match(/<span class="foot-more">.*?<\/span>/) || [''])[0];
  const infoCol = `      <details class="foot-sec" open>
        <summary><h2 class="foot-h">Puppy Connection${chev}</h2></summary>
        <ul>
${INFO_PAGES.map((pg) => `          <li><a href="${pg.file}">${pg.name}</a></li>`).join('\n')}
        </ul>
      </details>
`;
  const withInfo = (s) => { if (!s.includes(FOOTER_END)) throw new Error('generate.mjs: the footer no longer ends as the site-pages column expects'); return s.replace(FOOTER_END, infoCol + FOOTER_END); };
  ftr = withInfo(ftr);
  // The mailing list sign-up (migrations/0011_mailing_list.sql). A plain form posting to the
  // portal, so it needs no script. "website" is a honeypot that people never see.
  const BLURB_END = 'never by us.</p>\n      </div>';
  const signup = `never by us.</p>\n        <form class="foot-signup" method="post" action="${portal}/subscribe">\n          <label for="foot-email">Hear about new puppies and news</label>\n`
    + '          <div class="foot-signup-row"><input id="foot-email" name="email" type="email" autocomplete="email" placeholder="Your email" required maxlength="200"><button class="btn btn-gold" type="submit">Sign up</button></div>\n'
    + '          <div class="hp" aria-hidden="true"><label for="foot-website">Leave this empty</label><input id="foot-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>\n'
    + '        </form>\n      </div>';
  const withSignup = (s) => { if (!s.includes(BLURB_END)) throw new Error('generate.mjs: the footer blurb the sign-up box follows has changed'); return s.replace(BLURB_END, signup); };
  ftr = withSignup(ftr);
  const robots = indexable ? '' : '<meta name="robots" content="noindex, nofollow">\n';
  const headBase = head0.replace(/<meta name="robots"[^>]*>\n/, '') + robots;
  if (!/color-scheme" content="light only"/.test(headBase)) throw new Error('generate.mjs: the concept head lost its light-mode lock');

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const dir of ['css', 'img']) fs.cpSync(path.join(T, dir), path.join(out, dir), { recursive: true });
  // The favicon sits at the root, where browsers look for it whatever the page says (option X, 2026-10-11).
  if (fs.existsSync(path.join(T, 'favicon.ico'))) fs.copyFileSync(path.join(T, 'favicon.ico'), path.join(out, 'favicon.ico'));
  fs.mkdirSync(path.join(out, 'js'), { recursive: true });
  fs.mkdirSync(path.join(out, 'data'), { recursive: true });
  const mainJs = patchMain(concept('js/main.js'));
  fs.writeFileSync(path.join(out, 'js/main.js'), mainJs);
  fs.writeFileSync(path.join(out, 'js/pages.js'), PAGES_JS);
  const mainV = hash(mainJs), pagesV = hash(PAGES_JS);

  // ---- the listing data the home page and the puppy browser render with js/main.js
  const breedCounts = {};
  for (const p of D.puppies) breedCounts[p.b.slug] = (breedCounts[p.b.slug] || 0) + 1;
  const leadOf = (list) => {
    const pool = list.some((x) => !x.placed && x.photos.length) ? list.filter((x) => !x.placed) : list;
    let best = null; let top = -1;
    for (const p of pool) p.photos.forEach((ph, i) => { const sc = photoScore(ph, i); if (sc > top) { top = sc; best = ph; } });
    return best;
  };
  const listedBreeds = D.breeds.filter((b) => breedCounts[b.slug] || b.guide.length);
  const pcListings = D.puppies.map((p) => ({
    slug: p.slug, name: `${p.name} - ${p.b.name}`, price: p.price, in_stock: !p.placed,
    birthdate: longDate(p.l.born_on), ready_date: longDate(p.l.ready_on), deposit: p.deposit,
    mom_weight: p.l.mom_weight_lb != null ? `${p.l.mom_weight_lb} lbs` : null, dad_weight: p.l.dad_weight_lb != null ? `${p.l.dad_weight_lb} lbs` : null,
    color: p.color || null, coat: p.coat || null,
    breeder_phone: p.br && p.br.phone, breeder_email: p.br && p.br.email, hypoallergenic: p.hypoallergenic, includes: p.includes,
    description: p.about.join('\n\n'), images: p.photos.map((x) => x.src),
    breeder_domain: realBreeder(p.br) ? (host(p.br.website) || `${p.br.slug}.puppyconnection`) : null,
    breeder_slug: realBreeder(p.br) ? p.br.slug : null, breeder_place: p.br ? place(p.br) : '',
    puppy_name: p.name, breed: p.b.name, litter: p.mates > 1 ? p.litter : null, status: p.placed ? 'adopted' : p.availability,
    breeder_name: realBreeder(p.br) ? p.br.name : null, breeder_url: p.breeder_url, breeder_url_tier: p.breeder_url ? (ownPage(p) ? 'puppy' : 'available') : null,
    lead_aspect: (p.photos[0] && p.photos[0].aspect) || 1.5,
    // The phone card's 4:5 photo, cut around the puppy rather than from the top edge. A top
    // anchor kept only the middle of a landscape photo and cut off heads (Alex, 2026-10-07).
    lead_tall: p.photos[0] && isWix(p.photos[0].src) && p.photos[0].w ? fill(p.photos[0], 480, 600) : null,
  }));
  const pcBreeds = listedBreeds.map((b) => {
    const lead = leadOf(D.puppies.filter((p) => p.b.slug === b.slug));
    return { name: b.name, slug: b.slug, live_count: breedCounts[b.slug] || 0, demo_count: breedCounts[b.slug] || 0, guide: [], photo: lead ? (isWix(lead.src) ? fill(lead, 600, 400) : lead.src) : null,
      // The phone home page shows breed cards at portrait 4:5 (Alex, 2026-10-07), cropped around the same focus point.
      photo_tall: lead && isWix(lead.src) ? fill(lead, 480, 600) : null };
  });
  const dataJs = `// Written by app/build/generate.mjs from data/*.json. Do not edit.\nwindow.PC_LISTINGS=${JSON.stringify(pcListings)};\nwindow.PC_BREEDS=${JSON.stringify(pcBreeds)};\nwindow.PC_BREEDERS=[];\n`;
  fs.writeFileSync(path.join(out, 'data/data.js'), dataJs);
  const dataV = hash(dataJs);

  // ---- page assembly
  const pages = [];
  const social = (title, desc, url, image) => [
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Puppy Connection">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:image" content="${esc(image || `${base}img/brand/og-card.jpg`)}">`,
    ...(image ? [] : ['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">']),
    '<meta name="twitter:card" content="summary_large_image">',
  ].join('\n');
  const crumbs = (trail) => `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['Home', base], ...trail].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  })}</script>`;
  const fonts = [
    '<link rel="preconnect" href="https://static.wixstatic.com" crossorigin>',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600&family=Barlow:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet">',
    `<link rel="stylesheet" href="css/style.css?v=${cssV}">`,
  ].join('\n');
  const absolute = (src) => (!src ? null : /^https?:/.test(src) ? src : base + src);

  // Photos each page shows, by page, for the sitemap's image entries (SEO plan P15). Google Images
  // answers searches such as "havanese puppy", and the generator owns the sitemap.
  const pageImages = {};
  const imageUrl = (ph) => (!ph ? null : isWix(ph.src) ? wixFit(ph.src, 1200, 1200) : absolute(ph.src));

  function write(file, { title, desc, body, trail, current, image, scripts = 'pages', ld = [], images = [] }) {
    const url = file === 'index.html' ? base : base + file;
    let h = hdr;
    if (current) h = h.replace(`href="${current}"`, `href="${current}" aria-current="page"`);
    const tail = scripts === 'data'
      ? `<script src="data/data.js?v=${dataV}"></script>\n<script src="js/main.js?v=${mainV}"></script>\n`
      : `<script src="js/main.js?v=${mainV}"></script>\n<script src="js/pages.js?v=${pagesV}"></script>\n`;
    const extra = ld.map((o) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...o })}</script>\n`).join('');
    const htmlOut = `${headBase}<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}">\n${social(title, desc, url, image)}\n`
      + `${trail ? `${crumbs(trail)}\n` : ''}${extra}${fonts}\n</head>\n<body>\n\n${h}${body}\n\n${ftr}\n${tail}</body>\n</html>\n`;
    fs.writeFileSync(path.join(out, file), htmlOut);
    pages.push(file);
    const imgs = [...new Set(images.filter(Boolean))];
    if (imgs.length) pageImages[url] = imgs;
  }

  // The place a page may name. Breeders list from more than Indiana as the directory grows (Alex,
  // 2026-10-07), so a breed page names a state only when every breeder listing that breed has
  // the same state on record, and names none otherwise.
  const STATES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
  const stateName = (s) => { const t = String(s || '').trim(); return STATES[t.toUpperCase()] || (Object.values(STATES).includes(t) ? t : null); };
  const sharedState = (list) => {
    const states = new Set(list.map((p) => (realBreeder(p.br) ? stateName(p.br.state) : null)));
    return states.size === 1 && !states.has(null) ? [...states][0] : null;
  };
  const priceRange = (list) => {
    const v = list.map((p) => p.price).filter((x) => x != null && x > 0);
    if (!v.length) return '';
    const lo = Math.min(...v), hi = Math.max(...v);
    return lo === hi ? `, priced at ${money(lo)}` : `, priced ${money(lo)} to ${money(hi)}`;
  };
  const priceSpan = (list) => {
    const v = list.map((p) => p.price).filter((x) => x != null && x > 0);
    if (!v.length) return '';
    const lo = Math.min(...v), hi = Math.max(...v);
    return lo === hi ? money(lo) : `${money(lo)} to ${money(hi)}`;
  };
  const span = (vals, unit = '') => {
    const v = vals.filter((x) => x != null && x > 0);
    if (!v.length) return '';
    const lo = Math.min(...v), hi = Math.max(...v), f = (n) => (unit ? `${n}` : money(n));
    return lo === hi ? `${f(lo)}${unit}` : `${f(lo)} to ${f(hi)}${unit}`;
  };
  // The listing figures a breed guide can carry (keyword research 2026-10-07: families search a
  // breed's price, size and what comes home with it). Guides are written in the admin, where
  // {{count}}, {{price_range}}, {{deposit_range}}, {{includes}} and {{parent_weights}} stand for
  // a sentence computed from the breed's listings, so no price is ever typed into copy and each
  // figure follows the listings on every publish. An empty figure drops out of its paragraph.
  const guideTokens = (b, pups) => {
    const open = pups.filter((p) => !p.placed);
    const pool = open.length ? open : pups;
    const now = open.length ? 'listed on Puppy Connection right now' : 'listed on Puppy Connection recently';
    const n = open.length;
    const price = priceSpan(pool), deposit = span(pool.map((p) => p.deposit));
    const has = (...w) => pool.filter((p) => { const t = p.includes.join(' ').toLowerCase(); return w.some((x) => t.includes(x)); }).length;
    const inc = [['a vet exam', has('examination', 'vet exam')], ['a microchip', has('microchip')], ['a health record', has('health record')], ['AKC registration', has('akc regist')], ['a written health guarantee', has('guarantee')]].filter((x) => x[1]);
    const moms = span(pool.map((p) => p.l.mom_weight_lb), ' pounds'), dads = span(pool.map((p) => p.l.dad_weight_lb), ' pounds');
    return {
      count: n ? `${n} ${b.name} ${n === 1 ? 'puppy is' : 'puppies are'} listed on Puppy Connection right now.` : `No ${b.name} puppies are listed right now, and new litters appear here as breeders add them.`,
      price_range: price ? `${b.name} puppies ${now} are priced ${price.includes(' to ') ? 'from' : 'at'} ${price}.` : '',
      deposit_range: deposit ? `Breeders who take a deposit ask ${deposit} to hold a puppy.` : '',
      includes: inc.length && pool.length ? includesLine(pool.length, inc) : '',
      colors_listed: (() => { const c = [...new Set(open.map((p) => p.color).filter(Boolean).map((x) => x.trim()))]; return c.length ? `${b.name} colors listed on Puppy Connection right now include ${andList(c.slice(0, 8).map((x) => x.toLowerCase()))}.` : ''; })(),
      parent_weights: moms || dads ? `Where breeders have given the parents' adult weights, ${[moms && `the mothers weigh ${moms}`, dads && `the fathers weigh ${dads}`].filter(Boolean).join(' and ')}.` : '',
    };
  };
  // "All 18 listings here come with a vet exam and a microchip, and 8 come with AKC registration."
  const andList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const includesLine = (n, inc) => {
    const all = inc.filter(([, c]) => c === n).map(([w]) => w), some = inc.filter(([, c]) => c < n);
    const parts = [];
    if (all.length) parts.push(n === 1 ? `The listing here comes with ${andList(all)}` : `All ${n} listings here come with ${andList(all)}`);
    if (some.length) parts.push(`${parts.length ? '' : `Of the ${n} listings here, `}${andList(some.map(([w, c]) => `${c} ${c === 1 ? 'comes' : 'come'} with ${w}`))}`);
    return `${parts.join(', and ')}. Each listing says what that puppy goes home with.`;
  };
  // A guide paragraph that starts with "## " is a section heading. Everything else is a paragraph.
  const guideHtml = (paragraphs, tokens) => paragraphs.map((t) => {
    const filled = String(t).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m)).replace(/\s+/g, ' ').trim();
    if (!filled) return '';
    const h = filled.match(/^##\s+(.+)$/);
    return h ? `<h2>${esc(h[1])}</h2>` : `<p>${esc(filled)}</p>`;
  }).join('');
  // Pages that name each other because families compare them (the Munchkin page keeps its own
  // name and never calls itself Mini, per the 2026-09-28 keyword plan, but points to the Mini page).
  const SEE_ALSO = { 'munchkin-bernedoodle': ['mini-bernedoodle'], 'mini-bernedoodle': ['munchkin-bernedoodle'] };

  // A sentence of links, "A, B and C", for links inside body copy (SEO plan P13).
  const linkList = (items) => {
    const a = items.map(([href, name]) => `<a href="${href}">${esc(name)}</a>`);
    return a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
  };

  // A card, as js/main.js draws it, so a static grid and a rendered one look the same.
  let cardN = 0;
  function card(p) {
    const eager = cardN++ < 2;
    const lead = p.photos[0];
    const tall = ((lead && lead.aspect) || 9) < 1.2;
    const label = p.placed ? 'Adopted' : p.availability === 'pending' ? 'Pending' : '';
    return `<a class="card${p.placed ? ' is-sold' : ''}" href="${pageFor.puppy(p.slug)}">`
      + `<div class="card-media${tall ? ' is-whole' : ''}"${tall && lead ? ` style="--fill:url(${esc(fill(lead, 60, 40))})"` : ''}>`
      + (lead ? `<img src="${esc(tall ? fit(lead, 600, 400) : fill(lead, 600, 400))}" alt="${esc(p.name)}, ${esc(p.b.name)}" ${eager ? 'decoding="async"' : 'loading="lazy" decoding="async"'} width="600" height="400">` : '')
      + (label ? `<span class="tag ${p.placed ? 'tag-sold' : 'tag-pending'}">${label}</span>` : '')
      + (p.mates > 1 ? `<span class="tag tag-litter">Litter of ${p.mates}</span>` : '')
      + `</div><div class="card-body"><div class="card-name">${esc(p.name)}</div><div class="card-breed">${esc(p.b.name)}</div>`
      + `<div class="card-foot"><span class="price">${money(p.price)}</span><span class="card-ready">${p.l.ready_on ? `Ready ${esc(shortDate(p.l.ready_on))}` : ''}</span></div></div></a>`;
  }
  const grid = (list, empty, cls = 'grid grid-4') => { cardN = 0; return list.length ? `<div class="${cls}">${list.map(card).join('')}</div>` : `<p class="empty">${empty}</p>`; };
  const paras = (list) => list.map((t) => `<p>${esc(t)}</p>`).join('');
  const tel = (s) => String(s).replace(/[^\d+]/g, '');

  // ---- breed guides (build/guides.mjs). Only published guides for a breed that is listed.
  const GUIDES = loadGuides(guides).filter((g) => g.published && listedBreeds.some((b) => b.slug === g.breed));
  const guidesFor = (slug) => GUIDES.filter((g) => g.breed === slug);
  const HIGHLIGHTS = loadHighlights(highlights);
  const guideList = (slug, cls = 'guide-list') => `<ul class="${cls}">${guidesFor(slug).map((g) => `<li><a href="${pageFor.guide(g.slug)}">${esc(g.question)}</a></li>`).join('')}</ul>`;
  // The 2026-09-28 one-page guide drafts in breeds.guide (migration 0008) are off the breed pages
  // since the guide pages landed (D3, Alex 2026-10-17): the four highlights carry the folded
  // topics, and each topic with real search demand has its own guide page.
  if (GUIDES.length) {
    const hubItem = '<li><a href="guides.html">Breed guides</a></li>';
    const breedsItem = '<li><a href="breeds.html">Breeds</a></li>';
    if (ftr.includes(breedsItem)) ftr = ftr.replace(breedsItem, breedsItem + hubItem);
  }

  // ---- puppies
  const breedersShown = D.breeders.filter(realBreeder);
  for (const p of D.puppies) {
    const b = realBreeder(p.br) ? p.br : null;
    const mates = D.puppies.filter((x) => x.litter === p.litter && x.slug !== p.slug).sort(byStanding);
    const facts = [['Breed', p.b.name], ['Sex', p.sex ? p.sex[0].toUpperCase() + p.sex.slice(1) : null], ['Color', p.color], ['Coat type', p.coat],
      ['Born', longDate(p.l.born_on)], ['Ready to go home', longDate(p.l.ready_on)], ['Deposit', p.deposit ? money(p.deposit) : null],
      ['Mother', p.l.mom_weight_lb != null ? `${p.l.mom_weight_lb} lbs adult weight` : null], ['Father', p.l.dad_weight_lb != null ? `${p.l.dad_weight_lb} lbs adult weight` : null],
      ['Coat', p.hypoallergenic ? 'Hypoallergenic' : null], ['Registration', p.registry], ['Markings', p.markings]].filter((f) => f[1]);
    // Workplan A3. The health details the breeder wrote, each optional, in one block.
    const health = [['Health', p.health], ['Vaccinations', p.vaccinations], ['Deworming', p.deworming], ['Breeder disclosures', p.disclosures]]
      .filter((h) => h[1] && h[1].length);
    const videos = (p.videos || []).filter((v) => v.iframe);
    // The buttons under the price (Alex, 2026-10-11): the puppy's own page on the breeder's site
    // when there is one, otherwise their listings page, and a jump to the contact details.
    const outLabel = ownPage(p) ? `See ${p.name} on the breeder's website` : "See the breeder's available puppies";
    const outBtn = (p.breeder_url && !p.placed ? `<a class="btn btn-primary puppy-out" href="${esc(p.breeder_url)}" target="_blank" rel="noopener">${esc(outLabel)}</a>` : '')
      + (p.deposit_url && !p.placed ? `<a class="btn btn-ghost puppy-out" href="${esc(p.deposit_url)}" target="_blank" rel="noopener">Place a deposit with the breeder</a>` : '');
    const contact = [
      b && b.website ? `<li><a href="${esc(b.website)}" target="_blank" rel="noopener"><b>Website</b> ${esc(host(b.website))}</a></li>` : '',
      b && b.phone ? `<li><a href="tel:${esc(tel(b.phone))}"><b>Call</b> ${esc(b.phone)}</a></li>` : '',
      b && b.email ? `<li><a href="mailto:${esc(b.email)}"><b>Email</b> ${esc(b.email)}</a></li>` : '',
      b && b.facebook ? `<li><a href="${esc(b.facebook)}" target="_blank" rel="noopener"><b>Facebook</b> ${esc(b.name)}</a></li>` : '',
    ].join('');
    const lead = p.photos[0];
    const body = `<main id="detail" data-puppy="${esc(p.slug)}">\n<span id="content" tabindex="-1"></span>
<section class="band">
  <div class="wrap detail-grid">
    <div class="d-title">
      <p class="eyebrow" id="dBreed"><a href="${pageFor.breed(p.b.slug)}" style="color:inherit">${esc(p.b.name)}</a></p>
      <div class="name-row"><h1 id="dName">${esc(p.name)}</h1><span class="price" id="dPrice">${money(p.price)}</span></div>
      ${outBtn || (b && !p.placed) ? `<div class="btn-row d-actions">${outBtn}${b && !p.placed ? `<a class="btn btn-ghost" href="#dBreeder">Contact the breeder</a>` : ''}</div>` : ''}
      ${p.placed ? '<p class="meta">Adopted. This puppy has gone home and stays here so its litter can be seen.</p>' : p.availability === 'pending' ? '<p class="meta">Pending. Ask the breeder whether this puppy is still open.</p>' : ''}
    </div>
    <div class="d-media">
      <div class="gallery-main" id="dMain">${lead ? `<img src="${esc(fit(lead, 1200, 800))}" alt="${esc(p.name)}, ${esc(p.b.name)} puppy" decoding="async">` : ''}</div>
      ${p.photos.length > 1 ? `<div class="thumb-strip">
        <button class="thumb-nav prev" type="button" aria-label="Earlier photos" hidden>&#8249;</button>
        <div class="thumbs" id="dGallery">${p.photos.map((ph, i) => `<button type="button" aria-label="Show photo ${i + 1} of ${p.photos.length}"${i === 0 ? ' aria-current="true"' : ''} data-full="${esc(fit(ph, 1200, 800))}"><img src="${esc(fill(ph, 160, 160))}" alt="" loading="lazy" decoding="async" width="160" height="160"></button>`).join('')}</div>
        <button class="thumb-nav next" type="button" aria-label="More photos" hidden>&#8250;</button>
      </div>` : ''}
      ${p.about.length ? `<section class="about-block"><p class="eyebrow">About this puppy</p>${paras(p.about)}</section>` : ''}
      ${videos.length ? `<section class="about-block puppy-videos"><p class="eyebrow">${videos.length === 1 ? 'Video' : 'Videos'}</p>${videos.map((v, i) => `<div class="video-frame" style="position:relative;padding-top:56.25%;margin:0 0 .8rem"><iframe src="${esc(v.iframe)}${v.poster ? `?poster=${encodeURIComponent(v.poster)}` : ''}" title="Video ${i + 1} of ${esc(p.name)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`).join('')}</section>` : ''}
      ${health.length ? `<section class="about-block puppy-health"><p class="eyebrow">Health and care</p>${health.map((h) => `<h3>${esc(h[0])}</h3>${paras(h[1])}`).join('')}</section>` : ''}
    </div>
    <div class="d-detail">
      <dl class="facts">${facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>
      ${p.includes.length ? `<section><p class="eyebrow">Goes home with</p><ul class="includes">${p.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>` : ''}
      <div class="breeder-box" id="dBreeder">
        <div class="eyebrow">Raised by</div>
        <h2 class="breeder-name">${esc(b ? b.name : 'Breeder to be confirmed')}</h2>
        <p class="breeder-note">Puppy Connection lists this puppy. The sale is arranged directly with the breeder.</p>
        ${contact ? `<ul class="contact-list">${contact}</ul>` : '<p class="disclaimer">Contact details for this breeder are being confirmed.</p>'}
        ${b ? `<p style="margin:.9rem 0 0"><a href="${pageFor.breeder(b.slug)}">See all puppies from ${esc(b.name)}</a></p>` : ''}
      </div>
      <p class="disclaimer">Puppy Connection does not sell puppies, take deposits, or handle payment. Health records, guarantees and delivery are agreed directly between you and the breeder.</p>
      ${guidesFor(p.b.slug).length ? `<section class="guide-panel" aria-label="${esc(p.b.name)} guides"><p class="eyebrow">About the ${esc(p.b.name)}</p>${guideList(p.b.slug)}</section>` : ''}
    </div>
  </div>
</section>
${mates.length ? `<section class="band band-warm">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Same litter</p><h2>${mates.length} ${mates.length === 1 ? 'littermate' : 'littermates'}</h2></div><a class="link-more" href="puppies.html">All puppies</a></div>
    ${grid(mates, '')}
  </div>
</section>` : ''}
</main>`;
    const who = b ? ` from ${b.name}${place(b) ? ` in ${place(b)}` : ''}` : '';
    const when = p.placed ? 'Adopted.' : p.l.ready_on ? `Ready to go home ${longDate(p.l.ready_on)}.` : 'Available now.';
    write(pageFor.puppy(p.slug), {
      // SEO plan P11. "for sale" only while the puppy is, since an adopted puppy's page stays up.
      title: `${p.name}, ${p.b.name} Puppy${p.placed ? '' : ' for Sale'} | Puppy Connection`,
      desc: clip(`${p.name} is a ${p.sex ? `${p.sex} ` : ''}${p.b.name} puppy${who}. ${when} Contact the breeder directly.`, 158),
      body, trail: [['Available puppies', `${base}puppies.html`], [p.name, `${base}${pageFor.puppy(p.slug)}`]], image: absolute(lead && (isWix(lead.src) ? wix(lead.src, 1200, 630) : lead.src)),
      // Product snippet markup (Alex, 2026-10-11). Puppy Connection is not the seller, so this
      // is not merchant listing markup: the Offer names the breeder as seller, and a puppy with
      // no price carries none, since Google requires an offer price.
      ld: p.price ? [{ '@type': 'Product', name: `${p.name}, ${p.b.name} puppy`, category: `${p.b.name} puppies`,
        image: p.photos.slice(0, 6).map(imageUrl).filter(Boolean),
        ...(p.about.length ? { description: clip(p.about.join(' '), 300) } : {}),
        offers: { '@type': 'Offer', url: `${base}${pageFor.puppy(p.slug)}`, price: p.price, priceCurrency: 'USD',
          availability: p.placed ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          ...(b ? { seller: { '@type': 'Organization', name: b.name, url: `${base}${pageFor.breeder(b.slug)}` } } : {}) } }] : [],
      images: p.photos.map(imageUrl),
    });
  }

  // ---- breeds
  const breedCard = (b, w = 600, hh = 400) => {
    const lead = leadOf(D.puppies.filter((p) => p.b.slug === b.slug));
    const open = D.puppies.filter((p) => p.b.slug === b.slug && !p.placed).length;
    return `<a class="card" href="${pageFor.breed(b.slug)}"><div class="card-media">${lead ? `<img src="${esc(fill(lead, w, hh))}" alt="${esc(b.name)}" loading="lazy" decoding="async" width="${w}" height="${hh}">` : ''}</div>`
      + `<div class="card-body"><div class="card-name">${esc(b.name)}</div><div class="card-foot"><span class="card-ready">${open} available</span><span class="card-ready">${guidesFor(b.slug).length ? 'Guides' : ''}</span></div></div></a>`;
  };
  for (const b of listedBreeds) {
    const pups = D.puppies.filter((p) => p.b.slug === b.slug).sort(byStanding);
    const open = pups.filter((p) => !p.placed);
    const lead = leadOf(pups);
    const others = listedBreeds.filter((x) => x.slug !== b.slug).slice(0, 8);
    const shown = open.length ? open : pups;
    const where = sharedState(open.length ? open : pups);
    // SEO plan P13: the breeders listing this breed, linked from a sentence rather than only a card.
    const by = [...new Map(shown.filter((p) => realBreeder(p.br)).map((p) => [p.br.slug, p.br])).values()];
    // Off until the Wix pairing confirms which breeder raised each imported puppy (Alex,
    // 2026-10-07). The import guessed breeders from web addresses on each Wix page, and some
    // guesses are wrong, so a breed page should not name them yet. Turn on once paired.
    const byLine = SHOW_BREED_BREEDERS && by.length
      ? `<p>${open.length ? `The ${esc(b.name)} puppies listed now come` : `Recent ${esc(b.name)} listings came`} from ${linkList(by.map((x) => [pageFor.breeder(x.slug), x.name]))}. Each breeder's page shows the rest of their puppies and how to reach them.</p>`
      : '';
    const alsoBreeds = (SEE_ALSO[b.slug] || []).map((s) => listedBreeds.find((x) => x.slug === s)).filter(Boolean);
    // Breed page option 2 (Alex, 2026-10-11): an intro, four highlights and a price card, with the
    // rest of the old guide folded under More about the breed. A breed without a highlights file
    // keeps the full guide layout.
    const hl = HIGHLIGHTS[b.slug];
    const seeAlso = alsoBreeds.length ? `<p>Comparing sizes? See ${linkList(alsoBreeds.map((x) => [pageFor.breed(x.slug), `${x.name} puppies`]))} too, since breeders draw the line between Bernedoodle sizes in different places.</p>` : '';
    const body = `<main id="breedPage">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeds.html" style="color:inherit">Breeds</a></p>
    <h1>${esc(b.name)} puppies for sale</h1>
    <p class="meta">${open.length} available now${priceSpan(shown) ? `, ${open.length ? '' : 'recently '}priced ${priceSpan(shown)}` : ''}</p>
    ${priceSpan(shown) && !hl ? '<p class="meta" style="margin-top:.2rem">Each breeder sets their own price.</p>' : ''}
  </div>
</section>
${hl ? `<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div class="guide">
      <p class="breed-intro">${esc(hl.intro)}</p>
      <ul class="highlights">${hl.points.map((x) => `<li><b>${esc(x.lead)}</b> ${esc(x.text)}</li>`).join('')}</ul>
      ${guidesFor(b.slug).length ? `<section class="guide-panel" aria-label="${esc(b.name)} guides"><p class="eyebrow">${esc(b.name)} guides</p>${guideList(b.slug)}<a class="link-more" href="guides.html#${esc(b.slug)}">All breed guides</a></section>` : ''}
      ${byLine}${seeAlso}
    </div>
    <aside>
      ${lead ? `<figure class="breed-photo"><img src="${esc(fill(lead, 900, 600))}" alt="${esc(b.name)}" decoding="async"><span class="photo-cap">A ${esc(b.name)} currently listed</span></figure>` : ''}
      <div class="breed-buy">
        <p class="eyebrow">${open.length ? 'Available now' : 'Recently listed'}</p>
        <div class="bb-row"><span class="bb-count">${open.length ? `${open.length} ${open.length === 1 ? 'puppy' : 'puppies'}` : 'None listed today'}</span>${priceSpan(shown) ? `<span class="bb-price">${priceSpan(shown)}</span>` : ''}</div>
        <p class="bb-note">${priceSpan(shown) ? 'Each breeder sets their own price. ' : ''}You contact the breeder directly, and Puppy Connection does not take payment.</p>
        <a class="btn btn-primary bb-btn" href="#available">See the puppies</a>
      </div>
    </aside>
  </div>
</section>` : `<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div class="guide"><p>Every ${esc(b.name)} listed here is raised by the breeder named on the puppy's page, and each listing has that breeder's own description and contact details.</p>${guidesFor(b.slug).length
      ? `<section class="guide-panel" aria-label="${esc(b.name)} guides"><p class="eyebrow">${esc(b.name)} guides</p>${guideList(b.slug)}<a class="link-more" href="guides.html#${esc(b.slug)}">All breed guides</a></section>` : ''}${byLine}${seeAlso}</div>
    <aside>
      ${lead ? `<figure class="breed-photo"><img src="${esc(fill(lead, 900, 600))}" alt="${esc(b.name)}" decoding="async"><span class="photo-cap">A ${esc(b.name)} currently listed</span></figure>` : ''}
      <div class="breeder-box">
        <p class="eyebrow">How this works</p>
        <p class="breeder-note">Choose a puppy, then contact its breeder directly. Puppy Connection lists puppies. It does not sell them, take deposits or handle payment.</p>
        <div class="btn-row"><a class="btn btn-primary" href="#available">See what is available</a></div>
      </div>
    </aside>
  </div>
</section>`}
<section class="band band-warm" id="available">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">${open.length ? 'Available now' : 'Recently listed'}</p><h2>${esc(b.name)} puppies</h2></div><a class="link-more" href="puppies.html">All puppies</a></div>
    ${grid(open.length ? open : pups, `No ${esc(b.name)} puppies are listed at the moment.`)}
  </div>
</section>
${others.length ? `<section class="band">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Also listed</p><h2>Other breeds</h2></div><a class="link-more" href="breeds.html">All breeds</a></div>
    <div class="grid grid-4">${others.map((x) => breedCard(x, 480, 320)).join('')}</div>
  </div>
</section>` : ''}
</main>`;
    // SEO plan P5. The breed page is the money page for "<breed> puppies for sale". Its description
    // comes from the live listings, never the guide's first sentence cut off mid-word.
    const n = open.length;
    write(pageFor.breed(b.slug), {
      title: `${b.name} Puppies for Sale${where ? ` in ${where}` : ''} | Puppy Connection`,
      desc: clip(n
        ? `${n} ${b.name} ${n === 1 ? 'puppy' : 'puppies'} for sale from ${by.length === 1 ? 'a small family breeder' : 'small family breeders'}${where ? ` in ${where}` : ''}${priceRange(open)}. See each puppy and contact its breeder directly.`
        : `${b.name} puppies from small family breeders. None are listed right now, so see recent litters here or browse the other breeds.`, 158),
      body, trail: [['Breeds', `${base}breeds.html`], [b.name, `${base}${pageFor.breed(b.slug)}`]], image: absolute(lead && (isWix(lead.src) ? wix(lead.src, 1200, 630) : lead.src)),
      // SEO plan P14. The puppies the page lists, in the order it shows them.
      ld: [{ '@type': 'ItemList', name: `${b.name} puppies`, numberOfItems: shown.length,
        itemListElement: shown.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}${pageFor.puppy(p.slug)}`, name: `${p.name}, ${p.b.name}` })) }],
      images: [imageUrl(lead)],
    });
  }

  // ---- guide pages: one topic for one breed, handing families to the breed page and its puppies
  for (const g of GUIDES) {
    const b = listedBreeds.find((x) => x.slug === g.breed);
    const pups = D.puppies.filter((p) => p.b.slug === b.slug).sort(byStanding);
    const open = pups.filter((p) => !p.placed);
    const lead = leadOf(pups);
    const siblings = guidesFor(b.slug).filter((x) => x.slug !== g.slug);
    const body = `<main id="guidePage">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow"><a href="${pageFor.breed(b.slug)}" style="color:inherit">${esc(b.name)}</a></p>
    <h1>${esc(g.h1)}</h1>
  </div>
</section>
<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div class="guide">${guideHtml(g.paragraphs, guideTokens(b, pups))}</div>
    <aside>
      ${lead ? `<figure class="breed-photo"><img src="${esc(fill(lead, 900, 600))}" alt="${esc(b.name)}" decoding="async"><span class="photo-cap">A ${esc(b.name)} listed on Puppy Connection</span></figure>` : ''}
      <div class="breeder-box">
        <p class="eyebrow">${open.length ? `${open.length} available now` : 'Listings'}</p>
        <p class="breeder-note">${open.length ? `See every ${esc(b.name)} puppy listed now, then contact its breeder directly.` : `No ${esc(b.name)} puppies are listed right now. New litters appear on the breed page as breeders add them.`}</p>
        <div class="btn-row"><a class="btn btn-primary" href="${pageFor.breed(b.slug)}">${esc(b.name)} puppies for sale</a></div>
      </div>
      ${siblings.length ? `<section class="guide-panel" aria-label="More ${esc(b.name)} guides"><p class="eyebrow">More ${esc(b.name)} guides</p><ul class="guide-list">${siblings.map((x) => `<li><a href="${pageFor.guide(x.slug)}">${esc(x.question)}</a></li>`).join('')}</ul></section>` : ''}
    </aside>
  </div>
</section>
${open.length ? `<section class="band band-warm">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Available now</p><h2>${esc(b.name)} puppies</h2></div><a class="link-more" href="${pageFor.breed(b.slug)}">See all ${open.length}</a></div>
    ${grid(open.slice(0, 4), '')}
  </div>
</section>` : ''}
</main>`;
    write(pageFor.guide(g.slug), {
      title: g.title || `${g.h1} | Puppy Connection`, desc: g.description, body,
      trail: [['Breeds', `${base}breeds.html`], [b.name, `${base}${pageFor.breed(b.slug)}`], [g.h1, `${base}${pageFor.guide(g.slug)}`]],
      image: absolute(lead && (isWix(lead.src) ? wix(lead.src, 1200, 630) : lead.src)),
      ld: [{ '@type': 'Article', headline: g.h1, description: g.description, about: { '@type': 'Thing', name: b.name }, mainEntityOfPage: `${base}${pageFor.guide(g.slug)}`, publisher: { '@type': 'Organization', name: 'Puppy Connection', url: base } }],
      images: [imageUrl(lead)],
    });
  }
  if (GUIDES.length) {
    const withGuides = listedBreeds.filter((b) => guidesFor(b.slug).length);
    write('guides.html', {
      title: 'Breed Guides | Puppy Connection',
      desc: 'Guides to the breeds listed on Puppy Connection: how big each gets, how long it lives, whether it sheds and more, with the puppies listed now.',
      trail: [['Breed guides', `${base}guides.html`]],
      body: `<main id="guideHub">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Breed guides</p><h1>Guides to the breeds listed here</h1>
<p class="lede">Answers to what families ask most about each breed, with the puppies listed now one click away.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap guide-cards">
${withGuides.map((b) => {
  // Option A (Alex, 2026-10-11): a card per breed with its photo and its guides.
  const bp = D.puppies.filter((p) => p.b.slug === b.slug);
  const lead = leadOf(bp), n = bp.filter((p) => !p.placed).length, pr = priceSpan(bp.filter((p) => !p.placed));
  return `<article class="gc" id="${esc(b.slug)}"><a class="gc-photo" href="${pageFor.breed(b.slug)}" tabindex="-1" aria-hidden="true">${lead ? `<img src="${esc(fill(lead, 600, 400))}" alt="" loading="lazy" decoding="async" width="600" height="400">` : ''}</a>
<div class="gc-body"><h2><a href="${pageFor.breed(b.slug)}">${esc(b.name)}</a></h2><p class="gc-meta">${n} available${pr ? `, ${pr}` : ''}</p>${guideList(b.slug, 'gc-list')}</div></article>`;
}).join('\n')}
</div></section>
</main>`,
    });
  }

  // ---- breeders
  const breederCard = (b) => {
    const theirs = D.puppies.filter((p) => p.br === b);
    const lead = leadOf(theirs);
    const open = theirs.filter((p) => !p.placed).length;
    return `<a class="card" href="${pageFor.breeder(b.slug)}"><div class="card-media">${lead ? `<img src="${esc(fill(lead, 600, 400))}" alt="${esc(b.name)}" loading="lazy" decoding="async" width="600" height="400">` : ''}</div>`
      + `<div class="card-body"><div class="card-name">${esc(b.name)}</div><div class="card-breed">${esc(place(b) || host(b.website))}</div>`
      + `<div class="card-foot"><span class="card-ready">${open} available</span><span class="card-ready">${theirs.length} listed</span></div></div></a>`;
  };
  // A breeder with no logo of their own keeps the one the concept took from their website, where
  // js/main.js lists it (LOGOS), with a dark card for a white mark.
  const conceptLogos = Object.fromEntries([...concept('js/main.js').matchAll(/^\s+(\w+): \{ light: (true|false) \}/gm)].map((m) => [m[1], m[2] === 'true']));
  for (const b of breedersShown) {
    if (!b.logo && b.slug in conceptLogos && fs.existsSync(path.join(T, `img/breeders/${b.slug}.webp`))) {
      b.logo = { src: `img/breeders/${b.slug}.webp`, card: `img/breeders/${b.slug}.webp`, dark: conceptLogos[b.slug] };
    }
  }
  for (const b of breedersShown) {
    const theirs = D.puppies.filter((p) => p.br === b).sort(byStanding);
    const raised = b.breeds.map((s) => D.breedBy[s]).filter(Boolean);
    const contact = [
      b.website ? `<li><a href="${esc(b.website)}" target="_blank" rel="noopener"><b>Website</b> ${esc(host(b.website))}</a></li>` : '',
      b.phone ? `<li><a href="tel:${esc(tel(b.phone))}"><b>Call</b> ${esc(b.phone)}</a></li>` : '',
      b.email ? `<li><a href="mailto:${esc(b.email)}"><b>Email</b> ${esc(b.email)}</a></li>` : '',
      b.facebook ? `<li><a href="${esc(b.facebook)}" target="_blank" rel="noopener"><b>Facebook</b> ${esc(b.name)}</a></li>` : '',
    ].join('');
    const others = breedersShown.filter((x) => x !== b).slice(0, 6);
    // SEO plan P13: the breeds this breeder lists, from their own listings, linked from a sentence.
    const listedBreedsOf = [...new Map(theirs.filter((p) => !p.placed).map((p) => [p.b.slug, p.b])).values()];
    const listedLine = listedBreedsOf.length
      ? `<p>${esc(b.name)} currently lists ${linkList(listedBreedsOf.map((x) => [pageFor.breed(x.slug), x.name]))} puppies on Puppy Connection.</p>`
      : '';
    const body = `<main id="profile">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.6rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeders.html" style="color:inherit">Breeders</a></p>
    <div class="profile-head"><h1>${esc(b.name)}</h1>${place(b) ? `<p class="meta">${esc(place(b))}</p>` : ''}</div>
    ${b.phone || b.email || b.website ? `<div class="btn-row profile-actions">${b.phone ? `<a class="btn btn-primary" href="tel:${esc(tel(b.phone))}">Call ${esc(b.phone)}</a>` : ''}${b.email ? `<a class="btn btn-ghost" href="mailto:${esc(b.email)}">Email</a>` : ''}${b.website ? `<a class="btn btn-ghost" href="${esc(b.website)}" target="_blank" rel="noopener">Visit their website</a>` : ''}<a class="btn btn-ghost" href="#their">See their puppies</a></div>` : ''}
  </div>
</section>
<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div>
      <div class="prose">${paras(b.about)}${listedLine}</div>
      ${b.kennel_photo ? `<figure class="breed-photo"><img src="${esc(b.kennel_photo.src)}" alt="${esc(b.name)}" loading="lazy" decoding="async"></figure>` : ''}
      ${raised.length ? `<p class="eyebrow">Breeds they raise</p><ul class="includes">${raised.map((r) => `<li><a href="${pageFor.breed(r.slug)}">${esc(r.name)}</a></li>`).join('')}</ul>` : ''}
    </div>
    <aside>
      ${b.logo ? `<figure class="breeder-logo${b.logo.dark ? ' on-dark' : ''}"><img src="${esc(b.logo.card)}" alt="${esc(b.name)} logo" loading="lazy" decoding="async"></figure>` : ''}
      <div class="breeder-box">
        <p class="eyebrow">Talk to this breeder</p>
        ${contact ? `<ul class="contact-list">${contact}</ul>` : '<p class="disclaimer">Contact details for this breeder are being confirmed.</p>'}
        <p class="disclaimer">Puppy Connection is not part of the sale.</p>
      </div>
    </aside>
  </div>
</section>
<section class="band band-warm" id="their">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Currently listed</p><h2>${theirs.length} ${theirs.length === 1 ? 'puppy' : 'puppies'} from this breeder</h2></div><a class="link-more" href="puppies.html">All puppies</a></div>
    ${grid(theirs, 'No puppies are listed by this breeder right now.')}
  </div>
</section>
${others.length ? `<section class="band">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Directory</p><h2>Other breeders</h2></div><a class="link-more" href="breeders.html">All breeders</a></div>
    <div class="grid grid-3">${others.map(breederCard).join('')}</div>
  </div>
</section>` : ''}
</main>`;
    write(pageFor.breeder(b.slug), {
      title: `${b.name} | Puppy Connection`,
      desc: clip(b.about[0] || `Puppies listed by ${b.name}${place(b) ? ` in ${place(b)}` : ''}. Contact the breeder directly.`, 158),
      body, trail: [['Breeders', `${base}breeders.html`], [b.name, `${base}${pageFor.breeder(b.slug)}`]], image: absolute(b.kennel_photo && b.kennel_photo.src),
      images: [b.kennel_photo && absolute(b.kennel_photo.src)],
    });
  }

  // ---- state pages (keyword research 2026-10-08). Every "puppies for sale <state>" search we read
  // is led by a marketplace page listing every puppy in that state, and "dog breeders in <state>"
  // is easy to win in all six states read. A state gets its two pages once a breeder with that
  // state on record has a puppy listed, so no page goes up empty.
  const stateSlug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');
  pageFor.statePuppies = (s) => `puppies-for-sale-in-${stateSlug(s)}.html`;
  pageFor.stateBreeders = (s) => `dog-breeders-in-${stateSlug(s)}.html`;
  const stateOf = (b) => (realBreeder(b) ? stateName(b.state) : null);
  const statesListed = [...new Set(D.puppies.map((p) => stateOf(p.br)).filter(Boolean))].sort();
  // What the listings in a state say about deposits and what comes home with a puppy, the same
  // figures the breed guides carry, so a state page says something a family can use.
  const stateFacts = (list) => {
    const dep = span(list.map((p) => p.deposit));
    const has = (...w) => list.filter((p) => { const t = p.includes.join(' ').toLowerCase(); return w.some((x) => t.includes(x)); }).length;
    const inc = [['a vet exam', has('examination', 'vet exam')], ['a microchip', has('microchip')], ['a health record', has('health record')], ['AKC registration', has('akc regist')], ['a written health guarantee', has('guarantee')]].filter((x) => x[1]);
    return [dep ? `<p>Breeders here who take a deposit ask ${dep} to hold a puppy, and the deposit is paid to the breeder, never to Puppy Connection.</p>` : '',
      inc.length && list.length ? `<p>${esc(includesLine(list.length, inc))}</p>` : ''].join('');
  };
  for (const S of statesListed) {
    const pups = D.puppies.filter((p) => stateOf(p.br) === S).sort(byStanding);
    const open = pups.filter((p) => !p.placed);
    const shown = open.length ? open : pups;
    const brs = breedersShown.filter((b) => stateOf(b) === S);
    const breedsHere = [...new Map(shown.map((p) => [p.b.slug, p.b])).values()].sort((a, c) => a.name.localeCompare(c.name));
    const towns = [...new Set(brs.map((b) => String(b.city || '').trim()).filter(Boolean))];
    const lead = leadOf(shown);
    const price = priceSpan(shown);
    const pupBody = `<main id="statePuppies">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow"><a href="puppies.html" style="color:inherit">Puppies</a></p>
    <h1>Puppies for sale in ${esc(S)}</h1>
    <p class="meta">${open.length} available now from ${brs.length} ${brs.length === 1 ? 'breeder' : 'breeders'}${price ? `, priced ${price}` : ''}</p>
    <div class="prose" style="margin-top:1rem">
      <p>These are the puppies listed by breeders in ${esc(S)}${towns.length ? `, from ${esc(towns.slice(0, 6).join(', ').replace(/, ([^,]*)$/, ' and $1'))}` : ''}. Each one is raised and sold by the breeder named on its page, and you contact that breeder directly.</p>
      ${breedsHere.length ? `<p>Breeds listed in ${esc(S)} right now: ${linkList(breedsHere.map((x) => [pageFor.breed(x.slug), x.name]))}.</p>` : ''}
      ${stateFacts(shown)}
      <p>Before you choose, read our <a href="tips-on-buying-a-puppy.html">tips on buying a puppy</a>, and ask the breeder about the parents, their health testing and what the puppy goes home with.</p>
      <p>See the <a href="${pageFor.stateBreeders(S)}">dog breeders in ${esc(S)}</a> who list here, or <a href="puppies.html">every puppy on Puppy Connection</a>.</p>
    </div>
  </div>
</section>
<section class="band band-warm" id="available">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">${open.length ? 'Available now' : 'Recently listed'}</p><h2>Puppies in ${esc(S)}</h2></div><a class="link-more" href="puppies.html">All puppies</a></div>
    ${grid(shown, `No puppies are listed in ${esc(S)} at the moment.`)}
  </div>
</section>
</main>`;
    write(pageFor.statePuppies(S), {
      title: `Puppies for Sale in ${S} | Puppy Connection`,
      desc: clip(`${open.length} ${open.length === 1 ? 'puppy' : 'puppies'} for sale from small family breeders in ${S}${price ? `, priced ${price}` : ''}. See each puppy and contact its breeder directly.`, 158),
      body: pupBody, trail: [['Available puppies', `${base}puppies.html`], [`Puppies in ${S}`, `${base}${pageFor.statePuppies(S)}`]],
      image: absolute(lead && (isWix(lead.src) ? wix(lead.src, 1200, 630) : lead.src)),
      ld: [{ '@type': 'ItemList', name: `Puppies for sale in ${S}`, numberOfItems: shown.length,
        itemListElement: shown.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}${pageFor.puppy(p.slug)}`, name: `${p.name}, ${p.b.name}` })) }],
      images: shown.slice(0, 20).map((p) => imageUrl(p.photos[0])),
    });
    const brBody = `<main id="stateBreeders">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeders.html" style="color:inherit">Breeders</a></p>
    <h1>Dog breeders in ${esc(S)}</h1>
    <p class="meta">${brs.length} ${brs.length === 1 ? 'breeder lists' : 'breeders list'} on Puppy Connection</p>
    <div class="prose" style="margin-top:1rem">
      <p>These small family breeders in ${esc(S)} list their puppies on Puppy Connection. Each breeder's page shows their town, the breeds they raise, their puppies and how to reach them. The sale, the paperwork and the conversation are between you and the breeder.</p>
      ${breedsHere.length ? `<p>Between them, breeders in ${esc(S)} have listed ${linkList(breedsHere.map((x) => [pageFor.breed(x.slug), x.name]))}.</p>` : ''}
      ${stateFacts(shown)}
      <p>See the <a href="${pageFor.statePuppies(S)}">puppies for sale in ${esc(S)}</a> from these breeders, or read our <a href="tips-on-buying-a-puppy.html">tips on buying a puppy</a> before you get in touch.</p>
    </div>
  </div>
</section>
<section class="band band-warm">
  <div class="wrap">
    <div class="sec-head"><div><p class="eyebrow">Listing now</p><h2>Breeders in ${esc(S)}</h2></div><a class="link-more" href="breeders.html">All breeders</a></div>
    <div class="grid grid-4">${brs.map(breederCard).join('')}</div>
  </div>
</section>
</main>`;
    write(pageFor.stateBreeders(S), {
      title: `Dog Breeders in ${S} | Puppy Connection`,
      desc: clip(`The small family dog breeders in ${S} who list puppies on Puppy Connection. See each breeder's puppies and contact them directly.`, 158),
      body: brBody, trail: [['Breeders', `${base}breeders.html`], [`Breeders in ${S}`, `${base}${pageFor.stateBreeders(S)}`]],
      ld: [{ '@type': 'ItemList', name: `Dog breeders in ${S}`, numberOfItems: brs.length,
        itemListElement: brs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}${pageFor.breeder(b.slug)}`, name: b.name })) }],
    });
  }
  // The state pages need a link from the hub. With one state, a "By state" line read oddly (Alex,
  // 2026-10-10), so the state is named in the opening sentence, with "all" or "most" only when the
  // breeders' own records say so. A list of states returns once a second state lists.
  const inState = statesListed.length === 1 ? breedersShown.filter((b) => stateName(b.state) === statesListed[0]).length : 0;
  const stateLink = (S) => `<a href="${pageFor.stateBreeders(S)}">${esc(S)}</a>`;
  const hubLede = statesListed.length === 1 && inState
    ? `Every puppy on this site is raised and sold by one of these breeders, ${inState === breedersShown.length ? 'all of them' : inState * 2 > breedersShown.length ? 'most of them' : 'including breeders'} in ${stateLink(statesListed[0])}. We list their puppies, and they handle the sale, the paperwork and the conversation with your family.`
    : 'Every puppy on this site is raised and sold by one of these breeders. We list their puppies, and they handle the sale, the paperwork and the conversation with your family.';
  const byState = statesListed.length > 1
    ? `<p class="lede" style="margin-top:.8rem">Find breeders by state: ${linkList(statesListed.map((S) => [pageFor.stateBreeders(S), S]))}.</p>`
    : '';

  // ---- the two directory pages, static
  write('breeds.html', {
    title: 'Breeds | Puppy Connection', current: 'breeds.html',
    desc: 'Every breed currently listed on Puppy Connection, with guides and what is available now.',
    trail: [['Breeds', `${base}breeds.html`]],
    body: `<main id="breedIndex-page">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Breeds</p><h1>Find the breed that suits your family</h1>
<p class="lede">Every breed currently listed, with what is available now and a guide where one has been written.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap">
<div class="sec-head"><div><p class="eyebrow">Listed here</p><h2>${listedBreeds.length} breeds</h2></div><a class="link-more" href="puppies.html">Browse all puppies</a></div>
<div class="grid grid-4">${listedBreeds.map((b) => breedCard(b)).join('')}</div></div></section>
</main>`,
  });
  write('breeders.html', {
    // SEO plan P7. "dog breeders in indiana" is the breeder search, and the network starts in
    // Indiana and the Midwest and grows from there (Alex, 2026-10-07).
    title: 'Dog Breeders in Indiana and the Midwest | Puppy Connection', current: 'breeders.html',
    desc: 'The small family dog breeders in Indiana and the Midwest who list their puppies on Puppy Connection. See each breeder\'s puppies and contact them directly.',
    trail: [['Breeders', `${base}breeders.html`]],
    body: `<main id="breederIndex-page">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Directory</p><h1>Dog breeders in Indiana and the Midwest</h1>
<p class="lede">${hubLede}</p>${byState}</div></section>
<section class="band" style="padding-top:0"><div class="wrap">
<div class="sec-head"><div><p class="eyebrow">Currently listing</p><h2>${breedersShown.length} breeders</h2></div><a class="link-more" href="puppies.html">Browse all puppies</a></div>
<div class="grid grid-4">${breedersShown.map(breederCard).join('')}</div></div></section>
</main>`,
  });

  // ---- the site's own pages (About, How it works, Tips, Reviews, Contact), from build/info-pages.mjs
  for (const pg of INFO_PAGES) {
    write(pg.file, { title: pg.title, desc: pg.desc, trail: [[pg.name, `${base}${pg.file}`]],
      body: `<main id="info-page">
<span id="content" tabindex="-1"></span>
${pg.body}
</main>` });
  }

  // ---- the concept's own pages, carried over with this site's address, scripts and footer
  for (const f of ['index.html', 'puppies.html', 'list-with-us.html']) {
    let s = concept(f).split(CONCEPT_BASE).join(base);
    s = s.replace(/<meta name="robots"[^>]*>\n/, robots);
    s = s.replace(/<script src="data\/data\.js\?v=\d+"><\/script>\n?/, f === 'list-with-us.html' ? '' : `<script src="data/data.js?v=${dataV}"></script>\n`);
    s = s.replace(/js\/main\.js\?v=\d+/, `js/main.js?v=${mainV}`);
    s = withLegal(s);
    s = withSignup(withInfo(s));
    if (GUIDES.length) s = s.replace('<li><a href="breeds.html">Breeds</a></li>', '<li><a href="breeds.html">Breeds</a></li><li><a href="guides.html">Breed guides</a></li>');
    fs.writeFileSync(path.join(out, f), s);
    pages.push(f);
  }

  // ---- the old query-string addresses send visitors to the new pages
  const stub = (name, kind) => `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="color-scheme" content="light only">\n<meta name="robots" content="noindex">\n<title>Puppy Connection</title>\n<meta name="description" content="This address has moved.">\n<script>(function(){var s=new URLSearchParams(location.search).get('slug');if(s&&/^[a-z0-9-]+$/.test(s))location.replace('${kind}-'+s+'.html');})();</script>\n<meta http-equiv="refresh" content="1; url=${name}">\n</head>\n<body><p><a href="${name}">Continue to Puppy Connection</a></p></body>\n</html>\n`;
  fs.writeFileSync(path.join(out, 'puppy.html'), stub('puppies.html', 'puppy'));
  fs.writeFileSync(path.join(out, 'breed.html'), stub('breeds.html', 'breed'));
  fs.writeFileSync(path.join(out, 'breeder.html'), stub('breeders.html', 'breeder'));

  // ---- 404, served from any depth, so its links are absolute
  const nf = `${headBase.replace(/<meta name="robots"[^>]*>\n/, '')}<meta name="robots" content="noindex">\n<title>Page not found | Puppy Connection</title>\n<meta name="description" content="That page is not on Puppy Connection.">\n`
    + `${fonts.split('href="css/').join('href="/css/')}\n</head>\n<body>\n<main id="content"><section class="band"><div class="wrap"><h1>That page is not here</h1>`
    + '<p class="lede">The puppy may have gone home, or the address may have changed.</p><div class="btn-row"><a class="btn btn-primary" href="/puppies.html">See available puppies</a> <a class="btn" href="/breeds.html">Browse breeds</a></div></div></section></main>\n</body>\n</html>\n';
  fs.writeFileSync(path.join(out, '404.html'), nf);

  // ---- sitemap, robots and the Wix 301 map
  const urls = pages.map((f) => (f === 'index.html' ? base : base + f)).sort();
  const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const urlEntry = (u) => {
    const imgs = (pageImages[u] || []).slice(0, 20).map((i) => `\n    <image:image><image:loc>${xml(i)}</image:loc></image:image>`).join('');
    return `  <url><loc>${xml(u)}</loc>${imgs}${imgs ? '\n  ' : ''}</url>`;
  };
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.map(urlEntry).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const redirects = D.puppies.filter((p) => p.legacy_slug).map((p) => `/product-page/${p.legacy_slug} /${pageFor.puppy(p.slug)} 301`).sort();
  // The old Wix pages other than puppies (build/legacy-pages.tsv), after the per-puppy lines so a
  // specific puppy wins over the /product-page/* fallback. A breed page is only built while the
  // breed has listings, so a target this build did not write falls back to the breeds index rather
  // than stopping a publish.
  const legacy = fs.readFileSync(path.join(HERE, 'legacy-pages.tsv'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => {
    const [from, to] = l.split('\t');
    let target = to.replace('{portal}', portal.replace(/\/$/, ''));
    if (target.startsWith('/') && !fs.existsSync(path.join(out, target.slice(1)))) target = '/breeds.html';
    return `${from} ${target} 301`;
  });
  fs.writeFileSync(path.join(out, '_redirects'), `# Written by build/generate.mjs. Old Wix product pages go to the puppy's page, then the old Wix pages (build/legacy-pages.tsv).\n${redirects.join('\n')}\n${legacy.join('\n')}\n`);
  // Stylesheets, scripts and the listing data are linked with ?v= and the number changes with the
  // file, so they keep for a year. The concept's images keep their names when replaced, so a week.
  // Photos from R2 get their headers from the site Worker.
  const forever = '  Cache-Control: public, max-age=31536000, immutable';
  fs.writeFileSync(path.join(out, '_headers'), `# Written by build/generate.mjs.\n/css/*\n${forever}\n/js/*\n${forever}\n/data/*\n${forever}\n/img/*\n  Cache-Control: public, max-age=604800\n`);

  // Breeders write their own descriptions, and many use em dashes. Those are their words and are
  // published as written, so check_site.py's dash check is off for the generated site. The site's
  // own wording is checked with it on: dev/publish-test.mjs builds once from data with the
  // breeders' dashes taken out and strictCopy set, and runs every check.
  if (!strictCopy) fs.writeFileSync(path.join(out, '.sitecheck.json'), `${JSON.stringify({ ignore_checks: ['dashes'] }, null, 2)}\n`);

  return { pages: pages.length, puppies: D.puppies.length, breeds: listedBreeds.length, breeders: breedersShown.length, states: statesListed.length, guides: GUIDES.length, redirects: redirects.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dataDir = arg('data'), out = arg('out');
  if (!dataDir || !out) { console.error('usage: node build/generate.mjs --data <folder> --out <folder> [--templates <folder>] [--base URL] [--portal URL] [--indexable]'); process.exit(2); }
  const r = build({
    dataDir: path.resolve(dataDir), out: path.resolve(out), templates: arg('templates', process.env.PC_TEMPLATES),
    base: arg('base', process.env.SITE_URL || 'https://site.puppyconnection.workers.dev/'),
    portal: arg('portal', process.env.PORTAL_ORIGIN || 'https://portal.puppyconnection.workers.dev'),
    indexable: process.argv.includes('--indexable') || process.env.SITE_INDEXABLE === '1',
  });
  console.log(`generated ${r.pages} pages: ${r.puppies} puppies, ${r.breeds} breeds, ${r.breeders} breeders, ${r.redirects} Wix redirects`);
}
