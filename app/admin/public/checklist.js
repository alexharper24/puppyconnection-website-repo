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
  var STATUS_PILL = { not_started: 'pill', in_progress: 'pill pill-gold', waiting: 'pill pill-warn', done: 'pill pill-ok' };
  var OWNERS = ['Alex', 'Amber', 'Luke', 'Claude'];
  var SEEDED = 'launch plan';
  var data = null;            // the last /api/checklist answer
  var showDone = {};          // section -> true when its done items are open

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
    A().api('GET', '/api/checklist' + (asQuery() ? asQuery() + '&' : '?') + (f.archived ? 'archived=1' : '')).then(function (d) {
      data = d;
      if (me().names.length > 1 && me().names.indexOf(storedAs()) < 0) setAs(me().name);
      draw();
    }).catch(function (err) { A().shell(A().head('Launch checklist') + '<p class="error">' + esc(err.message) + '</p>'); });
  }

  function itemRow(it) {
    var parts = it.parts, done = parts.filter(function (p) { return p.done_at; }).length;
    var meta = '<span class="' + STATUS_PILL[it.status] + '">' + STATUS_NAME[it.status] + '</span>' +
      '<span class="cl-owner">' + esc(it.owner) + '</span>' +
      (parts.length ? '<span class="cl-progress" title="' + done + ' of ' + parts.length + ' parts done"><span class="cl-bar"><i style="width:' + Math.round(100 * done / parts.length) + '%"></i></span>' + done + ' of ' + parts.length + ' parts</span>' : '') +
      (it.comments ? '<span class="muted">' + A().plural(it.comments, 'comment') + '</span>' : '');
    var archived = !!it.archived_at;
    return '<li class="cl-item' + (it.status === 'done' ? ' is-done' : '') + '" data-id="' + esc(it.id) + '">' +
      '<input type="checkbox" class="cl-tick" data-tick="' + esc(it.id) + '" aria-label="' + esc((it.status === 'done' ? 'Untick ' : 'Tick ') + it.title) + '"' + (it.status === 'done' ? ' checked' : '') + (archived ? ' disabled' : '') + '>' +
      '<div class="cl-body"><button type="button" class="cl-title" data-open="' + esc(it.id) + '">' + esc(it.title) + '</button>' +
        '<div class="cl-meta">' + meta + '</div>' +
        (it.status === 'waiting' && it.waiting_on ? '<p class="cl-wait">Waiting on ' + esc(it.waiting_on) + '</p>' : '') +
        (it.status === 'done' ? '<p class="cl-wait">' + esc(doneLine(it.done_at, it.done_by)) + '</p>' : '') +
        (archived ? '<p class="cl-wait">Archived ' + esc(A().day(it.archived_at)) + ' by ' + esc(it.archived_by) + '</p>' : '') +
        (parts.length && it.status !== 'done' ? '<ul class="cl-parts">' + parts.map(function (p) {
          return '<li' + (p.done_at ? ' class="is-done"' : '') + '><label class="check"><input type="checkbox" data-part-tick="' + esc(p.id) + '"' + (p.done_at ? ' checked' : '') + (archived ? ' disabled' : '') + '>' +
            '<span><span class="cl-ptitle">' + esc(p.title) + '</span> <span class="cl-owner">' + esc(p.owner) + '</span>' + (p.done_at ? '<span class="cl-when">' + esc(doneLine(p.done_at, p.done_by)) + '</span>' : '') + '</span></label></li>';
        }).join('') + '</ul>' : '') +
      '</div>' +
      (archived ? '' : '<div class="cl-move"><button type="button" class="btn btn-sm btn-quiet" data-move="up" data-id="' + esc(it.id) + '" aria-label="Move ' + esc(it.title) + ' up">&uarr;</button>' +
        '<button type="button" class="btn btn-sm btn-quiet" data-move="down" data-id="' + esc(it.id) + '" aria-label="Move ' + esc(it.title) + ' down">&darr;</button></div>') +
      '</li>';
  }

  function draw() {
    var f = filters(), names = myNames();
    var y = window.scrollY;
    var match = function (it) {
      return (!f.mine || waitsOnMe(it, names)) && (!f.partly || (it.status !== 'done' && it.parts.some(function (p) { return p.done_at; }))) &&
        (!f.section || it.section === f.section) && (!f.status || it.status === f.status) &&
        (!f.owner || it.owner === f.owner || it.parts.some(function (p) { return p.owner === f.owner; }));
    };
    var asBar = me().names.length > 1 ? '<div class="cl-as"><span>Ticking as</span><div class="seg" role="group" aria-label="Who is ticking">' + me().names.map(function (n) {
      return '<button type="button" data-as="' + esc(n) + '"' + (n === me().name ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(n) + '</button>';
    }).join('') + '</div></div>' : '';
    var tabs = '<div class="seg" role="group" aria-label="Show">' +
      '<a href="' + link({ section: f.section, status: f.status, owner: f.owner }) + '"' + (!f.mine && !f.partly && !f.archived ? ' class="on" aria-current="true"' : '') + '>All</a>' +
      '<a href="' + link({ mine: true, section: f.section }) + '"' + (f.mine ? ' class="on" aria-current="true"' : '') + '>Waiting on me</a>' +
      '<a href="' + link({ partly: true }) + '"' + (f.partly ? ' class="on" aria-current="true"' : '') + '>Partly done</a>' +
      '<a href="' + link({ archived: true }) + '"' + (f.archived ? ' class="on" aria-current="true"' : '') + '>Archived</a></div>';
    var pickers = '<label class="sr" for="cl-owner">Owner</label><select id="cl-owner"><option value="">Everyone</option>' + OWNERS.map(function (o) { return '<option' + (f.owner === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>' +
      '<label class="sr" for="cl-status">Status</label><select id="cl-status"><option value="">Any status</option>' + STATUSES.map(function (t) { return '<option value="' + t[0] + '"' + (f.status === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>';
    var shown = 0;
    if (!f.archived) A().state.checklistMine = data.items.filter(function (it) { return waitsOnMe(it, names); }).length;
    var body = SECTIONS.filter(function (s) { return !f.section || s[0] === f.section; }).map(function (sec) {
      var all = data.items.filter(function (it) { return it.section === sec[0]; });
      var rows = all.filter(match);
      var doneN = all.filter(function (it) { return it.status === 'done'; }).length;
      // Done items fold away unless asked for, so the open work leads.
      var hideDone = !f.archived && f.status !== 'done' && !showDone[sec[0]];
      var open = rows.filter(function (it) { return !hideDone || it.status !== 'done'; });
      var folded = rows.length - open.length;
      shown += open.length;
      return '<section class="card cl-section" id="sec-' + sec[0] + '"><div class="card-head"><h2>' + sec[1] + '</h2><span class="muted small">' +
        (f.archived ? A().plural(all.length, 'archived item') : doneN + ' of ' + all.length + ' done') + '</span></div>' +
        (open.length ? '<ul class="cl-list">' + open.map(itemRow).join('') + '</ul>' : '<p class="muted">' + (rows.length ? 'Everything here is done.' : 'Nothing here matches.') + '</p>') +
        (folded ? '<button type="button" class="btn btn-sm btn-quiet" data-show-done="' + sec[0] + '">Show ' + A().plural(folded, 'done item') + '</button>' : '') +
        (!hideDone && !f.archived && f.status !== 'done' && doneN ? '<button type="button" class="btn btn-sm btn-quiet" data-hide-done="' + sec[0] + '">Hide done items</button>' : '') +
        '</section>';
    }).join('');
    A().shell(A().head('Launch checklist', 'Everything left before go-live, and the Gate 1, 2 and 3 additions. Tick an item or a part when it is done, and open an item to edit it, assign it, or comment.',
      f.archived ? '' : '<button type="button" class="btn btn-primary" id="cl-add">Add an item</button>') +
      asBar + '<div class="cl-filters">' + tabs + '<div class="cl-pickers">' + pickers + '</div></div>' + body);
    wire();
    window.scrollTo(0, y);
  }

  function reload(openId) {
    var f = filters();
    return A().api('GET', '/api/checklist' + (asQuery() ? asQuery() + '&' : '?') + (f.archived ? 'archived=1' : '')).then(function (d) { data = d; draw(); if (openId) drawer(openId); });
  }

  function wire() {
    var $ = A().$, $$ = A().$$;
    $$('[data-as]').forEach(function (b) { b.addEventListener('click', function () { setAs(b.dataset.as); screen(); }); });
    ['cl-owner', 'cl-status'].forEach(function (id) {
      $('#' + id).addEventListener('change', function () {
        var f = filters(); f[id === 'cl-owner' ? 'owner' : 'status'] = this.value; f.archived = false; location.hash = link(f);
      });
    });
    var add = $('#cl-add'); if (add) add.addEventListener('click', function () { editor(null); });
    $$('[data-open]').forEach(function (b) { b.addEventListener('click', function () { drawer(b.dataset.open); }); });
    $$('[data-show-done]').forEach(function (b) { b.addEventListener('click', function () { showDone[b.dataset.showDone] = true; draw(); }); });
    $$('[data-hide-done]').forEach(function (b) { b.addEventListener('click', function () { showDone[b.dataset.hideDone] = false; draw(); }); });
    $$('[data-tick]').forEach(function (c) {
      c.addEventListener('change', function () {
        c.disabled = true;
        send('POST', '/api/checklist/items/' + c.dataset.tick + '/tick', { done: c.checked })
          .then(function () { A().toast(c.checked ? 'Ticked done' : 'Unticked'); return reload(); })
          .catch(function (err) { c.checked = !c.checked; c.disabled = false; A().toast(err.message); });
      });
    });
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
          return '<li>' + esc(p.title) + ' <span class="cl-owner">' + esc(p.owner) + '</span>' + (canArchive ? ' <button type="button" class="btn btn-sm btn-quiet" data-prestore="' + esc(p.id) + '">Restore</button>' : '') + '</li>';
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
