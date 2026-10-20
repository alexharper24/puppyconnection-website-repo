/* The launch checklist (workplan A17). Alex and Amber work through every item to go-live and
   the Gate 1, 2 and 3 additions here. Uses the shell and helpers admin.js hands over on
   window.pcAdmin, and draws the overview card and the #/checklist screen. */
(function () {
  'use strict';

  var A = function () { return window.pcAdmin; };
  var SECTIONS = [['launch', 'Launch'], ['gate1', 'Gate 1'], ['gate2', 'Gate 2'], ['gate3', 'Gate 3']];
  var SECTION_NAME = { launch: 'Launch', gate1: 'Gate 1', gate2: 'Gate 2', gate3: 'Gate 3' };
  var STATUSES = [['not_started', 'Not started'], ['in_progress', 'In progress'], ['waiting', 'Waiting'], ['done', 'Done']];
  var STATUS_NAME = { not_started: 'Not started', in_progress: 'In progress', waiting: 'Waiting', done: 'Done' };
  var STATUS_PILL = { not_started: 'sq sq-not_started', in_progress: 'sq sq-in_progress', waiting: 'sq sq-waiting', done: 'sq sq-done' };
  var OWNERS = ['Alex', 'Amber'];   // Alex, 2026-10-19: owners are Alex and Amber only
  var SEEDED = 'launch plan';
  var data = null;            // the last /api/checklist answer

  function esc(s) { return A().esc(s); }
  // The shared Amber and Luke address picks who is ticking. Kept in this browser only.
  function storedAs() { try { return localStorage.getItem('pc-checklist-as') || ''; } catch (e) { return ''; } }
  function setAs(v) { try { localStorage.setItem('pc-checklist-as', v); } catch (e) { /* private window */ } }
  function asQuery() { var a = storedAs(); return a ? '?as=' + encodeURIComponent(a) : ''; }
  function send(method, path, body) { body = body || {}; body.as = storedAs() || undefined; return A().api(method, path, body); }
  function me() { return data && data.me ? data.me : { names: [], name: '' }; }
  function myNames() { return [me().name]; }

  function waitsOnMe(it, names) {
    if (it.status === 'done') return false;
    return names.indexOf(it.owner) >= 0 || names.indexOf(it.waiting_owner) >= 0 ||
      it.parts.some(function (p) { return !p.done_at && names.indexOf(p.owner) >= 0; });
  }
  function doneLine(at, by) {
    if (!at) return '';
    return 'Done ' + A().day(at) + (by === SEEDED ? ', from the launch plan' : by ? ' by ' + by : '');
  }
  function ownerSelect(id, value, label, blank) {
    return '<label class="sr" for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' +
      (blank ? '<option value="">' + esc(blank) + '</option>' : '') +
      OWNERS.map(function (o) { return '<option' + (o === value ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
  }

  // ------------------------------------------------------------ overview card
  function overview(view) {
    if (!view) return;
    A().api('GET', '/api/checklist/summary' + asQuery()).then(function (s) {
      A().state.checklistMine = s.mine;
      var nav = document.querySelector('.nav a[href="#/checklist"]');
      if (nav && s.mine) {
        var tally = nav.querySelector('.tally') || nav.appendChild(document.createElement('span'));
        tally.className = 'tally'; tally.textContent = s.mine; nav.setAttribute('aria-label', 'Launch checklist, ' + s.mine);
      }
      var cell = function (sec, st) {
        var n = s.counts[sec][st];
        return '<td class="num">' + (n ? '<a href="#/checklist?section=' + sec + '&status=' + st + '">' + n + '</a>' : '<span class="muted">0</span>') + '</td>';
      };
      var card = document.createElement('section');
      card.className = 'card cl-summary'; card.id = 'checklist-summary';
      card.innerHTML = '<div class="card-head"><h2>Launch checklist</h2><a class="btn btn-sm" href="#/checklist">Open</a></div>' +
        '<div class="table-wrap"><table class="cl-counts"><thead><tr><th>Section</th>' + STATUSES.map(function (t) { return '<th class="num">' + t[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
        SECTIONS.map(function (sec) {
          return '<tr><th scope="row"><a href="#/checklist?section=' + sec[0] + '">' + sec[1] + '</a></th>' + STATUSES.map(function (t) { return cell(sec[0], t[0]); }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' +
        '<ul class="attention"><li><span><b>' + A().plural(s.mine, 'item') + '</b> waiting on you' + (s.me.name ? ', as ' + esc(s.me.name) : '') + '</span>' +
          '<a class="btn btn-sm" href="#/checklist?mine=1">Show</a></li>' +
          (s.partly ? '<li><span><b>' + A().plural(s.partly, 'item') + '</b> partly done, with some parts ticked</span><a class="btn btn-sm" href="#/checklist?partly=1">Show</a></li>' : '') + '</ul>';
      var stats = view.querySelector('.stats');
      if (stats && stats.nextSibling) view.insertBefore(card, stats.nextSibling); else view.appendChild(card);
    }).catch(function () { /* the overview stands without the card */ });
  }

  // ------------------------------------------------------------ the screen
  /* A layered view (Alex, 2026-10-19). Sections, or people, are collapsible rows with their
     counts. Each item is one dense line with its owner, status and who it waits on, and opening
     it shows its parts, comments and history in place. What is open is kept per browser. */
  var VIEW_KEY = 'pc-checklist-view';
  function loadView() {
    var v = null; try { v = JSON.parse(localStorage.getItem(VIEW_KEY) || 'null'); } catch (e) { v = null; }
    v = v && typeof v === 'object' ? v : {};
    v.group = v.group === 'person' ? 'person' : 'section';
    v.open = v.open && typeof v.open === 'object' ? v.open : {};
    if (!('sec:launch' in v.open)) v.open['sec:launch'] = true;   // Launch open, the gates closed, until someone changes it
    return v;
  }
  var view = loadView();
  function saveView() { try { localStorage.setItem(VIEW_KEY, JSON.stringify(view)); } catch (e) { /* private window */ } }
  function isOpen(key) { return !!view.open[key]; }
  function setOpen(key, on) { if (on) view.open[key] = true; else delete view.open[key]; saveView(); }

  function filters() {
    var p = A().params();
    return { mine: p.mine === '1', partly: p.partly === '1', section: p.section || '', status: p.status || '', owner: p.owner || '', archived: p.archived === '1' };
  }
  function link(f) {
    var q = [];
    if (f.mine) q.push('mine=1'); if (f.partly) q.push('partly=1'); if (f.section) q.push('section=' + f.section);
    if (f.status) q.push('status=' + f.status); if (f.owner) q.push('owner=' + f.owner); if (f.archived) q.push('archived=1');
    return '#/checklist' + (q.length ? '?' + q.join('&') : '');
  }

  function screen() {
    var f = filters();
    if (f.section) setOpen('sec:' + f.section, true);   // a link from the overview opens its section
    A().api('GET', '/api/checklist' + (asQuery() ? asQuery() + '&' : '?') + (f.archived ? 'archived=1' : '')).then(function (d) {
      data = d;
      if (me().names.length > 1 && me().names.indexOf(storedAs()) < 0) setAs(me().name);
      draw();
    }).catch(function (err) { A().shell(A().head('Launch checklist') + '<p class="error">' + esc(err.message) + '</p>'); });
  }

  var detail = {};   // item id -> the /api/checklist/items/:id answer, for items opened in place

  /** Who an item waits on, as a short name for the row: the person, or the first words of the waiting line. */
  function waitText(it) {
    if (it.status !== 'waiting') return '';
    return it.waiting_owner || it.waiting_on || '';
  }
  function itemRow(it, opts) {
    opts = opts || {};
    var parts = it.parts, done = parts.filter(function (p) { return p.done_at; }).length;
    var archived = !!it.archived_at, open = isOpen('item:' + it.id);
    var wait = waitText(it);
    return '<li class="cl-row' + (it.status === 'done' ? ' is-done' : '') + (open ? ' is-open' : '') + '" data-id="' + esc(it.id) + '">' +
      '<div class="cl-line">' +
        '<input type="checkbox" class="cl-tick" data-tick="' + esc(it.id) + '" aria-label="' + esc((it.status === 'done' ? 'Untick ' : 'Tick ') + it.title) + '"' + (it.status === 'done' ? ' checked' : '') + (archived ? ' disabled' : '') + '>' +
        '<button type="button" class="cl-toggle" data-item="' + esc(it.id) + '" aria-expanded="' + open + '" title="' + esc(it.title) + '">' +
          '<span class="cl-chev" aria-hidden="true"></span><span class="cl-name">' + esc(it.title) + '</span></button>' +
        '<span class="cl-cells">' +
          (opts.section ? '<span class="cl-sec">' + esc(SECTION_NAME[it.section]) + '</span>' : '') +
          '<span class="cl-parts-n">' + (parts.length ? '<span class="cl-bar" aria-hidden="true"><i style="width:' + Math.round(100 * done / parts.length) + '%"></i></span>' + done + '/' + parts.length : '') + '</span>' +
          '<span class="sq sq-owner" title="Owner">' + esc(it.owner) + '</span>' +
          '<span class="sq sq-' + it.status + '">' + STATUS_NAME[it.status] + '</span>' +
          '<span class="cl-waits"' + (it.waiting_on ? ' title="Waiting on ' + esc(it.waiting_on) + '"' : '') + '>' + (wait ? '' + (it.waiting_owner ? '<b>' + esc(wait) + '</b>' : esc(wait)) : it.status === 'done' ? esc(A().day(it.done_at)) : '') + '</span>' +
        '</span>' +
      '</div>' +
      (open ? '<div class="cl-detail" id="d-' + esc(it.id) + '">' + detailHtml(it) + '</div>' : '') +
      '</li>';
  }

  function detailHtml(it) {
    var r = detail[it.id], archived = !!it.archived_at;
    var parts = it.parts;
    return '<div class="cl-detail-grid"><div>' +
      (it.description ? '<p class="cl-desc">' + esc(it.description) + '</p>' : '') +
      (it.status === 'waiting' && it.waiting_on ? '<p class="cl-waitline">Waiting on ' + esc(it.waiting_on) + '</p>' : '') +
      (it.status === 'done' ? '<p class="muted small">' + esc(doneLine(it.done_at, it.done_by)) + '</p>' : '') +
      (parts.length ? '<ul class="cl-parts">' + parts.map(function (p) {
        return '<li' + (p.done_at ? ' class="is-done"' : '') + '><label class="check"><input type="checkbox" data-part-tick="' + esc(p.id) + '"' + (p.done_at ? ' checked' : '') + (archived ? ' disabled' : '') + '>' +
          '<span><span class="cl-ptitle">' + esc(p.title) + '</span> <span class="sq sq-owner">' + esc(p.owner) + '</span>' + (p.done_at ? '<span class="cl-when">' + esc(doneLine(p.done_at, p.done_by)) + '</span>' : '') + '</span></label></li>';
      }).join('') + '</ul>' : '<p class="muted small">No parts.</p>') +
      '<div class="cl-tools">' +
        (archived ? '' : '<button type="button" class="btn btn-sm" data-open="' + esc(it.id) + '">Edit, assign or comment</button>' +
          '<button type="button" class="btn btn-sm btn-quiet" data-move="up" data-id="' + esc(it.id) + '">Move up</button>' +
          '<button type="button" class="btn btn-sm btn-quiet" data-move="down" data-id="' + esc(it.id) + '">Move down</button>') +
      '</div></div><div class="cl-side">' +
      (r ? '<h4>Comments</h4>' + (r.comments.length ? '<ul class="cl-comments">' + r.comments.slice(-3).map(function (c) {
          return '<li><b>' + esc(c.author) + '</b> <span class="cl-when">' + esc(A().when(c.created_at)) + '</span><p>' + esc(c.body) + '</p></li>';
        }).join('') + '</ul>' + (r.comments.length > 3 ? '<p class="muted small">' + (r.comments.length - 3) + ' earlier in the full item.</p>' : '') : '<p class="muted small">None yet.</p>') +
        '<h4>History</h4><ul class="cl-history">' + r.history.slice(0, 4).map(historyLine).join('') +
          (it.created_by === SEEDED ? '<li><span class="cl-when">' + esc(A().day(it.created_at)) + '</span> Added from the launch plan</li>' : '') + '</ul>'
        : '<p class="muted small">Loading comments and history.</p>') +
      '</div></div>';
  }

  /* People view: everything a person owns, is waited on for, or has an open part in. The
     items waiting on them come first, then their own work, then their items waiting on others. */
  function personRank(it, who) {
    if (it.status === 'done') return -1;
    var waitsOnThem = (it.status === 'waiting' && it.waiting_owner === who) || it.parts.some(function (p) { return !p.done_at && p.owner === who; }) && it.owner !== who;
    if (waitsOnThem) return 0;
    if (it.owner === who && it.status !== 'waiting') return 1;
    if (it.owner === who) return 2;
    return -1;
  }

  function counts(list) {
    var c = { not_started: 0, in_progress: 0, waiting: 0, done: 0 };
    list.forEach(function (it) { c[it.status] += 1; });
    return c;
  }
  function countLine(list) {
    var c = counts(list);
    return '<span class="cl-count"><b>' + c.done + '</b>/' + list.length + ' done</span>' +
      (c.waiting ? '<span class="cl-count c-waiting"><b>' + c.waiting + '</b> waiting</span>' : '') +
      (c.in_progress ? '<span class="cl-count c-in_progress"><b>' + c.in_progress + '</b> in progress</span>' : '') +
      (c.not_started ? '<span class="cl-count"><b>' + c.not_started + '</b> not started</span>' : '');
  }

  // Column headings for an open group, lined up with the row cells (hidden on a phone, where rows stack).
  function colHead(opts) {
    return '<li class="cl-colhead" aria-hidden="true"><span></span><span>Item</span>' + (opts.section ? '<span>Section</span>' : '') +
      '<span>Parts</span><span>Owner</span><span>Status</span><span>Waiting on</span></li>';
  }
  function group(key, label, list, opts) {
    var open = isOpen(key);
    var shown = list.filter(function (it) { return it.status !== 'done'; });
    var done = list.filter(function (it) { return it.status === 'done'; });
    var doneOpen = isOpen(key + ':done');
    return '<section class="cl-group' + (open ? ' is-open' : '') + '">' +
      '<h2 class="cl-ghead"><button type="button" data-group="' + esc(key) + '" aria-expanded="' + open + '"><span class="cl-chev" aria-hidden="true"></span>' +
        '<span class="cl-gname">' + esc(label) + '</span>' + (opts.extra || '') + '<span class="cl-gcounts">' + (opts.counts || countLine(list)) + '</span></button></h2>' +
      (open ? '<ul class="cl-rows">' + colHead(opts) + (shown.length ? shown.map(function (it) { return itemRow(it, opts); }).join('') : '<li class="cl-empty">Nothing open here.</li>') +
        (done.length && !opts.noDone ? '<li class="cl-donebar"><button type="button" data-group="' + esc(key) + ':done" aria-expanded="' + doneOpen + '"><span class="cl-chev" aria-hidden="true"></span>' +
          A().plural(done.length, 'done item') + '</button></li>' + (doneOpen ? done.map(function (it) { return itemRow(it, opts); }).join('') : '') : '') +
        '</ul>' : '') +
      '</section>';
  }

  function draw() {
    var f = filters(), names = myNames();
    var y = window.scrollY;
    var match = function (it) {
      return (!f.mine || waitsOnMe(it, names)) && (!f.partly || (it.status !== 'done' && it.parts.some(function (p) { return p.done_at; }))) &&
        (!f.status || it.status === f.status) && (!f.owner || it.owner === f.owner || it.parts.some(function (p) { return p.owner === f.owner; }));
    };
    var items = data.items.filter(match);
    if (!f.archived) A().state.checklistMine = data.items.filter(function (it) { return waitsOnMe(it, names); }).length;

    // The strip: one line per section's counts, and how many wait on whoever is ticking.
    var strip = '<div class="cl-strip" role="group" aria-label="Summary">' + SECTIONS.map(function (s) {
      var all = data.items.filter(function (it) { return it.section === s[0]; }), c = counts(all);
      return '<button type="button" class="cl-stat" data-jump="' + s[0] + '"><span>' + s[1] + '</span><b>' + c.done + '/' + all.length + '</b>' +
        (c.waiting ? '<i class="c-waiting">' + c.waiting + ' waiting</i>' : '') + '</button>';
    }).join('') + '<a class="cl-stat cl-mine" href="' + link({ mine: true }) + '"><span>Waiting on ' + esc(me().name || 'you') + '</span><b>' + A().state.checklistMine + '</b></a></div>';

    var asBar = me().names.length > 1 ? '<span class="cl-as">Ticking as <span class="seg" role="group" aria-label="Who is ticking">' + me().names.map(function (n) {
      return '<button type="button" data-as="' + esc(n) + '"' + (n === me().name ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(n) + '</button>';
    }).join('') + '</span></span>' : '';
    var groupSeg = '<span class="seg" role="group" aria-label="Group by">' +
      '<button type="button" data-groupby="section"' + (view.group === 'section' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>By section</button>' +
      '<button type="button" data-groupby="person"' + (view.group === 'person' ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>By person</button></span>';
    var tabs = '<span class="seg" role="group" aria-label="Show">' +
      '<a href="' + link({ owner: f.owner, status: f.status }) + '"' + (!f.mine && !f.partly && !f.archived ? ' class="on" aria-current="true"' : '') + '>All</a>' +
      '<a href="' + link({ mine: true }) + '"' + (f.mine ? ' class="on" aria-current="true"' : '') + '>Waiting on me</a>' +
      '<a href="' + link({ partly: true }) + '"' + (f.partly ? ' class="on" aria-current="true"' : '') + '>Partly done</a>' +
      '<a href="' + link({ archived: true }) + '"' + (f.archived ? ' class="on" aria-current="true"' : '') + '>Archived</a></span>';
    var pickers = '<span class="cl-pickers"><label class="sr" for="cl-owner">Owner</label><select id="cl-owner"><option value="">Everyone</option>' + OWNERS.map(function (o) { return '<option' + (f.owner === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>' +
      '<label class="sr" for="cl-status">Status</label><select id="cl-status"><option value="">Any status</option>' + STATUSES.map(function (t) { return '<option value="' + t[0] + '"' + (f.status === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></span>';

    var body;
    if (view.group === 'person') {
      body = OWNERS.map(function (who) {
        var mine = items.map(function (it) { return [personRank(it, who), it]; }).filter(function (x) { return x[0] >= 0; })
          .sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
        var waiting = mine.filter(function (it) { return personRank(it, who) === 0; }).length;
        var key = 'person:' + who;
        if (!(key in view.open) && who === me().name && !view.open['person:seen']) { view.open[key] = true; view.open['person:seen'] = true; saveView(); }
        return group(key, who, mine, { section: true, noDone: true,
          counts: '<span class="cl-count c-waiting"><b>' + waiting + '</b> waiting on ' + esc(who) + '</span><span class="cl-count"><b>' + mine.length + '</b> open</span>' });
      }).join('');
    } else {
      body = SECTIONS.map(function (s) {
        return group('sec:' + s[0], s[1], items.filter(function (it) { return it.section === s[0]; }), {});
      }).join('');
    }

    A().shell('<div class="cl-head"><h1>Launch checklist</h1>' + (f.archived ? '' : '<button type="button" class="btn btn-primary btn-sm" id="cl-add">Add an item</button>') + '</div>' +
      strip + '<div class="cl-bar-row">' + groupSeg + tabs + pickers + asBar + '</div>' +
      (f.archived ? '<p class="muted small">Archived items, kept with their history. Only Alex can restore one.</p>' : '') +
      '<div class="cl-board" data-group-by="' + view.group + '">' + body + '</div>');
    wire();
    window.scrollTo(0, y);
    // Fill in comments and history for items open in place.
    data.items.forEach(function (it) { if (isOpen('item:' + it.id) && !detail[it.id]) loadDetail(it.id); });
  }

  function loadDetail(id) {
    return A().api('GET', '/api/checklist/items/' + encodeURIComponent(id)).then(function (r) {
      detail[id] = r;
      var it = data.items.filter(function (x) { return x.id === id; })[0], box = document.getElementById('d-' + id);
      if (it && box) { box.innerHTML = detailHtml(it); wireDetail(box); }
    }).catch(function () { /* the row stands without it */ });
  }

  function reload(openId) {
    var f = filters();
    detail = {};
    return A().api('GET', '/api/checklist' + (asQuery() ? asQuery() + '&' : '?') + (f.archived ? 'archived=1' : '')).then(function (d) { data = d; draw(); if (openId) drawer(openId); });
  }

  function wireDetail(root) {
    var $$ = function (s) { return A().$$(s, root); };
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { drawer(b.dataset.open); }); });
    $$('[data-part-tick]').forEach(function (c) {
      c.addEventListener('change', function () {
        c.disabled = true;
        send('POST', '/api/checklist/parts/' + c.dataset.partTick + '/tick', { done: c.checked })
          .then(function () { A().toast(c.checked ? 'Part ticked' : 'Part unticked'); return reload(); })
          .catch(function (err) { c.checked = !c.checked; c.disabled = false; A().toast(err.message); });
      });
    });
    $$('[data-move]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true;
        send('POST', '/api/checklist/items/' + b.dataset.id + '/move', { dir: b.dataset.move }).then(function () {
          return reload().then(function () { var again = A().$('[data-move="' + b.dataset.move + '"][data-id="' + b.dataset.id + '"]'); if (again) again.focus(); });
        }).catch(function (err) { b.disabled = false; A().toast(err.message); });
      });
    });
  }

  function wire() {
    var $ = A().$, $$ = A().$$;
    $$('[data-as]').forEach(function (b) { b.addEventListener('click', function () { setAs(b.dataset.as); screen(); }); });
    $$('[data-groupby]').forEach(function (b) { b.addEventListener('click', function () { view.group = b.dataset.groupby; saveView(); draw(); }); });
    ['cl-owner', 'cl-status'].forEach(function (id) {
      $('#' + id).addEventListener('change', function () {
        var f = filters(); f[id === 'cl-owner' ? 'owner' : 'status'] = this.value; f.archived = false; location.hash = link(f);
      });
    });
    var add = $('#cl-add'); if (add) add.addEventListener('click', function () { editor(null); });
    $$('[data-group]').forEach(function (b) {
      b.addEventListener('click', function () { setOpen(b.dataset.group, !isOpen(b.dataset.group)); draw(); var again = $('[data-group="' + b.dataset.group + '"]'); if (again) again.focus(); });
    });
    $$('[data-item]').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = 'item:' + b.dataset.item; setOpen(key, !isOpen(key)); draw();
        var again = $('[data-item="' + b.dataset.item + '"]'); if (again) again.focus();
      });
    });
    $$('[data-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (view.group !== 'section') view.group = 'section';
        setOpen('sec:' + b.dataset.jump, true); draw();
        var h = $('[data-group="sec:' + b.dataset.jump + '"]'); if (h) { h.scrollIntoView({ block: 'start' }); h.focus(); }
      });
    });
    $$('[data-tick]').forEach(function (c) {
      c.addEventListener('change', function () {
        c.disabled = true;
        send('POST', '/api/checklist/items/' + c.dataset.tick + '/tick', { done: c.checked })
          .then(function () { A().toast(c.checked ? 'Ticked done' : 'Unticked'); return reload(); })
          .catch(function (err) { c.checked = !c.checked; c.disabled = false; A().toast(err.message); });
      });
    });
    $$('.cl-detail').forEach(wireDetail);
  }

  // ------------------------------------------------------------ add and edit
  function itemForm(it) {
    it = it || { section: filters().section || 'launch', owner: me().name && OWNERS.indexOf(me().name) >= 0 ? me().name : 'Alex', status: 'not_started' };
    return '<form id="cl-form" novalidate>' +
      '<div class="field"><label for="f-title">Title</label><input id="f-title" type="text" maxlength="200" value="' + esc(it.title || '') + '" required></div>' +
      '<div class="field"><label for="f-desc">What it involves</label><textarea id="f-desc" maxlength="4000">' + esc(it.description || '') + '</textarea></div>' +
      '<div class="grid-2"><div class="field"><label for="f-section">Section</label><select id="f-section">' + SECTIONS.map(function (s) { return '<option value="' + s[0] + '"' + (it.section === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="f-owner">Owner</label>' + ownerSelect('f-owner', it.owner, 'Owner').replace(/^<label[^>]*>.*?<\/label>/, '') + '</div></div>' +
      '<div class="field"><label for="f-status">Status</label><select id="f-status">' + STATUSES.map(function (t) { return '<option value="' + t[0] + '"' + (it.status === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></div>' +
      '<div id="f-waiting"' + (it.status === 'waiting' ? '' : ' hidden') + '><div class="field"><label for="f-wait">Waiting on</label><input id="f-wait" type="text" maxlength="300" placeholder="Who or what, in words" value="' + esc(it.waiting_on || '') + '"></div>' +
        '<div class="field"><label for="f-wait-owner">Waiting on a person</label>' + ownerSelect('f-wait-owner', it.waiting_owner, 'Waiting on a person', 'Nobody on the team').replace(/^<label[^>]*>.*?<\/label>/, '') +
        '<p class="hint">Shows the item under Waiting on me for that person.</p></div></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">' + (it.id ? 'Save changes' : 'Add the item') + '</button></div></form>';
  }
  function readForm(d) {
    var v = function (id) { return A().$('#' + id, d).value; };
    return { title: v('f-title'), description: v('f-desc'), section: v('f-section'), owner: v('f-owner'), status: v('f-status'),
      waiting_on: v('f-wait'), waiting_owner: v('f-wait-owner') || null };
  }
  function wireForm(d, onSubmit) {
    var st = A().$('#f-status', d);
    st.addEventListener('change', function () { A().$('#f-waiting', d).hidden = st.value !== 'waiting'; });
    A().$('#cl-form', d).addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = A().$('button[type=submit]', d); btn.disabled = true;
      onSubmit(readForm(d)).catch(function (err) { btn.disabled = false; A().showError(A().$('#cl-form', d), err); });
    });
  }
  function editor() {
    A().openDrawer('Add an item', itemForm(null), function (d) {
      wireForm(d, function (body) {
        return send('POST', '/api/checklist/items', body).then(function (r) { A().toast('Item added'); return reload(r.id); });
      });
    });
  }

  // ------------------------------------------------------------ one item
  function historyLine(h) {
    var a = h.after || {}, b = h.before || {}, who = esc(a.as || h.actor);
    var part = a.title ? ' the part "' + esc(a.title) + '"' : ' a part';
    var changes = function () {
      return Object.keys(a).filter(function (k) { return k !== 'as'; }).map(function (k) {
        var name = { title: 'the title', description: 'the description', section: 'the section', owner: 'the owner', status: 'the status', waiting_on: 'what it waits on', waiting_owner: 'who it waits on' }[k] || k;
        var show = function (v) { return v == null || v === '' ? 'nothing' : esc(STATUS_NAME[v] || SECTION_NAME[v] || v); };
        return k === 'description' ? 'changed the description' : 'changed ' + name + ' from ' + show(b[k]) + ' to ' + show(a[k]);
      }).join(', ');
    };
    var text = {
      add: 'added the item', edit: changes(), tick: 'ticked it done', untick: 'unticked it', move: 'moved it ' + esc(a.dir || ''),
      archive: 'archived it' + (a.reason ? ', because ' + esc(a.reason) : ''), restore: 'restored it', comment: 'commented',
      'part.add': 'added' + part + ' for ' + esc(a.owner), 'part.edit': 'changed' + part + (b.owner !== a.owner ? ', owner ' + esc(b.owner) + ' to ' + esc(a.owner) : ''),
      'part.tick': 'ticked' + part, 'part.untick': 'unticked' + part, 'part.move': 'moved a part ' + esc(a.dir || ''),
      'part.archive': 'archived' + part, 'part.restore': 'restored' + part,
    }[h.action] || esc(h.action);
    return '<li><span class="cl-when">' + esc(A().when(h.at)) + '</span> <b>' + who + '</b> ' + text + '</li>';
  }

  function drawer(id) {
    A().api('GET', '/api/checklist/items/' + encodeURIComponent(id)).then(function (r) {
      var it = r.item, archived = !!it.archived_at, canArchive = me().can_archive;
      var parts = r.parts.filter(function (p) { return !p.archived_at; }), oldParts = r.parts.filter(function (p) { return p.archived_at; });
      var html = '<p class="cl-meta"><span class="' + STATUS_PILL[it.status] + '">' + STATUS_NAME[it.status] + '</span><span>' + esc(SECTION_NAME[it.section]) + '</span><span>Owner ' + esc(it.owner) + '</span></p>' +
        (it.status === 'done' ? '<p class="muted">' + esc(doneLine(it.done_at, it.done_by)) + '</p>' : '') +
        (archived ? '<p class="notice">Archived ' + esc(A().day(it.archived_at)) + ' by ' + esc(it.archived_by) + '. It is kept with its history and can be restored by Alex.</p>' + (canArchive ? '<div class="btn-row"><button class="btn" id="cl-restore">Restore</button></div>' : '')
          : itemForm(it)) +
        '<h3>Parts</h3>' + (parts.length ? '<ul class="cl-parts cl-parts-edit">' + parts.map(function (p) {
          return '<li' + (p.done_at ? ' class="is-done"' : '') + '><input type="checkbox" data-dpart="' + esc(p.id) + '" aria-label="' + esc((p.done_at ? 'Untick ' : 'Tick ') + p.title) + '"' + (p.done_at ? ' checked' : '') + (archived ? ' disabled' : '') + '>' +
            '<div class="cl-body"><span>' + esc(p.title) + '</span>' + (p.done_at ? '<span class="cl-when">' + esc(doneLine(p.done_at, p.done_by)) + '</span>' : '') +
            (archived ? '' : '<div class="cl-part-tools">' + ownerSelect('po-' + p.id, p.owner, 'Who does ' + p.title).replace('<select ', '<select data-powner="' + esc(p.id) + '" ') +
              '<button type="button" class="btn btn-sm btn-quiet" data-pmove="up" data-pid="' + esc(p.id) + '" aria-label="Move ' + esc(p.title) + ' up">&uarr;</button>' +
              '<button type="button" class="btn btn-sm btn-quiet" data-pmove="down" data-pid="' + esc(p.id) + '" aria-label="Move ' + esc(p.title) + ' down">&darr;</button>' +
              (canArchive ? '<button type="button" class="btn btn-sm btn-quiet" data-parchive="' + esc(p.id) + '">Archive</button>' : '') + '</div>') +
            '</div></li>';
        }).join('') + '</ul>' : '<p class="muted">No parts. Add one when a piece of this item belongs to someone else.</p>') +
        (archived ? '' : '<form id="cl-part" class="cl-part-add"><div class="field"><label for="p-title">New part</label><input id="p-title" type="text" maxlength="200" placeholder="What the piece is"></div>' +
          '<div class="field"><label for="p-owner">Who does it</label>' + ownerSelect('p-owner', it.owner, 'Who does it').replace(/^<label[^>]*>.*?<\/label>/, '') + '</div>' +
          '<button class="btn" type="submit">Add the part</button></form>') +
        (oldParts.length ? '<details class="cl-old"><summary>' + A().plural(oldParts.length, 'archived part') + '</summary><ul>' + oldParts.map(function (p) {
          return '<li>' + esc(p.title) + ' <span class="sq sq-owner">' + esc(p.owner) + '</span>' + (canArchive ? ' <button type="button" class="btn btn-sm btn-quiet" data-prestore="' + esc(p.id) + '">Restore</button>' : '') + '</li>';
        }).join('') + '</ul></details>' : '') +
        '<h3>Comments</h3>' + (r.comments.length ? '<ul class="cl-comments">' + r.comments.map(function (c) {
          return '<li><div><b>' + esc(c.author) + '</b> <span class="cl-when">' + esc(A().when(c.created_at)) + '</span></div><p>' + esc(c.body).replace(/\n/g, '<br>') + '</p></li>';
        }).join('') + '</ul>' : '<p class="muted">No comments yet.</p>') +
        '<form id="cl-comment"><label class="sr" for="c-body">New comment</label><textarea id="c-body" style="min-height:80px" placeholder="Add a comment"></textarea>' +
          '<div class="btn-row"><button class="btn" type="submit">Add the comment</button></div></form>' +
        '<h3>History</h3><ul class="cl-history">' + r.history.map(historyLine).join('') +
          (it.created_by === SEEDED ? '<li><span class="cl-when">' + esc(A().day(it.created_at)) + '</span> Added from the launch plan</li>' : '') + '</ul>' +
        (!archived && canArchive ? '<h3>Archive</h3><p class="hint">Archiving takes the item off the list and keeps it, its parts, comments and history. It can be restored.</p>' +
          '<div class="field"><label for="a-reason">Why (optional)</label><input id="a-reason" type="text" maxlength="500"></div><button class="btn btn-danger" id="cl-archive">Archive the item</button>' : '');
      A().openDrawer(it.title, html, function (d) { wireDrawer(d, it); });
    }).catch(function (err) { A().toast(err.message); });
  }

  function wireDrawer(d, it) {
    var $ = function (s) { return A().$(s, d); }, $$ = function (s) { return A().$$(s, d); };
    var after = function (msg) { return function () { A().toast(msg); return reload(it.id); }; };
    var fail = function (el) { return function (err) { if (el) el.disabled = false; A().toast(err.message); }; };
    if ($('#cl-form')) {
      wireForm(d, function (body) {
        body.version = it.version;
        return send('PUT', '/api/checklist/items/' + it.id, body).then(after('Saved'));
      });
    }
    $$('[data-dpart]').forEach(function (c) {
      c.addEventListener('change', function () { c.disabled = true; send('POST', '/api/checklist/parts/' + c.dataset.dpart + '/tick', { done: c.checked }).then(after(c.checked ? 'Part ticked' : 'Part unticked')).catch(fail(c)); });
    });
    $$('[data-powner]').forEach(function (s) {
      s.addEventListener('change', function () { send('PUT', '/api/checklist/parts/' + s.dataset.powner, { owner: s.value }).then(after('Part assigned to ' + s.value)).catch(fail()); });
    });
    $$('[data-pmove]').forEach(function (b) {
      b.addEventListener('click', function () { b.disabled = true; send('POST', '/api/checklist/parts/' + b.dataset.pid + '/move', { dir: b.dataset.pmove }).then(after('Part moved')).catch(fail(b)); });
    });
    $$('[data-parchive]').forEach(function (b) {
      b.addEventListener('click', function () { b.disabled = true; send('POST', '/api/checklist/parts/' + b.dataset.parchive + '/archive', {}).then(after('Part archived')).catch(fail(b)); });
    });
    $$('[data-prestore]').forEach(function (b) {
      b.addEventListener('click', function () { b.disabled = true; send('POST', '/api/checklist/parts/' + b.dataset.prestore + '/restore', {}).then(after('Part restored')).catch(fail(b)); });
    });
    var pf = $('#cl-part');
    if (pf) pf.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = A().$('button', pf); btn.disabled = true;
      send('POST', '/api/checklist/items/' + it.id + '/parts', { title: $('#p-title').value, owner: $('#p-owner').value }).then(after('Part added')).catch(fail(btn));
    });
    $('#cl-comment').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = A().$('button', e.target); btn.disabled = true;
      send('POST', '/api/checklist/items/' + it.id + '/comments', { body: $('#c-body').value }).then(after('Comment added')).catch(fail(btn));
    });
    var ar = $('#cl-archive');
    if (ar) ar.addEventListener('click', function () {
      if (!confirm('Archive this item? It is kept with its history and can be restored.')) return;
      ar.disabled = true;
      send('POST', '/api/checklist/items/' + it.id + '/archive', { reason: $('#a-reason').value }).then(function () { A().toast('Archived'); A().closeDrawer(); return reload(); }).catch(fail(ar));
    });
    var rs = $('#cl-restore');
    if (rs) rs.addEventListener('click', function () { rs.disabled = true; send('POST', '/api/checklist/items/' + it.id + '/restore', {}).then(after('Restored')).catch(fail(rs)); });
  }

  window.pcChecklist = { screen: screen, overview: overview };
})();
