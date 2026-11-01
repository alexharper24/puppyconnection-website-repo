/* Puppy Connection — concept build.
   Everything reads from window.PC_LISTINGS / PC_BREEDS / PC_BREEDERS in data/data.js
   so the demo runs from the filesystem with no server and no fetch. */

(function () {
  // Amber, 2026-10-31. Ready now once the ready date is today or past, otherwise Ready and the date.
  // Takes "November 22, 2026" or "2026-11-22".
  function readyText(when) {
    var m = String(when).match(/^(\d{4})-(\d\d)-(\d\d)/), d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(when);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(d)) return 'Ready ' + String(when).replace(/,? \d{4}$/, '');
    return d <= today ? 'Ready now' : 'Ready ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getDate();
  }
  document.querySelectorAll('.card-ready[data-ready]').forEach(function (el) { el.textContent = readyText(el.getAttribute('data-ready')); });

  'use strict';

  /* Logos pulled from each breeder's own site, trimmed and converted to webp.
     Only listed here where the mark genuinely belongs to that breeder. */
  var LOGOS = {
    peacefulpawspuppies: { light: false },
    responsibledogbreeder: { light: false },
    chainolakescompanions: { light: false },
    /* white wordmark, so it gets a dark card rather than being recoloured */
    kingdomfamilycompanions: { light: true }
  };

  var L = window.PC_LISTINGS || [];
  /* Below 760px the card grids run two across with portrait 4:5 photos (see card()). */
  var PHONE = window.matchMedia ? window.matchMedia('(max-width: 760px)') : { matches: false };
  var BREEDS = window.PC_BREEDS || [];
  var BREEDERS = window.PC_BREEDERS || [];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    return n == null ? '' : '$' + Number(n).toLocaleString('en-US');
  }
  function qs(k) {
    return new URLSearchParams(location.search).get(k);
  }
  function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* Images are bare Wix media URLs. Ask for the size the slot actually needs,
     so a 76px thumbnail stops downloading a 1400px file. enc_auto lets Wix
     negotiate AVIF or WebP, which is roughly another 45% off the JPEG. */
  /* al_t, not al_c: cropping a full-body portrait to 4:3 from the center
     keeps the torso and loses the head. Anchoring to the top keeps the face. */
  function wix(base, w, h) {
    if (!base) return '';
    return base + '/v1/fill/w_' + w + ',h_' + h +
      ',al_t,q_82,usm_0.66_1.00_0.01,enc_auto/i.jpg';
  }
  /* "fit" letterboxes instead of cropping. Breeder photos vary wildly in
     shape, so anywhere a whole dog must stay in frame uses this. */
  function wixFit(base, w, h) {
    if (!base) return '';
    return base + '/v1/fit/w_' + w + ',h_' + h + ',q_85,enc_auto/i.jpg';
  }
  function img(l, i) {
    return (l.images && l.images[i || 0]) || '';
  }
  function byLitter(id) {
    return L.filter(function (l) { return id && l.litter === id; });
  }

  /* Status comes from the breeder. A placed puppy stays visible inside its
     litter and on the breeder's page until the whole litter is retired. */
  function isPlaced(l) { return l.status === 'adopted'; }
  function statusLabel(l) {
    return l.status === 'adopted' ? 'Adopted' : l.status === 'pending' ? 'Pending' : '';
  }
  function breederSlug(l) { return l.breeder_domain ? slugify(l.breeder_domain.replace(/\.[a-z]+$/, '')) : null; }
  function breederLabel(l) { return l.breeder_name || l.breeder_domain || 'Breeder to be confirmed'; }

  /* the four breeder businesses the catalog actually references */
  function realBreeders() {
    var seen = {};
    L.forEach(function (l) {
      if (!l.breeder_domain) return;
      var s = breederSlug(l);
      if (!seen[s]) seen[s] = { slug: s, name: breederLabel(l), domain: l.breeder_domain, listings: [] };
      seen[s].listings.push(l);
    });
    return Object.keys(seen).map(function (k) { return seen[k]; })
      .sort(function (a, b) { return b.listings.length - a.listings.length; });
  }

  /* ---------- card ---------- */
  var cardIndex = 0;
  function card(l) {
    /* The first row or two are in view immediately. Marking those lazy delays
       them; mark them eager and high priority instead. */
    var eager = cardIndex++ < eagerCards;
    /* 48 listings have no landscape photo anywhere in their set. Cropping a
       portrait into the 3:2 slot cuts the dog in half whichever edge we anchor
       to, so those sit whole on the card's own ground instead. */
    var tall = (l.lead_aspect || 9) < 1.2;
    /* On a phone the grids run two across and the card photo is portrait 4:5, Teapup's tile
       shape (Alex, 2026-10-07), so the photo is asked for at that shape and fills the tile,
       portrait or not. */
    var phone = PHONE.matches;
    if (phone) tall = false;
    var placed = isPlaced(l);
    var label = statusLabel(l);
    var mates = byLitter(l.litter).length;
    return '' +
      '<a class="card' + (placed ? ' is-sold' : '') + '" href="puppy.html?slug=' + esc(l.slug) + '">' +
        '<div class="card-media' + (tall ? ' is-whole' : '') + '"' +
          /* a heavily blurred crop of the same photo fills the tile behind the
             whole image, so the card reads edge to edge without losing the dog.
             60px wide is all a 22px blur needs, so it costs about a kilobyte.
             The address is made absolute, because a url() in a custom property
             resolves against css/style.css, where media/<id> does not exist. */
          (tall ? ' style="--fill:url(' + esc(new URL(wix(img(l), 60, 40), location.href).href) + ')"' : '') + '>' +
          (img(l) ? '<img src="' + esc(phone ? (l.lead_tall || wix(img(l), 480, 600)) : tall ? wixFit(img(l), 600, 400) : wix(img(l), 600, 400)) + '" alt="' + esc(l.puppy_name) + ', ' +
            esc(l.breed || 'puppy') + '" ' +
            (eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"') +
            (phone ? ' width="480" height="600">' : ' width="600" height="400">') : '') +
          (label ? '<span class="tag ' + (placed ? 'tag-sold' : 'tag-pending') + '">' + label + '</span>' : '') +
          (mates > 1 ? '<span class="tag tag-litter">Litter of ' + mates + '</span>' : '') +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-name">' + esc(l.puppy_name) + '</div>' +
          '<div class="card-breed">' + esc(l.breed || '') + '</div>' +
          '<div class="card-foot">' +
            '<span class="price">' + money(l.price) + '</span>' +
            '<span class="card-ready">' + (l.ready_date ? esc(readyText(l.ready_date)) : '') + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }
  /* On the home page the grids sit below the hero photo, so none of their cards competes with it
     for the first download (Alex, 2026-11-01, PageSpeed). */
  var eagerCards = document.querySelector('#homeFeatured') ? 0 : 8;
  function renderInto(sel, list, emptyMsg) {
    var el = document.querySelector(sel);
    if (!el) return;
    cardIndex = 0;
    el.innerHTML = list.length ? list.map(card).join('')
      : '<p class="empty">' + (emptyMsg || 'No puppies match those filters just now. Try widening your search.') + '</p>';
  }

  /* Once the page is settled, quietly warm a small, capped set of images the
     visitor is most likely to need next, so the following page paints from
     cache. Skipped entirely on metered or slow connections. */
  function warmNext(urls, cap) {
    var c = navigator.connection || {};
    if (c.saveData) return;
    if (/^(slow-)?2g$/.test(c.effectiveType || '')) return;
    var list = urls.filter(Boolean).slice(0, cap || 12);
    var go = function () {
      list.forEach(function (u, i) {
        setTimeout(function () { var im = new Image(); im.decoding = 'async'; im.src = u; }, i * 120);
      });
    };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 });
    else setTimeout(go, 1500);
  }

  /* ---------- header ---------- */
  var burger = document.querySelector('.burger');
  if (burger) {
    var nav = document.querySelector('.nav');
    var header = document.querySelector('.site-header');
    /* The full-height menu starts below the sticky header, whose height varies
       with the logo and tagline, so measure it rather than guess. */
    var sizeNav = function () {
      document.documentElement.style.setProperty('--hdr-h', header.offsetHeight + 'px');
    };
    sizeNav();
    addEventListener('resize', sizeNav);

    var setNav = function (open) {
      nav.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      burger.textContent = open ? 'Close' : 'Menu';
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      setNav(!nav.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setNav(false);
    });
  }

  /* ---------- search (Alex, 2026-10-11: "it doesn't behave flexibly to how different people
     would expect search to work") ----------
     One box that takes whatever a family types. A breed by its name, a nickname or a near miss
     ("yorkie", "frenchie", "goldendoodle", "cavapoo puppies"), a breeder, a town or state, a
     puppy's name, a price ("under $2,000"), a color, or "low shedding". Suggestions appear as
     they type, grouped by kind, and Enter goes to the best match or to every puppy that fits. */
  /* Search results link through pageHref(). The concept's pages take ?slug=, the generated
     site has a page per puppy, breed and breeder, and app/build/generate.mjs turns this on. */
  var STATIC_PAGES = false;
  function pageHref(kind, slug) {
    return STATIC_PAGES ? kind + '-' + encodeURIComponent(slug) + '.html' : kind + '.html' + '?slug=' + encodeURIComponent(slug);
  }
  var STOP = { puppy: 1, puppies: 1, pup: 1, pups: 1, dog: 1, dogs: 1, for: 1, sale: 1, near: 1, me: 1, in: 1, a: 1, an: 1, the: 1, of: 1, and: 1, available: 1, breeder: 1, breeders: 1 };
  /* Nicknames and common names for each breed, keyed by a word in the breed's own name. */
  var NICK = {
    'yorkshire terrier': ['yorkie', 'yorkies', 'yorky'], 'french bulldog': ['frenchie', 'frenchies', 'frenchy'],
    'bernese mountain dog': ['berner', 'berners', 'bernese'], 'pembroke welsh corgi': ['corgi', 'corgis'],
    'miniature dachshund': ['doxie', 'dachshund', 'weiner', 'wiener', 'mini doxie', 'mini dachshund'],
    'labrador retriever': ['lab', 'labs', 'labrador'], 'golden retriever': ['golden', 'goldens', 'golden retriever'],
    'f1b mini goldendoodle': ['goldendoodle', 'mini goldendoodle', 'doodle', 'golden doodle'],
    'mini bernedoodle': ['bernedoodle', 'doodle', 'berne doodle'], 'munchkin bernedoodle': ['bernedoodle', 'munchkin'],
    'mini aussiedoodle': ['aussiedoodle', 'aussie', 'doodle'], 'cavapoo': ['cavoodle', 'cav a poo', 'cavapoos'],
    'cavalier king charles spaniel': ['cavalier', 'cavaliers', 'king charles', 'ckcs'], 'teddy bear shihchon': ['teddy bear', 'shichon', 'zuchon', 'shihchon'],
    'doberman pinscher': ['doberman', 'dobie', 'dobermann'], 'great dane': ['dane', 'danes'], 'saint bernard': ['st bernard', 'saint'],
    'pomeranian': ['pom', 'poms'], 'shih tzu': ['shitzu', 'shihtzu', 'shih tzus'], 'miniature schnauzer': ['schnauzer', 'mini schnauzer'],
    'miniature poodle': ['poodle', 'mini poodle'], 'toy poodle': ['poodle', 'teacup poodle'], 'english bulldog': ['bulldog', 'english bulldogs'],
    'victorian bulldog': ['bulldog'], 'boston terrier': ['boston', 'bostons'], 'cocker spaniel': ['cocker', 'cockers'], 'havanese': ['havanese'], 'papillon': ['papillon']
  };
  var LOW_SHED = /\b(hypo ?allergenic|low ?shed(ding)?|non ?shed(ding)?|no ?shed(ding)?|allerg(y|ies|ic))\b/;
  var STATES = { AL: 'Alabama', AR: 'Arkansas', IA: 'Iowa', IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri', NE: 'Nebraska', OH: 'Ohio', PA: 'Pennsylvania', TN: 'Tennessee', WI: 'Wisconsin', WV: 'West Virginia' };
  function norm(s) {
    return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9$ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function singular(w) { return w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; }
  function words(s) { return norm(s).split(' ').filter(function (w) { return w && !STOP[w]; }).map(singular); }
  /* One edit (a dropped, added or swapped letter) still counts for longer words: "cavpoo", "pomeranain". */
  function near(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 5 || a[0] !== b[0]) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else if (a[i + 1] === b[j] && a[i] === b[j + 1]) { i += 2; j += 2; } else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  /* How well the typed words match a set of names: every typed word must start a word in one of
     them, or be one edit away from a word in them. Returns 0 for no match. */
  function score(typed, names) {
    if (!typed.length) return 0;
    var best = 0;
    names.forEach(function (n) {
      var nw = words(n), joined = nw.join('');
      var ok = 0, exact = 0;
      typed.forEach(function (t) {
        var hit = nw.some(function (w) { if (w === t) { exact++; return true; } return w.indexOf(t) === 0 || near(w, t); }) || (t.length >= 4 && joined.indexOf(t) === 0);
        if (hit) ok++;
      });
      if (ok === typed.length) best = Math.max(best, 10 + exact * 3 - Math.max(0, nw.length - typed.length));
    });
    return best;
  }
  function breedNames(b) {
    var n = norm(b.name);
    return [b.name].concat(NICK[n] || []);
  }
  function priceOf(q) {
    var m = norm(q).replace(/,/g, '').match(/(?:under|below|less than|up to|max|budget|<)?\s*\$?\s*(\d{3,5})(k)?\b/);
    if (!m) return null;
    var n = +m[1] * (m[2] ? 1000 : 1);
    return n >= 300 && n <= 20000 ? n : null;
  }
  function stripPrice(q) { return norm(q).replace(/(under|below|less than|up to|max|budget)?\s*\$?\s*\d{3,5}k?\b/g, ' ').trim(); }
  function colorsListed() {
    var seen = {};
    L.forEach(function (l) { words(l.color).forEach(function (w) { if (w.length > 2) seen[w] = 1; }); });
    return Object.keys(seen);
  }
  function placeOf(l) { return String(l.breeder_place || ''); }
  function stateName(code) { return STATES[String(code || '').toUpperCase()] || null; }
  /* Everything a typed query could mean, best first. Each is { kind, label, sub, href }. */
  function suggest(q) {
    var out = [], typed = words(q);
    var price = priceOf(q), rest = words(stripPrice(q));
    var lowShed = LOW_SHED.test(norm(q));
    var bestBreed = null;
    BREEDS.forEach(function (b) {
      var sc = score(rest.length ? rest : typed, breedNames(b));
      if (sc) out.push({ kind: 'Breed', label: b.name, sub: (b.live_count || b.demo_count || 0) + ' listed', href: pageHref('breed', b.slug), s: sc + 5, breed: b.name });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    bestBreed = out[0] || null;
    var seenB = {};
    L.forEach(function (l) {
      var slug = breederSlug(l);
      if (!slug || !l.breeder_name || seenB[slug]) return;
      seenB[slug] = 1;
      var sc = score(typed, [l.breeder_name]);
      if (sc) out.push({ kind: 'Breeder', label: l.breeder_name, sub: placeOf(l), href: pageHref('breeder', slug), s: sc });
    });
    var places = {};
    L.forEach(function (l) {
      var p = placeOf(l); if (!p) return;
      var town = p.split(',')[0].trim(), st = stateName((p.split(',')[1] || '').trim());
      [town, st].forEach(function (x) { if (x) places[x] = (places[x] || 0) + (isPlaced(l) ? 0 : 1); });
    });
    Object.keys(places).forEach(function (p) {
      var sc = score(typed, [p]);
      if (sc) out.push({ kind: 'Place', label: 'Puppies in ' + p, sub: places[p] + ' available', href: 'puppies.html?q=' + encodeURIComponent(p), s: sc });
    });
    /* A puppy's name shows as soon as three letters of it are typed (Alex, 2026-10-29: "rom" did not
       find Romeo until the whole name was typed). A name that only starts with what was typed ranks
       below breeds, breeders and places, and at most three names show, so a short typed word does not
       fill the list with every name that begins with it. */
    var names = [];
    L.forEach(function (l) {
      if (isPlaced(l) || !l.puppy_name) return;
      var sc = score(typed, [l.puppy_name]);
      if (sc >= 13 || (sc >= 10 && typed.join('').length >= 3)) names.push({ kind: 'Puppy', label: l.puppy_name, sub: l.breed + (l.price ? ', ' + money(l.price) : ''), href: pageHref('puppy', l.slug), s: sc - 2 });
    });
    names.sort(function (x, y) { return y.s - x.s; });
    out = out.concat(names.slice(0, 3));
    /* What the words describe rather than name: a price, low shedding, a color. */
    var cols = colorsListed().filter(function (c) { return rest.some(function (t) { return c === t || (t.length > 3 && c.indexOf(t) === 0); }); });
    if (price || lowShed || cols.length) {
      var bits = [], qp = [];
      if (cols.length) { bits.push(cols.join(' ')); }
      if (bestBreed && bestBreed.s >= 14) { bits.push(bestBreed.breed); }
      var label = (lowShed ? 'Low-shedding ' : '') + (bits.length ? bits.join(' ') + ' puppies' : (lowShed ? 'puppies' : 'Puppies')) + (price ? ' up to ' + money(price) : '');
      if (price) qp.push('max=' + price);
      var text = (lowShed ? 'low shedding ' : '') + cols.join(' ');
      if (bestBreed && bestBreed.s >= 14) qp.push('breed=' + encodeURIComponent(bestBreed.breed));
      if (text.trim()) qp.push('q=' + encodeURIComponent(text.trim()));
      out.push({ kind: 'Search', label: label.charAt(0).toUpperCase() + label.slice(1), sub: 'See every match', href: 'puppies.html?' + qp.join('&'), s: 40 });
    }
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, 8);
  }
  /* A typed query that names no single page goes to every puppy that fits it. */
  function searchHref(q) {
    var price = priceOf(q), qp = [];
    if (price) qp.push('max=' + price);
    var text = stripPrice(q);
    if (text) qp.push('q=' + encodeURIComponent(text));
    return 'puppies.html' + (qp.length ? '?' + qp.join('&') : '');
  }
  /* Does a listing fit free text: every typed word must appear in its name, breed (or a nickname
     for it), color, coat, breeder or town, and "low shedding" means a hypoallergenic listing. */
  function listingMatches(l, q) {
    var t = norm(q);
    if (!t) return true;
    if (LOW_SHED.test(t)) { if (!l.hypoallergenic) return false; t = t.replace(LOW_SHED, ' '); }
    var typed = words(t);
    if (!typed.length) return true;
    var breed = BREEDS.filter(function (b) { return b.name === l.breed; })[0];
    var hay = [l.puppy_name || l.name, l.color, l.coat, l.breeder_name, placeOf(l), stateName((placeOf(l).split(',')[1] || '').trim())].concat(breed ? breedNames(breed) : [l.breed]);
    var hw = [];
    hay.forEach(function (h) { hw = hw.concat(words(h)); });
    return typed.every(function (w) { return hw.some(function (x) { return x === w || x.indexOf(w) === 0 || near(x, w); }); });
  }

  var heroQ = document.querySelector('#heroQ');
  if (heroQ) {
    var sug = document.querySelector('#heroSug'), heroForm = document.querySelector('#heroForm');
    var items = [], act = -1;
    var close = function () { sug.hidden = true; heroQ.setAttribute('aria-expanded', 'false'); heroQ.removeAttribute('aria-activedescendant'); act = -1; };
    var draw = function () {
      var q = heroQ.value.trim();
      items = q.length >= 2 ? suggest(q) : [];
      if (!items.length) {
        sug.innerHTML = q.length >= 2 ? '<li class="sug-none" role="option" aria-disabled="true">No exact match. Press Search to see puppies that come close.</li>' : '';
        sug.hidden = q.length < 2; heroQ.setAttribute('aria-expanded', String(q.length >= 2)); return;
      }
      sug.innerHTML = items.map(function (it, i) {
        return '<li role="option" id="sug-' + i + '" aria-selected="false" data-i="' + i + '"><span class="sug-kind">' + esc(it.kind) + '</span><span class="sug-label">' + esc(it.label) + '</span>' + (it.sub ? '<span class="sug-sub">' + esc(it.sub) + '</span>' : '') + '</li>';
      }).join('');
      sug.hidden = false; heroQ.setAttribute('aria-expanded', 'true'); act = -1;
    };
    var mark = function (i) {
      [].forEach.call(sug.querySelectorAll('li[data-i]'), function (li) { li.setAttribute('aria-selected', String(+li.dataset.i === i)); });
      act = i;
      if (i >= 0) heroQ.setAttribute('aria-activedescendant', 'sug-' + i); else heroQ.removeAttribute('aria-activedescendant');
    };
    heroQ.addEventListener('input', draw);
    heroQ.addEventListener('focus', function () { if (heroQ.value.trim().length >= 2) draw(); });
    heroQ.addEventListener('keydown', function (e) {
      if (sug.hidden || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(items.length - 1, act + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(-1, act - 1)); }
      else if (e.key === 'Escape') { close(); }
    });
    sug.addEventListener('mousedown', function (e) {
      var li = e.target.closest('li[data-i]');
      if (li) { e.preventDefault(); location.href = items[+li.dataset.i].href; }
    });
    document.addEventListener('click', function (e) { if (!heroForm.contains(e.target)) close(); });
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = heroQ.value.trim();
      if (act >= 0 && items[act]) { location.href = items[act].href; return; }
      if (!q) { location.href = 'puppies.html'; return; }
      var top = suggest(q)[0];
      /* A query that is plainly one breed, breeder or puppy goes straight there. */
      if (top && top.kind !== 'Search' && top.kind !== 'Place' && top.s >= 15) { location.href = top.href; return; }
      if (top && top.kind === 'Search') { location.href = top.href; return; }
      location.href = searchHref(q);
    });
  }

  /* "Show more", on a phone, the way Teapup's home page does it (Alex, 2026-10-07). Below
     760px the home grids run two across, so a grid shows its first `step` cards and a button
     adds `step` more. The button ships hidden and only this shows it, so with the script off
     every card is there, and above the line every card shows. */
  /* 2026-10-10: the grids used to hold only 12 cards, so on a phone one press showed four and
     the button vanished, and on a computer there was no button at all (Alex: "they don't
     actually work"). Now the grid holds the whole set, a phone shows `step` at a time and a
     computer `wide` at a time, and once everything is showing the button becomes a link to
     the full page (`allHref`), so pressing it always does something. */
  function reveal(gridId, step, wide, allHref, allText) {
    var grid = document.getElementById(gridId);
    var btn = document.querySelector('[data-reveal-more="' + gridId + '"]');
    if (!grid || !btn || !window.matchMedia) return;
    var cards = [].slice.call(grid.children);
    var small = window.matchMedia('(max-width: 760px)');
    var per = function () { return small.matches ? step : wide; };
    var shown = per();
    var label = btn.textContent;
    var link = document.createElement('a');
    link.className = btn.className; link.href = allHref; link.textContent = allText; link.hidden = true;
    btn.parentNode.appendChild(link);
    var paint = function () {
      cards.forEach(function (c, i) { c.hidden = i >= shown; });
      var more = cards.length > shown;
      btn.hidden = !more; btn.textContent = label;
      link.hidden = more;
    };
    btn.addEventListener('click', function () {
      var first = cards[shown];
      shown += per();
      paint();
      if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
    });
    if (small.addEventListener) small.addEventListener('change', function () { shown = Math.max(shown, per()); paint(); });
    paint();
  }

  /* The footer's sections, closed on a phone, as on Teapup. They are written open, so with
     the script off every link stays in the page, and a shut <details> can only be opened
     again from the attribute, which is why this is script and not CSS. Once somebody opens
     or shuts one themselves, it stops second-guessing them. */
  (function () {
    var secs = [].slice.call(document.querySelectorAll('.foot-sec'));
    if (!secs.length || !window.matchMedia) return;
    var small = window.matchMedia('(max-width: 700px)');
    var touched = false;
    secs.forEach(function (x) {
      x.addEventListener('toggle', function () { if (x.dataset.auto) delete x.dataset.auto; else touched = true; });
    });
    var apply = function () {
      if (touched) return;
      secs.forEach(function (x) { var want = !small.matches; if (x.open !== want) { x.dataset.auto = '1'; x.open = want; } });
    };
    apply();
    if (small.addEventListener) small.addEventListener('change', apply);
  })();

  /* ---------- home ---------- */
  if (document.querySelector('#homeFeatured')) {
    var seenBreed = {};
    var featured = L.filter(function (l) {
      if (isPlaced(l) || !img(l) || !l.breed || seenBreed[l.breed]) return false;
      seenBreed[l.breed] = 1;
      return true;
    });
    // One puppy per breed. Twelve show at first on a computer (three rows of four) and eight on a
    // phone (two across), and "Show more puppies" adds the same again (Alex, 2026-10-07 and 10-10).
    renderInto('#homeFeatured', featured);
    reveal('homeFeatured', 8, 12, 'puppies.html', 'See all puppies');

    var bl = document.querySelector('#breedList');
    if (bl) {
      bl.innerHTML = BREEDS.map(function (b) {
        return '<a class="card" href="breed.html?slug=' + esc(b.slug) + '">' +
          '<div class="card-media">' + (b.photo ? '<img src="' + esc(PHONE.matches ? wix(b.photo_tall || b.photo, 480, 600) : wix(b.photo, 600, 400)) +
            '" alt="' + esc(b.name) + '" loading="lazy" decoding="async" ' +
            (b.photo_small ? 'srcset="' + esc(b.photo_small) + ' 400w, ' + esc(b.photo) + ' 800w" sizes="(max-width:760px) 46vw, 25vw" ' : '') + (PHONE.matches ? 'width="480" height="600"' : 'width="600" height="400"') + '>' : '') + '</div>' +
          '<div class="card-body"><div class="card-name">' + esc(b.name) + '</div>' +
          '<div class="card-breed">' + b.demo_count + ' listed</div></div></a>';
      }).join('');
      reveal('breedList', 8, 12, 'breeds.html', 'See all breeds');
    }

    /* Most visitors go from home to the browse grid next, so warm exactly what
       that grid paints first: available puppies, cheapest first. Matching the
       browse ordering matters, or this just refetches the featured row. */
    var nextUp = L.filter(function (x) { return !isPlaced(x) && img(x); })
                  .sort(function (a, b) { return (a.price || 0) - (b.price || 0); })
                  .slice(0, 12)
                  .map(function (x) { return wix(img(x), 600, 400); });
    warmNext(nextUp, 12);

    var brd = document.querySelector('#breederStrip');
    if (brd) {
      brd.innerHTML = realBreeders().slice(0, 6).map(function (b) {
        return '<a class="card" href="breeder.html?slug=' + esc(b.slug) + '" style="padding:1.3rem 1.4rem">' +
          '<div class="eyebrow">' + b.listings.length + ' puppies listed</div>' +
          '<div class="card-name" style="margin-bottom:.35rem">' + esc(b.name) + '</div>' +
          '<p style="font-size:.94rem;color:var(--ink-soft);margin:0">' + esc(b.domain) + '</p></a>';
      }).join('');
    }
  }

  /* ---------- browse ---------- */
  if (document.querySelector('#results')) {
    /* The filter bar, the same design as Teapup and Sweet Puppy Paws (Alex, 2026-10-07).
       Each field is [value, menu text, tag text]. An empty value is the field's resting
       state, shown under the field's label, so "Available only" is the default. */
    var FIELDS = {
      breed: { label: 'Breed', any: 'Any breed', opts: [] },
      max: { label: 'Price', any: 'Any price', opts: [['1500', 'Up to $1,500', 'Up to $1,500'], ['2000', 'Up to $2,000', 'Up to $2,000'], ['2500', 'Up to $2,500', 'Up to $2,500'], ['3500', 'Up to $3,500', 'Up to $3,500']] },
      show: { label: 'Available only', any: 'Available only', opts: [['all', 'Include adopted puppies', 'Including adopted']] }
    };
    var KEYS = Object.keys(FIELDS);
    var head = document.querySelector('#availHead');
    var fEmpty = document.querySelector('.f-empty');
    var scrim = document.querySelector('.f-scrim'), fsheet = document.querySelector('.f-sheet');
    var sheetBody = fsheet.querySelector('.f-sheet-body');
    var LENS = head.querySelector('.ft-search svg').outerHTML;
    var blank = function () { return { breed: '', max: '', show: '', name: '' }; };
    var state = blank();
    var asked = qs('breed') || '';
    if (BREEDS.some(function (b) { return b.name === asked; })) state.breed = asked;
    /* From the home page search: ?max= sets the price, ?q= fills the search box. A price that
       is not one of the menu's steps is added to the menu so it shows as chosen. */
    var askedMax = +(qs('max') || 0);
    if (askedMax >= 300) {
      state.max = String(askedMax);
      if (!FIELDS.max.opts.some(function (o) { return o[0] === state.max; })) FIELDS.max.opts.push([state.max, 'Up to ' + money(askedMax), 'Up to ' + money(askedMax)]);
    }
    if (qs('q')) state.name = qs('q');

    /* A breed's count follows the availability choice, so "Mini Aussiedoodle (8)" never
       opens onto an empty grid because all eight have gone home. */
    var countBreeds = function () {
      var n = {};
      L.forEach(function (l) { if (state.show || !isPlaced(l)) n[l.breed] = (n[l.breed] || 0) + 1; });
      FIELDS.breed.opts = BREEDS.filter(function (b) { return n[b.name] || b.name === state.breed; })
        .map(function (b) { return [b.name, b.name + ' (' + (n[b.name] || 0) + ')', b.name]; });
    };
    countBreeds();
    var shortOf = function (k) {
      var o = FIELDS[k].opts.filter(function (x) { return x[0] === state[k]; })[0];
      return o ? o[2] : FIELDS[k].label;
    };
    var fillSheet = function () {
      var html = '';
      KEYS.forEach(function (k) {
        var title = k === 'show' ? 'Availability' : FIELDS[k].label;
        html += '<div class="f-group"><h3>' + title + '</h3><div class="f-chips">' +
          [['', FIELDS[k].any, FIELDS[k].any]].concat(FIELDS[k].opts).map(function (x) {
            return '<button type="button" class="f-chip" data-k="' + k + '" data-v="' + esc(x[0]) + '" aria-pressed="' + (state[k] === x[0]) + '">' + esc(x[2]) + '</button>';
          }).join('') + '</div></div>';
      });
      html += '<div class="f-group"><h3>Search</h3><label class="f-name">' + LENS +
        '<input type="search" data-name autocomplete="off" placeholder="Name, color, breeder or town" aria-label="Search by name, color, breeder or town" value="' + esc(state.name) + '"></label></div>';
      sheetBody.innerHTML = html;
    };
    var renderTags = function () {
      head.querySelectorAll('button.ft[data-k]').forEach(function (b) {
        var k = b.getAttribute('data-k'), on = !!state[k];
        b.querySelector('.ft-text').textContent = shortOf(k);
        b.classList.toggle('on', on);
        head.querySelector('.ftags [data-clear="' + k + '"]').hidden = !on;
      });
      document.querySelectorAll('input[data-name]').forEach(function (i) { if (i !== document.activeElement) i.value = state.name; });
      var html = '', n = 0;
      KEYS.forEach(function (k) {
        if (!state[k]) return;
        n++;
        html += '<span class="ft-wrap"><span class="ft on">' + esc(shortOf(k)) + '</span><button type="button" class="ft-x" data-clear="' + k + '" aria-label="Clear ' + FIELDS[k].label.toLowerCase() + '">&times;</button></span>';
      });
      if (state.name) {
        n++;
        html += '<span class="ft-wrap"><span class="ft on">Name: ' + esc(state.name) + '</span><button type="button" class="ft-x" data-clear="name" aria-label="Clear name">&times;</button></span>';
      }
      head.querySelector('.f-active').innerHTML = html;
      var dot = head.querySelector('.f-open .dot'); dot.textContent = n; dot.hidden = !n;
      var typing = fsheet.contains(document.activeElement) && document.activeElement.hasAttribute('data-name');
      if (!fsheet.hidden && !typing) fillSheet();
    };

    /* Render in pages. Building 200 cards with 200 images on every filter
       change is what made selection feel sluggish. */
    var PAGE = 40;
    var shown = PAGE;
    var current = [];

    var paint = function () {
      renderInto('#results', current.slice(0, shown));
      var more = document.querySelector('#moreRow');
      var left = current.length - shown;
      more.innerHTML = left > 0
        ? '<button type="button" id="moreBtn">Show ' + Math.min(left, PAGE) + ' more of ' + left + '</button>'
        : '';
    };

    var apply = function () {
      countBreeds();
      var q = state.name.trim().toLowerCase();
      current = L.filter(function (l) {
        if (state.breed && l.breed !== state.breed) return false;
        if (state.max && (l.price || 0) > +state.max) return false;
        if (!state.show && isPlaced(l)) return false;
        if (q && !listingMatches(l, q)) return false;
        return true;
      });
      // Newest listing first (Alex, 2026-10-31), then by price.
      current.sort(function (a, b) { return String(b.listed || '').localeCompare(String(a.listed || '')) || (a.price || 0) - (b.price || 0); });
      shown = PAGE;
      paint();
      var label = current.length + (current.length === 1 ? ' puppy' : ' puppies');
      document.querySelector('#resultCount').textContent = label;
      fEmpty.hidden = current.length > 0;
      var showBtn = fsheet.querySelector('.f-show');
      if (showBtn) showBtn.textContent = current.length ? 'Show ' + label : 'No matches';
      var h = document.querySelector('#browseTitle');
      if (h) h.textContent = state.breed ? state.breed + ' puppies' : 'All available puppies';
      renderTags();
    };
    var setF = function (k, v) { state[k] = v; apply(); };

    /* From the grid, the next click is almost always a listing, so warm the
       larger gallery rendition for the first few results. */
    warmNext(current.slice(0, 6).map(function (x) { return wixFit(img(x), 1200, 800); }), 6);

    document.querySelector('#moreRow').addEventListener('click', function (e) {
      if (!e.target.closest('#moreBtn')) return;
      shown += PAGE;
      paint();
    });

    var closeMenus = function () {
      head.querySelectorAll('.ft-menu').forEach(function (m) { m.hidden = true; });
      head.querySelectorAll('button.ft[aria-expanded]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    };
    var openMenu = function (b) {
      var k = b.getAttribute('data-k'), m = b.parentNode.querySelector('.ft-menu');
      m.innerHTML = [['', FIELDS[k].any]].concat(FIELDS[k].opts).map(function (o) {
        return '<li role="option" data-v="' + esc(o[0]) + '" aria-selected="' + (state[k] === o[0]) + '">' + esc(o[1]) + '</li>';
      }).join('');
      m.classList.remove('flip'); m.hidden = false; b.setAttribute('aria-expanded', 'true');
      if (m.getBoundingClientRect().right > document.documentElement.clientWidth - 8) m.classList.add('flip');
      var f = m.querySelector('li[aria-selected="true"]') || m.querySelector('li');
      if (f) { f.classList.add('act'); f.scrollIntoView({ block: 'nearest' }); }
    };
    var openSheet = function () {
      fillSheet(); scrim.hidden = false; fsheet.hidden = false; document.body.style.overflow = 'hidden';
      fsheet.querySelector('.f-sheet-close').focus();
    };
    var closeSheet = function () {
      scrim.hidden = true; fsheet.hidden = true; document.body.style.overflow = '';
      head.querySelector('.f-open').focus();
    };
    head.addEventListener('click', function (e) {
      var x = e.target.closest('[data-clear]');
      if (x) { setF(x.getAttribute('data-clear'), ''); closeMenus(); return; }
      var li = e.target.closest('.ft-menu li');
      if (li) { var b = li.closest('.ft-wrap').querySelector('button.ft'); setF(b.getAttribute('data-k'), li.getAttribute('data-v')); closeMenus(); b.focus(); return; }
      if (e.target.closest('.f-open')) { openSheet(); return; }
      var t = e.target.closest('button.ft[data-k]');
      if (t) { var shut = t.parentNode.querySelector('.ft-menu').hidden; closeMenus(); if (shut) openMenu(t); }
    });
    head.addEventListener('keydown', function (e) {
      var m = [].slice.call(head.querySelectorAll('.ft-menu')).filter(function (x) { return !x.hidden; })[0];
      if (!m) return;
      var items = [].slice.call(m.querySelectorAll('li')), i = items.indexOf(m.querySelector('li.act'));
      if (e.key === 'Escape') { closeMenus(); m.parentNode.querySelector('button.ft').focus(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (i >= 0) items[i].classList.remove('act');
        i = Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
        items[i].classList.add('act'); items[i].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); items[i].click(); }
    });
    document.addEventListener('click', function (e) { if (!head.contains(e.target)) closeMenus(); });
    document.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-name')) setF('name', e.target.value); });
    fsheet.addEventListener('click', function (e) {
      var c = e.target.closest('.f-chip');
      if (c) { setF(c.getAttribute('data-k'), c.getAttribute('data-v')); return; }
      if (e.target.closest('.f-show') || e.target.closest('.f-sheet-close')) { closeSheet(); return; }
      if (e.target.closest('.f-clear-all')) { state = blank(); apply(); }
    });
    scrim.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !fsheet.hidden) closeSheet(); });
    document.querySelector('[data-reset]').addEventListener('click', function () { state = blank(); apply(); });
    /* On a phone the bar stays pinned under the header, whose height changes with the
       width, so measure it rather than guess. */
    var pin = function () { var hd = document.querySelector('.site-header'); head.style.setProperty('--pin', (hd ? hd.offsetHeight : 0) + 'px'); };
    pin(); window.addEventListener('resize', pin);
    apply();
  }

  /* ---------- listing detail ---------- */
  if (document.querySelector('#detail')) {
    var l = L.filter(function (x) { return x.slug === qs('slug'); })[0] || L[0];
    var mates = byLitter(l.litter).filter(function (x) { return x.slug !== l.slug; });
    document.title = l.puppy_name + ' — ' + (l.breed || 'Puppy') + ' | Puppy Connection';

    document.querySelector('#dName').textContent = l.puppy_name;
    document.querySelector('#dPrice').textContent = money(l.price);
    var bl2 = document.querySelector('#dBreed');
    bl2.innerHTML = l.breed
      ? '<a href="breed.html?slug=' + esc(slugify(l.breed)) + '" style="color:inherit">' + esc(l.breed) + '</a>'
      : '';

    var facts = [
      ['Breed', l.breed], ['Born', l.birthdate], ['Ready to go home', l.ready_date],
      ['Deposit', l.deposit ? money(l.deposit) : null],
      ['Mother', l.mom_weight ? l.mom_weight + ' adult weight' : null],
      ['Father', l.dad_weight ? l.dad_weight + ' adult weight' : null],
      ['Coat', l.hypoallergenic ? 'Hypoallergenic' : null]
    ].filter(function (f) { return f[1]; });
    document.querySelector('#dFacts').innerHTML = facts.map(function (f) {
      return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
    }).join('');

    var gal = document.querySelector('#dGallery');
    var main = document.querySelector('#dMain');
    if (img(l)) {
      main.innerHTML = '<img src="' + esc(wixFit(img(l), 1200, 800)) + '" alt="' + esc(l.puppy_name) +
        '" decoding="async">';
      gal.innerHTML = (l.images || []).map(function (u, i) {
        return '<button type="button"' + (i === 0 ? ' aria-current="true"' : '') +
          ' data-full="' + esc(wixFit(u, 1200, 800)) + '"><img src="' + esc(wix(u, 160, 160)) +
          '" alt="" loading="lazy" decoding="async" width="160" height="160"></button>';
      }).join('');
      gal.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        gal.querySelectorAll('button').forEach(function (x) { x.removeAttribute('aria-current'); });
        btn.setAttribute('aria-current', 'true');
        main.querySelector('img').src = btn.getAttribute('data-full');
      });

      /* Page the strip by roughly a screenful, and only offer the direction
         that actually goes somewhere. */
      var prev = document.querySelector('.thumb-nav.prev');
      var next = document.querySelector('.thumb-nav.next');
      if (prev && next) {
        var syncNav = function () {
          var over = gal.scrollWidth - gal.clientWidth;
          prev.hidden = over < 8 || gal.scrollLeft < 8;
          next.hidden = over < 8 || gal.scrollLeft > over - 8;
        };
        var page = function (dir) {
          gal.scrollLeft += dir * Math.max(gal.clientWidth - 84, 84);
          syncNav();
        };
        prev.addEventListener('click', function () { page(-1); });
        next.addEventListener('click', function () { page(1); });
        gal.addEventListener('scroll', syncNav);
        addEventListener('resize', syncNav);
        syncNav();
      }
    }

    /* Thumbnail clicks should be instant, so warm the remaining full sizes. */
    warmNext((l.images || []).slice(1, 6).map(function (u) { return wixFit(u, 1200, 800); }), 5);

    var inc = document.querySelector('#dIncludes');
    if (l.includes && l.includes.length) {
      inc.innerHTML = l.includes.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('');
    } else {
      inc.closest('section').hidden = true;
    }

    /* Link as deep as we could find on the breeder's own site, and label it
       honestly: a breed or available-puppies page must not read as if it were
       this puppy's page. */
    var site = l.breeder_url || (l.breeder_domain ? 'https://' + l.breeder_domain : null);
    var siteLabel = l.breeder_url_tier === 'puppy' ? esc(l.puppy_name) + "'s own page"
      : l.breeder_url_tier === 'breed' ? 'Their ' + esc(l.breed || 'breed') + ' page'
      : l.breeder_url_tier === 'available' ? 'Their available puppies'
      : esc(l.breeder_domain || '');
    var hasContact = site || l.breeder_phone || l.breeder_email;
    document.querySelector('#dBreeder').innerHTML =
      '<div class="eyebrow">Raised by</div>' +
      '<h3>' + esc(breederLabel(l)) + '</h3>' +
      '<p class="breeder-note">Puppy Connection lists this puppy. The sale is arranged directly with the breeder.</p>' +
      (hasContact ? '<ul class="contact-list">' +
        (site ? '<li><a href="' + esc(site) + '" target="_blank" rel="noopener"><b>Website</b> ' +
          siteLabel + '</a></li>' : '') +
        (l.breeder_phone ? '<li><a href="tel:' + esc(l.breeder_phone.replace(/[^\d+]/g, '')) + '"><b>Call</b> ' + esc(l.breeder_phone) + '</a></li>' : '') +
        (l.breeder_email ? '<li><a href="mailto:' + esc(l.breeder_email) + '"><b>Email</b> ' + esc(l.breeder_email) + '</a></li>' : '') +
        '</ul>' : '<p class="disclaimer">Contact details for this breeder are being confirmed.</p>') +
      (l.breeder_domain ? '<p style="margin:.9rem 0 0"><a href="breeder.html?slug=' + esc(breederSlug(l)) +
        '">See all puppies from ' + esc(breederLabel(l)) + '</a></p>' : '');

    var d = document.querySelector('#dDesc');
    d.textContent = l.description || '';
    var nEl = document.querySelector('#dNote');
    if (l.note) { nEl.textContent = l.note; } else { nEl.hidden = true; }
    if (!l.description) d.closest('section').hidden = true;

    var ms = document.querySelector('#dMates');
    if (mates.length) {
      document.querySelector('#dMatesCount').textContent = mates.length;
      ms.innerHTML = mates.map(card).join('');
    } else {
      ms.closest('section').hidden = true;
    }
  }

  /* ---------- breeders index ---------- */
  if (document.querySelector('#breederIndex')) {
    var rb = realBreeders();
    document.querySelector('#breederIndex').innerHTML = rb.map(function (b) {
      var shot = b.listings.filter(function (x) { return img(x); })[0];
      var open = b.listings.filter(function (x) { return !isPlaced(x); }).length;
      return '<a class="card" href="breeder.html?slug=' + esc(b.slug) + '">' +
        '<div class="card-media">' + (shot ? '<img src="' + esc(wix(img(shot), 600, 400)) +
          '" alt="' + esc(b.name) + '" loading="lazy" decoding="async" width="600" height="400">' : '') + '</div>' +
        '<div class="card-body"><div class="card-name">' + esc(b.name) + '</div>' +
        '<div class="card-breed">' + esc(b.domain) + '</div>' +
        '<div class="card-foot"><span class="card-ready">' + open + ' available</span>' +
        '<span class="card-ready">' + b.listings.length + ' listed</span></div></div></a>';
    }).join('');
    document.querySelector('#breederIndexCount').textContent = rb.length;

    var pf = document.querySelector('#profileExamples');
    if (pf) {
      pf.innerHTML = BREEDERS.map(function (x) {
        return '<a class="card" href="breeder.html?profile=' + esc(x.slug) + '" style="padding:1.2rem 1.3rem">' +
          '<div class="eyebrow">Profile</div>' +
          '<div class="card-name" style="margin-bottom:.4rem">' + esc(x.kennel) + '</div>' +
          '<p style="font-size:.93rem;color:var(--ink-soft);margin:0">' + esc(x.body[0].slice(0, 140)) + '...</p></a>';
      }).join('');
    }
  }

  /* ---------- breeder page ---------- */
  if (document.querySelector('#profile')) {
    var pslug = qs('profile');
    var bslug = qs('slug');
    var rbs = realBreeders();
    var biz = rbs.filter(function (x) { return x.slug === bslug; })[0];
    var prof = BREEDERS.filter(function (x) { return x.slug === pslug; })[0];
    if (!biz && !prof) biz = rbs[0];

    var name = biz ? biz.name : prof.kennel;
    var theirs = biz ? biz.listings : [];
    document.title = name + ' | Puppy Connection';
    document.querySelector('#pName').textContent = name;
    document.querySelector('#pPeople').textContent = biz ? biz.domain : (prof.people || '');

    /* A breeder's page shows only that breeder's own profile copy. With none written, it shows
       none, rather than borrowing another kennel's words and people. */
    var body = prof ? prof.body : [];
    document.querySelector('#pBody').innerHTML =
      body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');

    var logo = document.querySelector('#pLogo');
    if (logo) {
      if (biz && LOGOS[biz.slug]) {
        if (LOGOS[biz.slug].light) logo.classList.add('on-dark');
        logo.innerHTML = '<img src="img/breeders/' + esc(biz.slug) + '.webp" alt="' +
          esc(biz.name) + ' logo" loading="lazy" decoding="async">';
      } else { logo.hidden = true; }
    }

    var cbox = document.querySelector('#pContact');
    if (cbox && biz) {
      var any = theirs.filter(function (x) { return x.breeder_phone || x.breeder_email; })[0] || {};
      cbox.innerHTML = '<p class="eyebrow">Connect with this breeder</p>' +
        '<ul class="contact-list">' +
        '<li><a href="https://' + esc(biz.domain) + '" target="_blank" rel="noopener"><b>Website</b> ' + esc(biz.domain) + '</a></li>' +
        (any.breeder_phone ? '<li><a href="tel:' + esc(String(any.breeder_phone).replace(/[^\d+]/g, '')) + '"><b>Call</b> ' + esc(any.breeder_phone) + '</a></li>' : '') +
        (any.breeder_email ? '<li><a href="mailto:' + esc(any.breeder_email) + '"><b>Email</b> ' + esc(any.breeder_email) + '</a></li>' : '') +
        '</ul><p class="disclaimer">Puppy Connection is not part of the sale.</p>';
    }

    document.querySelector('#pCount').textContent = theirs.length;
    renderInto('#pListings', theirs, 'No puppies are listed by this breeder right now.');

    var all = document.querySelector('#pAll');
    if (all) {
      all.innerHTML = rbs.filter(function (x) { return !biz || x.slug !== biz.slug; }).map(function (x) {
        return '<a class="card" href="breeder.html?slug=' + esc(x.slug) + '" style="padding:1.2rem 1.3rem">' +
          '<div class="eyebrow">' + x.listings.length + ' listed</div>' +
          '<div class="card-name" style="margin-bottom:.35rem">' + esc(x.name) + '</div>' +
          '<p style="font-size:.93rem;color:var(--ink-soft);margin:0">' + esc(x.domain) + '</p></a>';
      }).join('');
    }
  }

  /* ---------- breed page ---------- */
  if (document.querySelector('#breedPage')) {
    var want = qs('slug');
    var b = BREEDS.filter(function (x) { return x.slug === want; })[0] || BREEDS[0];
    var pups = L.filter(function (x) { return x.breed === b.name; });
    var open2 = pups.filter(function (x) { return !isPlaced(x); });
    document.title = b.name + ' puppies | Puppy Connection';

    document.querySelector('#bName').textContent = b.name;
    document.querySelector('#bCount').textContent = open2.length + ' available now';

    /* Sidebar portrait rather than a banner: a wide strip crops arbitrary
       breeder photos to whatever happens to sit in the middle. */
    var bph = document.querySelector('#bPhoto');
    if (b.photo) {
      bph.innerHTML = '<img src="' + esc(wix(b.photo, 900, 600)) + '" alt="' +
        esc(b.name) + '" decoding="async">' +
        '<span class="photo-cap">A ' + esc(b.name) + ' currently listed</span>';
    } else { bph.hidden = true; }

    var gEl = document.querySelector('#bGuide');
    if (b.guide && b.guide.length) {
      gEl.innerHTML = b.guide.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    } else {
      gEl.innerHTML = '<p class="empty">A breed guide for ' + esc(b.name) +
        ' has not been written yet. This is one of the content gaps worth filling, ' +
        'because breed pages are what search traffic lands on.</p>';
    }

    renderInto('#bListings', open2.length ? open2 : pups,
      'No ' + esc(b.name) + ' puppies are listed at the moment.');

    var others = document.querySelector('#bOthers');
    if (others) {
      others.innerHTML = BREEDS.filter(function (x) { return x.slug !== b.slug; }).slice(0, 8).map(function (x) {
        return '<a class="card" href="breed.html?slug=' + esc(x.slug) + '">' +
          '<div class="card-media">' + (x.photo ? '<img src="' + esc(wix(x.photo, 480, 320)) +
            '" alt="' + esc(x.name) + '" loading="lazy" decoding="async" width="480" height="360">' : '') + '</div>' +
          '<div class="card-body"><div class="card-name">' + esc(x.name) + '</div>' +
          '<div class="card-breed">' + x.demo_count + ' listed</div></div></a>';
      }).join('');
    }
  }

  /* ---------- breeds index ---------- */
  if (document.querySelector('#breedIndex')) {
    document.querySelector('#breedIndex').innerHTML = BREEDS.map(function (b) {
      var open3 = L.filter(function (x) { return x.breed === b.name && !isPlaced(x); }).length;
      return '<a class="card" href="breed.html?slug=' + esc(b.slug) + '">' +
        '<div class="card-media">' + (b.photo ? '<img src="' + esc(wix(b.photo, 600, 400)) +
          '" alt="' + esc(b.name) + '" loading="lazy" decoding="async" width="600" height="400">' : '') + '</div>' +
        '<div class="card-body"><div class="card-name">' + esc(b.name) + '</div>' +
        '<div class="card-foot"><span class="card-ready">' + open3 + ' available</span>' +
        '<span class="card-ready">' + (b.guide && b.guide.length ? 'Guide' : '') + '</span></div></div></a>';
    }).join('');
    document.querySelector('#breedIndexCount').textContent = BREEDS.length;
  }
})();

