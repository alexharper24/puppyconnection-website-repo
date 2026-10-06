// The public site generator (spec section 9, plan P4.3). It builds every public page from the
// data files the publish commits (lib/shape.js), in the concept site's look: the concept's head,
// header, footer, css/style.css and js/main.js, with one static page per puppy, breed and breeder.
// Node only, no npm. CI runs it after each publish (app/build/ci-build.sh), then check_site.py as
// a gate, then deploys the output.
//
//   node app/build/generate.mjs --data <folder with data/ and img/> --out <folder>
//        [--base https://site.puppyconnection.workers.dev/] [--portal https://portal...]
//        [--indexable]
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '../..');
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

// The concept's image helpers, for photos still on Wix. A committed photo is served from the site
// itself, and a slot 640 px wide or less takes its card copy.
const isWix = (u) => /wixstatic\.com/.test(u || '');
function wix(base, w, h) { return `${base}/v1/fill/w_${w},h_${h},al_t,q_82,usm_0.66_1.00_0.01,enc_auto/i.jpg`; }
function wixFit(base, w, h) { return `${base}/v1/fit/w_${w},h_${h},q_85,enc_auto/i.jpg`; }
function fill(photo, w, h) { if (!photo) return ''; return isWix(photo.src) ? wix(photo.src, w, h) : (w <= 640 && photo.card ? photo.card : photo.src); }
function fit(photo, w, h) { if (!photo) return ''; return isWix(photo.src) ? wixFit(photo.src, w, h) : (w <= 640 && photo.card ? photo.card : photo.src); }

export const pageFor = { puppy: (s) => `puppy-${s}.html`, breed: (s) => `breed-${s}.html`, breeder: (s) => `breeder-${s}.html` };

// js/main.js is copied with these changes, each of which must still match the concept's file.
const MAIN_PATCHES = [
  // Committed photos are served by the site, and narrow slots take the card copy.
  ["  function wix(base, w, h) {\n    if (!base) return '';", "  function wix(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return pcLocal(base, w);"],
  ["  function wixFit(base, w, h) {\n    if (!base) return '';", "  function wixFit(base, w, h) {\n    if (!base) return '';\n    if (base.indexOf('wixstatic.com') < 0) return pcLocal(base, w);"],
  ["  /* \"fit\" letterboxes", "  function pcLocal(base, w) {\n    return w <= 640 && /^img\\/p\\/[\\w-]+\\.\\w+$/.test(base) ? base.replace(/(\\.\\w+)$/, '.card$1') : base;\n  }\n  /* \"fit\" letterboxes"],
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
    var box = document.querySelector('#dBreeder');
    if (box) box.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.contact-list a')) beacon('click', slug); });
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
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, 'data', f), 'utf8'));
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

