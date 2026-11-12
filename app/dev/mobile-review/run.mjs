// Walk every item in the mobile review inventory at each width, measure it with measure.js and save
// a screenshot (mobile review, 2026-11-11). Needs the local portal on 8787 and admin on 8788 sharing
// one database, seeded with --demo, and Puppy Connection access on for demo-maplebrook.
//
//   node app/dev/mobile-review/run.mjs <out-dir> [widths=360,390,430,1440] [only=regex]
//
// Writes <out-dir>/results.json and <out-dir>/shots/<item>-<width>.png.

import fs from 'node:fs';
import path from 'node:path';
import { launch } from './cdp.mjs';

const OUT = path.resolve(process.argv[2] || 'mobile-review-out');
const WIDTHS = (process.argv[3] || '360,390,430,1440').split(',').map(Number);
const ONLY = process.argv[4] ? new RegExp(process.argv[4]) : null;
const P = 'http://localhost:8787', A = 'http://localhost:8788';
const BREEDER = 'demo-maplebrook';
const MEASURE = fs.readFileSync(new URL('./measure.js', import.meta.url), 'utf8');
// The phone-row checks of 2026-11-12 (rows.js), kept apart from measure.js so the November 11 numbers still compare.
const ROWS = fs.readFileSync(new URL('./rows.js', import.meta.url), 'utf8');

// In-page helpers: click the first visible control whose text starts with a label.
const HELP = `
window.__vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
window.__click = (label, scope) => {
  const root = scope ? document.querySelector(scope) : document;
  if (!root) throw new Error('no scope ' + scope);
  const els = [...root.querySelectorAll('button, a, summary, [role=button], label')].filter(__vis);
  const e = els.find((x) => (x.textContent || x.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').startsWith(label));
  if (!e) throw new Error('no control "' + label + '"');
  e.scrollIntoView({ block: 'center' }); e.click(); return true;
};`;

const click = (label, scope) => `__click(${JSON.stringify(label)}${scope ? ', ' + JSON.stringify(scope) : ''})`;
const menu = `document.querySelector('.menu-btn') && getComputedStyle(document.querySelector('.menu-btn')).display !== 'none' ? (document.querySelector('.menu-btn').click(), 1) : 0`;

