// Layout checks for one screen at the current viewport, injected by run.mjs (mobile review,
// 2026-11-11). It returns findings, never judgments: each carries the element, the check and the
// number, so the batch file can record the measurement. A check counts only what is visible.
//
//   overflow   the page scrolls sideways, or an element runs past the screen edge, outside a
//              deliberate sideways scroller
//   escape     an element sits more than 1px outside the card, section, drawer or form holding it
//   tap        a control under 44px tall or wide (inline links inside running text are exempt,
//              as WCAG 2.5.8 exempts them)
//   overlap    two controls whose boxes intersect
//   row        controls side by side whose heights differ by more than 2px, or whose tops differ
//              by 1 to 6px (the same line, not quite aligned)
//   clip       text cut off by overflow hidden, including an ellipsis
//   fixed      a fixed or sticky bar, with whether the page leaves room for it
window.__measure = function measure() {
  const W = document.documentElement.clientWidth;
  const H = window.innerHeight;
  const out = { w: W, scrollW: document.documentElement.scrollWidth, hash: location.hash, findings: [] };
  const add = (check, el, detail) => out.findings.push({ check, el: name(el), ...detail });
  const vis = (e) => {
    if (!(e instanceof Element)) return false;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      if (n.hasAttribute('inert') || n.closest('[aria-hidden="true"]')) return false;
      // inside a closed details, apart from its summary
      if (n.parentElement && n.parentElement.tagName === 'DETAILS' && !n.parentElement.open && n.tagName !== 'SUMMARY') return false;
    }
    // scrolled out of view inside a scrolling box (a drawer body, a pick list)
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (/auto|scroll|hidden|clip/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) {
        const b = n.getBoundingClientRect();
        if (r.bottom <= b.top + 1 || r.top >= b.bottom - 1) return false;
      }
    }
    return true;
  };
  function name(e) {
    if (!e) return '';
    let s = e.tagName.toLowerCase();
    if (e.id) s += '#' + e.id;
    const c = [...e.classList].slice(0, 3);
    if (c.length) s += '.' + c.join('.');
    const t = (e.getAttribute('aria-label') || e.textContent || e.value || e.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return t ? `${s} "${t}"` : s;
  }
  const scrollerX = (e) => {
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return n;
    }
    return null;
  };
  // With a drawer, dialog or walkthrough open, only what is in it counts: the page behind sits
  // under a scrim and cannot be reached, so its controls are not overlapped in any way that matters.
  const layers = [...document.querySelectorAll('dialog[open], .tour, .drawer')].filter(vis);
  const top = layers[0] || null;
  out.layer = top ? name(top).split(' ')[0] : null;
  const all = [...(top || document.body).querySelectorAll('*')].filter((e) => !/^(SCRIPT|STYLE|svg|path|OPTION|BR)$/i.test(e.tagName) && !e.closest('svg') && vis(e));

  // overflow: report the outermost element that runs past the edge while its parent does not
  if (out.scrollW > W + 1) out.findings.push({ check: 'overflow', el: 'document', px: out.scrollW - W, note: 'the page scrolls sideways' });
  for (const e of all) {
    if (scrollerX(e)) continue;
    const r = e.getBoundingClientRect();
    const over = Math.max(r.right - W, -r.left);
    if (over <= 1) continue;
    const p = e.parentElement; const pr = p && p.getBoundingClientRect();
    if (p && vis(p) && Math.max(pr.right - W, -pr.left) >= over - 1) continue;
    if (getComputedStyle(e).position === 'fixed' && r.left >= W) continue; // off-canvas, closed
    add('overflow', e, { px: Math.round(over) });
  }

  // escape: an element outside the box that holds it
  const BOX = '.card, section, .panel, .drawer, .sheet, dialog, form, fieldset, .box, .tile, .row-card, li, td, .field';
  for (const e of all) {
    if (!e.matches('a, button, input, select, textarea, label, img, p, h1, h2, h3, h4, span, strong, .btn, .chip, .tally')) continue;
    const box = e.parentElement && e.parentElement.closest(BOX);
    if (!box || !vis(box) || scrollerX(e) && box.contains(scrollerX(e))) continue;
    const r = e.getBoundingClientRect(); const b = box.getBoundingClientRect();
    const out1 = Math.max(b.left - r.left, r.right - b.right);
    if (out1 > 1.5) add('escape', e, { px: Math.round(out1), box: name(box).split(' ')[0] });
  }

  // tap targets
  const controls = all.filter((e) => e.matches('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], summary'));
  for (const e of controls) {
    if (e.matches('input[type=checkbox], input[type=radio]')) {
      const lab = e.closest('label') || (e.id && document.querySelector(`label[for="${e.id}"]`));
      const r = (lab && vis(lab) ? lab : e).getBoundingClientRect();
      if (r.height < 44) add('tap', lab || e, { h: Math.round(r.height), w: Math.round(r.width), note: 'checkbox with its label' });
      continue;
    }
    if (e.matches('a') && e.closest('p, li > span, td, .help, .note, small, .standing, .hint, .why') && !e.matches('.btn, [class*=btn]')) {
      const parentText = (e.parentElement.textContent || '').trim().length;
      if (parentText > (e.textContent || '').trim().length + 3) continue; // inline link in running text
    }
    const r = e.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) add('tap', e, { h: Math.round(r.height), w: Math.round(r.width) });
  }

  // the part of an element its scrolling boxes leave visible
  const shown = (e) => {
    const r = e.getBoundingClientRect(); let t = r.top, btm = r.bottom, l = r.left, rt = r.right;
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      if (!/auto|scroll|hidden|clip/.test(getComputedStyle(n).overflowY)) continue;
      const q = n.getBoundingClientRect(); t = Math.max(t, q.top); btm = Math.min(btm, q.bottom); l = Math.max(l, q.left); rt = Math.min(rt, q.right);
    }
    return { top: t, bottom: btm, left: l, right: rt };
  };
  // overlap between controls
  for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
    const a = controls[i], b = controls[j];
    if (a.contains(b) || b.contains(a)) continue;
    // a control drawn inside a field on purpose, such as Show password
    if ([a, b].some((x) => x.matches('.pw-show, .combo-clear'))) continue;
    // a sticky or fixed bar covers what scrolls under it on purpose, and a control scrolled under
    // a drawer's head is clipped by the drawer body, so neither pair is two controls on top of each other
    const pinned = (x) => { for (let n = x; n && n !== document.body; n = n.parentElement) { const ps = getComputedStyle(n).position; if (ps === 'sticky' || ps === 'fixed') return n; } return null; };
    if (pinned(a) !== pinned(b)) continue;
    const ra = shown(a), rb = shown(b);
    const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ix > 1 && iy > 1) add('overlap', a, { with: name(b), px: `${Math.round(ix)}x${Math.round(iy)}` });
  }

  // button rows: siblings under one parent on the same line
  const parents = new Set(controls.filter((e) => e.matches('button, .btn, a.btn, select, input[type=submit]')).map((e) => e.parentElement));
  for (const p of parents) {
    const kids = [...p.children].filter((k) => vis(k) && k.matches('button, .btn, a.btn, select, input[type=submit], input[type=search], input[type=text]'));
    if (kids.length < 2) continue;
    const rs = kids.map((k) => k.getBoundingClientRect());
    const lines = [];
    rs.forEach((r, i) => { const l = lines.find((x) => Math.abs(x.top - r.top) < 8); if (l) l.items.push(i); else lines.push({ top: r.top, items: [i] }); });
    for (const l of lines) {
      if (l.items.length < 2) continue;
      const hs = l.items.map((i) => rs[i].height); const ts = l.items.map((i) => rs[i].top);
      const dh = Math.max(...hs) - Math.min(...hs); const dt = Math.max(...ts) - Math.min(...ts);
      if (dh > 2 || dt > 1) add('row', p, { heights: hs.map(Math.round).join('/'), topDiff: Math.round(dt) });
    }
    if (lines.length > 1) {
      const widths = lines.map((l) => l.items.map((i) => Math.round(rs[i].width)).join('+'));
      const full = p.getBoundingClientRect().width;
      const ragged = lines.some((l) => l.items.length === 1 && rs[l.items[0]].width < full * 0.9) && lines.some((l) => l.items.length > 1);
      if (ragged) add('row', p, { wrap: widths.join(' | '), note: 'wraps unevenly' });
    }
  }

  // clipped text
  for (const e of all) {
    const cs = getComputedStyle(e);
    if (!/hidden|clip/.test(cs.overflowX + cs.overflowY) && cs.textOverflow !== 'ellipsis') continue;
    if (!e.textContent.trim() || e.matches(".sr, .sr-only, .visually-hidden") || e.matches("img, video, canvas, iframe") || e.children.length > 3) continue;
    // a box whose only overflow is visually hidden text (.sr) clips nothing anyone sees
    const er = e.getBoundingClientRect();
    const seenPast = !e.children.length || [...e.querySelectorAll('*')].some((d) => !d.closest('.sr') && vis(d) && d.getBoundingClientRect().right > er.right + 1);
    if (e.scrollWidth > e.clientWidth + 1 && seenPast) add('clip', e, { px: e.scrollWidth - e.clientWidth, axis: 'x' });
    else if (e.scrollHeight > e.clientHeight + 2 && cs.overflowY !== 'visible' && !/auto|scroll/.test(cs.overflowY)) add('clip', e, { px: e.scrollHeight - e.clientHeight, axis: 'y' });
  }

  // fixed and sticky bars
  for (const e of all) {
    const pos = getComputedStyle(e).position;
    if (pos !== 'fixed' && pos !== 'sticky') continue;
    if (e.parentElement && ['fixed', 'sticky'].includes(getComputedStyle(e.parentElement).position)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < W * 0.5 && r.height < 80) continue;
    if (r.height > H * 0.9) continue; // a full-screen drawer or menu
    add('fixed', e, { pos, top: Math.round(r.top), h: Math.round(r.height), bottomBar: r.bottom >= H - 2 });
  }

  // dedupe identical lines
  const seen = new Set();
  out.findings = out.findings.filter((f) => { const k = JSON.stringify(f); if (seen.has(k)) return false; seen.add(k); return true; });
  return out;
};
