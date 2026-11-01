// The traffic chart on Reports (Alex, 2026-11-01): page counts on the site and the admin's
// traffic routes, against the local database.
//
//   node app/dev/traffic-test.mjs
//   ADMIN=http://127.0.0.1:8852 node app/dev/traffic-test.mjs   the admin on another port
//
// The beacon is driven on Node against app/.state, as launch-features-test.mjs does, so it needs
// node app/dev/setup.mjs --reset and no site Worker. The admin part needs pc-admin running on
// current code (8788 unless ADMIN says otherwise) and is skipped when it does not answer.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordBeacon, pageKind } from '../lib/stats.js';
import { d1, localD1File } from './node-env.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
let pass = 0, fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass += 1; console.log(`  ok   ${name}`); } else { fail += 1; console.log(`  FAIL ${name}${detail ? `\n       ${detail}` : ''}`); }
}

const db = d1(localD1File());
const one = async (sql, ...b) => (await db.prepare(sql).bind(...b).first()) || {};
// The site's assets: these pages exist, anything else answers 404.
const PAGES = new Set(['/index.html', '/about.html', '/breeds.html', '/breed-havanese.html', '/guide-havanese-size.html']);
const env = { DB: db, ASSETS: { fetch: async (req) => new Response(null, { status: PAGES.has(new URL(req.url).pathname) ? 200 : 404 }) } };
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0';
const beacon = (body, { origin = 'https://site.test', ua = BROWSER } = {}) => recordBeacon(new Request('https://site.test/api/beacon',
  { method: 'POST', headers: { origin, 'user-agent': ua, 'content-type': 'text/plain' }, body: JSON.stringify(body) }), env);
const day = new Date().toISOString().slice(0, 10);
const page = (p) => one('SELECT COALESCE(SUM(views), 0) AS v, COALESCE(SUM(clicks), 0) AS c FROM page_stats WHERE page = ? AND day = ?', p, day);
const daily = (k) => one('SELECT COALESCE(SUM(views), 0) AS v, COALESCE(SUM(clicks), 0) AS c FROM traffic_daily WHERE kind = ? AND day = ?', k, day);

console.log('\n-- the kind of each page');
check('pageKind sorts the site\'s pages', [['index', 'home'], ['puppy-max-havanese', 'puppy'], ['breeds', 'breed'], ['breed-havanese', 'breed'],
  ['breeders', 'breeder'], ['breeder-teapup', 'breeder'], ['guides', 'guide'], ['guide-havanese-size', 'guide'], ['puppies', 'other'], ['about', 'other'], ['puppy', 'other']]
  .every(([p, k]) => pageKind(p) === k));