// Each item: id, app, url, steps (in-page expressions run in order with a pause between), and
// phoneOnly when it means nothing on a desktop.
const ITEMS = [
  // portal, signed out (before the hand-over sets a session)
  { id: 'p-signin', app: 'portal', out: true, url: `${P}/` },
  { id: 'p-forgot', app: 'portal', out: true, url: `${P}/`, steps: [`document.querySelector('[data-mode=forgot]').click()`] },
  { id: 'p-signup', app: 'portal', out: true, url: `${P}/`, steps: [`document.querySelector('[data-mode=signup]').click()`] },
  { id: 'p-set-password', app: 'portal', out: true, url: `${P}/auth/set-password?t=nope` },
  { id: 'p-privacy', app: 'portal', out: true, url: `${P}/privacy` },
  { id: 'p-terms-page', app: 'portal', out: true, url: `${P}/terms` },
  { id: 'p-report', app: 'portal', out: true, url: `${P}/report` },
  { id: 'p-checkout-cancel', app: 'portal', out: true, url: `${P}/checkout/cancel` },
  { id: 'p-handoff-expired', app: 'portal', out: true, url: `${P}/auth/handoff?t=nope` },
  // portal, as Maple Brook Doodles
  { id: 'p-overview', app: 'portal', url: `${P}/#/` },
  { id: 'p-menu', app: 'portal', url: `${P}/#/litters`, steps: [menu], phoneOnly: true },
  { id: 'p-profile', app: 'portal', url: `${P}/#/profile` },
  { id: 'p-add-kennel', app: 'portal', url: `${P}/#/add-kennel` },
  { id: 'p-litters', app: 'portal', url: `${P}/#/litters` },
  { id: 'p-litter-add', app: 'portal', url: `${P}/#/litters`, steps: [click('Add a litter')] },
  { id: 'p-litter-edit', app: 'portal', url: `${P}/#/litters`, steps: [click('Edit litter')] },
  { id: 'p-add-several', app: 'portal', url: `${P}/#/litters`, steps: [click('Add several')] },
  { id: 'p-puppy', app: 'portal', url: `${P}/#/litters`, steps: [click('Edit', '.puppy-card')] },
  { id: 'p-puppy-photos', app: 'portal', url: `${P}/#/litters`, steps: [click('Edit', '.puppy-card'), `document.querySelector('#photo-step') && document.querySelector('#photo-step').scrollIntoView()`] },
  // Save stays on screen while the puppy form is scrolled (option 1): the bar's bottom against the screen's
  { id: 'p-puppy-savebar', app: 'portal', url: `${P}/#/litters`, phoneOnly: true, viewport: true, steps: [click('Edit', '.puppy-card'), `document.querySelector('.drawer-body').scrollTop = 900; return 1`],
    probe: `const b = document.querySelector('.drawer-body form > .btn-row:last-child'); const r = b.getBoundingClientRect(); return { barTop: Math.round(r.top), barBottom: Math.round(r.bottom), screen: innerHeight, position: getComputedStyle(b).position }` },
  { id: 'p-face', app: 'portal', url: `${P}/#/litters`, steps: [click('Edit', '.puppy-card'), click('Face', '.drawer')] },
  { id: 'p-confirm', app: 'portal', url: `${P}/#/litters`, steps: [click('Edit', '.puppy-card'), click('Remove puppy', '.drawer')] },
  { id: 'p-parents', app: 'portal', url: `${P}/#/parents` },
  { id: 'p-parent-add', app: 'portal', url: `${P}/#/parents`, steps: [click('Add a mom')] },
  { id: 'p-pay', app: 'portal', url: `${P}/#/pay` },
  { id: 'p-payments', app: 'portal', url: `${P}/#/payments` },
  { id: 'p-stats', app: 'portal', url: `${P}/#/stats` },
  { id: 'p-account', app: 'portal', url: `${P}/#/account` },
  { id: 'p-help', app: 'portal', url: `${P}/#/help` },
  { id: 'p-tour', app: 'portal', url: `${P}/#/help`, steps: [click('Watch the walkthrough')] },
  // admin
  { id: 'a-overview', app: 'admin', url: `${A}/#/` },
  { id: 'a-menu', app: 'admin', url: `${A}/#/breeders`, steps: [menu], phoneOnly: true },
  { id: 'a-checklist', app: 'admin', url: `${A}/#/checklist` },
  { id: 'a-checklist-add', app: 'admin', url: `${A}/#/checklist`, steps: [click('Add an item')] },
  { id: 'a-approvals', app: 'admin', url: `${A}/#/approvals` },
  { id: 'a-decide', app: 'admin', url: `${A}/#/approvals/demo-thistledown`, steps: [click('Decline', '.drawer')] },
  { id: 'a-reported', app: 'admin', url: `${A}/#/reported` },
  { id: 'a-photo-review', app: 'admin', url: `${A}/#/photo-review` },
  { id: 'a-breeders', app: 'admin', url: `${A}/#/breeders` },
  { id: 'a-breeder', app: 'admin', url: `${A}/#/breeders/${BREEDER}` },
  { id: 'a-photos', app: 'admin', url: `${A}/#/breeders/${BREEDER}`, steps: [click('Photos', '.drawer')] },
  { id: 'a-edit-profile', app: 'admin', url: `${A}/#/breeders/${BREEDER}`, steps: [click('Edit profile', '.drawer')] },
  { id: 'a-edit-litter', app: 'admin', url: `${A}/#/breeders/${BREEDER}`, steps: [click('Edit litter', '.drawer')] },
  { id: 'a-edit-puppy', app: 'admin', url: `${A}/#/breeders/${BREEDER}`, steps: [`[...document.querySelectorAll('.drawer [data-edit-puppy]')].find(__vis).click()`] },
  { id: 'a-add-breeder', app: 'admin', url: `${A}/#/breeders`, steps: [click('Add a breeder')] },
  { id: 'a-listings', app: 'admin', url: `${A}/#/listings` },
  { id: 'a-breeds', app: 'admin', url: `${A}/#/breeds` },
  { id: 'a-breed-add', app: 'admin', url: `${A}/#/breeds`, steps: [click('Add a breed')] },
  { id: 'a-payments', app: 'admin', url: `${A}/#/payments` },
  ...['traffic', 'months', 'breeds', 'views', 'searches', 'new', 'sales', 'glance'].map((t) => ({ id: `a-reports-${t}`, app: 'admin', url: `${A}/#/reports?tab=${t}` })),
  { id: 'a-list', app: 'admin', url: `${A}/#/list` },
  { id: 'a-people', app: 'admin', url: `${A}/#/people` },
  { id: 'a-publish', app: 'admin', url: `${A}/#/publish` },
  { id: 'a-terms', app: 'admin', url: `${A}/#/terms` },
  { id: 'a-email', app: 'admin', url: `${A}/#/email` },
  { id: 'a-settings', app: 'admin', url: `${A}/#/settings` },
  { id: 'a-activity', app: 'admin', url: `${A}/#/activity` },
  { id: 'a-search', app: 'admin', url: `${A}/#/search?q=maple` },
];

