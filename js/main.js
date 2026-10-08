/* Puppy Connection — concept build.
   Everything reads from window.PC_LISTINGS / PC_BREEDS / PC_BREEDERS in data/data.js
   so the demo runs from the filesystem with no server and no fetch. */

(function () {
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
    var eager = cardIndex++ < 8;
    /* 48 listings have no landscape photo anywhere in their set. Cropping a
       portrait into the 3:2 slot cuts the dog in half whichever edge we anchor
       to, so those sit whole on the card's own ground instead. */
    var tall = (l.lead_aspect || 9) < 1.2;
    var placed = isPlaced(l);
    var label = statusLabel(l);
    var mates = byLitter(l.litter).length;
    return '' +
      '<a class="card' + (placed ? ' is-sold' : '') + '" href="puppy.html?slug=' + esc(l.slug) + '">' +
        '<div class="card-media' + (tall ? ' is-whole' : '') + '"' +
          /* a heavily blurred crop of the same photo fills the tile behind the
             whole image, so the card reads edge to edge without losing the dog.
             60px wide is all a 22px blur needs, so it costs about a kilobyte. */
          (tall ? ' style="--fill:url(' + esc(wix(img(l), 60, 40)) + ')"' : '') + '>' +
          (img(l) ? '<img src="' + esc(tall ? wixFit(img(l), 600, 400) : wix(img(l), 600, 400)) + '" alt="' + esc(l.puppy_name) + ', ' +
            esc(l.breed || 'puppy') + '" ' +
            (eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"') +
            ' width="600" height="400">' : '') +
          (label ? '<span class="tag ' + (placed ? 'tag-sold' : 'tag-pending') + '">' + label + '</span>' : '') +
          (mates > 1 ? '<span class="tag tag-litter">Litter of ' + mates + '</span>' : '') +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-name">' + esc(l.puppy_name) + '</div>' +
          '<div class="card-breed">' + esc(l.breed || '') + '</div>' +
          '<div class="card-foot">' +
            '<span class="price">' + money(l.price) + '</span>' +
            '<span class="card-ready">' + (l.ready_date ? 'Ready ' + esc(l.ready_date.replace(/,? \d{4}$/, '')) : '') + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }
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

  /* ---------- hero breed select ---------- */
  var heroSel = document.querySelector('#heroBreed');
  if (heroSel) {
    heroSel.innerHTML = '<option value="">Search by breed...</option>' +
      BREEDS.map(function (b) {
        return '<option value="' + esc(b.slug) + '">' + esc(b.name) + ' (' + b.demo_count + ')</option>';
      }).join('');
    var goToBreed = function () {
      location.href = heroSel.value
        ? 'breed.html?slug=' + encodeURIComponent(heroSel.value)
        : 'puppies.html';
    };
    /* Picking a breed is the decision, so act on it. The button stays as a
       fallback for re-selecting the same option, which fires no change event. */
    heroSel.addEventListener('change', function () {
      if (heroSel.value) goToBreed();
    });
    document.querySelector('#heroForm').addEventListener('submit', function (e) {
      e.preventDefault();
      goToBreed();
    });
  }

  /* "Show more", on a phone, the way Teapup's home page does it (Alex, 2026-10-07). Below
     760px the home grids run two across, so a grid shows its first `step` cards and a button
     adds `step` more. The button ships hidden and only this shows it, so with the script off
     every card is there, and above the line every card shows. */
  function reveal(gridId, step) {
    var grid = document.getElementById(gridId);
    var btn = document.querySelector('[data-reveal-more="' + gridId + '"]');
    if (!grid || !btn || !window.matchMedia) return;
    var cards = [].slice.call(grid.children);
    var small = window.matchMedia('(max-width: 760px)');
    var shown = step;
    var paint = function () {
      if (!small.matches) { cards.forEach(function (c) { c.hidden = false; }); btn.hidden = true; return; }
      cards.forEach(function (c, i) { c.hidden = i >= shown; });
      btn.hidden = cards.length <= shown;
    };
    btn.addEventListener('click', function () {
      var first = cards[shown];
      shown += step;
      paint();
      if (first) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
    });
    if (small.addEventListener) small.addEventListener('change', paint);
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
    // Twelve on the home page: three rows of four on a computer, and on a phone, where the
    // grid is two across, eight show before "Show more puppies" (Alex, 2026-10-07).
    renderInto('#homeFeatured', featured.slice(0, 12));
    reveal('homeFeatured', 8);

    var bl = document.querySelector('#breedList');
    if (bl) {
      bl.innerHTML = BREEDS.slice(0, 12).map(function (b) {
        return '<a class="card" href="breed.html?slug=' + esc(b.slug) + '">' +
          '<div class="card-media">' + (b.photo ? '<img src="' + esc(wix(b.photo, 600, 400)) +
            '" alt="' + esc(b.name) + '" loading="lazy" decoding="async" width="600" height="400">' : '') + '</div>' +
          '<div class="card-body"><div class="card-name">' + esc(b.name) + '</div>' +
          '<div class="card-breed">' + b.demo_count + ' listed</div></div></a>';
      }).join('');
      reveal('breedList', 8);
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
      brd.innerHTML = realBreeders().slice(0, 4).map(function (b) {
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
        html += '<div class="f-group"><h4>' + title + '</h4><div class="f-chips">' +
          [['', FIELDS[k].any, FIELDS[k].any]].concat(FIELDS[k].opts).map(function (x) {
            return '<button type="button" class="f-chip" data-k="' + k + '" data-v="' + esc(x[0]) + '" aria-pressed="' + (state[k] === x[0]) + '">' + esc(x[2]) + '</button>';
          }).join('') + '</div></div>';
      });
      html += '<div class="f-group"><h4>Name</h4><label class="f-name">' + LENS +
        '<input type="search" data-name autocomplete="off" placeholder="A puppy&#39;s name" value="' + esc(state.name) + '"></label></div>';
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
        if (q && String(l.puppy_name || l.name || '').toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      current.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
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
      cbox.innerHTML = '<p class="eyebrow">Talk to this breeder</p>' +
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
