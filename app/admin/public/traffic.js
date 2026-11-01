/* Puppy Connection operator screens: the traffic chart on Reports (Alex, 2026-11-01).
   Views and clicks per day, week or month, puppy pages and the other pages stacked, drawn as
   inline SVG with no library. A bar opens that day, week or month's top pages below. */
(function () {
  'use strict';
  var A = window.pcAdmin;
  var esc = A.esc;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var KIND_NAMES = { puppy: 'Puppy pages', home: 'Home', breed: 'Breeds', breeder: 'Breeders', guide: 'Guides', other: 'Other pages' };
  var SPAN = { day: 30, week: 26, month: 12 };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function d0(s) { return new Date(s + 'T00:00:00Z'); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addD(s, n) { var d = d0(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function monday(s) { var d = d0(s); return addD(s, -((d.getUTCDay() + 6) % 7)); }
  function short(s) { var d = d0(s); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate(); }
  function longDay(s) { return d0(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  function n(x) { return Number(x || 0).toLocaleString('en-US'); }
  function pl(x, w) { return x === 1 ? w : w + 's'; }

  // The buckets for a grouping, oldest first, from launch day to today.
  function buckets(data, by) {
    var today = data.today, start = data.puppies_from, out = [];
    var first, step;
    if (by === 'day') {
      first = addD(today, -(SPAN.day - 1));
      for (var s = first < start ? start : first; s <= today; s = addD(s, 1)) out.push({ from: s, to: s, label: short(s), title: longDay(s) });
    } else if (by === 'week') {
      first = monday(addD(today, -7 * (SPAN.week - 1)));
      for (var w = first < monday(start) ? monday(start) : first; w <= today; w = addD(w, 7)) {
        var end = addD(w, 6);
        var wf = w < start ? start : w;
        out.push({ from: wf, to: end > today ? today : end, label: short(wf), title: 'Week of ' + longDay(wf) });
      }
    } else {
      var t = d0(today), m = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - (SPAN.month - 1), 1));
      var sm = d0(start); sm = new Date(Date.UTC(sm.getUTCFullYear(), sm.getUTCMonth(), 1));
      if (m < sm) m = sm;
      for (; m <= t; m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))) {
        var last = iso(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 0)));
        var from = iso(m);
        out.push({ from: from < start ? start : from, to: last > today ? today : last,
          label: MONTHS[m.getUTCMonth()] + (m.getUTCMonth() === 0 || !out.length ? ' ' + m.getUTCFullYear() : ''),
          title: m.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) });
      }
    }
    out.forEach(function (b) { b.puppy = { views: 0, clicks: 0 }; b.other = { views: 0, clicks: 0 }; b.kinds = {}; });
    data.days.forEach(function (r) {
      for (var i = out.length - 1; i >= 0; i--) {
        var b = out[i];
        if (r.day >= b.from && r.day <= b.to) {
          var g = r.kind === 'puppy' ? b.puppy : b.other;
          g.views += r.views; g.clicks += r.clicks;
          var k = b.kinds[r.kind] || (b.kinds[r.kind] = { views: 0, clicks: 0 });
          k.views += r.views; k.clicks += r.clicks;
          break;
        }
      }
    });
    return out;
  }

  function niceMax(v) {
    if (v <= 4) return 4;
    var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }

  function el(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // A bar segment with rounded top corners when it is the top of its stack.
  function seg(x, y, w, h, round) {
    var r = round ? Math.min(4, w / 2, h) : 0;
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + (r ? 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y : '') +
      'H' + (x + w - r) + (r ? 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) : '') + 'V' + (y + h) + 'Z';
  }

  function draw(box, bs, metric, sel, onPick) {
    box.textContent = '';
    var W = Math.max(280, box.clientWidth), H = W < 520 ? 200 : 240;
    var padL = 40, padR = 8, padT = 20, padB = 26;
    var iw = W - padL - padR, ih = H - padT - padB;
    var tot = bs.map(function (b) { return b.puppy[metric] + b.other[metric]; });
    var max = niceMax(Math.max.apply(null, tot.concat([0])));
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': (metric === 'views' ? 'Views' : 'Clicks') + ' by ' + bs.length + ' periods' });
    // Recessive grid with four steps.
    for (var g = 0; g <= 4; g++) {
      var gy = padT + ih - ih * g / 4;
      svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: gy, y2: gy, class: g ? 'tc-grid' : 'tc-base' }));
      var lab = el('text', { x: padL - 6, y: gy + 4, class: 'tc-axis', 'text-anchor': 'end' });
      lab.textContent = n(max * g / 4);
      svg.appendChild(lab);
    }
    var slot = iw / bs.length, bw = Math.max(3, Math.min(48, slot * 0.68));
    var every = Math.max(1, Math.ceil(46 / slot));
    var peak = tot.indexOf(Math.max.apply(null, tot));
    bs.forEach(function (b, i) {
      var x = padL + slot * i + (slot - bw) / 2;
      var hp = ih * b.puppy[metric] / max, ho = ih * b.other[metric] / max;
      var y0 = padT + ih;
      var gp = el('g', { class: 'tc-bar' + (sel === i ? ' on' : '') + (sel != null && sel !== i ? ' dim' : '') });
      // 2px surface gap between the two segments.
      if (hp > 0) gp.appendChild(el('path', { d: seg(x, y0 - hp, bw, hp, ho <= 0), class: 'tc-puppy' }));
      if (ho > 0) gp.appendChild(el('path', { d: seg(x, y0 - hp - ho - (hp > 0 ? 2 : 0), bw, ho, true), class: 'tc-other' }));
      if (tot[i] && (slot >= 26 || i === sel || i === peak)) {
        var t = el('text', { x: x + bw / 2, y: y0 - hp - ho - (hp > 0 && ho > 0 ? 2 : 0) - 5, class: 'tc-val', 'text-anchor': 'middle' });
        t.textContent = n(tot[i]);
        gp.appendChild(t);
      }
      if (i % every === 0 || i === bs.length - 1 && slot * ((bs.length - 1) % every) >= 46) {
        var xl = el('text', { x: x + bw / 2, y: H - 8, class: 'tc-axis', 'text-anchor': 'middle' });
        xl.textContent = b.label;
        gp.appendChild(xl);
      }
      // The hit target is the whole column, wider and taller than the bar.
      var hit = el('rect', { x: padL + slot * i, y: padT - 14, width: slot, height: ih + 14, class: 'tc-hit', tabindex: 0, role: 'button',
        'aria-label': b.title + ': ' + n(tot[i]) + ' ' + metric + ', puppy pages ' + n(b.puppy[metric]) + ', other pages ' + n(b.other[metric]) });
      hit.addEventListener('click', function () { onPick(i); });
      hit.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(i); } });
      hit.addEventListener('mouseenter', function () { tip(box, b, metric, padL + slot * i + slot / 2, W); });
      hit.addEventListener('focus', function () { tip(box, b, metric, padL + slot * i + slot / 2, W); });
      hit.addEventListener('mouseleave', function () { tip(box); });
      hit.addEventListener('blur', function () { tip(box); });
      gp.appendChild(hit);
      svg.appendChild(gp);
    });
    box.appendChild(svg);
  }

  function tip(box, b, metric, x, W) {
    var t = box.parentNode.querySelector('.tc-tip');
    if (!b) { t.hidden = true; return; }
    t.innerHTML = '<b>' + esc(b.title) + '</b><span><i class="tc-key tc-key-total"></i>' + n(b.puppy[metric] + b.other[metric]) + ' ' + metric + ' in all</span>' +
      '<span><i class="tc-key tc-puppy"></i>Puppy pages ' + n(b.puppy[metric]) + '</span><span><i class="tc-key tc-other"></i>Other pages ' + n(b.other[metric]) + '</span>';
    t.hidden = false;
    var w = t.offsetWidth;
    t.style.left = Math.max(0, Math.min(W - w, x - w / 2)) + 'px';
  }

  function mount(host) {
    var st = { by: 'day', metric: 'views', sel: null, kind: 'all', data: null, bs: [] };
    host.innerHTML = '<div class="page-head" style="margin-bottom:.4rem"><div><h2 style="margin:0">Views and clicks over time</h2></div></div><p class="muted small">Loading.</p>';
    A.api('GET', '/api/reports/traffic').then(function (data) {
      st.data = data;
      host.innerHTML = '<div class="page-head tc-head"><div><h2 style="margin:0">Views and clicks over time</h2></div>' +
        '<div class="tc-controls"><div class="seg" role="group" aria-label="Group by">' +
          '<button type="button" data-by="day" class="on">Per day</button><button type="button" data-by="week">Per week</button><button type="button" data-by="month">Per month</button></div>' +
        '<div class="seg" role="group" aria-label="Measure"><button type="button" data-m="views" class="on">Views</button><button type="button" data-m="clicks">Clicks</button></div></div></div>' +
        '<p class="tc-legend"><span><i class="tc-key tc-puppy"></i>Puppy pages</span><span><i class="tc-key tc-other"></i>Other pages</span><span class="muted">The number over a bar is the total.</span></p>' +
        '<div class="tc-wrap"><div class="tc-plot"></div><div class="tc-tip" hidden></div></div>' +
        '<p class="hint tc-note"></p>' +
        '<div class="tc-pick"></div>' +
        '<div class="tc-top"></div>';
      A.$$('[data-by]', host).forEach(function (b) { b.addEventListener('click', function () { st.by = b.dataset.by; st.sel = null; on(host, '[data-by]', b); render(); }); });
      A.$$('[data-m]', host).forEach(function (b) { b.addEventListener('click', function () { st.metric = b.dataset.m; on(host, '[data-m]', b); render(false); }); });
      var t;
      window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { if (document.body.contains(host)) render(false); }, 150); });
      render();
    }).catch(function () { host.querySelector('.muted').textContent = 'The traffic counts could not be loaded.'; });

    function on(root, sel, b) { A.$$(sel, root).forEach(function (x) { x.classList.toggle('on', x === b); }); }

    function render(refetch) {
      st.bs = buckets(st.data, st.by);
      draw(A.$('.tc-plot', host), st.bs, st.metric, st.sel, function (i) { st.sel = st.sel === i ? null : i; render(); });
      var d = st.data;
      A.$('.tc-note', host).textContent = 'Times are UTC days. Puppy pages count from ' + longDay(d.puppies_from) + '. ' +
        (d.pages_from ? 'The other pages count from ' + longDay(d.pages_from) + ', when this chart went live, so that day holds only part of their views' +
          (d.pages_from > d.puppies_from ? ' and earlier bars show puppy pages only. ' : '. ') : 'The other pages count from the day this chart goes live. ') +
        'Puppy Connection’s own browsers and search engine robots are not counted.';
      if (refetch !== false) pick();
      else { summary(); }
    }

    function range() {
      var bs = st.bs;
      if (st.sel != null && bs[st.sel]) return { from: bs[st.sel].from, to: bs[st.sel].to, title: bs[st.sel].title, b: [bs[st.sel]] };
      return { from: bs[0].from, to: bs[bs.length - 1].to, title: longDay(bs[0].from) + ' to ' + longDay(bs[bs.length - 1].to), b: bs };
    }

    function summary() {
      var r = range(), sum = { puppy: { views: 0, clicks: 0 }, other: { views: 0, clicks: 0 } }, kinds = {};
      r.b.forEach(function (b) {
        ['puppy', 'other'].forEach(function (g) { sum[g].views += b[g].views; sum[g].clicks += b[g].clicks; });
        Object.keys(b.kinds).forEach(function (k) { var x = kinds[k] || (kinds[k] = { views: 0, clicks: 0 }); x.views += b.kinds[k].views; x.clicks += b.kinds[k].clicks; });
      });
      var all = { views: sum.puppy.views + sum.other.views, clicks: sum.puppy.clicks + sum.other.clicks };
      var chips = ['all', 'puppy', 'home', 'breed', 'breeder', 'guide', 'other'].map(function (k) {
        var c = k === 'all' ? all : kinds[k] || { views: 0, clicks: 0 };
        return '<button type="button" data-kind="' + k + '"' + (st.kind === k ? ' class="on"' : '') + '>' + (k === 'all' ? 'All pages' : KIND_NAMES[k]) + ' <span class="tc-n">' + n(c[st.metric]) + '</span></button>';
      }).join('');
      A.$('.tc-pick', host).innerHTML = '<h3 class="tc-range">' + esc(r.title) + (st.sel != null ? ' <button type="button" class="btn btn-sm" data-clear>Show the whole chart</button>' : '') + '</h3>' +
        '<p class="tc-sum"><b>' + n(all.views) + '</b> ' + pl(all.views, 'view') + ' and <b>' + n(all.clicks) + '</b> ' + pl(all.clicks, 'click') + ', of which puppy pages had ' + n(sum.puppy.views) + ' ' + pl(sum.puppy.views, 'view') + ' and ' + n(sum.puppy.clicks) + ' ' + pl(sum.puppy.clicks, 'click') + '.' +
        (st.sel == null ? ' Choose a bar to see that ' + st.by + ' alone.' : '') + '</p>' +
        '<div class="seg tc-kinds" role="group" aria-label="Kind of page">' + chips + '</div>';
      var clear = A.$('[data-clear]', host);
      if (clear) clear.addEventListener('click', function () { st.sel = null; render(); });
      A.$$('[data-kind]', host).forEach(function (b) { b.addEventListener('click', function () { st.kind = b.dataset.kind; summary(); top(); }); });
    }

    function pick() { summary(); top(); }

    function top() {
      var r = range(), box = A.$('.tc-top', host), ask = r.from + '|' + r.to + '|' + st.kind;
      box.dataset.ask = ask;
      box.innerHTML = '<p class="muted small">Loading the top pages.</p>';
      A.api('GET', '/api/reports/traffic/top?from=' + r.from + '&to=' + r.to + '&kind=' + st.kind).then(function (t) {
        if (box.dataset.ask !== ask) return;
        if (!t.pages.length) { box.innerHTML = '<p class="muted small">No ' + (st.kind === 'all' ? '' : KIND_NAMES[st.kind].toLowerCase() + ' ') + 'views were counted in this period.</p>'; return; }
        var site = t.site ? t.site.replace(/\/$/, '') + '/' : null;
        box.innerHTML = '<div class="table-wrap"><table class="list"><thead><tr><th>Top pages</th><th class="hide-sm">Kind</th><th class="num">Views</th><th class="num">Clicks</th></tr></thead><tbody>' +
          t.pages.map(function (p) {
            var name = '<b>' + esc(p.label) + '</b>';
            if (site && p.page) name = '<a href="' + esc(site + (p.page === 'index' ? '' : p.page + '.html')) + '" target="_blank" rel="noopener">' + name + '</a>';
            return '<tr><td>' + name + (p.sub ? '<span class="sub">' + esc(p.sub) + '</span>' : '') + '</td><td class="hide-sm small muted">' + esc(KIND_NAMES[p.kind] || p.kind) + '</td>' +
              '<td class="num">' + n(p.views) + '</td><td class="num">' + n(p.clicks) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }).catch(function () { box.innerHTML = '<p class="muted small">The top pages could not be loaded.</p>'; });
    }
  }

  window.pcTraffic = { mount: mount, buckets: buckets };
})();
