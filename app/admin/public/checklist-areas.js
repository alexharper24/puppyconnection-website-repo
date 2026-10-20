/* Areas on the launch checklist (Alex, 2026-10-20, migrations/0044). The grouping, the one-line
   summary of who each area waits on, and the asks for one person, kept apart from the screen so
   dev/checklist-test.mjs can run them in Node. checklist.js draws them. */
(function (root) {
  'use strict';

  var SECTIONS = [['launch', 'Launch'], ['gate1', 'Gate 1'], ['gate2', 'Gate 2'], ['gate3', 'Gate 3']];
  var PEOPLE = ['Alex and Amber', 'Amber and Alex', 'Alex', 'Amber'];

  function open(it) { return it.status !== 'done' && !it.archived_at; }

  /** Who or what an open item waits on, as a short name. A waiting item names its person, or the
      first words of its waiting line ("the domain moving to Cloudflare" reads "the domain"). Any
      other open item waits on its owner. */
  function waitWho(it) {
    if (it.status !== 'waiting') return it.owner;
    if (it.waiting_owner) return it.waiting_owner;
    var w = String(it.waiting_on || '').trim();
    for (var i = 0; i < PEOPLE.length; i++) {
      if (w === PEOPLE[i] || w.indexOf(PEOPLE[i] + ' ') === 0) return PEOPLE[i].indexOf(' and ') > 0 ? 'Alex and Amber' : PEOPLE[i];
    }
    var cut = w.split(/,| being | moving | opening /)[0].trim();
    var words = cut.split(/\s+/);
    if (words.length > 4) cut = words.slice(0, 3).join(' ');
    return cut || it.owner;
  }
  function isPerson(who) { return PEOPLE.indexOf(who) >= 0; }

  /** "Waiting on Amber for 3, on Alex for 1, on the domain for 2": people first, then the rest,
      each by how many open items wait on them. */
  function waitSummary(list) {
    var n = {}, order = [];
    list.filter(open).forEach(function (it) {
      var who = waitWho(it);
      if (!(who in n)) { n[who] = 0; order.push(who); }
      n[who] += 1;
    });
    if (!order.length) return 'Nothing open';
    order.sort(function (a, b) { return (isPerson(b) - isPerson(a)) || (n[b] - n[a]) || (order.indexOf(a) - order.indexOf(b)); });
    return 'Waiting on ' + order.map(function (w, i) { return (i ? 'on ' : '') + w + ' for ' + n[w]; }).join(', ');
  }

  /** The area groups in order, then the items with no area under their section. */
  function byArea(items, areas) {
    var known = {};
    var out = areas.map(function (a) { known[a.id] = true; return { key: 'area:' + a.id, label: a.name, area: a.id, items: [] }; });
    var index = {}; out.forEach(function (g, i) { index[g.area] = i; });
    var rest = {};
    items.forEach(function (it) {
      if (it.area && known[it.area]) out[index[it.area]].items.push(it);
      else (rest[it.section] = rest[it.section] || []).push(it);
    });
    SECTIONS.forEach(function (s) {
      if (rest[s[0]]) out.push({ key: 'noarea:' + s[0], label: s[0] === 'launch' ? 'Launch, no area yet' : s[1] + ' additions', area: null, items: rest[s[0]] });
    });
    return out.filter(function (g) { return g.items.length; });
  }

  /** Everything open that asks something of one person, grouped by area. Each open part they own
      is one ask. An item waiting on them with no open part of theirs is one ask of its own. */
  function asksFor(items, areas, who) {
    return byArea(items.filter(open), areas).map(function (g) {
      var asks = [];
      g.items.forEach(function (it) {
        var mine = it.parts.filter(function (p) { return !p.done_at && !p.archived_at && p.owner === who; });
        mine.forEach(function (p) { asks.push({ text: p.title, item: it.title, itemId: it.id, partId: p.id }); });
        if (!mine.length && it.status === 'waiting' && it.waiting_owner === who) {
          asks.push({ text: it.title, item: null, itemId: it.id, partId: null, waiting: it.waiting_on || '' });
        }
      });
      return { key: g.key, label: g.label, asks: asks };
    }).filter(function (g) { return g.asks.length; });
  }

  /** The asks as plain text grouped by area, to paste into an email or a message. */
  function asksText(groups, who, date) {
    var day = (date || new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    var lines = ['Asks for ' + who + ', ' + day];
    groups.forEach(function (g) {
      lines.push('', g.label);
      g.asks.forEach(function (a) {
        lines.push('- ' + a.text + (a.item ? ' (' + a.item + ')' : a.waiting ? ' (waiting on ' + a.waiting + ')' : ''));
      });
    });
    return lines.join('\n') + '\n';
  }

  root.pcChecklistAreas = { waitWho: waitWho, waitSummary: waitSummary, byArea: byArea, asksFor: asksFor, asksText: asksText };
})(typeof window !== 'undefined' ? window : globalThis);
