/* Amber's operator screens. The same rail, list and drawer as the breeder portal, answering
   different questions: who is waiting, who is paused, what is live, what needs attention. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var state = { who: null, stats: null, route: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(c) { return c == null ? '' : '$' + (c / 100).toLocaleString('en-US', { minimumFractionDigits: c % 100 ? 2 : 0 }); }
  function day(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function when(iso) { return iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function api(method, path, body) {
    var opts = { method: method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) { opts.body = JSON.stringify(body); opts.headers['content-type'] = 'application/json'; }
    return fetch(path, opts).then(function (res) {
      return res.text().then(function (t) {
        var data = null; try { data = t ? JSON.parse(t) : null; } catch (e) { data = { error: t }; }
        if (!res.ok) { var err = new Error((data && data.error) || 'Something went wrong.'); err.status = res.status; throw err; }
        return data;
      });
    });
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200);
  }
  function showError(el, err) {
    var box = $('.error', el);
    if (!box) { box = document.createElement('p'); box.className = 'error'; box.setAttribute('role', 'alert'); el.appendChild(box); }
    box.textContent = err.message;
  }

  var lastFocus = null;
  function openDrawer(title, html, ready) {
    closeDrawer(); lastFocus = document.activeElement;
    var s = document.createElement('div'); s.className = 'scrim'; s.id = 'scrim';
    var d = document.createElement('aside'); d.className = 'drawer'; d.id = 'drawer';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', title);
    d.innerHTML = '<div class="drawer-head"><h2>' + esc(title) + '</h2><button class="btn btn-quiet" data-close>Close</button></div><div class="drawer-body">' + html + '</div>';
    document.body.appendChild(s); document.body.appendChild(d);
    s.addEventListener('click', closeDrawer); $('[data-close]', d).addEventListener('click', closeDrawer);
    var f = $('button:not([data-close]), input, textarea, select', d); if (f) f.focus();
    if (ready) ready(d);
  }
  function closeDrawer() {
    var d = $('#drawer'), s = $('#scrim'); if (d) d.remove(); if (s) s.remove();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  var STATUS = {
    pending: '<span class="pill pill-warn">Pending</span>', approved: '<span class="pill pill-ok">Approved</span>',
    suspended: '<span class="pill pill-alert">Suspended</span>', declined: '<span class="pill">Declined</span>',
  };
  function breederPill(b) {
    if (b.status === 'pending') return b.profile_submitted_at ? '<span class="pill pill-gold">Waiting for you</span>' : '<span class="pill">Signing up</span>';
    return STATUS[b.status] || esc(b.status);
  }

  function shell(inner) {
    var s = state.stats || {};
    var route = state.route.split('?')[0].split('/')[0];
    var nav = [['', 'Overview'], ['approvals', 'Approvals', s.queue], ['breeders', 'Breeders'], ['listings', 'Listings', s.public_puppies],
      ['payments', 'Payments', s.needs_review || null], ['settings', 'Settings'], ['activity', 'Activity']];
    app.innerHTML = '<header class="topbar"><a class="brand" href="#/">Puppy Connection</a><span class="pill" style="background:#3a3a3a;color:#f7d57f">Operator</span>' +
      '<div class="who"><span class="name">' + esc(state.who.name) + '</span></div></header>' +
      '<div class="shell"><nav class="rail" aria-label="Operator">' + nav.map(function (n) {
        return '<a href="#/' + n[0] + '" aria-label="' + esc(n[1] + (n[2] ? ', ' + n[2] : '')) + '"' + (route === n[0] ? ' class="on" aria-current="page"' : '') + '><span>' + esc(n[1]) + '</span>' +
          (n[2] ? '<span class="count">' + n[2] + '</span>' : '') + '</a>';
      }).join('') + '</nav><main class="work"><div class="inner">' +
      (state.who.dev ? '<p class="notice notice-sim">Local simulation. You are signed in as ' + esc(state.who.email) + ' through DEV_IDENTITY, which stands in for Cloudflare Access. Email is in the <a href="' + esc(state.who.portal) + '/dev/mail" target="_blank" rel="noopener">local mailbox</a>, and payments are ' + esc(state.who.payments_mode) + '.</p>' : '') +
      inner + '</div></main></div>';
  }

  function refreshStats() { return api('GET', '/api/stats').then(function (s) { state.stats = s; return s; }); }

  // ------------------------------------------------------------ overview
  function overview() {
    refreshStats().then(function (s) {
      shell('<h1>Overview</h1><div class="stats">' +
        '<a class="stat" href="#/approvals" style="text-decoration:none;color:inherit"><b>' + s.queue + '</b><span>Waiting for approval</span></a>' +
        '<div class="stat"><b>' + s.signing_up + '</b><span>Still signing up</span></div>' +
        '<div class="stat"><b>' + s.approved + '</b><span>Approved breeders</span></div>' +
        '<div class="stat"><b>' + s.public_puppies + '</b><span>Puppies live</span></div>' +
        '<div class="stat"><b>' + s.drafts + '</b><span>Drafts</span></div>' +
        '<div class="stat"><b>' + s.open_checkouts + '</b><span>Checkouts open</span></div>' +
        '<div class="stat"><b>' + s.needs_review + '</b><span>Payments to review</span></div>' +
        '<div class="stat"><b>' + s.unpublished_changes + '</b><span>Changes not yet on the site</span></div></div>' +
        '<div class="card"><h2>The public site</h2><p>' + (s.unpublished_changes ? s.unpublished_changes + ' change' + (s.unpublished_changes === 1 ? ' is' : 's are') + ' waiting to reach the site.' : 'The site is up to date.') + '</p>' +
        '<p class="muted small">In the real build a job publishes every five minutes. In the simulation, run <code>node app/dev/preview.mjs</code> to rebuild the local preview of the site.</p></div>');
    });
  }

  // ------------------------------------------------------------ breeders
  function breederTable(rows, empty) {
    if (!rows.length) return '<div class="card"><p>' + esc(empty) + '</p></div>';
    return '<div class="table-wrap"><table class="list"><thead><tr><th>Breeder</th><th>Where</th><th>Status</th><th class="num">Live</th><th>Joined</th></tr></thead><tbody>' +
      rows.map(function (b) {
        return '<tr class="clickable" data-open="' + esc(b.id) + '" tabindex="0" role="button" aria-label="Open ' + esc(b.business_name || b.email) + '"><td><b>' + esc(b.business_name || '(no name yet)') + '</b><div class="muted small">' + esc(b.email) + (b.legacy ? ' · imported' : '') + '</div></td>' +
          '<td>' + esc([b.city, b.state].filter(Boolean).join(', ')) + '</td><td>' + breederPill(b) + '</td><td class="num">' + b.public_puppies + ' of ' + b.puppies + '</td><td>' + esc(day(b.created_at)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function wireRows(onOpen) {
    $$('[data-open]').forEach(function (tr) {
      tr.addEventListener('click', function () { onOpen(tr.dataset.open); });
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') onOpen(tr.dataset.open); });
    });
  }

  function approvals() {
    Promise.all([refreshStats(), api('GET', '/api/breeders?status=queue')]).then(function (r) {
      shell('<h1>Approvals</h1><p class="muted">Breeders who have finished their profile and accepted the terms, oldest first.</p>' + breederTable(r[1], 'Nobody is waiting for approval.'));
      wireRows(breederDrawer);
      var id = state.route.split('/')[1]; if (id) breederDrawer(id);
    });
  }

  function breeders() {
    var f = (state.route.split('?')[1] || '').replace('status=', '') || '';
    Promise.all([refreshStats(), api('GET', '/api/breeders' + (f ? '?status=' + f : ''))]).then(function (r) {
      var tabs = [['', 'All'], ['queue', 'Waiting'], ['signing_up', 'Signing up'], ['approved', 'Approved'], ['suspended', 'Suspended'], ['declined', 'Declined']];
      shell('<h1>Breeders</h1><div class="tabs">' + tabs.map(function (t) {
        return '<a class="btn btn-sm' + (f === t[0] ? ' btn-primary' : '') + '" href="#/breeders' + (t[0] ? '?status=' + t[0] : '') + '">' + t[1] + '</a>';
      }).join('') + '</div>' + breederTable(r[1], 'No breeders here.'));
      wireRows(breederDrawer);
    });
  }

  function breederDrawer(id) {
    api('GET', '/api/breeders/' + id).then(function (data) {
      var b = data.breeder;
      var pups = []; data.litters.forEach(function (l) { l.puppies.forEach(function (p) { if (p.publication_state !== 'archived') { p.breed = l.breed_name; pups.push(p); } }); });
      var actions = {
        pending: b.profile_submitted_at ? '<button class="btn btn-primary" data-do="approve">Approve</button><button class="btn btn-danger" data-do="decline">Decline</button>' : '<p class="muted small">Still signing up. Approval opens when they submit their profile.</p>',
        approved: '<button class="btn btn-danger" data-do="suspend">Suspend</button>',
        suspended: '<button class="btn btn-primary" data-do="reinstate">Reinstate</button>',
        declined: '<button class="btn" data-do="reopen">Reopen application</button>',
      }[b.status];
      function row(k, v) { return v ? '<tr><td class="muted" style="width:38%">' + esc(k) + '</td><td>' + v + '</td></tr>' : ''; }
      openDrawer(b.business_name || b.email,
        '<p>' + breederPill(b) + (b.status_reason ? ' <span class="muted small">Reason on record: ' + esc(b.status_reason) + '</span>' : '') + '</p>' +
        '<div class="table-wrap" style="margin-bottom:1rem"><table class="list"><tbody>' +
        row('Sign-in email', esc(b.email)) + row('Contact name', esc(b.contact_name)) + row('Public phone', esc(b.public_phone)) +
        row('Public email', esc(b.public_email)) + row('Where', esc([b.city, b.state].filter(Boolean).join(', '))) +
        row('Website', b.website_url ? '<a href="' + esc(b.website_url) + '" target="_blank" rel="noopener">' + esc(b.website_url) + '</a>' : '') +
        row('Joined', esc(day(b.created_at))) + row('Submitted', esc(day(b.profile_submitted_at))) + row('Terms', esc(b.terms_version)) +
        row('Decided', b.decided_at ? esc(day(b.decided_at)) + ' by ' + esc(b.decided_by) : '') + '</tbody></table></div>' +
        (b.description ? '<div class="card"><h3>About</h3>' + String(b.description).split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
        '<div id="decide"><div class="btn-row">' + actions + '</div></div>' +
        '<h3 style="margin-top:1.4rem">Puppies (' + pups.length + ')</h3>' + (pups.length ? pups.map(function (p) {
          return '<div class="puppy-row">' + (p.photos[0] ? '<img class="thumb" src="' + esc(thumb(p.photos[0].url)) + '" alt="">' : '<div class="thumb-empty">No photo</div>') +
            '<div class="meta"><b>' + esc(p.name) + '</b><span class="muted small">' + esc(p.breed) + ', ' + esc(money(p.price_cents)) + '</span><div class="chips">' + listingChips(p) + '</div></div>' +
            '<div class="btn-row" style="margin:0">' + holdButton(p) + '</div></div>';
        }).join('') : '<p class="muted small">None yet.</p>') +
        '<h3 style="margin-top:1.4rem">Payments</h3>' + (data.checkouts.length ? data.checkouts.map(function (c) {
          return '<div class="pay-row"><span>' + esc(day(c.created_at)) + '</span><span>' + c.quantity + ' listing' + (c.quantity === 1 ? '' : 's') + ', ' + esc(money(c.amount_total_cents)) + '</span><span class="pill">' + esc(c.status) + '</span></div>';
        }).join('') : '<p class="muted small">None yet.</p>') +
        '<h3 style="margin-top:1.4rem">Change sign-in email</h3><form id="email-form" class="btn-row" style="margin:0"><input type="email" name="email" aria-label="Sign-in email" value="' + esc(b.email) + '" style="flex:1 1 220px"><button class="btn btn-sm" type="submit">Change</button></form>' +
        '<p class="hint">Changing it signs the breeder out everywhere.</p>' +
        '<h3 style="margin-top:1.4rem">Activity</h3>' + data.audit.slice(0, 20).map(function (a) {
          return '<div class="small" style="padding:.25rem 0;border-top:1px solid var(--line)">' + esc(when(a.at)) + ' · ' + esc(a.action) + ' <span class="muted">by ' + esc(a.actor) + '</span></div>';
        }).join(''),
        function (d) {
          $$('[data-do]', d).forEach(function (btn) {
            btn.addEventListener('click', function () { decide(d, b, btn.dataset.do); });
          });
          wireHolds(d, function () { breederDrawer(id); });
          $('#email-form', d).addEventListener('submit', function (e) {
            e.preventDefault();
            api('PUT', '/api/breeders/' + b.id + '/email', { email: $('[name=email]', d).value }).then(function () { toast('Email changed'); breederDrawer(id); })
              .catch(function (err) { showError($('#email-form', d), err); });
          });
        });
    });
  }

  function decide(d, b, action) {
    var box = $('#decide', d);
    var needsReason = action === 'decline' || action === 'suspend';
    var verb = { approve: 'Approve', decline: 'Decline', suspend: 'Suspend', reinstate: 'Reinstate', reopen: 'Reopen' }[action];
    if (!needsReason && action !== 'approve') { run({}); return; }
    box.innerHTML = '<form id="decide-form" class="card">' +
      (action === 'approve' ? '<p><b>Approve ' + esc(b.business_name) + '?</b> They will be emailed and can start listing right away.</p>'
        : '<div class="field"><label for="d-reason">Private reason, for the record</label><textarea id="d-reason" name="reason" style="min-height:70px"></textarea></div>' +
          (action === 'decline' ? '<div class="field"><label for="d-msg">Message to the breeder (optional)</label><textarea id="d-msg" name="message" style="min-height:70px"></textarea></div>' : '')) +
      '<div class="btn-row"><button class="btn ' + (action === 'approve' ? 'btn-primary' : 'btn-danger') + '" type="submit">' + verb + '</button><button class="btn btn-quiet" type="button" data-cancel>Cancel</button></div></form>';
    var f = $('#decide-form', d);
    $('[data-cancel]', f).addEventListener('click', function () { breederDrawer(b.id); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      run({ reason: ($('[name=reason]', f) || {}).value, message: ($('[name=message]', f) || {}).value });
    });
    function run(body) {
      api('POST', '/api/breeders/' + b.id + '/' + action, body).then(function () {
        toast({ approve: 'Approved', decline: 'Declined', suspend: 'Suspended', reinstate: 'Reinstated', reopen: 'Reopened' }[action]);
        refreshStats().then(function () { breederDrawer(b.id); if (state.route.indexOf('approvals') === 0) approvals(); else if (state.route.indexOf('breeders') === 0) breeders(); });
      }).catch(function (err) { showError(box, err); });
    }
  }

  // ------------------------------------------------------------ listings
  function thumb(url) { return url && url.indexOf('wixstatic.com') >= 0 && url.indexOf('/v1/') < 0 ? url + '/v1/fill/w_120,h_90,al_t,q_80/i.jpg' : url; }
  function listingChips(p) {
    var c = [];
    if (p.is_public) c.push('<span class="pill pill-ok">Live until ' + esc(day(p.expires_at)) + '</span>');
    else if (p.publication_state === 'expired') c.push('<span class="pill pill-warn">Expired</span>');
    else if (p.publication_state === 'draft') c.push('<span class="pill">Draft</span>');
    else if (p.publication_state === 'published') c.push('<span class="pill pill-warn">Paid, hidden</span>');
    if (p.payment_state === 'comped') c.push('<span class="pill pill-gold">Comped</span>');
    if (p.operator_hold) c.push('<span class="pill pill-alert">On hold</span>');
    if (p.availability !== 'available') c.push('<span class="pill">' + esc(p.availability) + '</span>');
    return c.join('');
  }
  function holdButton(p) {
    var comp = (p.publication_state === 'draft' || p.publication_state === 'expired') ? '<button class="btn btn-sm" data-comp="' + esc(p.id) + '">List free</button>' : '';
    return comp + (p.operator_hold ? '<button class="btn btn-sm" data-hold="' + esc(p.id) + '" data-on="0">Release</button>' : '<button class="btn btn-sm btn-danger" data-hold="' + esc(p.id) + '" data-on="1">Hold</button>');
  }
  function wireHolds(root, after) {
    $$('[data-hold]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        api('POST', '/api/puppies/' + b.dataset.hold + '/hold', { on: b.dataset.on === '1' }).then(function () { toast(b.dataset.on === '1' ? 'Listing held' : 'Listing released'); after(); });
      });
    });
    $$('[data-comp]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('List this puppy without payment? It is recorded as comped.')) return;
        api('POST', '/api/puppies/' + b.dataset.comp + '/comp', {}).then(function () { toast('Listed free'); after(); });
      });
    });
  }

  function listings() {
    var f = (state.route.split('?')[1] || '').replace('filter=', '') || 'public';
    Promise.all([refreshStats(), api('GET', '/api/listings?filter=' + f)]).then(function (r) {
      var rows = r[1];
      var tabs = [['public', 'Live'], ['drafts', 'Drafts'], ['expired', 'Expired'], ['held', 'On hold'], ['all', 'All']];
      shell('<h1>Listings</h1><div class="tabs">' + tabs.map(function (t) {
        return '<a class="btn btn-sm' + (f === t[0] ? ' btn-primary' : '') + '" href="#/listings?filter=' + t[0] + '">' + t[1] + '</a>';
      }).join('') + '</div>' + (rows.length ? '<div class="table-wrap"><table class="list"><thead><tr><th></th><th>Puppy</th><th>Breeder</th><th class="num">Price</th><th>State</th><th></th></tr></thead><tbody>' +
        rows.map(function (p) {
          return '<tr><td>' + (p.cover ? '<img class="thumb" src="' + esc(p.cover) + '" alt="" loading="lazy">' : '<div class="thumb-empty">None</div>') + '</td>' +
            '<td><b>' + esc(p.name) + '</b><div class="muted small">' + esc(p.breed) + '</div></td><td>' + esc(p.business_name) + '</td>' +
            '<td class="num">' + esc(money(p.price_cents)) + '</td><td><div class="chips">' + listingChips(p) + '</div></td><td><div class="btn-row" style="margin:0;flex-wrap:nowrap">' + holdButton(p) + '</div></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card"><p>Nothing here.</p></div>'));
      wireHolds(document, listings);
    });
  }

  // ------------------------------------------------------------ payments, settings, activity
  function payments() {
    Promise.all([refreshStats(), api('GET', '/api/checkouts')]).then(function (r) {
      var pill = { paid: 'pill-ok', open: 'pill-gold', needs_review: 'pill-warn', failed: 'pill-alert' };
      shell('<h1>Payments</h1><p class="muted">Every checkout a breeder has started. Refunds and disputes are handled in the Stripe Dashboard and show up here.</p>' +
        (r[1].length ? '<div class="table-wrap"><table class="list"><thead><tr><th>Started</th><th>Breeder</th><th>Puppies</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' +
          r[1].map(function (c) {
            return '<tr><td>' + esc(when(c.created_at)) + '</td><td>' + esc(c.business_name) + '</td><td>' + esc(c.puppies) + '</td><td class="num">' + esc(money(c.amount_total_cents)) + '</td>' +
              '<td><span class="pill ' + (pill[c.status] || '') + '">' + esc(c.status.replace('_', ' ')) + '</span>' + (c.payment_status && c.payment_status !== 'succeeded' ? ' <span class="pill pill-alert">' + esc(c.payment_status) + '</span>' : '') +
              (c.review_reason ? '<div class="small muted">' + esc(c.review_reason) + '</div>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="card"><p>No checkouts yet.</p></div>'));
    });
  }

  var SETTING_LABELS = {
    listing_days: ['How many days a paid listing stays live', 'number'],
    warn_days: ['Days before expiry that breeders are warned', 'number'],
    suspended_listings_visible: ['Keep a suspended breeder\'s listings on the site (1 yes, 0 no)', 'number'],
    min_photos: ['Photos a puppy needs before it can be paid for', 'number'],
    max_photos: ['Most photos a puppy can have', 'number'],
    terms_version: ['Listing terms version breeders accept', 'text'],
  };
  function settings() {
    Promise.all([refreshStats(), api('GET', '/api/settings')]).then(function (r) {
      var rows = r[1].filter(function (s) { return SETTING_LABELS[s.key]; });
      var fixed = r[1].filter(function (s) { return !SETTING_LABELS[s.key]; });
      shell('<h1>Settings</h1><form id="settings" class="card">' + rows.map(function (s) {
        var l = SETTING_LABELS[s.key];
        return '<div class="field"><label for="s-' + esc(s.key) + '">' + esc(l[0]) + '</label><input id="s-' + esc(s.key) + '" name="' + esc(s.key) + '" type="' + l[1] + '" value="' + esc(s.value) + '"></div>';
      }).join('') + '<button class="btn btn-primary" type="submit">Save settings</button></form>' +
        '<div class="card"><h2>Set elsewhere</h2>' + fixed.map(function (s) { return '<p class="small"><b>' + esc(s.key) + '</b>: ' + esc(s.value) + '</p>'; }).join('') +
        '<p class="hint">The listing fee is the Price in Stripe, so it is changed there and in fee_cents together.</p></div>');
      var f = $('#settings');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var body = {}; $$('input', f).forEach(function (i) { body[i.name] = i.value; });
        api('PUT', '/api/settings', body).then(function () { toast('Settings saved'); }).catch(function (err) { showError(f, err); });
      });
    });
  }

  function activity() {
    Promise.all([refreshStats(), api('GET', '/api/audit')]).then(function (r) {
      shell('<h1>Activity</h1><div class="table-wrap"><table class="list"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Record</th></tr></thead><tbody>' +
        r[1].map(function (a) {
          return '<tr><td>' + esc(when(a.at)) + '</td><td>' + esc(a.actor) + ' <span class="muted small">' + esc(a.actor_type) + '</span></td><td>' + esc(a.action) + '</td><td class="small muted">' + esc(a.entity) + ' ' + esc(a.entity_id) + '</td></tr>';
        }).join('') + '</tbody></table></div>');
    });
  }

  function render() {
    closeDrawer();
    state.route = (location.hash || '#/').replace(/^#\/?/, '');
    var r = state.route.split('?')[0].split('/')[0];
    ({ '': overview, approvals: approvals, breeders: breeders, listings: listings, payments: payments, settings: settings, activity: activity }[r] || overview)();
  }
  window.addEventListener('hashchange', render);

  api('GET', '/api/whoami').then(function (w) { state.who = w; render(); })
    .catch(function (err) { app.innerHTML = '<main class="plain-card" style="margin:3rem auto"><h1>Not signed in</h1><p>' + esc(err.message) + '</p></main>'; });
})();
