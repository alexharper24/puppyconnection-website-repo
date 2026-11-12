// The phone-row checks (Alex, 2026-11-12, app/docs/batch-2026-11-12-mobile-rows.md), run in the page
// beside measure.js. window.__rows() returns one entry per visible .mrow and per toolbar filter:
//   photo: the photo's height against the text beside it (rows 1 to 3), and its ratio
//   acts: the action buttons' tops and heights, and any label cut short (scrollWidth over clientWidth)
//   line1/line2: text cut short with an ellipsis, which is allowed but reported
//   filters: a search, select or segment that is not the full width of its toolbar
window.__rows = function () {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const name = (e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const out = { rows: [], filters: [], problems: [] };
  for (const m of document.querySelectorAll('.mrow')) {
    if (!vis(m)) continue;
    const ph = m.querySelector('.mrow-ph'), l1 = m.querySelector('.mrow-1'), l2 = m.querySelector('.mrow-2'), l3 = m.querySelector('.mrow-3');
    const top = l1.getBoundingClientRect().top, bottom = (l3 || l2).getBoundingClientRect().bottom;
    const row = { name: name(m.querySelector('.mrow-name')), text_h: Math.round(bottom - top) };
    if (ph) {
      const r = ph.getBoundingClientRect();
      row.photo = { w: Math.round(r.width), h: Math.round(r.height), ratio: +(r.width / r.height).toFixed(2), top_gap: Math.round(r.top - top) };
      if (Math.abs(r.height - (bottom - top)) > 1) out.problems.push({ check: 'photo-height', row: row.name, photo_h: row.photo.h, text_h: row.text_h });
    }
    const n = m.querySelector('.mrow-name'), side = m.querySelector('.mrow-side');
    row.name_cut = n.scrollWidth > n.clientWidth + 1;
    row.name_w = Math.round(n.getBoundingClientRect().width);
    if (row.name_w < 60) out.problems.push({ check: 'name-squeezed', row: row.name, name_w: row.name_w, side_w: side ? Math.round(side.getBoundingClientRect().width) : 0 });
    row.line2_cut = l2.scrollWidth > l2.clientWidth + 1;
    if (l3) {
      const bs = [...l3.children].filter(vis);
      const rs = bs.map((b) => b.getBoundingClientRect());
      row.acts = bs.map((b, i) => ({ label: name(b), w: Math.round(rs[i].width), h: Math.round(rs[i].height), cut: b.scrollWidth > b.clientWidth + 1 }));
      const tops = new Set(rs.map((r) => Math.round(r.top))), hs = new Set(rs.map((r) => Math.round(r.height)));
      if (tops.size > 1) out.problems.push({ check: 'acts-wrap', row: row.name, tops: [...tops] });
      if (hs.size > 1) out.problems.push({ check: 'acts-heights', row: row.name, heights: [...hs] });
      for (const a of row.acts) if (a.cut) out.problems.push({ check: 'label-cut', row: row.name, label: a.label, w: a.w });
      for (const a of row.acts) if (a.h < 44) out.problems.push({ check: 'tap-under-44', row: row.name, label: a.label, h: a.h });
      const lr = l3.getBoundingClientRect(), mr = m.getBoundingClientRect();
      if (lr.right > mr.right + 1) out.problems.push({ check: 'acts-overflow', row: row.name, by: Math.round(lr.right - mr.right) });
    }
    if (m.getBoundingClientRect().right > document.documentElement.clientWidth + 1) out.problems.push({ check: 'row-overflow', row: row.name });
    out.rows.push(row);
  }
  for (const bar of document.querySelectorAll('.toolbar, .pup-search')) {
    if (!vis(bar)) continue;
    const cs = getComputedStyle(bar), inner = bar.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    for (const c of bar.querySelectorAll(':scope > input[type=search], :scope > select, :scope > .combo, :scope > .seg')) {
      if (!vis(c)) continue;
      const w = c.getBoundingClientRect().width;
      out.filters.push({ el: c.tagName.toLowerCase() + (c.className ? '.' + String(c.className).split(' ')[0] : ''), w: Math.round(w), of: Math.round(inner) });
      if (innerWidth <= 860 && w < inner - 1) out.problems.push({ check: 'filter-not-full', el: c.tagName.toLowerCase(), w: Math.round(w), of: Math.round(inner) });
    }
  }
  return out;
};
