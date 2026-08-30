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
  /* al_t, not al_c: cropping a full-body portrait to 4:3 from the centre
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

  /* ---------- home ---------- */
  if (document.querySelector('#homeFeatured')) {
    var seenBreed = {};
    var featured = L.filter(function (l) {
      if (isPlaced(l) || !img(l) || !l.breed || seenBreed[l.breed]) return false;
      seenBreed[l.breed] = 1;
      return true;
    });
    renderInto('#homeFeatured', featured.slice(0, 8));

    var bl = document.querySelector('#breedList');
    if (bl) {
      bl.innerHTML = BREEDS.slice(0, 12).map(function (b) {
        return '<a class="card" href="breed.html?slug=' + esc(b.slug) + '">' +
          '<div class="card-media">' + (b.photo ? '<img src="' + esc(wix(b.photo, 600, 400)) +
            '" alt="' + esc(b.name) + '" loading="lazy" decoding="async" width="600" height="400">' : '') + '</div>' +
          '<div class="card-body"><div class="card-name">' + esc(b.name) + '</div>' +
          '<div class="card-breed">' + b.demo_count + ' listed</div></div></a>';
      }).join('');
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
    var state = { breed: qs('breed') || '', max: '', avail: true };
    var availBox = document.querySelector('input[name="avail"]');
    if (availBox) availBox.checked = true;

    document.querySelector('#filterBreeds').innerHTML = BREEDS.map(function (b) {
      return '<label><input type="radio" name="breed" value="' + esc(b.name) + '"' +
        (state.breed === b.name ? ' checked' : '') + '><span>' + esc(b.name) + '</span><i>' + b.demo_count + '</i></label>';
    }).join('');

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
      current = L.filter(function (l) {
        if (state.breed && l.breed !== state.breed) return false;
        if (state.max && (l.price || 0) > +state.max) return false;
        if (state.avail && isPlaced(l)) return false;
        return true;
      });
      current.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
      shown = PAGE;
      paint();
      var label = current.length + (current.length === 1 ? ' puppy' : ' puppies');
      document.querySelector('#resultCount').textContent = label + (state.breed ? ' · ' + state.breed : '');
      var done = document.querySelector('#railDone');
      if (done) done.textContent = 'Show ' + label;
      var trig = document.querySelector('#railOpen');
      if (trig) trig.textContent = 'Filters · ' + label;
      var h = document.querySelector('#browseTitle');
      if (h) h.textContent = state.breed || 'All available puppies';
    };

    /* From the grid, the next click is almost always a listing, so warm the
       larger gallery rendition for the first few results. */
    warmNext(current.slice(0, 6).map(function (x) { return wixFit(img(x), 1200, 800); }), 6);

    document.querySelector('#moreRow').addEventListener('click', function (e) {
      if (!e.target.closest('#moreBtn')) return;
      shown += PAGE;
      paint();
    });

    /* On phones the rail is a drawer rather than a block above the results. */
    var rail = document.querySelector('#rail');
    var backdrop = document.querySelector('#railBackdrop');
    var opener = document.querySelector('#railOpen');
    var setDrawer = function (open) {
      rail.classList.toggle('open', open);
      backdrop.hidden = !open;
      document.body.classList.toggle('rail-open', open);
      opener.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = rail.querySelector('input');
        if (first) first.focus({ preventScroll: true });
      } else {
        opener.focus({ preventScroll: true });
      }
    };
    opener.addEventListener('click', function () { setDrawer(true); });
    backdrop.addEventListener('click', function () { setDrawer(false); });
    document.querySelector('#railClose').addEventListener('click', function () { setDrawer(false); });
    document.querySelector('#railDone').addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('open')) setDrawer(false);
    });

    document.querySelector('.rail').addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'breed') state.breed = t.value;
      if (t.name === 'max') state.max = t.value;
      if (t.name === 'avail') state.avail = t.checked;
      apply();
    });
    document.querySelector('#reset').addEventListener('click', function () {
      state = { breed: '', max: '', avail: false };
      document.querySelectorAll('.rail input').forEach(function (i) { i.checked = false; });
      apply();
    });
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

    var body = prof ? prof.body : (BREEDERS[0] ? BREEDERS[0].body : []);
    document.querySelector('#pBody').innerHTML =
      (biz ? '<p class="demo-note">Profile copy below is an example from her existing breeder pages. ' +
        'The live catalog does not yet link listings to profiles.</p>' : '') +
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
    renderInto('#pListings', theirs, 'This profile is not yet linked to listings in the live catalog.');

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
