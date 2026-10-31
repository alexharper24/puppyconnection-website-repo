/* Type-to-search for long pick lists, shared by the breeder portal and the operator screens.
   Alex, 2026-10-31. The breeds table grows from about 35 to about 330, so every breed picker
   takes a typed search instead of a long scroll. The native <select> or checkboxes stay in the
   form as the real control, so saving does not change, and this only adds a text box in front.
   If this file fails to load, the plain select still works. The portal's copy is the source,
   and app/dev/setup.mjs copies it to the admin, the same as portal.css. */
(function () {
  'use strict';

  var seq = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

  // Words a breeder may type that a breed's name does not hold, keyed by slug. A small copy of
  // BREED_NICKNAMES in app/build/generate.mjs (Alex, 2026-10-30). A slug that is not here costs nothing.
  var NICK = {
    'french-bulldog': 'frenchie', 'english-bulldog': 'british bulldog', 'miniature-dachshund': 'doxie wiener dog weiner dog',
    'bernese-mountain-dog': 'berner', 'cavalier-king-charles-spaniel': 'ckcs', 'pembroke-welsh-corgi': 'corgi',
    'yorkshire-terrier': 'yorkie', 'miniature-schnauzer': 'mini schnauzer', 'saint-bernard': 'st bernard',
    'labrador-retriever': 'lab', 'shih-tzu': 'shihtzu', 'doberman-pinscher': 'dobie', 'miniature-poodle': 'mini poodle',
    'pomeranian': 'pom', 'shih-poo': 'shihpoo shipoo', 'teddy-bear-shihchon': 'shichon zuchon', 'cavapoo': 'cavoodle'
  };
  function item(text, value, extra) {
    var slug = norm(text).replace(/ /g, '-');
    var hay = ' ' + norm(text + ' ' + (NICK[value] || NICK[slug] || '') + ' ' + (extra || ''));
    return { text: text, hay: hay, flat: hay.replace(/ /g, '') };
  }
  /* A match is every typed word found in the name or its nicknames, ignoring case, so "doodle"
     finds Goldendoodle and Mini Goldendoodle and "frenchie" finds French Bulldog. A name that
     starts with what was typed comes first, then words that start with it, then the rest. */
  function rank(it, q) {
    var words = q.split(' ');
    var starts = true;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (it.hay.indexOf(' ' + w) >= 0) continue;
      if (it.hay.indexOf(w) < 0 && it.flat.indexOf(w) < 0) return -1;
      starts = false;
    }
    return it.hay.indexOf(' ' + q) === 0 ? 0 : starts ? 1 : 2;
  }
  function filter(items, typed) {
    var q = norm(typed);
    if (!q) return items.slice();
    return items.map(function (it, i) { return { it: it, r: rank(it, q), i: i }; })
      .filter(function (x) { return x.r >= 0; })
      .sort(function (a, b) { return a.r - b.r || a.i - b.i; })
      .map(function (x) { return x.it; });
  }

  /* The combobox in front of one <select> (the ARIA 1.2 pattern with a list popup). Arrow keys
     move through the matches, Enter or a tap picks one, Escape closes the list and puts the
     current choice back. Picking sets the select's value and fires its change event, so any
     code listening to the select still runs. Leaving the box with one match, or the exact name,
     picks it, and leaving it empty picks the select's blank option when it has one. */
  function select(sel, opts) {
    if (!sel || sel.dataset.combo) return;
    opts = opts || {};
    sel.dataset.combo = '1';
    // Moving the select into the wrapper below takes its focus away, so note it first.
    var hadFocus = document.activeElement === sel;
    var id = sel.id || ('combo-' + (++seq));
    var wrap = document.createElement('div'); wrap.className = 'combo';
    sel.parentNode.insertBefore(wrap, sel);
    var blank = $$('option', sel).filter(function (o) { return o.value === ''; })[0] || null;
    var input = document.createElement('input');
    input.type = 'text'; input.id = id + '-q';
    input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', id + '-list');
    input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off'); input.setAttribute('spellcheck', 'false');
    input.placeholder = opts.placeholder || (blank ? blank.text : 'Type to search');
    var list = document.createElement('ul');
    list.className = 'combo-list'; list.id = id + '-list'; list.hidden = true;
    list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    var says = document.createElement('span'); says.className = 'sr'; says.setAttribute('aria-live', 'polite');
    wrap.appendChild(input); wrap.appendChild(list); wrap.appendChild(says); wrap.appendChild(sel);
    // The select stays in the form for saving and leaves the tab order and the screen reader.
    sel.classList.add('sr'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var lab = sel.id ? $$('label[for="' + sel.id + '"]')[0] : null;
    if (lab) { lab.htmlFor = input.id; list.setAttribute('aria-labelledby', lab.id || (lab.id = id + '-label')); }
    else if (sel.getAttribute('aria-label')) input.setAttribute('aria-label', sel.getAttribute('aria-label'));

    var items = [], shown = [], active = -1;
    function build() {
      items = $$('option', sel).filter(function (o) { return o.value !== ''; }).map(function (o) {
        var it = item(o.text, o.value); it.opt = o; return it;
      });
    }
    function chosenText() { var o = sel.options[sel.selectedIndex]; return o && o.value !== '' ? o.text : ''; }
    function sync() { input.value = chosenText(); input.disabled = sel.disabled; }
    function isOpen() { return !list.hidden; }
    function setActive(i) {
      var old = list.querySelector('[aria-selected="true"]');
      if (old) old.setAttribute('aria-selected', 'false');
      active = i;
      var li = i >= 0 ? document.getElementById(id + '-o' + i) : null;
      if (!li) { input.removeAttribute('aria-activedescendant'); return; }
      li.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', li.id);
      // Scroll the list only, never the page or the drawer behind it.
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    }
    function open(typed, at) {
      if (sel.disabled) return;
      build();
      shown = filter(items, typed);
      list.innerHTML = shown.length ? shown.map(function (it, i) {
        return '<li role="option" id="' + id + '-o' + i + '" data-i="' + i + '" aria-selected="false"' + (it.opt.selected && it.opt.value !== '' ? ' class="is-current"' : '') + '>' + esc(it.text) + '</li>';
      }).join('') : '<li class="combo-none" role="presentation">' + esc(opts.none || 'Nothing matches') + '</li>';
      list.hidden = false; list.scrollTop = 0;
      input.setAttribute('aria-expanded', 'true');
      wrap.classList.add('is-open');
      says.textContent = shown.length === 1 ? '1 match' : shown.length + ' matches';
      if (at === 'current') at = shown.map(function (it) { return it.opt; }).indexOf(sel.options[sel.selectedIndex]);
      setActive(typeof at === 'number' ? Math.min(at, shown.length - 1) : -1);
    }
    function close() {
      list.hidden = true; list.innerHTML = ''; shown = []; active = -1;
      input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
      wrap.classList.remove('is-open');
    }
    function commit(opt) {
      var changed = sel.value !== (opt ? opt.value : '');
      if (opt) sel.value = opt.value;
      close(); sync();
      if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // What leaving the box means: the exact name or the only match is picked, an empty box picks
    // the blank option where there is one, and anything else goes back to the current choice.
    function settle() {
      var q = norm(input.value);
      if (q === norm(chosenText())) { close(); sync(); return; }
      if (!q) { if (blank) commit(blank); else { close(); sync(); } return; }
      build();
      var found = filter(items, input.value);
      var exact = found.filter(function (it) { return norm(it.text) === q; })[0];
      var pick = exact || (found.length === 1 ? found[0] : null);
      if (pick) commit(pick.opt); else { close(); sync(); }
    }

    input.addEventListener('input', function () { open(input.value, norm(input.value) ? 0 : -1); });
    input.addEventListener('focus', function () { input.select(); });
    input.addEventListener('click', function () {
      if (isOpen()) return;
      open('', 'current'); input.select();
    });
    input.addEventListener('keydown', function (e) {
      var typed = input.value !== chosenText() ? input.value : '';
      if (e.key === 'ArrowDown' || e.key === 'Down') {
        e.preventDefault();
        if (!isOpen()) open(typed, typed ? 0 : 'current');
        else if (!e.altKey && shown.length) setActive(Math.min(active + 1, shown.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'Up') {
        e.preventDefault();
        if (!isOpen()) open(typed, typed ? 0 : 'current');
        else if (shown.length) setActive(Math.max(active - 1, 0));
      } else if (e.key === 'Enter') {
        // A select never submits its form on Enter, so this box does not either.
        e.preventDefault();
        if (isOpen() && active >= 0) commit(shown[active].opt); else settle();
      } else if (e.key === 'Escape' || e.key === 'Esc') {
        // The first Escape closes the list or undoes the typing, and only the next closes the drawer.
        if (isOpen() || input.value !== chosenText()) { e.preventDefault(); e.stopPropagation(); close(); sync(); }
      }
    });
    input.addEventListener('blur', function () { if (isOpen() || input.value !== chosenText()) settle(); });
    // A press on the list keeps the focus in the box, so the box does not blur before the pick.
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function (e) {
      var li = e.target.closest && e.target.closest('[data-i]');
      if (li && shown[+li.dataset.i]) commit(shown[+li.dataset.i].opt);
    });
    sel.addEventListener('change', sync);
    if (window.MutationObserver) new MutationObserver(sync).observe(sel, { attributes: true, attributeFilter: ['disabled'] });
    sync();
    if (hadFocus) input.focus();
    return input;
  }

  /* A find box above a long set of checkboxes, such as Breeds you raise. Ticked boxes move to
     the top when the set is drawn and stay shown whatever is typed, so a breeder always sees
     what they picked. The checkboxes themselves are untouched. */
  function checks(set, opts) {
    if (!set || set.dataset.combo) return;
    opts = opts || {};
    var labels = $$('label', set).filter(function (l) { return l.parentNode === set && l.querySelector('input[type=checkbox]'); });
    if (labels.length < (opts.min || 12)) return;
    set.dataset.combo = '1';
    var id = 'checks-' + (++seq);
    var bar = document.createElement('div'); bar.className = 'pick-find';
    bar.innerHTML = '<label class="sr" for="' + id + '">' + esc(opts.label || 'Find') + '</label>' +
      '<input id="' + id + '" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(opts.label || 'Find') + '">' +
      '<span class="small muted" aria-live="polite"></span>';
    var box = document.createElement('div'); box.className = 'pick-list';
    var none = document.createElement('p'); none.className = 'small muted pick-none'; none.hidden = true; none.textContent = opts.none || 'Nothing matches';
    var tagged = labels.map(function (l, i) {
      var c = l.querySelector('input'), it = item(l.textContent.trim(), c.value);
      it.label = l; it.box = c; it.i = i; return it;
    });
    tagged.slice().sort(function (a, b) { return (b.box.checked - a.box.checked) || a.i - b.i; })
      .forEach(function (it) { box.appendChild(it.label); });
    var legend = set.querySelector('legend');
    set.insertBefore(bar, legend ? legend.nextSibling : set.firstChild);
    set.insertBefore(box, bar.nextSibling);
    set.insertBefore(none, box.nextSibling);
    set.classList.add('has-find');
    var find = bar.querySelector('input'), says = bar.querySelector('span');
    function count() {
      var n = tagged.filter(function (it) { return it.box.checked; }).length;
      says.textContent = n ? n + ' chosen' : 'None chosen';
    }
    function apply() {
      var q = norm(find.value), hits = 0;
      tagged.forEach(function (it) {
        var hit = !q || rank(it, q) >= 0;
        if (hit && !it.box.checked) hits++;
        it.label.hidden = !(hit || it.box.checked);
      });
      none.hidden = !q || hits > 0;
    }
    find.addEventListener('input', apply);
    // Enter in the find box would otherwise submit the form around it.
    find.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
    set.addEventListener('change', count);
    count();
  }

  window.PCPicker = { select: select, checks: checks, filter: filter, item: item };
})();
