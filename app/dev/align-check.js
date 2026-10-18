// Alignment check for a built site (launch item G10). Paste into the browser console of any
// page on the served site, or run through a browser tool, then call:
//
//   await alignCheck(['/index.html', '/breeds.html'], [1280, 1440])
//
// For each page and width it loads the page in an iframe of that width and, for every section in
// <main>, reports the left edge of its content, the empty space left and right of the content as
// a share of the section's content box, and for each two-column grid whether the columns start and
// end on one line. A section is flagged when its content leaves more than 30% of the content box
// empty on one side while the other side is under 5% (an off-center group), when its content
// starts left of or right of the page's common left edge, or when a two-column grid's columns
// differ by more than 120px at the bottom or 4px at the top.
window.alignCheck = async (pages, widths) => {
  const rows = [];
  for (const w of widths) for (const pg of pages) {
    document.querySelectorAll('iframe.align-chk').forEach((x) => x.remove());
    const f = document.createElement('iframe');
    f.className = 'align-chk';
    f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:900px;border:0;z-index:99999;background:#fff`;
    f.src = pg + (pg.includes('?') ? '&' : '?') + 't=' + Date.now();
    document.body.appendChild(f);
    await new Promise((r) => (f.onload = r));
    await new Promise((r) => setTimeout(r, 450));
    const d = f.contentDocument, win = f.contentWindow;
    const vis = (e) => { const cs = win.getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 1 && r.height > 1; };
    const leaves = (root) => [...root.querySelectorAll('h1,h2,h3,p,li,img,figure,a.btn,dl,form,.card,.price-card,.breed-buy,.breeder-box,iframe,blockquote')].filter(vis);
    const secs = [...d.querySelectorAll('main section')].filter((s) => vis(s) && !s.closest('section section') && s.parentElement.closest('section') === null);
    const page = { pg, w, sections: [] };
    for (const s of secs) {
      const wrap = s.querySelector(':scope > .wrap') || s;
      const wr = wrap.getBoundingClientRect(), cs = win.getComputedStyle(wrap);
      const cl = wr.left + parseFloat(cs.paddingLeft), cr = wr.right - parseFloat(cs.paddingRight), cw = cr - cl;
      const ls = leaves(wrap);
      if (!ls.length) continue;
      // text blocks report their line box, not the block: a capped paragraph ends where its text ends
      const ext = ls.map((e) => {
        const r = e.getBoundingClientRect();
        if (/^(P|LI|H1|H2|H3)$/.test(e.tagName)) {
          const rg = d.createRange(); rg.selectNodeContents(e);
          const rs = [...rg.getClientRects()].filter((x) => x.width > 0);
          if (rs.length) return [Math.min(...rs.map((x) => x.left)), Math.max(...rs.map((x) => x.right))];
        }
        return [r.left, r.right];
      });
      const L = Math.min(...ext.map((x) => x[0])), R = Math.max(...ext.map((x) => x[1]));
      const grids = [...wrap.querySelectorAll(':scope > *, :scope > * > *')].filter((g) => { const gs = win.getComputedStyle(g); return gs.display === 'grid' && gs.gridTemplateColumns.trim().split(/\s+/).length === 2 && !g.matches('.highlights,.includes,.facts,.foot-grid,.grid'); }).concat(win.getComputedStyle(wrap).display === 'grid' && win.getComputedStyle(wrap).gridTemplateColumns.trim().split(/\s+/).length === 2 ? [wrap] : []);
      const cols = [...new Set(grids)].map((g) => {
        const kids = [...g.children].filter(vis).map((k) => k.getBoundingClientRect());
        const mid = g.getBoundingClientRect().left + g.getBoundingClientRect().width / 2;
        const a = kids.filter((k) => k.left < mid - 2), b = kids.filter((k) => k.left >= mid - 2);
        if (!a.length || !b.length) return null;
        const top = (k) => Math.min(...k.map((x) => x.top)), bot = (k) => Math.max(...k.map((x) => x.bottom));
        return { topDiff: Math.round(top(b) - top(a)), endDiff: Math.round(bot(b) - bot(a)) };
      }).filter(Boolean);
      page.sections.push({ cls: s.className + (s.id ? '#' + s.id : ''), left: Math.round(L - cl), leftGap: +((L - cl) / cw).toFixed(2), rightGap: +((cr - R) / cw).toFixed(2), contentLeft: Math.round(cl), cols });
    }
    const edges = page.sections.map((x) => x.contentLeft + x.left);
    const common = edges.sort((a, b) => edges.filter((v) => v === a).length - edges.filter((v) => v === b).length).pop();
    page.flags = [];
    for (const x of page.sections) {
      if (Math.abs(x.contentLeft + x.left - common) > 4) page.flags.push(`${x.cls}: content starts at ${x.contentLeft + x.left}, page edge ${common}`);
      if (x.rightGap > 0.3 && x.leftGap < 0.05) page.flags.push(`${x.cls}: ${Math.round(x.rightGap * 100)}% empty on the right`);
      for (const c of x.cols) if (Math.abs(c.topDiff) > 4 || Math.abs(c.endDiff) > 120) page.flags.push(`${x.cls}: columns top ${c.topDiff}px, end ${c.endDiff}px apart`);
    }
    page.overflow = d.documentElement.scrollWidth > d.documentElement.clientWidth;
    rows.push(page);
  }
  document.querySelectorAll('iframe.align-chk').forEach((x) => x.remove());
  return rows;
};
