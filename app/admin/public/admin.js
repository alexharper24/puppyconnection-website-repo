/* Amber's operator screens. The same shell, list and drawer as the breeder portal, answering
   different questions: who is waiting, who is paused, what is live, what needs attention. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var state = { who: null, stats: null, route: '' };
  var PAGE = 25;

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
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function params() {
    var out = {}; (state.route.split('?')[1] || '').split('&').forEach(function (kv) {
      if (!kv) return; var i = kv.indexOf('='); out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
    });
    return out;
  }
  function norm(s) { return String(s || '').toLowerCase(); }

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
    if (lastFocus && lastFocus.focus && document.body.contains(lastFocus)) lastFocus.focus();
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

  // ------------------------------------------------------------ shell
  function shell(inner, narrow) {
    var s = state.stats || {};
    var route = state.route.split('?')[0].split('/')[0];
    var groups = [
      ['Today', [['', 'Overview'], ['approvals', 'Approvals', s.queue]]],
      ['Directory', [['breeders', 'Breeders', s.approved], ['listings', 'Listings', s.public_puppies]]],
      ['Money', [['payments', 'Payments', s.needs_review || null]]],
      ['Site', [['settings', 'Settings'], ['activity', 'Activity']]],
    ];
    var waiting = s.unpublished_changes || 0;
    var q = route === 'search' ? params().q || '' : '';
    app.innerHTML = '<div class="app"><aside class="rail" aria-label="Main menu">' +
      '<div class="rail-head"><a href="#/" aria-label="Puppy Connection operator, overview"><img src="/logo-white.webp?v=1" alt="Puppy Connection" width="420" height="203"></a><span class="role">Operator</span></div>' +
      '<nav class="nav">' + groups.map(function (g) {
        return '<div class="nav-group">' + esc(g[0]) + '</div>' + g[1].map(function (n) {
          return '<a href="#/' + n[0] + '"' + (route === n[0] ? ' class="is-on" aria-current="page"' : '') + (n[2] ? ' aria-label="' + esc(n[1] + ', ' + n[2]) + '"' : '') + '><span>' + esc(n[1]) + '</span>' +
            (n[2] ? '<span class="tally">' + n[2] + '</span>' : '') + '</a>';
        }).join('');
      }).join('') +
      // The mailbox follows EMAIL_MODE alone (plan P7.3), so staging keeps it until real email is on.
      (state.who.email_mode === 'log' ? '<a href="/dev/mail" target="_blank" rel="noopener"><span>Mailbox</span></a>' : '') + '</nav>' +
      '<div class="rail-foot"><span class="dot' + (waiting ? ' wait' : '') + '"></span><div><b>' + (waiting ? 'Changes waiting' : 'Site up to date') + '</b><span>' +
        (waiting ? plural(waiting, 'change') + ' not on the site yet' : 'Nothing waiting to publish') + '</span></div></div></aside>' +
      '<div class="main"><header class="topbar"><form class="finder" id="finder" role="search"><label class="sr" for="find">Search breeders and puppies</label>' +
        '<input id="find" name="q" type="search" placeholder="Search breeders, puppies, emails" value="' + esc(q) + '"></form>' +
        '<div class="who"><span class="name">' + esc(state.who.name) + '</span></div></header>' +
      '<main class="work" id="content"><div class="view' + (narrow ? ' view-narrow' : '') + '">' +
      (!state.who.notices ? '' : state.who.dev ? '<p class="notice notice-sim">Local simulation. You are signed in as ' + esc(state.who.email) + ' through DEV_IDENTITY, which stands in for Cloudflare Access. Every test email is in the <a href="/dev/mail" target="_blank" rel="noopener">test mailbox</a>, and payments are ' + esc(state.who.payments_mode) + '.</p>'
        : state.who.email_mode === 'log' ? '<p class="notice notice-sim">This is the test copy. Every email lands in the <a href="/dev/mail" target="_blank" rel="noopener">test mailbox</a> instead of being sent, and payments are ' + esc(state.who.payments_mode) + '.</p>' : '') +
      inner + '</div></main></div></div>';
    $('#finder').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#find').value.trim(); if (v) location.hash = '#/search?q=' + encodeURIComponent(v);
    });
  }
  function head(title, lede, actions) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</div>' +
      (actions ? '<div class="head-actions">' + actions + '</div>' : '') + '</div>';
  }
  function empty(title, text, action) {
    return '<div class="empty"><b>' + esc(title) + '</b>' + (text ? '<span>' + esc(text) + '</span>' : '') + (action || '') + '</div>';
  }

  /* One list for every table: a toolbar, the rows for the current page, and a pager. Typing
     redraws only the rows, so the search box keeps focus. */
  function list(root, cfg) {
    var page = 0;
    var box = $('[data-rows]', root), pager = $('[data-pager]', root), count = $('[data-count]', root), find = $('[data-find]', root), pick = $('[data-pick]', root);
    function rows() {
      var q = find ? norm(find.value).trim() : '', p = pick ? pick.value : '';
      return cfg.rows.filter(function (r) { return (!q || norm(cfg.text(r)).indexOf(q) >= 0) && (!p || cfg.pick(r) === p); });
    }
    function draw() {
      var all = rows(), pages = Math.max(1, Math.ceil(all.length / PAGE));
      if (page >= pages) page = pages - 1;
      var shown = all.slice(page * PAGE, page * PAGE + PAGE);
      box.innerHTML = shown.length ? '<div class="table-wrap"><table class="list"><thead><tr>' + cfg.head + '</tr></thead><tbody>' + shown.map(cfg.row).join('') + '</tbody></table></div>'
        : empty(cfg.rows.length ? 'Nothing matches' : cfg.emptyTitle, cfg.rows.length ? 'Try a different search or filter.' : cfg.emptyText);
      if (count) count.textContent = all.length ? (page * PAGE + 1) + ' to ' + (page * PAGE + shown.length) + ' of ' + all.length : '0 shown';
      pager.innerHTML = pages > 1 ? '<button class="btn btn-sm" data-prev' + (page ? '' : ' disabled') + '>Previous</button><span class="muted">Page ' + (page + 1) + ' of ' + pages + '</span>' +
        '<button class="btn btn-sm" data-next' + (page < pages - 1 ? '' : ' disabled') + '>Next</button>' : '';
      pager.hidden = pages < 2;
      var pv = $('[data-prev]', pager), nx = $('[data-next]', pager);
      if (pv) pv.addEventListener('click', function () { page -= 1; draw(); root.scrollIntoView({ block: 'start' }); });
      if (nx) nx.addEventListener('click', function () { page += 1; draw(); root.scrollIntoView({ block: 'start' }); });
      if (cfg.wire) cfg.wire(box);
    }
    if (find) find.addEventListener('input', function () { page = 0; draw(); });
    if (pick) pick.addEventListener('change', function () { page = 0; draw(); });
    draw();
  }
  function listPanel(opts) {
    return '<section class="panel" id="' + opts.id + '"><div class="toolbar">' +
      (opts.find ? '<label class="sr" for="' + opts.id + '-find">' + esc(opts.find) + '</label><input id="' + opts.id + '-find" type="search" data-find placeholder="' + esc(opts.find) + '" value="' + esc(opts.q || '') + '">' : '') +
      (opts.pick ? '<label class="sr" for="' + opts.id + '-pick">' + esc(opts.pick[0]) + '</label><select id="' + opts.id + '-pick" data-pick><option value="">' + esc(opts.pick[0]) + '</option>' +
        opts.pick[1].map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>' : '') +
      (opts.tabs || '') + '<span class="count" data-count></span></div><div data-rows></div><div class="pager" data-pager hidden></div></section>';
  }
  function seg(base, current, tabs, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label) + '">' + tabs.map(function (t) {
      return '<a href="#/' + base + (t[0] ? '?' + t[0] : '') + '"' + (current === t[0] ? ' class="on" aria-current="true"' : '') + '>' + esc(t[1]) + '</a>';
    }).join('') + '</div>';
  }
  function wireRows(root, onOpen) {
    $$('[data-open]', root).forEach(function (tr) {
      tr.addEventListener('click', function (e) { if (!e.target.closest('button, a')) onOpen(tr.dataset.open); });
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target === tr) onOpen(tr.dataset.open); });
    });
  }

  function refreshStats() { return api('GET', '/api/stats').then(function (s) { state.stats = s; return s; }); }

  // ------------------------------------------------------------ overview
  function overview() {
    refreshStats().then(function (s) {
      var todo = [
        [s.queue, 'breeder', 'breeders', 'waiting for your approval', '#/approvals', 'Review'],
        [s.needs_review, 'payment', 'payments', 'to review, where money arrived and no listing went live', '#/payments', 'Open'],
        [s.held, 'listing', 'listings', 'on hold', '#/listings?filter=held', 'Open'],
        [s.unpublished_changes, 'change', 'changes', 'not on the public site yet', '#/settings', 'Details'],
        [s.close_requests, 'breeder', 'breeders', 'asked to close their account', '#/breeders?status=closing', 'Open'],
      ].filter(function (t) { return t[0]; });
      shell(head('Overview', 'What needs you today, and how the directory stands.') +
        '<div class="stats">' +
        '<a class="stat" href="#/approvals"><b>' + s.queue + '</b><span>Waiting for approval</span></a>' +
        '<a class="stat" href="#/listings"><b>' + s.public_puppies + '</b><span>Puppies live on the site</span></a>' +
        '<a class="stat" href="#/breeders?status=approved"><b>' + s.approved + '</b><span>Approved breeders</span></a>' +
        '<a class="stat" href="#/listings?filter=drafts"><b>' + s.drafts + '</b><span>Drafts not yet paid for</span></a></div>' +
        '<div class="cols"><section class="card"><h2>Needs attention</h2>' + (todo.length ? '<ul class="attention">' + todo.map(function (t) {
          return '<li><span><b>' + plural(t[0], t[1], t[2]) + '</b> ' + esc(t[3]) + '</span><a class="btn btn-sm" href="' + t[4] + '">' + t[5] + '</a></li>';
        }).join('') + '</ul>' : '<p class="muted">Nothing needs you right now.</p>') + '</section>' +
        '<section class="card"><h2>Sign-ups and checkouts</h2><ul class="attention">' +
          '<li><span><b>' + plural(s.signing_up, 'breeder') + '</b> still signing up</span><a class="btn btn-sm" href="#/breeders?status=signing_up">Open</a></li>' +
          '<li><span><b>' + plural(s.open_checkouts, 'checkout') + '</b> started and not finished</span><a class="btn btn-sm" href="#/payments">Open</a></li>' +
          '<li><span><b>' + plural(s.suspended, 'breeder') + '</b> suspended</span><a class="btn btn-sm" href="#/breeders?status=suspended">Open</a></li>' +
        '</ul></section></div>');
    });
  }

  // ------------------------------------------------------------ breeders
  var BREEDER_HEAD = '<th>Breeder</th><th class="hide-sm">Where</th><th>Status</th><th class="num">Live</th><th class="hide-md">Joined</th>';
  function breederRow(b) {
    return '<tr class="clickable" data-open="' + esc(b.id) + '" tabindex="0" aria-label="Open ' + esc(b.business_name || b.email) + '"><td><b>' + esc(b.business_name || '(no name yet)') + '</b><span class="sub">' + esc(b.email) + (b.legacy ? ', imported from Wix' : '') + '</span></td>' +
      '<td class="hide-sm">' + esc([b.city, b.state].filter(Boolean).join(', ')) + '</td><td>' + breederPill(b) + '</td><td class="num">' + b.public_puppies + ' of ' + b.puppies + '</td><td class="hide-md">' + esc(day(b.created_at)) + '</td></tr>';
  }
  function breederText(b) { return [b.business_name, b.email, b.city, b.state, b.public_email, b.public_phone].join(' '); }

  function approvals() {
    Promise.all([refreshStats(), api('GET', '/api/breeders?status=queue')]).then(function (r) {
      shell(head('Approvals', 'Breeders who finished their profile and accepted the terms, oldest first. Open one to approve or decline.') +
        listPanel({ id: 'queue', find: 'Search the queue' }));
      list($('#queue'), { rows: r[1], head: BREEDER_HEAD, row: breederRow, text: breederText,
        emptyTitle: 'Nobody is waiting', emptyText: 'New breeders appear here once they submit their profile.', wire: function (box) { wireRows(box, breederDrawer); } });
      var id = state.route.split('?')[0].split('/')[1]; if (id) breederDrawer(id);
    });
  }

  function breeders() {
    var p = params(), f = p.status || '';
    Promise.all([refreshStats(), api('GET', '/api/breeders' + (f ? '?status=' + f : ''))]).then(function (r) {
      var tabs = [['', 'All'], ['status=queue', 'Waiting'], ['status=signing_up', 'Signing up'], ['status=approved', 'Approved'], ['status=suspended', 'Suspended'], ['status=declined', 'Declined'], ['status=closing', 'Asked to close']];
      shell(head('Breeders', 'Every breeder account, including the ones imported from Wix. Open one to see their puppies, payments and history.') +
        listPanel({ id: 'breeders', find: 'Name, email or town', q: p.q, tabs: seg('breeders', f ? 'status=' + f : '', tabs, 'Breeder status') }));
      list($('#breeders'), { rows: r[1], head: BREEDER_HEAD, row: breederRow, text: breederText,
        emptyTitle: 'No breeders here', emptyText: 'Nobody has this status right now.', wire: function (box) { wireRows(box, breederDrawer); } });
    });
  }

  function breederDrawer(id) {
    api('GET', '/api/breeders/' + id).then(function (data) {
      var b = data.breeder, x = data.extras;
      var pups = []; data.litters.forEach(function (l) { l.puppies.forEach(function (p) { if (p.publication_state !== 'archived') { p.breed = l.breed_name; pups.push(p); } }); });
      var actions = {
        pending: b.profile_submitted_at ? '<button class="btn btn-primary" data-do="approve">Approve</button><button class="btn btn-danger" data-do="decline">Decline</button>' : '<p class="muted small">Still signing up. Approval opens when they submit their profile.</p>',
        approved: '<button class="btn btn-danger" data-do="suspend">Suspend</button>',
        suspended: '<button class="btn btn-primary" data-do="reinstate">Reinstate</button>',
        declined: '<button class="btn" data-do="reopen">Reopen application</button>',
      }[b.status];
      function row(k, v) { return v ? '<tr><td>' + esc(k) + '</td><td>' + v + '</td></tr>' : ''; }
      openDrawer(b.business_name || b.email,
        '<p>' + breederPill(b) + (b.status_reason ? ' <span class="muted small">Reason on record: ' + esc(b.status_reason) + '</span>' : '') + '</p>' +
        '<table class="kv"><tbody>' +
        row('Sign-in email', esc(b.email)) + row('Contact name', esc(b.contact_name)) + row('Public phone', esc(b.public_phone)) +
        row('Public email', esc(b.public_email)) + row('Where', esc([b.city, b.state].filter(Boolean).join(', '))) +
        row('Website', b.website_url ? '<a href="' + esc(b.website_url) + '" target="_blank" rel="noopener">' + esc(b.website_url) + '</a>' : '') +
        row('Joined', esc(day(b.created_at))) + row('Submitted', esc(day(b.profile_submitted_at))) + row('Terms', esc(b.terms_version)) +
        row('Decided', b.decided_at ? esc(day(b.decided_at)) + ' by ' + esc(b.decided_by) : '') +
        row('Facebook', x.facebook_url ? '<a href="' + esc(x.facebook_url) + '" target="_blank" rel="noopener">' + esc(x.facebook_url) + '</a>' : '') +
        row('Breeds raised', esc(x.breeds.map(function (r) { return r.name; }).join(', '))) + '</tbody></table>' +
        (x.logo_url || x.kennel_url ? '<div class="brand-pics">' + (x.logo_url ? '<figure><img src="' + esc(x.logo_url) + '&size=card" alt="' + esc(b.business_name) + ' logo"><figcaption>Logo</figcaption></figure>' : '') +
          (x.kennel_url ? '<figure><img src="' + esc(x.kennel_url) + '&size=card" alt="' + esc(b.business_name) + ' kennel photo"><figcaption>Kennel photo</figcaption></figure>' : '') + '</div>' : '') +
        (b.description ? '<div class="card"><h3 style="margin-top:0">About</h3>' + String(b.description).split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
        (data.close_request ? '<div class="notice notice-alert" id="close-req"><p><b>Asked to close their account</b> on ' + esc(day(data.close_request.created_at)) + '.' +
          (data.close_request.reason ? ' Their reason: ' + esc(data.close_request.reason) : '') + '</p><p class="small">Nothing has been removed. Follow up with them, then mark it handled.</p>' +
          '<div class="btn-row"><button class="btn btn-sm" id="close-handled">Mark handled</button></div></div>' : '') +
        '<div id="decide"><div class="btn-row">' + actions + '</div></div>' +
        '<h3>Puppies (' + pups.length + ')</h3>' + (pups.length ? pups.map(function (p) {
          return '<div class="puppy-row">' + (p.photos[0] ? '<img class="thumb" src="' + esc(thumb(p.photos[0].url)) + '" alt="" loading="lazy">' : '<div class="thumb-empty">No photo</div>') +
            '<div class="meta"><b>' + esc(p.name) + '</b><span class="muted small">' + esc(p.breed) + ', ' + esc(money(p.price_cents)) + '</span><div class="chips">' + listingChips(p) + '</div></div>' +
            '<div class="btn-row">' + holdButton(p) + '</div></div>';
        }).join('') : '<p class="muted small">None yet.</p>') +
        '<h3>Payments</h3>' + (data.checkouts.length ? data.checkouts.map(function (c) {
          return '<div class="pay-row"><span>' + esc(day(c.created_at)) + '</span><span>' + plural(c.quantity, 'listing') + ', ' + esc(money(c.amount_total_cents)) + '</span><span class="pill">' + esc(c.status) + '</span></div>';
        }).join('') : '<p class="muted small">None yet.</p>') +
        '<h3>Change sign-in email</h3><form id="email-form" class="btn-row" style="margin:0"><input type="email" name="email" aria-label="Sign-in email" value="' + esc(b.email) + '" style="flex:1 1 220px"><button class="btn btn-sm" type="submit">Change</button></form>' +
        '<p class="hint">Changing it signs the breeder out everywhere.</p>' +
        '<h3>Activity</h3>' + (data.audit.length ? data.audit.slice(0, 20).map(function (a) {
          return '<div class="small" style="padding:.3rem 0;border-top:1px solid var(--line)">' + esc(when(a.at)) + ', ' + esc(a.action) + ' <span class="muted">by ' + esc(a.actor) + '</span></div>';
        }).join('') : '<p class="muted small">Nothing yet.</p>'),
        function (d) {
          $$('[data-do]', d).forEach(function (btn) { btn.addEventListener('click', function () { decide(d, b, btn.dataset.do); }); });
          wireHolds(d, function () { breederDrawer(id); });
          var ch = $('#close-handled', d);
          if (ch) ch.addEventListener('click', function () {
            api('POST', '/api/breeders/' + b.id + '/close-request/resolve', {}).then(function () { toast('Marked handled'); refreshStats(); breederDrawer(id); })
              .catch(function (err) { showError($('#close-req', d), err); });
          });
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
  function thumb(url) {
    if (url && url.indexOf('wixstatic.com') >= 0 && url.indexOf('/v1/') < 0) return url + '/v1/fill/w_120,h_90,al_t,q_80,enc_auto/i.jpg';
    return /^\/media\/[\w-]+$/.test(url || '') ? url + '/card' : url;
  }
  function listingChips(p) {
    var c = [];
    if (p.is_public) c.push('<span class="pill pill-ok">' + (p.expires_at ? 'Live until ' + esc(day(p.expires_at)) : 'Live') + '</span>');
    else if (p.publication_state === 'expired') c.push('<span class="pill pill-warn">Expired</span>');
    else if (p.publication_state === 'draft') c.push('<span class="pill">Draft</span>');
    else if (p.publication_state === 'published') c.push('<span class="pill pill-warn">Paid, hidden</span>');
    if (p.payment_state === 'comped') c.push('<span class="pill pill-gold">Comped</span>');
    if (p.operator_hold) c.push('<span class="pill pill-alert">On hold</span>');
    if (p.availability && p.availability !== 'available') c.push('<span class="pill">' + (p.availability === 'placed' ? 'Placed' : 'Pending') + '</span>');
    return c.join('');
  }
  function holdButton(p) {
    var comp = (p.publication_state === 'draft' || p.publication_state === 'expired') ? '<button class="btn btn-sm" data-comp="' + esc(p.id) + '">List free</button>' : '';
    return comp + (p.operator_hold ? '<button class="btn btn-sm" data-hold="' + esc(p.id) + '" data-on="0">Release</button>' : '<button class="btn btn-sm btn-danger" data-hold="' + esc(p.id) + '" data-on="1">Hold</button>');
  }
  function wireHolds(root, after) {
    $$('[data-hold]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.on === '1' && !confirm('Take this listing off the site until you release it? The breeder sees it as paused.')) return;
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
  var LISTING_HEAD = '<th></th><th>Puppy</th><th class="hide-sm">Breeder</th><th class="num">Price</th><th>State</th><th class="act hide-sm"></th>';
  function listingRow(p) {
    return '<tr><td>' + (p.cover ? '<img class="thumb" src="' + esc(thumb(p.cover)) + '" alt="" loading="lazy">' : '<div class="thumb-empty">No photo</div>') + '</td>' +
      '<td><b>' + esc(p.name) + '</b><span class="sub">' + esc(p.breed) + '</span></td><td class="hide-sm">' + esc(p.business_name) + '</td>' +
      '<td class="num">' + esc(money(p.price_cents)) + '</td><td><div class="chips">' + listingChips(p) + '</div></td><td class="act hide-sm"><div class="btn-row">' + holdButton(p) + '</div></td></tr>';
  }
  function listingText(p) { return [p.name, p.breed, p.business_name].join(' '); }

  function listings() {
    var p = params(), f = p.filter || 'public';
    Promise.all([refreshStats(), api('GET', '/api/listings?filter=' + f)]).then(function (r) {
      var rows = r[1];
      var breeds = rows.map(function (x) { return x.breed; }).filter(function (b, i, a) { return b && a.indexOf(b) === i; }).sort();
      var tabs = [['filter=public', 'Live'], ['filter=drafts', 'Drafts'], ['filter=expired', 'Expired'], ['filter=held', 'On hold'], ['filter=all', 'All']];
      shell(head('Listings', 'Every puppy on the directory and where it stands. Hold takes a listing off the site, and List free publishes one without payment.') +
        listPanel({ id: 'listings', find: 'Puppy, breed or breeder', q: p.q, pick: ['All breeds', breeds], tabs: seg('listings', 'filter=' + f, tabs, 'Listing state') }));
      list($('#listings'), { rows: rows, head: LISTING_HEAD, row: listingRow, text: listingText, pick: function (x) { return x.breed; },
        emptyTitle: { public: 'Nothing is live', drafts: 'No drafts', expired: 'Nothing has expired', held: 'Nothing is on hold', all: 'No listings yet' }[f],
        emptyText: f === 'held' ? 'Listings you hold appear here until you release them.' : '', wire: function (box) { wireHolds(box, listings); } });
    });
  }

  // ------------------------------------------------------------ search across breeders and listings
  function search() {
    var q = norm(params().q).trim();
    Promise.all([refreshStats(), api('GET', '/api/breeders'), api('GET', '/api/listings?filter=all')]).then(function (r) {
      var bs = r[1].filter(function (b) { return norm(breederText(b)).indexOf(q) >= 0; });
      var ls = r[2].filter(function (p) { return norm(listingText(p)).indexOf(q) >= 0; });
      shell(head('Search', 'Results for “' + esc(params().q || '') + '” across breeders and listings.') +
        '<h2>Breeders (' + bs.length + ')</h2>' + listPanel({ id: 'sb' }) + '<h2 style="margin-top:1.4rem">Listings (' + ls.length + ')</h2>' + listPanel({ id: 'sl' }));
      list($('#sb'), { rows: bs, head: BREEDER_HEAD, row: breederRow, text: breederText, emptyTitle: 'No breeders match', emptyText: '', wire: function (box) { wireRows(box, breederDrawer); } });
      list($('#sl'), { rows: ls, head: LISTING_HEAD, row: listingRow, text: listingText, emptyTitle: 'No listings match', emptyText: '', wire: function (box) { wireHolds(box, search); } });
    });
  }

  // ------------------------------------------------------------ payments, settings, activity
  function payments() {
    Promise.all([refreshStats(), api('GET', '/api/checkouts')]).then(function (r) {
      var pill = { paid: 'pill-ok', open: 'pill-gold', needs_review: 'pill-warn', failed: 'pill-alert' };
      shell(head('Payments', 'Every checkout a breeder has started. Refunds and disputes are handled in the Stripe Dashboard and show up here.') +
        listPanel({ id: 'pay', find: 'Breeder or puppy' }));
      list($('#pay'), { rows: r[1], text: function (c) { return [c.business_name, c.puppies].join(' '); },
        head: '<th>Started</th><th>Breeder</th><th class="hide-sm">Puppies</th><th class="num">Amount</th><th>Status</th>',
        row: function (c) {
          return '<tr><td>' + esc(when(c.created_at)) + '</td><td>' + esc(c.business_name) + '</td><td class="hide-sm">' + esc(c.puppies) + '</td><td class="num">' + esc(money(c.amount_total_cents)) + '</td>' +
            '<td><span class="pill ' + (pill[c.status] || '') + '">' + esc(String(c.status).replace('_', ' ')) + '</span>' + (c.payment_status && c.payment_status !== 'succeeded' ? ' <span class="pill pill-alert">' + esc(c.payment_status) + '</span>' : '') +
            (c.review_reason ? '<span class="sub">' + esc(c.review_reason) + '</span>' : '') + '</td></tr>';
        },
        emptyTitle: 'No checkouts yet', emptyText: 'A row appears here the moment a breeder starts paying to list.' });
    });
  }

  var SETTING_LABELS = {
    listing_days: ['Days a payment lists a puppy. 0 means it stays up until removed, as a one-time payment', 'number'],
    warn_days: ['Days before expiry that breeders are warned, when listings expire', 'number'],
    suspended_listings_visible: ['Keep a suspended breeder\'s listings on the site (1 yes, 0 no)', 'number'],
    min_photos: ['Photos a puppy needs before it can be paid for', 'number'],
    max_photos: ['Most photos a puppy can have', 'number'],
    terms_version: ['Listing terms version breeders accept', 'text'],
  };
  var JOB_LABELS = {
    expiry: ['Listing expiry', 'Every morning, when listings have an end date. Warns breeders before a listing ends, then takes ended listings off the site.'],
    housekeeping: ['Housekeeping', 'Every morning. Clears used sign-in links, ended sessions and stale checkout holds.'],
    backup: ['Backup', 'Every morning. Saves every table to the photo bucket and keeps 90 days.'],
    reconcile: ['Checkout check', 'Every 15 minutes. Closes abandoned checkouts and publishes any paid listing that is not live.'],
  };
  function jobSummary(job, r) {
    if (!r) return '';
    if (job === 'expiry') return r.off ? 'Off, because listings do not expire' : plural(r.warned || 0, 'warning') + ' sent, ' + plural(r.expired || 0, 'listing') + ' expired';
    if (job === 'housekeeping') return (r.tokens || 0) + ' links, ' + (r.sessions || 0) + ' sessions and ' + (r.holds || 0) + ' holds cleared';
    if (job === 'backup') return r.rows ? r.rows.toLocaleString('en-US') + ' rows, ' + Math.round((r.bytes || 0) / 1024) + ' KB' : '';
    if (job === 'reconcile') return plural(r.closed || 0, 'checkout') + ' closed, ' + (r.fulfilled || 0) + ' published';
    return r.error || '';
  }
  function settings() {
    Promise.all([refreshStats(), api('GET', '/api/settings'), api('GET', '/api/jobs')]).then(function (r) {
      var rows = r[1].filter(function (s) { return SETTING_LABELS[s.key]; });
      var fixed = r[1].filter(function (s) { return !SETTING_LABELS[s.key]; });
      var waiting = state.stats.unpublished_changes || 0;
      shell(head('Settings', 'How listings behave. A change here applies to the next listing, payment or expiry check.') +
        '<section class="card"><h2>The public site</h2><p>' + (waiting ? plural(waiting, 'change') + ' waiting to reach the site.' : 'The site is up to date.') + '</p>' +
        '<p class="muted small">The test copy reads the database live, so a change shows within about a minute and a half. The production site publishes every five minutes.</p></section>' +
        '<form id="settings" class="card"><h2>Listings</h2>' + rows.map(function (s) {
          var l = SETTING_LABELS[s.key];
          return '<div class="field"><label for="s-' + esc(s.key) + '">' + esc(l[0]) + '</label><input id="s-' + esc(s.key) + '" name="' + esc(s.key) + '" type="' + l[1] + '" value="' + esc(s.value) + '"></div>';
        }).join('') + '<button class="btn btn-primary" type="submit">Save settings</button></form>' +
        '<section class="card"><h2>Scheduled jobs</h2><p class="muted small">These run on their own. Run now does the same thing straight away, which is handy when showing how expiry works.</p>' +
        '<div class="table-wrap"><table class="list"><thead><tr><th>Job</th><th class="hide-sm">Last run</th><th>Result</th><th class="act"></th></tr></thead><tbody>' +
        r[2].map(function (j) {
          return '<tr><td><b>' + esc(JOB_LABELS[j.job][0]) + '</b><span class="sub">' + esc(JOB_LABELS[j.job][1]) + '</span></td><td class="hide-sm when">' + (j.last_run_at ? esc(when(j.last_run_at)) : '<span class="muted">Not yet</span>') + '</td>' +
            '<td>' + (j.last_error ? '<span class="pill pill-alert">Failed</span><span class="sub">' + esc(j.last_error) + '</span>' : j.last_result ? '<span class="small">' + esc(jobSummary(j.job, j.last_result)) + '</span>' : '') + '</td>' +
            '<td class="act"><button class="btn btn-sm" data-run="' + esc(j.job) + '">Run now</button></td></tr>';
        }).join('') + '</tbody></table></div></section>' +
        '<section class="card"><h2>Set elsewhere</h2>' + fixed.map(function (s) { return '<p class="small"><b>' + esc(s.key) + '</b>: ' + esc(s.value) + '</p>'; }).join('') +
        '<p class="hint">The listing fee is the Price in Stripe, so it is changed there and in fee_cents together.</p></section>', true);
      $$('[data-run]').forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true; b.textContent = 'Running';
          api('POST', '/api/jobs/' + b.dataset.run + '/run', {}).then(function (r) { toast(JOB_LABELS[r.job][0] + ': ' + jobSummary(r.job, r)); settings(); })
            .catch(function (err) { toast(err.message); settings(); });
        });
      });
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
      shell(head('Activity', 'Everything breeders and operators have done, newest first.') + listPanel({ id: 'audit', find: 'Who, what or record' }));
      list($('#audit'), { rows: r[1], text: function (a) { return [a.actor, a.action, a.entity, a.entity_id].join(' '); },
        head: '<th>When</th><th>Who</th><th>What</th><th class="hide-md">Record</th>',
        row: function (a) {
          return '<tr><td class="when">' + esc(when(a.at)) + '</td><td>' + esc(a.actor) + '<span class="sub">' + esc(a.actor_type) + '</span></td><td>' + esc(a.action) + '</td><td class="small muted hide-md">' + esc(a.entity) + ' ' + esc(a.entity_id) + '</td></tr>';
        },
        emptyTitle: 'Nothing has happened yet', emptyText: 'Sign-ups, approvals, edits and payments are recorded here as they happen.' });
    });
  }

  function render() {
    closeDrawer();
    state.route = (location.hash || '#/').replace(/^#\/?/, '');
    var r = state.route.split('?')[0].split('/')[0];
    ({ '': overview, approvals: approvals, breeders: breeders, listings: listings, payments: payments, settings: settings, activity: activity, search: search }[r] || overview)();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  api('GET', '/api/whoami').then(function (w) { state.who = w; render(); })
    .catch(function (err) { app.innerHTML = '<main class="plain-card" style="margin:3rem auto"><h1>Not signed in</h1><p>' + esc(err.message) + '</p></main>'; });
})();
