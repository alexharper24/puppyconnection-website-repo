// The breeder walkthrough: the five steps from sign-in to a paid listing, played on recreated portal
// screens with a made-up kennel (docs/batch-2026-11-01-breeder-walkthrough.md). One source for the
// portal, which opens it in a panel on a person's first visit to an approved kennel and from Help,
// and for the review page in docs/walkthrough/index.html.
//
//   var player = PCWalkthrough.mount(element, { logo, note, autoplay, keyTarget, onEnd });
//   player.destroy();
(function () {
  'use strict';
  window.PCWalkthrough = { mount: mount };

  function mount(root, opts) {
    opts = opts || {};

    // ---------- sample content, made up for the walkthrough ----------
    var LOGO = opts.logo || 'logo-white.webp';
    var KENNEL = 'Maple Brook Doodles';
    var EMAIL = 'casey@example.com';
    var BREED = 'Mini Bernedoodle';
    var FEE = 14.99;
    var CHAPTERS = ['Sign in', 'Moms and dads', 'Start a litter', 'Add the puppies', 'Pay to list'];
    // Health tests the portal lists for a Mini Bernedoodle, from the Bernese and Miniature Poodle lists in lib/healthtests.js.
    var TESTS = ['AKC DNA profile', 'Hips (x-ray evaluation)', 'Elbows (OFA)', 'Eyes (exam by a board-certified ophthalmologist)', 'Heart (cardiac exam)',
      'Degenerative myelopathy (DNA)', 'Patellas (knees)', 'PRA-prcd (DNA)'];
    var MOM_TESTS = [1, 2, 3, 4];
    var GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

    // Drawn photos, so no real puppy appears. A soft backdrop, a blanket and a doodle face.
    function dog(o) {
      var s = o.big ? 1.12 : 1;
      var spots = (o.spots || []).map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="' + p[4] + '"/>'; }).join('');
      var face = o.away ? '<ellipse cx="0" cy="40" rx="20" ry="8" fill="' + o.ear + '" opacity=".5"/>' :
        '<path d="M-10 -86 Q0 -92 10 -86 L14 -10 L-14 -10 Z" fill="' + o.muzzle + '"/>' +
        '<ellipse cx="-27" cy="-38" rx="9" ry="6" fill="' + o.tan + '"/><ellipse cx="27" cy="-38" rx="9" ry="6" fill="' + o.tan + '"/>' +
        '<ellipse cx="0" cy="10" rx="36" ry="27" fill="' + o.muzzle + '"/>' +
        '<circle cx="-26" cy="-22" r="8.5" fill="#15120f"/><circle cx="26" cy="-22" r="8.5" fill="#15120f"/>' +
        '<circle cx="-23" cy="-25" r="2.6" fill="#fff"/><circle cx="29" cy="-25" r="2.6" fill="#fff"/>' +
        '<ellipse cx="0" cy="0" rx="12" ry="8.5" fill="#15120f"/><path d="M0 8 Q0 20 -11 22 M0 8 Q0 20 11 22" stroke="#15120f" stroke-width="3" fill="none" stroke-linecap="round"/>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="' + o.bg + '"/>' +
        '<rect y="225" width="400" height="75" fill="' + (o.floor || '#f3eee4') + '"/>' +
        '<g transform="translate(' + (o.x || 200) + ' 160) scale(' + s + ')">' +
        '<ellipse cx="0" cy="98" rx="92" ry="58" fill="' + o.fur + '"/>' +
        '<ellipse cx="-64" cy="-10" rx="30" ry="56" fill="' + o.ear + '" transform="rotate(16 -64 -10)"/>' +
        '<ellipse cx="64" cy="-10" rx="30" ry="56" fill="' + o.ear + '" transform="rotate(-16 64 -10)"/>' +
        '<circle cx="0" cy="-24" r="66" fill="' + o.fur + '"/>' + spots + face + '</g></svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }
    var TRI = { fur: '#2b2622', ear: '#1b1815', muzzle: '#f4ede2', tan: '#b9773f' };
    var MERLE = { fur: '#9b9da1', ear: '#3a3633', muzzle: '#f6f1e8', tan: '#b9773f',
      spots: [[-30, -62, 16, 11, '#3a3633'], [36, -40, 12, 15, '#55524f'], [-46, 92, 22, 14, '#3a3633'], [40, 110, 18, 12, '#55524f']] };
    function mix(a, b) { var o = {}; [a, b].forEach(function (x) { for (var k in x) o[k] = x[k]; }); return o; }
    var IMG = {
      hazel: dog(mix(TRI, { bg: '#d9e2d4', big: true })),
      bramble: dog(mix(MERLE, { bg: '#e8dcc8', big: true })),
      clover1: dog(mix(MERLE, { bg: '#dfe7e0' })),
      clover2: dog(mix(MERLE, { bg: '#efe3cf', x: 180 })),
      clover3: dog(mix(MERLE, { bg: '#e4e0ec', away: true })),
      juniper: dog(mix(MERLE, { bg: '#efe3cf', fur: '#b3b5b8' })),
      pepper: dog(mix(TRI, { bg: '#e6dccb' }))
    };
    var DOC = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 388"><rect width="300" height="388" fill="#fff"/>' +
      '<rect x="26" y="28" width="130" height="16" fill="#4a5a4b"/><rect x="26" y="56" width="200" height="8" fill="#cfc8b7"/>' +
      [90, 110, 130, 150, 186, 206, 226, 246, 282, 302].map(function (y, i) { return '<rect x="26" y="' + y + '" width="' + (i % 3 ? 248 : 170) + '" height="7" fill="#ddd5c3"/>'; }).join('') +
      '<rect x="196" y="330" width="78" height="26" fill="none" stroke="#bc9b5d" stroke-width="3"/></svg>');

    // ---------- the player state ----------
    var S = { i: 0, playing: false, instant: false, token: 0, mode: 'desk', scale: 1, elapsed: 0, virtual: 0, caps: [], final: false, ended: false };
    var DUR = [];
    var LOGICAL = { desk: [1120, 660], phone: [390, 640] };
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    root.classList.add('wt');
    root.innerHTML = '<ol class="wt-steps" aria-label="Steps"></ol>' +
      '<div class="wt-screen"><div class="wt-vp" aria-hidden="true"><div class="wt-cv"></div></div></div>' +
      '<div class="wt-bar" aria-hidden="true"></div><p class="wt-cap" aria-live="polite"></p>' +
      '<div class="wt-ctrl"><button class="wt-btn" type="button" data-wt="back" aria-label="Back one scene"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2 4 8l7 6z"/></svg>Back</button>' +
      '<button class="wt-btn primary" type="button" data-wt="play">Play</button>' +
      '<button class="wt-btn" type="button" data-wt="next" aria-label="Next scene">Next<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 2 7 6-7 6z"/></svg></button>' +
      '<span class="wt-time"></span></div>' + (opts.note ? '<p class="wt-note">' + opts.note + '</p>' : '') + '<div class="wt-off" hidden></div>';
    function q(sel) { return root.querySelector(sel); }
    var vp = q('.wt-vp'), cvWrap = q('.wt-cv'), capEl = q('.wt-cap');
    var C, cur, waiters = [];

    function Stop() {}
    function chk(t) { if (t !== S.token) throw new Stop(); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function gate() { return S.playing || S.instant ? null : new Promise(function (r) { waiters.push(r); }); }
    function release() { var w = waiters; waiters = []; w.forEach(function (r) { r(); }); }
    async function wait(ms) {
      var t = S.token; S.virtual += ms;
      if (S.instant) return;
      var left = ms;
      while (left > 0) {
        chk(t);
        var g = gate(); if (g) { await g; chk(t); }
        var t0 = performance.now();
        await sleep(Math.min(left, 40));
        chk(t);
        var d = performance.now() - t0; left -= d; S.elapsed += d;
      }
    }

    function $(sel, root) { return (root || C).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || C).querySelectorAll(sel)); }
    function rel(el) {
      var r = el.getBoundingClientRect(), c = C.getBoundingClientRect();
      return { x: (r.left - c.left) / S.scale, y: (r.top - c.top) / S.scale, w: r.width / S.scale, h: r.height / S.scale };
    }
    async function reveal(el) {
      var box = el.closest('.drawer-body, .work');
      if (!box) return;
      var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      var top = (r.top - b.top) / S.scale, bottom = top + r.height / S.scale, h = box.clientHeight;
      if (top >= 8 && bottom <= h - 8) return;
      var target = Math.max(0, Math.round(box.scrollTop + top - h * 0.3));
      if (S.instant) { box.scrollTop = target; return; }
      box.scrollTo({ top: target, behavior: 'smooth' });
      await wait(480);
      box.scrollTop = target;
    }
    async function move(el) {
      await reveal(el);
      if (!S.instant) {
        var r = rel(el);
        var x = r.x + Math.min(r.w / 2, 60), y = r.y + r.h * 0.6;
        cur.hidden = false; cur.style.transition = '';
        cur.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      }
      await wait(650);
    }
    async function click(el) {
      await move(el);
      if (!S.instant) {
        var r = rel(el), tap = document.createElement('span');
        tap.className = 'wt-tap'; tap.style.left = (r.x + Math.min(r.w / 2, 60)) + 'px'; tap.style.top = (r.y + r.h * 0.6) + 'px';
        C.appendChild(tap); setTimeout(function () { tap.remove(); }, 500);
      }
      el.classList.add('is-press'); await wait(150); el.classList.remove('is-press'); await wait(150);
    }
    var focused = null;
    function focus(el) { if (focused) focused.classList.remove('is-focus'); focused = el; if (el) el.classList.add('is-focus'); }
    async function type(el, text, clear) {
      focus(el);
      if (clear) el.value = '';
      for (var k = 0; k < text.length; k++) { el.value += text[k]; await wait(55); }
      await wait(250);
    }
    async function fillField(el, text) { await click(el); await type(el, text, true); }
    async function pick(sel, value) { await click(sel); focus(sel); sel.value = value; await wait(500); }
    function cap(text) { S.caps.push(text); renderCap(); }
    function renderCap() {
      var list = S.final ? S.caps : S.caps.slice(-1);
      capEl.className = 'wt-cap' + (S.final && list.length > 1 ? ' all' : '');
      capEl.innerHTML = list.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    }
    function ring(el, on) { el.classList.toggle('wt-ring', on); }
    function toast(text) {
      var old = $('.toast'); if (old) old.remove();
      C.insertAdjacentHTML('beforeend', '<div class="toast wt-fade" role="status">' + text + '</div>');
    }
    function fade(el) { if (el) { el.classList.remove('wt-fade'); void el.offsetWidth; el.classList.add('wt-fade'); } }

    // ---------- portal screens ----------
    var NAV = [['Your listings'], ['overview', 'Overview'], ['litters', 'Litters and puppies'], ['parents', 'Moms and dads'], ['pay', 'Pay to list'], ['stats', 'Views and clicks'],
      ['Account'], ['profile', 'Profile'], ['payments', 'Payments'], ['account', 'Account'], ['help', 'Help']];
    function navLabel(page) { for (var k = 0; k < NAV.length; k++) if (NAV[k][0] === page) return NAV[k][1]; return ''; }
    function addCursor() {
      cur = document.createElement('div'); cur.className = 'wt-cursor'; cur.hidden = true;
      cur.innerHTML = '<svg class="arrow" viewBox="0 0 24 24"><path d="M3 2v17l4.6-4.3 3 6.8 3.1-1.4-3-6.6H17z" fill="#fff" stroke="#1d1b18" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
        '<svg class="touch" viewBox="0 0 34 34"><circle cx="17" cy="17" r="13" fill="rgba(38,38,38,.28)" stroke="#fff" stroke-width="2.5"/></svg>';
      C.appendChild(cur);
    }
    function shell(page, content) {
      C.innerHTML = '<div class="app"><aside class="rail"><div class="rail-head"><a><img src="' + LOGO + '" alt="Puppy Connection"></a><span class="role">Breeder portal</span>' +
        '<button class="menu-btn" type="button" data-menu>Menu<span>' + navLabel(page) + '</span></button></div><nav class="nav">' +
        NAV.map(function (n) { return n.length === 1 ? '<div class="nav-group">' + n[0] + '</div>' : '<a data-nav="' + n[0] + '"' + (n[0] === page ? ' class="is-on"' : '') + '>' + n[1] + '</a>'; }).join('') +
        '</nav><div class="rail-foot"><span class="dot"></span><div><b>Approved</b><span>You can list and pay</span></div></div></aside>' +
        '<div class="main"><header class="topbar"><div class="who"><span class="name">' + KENNEL + '</span><span class="pill pill-ok">Approved</span>' +
        '<a class="btn btn-sm">View on the site</a><a class="btn btn-sm btn-quiet">Visit site</a><button class="btn btn-sm" type="button">Sign out</button></div></header>' +
        '<div class="work"><div class="view">' + content + footer() + '</div></div></div></div>';
      addCursor();
    }
    function footer() { return '<footer class="work-foot"><a>Privacy</a><a>Listing terms</a></footer>'; }
    function setView(page, content) {
      $$('.nav a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-nav') === page); });
      $('.menu-btn span').textContent = navLabel(page);
      $('.view').innerHTML = content + footer();
      $('.work').scrollTop = 0;
      fade($('.view'));
    }
    async function navTo(page, content) {
      if (S.mode === 'phone') { await click($('[data-menu]')); $('.rail').classList.add('open'); await wait(400); }
      await click($('[data-nav="' + page + '"]'));
      $('.rail').classList.remove('open');
      setView(page, content);
      await wait(600);
    }
    function openDrawer(title, body, wide, still) {
      C.insertAdjacentHTML('beforeend', '<div class="scrim"></div><aside class="drawer' + (wide ? ' wide' : '') + (still ? '' : ' wt-slide') + '" aria-label="' + title + '">' +
        '<div class="drawer-head"><h2>' + title + '</h2><button class="btn btn-quiet" type="button" data-close>Close</button></div><div class="drawer-body">' + body + '</div></aside>');
      C.appendChild(cur);
    }
    function closeDrawer() { $$('.scrim, .drawer').forEach(function (e) { e.remove(); }); focus(null); }
    function field(label, input, hint, attrs) {
      return '<div class="field"' + (attrs || '') + '><label>' + label + '</label>' + input + (hint ? '<div class="hint">' + hint + '</div>' : '') + '</div>';
    }
    function text(key, value, extra) { return '<input type="text" data-k="' + key + '" value="' + (value || '') + '"' + (extra || '') + '>'; }
    function select(key, options, value) {
      return '<select data-k="' + key + '">' + options.map(function (o) { return '<option' + (o === value ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
    }
    function markFilled(host) {
      host.classList.add('prefilled');
      var lab = host.querySelector('label, legend');
      if (lab && !lab.querySelector('.prefill-note')) lab.insertAdjacentHTML('beforeend', '<span class="prefill-note">From your document, please check</span>');
    }
    function prefillBox(word) {
      return '<div class="prefill"><p class="prefill-title">Fill from a document</p><p class="hint">Upload a health record, pedigree or registration paper, as a PDF or a photo of the page, ' +
        'and the empty fields below are filled from it. Check each one before you save. When you save, the document is kept with this ' + word + ' as a private document.</p>' +
        '<div class="prefill-row"><button class="btn btn-sm" type="button" data-pf>Choose a document</button><label class="check"><input type="checkbox"><span>Replace what is already filled in</span></label></div>' +
        '<p class="prefill-status" data-pf-status hidden></p></div>';
    }
    async function readDocument(file, seconds) {
      var b = $('[data-pf]'), st = $('[data-pf-status]');
      await click(b);
      b.textContent = 'Reading the document…'; b.disabled = true;
      st.hidden = false; st.textContent = 'Reading ' + file + '. A photo of a page can take up to half a minute.';
      await wait(seconds);
      b.textContent = 'Choose a document'; b.disabled = false;
    }
    function docsSection(word, docs) {
      return '<section class="docs"><h3>Documents</h3><p class="hint">Health records, health guarantees and pedigrees, as a PDF or a photo of the page, up to 10 MB each. ' +
        'Choose for each one whether families can see it on ' + word + ', or keep it for Puppy Connection staff only.</p>' +
        (docs || '<p class="muted small" data-nodocs>No documents yet.</p>') +
        '<div class="grid-2">' + field('What it is', select('kind', ['Health record', 'Health guarantee', 'Pedigree', 'Other document'], 'Health record')) +
        field('Name', text('dtitle'), 'Optional. The file name is used otherwise.') + '</div>' +
        '<fieldset class="doc-vis"><legend>Who can see it</legend><label class="check"><input type="radio" name="vis-' + word.length + '"><span>Families, on the site</span></label>' +
        '<label class="check"><input type="radio" name="vis-' + word.length + '" checked><span>Puppy Connection staff only</span></label></fieldset>' +
        '<button class="btn btn-sm" type="button" data-docup>Choose a file and upload</button></section>';
    }
    function docItem(file, upright) {
      return '<ul class="doc-list"><li class="doc"><span class="doc-preview"><img src="' + DOC + '" alt="" style="transform:' + (upright ? 'none' : 'rotate(90deg) scale(.78)') + '"></span>' +
        '<div class="doc-body"><div class="doc-main"><b>Health record</b><span class="muted small">' + file + '</span></div><span class="small muted">Puppy Connection staff only</span>' +
        '<div class="btn-row doc-actions"><button class="btn btn-sm btn-quiet" type="button" data-rotl>Rotate left</button><button class="btn btn-sm btn-quiet" type="button">Rotate right</button>' +
        '<button class="btn btn-sm btn-quiet" type="button">Show to families</button></div></div></li></ul>';
    }

    // Overview
    function overview() {
      function stat(n, l) { return '<div class="stat"><b>' + n + '</b><span>' + l + '</span></div>'; }
      return '<div class="page-head"><div><h1>Welcome, ' + KENNEL + '</h1><p class="lede">Your listings at a glance.</p></div></div>' +
        firstSteps() + '<div class="stats">' + stat(0, 'Live on the site') + stat(0, 'Drafts') + stat(0, 'Ready to pay for') + stat(0, 'Placed') + '</div>';
    }
    // The Your first listing card the Overview shows until a breeder has a puppy on the site (portal.js firstSteps).
    function firstSteps() {
      var steps = [
        ['Add the mom and the dad', 'Save each parent once under Moms and dads, with a photo and their health testing. You pick them on the litter next, so they come first.', 'Moms and dads'],
        ['Start a litter', 'Choose the breed, the birth date and the date the puppies can go home, and pick the mom and dad you saved.'],
        ['Add the puppies', 'Add each puppy to the litter with its price and at least 1 photo.'],
        ['Pay to list', 'Pay $14.99 per puppy to list it once, and it stays up for as long as you add a new photo at least every four weeks. Finish the litter first and pay for all its puppies together.']
      ];
      return '<div class="card"><h2>Your first listing</h2><ol class="steps">' + steps.map(function (s, i) {
        return '<li class="' + (i === 0 ? 'now' : '') + '"><span class="dot">' + (i + 1) + '</span><div><b>' + s[0] + '</b><div class="muted small">' + s[1] + '</div>' +
          (s[2] ? '<a class="btn btn-sm" data-first style="margin-top:.4rem">' + s[2] + '</a>' : '') + '</div></li>';
      }).join('') + '</ol></div>';
    }

    // Moms and dads
    var HAZEL = { name: 'Hazel', role: 'Mom', img: IMG.hazel }, BRAMBLE = { name: 'Bramble', role: 'Dad', img: IMG.bramble };
    function parentsPage(list) {
      var body = list.length ? '<div class="panel" style="padding:.2rem 1rem">' + list.map(function (p) {
        return '<div class="puppy-row wt-fade"><img class="thumb" src="' + p.img + '" alt=""><div class="meta"><b>' + p.name + '</b><span class="muted small">' + p.role + ', ' + BREED + '. 4 health tests</span></div>' +
          '<button class="btn btn-sm" type="button">Edit</button></div>';
      }).join('') + '</div>' :
        '<div class="panel"><div class="empty"><b>No moms or dads yet</b>Add each mom and dad once, then choose them when you add or edit a litter.</div></div>';
      return '<div class="page-head"><div><h1>Moms and dads</h1><p class="lede">Save each mom and dad once, with their health testing, then pick them on each litter. Families see both parents on every puppy page.</p></div>' +
        '<div class="head-actions"><button class="btn btn-primary" type="button" data-add="mom">Add a mom</button><button class="btn btn-primary" type="button" data-add="dad">Add a dad</button></div></div>' + body;
    }
    function testPicks(ticked) {
      return '<fieldset class="breed-picks" data-tests><legend>Health testing done</legend>' + (ticked ? TESTS.map(function (t, k) {
        var on = ticked.indexOf(k) >= 0;
        return '<label class="check' + (on ? ' prefilled-check' : '') + '"><input type="checkbox"' + (on ? ' checked' : '') + '><span>' + t + '</span></label>';
      }).join('') : '<p class="hint" style="grid-column:1/-1;margin:0 0 .3rem">Choose the breed to see its health tests.</p>') + '</fieldset>';
    }
    function parentBody(o) {
      var word = o.dad ? 'dad' : 'mom';
      return '<div class="d-cols"><div class="d-main"><form>' + prefillBox(word) +
        field('Name', text('name', o.name), 'The ' + word + '\'s call name or registered name.') +
        field('Breed', '<div class="combo">' + text('breed', o.breed, ' placeholder="Choose a breed"') + '</div>') +
        '<div class="grid-2">' + field('Registration', select('reg', ['Not registered or not set', 'AKC', 'AKC Canine Partners', 'APRI', 'ACA', 'CKC', 'UKC'], 'Not registered or not set')) +
        field('Registration number', text('regno')) + '</div>' + testPicks(o.tests) +
        field('Other health testing', '<textarea data-k="other"></textarea>', 'Any test not on the list, and results if you want families to see them.') +
        field('Pedigree', '<textarea data-k="ped"></textarea>', 'The ' + word + '\'s parents and lines, as you would tell a family. You can also upload it under Documents.') +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-save>' + (o.saved ? 'Save ' : 'Add ') + word + '</button></div></form></div>' +
        '<div class="d-side"><p class="hint">Choosing a photo or document saves what you have entered first.</p><section data-photo><h3>Photo</h3>' + parentPhoto(o.photo) + '</section>' +
        docsSection('the puppy pages of this ' + word + '\'s litters', o.doc ? docItem(o.doc, true) : '') + '</div></div>';
    }
    function parentPhoto(img) {
      var hint = '<div class="hint">JPEG, PNG or WebP, at least 1,000 pixels across. The photo is checked that the dog can be seen clearly, as puppy photos are.</div>';
      return img ? '<div class="parent-photo wt-fade"><img src="' + img + '" alt=""></div><div class="btn-row"><button class="btn btn-sm" type="button">Replace photo</button><button class="btn btn-sm btn-quiet" type="button">Remove photo</button></div>' + hint :
        '<p class="muted small">No photo yet. Families like to see the parents.</p><div class="upload"><button class="btn btn-sm" type="button" data-addphoto>Add a photo</button></div>' + hint;
    }

    // Litters and puppies
    var LITTER = { meta: 'Born Oct 11, 2026, ready Dec 6, 2026. Parents 30 lb mom, 24 lb dad. Mom Hazel, Dad Bramble' };
    function pup(name, sex, o) { return mix({ name: name, sex: sex, color: '', photos: 0, img: null, state: 'draft' }, o || {}); }
    var SIX = [pup('Girl 1', 'female'), pup('Girl 2', 'female'), pup('Girl 3', 'female'), pup('Boy 1', 'male'), pup('Boy 2', 'male'), pup('Boy 3', 'male')];
    var READY = [pup('Clover', 'female', { color: 'Merle', photos: 3, img: IMG.clover1, state: 'ready' }), pup('Juniper', 'female', { color: 'Merle', photos: 4, img: IMG.juniper, state: 'ready' }),
      pup('Girl 3', 'female'), pup('Pepper', 'male', { color: 'Tricolor', photos: 3, img: IMG.pepper, state: 'ready' }), pup('Boy 2', 'male'), pup('Boy 3', 'male')];
    var LISTED = READY.map(function (p) { return p.state === 'ready' ? mix(p, { state: 'listed' }) : p; });
    function puppyCard(p, k) {
      var img = p.img ? '<img class="thumb" src="' + p.img + '" alt="">' : '<div class="thumb-empty">No photo</div>';
      var meta = '$2,200, ' + p.sex + (p.color ? ', ' + p.color : '') + '. ' + p.photos + (p.photos === 1 ? ' photo' : ' photos') + (p.state === 'listed' ? '. 0 views, 0 clicks in 30 days' : '');
      var chip = p.state === 'listed' ? '<span class="pill pill-ok" data-listed>Listed</span>' : p.state === 'ready' ? '<span class="pill pill-gold">Draft, ready to pay for</span>' : '<span class="pill">Draft</span>';
      var standing = p.state === 'listed' ? '' : p.state === 'ready' ? '<div class="standing standing-gold">Ready to list for $14.99. <a>Pay to list</a></div>' : '<div class="standing">Before it can be paid for, it needs a photo.</div>';
      return '<div class="puppy-card"><div class="pc-top">' + img + '<div class="meta"><b>' + p.name + '</b><span class="muted small">' + meta + '</span><div class="chips">' + chip + '</div></div>' +
        '<button class="btn btn-sm" type="button" data-edit="' + k + '">Edit</button></div>' + standing + '<div class="row-actions"><button class="btn btn-sm btn-quiet" type="button">Duplicate</button></div></div>';
    }
    function littersPage(litter, pups) {
      var head = '<div class="page-head"><div><h1>Litters and puppies</h1><p class="lede">Each litter holds its puppies. Add photos to a puppy, then pay to list it.</p></div>' +
        '<div class="head-actions"><button class="btn btn-primary" type="button" data-addlitter>Add a litter</button></div></div>';
      if (!litter) return head + '<div class="card"><div class="empty"><b>No litters yet</b>Add a litter and pick its mom and dad, then add each puppy to it.<br><button class="btn btn-primary" type="button">Add a litter</button></div></div>';
      return head + '<section class="card" data-litter><div class="card-head"><div><h2>' + BREED + '</h2><div class="muted small">' + litter.meta + '</div></div>' +
        '<div class="btn-row" style="margin:0"><button class="btn btn-sm" type="button">Edit litter</button><button class="btn btn-sm" type="button" data-many>Add several</button>' +
        '<button class="btn btn-sm btn-primary" type="button">Add a puppy</button></div></div>' +
        (pups.length ? '<div class="puppy-grid">' + pups.map(puppyCard).join('') + '</div>' : '') + '</section>';
    }
    function litterBody() {
      return '<form>' + field('Breed', '<div class="combo">' + text('breed', '', ' placeholder="Choose a breed"') + '<ul class="combo-list" hidden><li>Mini Bernedoodle</li><li>Munchkin Bernedoodle</li></ul></div>') +
        '<div class="grid-2">' + field('Born', text('born', '', ' placeholder="mm/dd/yyyy"')) + field('Ready to go home', text('ready', '', ' placeholder="mm/dd/yyyy"')) + '</div>' +
        '<div class="grid-2">' + field('Mom\'s weight (lb)', text('momw')) + field('Dad\'s weight (lb)', text('dadw')) + '</div>' +
        '<div class="grid-2">' + field('Mom', select('mom', ['Not chosen', 'Hazel'], 'Not chosen')) + field('Dad', select('dad', ['Not chosen', 'Bramble'], 'Not chosen')) + '</div>' +
        '<p class="small" style="margin-top:-.4rem"><a>Moms and dads</a></p>' +
        field('About this litter', '<textarea data-k="about"></textarea>') +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-save>Add litter</button></div></form>';
    }
    function manyBody() {
      function n(key, label) { return field(label, text(key, '', ' inputmode="numeric"')); }
      return '<p class="muted small">' + BREED + ' litter. Puppies are named Girl 1, Boy 1 or Puppy 1 and so on, and you can rename each one and add its photos afterwards.</p>' +
        '<form><div class="grid-3">' + n('girls', 'Girls') + n('boys', 'Boys') + n('unknown', 'Not sure yet') + '</div>' +
        '<div class="grid-2">' + field('Price for each ($)', text('price')) + field('Deposit for each ($)', text('deposit')) + '</div>' +
        field('Color', text('color'), 'Optional. Leave it blank if the colors differ.') +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-save>Add puppies</button></div></form>';
    }
    var COMES = ['Veterinary exam', 'Health certificate', 'Health guarantee', 'Current vaccinations', 'Dewormed', 'Microchipped'];
    function puppyBody(o) {
      return '<div class="d-cols"><div class="d-main"><form>' + prefillBox('puppy') +
        field('Name', text('name', o.name)) +
        '<div class="grid-2">' + field('Sex', select('sex', ['Not set', 'Female', 'Male'], 'Female')) + field('Color', text('color', o.color), 'Optional.') + '</div>' +
        '<div class="grid-2">' + field('Price ($)', text('price', '2200')) + field('Deposit ($)', text('deposit', '300')) + '</div>' +
        field('Status', select('status', ['Available', 'Pending', 'Placed'], 'Available'), 'Placed puppies stay visible in their litter, marked placed.') +
        field('Description', '<textarea data-k="desc"></textarea>') +
        '<fieldset class="includes-field"><legend>Comes with</legend><p class="includes-title">Health</p><div class="includes-group">' +
        COMES.map(function (c) { var on = (o.comes || []).indexOf(c) >= 0; return '<label class="check"><input type="checkbox" data-c="' + c + '"' + (on ? ' checked' : '') + '><span>' + c + '</span></label>'; }).join('') +
        '</div></fieldset>' +
        '<div class="btn-row"><button class="btn btn-primary" type="button" data-save>Save puppy</button><button class="btn btn-danger" type="button">Remove puppy</button></div></form></div>' +
        '<div class="d-side"><section data-photostep><h3>Photos</h3><p class="photo-standard"><b>Photo standard.</b> Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. ' +
        'A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.</p>' +
        '<p class="hint">A new photo at least every four weeks keeps the listing on the site. New photos go first, and the first photo is the cover.</p>' +
        '<div class="upload"><button class="btn btn-sm" type="button" data-addphotos>Add photos</button><div class="hint">JPEG, PNG or WebP, at least 1,000 pixels across and up to 15 MB each. Each photo is checked that the puppy can be seen clearly.</div></div>' +
        '<div class="photos" data-photos></div></section>' +
        docsSection('the puppy page', o.doc ? docItem(o.doc, true) : '') + '</div></div>';
    }
    function photoTile(img, flag) {
      return '<div class="photo wt-fade">' + flag + '<img src="' + img + '" alt=""><label class="photo-pick"><input type="checkbox"></label>' +
        '<div class="tools"><button type="button">←</button><button type="button">Remove</button><button type="button">→</button></div></div>';
    }
    function payPage() {
      var ready = READY.filter(function (p) { return p.state === 'ready'; }), rest = READY.filter(function (p) { return p.state !== 'ready'; });
      return '<div class="page-head"><div><h1>Pay to list</h1><p class="lede">Each puppy costs $14.99 to list once, and it stays up for as long as you add a new photo at least every four weeks. Pay for a whole litter at once.</p></div></div>' +
        '<form class="card"><h2>Ready to list</h2><label class="check" style="margin-bottom:.4rem"><input type="checkbox" data-all> Select all</label>' +
        ready.map(function (p) {
          return '<label class="pay-row check"><input type="checkbox" data-p><img class="thumb" src="' + p.img + '" alt=""><span><b>' + p.name + '</b> <span class="muted">' + BREED + '</span><br><span class="why">Draft</span></span></label>';
        }).join('') +
        '<div class="total"><span>Total</span><b data-total>$0</b></div><div class="btn-row"><button class="btn btn-gold" type="button" data-pay disabled>Continue to payment</button></div></form>' +
        '<div class="card"><h2>Not ready yet</h2>' + rest.map(function (p) {
          return '<div class="pay-row"><span><b>' + p.name + '</b> <span class="muted">' + BREED + '</span><br><span class="why">Before it can be paid for, it needs a photo.</span></span></div>';
        }).join('') + '</div>';
    }

    // ---------- scenes ----------
    var SCENES = [
      { ch: 0,
        setup: function () {
          C.classList.add('plain');
          C.innerHTML = '<a class="plain-site">Visit site</a><div class="plain-card"><div class="plain-mark"><img src="' + LOGO + '" alt="Puppy Connection"></div>' +
            '<h1>Breeder portal</h1><p>List your litters and puppies on Puppy Connection.</p>' +
            '<button class="btn btn-google" type="button" data-google>' + GOOGLE_G + 'Continue with Google</button><p class="or">or use your email and password</p>' +
            '<form>' + field('Email', text('email')) + field('Password', '<div class="pw-wrap"><input type="password" data-k="pw"><button type="button" class="pw-show">Show</button></div>') +
            '<button class="btn btn-primary" type="button" data-signin>Sign in</button></form>' +
            '<p class="small" style="margin:.9rem 0 .5rem"><a>Forgot password?</a></p><p class="small" style="margin:0">New to Puppy Connection? <a>Create an account</a></p></div>' +
            '<nav class="plain-foot"><a>Privacy</a><a>Listing terms</a></nav>';
          addCursor();
        },
        run: async function () {
          cap('Sign in with Google if Puppy Connection has added your Google address to your kennel.');
          await wait(600);
          var g = $('[data-google]');
          await move(g); ring(g, true); await wait(2600); ring(g, false);
          cap('Or sign in with your email and password.');
          await fillField($('[data-k="email"]'), EMAIL);
          await fillField($('[data-k="pw"]'), 'samplepassword');
          focus(null);
          await click($('[data-signin]'));
          await wait(500);
        } },

      { ch: 1,
        setup: function () { shell('overview', overview()); },
        run: async function () {
          cap('Start with the parents, under Moms and dads.');
          await wait(1400);
          await click($('[data-first]'));
          setView('parents', parentsPage([]));
          await wait(600);
          cap('Save each mom and dad once, with their photo and health testing.');
          await wait(1200);
          await click($('[data-add="mom"]'));
          openDrawer('Add a mom', parentBody({}), true);
          await wait(900);
          cap('Upload a health record or pedigree and the form fills itself in.');
          await readDocument('hazel-health-record.pdf', 2000);
          var name = $('[data-k="name"]'), breed = $('[data-k="breed"]');
          name.value = 'Hazel'; markFilled(name.closest('.field'));
          breed.value = BREED; markFilled(breed.closest('.field'));
          var tests = $('[data-tests]'); tests.outerHTML = testPicks(MOM_TESTS); markFilled($('[data-tests]'));
          $('[data-pf-status]').textContent = 'Filled 3 fields from hazel-health-record.pdf. Each one is marked below, so please check it before you save.';
          await wait(1800);
          cap('Each filled field is marked, so check it before you save.');
          await reveal($('[data-tests]'));
          await wait(2400);
        } },

      { ch: 1,
        setup: function () {
          shell('parents', parentsPage([]));
          openDrawer('Add a mom', parentBody({ name: 'Hazel', breed: BREED, tests: MOM_TESTS }), true, true);
        },
        run: async function () {
          cap('Add her photo. It is checked the same way as the puppy photos.');
          await wait(500);
          var addPhoto = $('[data-addphoto]');
          await click(addPhoto);
          addPhoto.textContent = 'Checking photo…'; addPhoto.disabled = true;
          await wait(1300);
          $('[data-photo]').innerHTML = '<h3>Photo</h3>' + parentPhoto(IMG.hazel);
          toast('Photo added');
          await wait(1600);
          var t = $('.toast'); if (t) t.remove();
          cap('Save her, then add the dad the same way.');
          var save = $('[data-save]');
          await click(save);
          save.textContent = 'Save mom'; $('.drawer-head h2').textContent = 'Hazel';
          $$('.prefilled').forEach(function (e) { e.classList.remove('prefilled'); });
          $$('.prefill-note').forEach(function (e) { e.remove(); });
          await wait(900);
          await click($('[data-close]')); closeDrawer();
          setView('parents', parentsPage([HAZEL]));
          await wait(900);
          await click($('[data-add="dad"]'));
          openDrawer('Add a dad', parentBody({ dad: true, name: 'Bramble', breed: BREED, tests: MOM_TESTS, photo: IMG.bramble }), true);
          await wait(1400);
          await click($('[data-save]'));
          $('.drawer-head h2').textContent = 'Bramble'; $('[data-save]').textContent = 'Save dad';
          await wait(700);
          await click($('[data-close]')); closeDrawer();
          setView('parents', parentsPage([HAZEL, BRAMBLE]));
          cap('Both parents are now ready to pick on every litter.');
          await wait(2400);
        } },

      { ch: 2,
        setup: function () { shell('parents', parentsPage([HAZEL, BRAMBLE])); },
        run: async function () {
          cap('Next, start a litter with its breed and birth date.');
          await wait(900);
          await navTo('litters', littersPage(null, []));
          await click($('[data-addlitter]'));
          openDrawer('Add a litter', litterBody(), false);
          await wait(700);
          var breed = $('[data-k="breed"]');
          await click(breed); await type(breed, 'Mini Ber');
          var list = $('.combo-list'); list.hidden = false;
          await wait(500);
          var opt = list.querySelector('li'); opt.classList.add('on');
          await click(opt);
          breed.value = BREED; list.hidden = true;
          await fillField($('[data-k="born"]'), '10/11/2026');
          await fillField($('[data-k="ready"]'), '12/06/2026');
          await fillField($('[data-k="momw"]'), '30');
          await fillField($('[data-k="dadw"]'), '24');
          cap('Pick the mom and dad you saved.');
          await pick($('[data-k="mom"]'), 'Hazel');
          await pick($('[data-k="dad"]'), 'Bramble');
          await fillField($('[data-k="about"]'), 'Raised in our home with children.');
          focus(null);
          await click($('[data-save]'));
          closeDrawer();
          setView('litters', littersPage(LITTER, []));
          cap('The litter is ready for its puppies.');
          await wait(2200);
        } },

      { ch: 3,
        setup: function () { shell('litters', littersPage(LITTER, [])); },
        run: async function () {
          cap('Add the whole litter at once with Add several.');
          await wait(900);
          await click($('[data-many]'));
          openDrawer('Add several puppies', manyBody(), false);
          await wait(700);
          await fillField($('[data-k="girls"]'), '3');
          await fillField($('[data-k="boys"]'), '3');
          await fillField($('[data-k="price"]'), '2200');
          await fillField($('[data-k="deposit"]'), '300');
          focus(null);
          await click($('[data-save]'));
          closeDrawer();
          setView('litters', littersPage(LITTER, SIX));
          toast('6 puppies added. Add photos to each one next.');
          cap('Each puppy gets a card, ready for its name and photos.');
          await wait(2800);
        } },

      { ch: 3,
        setup: function () { shell('litters', littersPage(LITTER, SIX)); },
        run: async function () {
          cap('Open a puppy to name it and add its details.');
          await wait(800);
          await click($('[data-edit="0"]'));
          openDrawer('Girl 1', puppyBody({ name: 'Girl 1' }), true);
          await wait(800);
          await fillField($('[data-k="name"]'), 'Clover');
          focus(null);
          cap('Fill from a document works here too, from a vet record or a registration paper.');
          await readDocument('clover-vet-record.jpg', 1800);
          var color = $('[data-k="color"]'); color.value = 'Merle'; markFilled(color.closest('.field'));
          ['Current vaccinations', 'Dewormed', 'Microchipped'].forEach(function (c) {
            var box = $('[data-c="' + c + '"]'); box.checked = true; box.closest('label').classList.add('prefilled-check');
          });
          markFilled($('.includes-field'));
          $('[data-pf-status]').textContent = 'Filled 4 fields from clover-vet-record.jpg. Each one is marked below, so please check it before you save.';
          await wait(1200);
          await reveal($('.includes-field'));
          await wait(1600);
          cap('Turn a sideways scan upright with Rotate left or Rotate right.');
          var up = $('[data-docup]');
          await click(up);
          var none = $('[data-nodocs]'); none.outerHTML = docItem('clover-health-record.jpg', false);
          fade($('.doc'));
          await wait(1000);
          var rot = $('[data-rotl]');
          await click(rot);
          $('.doc-preview img').style.transform = 'none';
          await wait(1800);
        } },

      { ch: 3,
        setup: function () {
          shell('litters', littersPage(LITTER, SIX));
          openDrawer('Girl 1', puppyBody({ name: 'Clover', color: 'Merle', comes: ['Current vaccinations', 'Dewormed', 'Microchipped'], doc: 'clover-health-record.jpg' }), true, true);
        },
        run: async function () {
          cap('Add up to 15 clear photos, several at a time.');
          await wait(600);
          var add = $('[data-addphotos]'), box = $('[data-photos]');
          await click(add);
          cap('Each photo is checked so families can see the puppy clearly.');
          var shots = [IMG.clover1, IMG.clover2, IMG.clover3];
          for (var k = 0; k < 3; k++) {
            add.textContent = 'Checking photo ' + (k + 1) + ' of 3…'; add.disabled = true;
            box.insertAdjacentHTML('beforeend', photoTile(shots[k], k === 0 ? '<span class="pill pill-gold cover">Cover</span>' : k === 2 ? '<span class="pill pill-warn cover">Checking</span>' : ''));
            await wait(1100);
          }
          add.textContent = 'Add photos'; add.disabled = false;
          var flag = $$('.photo .cover')[1];
          flag.className = 'pill pill-alert cover'; flag.textContent = 'Sent back';
          box.insertAdjacentHTML('afterend', '<p class="small standing-alert wt-fade" data-sentnote>A photo marked Sent back needs replacing. The puppy is turned away from the camera. It is not shown on the site.</p>');
          cap('A photo that is sent back does not count, so replace it with a clearer one.');
          await reveal($('[data-sentnote]'));
          await wait(2600);
          cap('The first photo is the cover. Save, and the puppy is ready to list.');
          var cover = $('.photo .cover');
          await move(cover); ring(cover, true); await wait(1600); ring(cover, false);
          var save = $('[data-save]');
          await click(save);
          $('.drawer-head h2').textContent = 'Clover';
          save.closest('form').insertAdjacentHTML('afterend', '<div class="pay-next wt-fade"><p><b>Clover is ready to list.</b> Pay now, or add the rest of the litter first and pay for them together.</p>' +
            '<a class="btn btn-gold">Pay to list Clover, $14.99</a></div>');
          await reveal($('.pay-next'));
          await wait(2400);
        } },

      { ch: 4,
        setup: function () { shell('litters', littersPage(LITTER, READY)); },
        run: async function () {
          cap('Finish each puppy the same way, then open Pay to list.');
          await wait(2000);
          await navTo('pay', payPage());
          cap('Tick the puppies to list and pay $14.99 each, once.');
          await wait(700);
          var all = $('[data-all]');
          await click(all);
          all.checked = true;
          var n = 0;
          $$('[data-p]').forEach(function (b) { b.checked = true; n++; });
          var amount = '$' + (FEE * n).toFixed(2);
          $('[data-total]').textContent = amount;
          var pay = $('[data-pay]'); pay.disabled = false; pay.textContent = 'Pay ' + amount + ' for ' + n + ' listings';
          await wait(1400);
          await click(pay);
          C.insertAdjacentHTML('beforeend', '<div class="scrim"></div><div class="checkout wt-fade"><h2>Checkout</h2><p class="muted small" style="margin:0">Puppy Connection</p>' +
            '<table><tr><td>' + n + ' listings at $14.99</td><td>' + amount + '</td></tr><tr><td>Total</td><td>' + amount + '</td></tr></table>' +
            '<button class="btn btn-primary" type="button" data-checkout>Pay ' + amount + '</button></div>');
          C.appendChild(cur);
          cap('Pay by card on the secure checkout page.');
          await wait(1200);
          await click($('[data-checkout]'));
          await wait(700);
        } },

      { ch: 4,
        setup: function () { shell('litters', littersPage(LITTER, LISTED)); },
        run: async function () {
          toast('Payment received. Your puppies appear on the site within a few minutes.');
          cap('Your puppies appear on the site within a few minutes.');
          await wait(800);
          var pills = $$('[data-listed]');
          pills.forEach(function (p) { ring(p, true); });
          await wait(2600);
          pills.forEach(function (p) { ring(p, false); });
          cap('Add a new photo at least every four weeks and the listing stays up.');
          await wait(3400);
        } }
    ];

    // ---------- running scenes ----------
    function build(target) {
      C = target; C.innerHTML = ''; focused = null;
      C.className = (target === cvWrap ? 'wt-cv ' : '') + 'pc ' + S.mode + (S.instant || reduced.matches ? ' still' : '');
    }
    async function runScene(i, instant) {
      S.token++; var t = S.token;
      release();
      S.i = i; S.instant = instant; S.final = false; S.ended = false; S.caps = []; S.elapsed = 0; S.virtual = 0;
      cvWrap.classList.remove('paused');
      build(cvWrap);
      SCENES[i].setup();
      updateUi();
      try {
        await SCENES[i].run();
        S.instant = false;
        if (instant) {
          if (cur) cur.hidden = true;
          S.final = true; renderCap(); updateUi();
          if (!S.playing) return;
          await wait(7000);
        } else {
          await wait(1500);
        }
        chk(t);
        if (i < SCENES.length - 1) { runScene(i + 1, instant); return; }
        S.playing = false; S.ended = true; S.final = true; renderCap(); updateUi();
        if (opts.onEnd) opts.onEnd();
      } catch (e) { if (!(e instanceof Stop)) throw e; }
    }
    async function measure() {
      var off = q('.wt-off'), keep = { C: C, instant: S.instant, virtual: S.virtual, caps: S.caps };
      S.instant = true; DUR = [];
      for (var k = 0; k < SCENES.length; k++) {
        build(off); S.virtual = 0; S.caps = [];
        SCENES[k].setup(); await SCENES[k].run();
        DUR.push(S.virtual + 1500);
      }
      off.innerHTML = '';
      C = keep.C; S.instant = keep.instant; S.virtual = keep.virtual; S.caps = keep.caps;
      var bar = q('.wt-bar');
      bar.innerHTML = DUR.map(function (d) { return '<div class="wt-seg" style="--w:' + d + '"><span></span></div>'; }).join('');
    }

    // ---------- controls ----------
    var playBtn = q('[data-wt="play"]'), backBtn = q('[data-wt="back"]'), nextBtn = q('[data-wt="next"]');
    var stepsEl = q('.wt-steps');
    stepsEl.innerHTML = CHAPTERS.map(function (c, k) { return '<li><button type="button" data-ch="' + k + '"><span class="n">' + (k + 1) + '</span>' + c + '</button></li>'; }).join('');
    function updateUi() {
      var ch = SCENES[S.i].ch;
      Array.prototype.forEach.call(stepsEl.querySelectorAll('button'), function (b, k) {
        if (k === ch) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.parentNode.classList.toggle('done', k < ch);
      });
      playBtn.textContent = S.ended ? 'Replay' : S.playing ? 'Pause' : 'Play';
      backBtn.disabled = S.i === 0;
      nextBtn.disabled = S.i === SCENES.length - 1;
    }
    function freezeCursor() {
      if (!cur) return;
      var m = getComputedStyle(cur).transform;
      cur.style.transition = 'none'; if (m && m !== 'none') cur.style.transform = m;
    }
    function play() {
      if (S.ended) { S.playing = true; runScene(0, reduced.matches); return; }
      S.playing = true; cvWrap.classList.remove('paused');
      if (S.final && !reduced.matches) runScene(S.i, false);
      else if (S.final) runScene(S.i < SCENES.length - 1 ? S.i + 1 : 0, true);
      else release();
      updateUi();
    }
    function pause() { S.playing = false; cvWrap.classList.add('paused'); freezeCursor(); updateUi(); }
    function go(i) {
      if (i < 0 || i >= SCENES.length) return;
      runScene(i, !S.playing || reduced.matches);
    }
    playBtn.addEventListener('click', function () { if (S.playing) pause(); else play(); });
    backBtn.addEventListener('click', function () { go(S.i - 1); });
    nextBtn.addEventListener('click', function () { go(S.i + 1); });
    stepsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ch]'); if (!b) return;
      var ch = +b.getAttribute('data-ch');
      for (var k = 0; k < SCENES.length; k++) if (SCENES[k].ch === ch) { go(k); break; }
    });
    // Space plays or pauses and the arrow keys move between scenes, on the page or panel the caller names.
    var keyTarget = opts.keyTarget || root;
    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === ' ' && !/^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); playBtn.click(); }
      else if (e.key === 'ArrowLeft') go(S.i - 1);
      else if (e.key === 'ArrowRight') go(S.i + 1);
    }
    keyTarget.addEventListener('keydown', onKey);

    // progress bar and clock
    function fmt(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    var timeEl = q('.wt-time'), raf = 0, gone = false;
    function tick() {
      if (gone) return;
      var segs = root.querySelectorAll('.wt-seg span'), done = 0, total = 0;
      for (var k = 0; k < DUR.length; k++) {
        var f = k < S.i ? 1 : k > S.i ? 0 : (S.final ? 1 : Math.min(1, S.elapsed / DUR[k]));
        if (segs[k]) segs[k].style.width = (f * 100).toFixed(1) + '%';
        total += DUR[k]; done += DUR[k] * f;
      }
      if (DUR.length) timeEl.textContent = fmt(done) + ' / ' + fmt(total);
      raf = requestAnimationFrame(tick);
    }

    // scale the scene canvas to the player, and switch to the phone layout on a narrow player
    var started = false;
    function fit() {
      var w = vp.clientWidth || 360;
      var mode = w < 620 ? 'phone' : 'desk', size = LOGICAL[mode];
      S.scale = w / size[0];
      vp.style.height = Math.round(size[1] * S.scale) + 'px';
      cvWrap.style.width = size[0] + 'px'; cvWrap.style.height = size[1] + 'px';
      cvWrap.style.transform = 'scale(' + S.scale + ')';
      if (mode !== S.mode) {
        S.mode = mode;
        if (started) { S.token++; release(); }
        if (started) measure().then(function () { runScene(S.i, !S.playing || reduced.matches); });
      }
    }
    var ro = new ResizeObserver(fit);
    ro.observe(vp);

    (async function start() {
      fit();
      await measure();
      if (gone) return;
      started = true;
      raf = requestAnimationFrame(tick);
      if (reduced.matches || opts.autoplay === false) { runScene(0, true); }
      else { S.playing = true; runScene(0, false); }
    })();

    return {
      destroy: function () {
        gone = true; S.token++; S.playing = false; release();
        cancelAnimationFrame(raf); ro.disconnect(); keyTarget.removeEventListener('keydown', onKey);
        root.innerHTML = '';
      }
    };
  }
})();
