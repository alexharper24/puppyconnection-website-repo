/* The breeder portal. One page, hash routes, every edit in one drawer beside the list
   (the Teapup editor's pattern). All data comes from the portal Worker's JSON API. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var state = { config: null, me: null, breeds: [], listings: null, route: '' };

  // ------------------------------------------------------------ helpers
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(c) { return c == null ? '' : '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 }); }
  function dollars(c) { return c == null ? '' : String(c / 100); }
  function day(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function api(method, path, body, raw) {
    var opts = { method: method, credentials: 'same-origin', headers: {} };
    if (raw) { opts.body = raw; opts.headers['content-type'] = raw.type || 'application/octet-stream'; }
    else if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['content-type'] = 'application/json'; }
    return fetch(path, opts).then(function (res) {
      return res.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = { error: t }; }
        if (res.status === 401) { state.me = null; render(); }
        if (!res.ok) { var err = new Error((data && data.error) || 'Something went wrong.'); err.data = data; err.status = res.status; throw err; }
        return data;
      });
    });
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function formData(form) {
    var out = {};
    $$('input, select, textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') out[el.name] = el.checked; else out[el.name] = el.value;
    });
    return out;
  }

  function showError(form, err) {
    var box = $('.error', form);
    if (!box) { box = document.createElement('p'); box.className = 'error'; box.setAttribute('role', 'alert'); form.appendChild(box); }
    var extra = err.data && err.data.problems ? '<br>' + err.data.problems.map(function (p) { return esc(p.puppy) + ': ' + esc(p.reason); }).join('<br>') : '';
    box.innerHTML = esc(err.message) + extra;
  }

  // ------------------------------------------------------------ drawer
  var lastFocus = null;
  function openDrawer(title, bodyHtml, onReady) {
    closeDrawer();
    lastFocus = document.activeElement;
    var scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.id = 'scrim';
    var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', title);
    d.innerHTML = '<div class="drawer-head"><h2>' + esc(title) + '</h2><button class="btn btn-quiet" data-close aria-label="Close">Close</button></div>' +
      '<div class="drawer-body">' + bodyHtml + '</div>';
    document.body.appendChild(scrim); document.body.appendChild(d);
    scrim.addEventListener('click', closeDrawer);
    $('[data-close]', d).addEventListener('click', closeDrawer);
    var first = $('input, select, textarea, button:not([data-close])', d);
    if (first) first.focus();
    if (onReady) onReady(d);
  }
  function closeDrawer() {
    var d = $('#drawer'), s = $('#scrim');
    if (d) d.remove(); if (s) s.remove();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  // ------------------------------------------------------------ sign in
  function renderSignIn(sent) {
    document.body.className = 'plain';
    var c = state.config || {};
    app.innerHTML = '<main class="plain-card"><span class="brandmark">Puppy Connection</span>' +
      (sent ? '<h1>Check your email</h1><p>' + esc(sent) + '</p>' +
        (c.local && c.email_mode === 'log' ? '<p class="sim-flag">This is the test version, so nothing is really emailed. <a href="/dev/mail">Open the test mailbox</a> to find your link.</p>' : '') +
        '<p class="muted small">Wrong address? <a href="/" data-restart>Start again</a>.</p>'
      : '<h1>Breeder portal</h1><p>List your litters and puppies on Puppy Connection. Enter your email and we will send you a link to sign in, with no password to remember.</p>' +
        '<form id="signin" novalidate><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>' +
        '<div class="field"><label for="bn">Business name <span class="muted">(new breeders)</span></label><input id="bn" name="business_name" type="text" autocomplete="organization"></div>' +
        (c.turnstile_site_key ? '<div class="field"><div class="cf-turnstile" data-sitekey="' + esc(c.turnstile_site_key) + '" data-action="auth"></div></div>' : '') +
        '<button class="btn btn-primary" type="submit">Email me a sign-in link</button></form>' +
        (c.local ? '<p class="sim-flag" style="margin-top:1rem">This is the test version. Email is shown in the <a href="/dev/mail">test mailbox</a> and payments use a practice checkout.</p>' : '')) +
      '</main>';
    var r = $('[data-restart]'); if (r) r.addEventListener('click', function (e) { e.preventDefault(); renderSignIn(); });
    if (c.turnstile_site_key && !window.turnstile) {
      var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; document.head.appendChild(s);
    }
    var f = $('#signin');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(f);
      var tok = $('[name="cf-turnstile-response"]', f);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return showError(f, new Error('Enter a valid email address.'));
      var btn = $('button[type=submit]', f); btn.disabled = true;
      api('POST', '/auth/start', { email: d.email, business_name: d.business_name, turnstile_token: tok ? tok.value : '' })
        .then(function (r) { renderSignIn(r.message); })
        .catch(function (err) { btn.disabled = false; showError(f, err); });
    });
  }

  // ------------------------------------------------------------ shell
  var NAV = [
    ['', 'Overview'], ['profile', 'Profile'], ['litters', 'Litters and puppies'], ['pay', 'Pay to list'], ['payments', 'Payments'],
  ];

  function statusPill(s) {
    return { pending: '<span class="pill pill-warn">Waiting for approval</span>', approved: '<span class="pill pill-ok">Approved</span>',
      suspended: '<span class="pill pill-alert">Paused</span>', declined: '<span class="pill pill-alert">Not approved</span>' }[s] || '';
  }

  function shell(inner) {
    document.body.className = '';
    var me = state.me;
    var route = state.route.split('?')[0];
    app.innerHTML = '<header class="topbar"><a class="brand" href="#/">Puppy Connection</a>' +
      '<div class="who"><span class="name">' + esc(me.profile.business_name || me.email) + '</span>' + statusPill(me.status) +
      '<button class="btn btn-sm" id="signout">Sign out</button></div></header>' +
      '<div class="shell"><nav class="rail" aria-label="Portal">' +
      NAV.map(function (n) { return '<a href="#/' + n[0] + '"' + (route === n[0] ? ' class="on" aria-current="page"' : '') + '>' + esc(n[1]) + '</a>'; }).join('') +
      '</nav><main class="work"><div class="inner">' +
      (me.payments_mode === 'sim' ? '<p class="notice notice-sim">This is the test version. Payments go to a practice checkout and no card is charged, and email appears in the <a href="/dev/mail" target="_blank" rel="noopener">test mailbox</a>.</p>' : '') +
      inner + '</div></main></div>';
    $('#signout').addEventListener('click', function () {
      api('POST', '/auth/signout', {}).then(function () { state.me = null; location.hash = '#/'; render(); });
    });
  }

  // ------------------------------------------------------------ overview
  function overview() {
    var me = state.me;
    var p = me.profile;
    var filled = !!(p.business_name && (p.public_phone || p.public_email) && p.city && p.state);
    var html = '<h1>Welcome' + (p.business_name ? ', ' + esc(p.business_name) : '') + '</h1>';
    if (me.status === 'pending') {
      var submitted = !!me.profile_submitted_at;
      html += '<div class="card"><h2>Getting listed</h2><ol class="steps">' +
        '<li class="done"><span class="dot">1</span><div><b>Email confirmed</b><div class="muted small">You signed in with ' + esc(me.email) + '.</div></div></li>' +
        '<li class="' + (filled ? 'done' : 'now') + '"><span class="dot">2</span><div><b>Complete your profile</b><div class="muted small">Business name, a phone or email buyers can use, and your town and state.</div>' +
        (filled ? '' : '<a class="btn btn-sm" href="#/profile" style="margin-top:.4rem">Open your profile</a>') + '</div></li>' +
        '<li class="' + (submitted ? 'done' : filled ? 'now' : '') + '"><span class="dot">3</span><div><b>Accept the listing terms and submit</b>' +
        (submitted ? '<div class="muted small">Submitted ' + esc(day(me.profile_submitted_at)) + '.</div>' : filled ? '<a class="btn btn-sm btn-gold" href="#/profile" style="margin-top:.4rem">Submit for approval</a>' : '') + '</div></li>' +
        '<li class="' + (submitted ? 'now' : '') + '"><span class="dot">4</span><div><b>Puppy Connection approves your account</b><div class="muted small">You will get an email, and then you can add litters and puppies.</div></div></li>' +
        '</ol></div>';
      app.innerHTML = ''; shell(html); return;
    }
    if (me.status === 'declined') {
      shell(html + '<div class="notice notice-alert"><p><b>Your account was not approved.</b></p><p>If you think this is a mistake, reply to the email you received.</p></div>');
      return;
    }
    if (me.status === 'suspended') {
      html += '<div class="notice notice-alert"><p><b>Your account is paused.</b> You can see your listings, but changes and payments are on hold until Puppy Connection reinstates it.</p></div>';
    }
    loadListings().then(function (L) {
      var all = [];
      L.litters.forEach(function (l) { l.puppies.forEach(function (x) { if (x.publication_state !== 'archived') all.push(x); }); });
      var live = all.filter(function (x) { return x.is_public; }).length;
      var drafts = all.filter(function (x) { return x.publication_state === 'draft'; }).length;
      var ready = all.filter(function (x) { return !x.pay_block; }).length;
      var soon = all.filter(function (x) { return x.is_public && x.expires_at && new Date(x.expires_at) - Date.now() < 7 * 86400000; }).length;
      shell(html + '<div class="stats">' +
        '<div class="stat"><b>' + live + '</b><span>Live on the site</span></div>' +
        '<div class="stat"><b>' + drafts + '</b><span>Drafts</span></div>' +
        '<div class="stat"><b>' + ready + '</b><span>Ready to pay for</span></div>' +
        '<div class="stat"><b>' + soon + '</b><span>Expiring within a week</span></div></div>' +
        '<div class="card"><h2>Next steps</h2><p>Add a litter, add each puppy with photos, then pay ' + esc(money(L.fee_cents)) + ' per puppy to list it for ' + L.listing_days + ' days.</p>' +
        '<div class="btn-row"><a class="btn btn-primary" href="#/litters">Litters and puppies</a>' + (ready ? '<a class="btn btn-gold" href="#/pay">Pay to list ' + ready + '</a>' : '') + '</div></div>');
    });
  }

  // ------------------------------------------------------------ profile
  function profile() {
    var me = state.me, p = me.profile;
    var editable = me.status === 'pending' || me.status === 'approved';
    var dis = editable ? '' : ' disabled';
    function f(name, label, type, hint, attrs) {
      return '<div class="field"><label for="f-' + name + '">' + esc(label) + '</label><input id="f-' + name + '" name="' + name + '" type="' + (type || 'text') + '" value="' + esc(p[name] || '') + '"' + dis + (attrs || '') + '>' + (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') + '</div>';
    }
    var html = '<h1>Your profile</h1><p class="muted">This is what buyers see on your breeder page. Your sign-in email (' + esc(me.email) + ') stays private.</p>' +
      '<form id="profile" class="card" novalidate><input type="hidden" name="version" value="' + esc(p.version) + '">' +
      f('business_name', 'Business name', 'text', null, ' required') +
      '<div class="grid-2">' + f('public_phone', 'Phone buyers can call', 'tel') + f('public_email', 'Email buyers can write to', 'email') + '</div>' +
      '<div class="grid-2">' + f('city', 'Town or city') + f('state', 'State') + '</div>' +
      '<p class="hint" style="margin-top:-.4rem">Town and state only. Your street address is never shown.</p>' +
      f('website_url', 'Your website', 'url', 'Optional. Starts with https://') +
      f('contact_name', 'Contact name', 'text', 'Private, for Puppy Connection only.') +
      '<div class="field"><label for="f-description">About your kennel</label><textarea id="f-description" name="description"' + dis + '>' + esc(p.description || '') + '</textarea><div class="hint">A few short paragraphs. Leave a blank line between them.</div></div>' +
      (editable ? '<button class="btn btn-primary" type="submit">Save profile</button>' : '') + '</form>';
    if (me.status === 'pending' && !me.profile_submitted_at) {
      html += '<form id="submit" class="card" novalidate><h2>Submit for approval</h2>' +
        '<div class="notice"><b>REPLACE THIS:</b> the listing terms, in Amber\'s own words, go here before launch (build spec section 14). Version ' + esc(me.terms_version) + '.</div>' +
        '<label class="check" for="accept-terms"><input type="checkbox" id="accept-terms" name="accept_terms"> I have read and accept the listing terms.</label>' +
        '<div class="btn-row"><button class="btn btn-gold" type="submit">Submit for approval</button></div></form>';
    } else if (me.status === 'pending') {
      html += '<p class="notice">Submitted ' + esc(day(me.profile_submitted_at)) + '. Puppy Connection will email you when it is approved.</p>';
    }
    shell(html);
    var pf = $('#profile');
    if (editable) pf.addEventListener('submit', function (e) {
      e.preventDefault();
      api('PUT', '/api/profile', formData(pf)).then(function (me2) { state.me = me2; toast('Profile saved'); profile(); }).catch(function (err) { showError(pf, err); });
    });
    var sf = $('#submit');
    if (sf) sf.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = formData(sf);
      if (!d.accept_terms) return showError(sf, new Error('Tick the box to accept the listing terms.'));
      api('POST', '/api/profile/submit', { accept_terms: true }).then(function (me2) { state.me = me2; toast('Submitted for approval'); location.hash = '#/'; })
        .catch(function (err) { showError(sf, err); });
    });
  }

  // ------------------------------------------------------------ litters and puppies
  function loadListings() {
    return api('GET', '/api/listings').then(function (L) { state.listings = L; return L; });
  }
  function loadBreeds() {
    if (state.breeds.length) return Promise.resolve(state.breeds);
    return api('GET', '/api/breeds').then(function (b) { state.breeds = b; return b; });
  }

  function puppyChips(x) {
    var chips = [];
    if (x.publication_state === 'archived') chips.push('<span class="pill">Removed</span>');
    else if (x.is_public) chips.push('<span class="pill pill-ok">Listed until ' + esc(day(x.expires_at)) + '</span>');
    else if (x.publication_state === 'expired') chips.push('<span class="pill pill-warn">Expired</span>');
    else if (x.publication_state === 'published') chips.push('<span class="pill pill-warn">Paid, not showing</span>');
    else chips.push('<span class="pill">Draft</span>');
    if (x.operator_hold) chips.push('<span class="pill pill-alert">Paused by Puppy Connection</span>');
    if (x.held_by) chips.push('<span class="pill pill-gold">In checkout</span>');
    if (x.availability !== 'available') chips.push('<span class="pill">' + (x.availability === 'placed' ? 'Placed' : 'Pending') + '</span>');
    return chips.join('');
  }

  function litters() {
    var me = state.me;
    var canEdit = me.status === 'approved';
    Promise.all([loadListings(), loadBreeds()]).then(function (res) {
      var L = res[0];
      var active = L.litters.filter(function (l) { return !l.archived_at; });
      var html = '<div class="card-head"><h1>Litters and puppies</h1>' + (canEdit ? '<button class="btn btn-primary" id="add-litter">Add a litter</button>' : '') + '</div>';
      if (!canEdit) html += '<p class="notice">' + (me.status === 'suspended' ? 'Your account is paused, so this is read only.' : 'Litters open once your account is approved.') + '</p>';
      if (!active.length) html += '<div class="card"><p>No litters yet.' + (canEdit ? ' Start with <b>Add a litter</b>, then add each puppy to it.' : '') + '</p></div>';
      active.forEach(function (l) {
        var pups = l.puppies.filter(function (x) { return x.publication_state !== 'archived'; });
        html += '<section class="card" aria-label="' + esc(l.breed_name) + ' litter"><div class="card-head"><div><h2>' + esc(l.breed_name) + '</h2>' +
          '<div class="muted small">' + (l.born_on ? 'Born ' + esc(day(l.born_on)) : 'Birth date not set') + (l.ready_on ? ', ready ' + esc(day(l.ready_on)) : '') +
          (l.mom_weight_lb || l.dad_weight_lb ? '. Parents ' + (l.mom_weight_lb ? esc(l.mom_weight_lb) + ' lb mom' : '') + (l.mom_weight_lb && l.dad_weight_lb ? ', ' : '') + (l.dad_weight_lb ? esc(l.dad_weight_lb) + ' lb dad' : '') : '') + '</div></div>' +
          (canEdit ? '<div class="btn-row" style="margin:0"><button class="btn btn-sm" data-edit-litter="' + esc(l.id) + '">Edit litter</button><button class="btn btn-sm btn-primary" data-add-puppy="' + esc(l.id) + '">Add a puppy</button></div>' : '') + '</div>' +
          (pups.length ? pups.map(function (x) {
            var img = x.photos[0] ? '<img class="thumb" src="' + esc(cardUrl(x.photos[0].url)) + '" alt="">' : '<div class="thumb-empty">No photo</div>';
            return '<div class="puppy-row">' + img + '<div class="meta"><b>' + esc(x.name) + '</b><span class="muted small">' + esc(money(x.price_cents)) +
              (x.sex ? ', ' + esc(x.sex) : '') + (x.color ? ', ' + esc(x.color) : '') + '. ' + x.photos.length + ' photo' + (x.photos.length === 1 ? '' : 's') + '</span>' +
              '<div class="chips">' + puppyChips(x) + '</div></div>' +
              '<button class="btn btn-sm" data-edit-puppy="' + esc(x.id) + '">' + (canEdit ? 'Edit' : 'View') + '</button></div>';
          }).join('') : '<p class="muted small">No puppies in this litter yet.</p>') + '</section>';
      });
      shell(html);
      var al = $('#add-litter'); if (al) al.addEventListener('click', function () { litterDrawer(null); });
      $$('[data-edit-litter]').forEach(function (b) { b.addEventListener('click', function () { litterDrawer(findLitter(b.dataset.editLitter)); }); });
      $$('[data-add-puppy]').forEach(function (b) { b.addEventListener('click', function () { puppyDrawer(null, b.dataset.addPuppy); }); });
      $$('[data-edit-puppy]').forEach(function (b) { b.addEventListener('click', function () { puppyDrawer(findPuppy(b.dataset.editPuppy)); }); });
    });
  }

  function findLitter(id) { return state.listings.litters.filter(function (l) { return l.id === id; })[0]; }
  function findPuppy(id) {
    var out = null;
    state.listings.litters.forEach(function (l) { l.puppies.forEach(function (x) { if (x.id === id) out = x; }); });
    return out;
  }

  function litterDrawer(l) {
    var opts = state.breeds.map(function (b) { return '<option value="' + esc(b.id) + '"' + (l && l.breed_id === b.id ? ' selected' : '') + '>' + esc(b.name) + '</option>'; }).join('');
    openDrawer(l ? 'Edit litter' : 'Add a litter',
      '<form id="litter" novalidate>' + (l ? '<input type="hidden" name="version" value="' + esc(l.version) + '">' : '') +
      '<div class="field"><label for="l-breed">Breed</label><select id="l-breed" name="breed_id" required><option value="">Choose a breed</option>' + opts + '</select></div>' +
      '<div class="grid-2"><div class="field"><label for="l-born">Born</label><input id="l-born" name="born_on" type="date" value="' + esc(l ? l.born_on : '') + '"></div>' +
      '<div class="field"><label for="l-ready">Ready to go home</label><input id="l-ready" name="ready_on" type="date" value="' + esc(l ? l.ready_on : '') + '"></div></div>' +
      '<div class="grid-2"><div class="field"><label for="l-mom">Mom\'s weight (lb)</label><input id="l-mom" name="mom_weight_lb" type="number" min="0" step="0.1" value="' + esc(l ? l.mom_weight_lb : '') + '"></div>' +
      '<div class="field"><label for="l-dad">Dad\'s weight (lb)</label><input id="l-dad" name="dad_weight_lb" type="number" min="0" step="0.1" value="' + esc(l ? l.dad_weight_lb : '') + '"></div></div>' +
      '<div class="field"><label for="l-desc">About this litter</label><textarea id="l-desc" name="description">' + esc(l ? l.description : '') + '</textarea></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (l ? 'Save litter' : 'Add litter') + '</button>' +
      (l ? '<button class="btn btn-danger" type="button" id="archive-litter">Remove litter</button>' : '') + '</div></form>',
      function (d) {
        var form = $('#litter', d);
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = formData(form);
          (l ? api('PUT', '/api/litters/' + l.id, body) : api('POST', '/api/litters', body))
            .then(function () { closeDrawer(); toast(l ? 'Litter saved' : 'Litter added'); litters(); })
            .catch(function (err) { showError(form, err); });
        });
        var ar = $('#archive-litter', d);
        if (ar) ar.addEventListener('click', function () {
          if (!confirm('Remove this litter and every puppy in it from your listings? Placed puppies leave the site with it.')) return;
          api('POST', '/api/litters/' + l.id + '/archive', {}).then(function () { closeDrawer(); toast('Litter removed'); litters(); }).catch(function (err) { showError(form, err); });
        });
      });
  }

  function puppyDrawer(x, litterId) {
    var canEdit = state.me.status === 'approved';
    var dis = canEdit ? '' : ' disabled';
    var inc = x ? x.includes.join('\n') : '';
    function seg(val) {
      return '<div class="seg" role="group" aria-label="Status">' + [['available', 'Available'], ['pending', 'Pending'], ['placed', 'Placed']].map(function (o) {
        return '<button type="button" data-av="' + o[0] + '" class="' + ((x ? x.availability : 'available') === o[0] ? 'on' : '') + '" aria-pressed="' + ((x ? x.availability : 'available') === o[0]) + '"' + dis + '>' + o[1] + '</button>';
      }).join('') + '</div><input type="hidden" name="availability" value="' + esc(x ? x.availability : 'available') + '">';
    }
    openDrawer(x ? x.name : 'Add a puppy',
      (x ? '<div class="chips" style="margin-bottom:.8rem">' + puppyChips(x) + '</div>' : '') +
      '<form id="puppy" novalidate>' + (x ? '<input type="hidden" name="version" value="' + esc(x.version) + '">' : '') +
      '<div class="field"><label for="p-name">Name</label><input id="p-name" name="name" type="text" value="' + esc(x ? x.name : '') + '" required' + dis + '></div>' +
      '<div class="grid-2"><div class="field"><label for="p-sex">Sex</label><select id="p-sex" name="sex"' + dis + '><option value="">Not set</option><option value="female"' + (x && x.sex === 'female' ? ' selected' : '') + '>Female</option><option value="male"' + (x && x.sex === 'male' ? ' selected' : '') + '>Male</option></select></div>' +
      '<div class="field"><label for="p-color">Color</label><input id="p-color" name="color" type="text" value="' + esc(x ? x.color : '') + '"' + dis + '></div></div>' +
      '<div class="grid-2"><div class="field"><label for="p-price">Price ($)</label><input id="p-price" name="price" type="text" inputmode="decimal" value="' + esc(x ? dollars(x.price_cents) : '') + '" required' + dis + '></div>' +
      '<div class="field"><label for="p-dep">Deposit ($)</label><input id="p-dep" name="deposit" type="text" inputmode="decimal" value="' + esc(x ? dollars(x.deposit_cents) : '') + '"' + dis + '></div></div>' +
      '<div class="field"><label>Status</label>' + seg() + '<div class="hint">Placed puppies stay visible in their litter, marked placed.</div></div>' +
      '<div class="field"><label for="p-desc">Description</label><textarea id="p-desc" name="description"' + dis + '>' + esc(x ? x.description : '') + '</textarea></div>' +
      '<div class="field"><label for="p-inc">Comes with</label><textarea id="p-inc" name="includes" style="min-height:80px"' + dis + '>' + esc(inc) + '</textarea><div class="hint">One item per line, like "Vet exam" or "Microchipped".</div></div>' +
      '<div class="field"><label for="p-url">Link to this puppy on your site</label><input id="p-url" name="breeder_url" type="url" value="' + esc(x ? x.breeder_url : '') + '"' + dis + '><div class="hint">Optional. Buyers are sent here to contact you.</div></div>' +
      (canEdit ? '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (x ? 'Save puppy' : 'Add puppy') + '</button>' + (x ? '<button class="btn btn-danger" type="button" id="archive-puppy">Remove puppy</button>' : '') + '</div>' : '') +
      '</form>' + (x ? photoSection(x, canEdit) : '<p class="hint" style="margin-top:1rem">Add photos after the puppy is saved.</p>'),
      function (d) {
        var form = $('#puppy', d);
        $$('[data-av]', d).forEach(function (b) {
          b.addEventListener('click', function () {
            $$('[data-av]', d).forEach(function (o) { o.classList.remove('on'); o.setAttribute('aria-pressed', 'false'); });
            b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
            $('[name=availability]', form).value = b.dataset.av;
          });
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var body = formData(form);
          body.includes = String(body.includes || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          if (!x) body.litter_id = litterId;
          (x ? api('PUT', '/api/puppies/' + x.id, body) : api('POST', '/api/puppies', body))
            .then(function (r) {
              toast(x ? 'Puppy saved' : 'Puppy added. Now add photos.');
              return loadListings().then(function () { puppyDrawer(findPuppy(x ? x.id : r.id)); litters(); });
            })
            .catch(function (err) { showError(form, err); });
        });
        var ar = $('#archive-puppy', d);
        if (ar) ar.addEventListener('click', function () {
          if (!confirm('Remove ' + x.name + ' from your listings?')) return;
          api('POST', '/api/puppies/' + x.id + '/archive', {}).then(function () { closeDrawer(); toast('Puppy removed'); litters(); }).catch(function (err) { showError(form, err); });
        });
        if (x) wirePhotos(d, x, canEdit);
      });
  }

  function photoSection(x, canEdit) {
    return '<section style="margin-top:1.4rem"><h3>Photos</h3><p class="hint">The first photo is the cover. Location and camera details are removed when a photo is uploaded.</p>' +
      '<div class="photos" id="photos">' + x.photos.map(function (ph, i) {
        return '<div class="photo" data-id="' + esc(ph.id) + '">' + (i === 0 ? '<span class="pill pill-gold cover">Cover</span>' : '') +
          '<img src="' + esc(cardUrl(ph.url)) + '" alt="Photo ' + (i + 1) + ' of ' + esc(x.name) + '">' +
          (canEdit ? '<div class="tools"><button type="button" data-move="-1" aria-label="Move earlier"' + (i === 0 ? ' disabled' : '') + '>&larr;</button>' +
            '<button type="button" data-remove aria-label="Remove photo">Remove</button>' +
            '<button type="button" data-move="1" aria-label="Move later"' + (i === x.photos.length - 1 ? ' disabled' : '') + '>&rarr;</button></div>' : '') + '</div>';
      }).join('') + '</div>' +
      (canEdit ? '<div class="upload"><label for="ph-input" class="btn btn-sm">Add photos</label><input id="ph-input" type="file" accept="image/*" multiple hidden>' +
        '<div class="hint">JPEG, PNG or WebP, up to 15 MB each.</div><p class="error" id="ph-error" hidden></p></div>' : '') + '</section>';
  }

  /* A phone photo can be 4 to 12 MB and 4000 px wide, and the site never shows one wider than
     1200 px. Each photo is redrawn here before upload, once at FULL_EDGE for the puppy page
     and once at CARD_EDGE for cards and thumbnails, as WebP where the browser can write it and
     JPEG where it cannot. Redrawing also drops the camera metadata, which the server strips
     again anyway. A file the browser cannot decode goes up as it is. */
  var FULL_EDGE = 1600, CARD_EDGE = 640;
  function cardUrl(u) { return /^\/media\/[\w-]+$/.test(u || '') ? u + '/card' : u; }
  function decode(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' });
    return new Promise(function (ok, fail) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () { URL.revokeObjectURL(u); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(u); fail(new Error('decode')); };
      im.src = u;
    });
  }
  function draw(src, edge) {
    var w = src.width, h = src.height, k = Math.min(1, edge / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, c.width, c.height);
    return new Promise(function (ok) {
      c.toBlob(function (b) {
        if (b && b.type === 'image/webp') return ok(b);
        c.toBlob(function (j) { ok(j); }, 'image/jpeg', 0.85);
      }, 'image/webp', 0.82);
    });
  }
  function shrink(file) {
    return decode(file).then(function (src) {
      return draw(src, FULL_EDGE).then(function (full) {
        return draw(src, CARD_EDGE).then(function (card) {
          if (src.close) src.close();
          // Keep the original when redrawing would not make it smaller, such as a small PNG.
          return { full: full && full.size < file.size ? full : file, card: card };
        });
      });
    }).catch(function () { return { full: file, card: null }; });
  }
  function uploadOne(puppyId, file) {
    return shrink(file).then(function (s) {
      return api('POST', '/api/puppies/' + puppyId + '/photos', undefined, s.full).then(function (r) {
        // A missing card copy only means cards load the full photo, so its failure is not shown.
        if (s.card) return api('POST', '/api/photos/' + r.id + '/card', undefined, s.card).catch(function () {});
      });
    });
  }

  function wirePhotos(d, x, canEdit) {
    if (!canEdit) return;
    var input = $('#ph-input', d);
    var errBox = $('#ph-error', d);
    function reopen() { return loadListings().then(function () { puppyDrawer(findPuppy(x.id)); litters(); }); }
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;
      errBox.hidden = true;
      var chain = Promise.resolve();
      files.forEach(function (file) {
        chain = chain.then(function () { return uploadOne(x.id, file); });
      });
      chain.then(function () { toast(files.length === 1 ? 'Photo added' : files.length + ' photos added'); return reopen(); })
        .catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; reopen(); });
    });
    $$('[data-remove]', d).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.closest('.photo').dataset.id;
        api('DELETE', '/api/photos/' + id).then(function () { toast('Photo removed'); reopen(); }).catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; });
      });
    });
    $$('[data-move]', d).forEach(function (b) {
      b.addEventListener('click', function () {
        var ids = x.photos.map(function (p) { return p.id; });
        var id = b.closest('.photo').dataset.id;
        var i = ids.indexOf(id), j = i + Number(b.dataset.move);
        if (j < 0 || j >= ids.length) return;
        ids.splice(j, 0, ids.splice(i, 1)[0]);
        api('PUT', '/api/puppies/' + x.id + '/photo-order', { ids: ids }).then(reopen).catch(function (err) { errBox.hidden = false; errBox.textContent = err.message; });
      });
    });
  }

  // ------------------------------------------------------------ pay
  function pay() {
    var me = state.me;
    var q = state.route.split('?')[1] || '';
    loadListings().then(function (L) {
      var rows = [];
      L.litters.forEach(function (l) {
        l.puppies.forEach(function (x) { if (x.publication_state !== 'archived') rows.push({ x: x, breed: l.breed_name }); });
      });
      var ready = rows.filter(function (r) { return !r.x.pay_block; });
      var blocked = rows.filter(function (r) { return r.x.pay_block && !r.x.is_public; });
      var html = '<h1>Pay to list</h1>' +
        (q.indexOf('canceled=1') >= 0 ? '<p class="notice">Payment canceled. Nothing was charged, and the puppies are free to pay for again.</p>' : '') +
        '<p>Each puppy costs ' + esc(money(L.fee_cents)) + ' to list for ' + L.listing_days + ' days. Pay for a whole litter at once.</p>';
      if (me.status !== 'approved') html += '<p class="notice">Payments open once your account is approved and active.</p>';
      html += '<form id="payform" class="card"><h2>Ready to list</h2>' +
        (ready.length ? '<label class="check" for="all" style="margin-bottom:.4rem"><input type="checkbox" id="all" aria-label="Select all"> Select all</label>' + ready.map(function (r) {
          var img = r.x.photos[0] ? '<img class="thumb" src="' + esc(cardUrl(r.x.photos[0].url)) + '" alt="">' : '<div class="thumb-empty">No photo</div>';
          return '<label class="pay-row check"><input type="checkbox" name="p" value="' + esc(r.x.id) + '" aria-label="' + esc('Pay for ' + r.x.name) + '">' + img +
            '<span><b>' + esc(r.x.name) + '</b> <span class="muted">' + esc(r.breed) + '</span><br><span class="why">' +
            (r.x.publication_state === 'published' ? 'Renew, listed until ' + esc(day(r.x.expires_at)) : r.x.publication_state === 'expired' ? 'Expired, relist' : 'Draft') + '</span></span></label>';
        }).join('') : '<p class="muted">Nothing is ready to pay for right now.</p>') +
        '<div class="total" style="margin-top:1rem"><span>Total</span><b id="total">$0</b></div>' +
        '<div class="btn-row"><button class="btn btn-gold" type="submit" id="paybtn" disabled>Continue to payment</button></div></form>';
      if (blocked.length) {
        html += '<div class="card"><h2>Not ready yet</h2>' + blocked.map(function (r) {
          return '<div class="pay-row"><span><b>' + esc(r.x.name) + '</b> <span class="muted">' + esc(r.breed) + '</span><br><span class="why">' + esc(r.x.pay_block) + '</span></span></div>';
        }).join('') + '</div>';
      }
      shell(html);
      var form = $('#payform');
      function update() {
        var n = $$('input[name=p]:checked', form).length;
        $('#total').textContent = money(n * L.fee_cents) || '$0';
        $('#paybtn').disabled = !n;
        $('#paybtn').textContent = n ? 'Pay ' + money(n * L.fee_cents) + ' for ' + n + ' listing' + (n === 1 ? '' : 's') : 'Continue to payment';
      }
      $$('input[name=p]', form).forEach(function (c) { c.addEventListener('change', update); });
      var all = $('#all'); if (all) all.addEventListener('change', function () { $$('input[name=p]', form).forEach(function (c) { c.checked = all.checked; }); update(); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ids = $$('input[name=p]:checked', form).map(function (c) { return c.value; });
        $('#paybtn').disabled = true;
        api('POST', '/api/checkouts', { puppy_ids: ids }).then(function (r) { location.href = r.url; })
          .catch(function (err) { $('#paybtn').disabled = false; showError(form, err); });
      });
    });
  }

  // ------------------------------------------------------------ payments
  function payments() {
    api('GET', '/api/checkouts').then(function (rows) {
      var label = { paid: '<span class="pill pill-ok">Paid</span>', open: '<span class="pill pill-gold">Open</span>', expired: '<span class="pill">Canceled or expired</span>',
        failed: '<span class="pill pill-alert">Failed</span>', needs_review: '<span class="pill pill-warn">Under review</span>', creating: '<span class="pill">Starting</span>' };
      shell('<h1>Payments</h1><p class="muted">Receipts for paid listings come from Stripe by email.</p>' +
        (rows.length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Date</th><th>Puppies</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' +
          rows.map(function (c) {
            return '<tr><td>' + esc(day(c.created_at)) + '</td><td>' + esc(c.puppies) + '</td><td class="num">' + esc(money(c.amount_total_cents)) + '</td><td>' + (label[c.status] || esc(c.status)) + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="card"><p>No payments yet.</p></div>'));
    });
  }

  // ------------------------------------------------------------ router
  function render() {
    closeDrawer();
    state.route = (location.hash || '#/').replace(/^#\/?/, '');
    if (!state.me) return renderSignIn();
    var r = state.route.split('?')[0];
    var q = state.route.split('?')[1] || '';
    if (r === 'listings') {
      if (q.indexOf('paid=') >= 0) toast(q.indexOf('result=paid') >= 0 ? 'Payment received. Your listings are going live.' : 'Payment received. Your listings will go live shortly.');
      location.replace('#/litters');
      return;
    }
    if (state.me.status === 'declined' && r !== '') return overview();
    ({ '': overview, profile: profile, litters: litters, pay: pay, payments: payments }[r] || overview)();
  }

  window.addEventListener('hashchange', function () {
    api('GET', '/api/me').then(function (me) { state.me = me; render(); }).catch(function () { state.me = null; render(); });
  });

  api('GET', '/api/config').then(function (c) { state.config = c; })
    .then(function () { return fetch('/api/me', { credentials: 'same-origin' }); })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (me) { state.me = me; render(); })
    .catch(function () { state.me = null; render(); });
})();