/* ---------- Let's Chat, on every page (launch workplan A15) ----------
   One button in the bottom corner that opens Puppy Connection's own contact details, for a
   family looking for a puppy and for a breeder who wants to list. A question about one puppy
   still goes to its breeder, whose details stay on the puppy and breeder pages.

   Puppy Connection's phone, email and social links go in CONTACT below, the one place they
   live (Amber, 2026-10-25). An empty value shows a visible REPLACE THIS.

   The button hides while the phone menu is open, because the menu covers the page and a button
   floating over it lands on the menu's last link. */
(function () {
  'use strict';
  if (document.querySelector('.chat-fab')) return;

  var CONTACT = {
    phone: '(574) 221-0326',
    email: 'info@puppy-connection.com',
    social: [['Facebook', 'https://www.facebook.com/puppyconnectionUSA'], ['Instagram', 'https://www.instagram.com/puppy_connection_in/']]
  };

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function todo(what) { return '<span class="todo">REPLACE THIS: ' + esc(what) + '</span>'; }
  // The value is one element, so a row with two links keeps both beside the label.
  function row(label, inner) {
    return '<div class="row"><span class="lbl">' + label + '</span><span class="v">' + inner + '</span></div>';
  }
  var digits = CONTACT.phone.replace(/[^\d+]/g, '');
  var phone = CONTACT.phone
    ? '<a href="tel:' + esc(digits) + '">' + esc(CONTACT.phone) + '</a> <a class="alt" href="sms:' + esc(digits) + '">text</a>'
    : todo('phone number');
  var email = CONTACT.email ? '<a href="mailto:' + esc(CONTACT.email) + '">' + esc(CONTACT.email) + '</a>' : todo('email address');
  var social = CONTACT.social.length
    ? CONTACT.social.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join(' ')
    : todo('social links');

  var fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'chatPanel');
  fab.setAttribute('aria-label', 'Let\u2019s chat with Puppy Connection');
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 '
    + '8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 '
    + '8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span class="fab-label">Let\u2019s Chat</span>';

  var panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.id = 'chatPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Talk to Puppy Connection');
  panel.innerHTML = '<button type="button" class="shut" aria-label="Close">&times;</button>'
    + '<h2>Talk to Puppy Connection</h2>'
    + '<p>We help families find a puppy and help breeders list theirs. For a question about one puppy, '
    + 'its breeder\u2019s details are on the listing.</p>'
    + row('Call or text', phone)
    + row('Email', email)
    + row('Follow', social)
    + row('Families', '<a href="puppies.html">Find a puppy</a>')
    + row('Breeders', '<a href="list-with-us.html">List your puppies</a>');

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  function set(open) {
    panel.classList.toggle('open', open);
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  fab.addEventListener('click', function () { set(!panel.classList.contains('open')); });
  panel.querySelector('.shut').addEventListener('click', function () { set(false); fab.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) { set(false); fab.focus(); }
  });
  // A tap on the page behind the panel closes it.
  document.addEventListener('click', function (e) {
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || fab.contains(e.target)) return;
    set(false);
  });
})();
// Google Analytics 4 (workplan B11, Alex 2026-10-24), the property Puppy Connection in Alex's
// account. It loads only on the live domain, so staging and local copies never count a visit.
(function () {
  var host = location.hostname.replace(/^www\./, '');
  if (host !== 'puppy-connection.com') return;
  var id = 'G-0EKJRGCX9T';
  // Puppy Connection's own browsers (Alex, 2026-11-01). Opening the admin marks a browser with the pc_staff
  // cookie for the whole domain, and ?internal=1 on any page marks a phone that never opens the admin
  // (?internal=0 clears it). A marked browser is sent as traffic_type internal, which the property's
  // Internal Traffic data filter drops from reports.
  var q = /[?&]internal=([01])(?:&|$)/.exec(location.search);
  if (q) document.cookie = 'pc_staff=' + (q[1] === '1' ? '1; Max-Age=34560000' : '; Max-Age=0') + '; Domain=puppy-connection.com; Path=/; Secure; SameSite=Lax';
  var internal = /(?:^|; )pc_staff=1(?:;|$)/.test(document.cookie);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, internal ? { traffic_type: 'internal' } : {});
  // gtag.js is 176 KB, so it loads once the page has finished and the browser is idle (Alex, 2026-11-01,
  // after a PageSpeed run). Calls made before then wait in dataLayer and go when it arrives.
  var load = function () {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
  };
  var later = function () { if (window.requestIdleCallback) window.requestIdleCallback(load, { timeout: 3000 }); else setTimeout(load, 1500); };
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);

  // Clicks to a breeder's website, phone and email from puppy and breeder pages (workplan B11),
  // so the property can show a breeder what a listing produced. The site's own count of these
  // clicks (the beacon in js/pages.js) carries on beside it unchanged.
  // Alex, 2026-11-01: also the Contact the breeder button, a deposit, Facebook, the delivery quote, the
  // mailing list, a listing report and the list-with-us sign-up, each its own event name.
  var page = document.querySelector('main#detail, main#profile');
  function about() {
    if (!page) return { page_type: location.pathname.replace(/^\/|\.html$/g, '') || 'home' };
    var name = document.querySelector(page.id === 'detail' ? '#dBreeder .breeder-name' : '#profile h1');
    return { breeder_name: name ? name.textContent.trim() : '', puppy: page.getAttribute('data-puppy') || '', page_type: page.id === 'detail' ? 'puppy' : 'breeder' };
  }
  function send(name, extra) {
    var p = about();
    for (var k in extra) p[k] = extra[k];
    p.transport_type = 'beacon';
    window.gtag('event', name, p);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (page && a.closest('.contact-list, .profile-actions, .d-actions')) {
      if (href === '#dBreeder') return send('contact_breeder_click', {});
      if (/^tel:/i.test(href)) return send('breeder_phone_click', {});
      if (/^mailto:/i.test(href)) return send('breeder_email_click', {});
      if (/facebook\.com/i.test(href)) return send('breeder_facebook_click', { link_url: href });
      if (/deposit/i.test(a.textContent)) return send('breeder_deposit_click', { link_url: href });
      if (/^https?:/i.test(href)) return send('breeder_website_click', { link_url: href });
    }
    if (/furryfreight/i.test(href)) return send('delivery_quote_click', { link_url: href });
    if (/\/report\?/.test(href)) return send('report_listing_click', {});
    if (/^https:\/\/portal\.puppy-connection\.com\/?(?:[?#]|$)/.test(href)) return send('list_with_us_click', {});
  }, true);
  document.addEventListener('submit', function (e) {
    if (e.target.closest && e.target.closest('.foot-signup')) send('newsletter_signup', {});
  }, true);
})();