const b = await launch();
const pg = await b.page();
const results = fs.existsSync(path.join(OUT, 'results.json')) && ONLY ? JSON.parse(fs.readFileSync(path.join(OUT, 'results.json'), 'utf8')) : {};
let handedOver = false;

async function handover() {
  await pg.viewport(1440, 900);
  await pg.goto(`${A}/#/`);
  const url = await pg.eval(`return fetch('/api/breeders/${BREEDER}/manage',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}).then(r=>r.json()).then(j=>j.url)`);
  await pg.goto(url, 1200);
  // keep the walkthrough from opening on its own, and the screens from carrying a stale drawer
  handedOver = true;
}

async function shootItem(file, drawerOpen) {
  if (drawerOpen) {
    // let a fixed drawer or dialog grow to its content so the whole of it is in the picture
    await pg.eval(`for (const d of document.querySelectorAll('.drawer, .tour')) { d.style.position = 'absolute'; d.style.height = 'auto'; d.style.minHeight = '100vh'; d.style.bottom = 'auto'; d.style.top = '0'; d.style.maxHeight = 'none'; d.style.overflow = 'visible'; }
      for (const d of document.querySelectorAll('.drawer-body, .tour-body')) { d.style.overflow = 'visible'; d.style.maxHeight = 'none'; }
      window.scrollTo(0, 0); return 1`);
  }
  await pg.shot(file, { full: true });
}

const items = ITEMS.filter((it) => !ONLY || ONLY.test(it.id)).sort((x, y) => (y.out ? 1 : 0) - (x.out ? 1 : 0));
for (const it of items) {
  if (!it.out && !handedOver) await handover();
  for (const w of WIDTHS) {
    if (it.phoneOnly && w > 860) continue;
    const key = `${it.id}@${w}`;
    try {
      await pg.viewport(w, 844);
      await pg.goto('about:blank', 50);
      await pg.goto(it.url, 1100);
      await pg.eval(HELP + MEASURE + ROWS + '; try { localStorage.setItem("pc-tour-seen", "1") } catch (e) {}; return 1');
      for (const s of it.steps || []) { await pg.eval(s); await pg.wait(700); }
      const m = await pg.eval('window.__measure()');
      m.rows = await pg.eval('window.__rows()');
      const drawer = await pg.eval(`!!document.querySelector('.drawer, .tour, dialog[open]')`);
      m.drawer = drawer;
      if (it.probe) m.probe = await pg.eval(it.probe);
      const shot = path.join(OUT, 'shots', `${it.id}-${w}.png`);
      if (it.viewport) await pg.shot(shot); else await shootItem(shot, drawer);
      results[key] = { id: it.id, app: it.app, w, url: it.url, ...m, shot: path.relative(OUT, shot).replace(/\\/g, '/') };
      process.stdout.write(`${key} ${m.findings.length}\n`);
    } catch (err) {
      results[key] = { id: it.id, app: it.app, w, url: it.url, error: String(err.message || err) };
      process.stdout.write(`${key} ERROR ${err.message}\n`);
    }
  }
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
if (pg.errors.length) console.log('page errors:', [...new Set(pg.errors)].slice(0, 10));
await b.close();
