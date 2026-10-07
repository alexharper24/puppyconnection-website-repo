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
      ['Directory', [['breeders', 'Breeders', s.approved], ['listings', 'Listings', s.public_puppies], ['breeds', 'Breeds']]],
      ['Money', [['payments', 'Payments', s.needs_review || null], ['reports', 'Reports']]],
      ['Site', [['publish', 'Publish', s.unpublished_changes || null], ['terms', 'Terms'], ['email', 'Email log'], ['settings', 'Settings'], ['activity', 'Activity']]],
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
      '<a class="rail-foot" href="#/publish"><span class="dot' + (waiting ? ' wait' : '') + '"></span><div><b>' + (waiting ? 'Changes waiting' : 'Site up to date') + '</b><span>' +
        (waiting ? plural(waiting, 'change') + ' not on the site yet' : 'Nothing waiting to publish') + '</span></div></a></aside>' +
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
  /* A sortable column heading. cfg.sorts[key] gives the value a row sorts by; numbers sort as
     numbers, text alphabetically, and an empty value always goes last. */
  function sh(key, label, cls) {
    return '<th' + (cls ? ' class="' + cls + '"' : '') + ' data-sort="' + key + '" aria-sort="none"><button type="button" class="sort">' + esc(label) + '</button></th>';
  }
  function compare(a, b) {
    var ea = a == null || a === '', eb = b == null || b === '';
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), 'en-US', { numeric: true, sensitivity: 'base' });
  }

  function list(root, cfg) {
    var page = 0, sort = cfg.sort ? { key: cfg.sort[0], dir: cfg.sort[1] || 1 } : null;
    var box = $('[data-rows]', root), pager = $('[data-pager]', root), count = $('[data-count]', root), find = $('[data-find]', root), pick = $('[data-pick]', root);
    function rows() {
      var q = find ? norm(find.value).trim() : '', p = pick ? pick.value : '';
      var out = cfg.rows.filter(function (r) { return (!q || norm(cfg.text(r)).indexOf(q) >= 0) && (!p || cfg.pick(r) === p); });
      if (sort && cfg.sorts && cfg.sorts[sort.key]) {
        var get = cfg.sorts[sort.key];
        out = out.map(function (r, i) { return [r, i]; }).sort(function (x, y) {
          var va = get(x[0]), vb = get(y[0]), ea = va == null || va === '', eb = vb == null || vb === '';
          if (ea || eb) return ea === eb ? x[1] - y[1] : ea ? 1 : -1;   // empty values stay last either way
          return sort.dir * compare(va, vb) || x[1] - y[1];
        }).map(function (x) { return x[0]; });
      }
      return out;
    }
    function draw() {
      var all = rows(), pages = Math.max(1, Math.ceil(all.length / PAGE));
      if (page >= pages) page = pages - 1;
      var shown = all.slice(page * PAGE, page * PAGE + PAGE);
      box.innerHTML = shown.length ? '<div class="table-wrap"><table class="list"><thead><tr>' + cfg.head + '</tr></thead><tbody>' + shown.map(cfg.row).join('') + '</tbody></table></div>'
        : empty(cfg.rows.length ? 'Nothing matches' : cfg.emptyTitle, cfg.rows.length ? 'Try a different search or filter.' : cfg.emptyText);
      $$('th[data-sort]', box).forEach(function (th) {
        var k = th.dataset.sort;
        if (sort && sort.key === k) th.setAttribute('aria-sort', sort.dir > 0 ? 'ascending' : 'descending');
        $('.sort', th).addEventListener('click', function () {
          sort = sort && sort.key === k ? { key: k, dir: -sort.dir } : { key: k, dir: (cfg.sortFirst && cfg.sortFirst[k]) || 1 };
          page = 0; draw();
          var again = $('th[data-sort="' + k + '"] .sort', box); if (again) again.focus();
        });
      });
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
  /* Plan P3.9. Everything that needs an operator, from /api/attention: approvals, payments to
     review, disputes, a failed publish or job, close requests, and public contact details
     that changed in the last week. */
  var JOB_NAMES = { expiry: 'Listing expiry', housekeeping: 'Housekeeping', backup: 'Backup', reconcile: 'Checkout check', links: 'Breeder link check' };
  function attentionItems(a) {
    var li = function (text, href, btn, sub) {
      return '<li><span>' + text + (sub ? '<span class="att-sub">' + sub + '</span>' : '') + '</span><a class="btn btn-sm" href="' + href + '">' + btn + '</a></li>';
    };
    var out = [];
    if (a.queue) out.push(li('<b>' + plural(a.queue, 'breeder') + '</b> waiting for your approval', '#/approvals', 'Review'));
    if (a.needs_review) out.push(li('<b>' + plural(a.needs_review, 'payment') + '</b> to review, where money arrived and no listing went live', '#/payments?status=needs_review', 'Open'));
    if (a.open_disputes) out.push(li('<b>' + plural(a.open_disputes, 'payment') + '</b> disputed and still open', '#/payments?status=disputed', 'Open'));
    if (a.publish_error) out.push(li('<b>The last publish failed</b>' + (a.publish_error.at ? ' on ' + esc(when(a.publish_error.at)) : ''), '#/publish', 'Details', esc(a.publish_error.error)));
    (a.failed_jobs || []).forEach(function (j) {
      out.push(li('<b>' + esc(JOB_NAMES[j.job] || j.job) + ' failed</b> on ' + esc(when(j.last_run_at)), '#/publish', 'Details', esc(j.last_error)));
    });
    if (a.close_requests) out.push(li('<b>' + plural(a.close_requests, 'breeder') + '</b> asked to close their account', '#/breeders?status=closing', 'Open'));
    var cc = a.contact_changes || [];
    cc.slice(0, 5).forEach(function (c) {
      out.push(li('<b>' + esc(c.business_name) + '</b> contact details changed ' + esc(when(c.at)), '#/breeders/' + encodeURIComponent(c.breeder_id), 'Open',
        esc(c.fields.join(', ')) + (c.by.indexOf('operator') >= 0 ? ', by an operator' : ', by the breeder')));
    });
    if (cc.length > 5) out.push(li('<b>' + plural(cc.length - 5, 'more breeder') + '</b> changed contact details this week', '#/activity?q=profile', 'Activity'));
    /* Breeder links that stopped working or now land on the breeder's home page, from the
       weekly link check. A family clicking one never reaches the puppy. */
    var bl = a.broken_links || [];
    bl.slice(0, 5).forEach(function (l) {
      out.push(li('<b>' + esc(l.puppy ? l.puppy + ', ' + (l.business_name || 'a breeder') : (l.business_name || 'A breeder') + ' website') + '</b> link ' +
        (l.verdict === 'home' ? 'now lands on the breeder\'s home page' : 'is not working'), '#/breeders/' + encodeURIComponent(l.breeder_id), 'Open',
        esc(l.url) + (l.failing_since ? ', since ' + esc(when(l.failing_since)) : '')));
    });
    if (bl.length > 5) out.push(li('<b>' + plural(bl.length - 5, 'more breeder link') + '</b> not working', '#/publish', 'Jobs'));
    if (a.held) out.push(li('<b>' + plural(a.held, 'listing') + '</b> on hold', '#/listings?filter=held', 'Open'));
    if (a.unpublished_changes) out.push(li('<b>' + plural(a.unpublished_changes, 'change') + '</b> not on the public site yet', '#/publish', 'Publish'));
    return out;
  }

  function overview() {
    Promise.all([refreshStats(), api('GET', '/api/attention')]).then(function (r) {
      var s = r[0], todo = attentionItems(r[1]);
      shell(head('Overview', 'What needs you today, and how the directory stands.') +
        '<div class="stats">' +
        '<a class="stat" href="#/approvals"><b>' + s.queue + '</b><span>Waiting for approval</span></a>' +
        '<a class="stat" href="#/listings"><b>' + s.public_puppies + '</b><span>Puppies live on the site</span></a>' +
        '<a class="stat" href="#/breeders?status=approved"><b>' + s.approved + '</b><span>Approved breeders</span></a>' +
        '<a class="stat" href="#/listings?filter=drafts"><b>' + s.drafts + '</b><span>Drafts not yet paid for</span></a></div>' +
        '<div class="cols"><section class="card" id="attention"><h2>Needs attention</h2>' + (todo.length ? '<ul class="attention">' + todo.join('') + '</ul>' : '<p class="muted">Nothing needs you right now.</p>') + '</section>' +
        '<section class="card"><h2>Sign-ups and checkouts</h2><ul class="attention">' +
          '<li><span><b>' + plural(s.signing_up, 'breeder') + '</b> still signing up</span><a class="btn btn-sm" href="#/breeders?status=signing_up">Open</a></li>' +
          '<li><span><b>' + plural(s.open_checkouts, 'checkout') + '</b> started and not finished</span><a class="btn btn-sm" href="#/payments">Open</a></li>' +
          '<li><span><b>' + plural(s.suspended, 'breeder') + '</b> suspended</span><a class="btn btn-sm" href="#/breeders?status=suspended">Open</a></li>' +
        '</ul></section></div>');
    });
  }

  // ------------------------------------------------------------ breeders
  var BREEDER_HEAD = sh('name', 'Breeder') + sh('where', 'Where', 'hide-sm') + sh('status', 'Status') + sh('live', 'Live', 'num') + sh('joined', 'Joined', 'hide-md');
  var STATUS_ORDER = { queue: 0, signing_up: 1, approved: 2, suspended: 3, declined: 4 };
  var BREEDER_SORTS = {
    name: function (b) { return b.business_name || b.email; }, where: function (b) { return [b.state, b.city].filter(Boolean).join(' '); },
    status: function (b) { return STATUS_ORDER[b.status === 'pending' ? (b.profile_submitted_at ? 'queue' : 'signing_up') : b.status]; },
    live: function (b) { return b.public_puppies; }, joined: function (b) { return b.created_at; },
  };
  var BREEDER_FIRST = { live: -1, joined: -1 };
  function breederRow(b) {
    return '<tr class="clickable" data-open="' + esc(b.id) + '" tabindex="0" aria-label="Open ' + esc(b.business_name || b.email) + '"><td><b>' + esc(b.business_name || '(no name yet)') + '</b><span class="sub">' + esc(b.email) + (b.legacy ? ', imported from Wix' : '') + '</span></td>' +
      '<td class="hide-sm">' + esc([b.city, b.state].filter(Boolean).join(', ')) + '</td><td>' + breederPill(b) + '</td><td class="num">' + b.public_puppies + ' of ' + b.puppies + '</td><td class="hide-md">' + esc(day(b.created_at)) + '</td></tr>';
  }
  function breederText(b) { return [b.business_name, b.email, b.city, b.state, b.public_email, b.public_phone].join(' '); }

  function approvals() {
    Promise.all([refreshStats(), api('GET', '/api/breeders?status=queue')]).then(function (r) {
      shell(head('Approvals', 'Breeders who finished their profile and accepted the terms, oldest first. Open one to approve or decline.') +
        listPanel({ id: 'queue', find: 'Search the queue' }));
      list($('#queue'), { rows: r[1], head: BREEDER_HEAD, row: breederRow, text: breederText, sorts: BREEDER_SORTS, sortFirst: BREEDER_FIRST,
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
      list($('#breeders'), { rows: r[1], head: BREEDER_HEAD, row: breederRow, text: breederText, sorts: BREEDER_SORTS, sortFirst: BREEDER_FIRST,
        emptyTitle: 'No breeders here', emptyText: 'Nobody has this status right now.', wire: function (box) { wireRows(box, breederDrawer); } });
      var id = state.route.split('?')[0].split('/')[1]; if (id) breederDrawer(decodeURIComponent(id));
    });
  }

  function breederDrawer(id) {
    api('GET', '/api/breeders/' + id).then(function (data) {
      var b = data.breeder, x = data.extras;
      var pups = []; data.litters.forEach(function (l) { l.puppies.forEach(function (p) { if (p.publication_state !== 'archived') { p.breed = l.breed_name; pups.push(p); } }); });
      var litters = data.litters.filter(function (l) { return !l.archived_at; });
      var actions = {
        pending: b.profile_submitted_at ? '<button class="btn btn-primary" data-do="approve">Approve</button><button class="btn btn-danger" data-do="decline">Decline</button>' : '<p class="muted small">Still signing up. Approval opens when they submit their profile.</p>',
        approved: '<button class="btn btn-danger" data-do="suspend">Suspend</button>',
        suspended: '<button class="btn btn-primary" data-do="reinstate">Reinstate</button>',
        declined: '<button class="btn" data-do="reopen">Reopen application</button>',
      }[b.status];
      var t = data.terms;
      var termsLine = !b.profile_submitted_at ? '' : t.accepted === t.current ? esc(t.accepted) + ' (current)'
        : esc(t.accepted || 'none') + ' <span class="pill pill-warn">Asked to accept ' + esc(t.current) + '</span>';
      function row(k, v) { return v ? '<tr><td>' + esc(k) + '</td><td>' + v + '</td></tr>' : ''; }
      openDrawer(b.business_name || b.email,
        '<p>' + breederPill(b) + (b.status_reason ? ' <span class="muted small">Reason on record: ' + esc(b.status_reason) + '</span>' : '') + '</p>' +
        '<table class="kv"><tbody>' +
        row('Sign-in email', esc(b.email)) + row('Contact name', esc(b.contact_name)) + row('Public phone', esc(b.public_phone)) +
        row('Public email', esc(b.public_email)) + row('Where', esc([b.city, b.state].filter(Boolean).join(', '))) +
        row('Website', b.website_url ? '<a href="' + esc(b.website_url) + '" target="_blank" rel="noopener">' + esc(b.website_url) + '</a>' : '') +
        row('Joined', esc(day(b.created_at))) + row('Submitted', esc(day(b.profile_submitted_at))) + row('Terms', termsLine) +
        row('Decided', b.decided_at ? esc(day(b.decided_at)) + ' by ' + esc(b.decided_by) : '') +
        row('Facebook', x.facebook_url ? '<a href="' + esc(x.facebook_url) + '" target="_blank" rel="noopener">' + esc(x.facebook_url) + '</a>' : '') +
        row('Breeds raised', esc(x.breeds.map(function (r) { return r.name; }).join(', '))) + '</tbody></table>' +
        '<div class="btn-row" style="margin-top:-.4rem"><button class="btn btn-sm" id="edit-profile">Edit profile for them</button></div>' +
        (x.logo_url || x.kennel_url ? '<div class="brand-pics">' + (x.logo_url ? '<figure><img src="' + esc(x.logo_url) + '&size=card" alt="' + esc(b.business_name) + ' logo"><figcaption>Logo</figcaption></figure>' : '') +
          (x.kennel_url ? '<figure><img src="' + esc(x.kennel_url) + '&size=card" alt="' + esc(b.business_name) + ' kennel photo"><figcaption>Kennel photo</figcaption></figure>' : '') + '</div>' : '') +
        (b.description ? '<div class="card"><h3 style="margin-top:0">About</h3>' + String(b.description).split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' : '') +
        (data.close_request ? '<div class="notice notice-alert" id="close-req"><p><b>Asked to close their account</b> on ' + esc(day(data.close_request.created_at)) + '.' +
          (data.close_request.reason ? ' Their reason: ' + esc(data.close_request.reason) : '') + '</p><p class="small">Nothing has been removed. Follow up with them, then mark it handled.</p>' +
          '<div class="btn-row"><button class="btn btn-sm" id="close-handled">Mark handled</button></div></div>' : '') +
        '<div id="decide"><div class="btn-row">' + actions + '</div></div>' +
        // Plan P3.2. Private notes, never shown to the breeder.
        '<h3>Private notes</h3><p class="hint" style="margin-top:-.3rem">Only operators see these. The breeder never does, and they are in no export or report.</p>' +
        '<form id="note-form"><label class="sr" for="note-body">New note</label><textarea id="note-body" name="body" style="min-height:70px" placeholder="Add a note about this breeder"></textarea>' +
        '<div class="btn-row" style="margin-top:.5rem"><button class="btn btn-sm" type="submit">Add note</button></div></form>' +
        '<div id="notes">' + notesHtml(data.notes) + '</div>' +
        (litters.length ? '<h3>Litters (' + litters.length + ')</h3>' + litters.map(function (l) {
          var n = l.puppies.filter(function (p) { return p.publication_state !== 'archived'; }).length;
          return '<div class="pay-row"><span><b>' + esc(l.breed_name) + '</b></span><span class="muted small">' + (l.born_on ? 'born ' + esc(day(l.born_on)) + ', ' : '') + plural(n, 'puppy', 'puppies') + '</span>' +
            '<button class="btn btn-sm" data-edit-litter="' + esc(l.id) + '">Edit litter</button></div>';
        }).join('') : '') +
        '<h3>Puppies (' + pups.length + ')</h3>' + (pups.length ? pups.map(function (p) {
          return '<div class="puppy-row">' + (p.photos[0] ? '<img class="thumb" src="' + esc(thumb(p.photos[0].url)) + '" alt="" loading="lazy">' : '<div class="thumb-empty">No photo</div>') +
            '<div class="meta"><b>' + esc(p.name) + '</b><span class="muted small">' + esc(p.breed) + ', ' + esc(money(p.price_cents)) + '</span><div class="chips">' + listingChips(p) + '</div></div>' +
            '<div class="btn-row"><button class="btn btn-sm" data-edit-puppy="' + esc(p.id) + '">Edit</button>' + holdButton(p) + '</div></div>';
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
          var nf = $('#note-form', d);
          nf.addEventListener('submit', function (e) {
            e.preventDefault();
            api('POST', '/api/breeders/' + b.id + '/notes', { body: $('#note-body', d).value }).then(function (notes) {
              $('#note-body', d).value = ''; $('#notes', d).innerHTML = notesHtml(notes); var er = $('.error', nf); if (er) er.remove(); toast('Note added');
            }).catch(function (err) { showError(nf, err); });
          });
          $('#edit-profile', d).addEventListener('click', function () { profileEditor(data); });
          $$('[data-edit-litter]', d).forEach(function (btn) {
            btn.addEventListener('click', function () { litterEditor(data, litters.filter(function (l) { return l.id === btn.dataset.editLitter; })[0]); });
          });
          $$('[data-edit-puppy]', d).forEach(function (btn) {
            btn.addEventListener('click', function () { puppyEditor(data, pups.filter(function (p) { return p.id === btn.dataset.editPuppy; })[0]); });
          });
        });
    });
  }

  function notesHtml(notes) {
    return notes.length ? notes.map(function (n) {
      return '<div class="note"><span class="small muted">' + esc(when(n.created_at)) + ', ' + esc(n.author) + '</span><p>' + esc(n.body) + '</p></div>';
    }).join('') : '<p class="muted small">No notes yet.</p>';
  }

  /* Plan P3.1. Editing on the breeder's behalf. Each form is checked on the server by the same
     rules the portal uses, and the audit records the operator as the one who made the change. */
  function field(name, label, value, opts) {
    opts = opts || {};
    var id = 'e-' + name;
    var input = opts.textarea ? '<textarea id="' + id + '" name="' + name + '"' + (opts.rows ? ' style="min-height:' + opts.rows + 'px"' : '') + '>' + esc(value == null ? '' : value) + '</textarea>'
      : opts.select ? '<select id="' + id + '" name="' + name + '">' + opts.select.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(value == null ? '' : value) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'
        : '<input id="' + id + '" name="' + name + '" type="' + (opts.type || 'text') + '" value="' + esc(value == null ? '' : value) + '"' + (opts.mode ? ' inputmode="' + opts.mode + '"' : '') + '>';
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + input + (opts.hint ? '<div class="hint">' + esc(opts.hint) + '</div>' : '') + '</div>';
  }
  function formBody(form) {
    var out = {};
    $$('input, select, textarea', form).forEach(function (el) { if (el.name) out[el.name] = el.value; });
    return out;
  }
  function editorDrawer(title, data, html, submit) {
    openDrawer(title, '<p class="notice small">You are changing this on behalf of ' + esc(data.breeder.business_name || data.breeder.email) +
      '. The change is recorded in the activity log under your name.</p><form id="edit-form" novalidate>' + html +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-quiet" type="button" data-back>Back to the breeder</button></div></form>',
    function (d) {
      var f = $('#edit-form', d);
      $('[data-back]', d).addEventListener('click', function () { breederDrawer(data.breeder.id); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        submit(formBody(f)).then(function () { toast('Saved'); breederDrawer(data.breeder.id); }).catch(function (err) { showError(f, err); });
      });
    });
  }
  function profileEditor(data) {
    var b = data.breeder;
    editorDrawer('Edit profile', data,
      '<input type="hidden" name="version" value="' + esc(b.profile_version) + '">' +
      field('business_name', 'Business name', b.business_name) +
      '<div class="grid-2">' + field('public_phone', 'Public phone', b.public_phone, { type: 'tel' }) + field('public_email', 'Public email', b.public_email, { type: 'email' }) + '</div>' +
      '<div class="grid-2">' + field('city', 'Town or city', b.city) + field('state', 'State', b.state) + '</div>' +
      field('website_url', 'Website', b.website_url, { type: 'url', hint: 'Starts with https://' }) +
      field('contact_name', 'Contact name', b.contact_name, { hint: 'Private, for Puppy Connection only.' }) +
      field('description', 'About their kennel', b.description, { textarea: true }) +
      '<p class="hint">If the public phone, email or website changes, the breeder is emailed at their sign-in address.</p>',
      function (body) { return api('PUT', '/api/breeders/' + b.id + '/profile', body); });
  }
  function litterEditor(data, l) {
    editorDrawer('Edit litter', data,
      '<input type="hidden" name="version" value="' + esc(l.version) + '">' +
      field('breed_id', 'Breed', l.breed_id, { select: data.breeds.map(function (r) { return [r.id, r.name]; }) }) +
      '<div class="grid-2">' + field('born_on', 'Born', l.born_on, { type: 'date' }) + field('ready_on', 'Ready to go home', l.ready_on, { type: 'date' }) + '</div>' +
      '<div class="grid-2">' + field('mom_weight_lb', 'Mother\'s weight (lb)', l.mom_weight_lb, { mode: 'decimal' }) + field('dad_weight_lb', 'Father\'s weight (lb)', l.dad_weight_lb, { mode: 'decimal' }) + '</div>' +
      field('description', 'About the litter', l.description, { textarea: true }),
      function (body) { return api('PUT', '/api/litters/' + l.id, body); });
  }
  function puppyEditor(data, p) {
    editorDrawer('Edit ' + p.name, data,
      '<input type="hidden" name="version" value="' + esc(p.version) + '">' +
      field('name', 'Name', p.name) +
      '<div class="grid-2">' + field('sex', 'Sex', p.sex || '', { select: [['', 'Not set'], ['female', 'Female'], ['male', 'Male']] }) + field('color', 'Color', p.color) + '</div>' +
      '<div class="grid-2">' + field('price', 'Price ($)', p.price_cents == null ? '' : p.price_cents / 100, { mode: 'decimal' }) +
        field('deposit', 'Deposit ($)', p.deposit_cents == null ? '' : p.deposit_cents / 100, { mode: 'decimal' }) + '</div>' +
      field('availability', 'Status', p.availability, { select: [['available', 'Available'], ['pending', 'Pending'], ['placed', 'Placed']] }) +
      field('description', 'Description', p.description, { textarea: true }) +
      field('includes', 'Comes with', (p.includes || []).join('\n'), { textarea: true, rows: 80, hint: 'One item per line.' }) +
      field('breeder_url', 'Link to this puppy on their site', p.breeder_url, { type: 'url' }),
      function (body) {
        body.includes = String(body.includes || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        return api('PUT', '/api/puppies/' + p.id, body);
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
  var LISTING_HEAD = '<th></th>' + sh('name', 'Puppy') + sh('breeder', 'Breeder', 'hide-sm') + sh('price', 'Price', 'num') + sh('state', 'State') + '<th class="act hide-sm"></th>';
  var LISTING_SORTS = {
    name: function (p) { return p.name; }, breeder: function (p) { return p.business_name; }, price: function (p) { return p.price_cents; },
    state: function (p) { return (p.is_public ? 0 : p.publication_state === 'draft' ? 2 : 1) + (p.operator_hold ? 3 : 0); },
  };
  function listingRow(p) {
    return '<tr><td>' + (p.cover ? '<img class="thumb" src="' + esc(thumb(p.cover)) + '" alt="" loading="lazy">' : '<div class="thumb-empty">No photo</div>') + '</td>' +
      '<td><b>' + esc(p.name) + '</b><span class="sub">' + esc(p.breed) + '</span></td><td class="hide-sm brk">' + esc(p.business_name) + '</td>' +
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
      list($('#listings'), { rows: rows, head: LISTING_HEAD, row: listingRow, text: listingText, pick: function (x) { return x.breed; }, sorts: LISTING_SORTS,
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
      list($('#sb'), { rows: bs, head: BREEDER_HEAD, row: breederRow, text: breederText, sorts: BREEDER_SORTS, sortFirst: BREEDER_FIRST, emptyTitle: 'No breeders match', emptyText: '', wire: function (box) { wireRows(box, breederDrawer); } });
      list($('#sl'), { rows: ls, head: LISTING_HEAD, row: listingRow, text: listingText, sorts: LISTING_SORTS, emptyTitle: 'No listings match', emptyText: '', wire: function (box) { wireHolds(box, search); } });
    });
  }

  // ------------------------------------------------------------ payments, refunds and disputes (plan P3.8)
  var PAY_PILL = { paid: 'pill-ok', open: 'pill-gold', needs_review: 'pill-warn', failed: 'pill-alert' };
  var PAY_STATUS = { refunded: 'Refunded', partially_refunded: 'Partly refunded', disputed: 'Disputed', dispute_won: 'Dispute won', dispute_lost: 'Dispute lost' };
  function payments() {
    var p = params(), f = p.status || '';
    Promise.all([refreshStats(), api('GET', '/api/checkouts')]).then(function (r) {
      var practice = state.who.payments_mode === 'sim';
      var rows = r[1].filter(function (c) {
        return !f || (f === 'refunded' ? /refunded/.test(c.payment_status || '') : f === 'disputed' ? !!c.dispute_status : c.status === f);
      });
      var tabs = [['', 'All'], ['status=paid', 'Paid'], ['status=needs_review', 'To review'], ['status=refunded', 'Refunded'], ['status=disputed', 'Disputed'], ['status=open', 'Started']];
      shell(head('Payments', 'Every checkout a breeder has started. ' + (practice
        ? 'This copy uses the practice checkout, so a payment can be refunded here, which takes its puppies off the site and emails the breeder.'
        : 'Refunds and disputes are handled in the Stripe Dashboard, and they show up here.')) +
        listPanel({ id: 'pay', find: 'Breeder or puppy', tabs: seg('payments', f ? 'status=' + f : '', tabs, 'Payment status') }));
      list($('#pay'), { rows: rows, text: function (c) { return [c.business_name, c.puppies].join(' '); },
        head: sh('at', 'Started') + sh('breeder', 'Breeder') + '<th class="hide-md">Puppies</th>' + sh('amount', 'Amount', 'num hide-sm') + sh('status', 'Status'),
        sorts: { at: function (c) { return c.created_at; }, breeder: function (c) { return c.business_name; }, amount: function (c) { return c.amount_total_cents; }, status: function (c) { return c.payment_status || c.status; } },
        sort: ['at', -1], sortFirst: { at: -1, amount: -1 },
        row: function (c) {
          var paid = c.payment_status && c.status === 'paid';
          var acts = !practice || !paid ? '' : (c.payment_status === 'refunded' ? '' : '<button class="btn btn-sm btn-danger" data-refund="' + esc(c.id) + '">Refund</button>') +
            (c.dispute_open ? '<button class="btn btn-sm" data-dispute="' + esc(c.id) + '" data-act="won">Dispute won</button><button class="btn btn-sm" data-dispute="' + esc(c.id) + '" data-act="lost">Dispute lost</button>'
              : '<button class="btn btn-sm" data-dispute="' + esc(c.id) + '" data-act="open">Record dispute</button>');
          return '<tr><td class="when">' + esc(when(c.created_at)) + '</td><td class="brk">' + esc(c.business_name) + '<span class="sub show-md">' + esc(c.puppies) + '<span class="show-sm">, ' + esc(money(c.amount_total_cents)) + '</span></span></td><td class="hide-md">' + esc(c.puppies) + '</td><td class="num hide-sm">' + esc(money(c.amount_total_cents)) + '</td>' +
            '<td><span class="pill ' + (PAY_PILL[c.status] || '') + '">' + esc(String(c.status).replace('_', ' ')) + '</span>' +
            (c.payment_status && c.payment_status !== 'succeeded' ? ' <span class="pill pill-alert">' + esc(PAY_STATUS[c.payment_status] || c.payment_status) + '</span>' : '') +
            (c.dispute_status ? '<span class="sub">Dispute ' + esc(String(c.dispute_status).replace(/_/g, ' ')) + '</span>' : '') +
            (c.review_reason ? '<span class="sub">' + esc(c.review_reason) + '</span>' : '') +
            (acts ? '<div class="btn-row row-acts">' + acts + '</div>' : '') + '</td></tr>';
        },
        emptyTitle: f ? 'Nothing here' : 'No checkouts yet', emptyText: f ? 'No payment has this status.' : 'A row appears here the moment a breeder starts paying to list.',
        wire: function (box) {
          $$('[data-refund]', box).forEach(function (b) {
            b.addEventListener('click', function () {
              var reason = prompt('Refund this payment? Its puppies come off the site and the breeder is emailed. Write a private reason, for the record.');
              if (reason == null) return;
              api('POST', '/api/checkouts/' + b.dataset.refund + '/refund', { reason: reason }).then(function () { toast('Refunded. The listings are off the site.'); payments(); })
                .catch(function (err) { toast(err.message); });
            });
          });
          $$('[data-dispute]', box).forEach(function (b) {
            b.addEventListener('click', function () {
              var act = b.dataset.act;
              var reason = act === 'open' ? prompt('Record a practice dispute on this payment. What reason did the card holder give? (optional)') : '';
              if (reason == null) return;
              api('POST', '/api/checkouts/' + b.dataset.dispute + '/dispute', { action: act, reason: reason }).then(function () { toast(act === 'open' ? 'Dispute recorded' : 'Dispute closed'); payments(); })
                .catch(function (err) { toast(err.message); });
            });
          });
        } });
    });
  }

  // ------------------------------------------------------------ breeds (plan P3.3)
  function breedsScreen() {
    Promise.all([refreshStats(), api('GET', '/api/breeds')]).then(function (r) {
      shell(head('Breeds', 'The breeds breeders list under, with how many puppies each has live. The guide text is for each breed\'s page on the site.',
        '<button class="btn btn-primary" id="add-breed">Add a breed</button>') + listPanel({ id: 'breeds', find: 'Search breeds' }));
      list($('#breeds'), { rows: r[1], text: function (b) { return [b.name, b.slug].join(' '); },
        head: sh('name', 'Breed') + sh('live', 'Live', 'num') + sh('puppies', 'All puppies', 'num hide-sm') + sh('breeders', 'Breeders', 'num hide-sm') + sh('guide', 'Guide', 'hide-sm'),
        sorts: { name: function (b) { return b.name; }, live: function (b) { return b.live; }, puppies: function (b) { return b.puppies; }, breeders: function (b) { return b.breeders; }, guide: function (b) { return b.guide ? 0 : 1; } },
        sortFirst: { live: -1, puppies: -1, breeders: -1 },
        row: function (b) {
          return '<tr class="clickable" data-open="' + esc(b.id) + '" tabindex="0" aria-label="Edit ' + esc(b.name) + '"><td><b>' + esc(b.name) + '</b><span class="sub">/' + esc(b.slug) + '</span></td>' +
            '<td class="num">' + b.live + '</td><td class="num hide-sm">' + b.puppies + '</td><td class="num hide-sm">' + b.breeders + '</td>' +
            '<td class="hide-sm">' + (b.guide ? '<span class="pill pill-ok">Written</span>' : '<span class="pill">Not yet</span>') + '</td></tr>';
        },
        emptyTitle: 'No breeds yet', emptyText: 'Add the breeds breeders can list under.',
        wire: function (box) { wireRows(box, function (id) { breedDrawer(r[1].filter(function (b) { return b.id === id; })[0]); }); } });
      $('#add-breed').addEventListener('click', function () { breedDrawer(null); });
    });
  }
  function breedDrawer(b) {
    openDrawer(b ? b.name : 'Add a breed',
      '<form id="breed-form" novalidate>' + field('name', 'Breed name', b ? b.name : '') +
      (b ? '<p class="hint">Its page on the site is at /' + esc(b.slug) + '. The address stays the same when the breed is renamed, so links to it keep working.</p>'
        : field('slug', 'Web address (optional)', '', { hint: 'Made from the name when left blank. It must be different from every other breed.' })) +
      field('guide', 'Breed guide', b ? b.guide : '', { textarea: true, rows: 260, hint: 'Plain paragraphs, with a blank line between them. The site shows this on the breed\'s page once breed pages are built.' }) +
      (b && b.guide_updated_at ? '<p class="hint">Guide last changed ' + esc(when(b.guide_updated_at)) + '.</p>' : '') +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (b ? 'Save breed' : 'Add breed') + '</button></div></form>',
    function (d) {
      var f = $('#breed-form', d);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var body = formBody(f);
        (b ? api('PUT', '/api/breeds/' + b.id, body) : api('POST', '/api/breeds', body))
          .then(function () { closeDrawer(); toast(b ? 'Breed saved' : 'Breed added'); breedsScreen(); }).catch(function (err) { showError(f, err); });
      });
    });
  }

  // ------------------------------------------------------------ listing terms (plan P3.4)
  function termsParas(body) {
    return String(body || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean).map(function (para) {
      var m = /^REPLACE THIS:\s*([\s\S]*)$/.exec(para);
      return m ? '<p class="replace-block"><b>REPLACE THIS:</b> ' + esc(m[1]) + '</p>' : '<p>' + esc(para).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function termsScreen() {
    Promise.all([refreshStats(), api('GET', '/api/terms')]).then(function (r) { drawTerms(r[1]); });
  }
  function drawTerms(t) {
    var placeholder = /REPLACE THIS/.test(t.draft.body);
    shell(head('Listing terms', 'The terms a breeder accepts when they submit their profile. Publishing a new version asks every breeder who accepted an older one to accept it on their next visit. Nobody is locked out while they have not.') +
      '<div class="stats">' +
        '<div class="stat"><b>' + esc(t.current.version) + '</b><span>Current version' + (t.current.published_at ? ', published ' + esc(day(t.current.published_at)) : '') + '</span></div>' +
        '<div class="stat"><b>' + t.accepted + '</b><span>Breeders on the current version</span></div>' +
        '<div class="stat"><b>' + t.waiting + '</b><span>Breeders asked to accept it</span></div></div>' +
      '<div class="cols"><form id="terms-form" class="card" novalidate><h2>Draft</h2>' +
        (placeholder ? '<p class="notice small"><b>Still a placeholder.</b> The draft holds Amber\'s REPLACE THIS marker. Replace it with her own words before launch.</p>' : '') +
        '<div class="field"><label for="terms-body">Terms text</label><textarea id="terms-body" class="terms-text" name="body">' + esc(t.draft.body) + '</textarea>' +
        '<div class="hint">Plain paragraphs, with a blank line between them.' + (t.draft.updated_at ? ' Draft last saved ' + esc(when(t.draft.updated_at)) + ' by ' + esc(t.draft.updated_by) + '.' : '') + '</div></div>' +
        '<div class="btn-row"><button class="btn" type="submit">Save draft</button><button class="btn btn-gold" type="button" id="terms-publish">Publish as a new version</button></div></form>' +
      '<section class="card"><h2>What breeders see now</h2><div class="terms-preview">' + termsParas(t.current.body) + '</div>' +
        '<h3>Versions</h3>' + (t.versions.length ? t.versions.map(function (v) {
          return '<div class="pay-row"><span><b>' + esc(v.version) + '</b></span><span class="muted small">' + (v.published_at ? esc(day(v.published_at)) + ' by ' + esc(v.published_by) : '') + '</span>' +
            (v.version === t.current.version ? '<span class="pill pill-ok">Current</span>' : '') + '</div>';
        }).join('') : '<p class="muted small">None yet.</p>') + '</section></div>', true);
    var f = $('#terms-form');
    function save() { return api('PUT', '/api/terms/draft', { body: $('#terms-body').value }); }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      save().then(function (t2) { toast('Draft saved'); drawTerms(t2); }).catch(function (err) { showError(f, err); });
    });
    $('#terms-publish').addEventListener('click', function () {
      if (!confirm('Publish this draft as the new listing terms? Every breeder on an older version is asked to accept it the next time they open the portal.')) return;
      save().then(function () { return api('POST', '/api/terms/publish', {}); })
        .then(function (t2) { toast('Published version ' + t2.current.version); drawTerms(t2); }).catch(function (err) { showError(f, err); });
    });
  }

  // ------------------------------------------------------------ publish (plan P3.5)
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
  function publishScreen() {
    Promise.all([refreshStats(), api('GET', '/api/site'), api('GET', '/api/jobs')]).then(function (r) {
      var s = r[1];
      shell(head('Publish', 'When the public site last updated, what is waiting, and the jobs that run on their own.',
        '<button class="btn btn-gold" id="publish-now">Publish now</button>') +
        '<div class="stats">' +
          '<div class="stat"><b>' + (s.last_publish_at ? esc(day(s.last_publish_at)) : 'Never') + '</b><span>Last published' + (s.last_publish_at ? ', ' + esc(new Date(s.last_publish_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })) : '') + '</span></div>' +
          '<div class="stat"><b>' + s.waiting + '</b><span>' + (s.waiting === 1 ? 'Change' : 'Changes') + ' waiting' + (s.dirty_since ? ' since ' + esc(when(s.dirty_since)) : '') + '</span></div>' +
          '<div class="stat"><b>' + (s.last_error ? 'Failed' : 'OK') + '</b><span>Last publish result</span></div></div>' +
        (s.last_error ? '<div class="notice notice-alert"><p><b>The last publish failed' + (s.last_error_at ? ' on ' + esc(when(s.last_error_at)) : '') + '.</b></p><p class="small">' + esc(s.last_error) + '</p></div>' : '') +
        '<section class="card"><h2>How the site updates</h2><p class="small">' + (s.mode === 'mark'
          ? 'This copy of the site reads the database live, so a change shows within about a minute and a half. Publish now records that the site is up to date. When the generated site arrives, the same button builds and publishes it.'
          : s.mode === 'hook'
            ? 'Publish now starts a fresh build of the public site from what the database shows now. The build takes a minute or two, then the changes are live. Changes also go out on their own every 15 minutes.'
            : 'Publish now asks the portal to build the site and publish it.') + '</p>' +
          (s.recent.length ? '<h3>Recent publishes</h3>' + s.recent.map(function (p) {
            return '<div class="pay-row"><span class="when small">' + esc(when(p.at)) + '</span><span class="small">' + esc(p.actor) + '</span>' +
              (p.ok ? '<span class="pill pill-ok">Published</span>' : '<span class="pill pill-alert">Failed</span>') + '</div>';
          }).join('') : '') + '</section>' +
        '<section class="card"><h2>Scheduled jobs</h2><p class="muted small">These run on their own. Run now does the same thing straight away, which is handy when showing how expiry works.</p>' +
        '<div class="table-wrap"><table class="list"><thead><tr><th>Job</th><th class="hide-sm">Last run</th><th>Result</th><th class="act"></th></tr></thead><tbody>' +
        r[2].map(function (j) {
          return '<tr><td><b>' + esc(JOB_LABELS[j.job][0]) + '</b><span class="sub">' + esc(JOB_LABELS[j.job][1]) + '</span></td><td class="hide-sm when">' + (j.last_run_at ? esc(when(j.last_run_at)) : '<span class="muted">Not yet</span>') + '</td>' +
            '<td>' + (j.last_error ? '<span class="pill pill-alert">Failed</span><span class="sub">' + esc(j.last_error) + '</span>' : j.last_result ? '<span class="small">' + esc(jobSummary(j.job, j.last_result)) + '</span>' : '') + '</td>' +
            '<td class="act"><button class="btn btn-sm" data-run="' + esc(j.job) + '">Run now</button></td></tr>';
        }).join('') + '</tbody></table></div></section>');
      $('#publish-now').addEventListener('click', function () {
        var b = $('#publish-now'); b.disabled = true; b.textContent = 'Publishing';
        api('POST', '/api/site/publish', {}).then(function (res) { toast(res && res.nothing ? 'Nothing was waiting' : s.mode === 'hook' ? 'Build started. The site updates in a minute or two' : 'Published'); publishScreen(); })
          .catch(function (err) { toast(err.message); publishScreen(); });
      });
      $$('[data-run]').forEach(function (b) {
        b.addEventListener('click', function () {
          b.disabled = true; b.textContent = 'Running';
          api('POST', '/api/jobs/' + b.dataset.run + '/run', {}).then(function (res) { toast(JOB_LABELS[res.job][0] + ': ' + jobSummary(res.job, res)); publishScreen(); })
            .catch(function (err) { toast(err.message); publishScreen(); });
        });
      });
    });
  }

  // ------------------------------------------------------------ settings
  var SETTING_LABELS = {
    listing_days: ['Days a payment lists a puppy. 0 means it stays up until removed, as a one-time payment', 'number'],
    warn_days: ['Days before expiry that breeders are warned, when listings expire', 'number'],
    suspended_listings_visible: ['Keep a suspended breeder\'s listings on the site (1 yes, 0 no)', 'number'],
    min_photos: ['Photos a puppy needs before it can be paid for', 'number'],
    max_photos: ['Most photos a puppy can have', 'number'],
  };
  function settings() {
    Promise.all([refreshStats(), api('GET', '/api/settings')]).then(function (r) {
      var rows = r[1].filter(function (s) { return SETTING_LABELS[s.key]; });
      var fixed = r[1].filter(function (s) { return !SETTING_LABELS[s.key]; });
      shell(head('Settings', 'How listings behave. A change here applies to the next listing, payment or expiry check.') +
        '<form id="settings" class="card"><h2>Listings</h2>' + rows.map(function (s) {
          var l = SETTING_LABELS[s.key];
          return '<div class="field"><label for="s-' + esc(s.key) + '">' + esc(l[0]) + '</label><input id="s-' + esc(s.key) + '" name="' + esc(s.key) + '" type="' + l[1] + '" value="' + esc(s.value) + '"></div>';
        }).join('') + '<button class="btn btn-primary" type="submit">Save settings</button></form>' +
        '<section class="card"><h2>Set elsewhere</h2>' + fixed.map(function (s) { return '<p class="small"><b>' + esc(s.key) + '</b>: ' + esc(s.value) + '</p>'; }).join('') +
        '<p class="hint">The listing fee is the Price in Stripe, so it is changed there and in fee_cents together. The terms version changes when new terms are published on the <a href="#/terms">Terms</a> screen. Publishing and the scheduled jobs are on the <a href="#/publish">Publish</a> screen.</p></section>' +
        demoCard(), true);
      wireDemo();
      var f = $('#settings');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var body = {}; $$('input', f).forEach(function (i) { body[i.name] = i.value; });
        api('PUT', '/api/settings', body).then(function () { toast('Settings saved'); }).catch(function (err) { showError(f, err); });
      });
    });
  }

  // Plan P5.1. Reset demo data, on the staging copy only. The server refuses it anywhere else too.
  function demoCard() {
    var who = state.who;
    if (!who.demo_reset) {
      return '<section class="card" id="demo-card"><h2>Demo data</h2><p class="small">Reset demo data puts the staging copy back to the three made-up breeders. ' +
        'It works only on the staging copy, so it is switched off here.</p></section>';
    }
    return '<form class="card" id="demo-card"><h2>Reset demo data</h2>' +
      '<p class="small">This puts the staging copy back to the three made-up breeders. Buttercup Lane Puppies is signing up, Thistledown Pups is waiting for approval, and Maple Brook Doodles is approved with two litters. ' +
      'It removes every other breeder that is not one of the imported Wix listings, with their litters, puppies, photos, payments and notes, and clears sign-ins, the test mailbox and the view counts. ' +
      'The Wix listings, breeds, settings, terms and operators stay as they are. The nightly backup runs first, and nothing changes if it fails.</p>' +
      '<div class="field"><label for="demo-confirm">Type ' + esc(who.demo_phrase) + ' to confirm</label><input id="demo-confirm" name="confirm" autocomplete="off" spellcheck="false"></div>' +
      '<button class="btn btn-danger" type="submit" id="demo-go" disabled>Reset demo data</button></form>';
  }
  function wireDemo() {
    var f = $('#demo-card');
    if (!f || f.tagName !== 'FORM') return;
    var input = $('#demo-confirm', f), go = $('#demo-go', f);
    input.addEventListener('input', function () { go.disabled = input.value.trim() !== state.who.demo_phrase; });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (go.disabled) return;
      go.disabled = true; go.textContent = 'Backing up and resetting';
      api('POST', '/api/demo/reset', { confirm: input.value }).then(function (r) {
        toast('Demo data reset. ' + plural(r.removed.breeders, 'breeder') + ' removed, backup ' + r.backup.replace('backups/', '') + ' saved.');
        settings();
      }).catch(function (err) { go.textContent = 'Reset demo data'; go.disabled = false; showError(f, err); });
    });
  }

  // ------------------------------------------------------------ email log (plan P3.6)
  var TEMPLATE_NAMES = {
    signin_link: 'Sign-in code and link', contact_changed: 'Contact details changed', profile_submitted: 'New breeder to approve', approved: 'Approved',
    declined: 'Not approved', suspended: 'Paused', reinstated: 'Active again', listings_live: 'Listings live', expiring_soon: 'Listings ending soon',
    expired: 'Listings ended', listing_refunded: 'Payment refunded', ops_alert: 'Alert to operators',
  };
  function emailStatus(s) {
    if (s === 'sent') return '<span class="pill pill-ok">Sent</span>';
    if (s === 'logged') return '<span class="pill">Test mailbox</span>';
    if (/^skipped/.test(s)) return '<span class="pill pill-warn">Skipped</span><span class="sub">Not on the allowed list</span>';
    if (/^failed/.test(s)) return '<span class="pill pill-alert">Failed</span><span class="sub">' + esc(s) + '</span>';
    return '<span class="pill">' + esc(s) + '</span>';
  }
  function emailScreen() {
    var p = params(), q = p.q || '', f = p.status || '';
    Promise.all([refreshStats(), api('GET', '/api/email-log' + (q ? '?q=' + encodeURIComponent(q) : ''))]).then(function (r) {
      var d = r[1];
      var rows = d.rows.filter(function (m) { return !f || (f === 'failed' ? /^(failed|skipped)/.test(m.status) : m.status === f); });
      var templates = d.rows.map(function (m) { return TEMPLATE_NAMES[m.template] || m.template; }).filter(function (t, i, a) { return a.indexOf(t) === i; }).sort();
      var tabs = [['', 'All'], ['status=failed', 'Failed or skipped'], ['status=sent', 'Sent'], ['status=logged', 'Test mailbox']];
      shell(head('Email log', 'Every email the portal and the jobs sent, newest first, and whether it went. The message itself is not kept, only who it went to and which kind it was.') +
        (d.total > d.rows.length ? '<p class="notice small">Showing the newest ' + d.rows.length.toLocaleString('en-US') + ' of ' + d.total.toLocaleString('en-US') + '. Search by address to reach older mail.</p>' : '') +
        '<form id="email-search" class="btn-row" style="margin:0 0 .8rem" role="search"><label class="sr" for="email-q">Search every email by address, kind or status</label>' +
        '<input id="email-q" type="search" name="q" value="' + esc(q) + '" placeholder="Search all mail by address" style="flex:1 1 16rem;width:auto"><button class="btn btn-sm" type="submit">Search</button>' +
        (q ? '<a class="btn btn-sm btn-quiet" href="#/email">Clear</a>' : '') + '</form>' +
        listPanel({ id: 'mail', find: 'Filter these rows', pick: ['All kinds', templates], tabs: seg('email', f ? 'status=' + f : '', tabs, 'Email status') }));
      $('#email-search').addEventListener('submit', function (e) {
        e.preventDefault(); var v = $('#email-q').value.trim();
        location.hash = '#/email' + (v || f ? '?' + [v ? 'q=' + encodeURIComponent(v) : '', f ? 'status=' + f : ''].filter(Boolean).join('&') : '');
      });
      list($('#mail'), { rows: rows, text: function (m) { return [m.to_addr, m.template, TEMPLATE_NAMES[m.template], m.status].join(' '); },
        pick: function (m) { return TEMPLATE_NAMES[m.template] || m.template; },
        head: sh('at', 'Sent') + sh('to', 'To') + sh('kind', 'Kind') + sh('status', 'Status'),
        sorts: { at: function (m) { return m.id; }, to: function (m) { return m.to_addr; }, kind: function (m) { return TEMPLATE_NAMES[m.template] || m.template; }, status: function (m) { return m.status; } },
        sortFirst: { at: -1 },
        row: function (m) {
          return '<tr><td class="when">' + esc(when(m.sent_at)) + '</td><td>' + esc(m.to_addr) + '</td><td>' + esc(TEMPLATE_NAMES[m.template] || m.template) + '</td><td>' + emailStatus(m.status) + '</td></tr>';
        },
        emptyTitle: q ? 'No email matches' : 'No email yet', emptyText: q ? 'Try another address.' : 'Sign-in links, approvals and notices are listed here as they go out.' });
    });
  }

  // ------------------------------------------------------------ reports (plan P3.7)
  function csvLink(name) { return '<a class="btn btn-sm" href="/api/reports/' + name + '.csv" download>Download CSV</a>'; }
  function reportsScreen() {
    Promise.all([refreshStats(), api('GET', '/api/reports')]).then(function (r) {
      var d = r[1], s = d.summary;
      function table(id, title, head, rows, rowFn, emptyText, csv) {
        return '<section class="card" id="' + id + '"><div class="page-head" style="margin-bottom:.4rem"><div><h2 style="margin:0">' + esc(title) + '</h2></div><div class="head-actions">' + csvLink(csv) + '</div></div>' +
          (rows.length ? '<div class="table-wrap"><table class="list"><thead><tr>' + head + '</tr></thead><tbody>' + rows.map(rowFn).join('') + '</tbody></table></div>' : '<p class="muted small">' + esc(emptyText) + '</p>') + '</section>';
      }
      shell(head('Reports', 'Listings, money and views at a glance. Each table downloads as a CSV for a spreadsheet.') +
        '<div class="stats">' +
          '<a class="stat" href="#/listings"><b>' + s.live + '</b><span>Live on the site</span></a>' +
          '<a class="stat" href="#/listings?filter=all"><b>' + s.placed + '</b><span>Marked placed</span></a>' +
          '<a class="stat" href="#/listings?filter=drafts"><b>' + s.draft + '</b><span>Drafts</span></a>' +
          '<a class="stat" href="#/breeders?status=approved"><b>' + s.approved_breeders + '</b><span>Approved breeders</span></a></div>' +
        '<p class="btn-row" style="margin-top:-.4rem">' + csvLink('summary') + '</p>' +
        table('r-months', 'Listings and revenue by month', '<th>Month</th><th class="num">Paid</th><th class="num hide-sm">Comped</th><th class="num">Revenue</th><th class="num hide-sm">Refunded</th><th class="num">Net</th>', d.months, function (m) {
          return '<tr><td>' + esc(new Date(m.month + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })) + '</td><td class="num">' + m.paid_listings + '</td><td class="num hide-sm">' + m.comped_listings + '</td>' +
            '<td class="num">' + esc(money(m.revenue_cents)) + '</td><td class="num hide-sm">' + esc(money(m.refunded_cents)) + '</td><td class="num">' + esc(money(m.revenue_cents - m.refunded_cents)) + '</td></tr>';
        }, 'No listings have been paid for or comped yet.', 'months') +
        '<div class="cols">' +
        table('r-breeds', 'Listings by breed', '<th>Breed</th><th class="num">Live</th><th class="num">Placed</th><th class="num">Drafts</th>', d.breeds, function (b) {
          return '<tr><td>' + esc(b.breed) + '</td><td class="num">' + b.live + '</td><td class="num">' + b.placed + '</td><td class="num">' + b.draft + '</td></tr>';
        }, 'No puppies yet.', 'breeds') +
        table('r-views', 'Most viewed puppies', '<th>Puppy</th><th class="num">Views</th><th class="num">Clicks</th><th class="num hide-sm">Last 30 days</th>', d.views, function (v) {
          return '<tr><td><b>' + esc(v.name) + '</b><span class="sub">' + esc(v.breed) + ', ' + esc(v.business_name) + (v.is_public ? '' : ', not live now') + '</span></td>' +
            '<td class="num">' + v.views + '</td><td class="num">' + v.clicks + '</td><td class="num hide-sm">' + v.views_30 + ' views, ' + v.clicks_30 + ' clicks</td></tr>';
        }, 'No puppy pages have been viewed yet.', 'views') + '</div>');
    });
  }

  // ------------------------------------------------------------ activity
  function activity() {
    Promise.all([refreshStats(), api('GET', '/api/audit')]).then(function (r) {
      shell(head('Activity', 'Everything breeders and operators have done, newest first.') + listPanel({ id: 'audit', find: 'Who, what or record', q: params().q }));
      list($('#audit'), { rows: r[1], text: function (a) { return [a.actor, a.action, a.entity, a.entity_id].join(' '); },
        head: sh('at', 'When') + sh('who', 'Who') + sh('what', 'What') + '<th class="hide-md">Record</th>',
        sorts: { at: function (a) { return a.id; }, who: function (a) { return a.actor; }, what: function (a) { return a.action; } }, sortFirst: { at: -1 },
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
    ({ '': overview, approvals: approvals, breeders: breeders, listings: listings, payments: payments, settings: settings, activity: activity, search: search,
      breeds: breedsScreen, terms: termsScreen, publish: publishScreen, email: emailScreen, reports: reportsScreen }[r] || overview)();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);

  api('GET', '/api/whoami').then(function (w) { state.who = w; render(); })
    .catch(function (err) { app.innerHTML = '<main class="plain-card" style="margin:3rem auto"><h1>Not signed in</h1><p>' + esc(err.message) + '</p></main>'; });
})();