export function build({ dataDir, out, base = 'https://site.puppyconnection.workers.dev/', portal = 'https://portal.puppyconnection.workers.dev', indexable = false, strictCopy = false }) {
  if (!base.endsWith('/')) base += '/';
  const D = loadData(dataDir);
  const concept = (f) => fs.readFileSync(path.join(REPO, f), 'utf8').replace(/\r\n/g, '\n');
  const idx = concept('index.html');
  const cssV = (idx.match(/css\/style\.css\?v=(\d+)/) || [])[1];
  const head0 = idx.slice(0, idx.indexOf('<title>'));
  const hdr = idx.slice(idx.indexOf('<a class="skip-link"'), idx.indexOf('<main id="home">'));
  let ftr = idx.slice(idx.indexOf('<footer class="site-footer">'), idx.indexOf('</footer>') + '</footer>'.length);
  const legal = `<li><a href="${portal}/privacy">Privacy</a></li><li><a href="${portal}/terms">Listing terms</a></li>`;
  if (!ftr.includes(FOOTER_ANCHOR)) throw new Error('generate.mjs: the footer no longer has the Pricing link the legal links follow');
  ftr = ftr.replace(FOOTER_ANCHOR, FOOTER_ANCHOR + legal);
  const robots = indexable ? '' : '<meta name="robots" content="noindex, nofollow">\n';
  const headBase = head0.replace(/<meta name="robots"[^>]*>\n/, '') + robots;
  if (!/color-scheme" content="light only"/.test(headBase)) throw new Error('generate.mjs: the concept head lost its light-mode lock');

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const dir of ['css', 'img']) fs.cpSync(path.join(REPO, dir), path.join(out, dir), { recursive: true });
  for (const dir of ['img/p', 'img/b']) if (fs.existsSync(path.join(dataDir, dir))) fs.cpSync(path.join(dataDir, dir), path.join(out, dir), { recursive: true });
  fs.mkdirSync(path.join(out, 'js'), { recursive: true });
  fs.mkdirSync(path.join(out, 'data'), { recursive: true });
  const mainJs = patchMain(concept('js/main.js'));
  fs.writeFileSync(path.join(out, 'js/main.js'), mainJs);
  fs.writeFileSync(path.join(out, 'js/pages.js'), PAGES_JS);
  const mainV = hash(mainJs), pagesV = hash(PAGES_JS);

  // ---- the listing data the home page and the puppy browser render with js/main.js
  const breedCounts = {};
  for (const p of D.puppies) breedCounts[p.b.slug] = (breedCounts[p.b.slug] || 0) + 1;
  const leadOf = (list) => { const p = list.find((x) => !x.placed && x.photos.length) || list.find((x) => x.photos.length); return p ? p.photos[0] : null; };
  const listedBreeds = D.breeds.filter((b) => breedCounts[b.slug] || b.guide.length);
  const pcListings = D.puppies.map((p) => ({
    slug: p.slug, name: `${p.name} - ${p.b.name}`, price: p.price, in_stock: !p.placed,
    birthdate: longDate(p.l.born_on), ready_date: longDate(p.l.ready_on), deposit: p.deposit,
    mom_weight: p.l.mom_weight_lb != null ? `${p.l.mom_weight_lb} lbs` : null, dad_weight: p.l.dad_weight_lb != null ? `${p.l.dad_weight_lb} lbs` : null,
    breeder_phone: p.br && p.br.phone, breeder_email: p.br && p.br.email, hypoallergenic: p.hypoallergenic, includes: p.includes,
    description: p.about.join('\n\n'), images: p.photos.map((x) => x.src),
    breeder_domain: realBreeder(p.br) ? (host(p.br.website) || `${p.br.slug}.puppyconnection`) : null,
    breeder_slug: realBreeder(p.br) ? p.br.slug : null, breeder_place: p.br ? place(p.br) : '',
    puppy_name: p.name, breed: p.b.name, litter: p.mates > 1 ? p.litter : null, status: p.placed ? 'adopted' : p.availability,
    breeder_name: realBreeder(p.br) ? p.br.name : null, breeder_url: p.breeder_url, breeder_url_tier: p.breeder_url ? 'puppy' : null,
    lead_aspect: (p.photos[0] && p.photos[0].aspect) || 1.5,
  }));
  const pcBreeds = listedBreeds.map((b) => {
    const lead = leadOf(D.puppies.filter((p) => p.b.slug === b.slug));
    return { name: b.name, slug: b.slug, live_count: breedCounts[b.slug] || 0, demo_count: breedCounts[b.slug] || 0, guide: b.guide, photo: lead ? lead.src : null };
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

  function write(file, { title, desc, body, trail, current, image, scripts = 'pages' }) {
    const url = file === 'index.html' ? base : base + file;
    let h = hdr;
    if (current) h = h.replace(`href="${current}"`, `href="${current}" aria-current="page"`);
    const tail = scripts === 'data'
      ? `<script src="data/data.js?v=${dataV}"></script>\n<script src="js/main.js?v=${mainV}"></script>\n`
      : `<script src="js/main.js?v=${mainV}"></script>\n<script src="js/pages.js?v=${pagesV}"></script>\n`;
    const htmlOut = `${headBase}<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}">\n${social(title, desc, url, image)}\n`
      + `${trail ? `${crumbs(trail)}\n` : ''}${fonts}\n</head>\n<body>\n\n${h}${body}\n\n${ftr}\n${tail}</body>\n</html>\n`;
    fs.writeFileSync(path.join(out, file), htmlOut);
    pages.push(file);
  }

  // A card, as js/main.js draws it, so a static grid and a rendered one look the same.
  let cardN = 0;
  function card(p) {
    const eager = cardN++ < 4;
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

  // ---- puppies
  const breedersShown = D.breeders.filter(realBreeder);
  for (const p of D.puppies) {
    const b = realBreeder(p.br) ? p.br : null;
    const mates = D.puppies.filter((x) => x.litter === p.litter && x.slug !== p.slug).sort(byStanding);
    const facts = [['Breed', p.b.name], ['Sex', p.sex ? p.sex[0].toUpperCase() + p.sex.slice(1) : null], ['Color', p.color],
      ['Born', longDate(p.l.born_on)], ['Ready to go home', longDate(p.l.ready_on)], ['Deposit', p.deposit ? money(p.deposit) : null],
      ['Mother', p.l.mom_weight_lb != null ? `${p.l.mom_weight_lb} lbs adult weight` : null], ['Father', p.l.dad_weight_lb != null ? `${p.l.dad_weight_lb} lbs adult weight` : null],
      ['Coat', p.hypoallergenic ? 'Hypoallergenic' : null]].filter((f) => f[1]);
    const site = p.breeder_url || (b && b.website) || null;
    const contact = [
      site ? `<li><a href="${esc(site)}" target="_blank" rel="noopener"><b>Website</b> ${p.breeder_url ? `${esc(p.name)}'s own page` : esc(host(site))}</a></li>` : '',
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
      ${p.placed ? '<p class="meta">Adopted. This puppy has gone home and stays here so its litter can be seen.</p>' : p.availability === 'pending' ? '<p class="meta">Pending. Ask the breeder whether this puppy is still open.</p>' : ''}
    </div>
    <div class="d-media">
      <div class="gallery-main" id="dMain">${lead ? `<img src="${esc(fit(lead, 1200, 800))}" alt="${esc(p.name)}, ${esc(p.b.name)} puppy" decoding="async">` : ''}</div>
      ${p.photos.length > 1 ? `<div class="thumb-strip">
        <button class="thumb-nav prev" type="button" aria-label="Earlier photos" hidden>&#8249;</button>
        <div class="thumbs" id="dGallery">${p.photos.map((ph, i) => `<button type="button"${i === 0 ? ' aria-current="true"' : ''} data-full="${esc(fit(ph, 1200, 800))}"><img src="${esc(fill(ph, 160, 160))}" alt="" loading="lazy" decoding="async" width="160" height="160"></button>`).join('')}</div>
        <button class="thumb-nav next" type="button" aria-label="More photos" hidden>&#8250;</button>
      </div>` : ''}
      ${p.about.length ? `<section class="about-block"><p class="eyebrow">About this puppy</p>${paras(p.about)}</section>` : ''}
    </div>
    <div class="d-detail">
      <dl class="facts">${facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>
      ${p.includes.length ? `<section><p class="eyebrow">Goes home with</p><ul class="includes">${p.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>` : ''}
      <div class="breeder-box" id="dBreeder">
        <div class="eyebrow">Raised by</div>
        <h3>${esc(b ? b.name : 'Breeder to be confirmed')}</h3>
        <p class="breeder-note">Puppy Connection lists this puppy. The sale is arranged directly with the breeder.</p>
        ${contact ? `<ul class="contact-list">${contact}</ul>` : '<p class="disclaimer">Contact details for this breeder are being confirmed.</p>'}
        ${b ? `<p style="margin:.9rem 0 0"><a href="${pageFor.breeder(b.slug)}">See all puppies from ${esc(b.name)}</a></p>` : ''}
      </div>
      <p class="disclaimer">Puppy Connection does not sell puppies, take deposits, or handle payment. Health records, guarantees and delivery are agreed directly between you and the breeder.</p>
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
      title: `${p.name}, ${p.b.name} puppy | Puppy Connection`,
      desc: clip(`${p.name} is a ${p.sex ? `${p.sex} ` : ''}${p.b.name} puppy${who}. ${when} Contact the breeder directly.`, 158),
      body, trail: [['Available puppies', `${base}puppies.html`], [p.name, `${base}${pageFor.puppy(p.slug)}`]], image: absolute(lead && (isWix(lead.src) ? wix(lead.src, 1200, 630) : lead.src)),
    });
  }

  // ---- breeds
  const breedCard = (b, w = 600, hh = 400) => {
    const lead = leadOf(D.puppies.filter((p) => p.b.slug === b.slug));
    const open = D.puppies.filter((p) => p.b.slug === b.slug && !p.placed).length;
    return `<a class="card" href="${pageFor.breed(b.slug)}"><div class="card-media">${lead ? `<img src="${esc(fill(lead, w, hh))}" alt="${esc(b.name)}" loading="lazy" decoding="async" width="${w}" height="${hh}">` : ''}</div>`
      + `<div class="card-body"><div class="card-name">${esc(b.name)}</div><div class="card-foot"><span class="card-ready">${open} available</span><span class="card-ready">${b.guide.length ? 'Guide' : ''}</span></div></div></a>`;
  };
  for (const b of listedBreeds) {
    const pups = D.puppies.filter((p) => p.b.slug === b.slug).sort(byStanding);
    const open = pups.filter((p) => !p.placed);
    const lead = leadOf(pups);
    const others = listedBreeds.filter((x) => x.slug !== b.slug).slice(0, 8);
    const body = `<main id="breedPage">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeds.html" style="color:inherit">Breeds</a></p>
    <h1>${esc(b.name)}</h1>
    <p class="meta">${open.length} available now</p>
  </div>
</section>
<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div class="guide">${b.guide.length ? paras(b.guide) : `<p>Every ${esc(b.name)} listed here is raised by the breeder named on the puppy's page, and each listing has that breeder's own description and contact details.</p>`}</div>
    <aside>
      ${lead ? `<figure class="breed-photo"><img src="${esc(fill(lead, 900, 600))}" alt="${esc(b.name)}" decoding="async"><span class="photo-cap">A ${esc(b.name)} currently listed</span></figure>` : ''}
      <div class="breeder-box">
        <p class="eyebrow">How this works</p>
        <p class="breeder-note">Choose a puppy, then contact its breeder directly. Puppy Connection lists puppies. It does not sell them, take deposits or handle payment.</p>
        <div class="btn-row"><a class="btn btn-primary" href="#available">See what is available</a></div>
      </div>
    </aside>
  </div>
</section>
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
    write(pageFor.breed(b.slug), {
      title: `${b.name} puppies | Puppy Connection`,
      desc: clip(b.guide[0] || `${b.name} puppies listed by small family breeders. ${open.length} available now, and you contact the breeder directly.`, 158),
      body, trail: [['Breeds', `${base}breeds.html`], [b.name, `${base}${pageFor.breed(b.slug)}`]], image: absolute(lead && (isWix(lead.src) ? wix(lead.src, 1200, 630) : lead.src)),
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
    if (!b.logo && b.slug in conceptLogos && fs.existsSync(path.join(REPO, `img/breeders/${b.slug}.webp`))) {
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
    const body = `<main id="profile">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.6rem">
  <div class="wrap">
    <p class="eyebrow"><a href="breeders.html" style="color:inherit">Breeders</a></p>
    <div class="profile-head"><h1>${esc(b.name)}</h1>${place(b) ? `<p class="meta">${esc(place(b))}</p>` : ''}</div>
  </div>
</section>
<section class="band" style="padding-top:0">
  <div class="wrap split">
    <div>
      <div class="prose">${paras(b.about)}</div>
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
      <div class="btn-row"><a class="btn btn-primary" href="#their">See their puppies</a></div>
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
    });
  }

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
    title: 'Breeders | Puppy Connection', current: 'breeders.html',
    desc: 'The small family breeders who raise and sell the puppies listed on Puppy Connection.',
    trail: [['Breeders', `${base}breeders.html`]],
    body: `<main id="breederIndex-page">\n<span id="content" tabindex="-1"></span>
<section class="band" style="padding-bottom:1.4rem"><div class="wrap"><p class="eyebrow">Directory</p><h1>The breeders behind the listings</h1>
<p class="lede">Every puppy on this site is raised and sold by one of these breeders. We list their puppies. They handle the sale, the paperwork and the conversation with your family.</p></div></section>
<section class="band" style="padding-top:0"><div class="wrap">
<div class="sec-head"><div><p class="eyebrow">Currently listing</p><h2>${breedersShown.length} breeders</h2></div><a class="link-more" href="puppies.html">Browse all puppies</a></div>
<div class="grid grid-4">${breedersShown.map(breederCard).join('')}</div></div></section>
</main>`,
  });

  // ---- the concept's own pages, carried over with this site's address, scripts and footer
  for (const f of ['index.html', 'puppies.html', 'list-with-us.html']) {
    let s = concept(f).split(CONCEPT_BASE).join(base);
    s = s.replace(/<meta name="robots"[^>]*>\n/, robots);
    s = s.replace(/<script src="data\/data\.js\?v=\d+"><\/script>\n?/, f === 'list-with-us.html' ? '' : `<script src="data/data.js?v=${dataV}"></script>\n`);
    s = s.replace(/js\/main\.js\?v=\d+/, `js/main.js?v=${mainV}`);
    if (!s.includes(FOOTER_ANCHOR)) throw new Error(`generate.mjs: ${f} lost the footer link the legal links follow`);
    s = s.replace(FOOTER_ANCHOR, FOOTER_ANCHOR + legal);
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
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), indexable ? `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
  const redirects = D.puppies.filter((p) => p.legacy_slug).map((p) => `/product-page/${p.legacy_slug} /${pageFor.puppy(p.slug)} 301`).sort();
  fs.writeFileSync(path.join(out, '_redirects'), `# Written by app/build/generate.mjs. Old Wix product pages go to the puppy's page.\n${redirects.join('\n')}\n`);

  // Breeders write their own descriptions, and many use em dashes. Those are their words and are
  // published as written, so check_site.py's dash check is off for the generated site. The site's
  // own wording is checked with it on: dev/publish-test.mjs builds once from data with the
  // breeders' dashes taken out and strictCopy set, and runs every check.
  if (!strictCopy) fs.writeFileSync(path.join(out, '.sitecheck.json'), `${JSON.stringify({ ignore_checks: ['dashes'] }, null, 2)}\n`);

  return { pages: pages.length, puppies: D.puppies.length, breeds: listedBreeds.length, breeders: breedersShown.length, redirects: redirects.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dataDir = arg('data'), out = arg('out');
  if (!dataDir || !out) { console.error('usage: node app/build/generate.mjs --data <folder> --out <folder> [--base URL] [--portal URL] [--indexable]'); process.exit(2); }
  const r = build({
    dataDir: path.resolve(dataDir), out: path.resolve(out),
    base: arg('base', process.env.SITE_URL || 'https://site.puppyconnection.workers.dev/'),
    portal: arg('portal', process.env.PORTAL_ORIGIN || 'https://portal.puppyconnection.workers.dev'),
    indexable: process.argv.includes('--indexable') || process.env.SITE_INDEXABLE === '1',
  });
  console.log(`generated ${r.pages} pages: ${r.puppies} puppies, ${r.breeds} breeds, ${r.breeders} breeders, ${r.redirects} Wix redirects`);
}