console.log('\n-- page counts');
{
  const b0 = await page('breed-havanese'), d0 = await daily('breed');
  const r = await beacon({ k: 'page', s: 'breed-havanese' });
  const b1 = await page('breed-havanese'), d1v = await daily('breed');
  check('a view of a breed page is counted for the page and the day\'s breed total', r.why === 'counted' && b1.v === b0.v + 1 && d1v.v === d0.v + 1, `${r.why} ${JSON.stringify([b0, b1, d0, d1v])}`);
  const r2 = await beacon({ k: 'pclick', s: 'about' });
  const a = await page('about');
  check('a click on another page is counted as a click', r2.why === 'counted' && a.c >= 1, r2.why);
  const h0 = await daily('home');
  await beacon({ k: 'page', s: 'index' });
  check('the home page counts as home', (await daily('home')).v === h0.v + 1);
  const g0 = await daily('guide');
  await beacon({ k: 'page', s: 'guide-havanese-size' });
  check('a guide counts as a guide', (await daily('guide')).v === g0.v + 1);
}
check('a page the site does not serve is not counted', (await beacon({ k: 'page', s: 'no-such-page' })).why === 'unknown');
check('a puppy page sent as a page is not counted twice', (await beacon({ k: 'page', s: 'puppy-max-havanese' })).why === 'shape');
check('a path outside the site is refused', (await beacon({ k: 'page', s: '../etc/passwd' })).why === 'shape');
check('a page count from another site is refused', (await beacon({ k: 'page', s: 'about' }, { origin: 'https://evil.example' })).why === 'origin');
check('a robot is not counted', (await beacon({ k: 'page', s: 'about' }, { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' })).why === 'bot');
{
  const pup = await one('SELECT slug FROM public_puppies LIMIT 1');
  const p0 = await daily('puppy');
  const r = await beacon({ k: 'view', s: pup.slug });
  check('a puppy view still counts in puppy_stats and adds to the day\'s puppy total', r.why === 'counted' && (await daily('puppy')).v === p0.v + 1, r.why);
}
for (const t of ['page_stats', 'traffic_daily']) {
  const { results } = await db.prepare(`SELECT name FROM pragma_table_info('${t}')`).all();
  const cols = results.map((c) => c.name).sort().join();
  check(`${t} keeps nothing about the visitor`, cols === (t === 'page_stats' ? 'clicks,day,page,views' : 'clicks,day,kind,views'), cols);
}
{
  const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('page_stats_day', 'puppy_stats_day')").all();
  check('the chart\'s date queries have their day indexes', results.length === 2, JSON.stringify(results));
}
db.close && db.close();

console.log('\n-- the site script');
{
  const gen = fs.readFileSync(path.join(APP, 'build/generate.mjs'), 'utf8');
  const m = gen.match(/const PAGE_COUNT_JS = `([\s\S]*?)`;/);
  check('js/main.js gets the page counter', !!m && gen.includes('NAV_DROP_JS + PAGE_COUNT_JS'));
  check('... which leaves puppy pages to their own count', !!m && m[1].includes("querySelector('[data-puppy]')"));
  check('... and skips Puppy Connection\'s own browsers', !!m && m[1].includes('pc_staff=1'));
}

console.log('\n-- the admin');
{
  const src = fs.readFileSync(path.join(APP, 'admin/worker.js'), 'utf8');
  const block = src.slice(src.indexOf('const STAFF_ALLOWED = ['), src.indexOf('];', src.indexOf('const STAFF_ALLOWED = [')) + 2);
  // eslint-disable-next-line no-new-func
  const allowed = new Function(`${block.replace('const STAFF_ALLOWED =', 'return')}`)();
  const staff = (p) => allowed.some(([m, rx]) => m === 'GET' && rx.test(p));
  check('Reports and its traffic routes stay owner-only', !staff('/api/reports') && !staff('/api/reports/traffic') && !staff('/api/reports/traffic/top'));
  let up = false;
  try { up = (await fetch(`${ADMIN}/api/whoami`)).ok; } catch { /* not running */ }
  if (!up) console.log(`  skip the admin at ${ADMIN} does not answer`);
  else {
    const t = await (await fetch(`${ADMIN}/api/reports/traffic`)).json();
    check('the traffic route gives the daily totals by kind and both start days', t.puppies_from === '2026-11-01' && Array.isArray(t.days) && t.days.some((r) => r.kind === 'breed') && /^\d{4}-\d{2}-\d{2}$/.test(t.pages_from), JSON.stringify(t).slice(0, 200));
    const top = await (await fetch(`${ADMIN}/api/reports/traffic/top?from=${day}&to=${day}`)).json();
    check('the top pages mix puppies and other pages, most viewed first', top.pages.some((p) => p.kind === 'puppy') && top.pages.some((p) => p.page === 'breed-havanese' && p.label === 'Havanese')
      && top.pages.every((p, i, a) => !i || a[i - 1].views >= p.views), JSON.stringify(top.pages.slice(0, 4)));
    const br = await (await fetch(`${ADMIN}/api/reports/traffic/top?from=${day}&to=${day}&kind=breed`)).json();
    check('... and one kind alone', br.pages.length && br.pages.every((p) => p.kind === 'breed'), JSON.stringify(br.pages.slice(0, 3)));
    check('a bad date is refused', (await fetch(`${ADMIN}/api/reports/traffic/top?from=x&to=${day}`)).status === 400);
    check('an unknown kind is refused', (await fetch(`${ADMIN}/api/reports/traffic/top?from=${day}&to=${day}&kind=nope`)).status === 400);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
