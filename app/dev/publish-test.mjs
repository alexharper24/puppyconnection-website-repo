// Tests the publish (spec section 9, plans P4.3 and P4.4) against a stand-in GitHub, with no
// token and no real repository.
//
//   node app/dev/publish-test.mjs            with pc-portal on 8787 and pc-admin on 8788
//
// Part 1 runs the real lib/ code on Node (dev/node-env.mjs) over a fresh database holding the
// seed's 273 listings and one made-up kennel with uploaded photos, against the stand-in GitHub
// (dev/github-standin.mjs) on 8798: no token, one commit, generations, committed_at, failures,
// a race, the cron's waiting rule, and the generator over what was committed, checked with
// site-checks. It also measures the CPU a publish takes (plan P4.4).
// Part 2 goes through the Workers: the portal refuses /internal/publish from outside, a second
// admin on 8794 started with PUBLISH_MODE portal publishes through the PORTAL service binding,
// and the portal's */15 cron publishes only once changes have waited a minute. The portal's
// .dev.vars needs the GITHUB_* lines from .dev.vars.example.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { d1, r2, freshSchema, APP } from './node-env.mjs';
import { TOKEN, REPO } from './github-standin.mjs';
import { publishSite, publishIfDue, publishNow } from '../lib/publish.js';
import { exportSite } from '../lib/shape.js';
import { dirtyStmt } from '../lib/store.js';
import { build } from '../build/generate.mjs';

const GH = 'http://localhost:8798';
const PORTAL = 'http://localhost:8787', ADMIN2 = 'http://localhost:8794';
const WRANGLER = path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const CHECK_SITE = path.resolve(APP, '../../site-checks/check_site.py');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-publish-'));
let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }
const gs = async (p, body) => (await fetch(GH + p, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json();
const blobSha = (b) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

async function waitFor(url, ms = 90000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.status === 200) return true; } catch { /* not up yet */ }
    await sleep(1000);
  }
  return false;
}

// ---------------------------------------------------------------- part 1 fixtures

const JPEG = new Uint8Array(fs.readFileSync(path.join(APP, 'dev/fixtures/gps-test.jpg')));
const bytes = (tag) => new Uint8Array(Buffer.concat([Buffer.from(JPEG), Buffer.from(`-${tag}`)]));

async function seededEnv() {
  const db = d1();
  await freshSchema(db);
  if (!fs.existsSync(path.join(APP, '.state/seed.sql'))) execFileSync(process.execPath, [path.join(APP, 'dev/seed.mjs')]);
  await db.exec(fs.readFileSync(path.join(APP, '.state/seed.sql'), 'utf8'));
  const env = {
    DB: db, FILES: r2(), DEV_MODE: 'local', EMAIL_MODE: 'log',
    GITHUB_API: GH, GITHUB_REPO: REPO, GITHUB_TOKEN: TOKEN, PUBLISH_DIR: 'site',
  };
  // A made-up kennel with everything P2.3 allows, and two puppies with uploaded photos. One photo
  // has its card copy and one does not, as an older upload would not.
  const t = iso(Date.now()), B = 'test-kennel-id';
  await db.batch([
    db.prepare(`INSERT INTO breeders (id, email, status, created_at, updated_at) VALUES (?, 'publish-test@breeders.test', 'approved', ?, ?)`).bind(B, t, t),
    db.prepare(`INSERT INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, description, logo_key, kennel_key, facebook_url, updated_at)
      VALUES (?, 'Publish Test Kennel', 'publish-test-kennel', '574-555-0100', 'hello@publish-test.test', NULL, 'Goshen', 'IN', ?, ?, ?, 'https://www.facebook.com/publishtestkennel', ?)`)
      .bind(B, 'We raise a few litters a year.\n\nVisits by appointment.', `brand/${B}/logo-01testlogo.webp`, `brand/${B}/kennel-01testkennel.webp`, t),
    db.prepare("INSERT INTO breeder_breeds (breeder_id, breed_id) VALUES (?, 'breed-havanese'), (?, 'breed-shih-tzu')").bind(B, B),
    db.prepare(`INSERT INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, created_at, updated_at) VALUES ('test-litter', ?, 'breed-havanese', '2026-09-01', '2026-10-27', 11, ?, ?)`).bind(B, t, t),
    ...['Pepper', 'Salt'].map((n, i) => db.prepare(`INSERT INTO puppies (id, breeder_id, litter_id, slug, name, sex, price_cents, payment_state, publication_state, availability, published_at, created_at, updated_at)
      VALUES (?, ?, 'test-litter', ?, ?, 'female', 150000, 'paid', 'published', 'available', ?, ?, ?)`).bind(`test-pup-${i}`, B, `${n.toLowerCase()}-havanese-test`, n, t, t, t)),
    db.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, aspect, created_at) VALUES
      ('tph0', ?, 'test-pup-0', 'uploads/${B}/tph0.webp', 'image/webp', 0, 1.5, ?), ('tph1', ?, 'test-pup-1', 'uploads/${B}/tph1.webp', 'image/webp', 0, 0.8, ?)`).bind(B, t, B, t),
  ]);
  await env.FILES.put(`uploads/${B}/tph0.webp`, bytes('tph0'), { httpMetadata: { contentType: 'image/webp' } });
  await env.FILES.put(`uploads/${B}/tph0.webp.card`, bytes('tph0-card'), { httpMetadata: { contentType: 'image/webp' } });
  await env.FILES.put(`uploads/${B}/tph1.webp`, bytes('tph1'), { httpMetadata: { contentType: 'image/webp' } });
  await env.FILES.put(`brand/${B}/logo-01testlogo.webp`, bytes('logo'), { httpMetadata: { contentType: 'image/webp' } });
  await env.FILES.put(`brand/${B}/logo-01testlogo.webp.card`, bytes('logo-card'), { httpMetadata: { contentType: 'image/webp' } });
  await env.FILES.put(`brand/${B}/kennel-01testkennel.webp`, bytes('kennel'), { httpMetadata: { contentType: 'image/webp' } });
  return env;
}

const state = async (env) => env.DB.prepare('SELECT * FROM site_state WHERE id = 1').first();
const one = async (env, sql, ...b) => env.DB.prepare(sql).bind(...b).first();

// A hook that runs once, just before the publish asks GitHub for the branch, so a test can make a
// change land while the publish is running.
let beforeRef = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (beforeRef && /\/git\/ref\/heads\//.test(String(url))) { const h = beforeRef; beforeRef = null; await h(); }
  return realFetch(url, init);
};

function siteChecks(dir) {
  try {
    const out = execFileSync('python', [CHECK_SITE, dir], { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }).toString();
    return { ok: /\b0 error\(s\)/.test(out), out };
  } catch (e) { return { ok: false, out: String(e.stdout || e.message) }; }
}

async function part1() {
  console.log('\n-- part 1: the publish on Node against the stand-in GitHub');
  const env = await seededEnv();
  const s0 = await state(env);

  // No token, no repository: nothing happens and it says so.
  const req0 = (await gs('/_state')).requests;
  const off = await publishSite({ ...env, GITHUB_TOKEN: '' });
  check('without GITHUB_TOKEN the publish does nothing and says so', !off.ok && off.off && /GITHUB_TOKEN is not set/.test(off.error), JSON.stringify(off));
  const offRepo = await publishSite({ ...env, GITHUB_REPO: '' });
  check('without GITHUB_REPO the publish does nothing and says so', !offRepo.ok && offRepo.off && /GITHUB_REPO/.test(offRepo.error));
  const s1 = await state(env);
  check('... and the site state is untouched, with nothing sent to GitHub', JSON.stringify(s0) === JSON.stringify(s1) && (await gs('/_state')).requests === req0);
  const cronOff = await publishIfDue({ ...env, GITHUB_TOKEN: '' }, { minAgeMs: 0 });
  await env.DB.batch([dirtyStmt(env)]);
  const cronOff2 = await publishIfDue({ ...env, GITHUB_TOKEN: '' }, { minAgeMs: 0 });
  check('the cron says so too, and only when something is waiting', cronOff.waiting === 0 && !cronOff.off && cronOff2.off && /GITHUB_TOKEN/.test(cronOff2.reason), JSON.stringify([cronOff, cronOff2]));

  // Determinism: the same database gives the same bytes.
  const e1 = await exportSite(env), e2 = await exportSite(env);
  check('the export is byte for byte the same twice', JSON.stringify(e1.files) === JSON.stringify(e2.files));
  check('the export reads 275 public puppies (273 seed and 2 made up)', e1.counts.puppies === 275, JSON.stringify(e1.counts));

  // First publish.
  const gen = (await state(env)).generation;
  const commits0 = (await gs('/_state')).commits;
  const r1 = await publishSite(env, { type: 'operator', email: 'amber@puppyconnection.test' });
  const g1 = await gs('/_state');
  check('the first publish makes ONE commit', r1.ok && g1.commits === commits0 + 1 && g1.tip === r1.sha, JSON.stringify(r1).slice(0, 300));
  const want = ['site/data/breeders.json', 'site/data/breeds.json', 'site/data/litters.json', 'site/data/puppies.json',
    'site/img/p/tph0.webp', 'site/img/p/tph0.card.webp', 'site/img/p/tph1.webp', 'site/img/p/tph1.card.webp',
    'site/img/b/test-kennel-id/logo-01testlogo.webp', 'site/img/b/test-kennel-id/logo-01testlogo.card.webp',
    'site/img/b/test-kennel-id/kennel-01testkennel.webp', 'site/img/b/test-kennel-id/kennel-01testkennel.card.webp'].sort();
  check('it holds the four data files, both photos with card copies, and the logo and kennel photo', JSON.stringify(g1.changed) === JSON.stringify(want), JSON.stringify(g1.changed));
  check('only the Git Data API was used, through branch, commit, tree, blobs, tree, commit and ref',
    g1.log.slice(-15).every((l) => /\/git\//.test(l)) && g1.log.some((l) => l.startsWith('PATCH /repos/')));
  const files = await gs('/_files?prefix=site/');
  check('a photo is committed byte for byte from R2', Buffer.from(files['site/img/p/tph0.webp'], 'base64').equals(Buffer.from(bytes('tph0'))));
  check('a photo with no card copy gets the full photo as its card', Buffer.from(files['site/img/p/tph1.card.webp'], 'base64').equals(Buffer.from(bytes('tph1'))));
  check('the committed puppies.json is the export', Buffer.from(files['site/data/puppies.json'], 'base64').toString() === e1.files['data/puppies.json']);
  const st1 = await state(env);
  check('published_generation is the generation read at the start, and the SHA is recorded', st1.published_generation === gen && st1.last_publish_sha === r1.sha && !st1.dirty && !st1.last_error, JSON.stringify(st1));
  const committed = await one(env, "SELECT COUNT(*) AS n FROM photos WHERE id IN ('tph0','tph1') AND committed_at IS NOT NULL");
  check('committed_at is set on both uploaded photos', committed.n === 2);
  const audit1 = await one(env, "SELECT actor, after_json FROM audit_log WHERE action = 'site.publish' ORDER BY id DESC LIMIT 1");
  check('the publish is audited under the operator, with what it wrote', audit1.actor === 'amber@puppyconnection.test' && JSON.parse(audit1.after_json).photos === 8);

  // Nothing changed: no commit.
  const r2nd = await publishSite(env);
  const g2 = await gs('/_state');
  check('publishing again with nothing changed makes no commit', r2nd.ok && r2nd.nothing && g2.commits === g1.commits && r2nd.sha === g1.tip);

  // One change: only that file goes, and no photo is sent again.
  await env.DB.batch([env.DB.prepare("UPDATE puppies SET price_cents = 140000 WHERE id = 'test-pup-0'"), dirtyStmt(env)]);
  const r3 = await publishSite(env);
  const g3 = await gs('/_state');
  check('a price change commits only data/puppies.json', r3.ok && JSON.stringify(g3.changed) === JSON.stringify(['site/data/puppies.json']) && r3.photos === 0, JSON.stringify(g3.changed));

  // A change lands while the publish runs.
  await env.DB.batch([env.DB.prepare("UPDATE puppies SET price_cents = 130000 WHERE id = 'test-pup-0'"), dirtyStmt(env)]);
  const genBefore = (await state(env)).generation;
  beforeRef = async () => { await env.DB.batch([env.DB.prepare("UPDATE puppies SET color = 'cream' WHERE id = 'test-pup-1'"), dirtyStmt(env)]); };
  const r4 = await publishSite(env);
  const st4 = await state(env);
  check('a change made during a publish keeps the site dirty for the next run',
    r4.ok && r4.generation === genBefore && st4.published_generation === genBefore && st4.generation === genBefore + 1 && st4.dirty === 1 && st4.dirty_since, JSON.stringify(st4));

  // The cron's rule: wait a minute after the first change, then publish.
  await env.DB.prepare('UPDATE site_state SET dirty_since = ? WHERE id = 1').bind(iso(Date.now() - 20000)).run();
  const wait = await publishIfDue(env);
  check('the cron waits while the first change is under a minute old', wait.wait && wait.waiting === 1 && wait.age_seconds >= 19, JSON.stringify(wait));
  await env.DB.prepare('UPDATE site_state SET dirty_since = ? WHERE id = 1').bind(iso(Date.now() - 61000)).run();
  const due = await publishIfDue(env);
  const st5 = await state(env);
  check('... and publishes once it is a minute old', due.sha && st5.published_generation === st5.generation && !st5.dirty, JSON.stringify(due));
  check('the cron leaves the site alone when nothing is waiting', (await publishIfDue(env)).waiting === 0);

  // More new files than one run may send: photos go first, the data follows once they are all in.
  const capEnv = { ...env, PUBLISH_MAX_FILES: '4' };
  const capStmts = ['tph4', 'tph5', 'tph6'].map((id, i) => env.DB.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES (?, 'test-kennel-id', 'test-pup-1', ?, 'image/webp', ?, ?)`).bind(id, `uploads/test-kennel-id/${id}.webp`, i + 2, iso(Date.now())));
  await env.DB.batch([...capStmts, dirtyStmt(env)]);
  for (const id of ['tph4', 'tph5', 'tph6']) await env.FILES.put(`uploads/test-kennel-id/${id}.webp`, bytes(id), { httpMetadata: { contentType: 'image/webp' } });
  const pgCap = (await state(env)).published_generation;
  const c1 = await publishSite(capEnv);
  const gc1 = await gs('/_state');
  const stc1 = await state(env);
  check('with more new files than one run may send, photos go up first and the data waits',
    c1.ok && c1.partial && c1.photos === 4 && c1.waiting_files === 2 && gc1.changed.every((p) => p.startsWith('site/img/p/')) && stc1.published_generation === pgCap && stc1.dirty === 1, JSON.stringify([c1, gc1.changed]));
  const c2 = await publishSite(capEnv);
  const gc2 = await gs('/_state');
  const stc2 = await state(env);
  check('... and the next run sends the rest with the data, catching the site up',
    c2.ok && !c2.partial && c2.photos === 2 && gc2.changed.includes('site/data/puppies.json') && stc2.published_generation === stc2.generation && !stc2.dirty, JSON.stringify([c2, gc2.changed]));

  // Failure: recorded, alerted once per distinct error, nothing marked committed.
  await env.DB.batch([env.DB.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES ('tph2', 'test-kennel-id', 'test-pup-0', 'uploads/test-kennel-id/tph2.webp', 'image/webp', 1, ?)`).bind(iso(Date.now())), dirtyStmt(env)]);
  await env.FILES.put('uploads/test-kennel-id/tph2.webp', bytes('tph2'), { httpMetadata: { contentType: 'image/webp' } });
  const mail0 = (await one(env, "SELECT COUNT(*) AS n FROM email_log WHERE template = 'ops_alert'")).n;
  const pg = (await state(env)).published_generation;
  await gs('/_fail', { method: 'POST', path: '/git/trees$', status: 500, times: 2 });
  const f1 = await publishSite(env);
  const f2 = await publishSite(env);
  const st6 = await state(env);
  const mail1 = (await one(env, "SELECT COUNT(*) AS n FROM email_log WHERE template = 'ops_alert'")).n;
  check('a failed publish records last_error and leaves published_generation alone', !f1.ok && f1.recorded && /500/.test(st6.last_error) && st6.published_generation === pg, JSON.stringify(f1));
  check('the operators are alerted once for the same error twice', mail1 === mail0 + 1 && !f2.ok, `${mail0} -> ${mail1}`);
  check('a photo from a failed publish is not marked committed', !(await one(env, "SELECT committed_at FROM photos WHERE id = 'tph2'")).committed_at);
  check('the failure is in the audit log', !!(await one(env, "SELECT 1 AS x FROM audit_log WHERE action = 'site.publish_failed'")));

  // A race: someone moved the branch, so the move is refused rather than forced.
  await gs('/_race', {});
  const f3 = await publishSite(env);
  check('a branch moved by someone else is never overwritten', !f3.ok && /not a fast forward/.test((await state(env)).last_error), JSON.stringify(f3));

  // Recovery.
  const ok = await publishSite(env);
  const st7 = await state(env);
  const g7 = await gs('/_state');
  check('the next good publish clears the error and commits the new photo', ok.ok && !st7.last_error && g7.changed.includes('site/img/p/tph2.webp') && !!(await one(env, "SELECT committed_at FROM photos WHERE id = 'tph2'")).committed_at, JSON.stringify(g7.changed));

  // A photo whose file is gone from R2 is left out and reported, and nothing points at a missing file.
  await env.DB.batch([env.DB.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES ('tph3', 'test-kennel-id', 'test-pup-1', 'uploads/test-kennel-id/tph3.webp', 'image/webp', 1, ?)`).bind(iso(Date.now())), dirtyStmt(env)]);
  const miss = await publishSite(env);
  check('a photo missing from R2 is reported, not committed', miss.ok && miss.missing.includes('img/p/tph3.webp'), JSON.stringify(miss.missing));
  await env.DB.prepare("DELETE FROM photos WHERE id = 'tph3'").run();
  await env.DB.batch([dirtyStmt(env)]);
  await publishSite(env);

  // publishNow with the portal publisher reports what the portal said and records nothing itself.
  const viaPortal = await publishNow({ ...env, PUBLISH_MODE: 'portal', PORTAL: { fetch: async () => new Response(JSON.stringify({ ok: false, off: true, error: 'GITHUB_TOKEN is not set, so the site is not published to GitHub.' }), { status: 503 }) } }, { type: 'operator', email: 'amber@puppyconnection.test' });
  check('Publish now through a portal without its token says so and records no error', !viaPortal.ok && viaPortal.off && !(await state(env)).last_error, JSON.stringify(viaPortal));

  // ------------------------------------------------------------ the generator over the commit
  const dataDir = path.join(TMP, 'repo'), out = path.join(TMP, 'out');
  for (const [p, b64] of Object.entries(await gs('/_files?prefix=site/'))) {
    const f = path.join(dataDir, p.slice('site/'.length));
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(b64, 'base64'));
  }
  const g = build({ dataDir, out });
  const pupCount = JSON.parse(fs.readFileSync(path.join(dataDir, 'data/puppies.json'), 'utf8')).length;
  check('the generator builds one page per puppy, breed and breeder', g.puppies === pupCount && g.pages === pupCount + g.breeds + g.breeders + 5, JSON.stringify(g));
  const chk = siteChecks(out);
  check('the generated site passes check_site.py (breeder dash check off)', chk.ok, chk.out.split('\n').filter((l) => /ERROR|error\(s\)/.test(l)).slice(0, 6).join('\n'));
  const pup = fs.readFileSync(path.join(out, 'puppy-pepper-havanese-test.html'), 'utf8');
  check('a puppy page has a stable address, title, description, canonical and Open Graph tags',
    pup.includes('<title>Pepper, Havanese puppy | Puppy Connection</title>') && pup.includes('<meta name="description" content="Pepper is a female Havanese puppy from Publish Test Kennel in Goshen, IN.')
    && pup.includes('<link rel="canonical" href="https://site.puppyconnection.workers.dev/puppy-pepper-havanese-test.html">') && pup.includes('og:title') && pup.includes('og:image'));
  check('staging pages keep noindex and robots.txt turns crawlers away', pup.includes('<meta name="robots" content="noindex, nofollow">') && /Disallow: \//.test(fs.readFileSync(path.join(out, 'robots.txt'), 'utf8')));
  check('the puppy page shows the committed photo, its card thumbnails and the breeder contact', pup.includes('src="img/p/tph0.webp"') && pup.includes('tel:5745550100') && pup.includes('breeder-publish-test-kennel.html'));
  const kennel = fs.readFileSync(path.join(out, 'breeder-publish-test-kennel.html'), 'utf8');
  check('the breeder page shows the logo, kennel photo, breeds raised and Facebook page (plan P2.3)',
    kennel.includes('img/b/test-kennel-id/logo-01testlogo.card.webp') && kennel.includes('img/b/test-kennel-id/kennel-01testkennel.webp')
    && kennel.includes('href="breed-havanese.html">Havanese') && kennel.includes('facebook.com/publishtestkennel') && kennel.includes('Visits by appointment.'));
  const guide = fs.readFileSync(path.join(out, 'breed-cocker-spaniel.html'), 'utf8');
  const guideText = JSON.parse(fs.readFileSync(path.join(dataDir, 'data/breeds.json'), 'utf8')).find((b) => b.slug === 'cocker-spaniel').guide[0];
  check('a breed page shows the guide text from breeds.guide', guideText && guide.includes(guideText.slice(0, 60).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;')));
  const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  check('sitemap.xml lists every generated page', (sitemap.match(/<loc>/g) || []).length === g.pages && sitemap.includes('/puppy-pepper-havanese-test.html'));
  const redirects = fs.readFileSync(path.join(out, '_redirects'), 'utf8');
  check('each imported Wix product page gets a 301 to its puppy', g.redirects === 273 && /^\/product-page\/alexa-cocker-spaniel \/puppy-alexa-cocker-spaniel\.html 301$/m.test(redirects));
  check('every image a page names exists in the output', [pup, kennel].every((h) => [...h.matchAll(/src="(img\/[^"]+)"/g)].every((m) => fs.existsSync(path.join(out, m[1])))));
  check('the old puppy.html?slug= address sends visitors to the new page', /location\.replace\('puppy-'\+s\+'\.html'\)/.test(fs.readFileSync(path.join(out, 'puppy.html'), 'utf8')));
  // The site's own wording, with every check on: the breeders' dashes taken out of the data.
  const strictData = path.join(TMP, 'strict');
  fs.cpSync(dataDir, strictData, { recursive: true });
  for (const f of fs.readdirSync(path.join(strictData, 'data'))) {
    const p = path.join(strictData, 'data', f);
    fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/\s*[—–]\s*/g, ', '));
  }
  build({ dataDir: strictData, out: path.join(TMP, 'out-strict'), strictCopy: true });
  const strict = siteChecks(path.join(TMP, 'out-strict'));
  check('with breeder text set aside, the site passes every check including dashes', strict.ok, strict.out.split('\n').filter((l) => /ERROR/.test(l)).slice(0, 5).join('\n'));
  build({ dataDir, out: path.join(TMP, 'out-live'), indexable: true, base: 'https://puppy-connection.com/' });
  const live = fs.readFileSync(path.join(TMP, 'out-live/puppy-pepper-havanese-test.html'), 'utf8');
  check('--indexable drops noindex, and robots.txt names the sitemap on the launch address',
    !live.includes('noindex') && live.includes('https://puppy-connection.com/puppy-pepper-havanese-test.html') && /Sitemap: https:\/\/puppy-connection\.com\/sitemap\.xml/.test(fs.readFileSync(path.join(TMP, 'out-live/robots.txt'), 'utf8')));

  // ------------------------------------------------------------ CPU (plan P4.4)
  await cpu();
}

/**
 * CPU of a publish on Node, with the time inside SQLite left out (D1 does that work elsewhere).
 * Windows counts CPU in steps of about 15 ms, so each figure is the mean of many runs, which
 * evens the steps out. The stand-in GitHub runs in its own process, so its work is not counted.
 */
export async function cpu({ firstRuns = 10, runs = 30 } = {}) {
  const out = { first: 0, change: 0, nothing: 0, export: 0 };
  const measure = async (env, fn) => {
    const db0 = env.DB.timing.cpuUs, c0 = process.cpuUsage();
    const r = await fn();
    const c = process.cpuUsage(c0);
    if (r && r.ok === false) throw new Error(r.error);
    return ((c.user + c.system) - (env.DB.timing.cpuUs - db0)) / 1000;
  };
  let env;
  for (let i = 0; i < firstRuns; i += 1) {
    await gs('/_reset', {});
    if (env) env.DB.close();
    env = await seededEnv();
    out.first += await measure(env, () => publishSite(env)) / firstRuns;
  }
  for (let i = 0; i < runs; i += 1) {
    await env.DB.batch([env.DB.prepare('UPDATE puppies SET price_cents = ? WHERE id = ?').bind(140000 + i * 100, 'test-pup-0'), dirtyStmt(env)]);
    out.change += await measure(env, () => publishSite(env)) / runs;
    out.nothing += await measure(env, () => publishSite(env)) / runs;
    out.export += await measure(env, () => exportSite(env)) / runs;
  }
  // The same publishes with Node's fetch replaced by canned answers. Node's fetch is written in
  // JavaScript and a Worker's is not, so this is the publish's own work: the export, the hashing,
  // the request bodies and reading the answers.
  const canned = {};
  for (const p of [`/git/ref/heads/main`]) canned.ref = await (await realFetch(`${GH}/repos/${REPO}${p}`, { headers: { authorization: `Bearer ${TOKEN}`, 'user-agent': 't' } })).text();
  const tip = JSON.parse(canned.ref).object.sha;
  canned.commit = await (await realFetch(`${GH}/repos/${REPO}/git/commits/${tip}`, { headers: { authorization: `Bearer ${TOKEN}`, 'user-agent': 't' } })).text();
  canned.tree = await (await realFetch(`${GH}/repos/${REPO}/git/trees/${JSON.parse(canned.commit).tree.sha}?recursive=1`, { headers: { authorization: `Bearer ${TOKEN}`, 'user-agent': 't' } })).text();
  const answer = (text) => ({ ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text });
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (/\/git\/ref\/heads\//.test(u) && !init.method) return answer(canned.ref);
    if (/\/git\/commits\/\w+$/.test(u)) return answer(canned.commit);
    if (/\/git\/trees\/\w+/.test(u) && !init.method) return answer(canned.tree);
    return answer(`{"sha":"${'0'.repeat(40)}","object":{"sha":"x"}}`);
  };
  out.ownChange = 0; out.ownNothing = 0;
  try {
    for (let i = 0; i < runs; i += 1) {
      await env.DB.batch([env.DB.prepare('UPDATE puppies SET price_cents = ? WHERE id = ?').bind(150000 + i * 100, 'test-pup-0'), dirtyStmt(env)]);
      out.ownChange += await measure(env, () => publishSite(env)) / runs;
    }
  } finally { globalThis.fetch = realFetch; }
  env.DB.close();
  const f = (x) => x.toFixed(1);
  console.log(`CPU  the publish's own work with GitHub's answers canned (one change, puppies.json resent each time): ${f(out.ownChange)} ms (mean of ${runs})`);
  console.log(`CPU  publish of 275 listings on Node, SQLite time left out: first publish ${f(out.first)} ms (mean of ${firstRuns}), `
    + `one change ${f(out.change)} ms, nothing changed ${f(out.nothing)} ms, the export alone ${f(out.export)} ms (means of ${runs})`);
  return out;
}

// ---------------------------------------------------------------- part 2, the Workers

function sqlLocal(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

function rawPost(port, pathName, hostHeader) {
  return new Promise((resolve) => {
    const req = http.request({ host: 'localhost', port, path: pathName, method: 'POST', headers: { host: hostHeader, 'content-type': 'application/json' } }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', () => resolve(0));
    req.end('{}');
  });
}

async function part2() {
  console.log('\n-- part 2: through the Workers, the PORTAL binding and the cron');
  if (!(await waitFor(`${PORTAL}/api/config`, 5000))) { check('pc-portal is running on 8787', false); return; }
  await gs('/_reset', {});
  check('the portal answers 404 to /internal/publish from outside', (await fetch(`${PORTAL}/internal/publish`, { method: 'POST', body: '{}' })).status === 404);
  check('... even with a Host header naming the binding address', await rawPost(8787, '/internal/publish', 'portal.internal') === 404);

  // A second admin, the same code and database, with PUBLISH_MODE portal.
  const admin = spawn(process.execPath, [WRANGLER, 'dev', '--config', path.join(APP, 'admin/wrangler.jsonc'), '--persist-to', path.join(APP, '.state'),
    '--port', '8794', '--inspector-port', '9334', '--var', 'PUBLISH_MODE:portal'], { cwd: path.resolve(APP, '../..'), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; admin.stdout.on('data', (d) => { log += d; }); admin.stderr.on('data', (d) => { log += d; });
  try {
    const up = await waitFor(`${ADMIN2}/api/jobs`, 120000);
    check('a second admin starts on 8794 with PUBLISH_MODE portal', up, log.slice(-600));
    if (!up) return;
    // An uploaded photo on a public puppy, put into the local R2 the way the portal stores one, so
    // the commit has a file from R2 to carry even on a freshly reset database.
    const pid = `pt-${Date.now().toString(36)}`;
    const pup = sqlLocal("SELECT id, breeder_id FROM public_puppies ORDER BY slug LIMIT 1")[0];
    execFileSync(process.execPath, [WRANGLER, 'r2', 'object', 'put', `puppyconnection-files/uploads/${pup.breeder_id}/${pid}.jpg`, '--file', path.join(APP, 'dev/fixtures/gps-test.jpg'),
      '--content-type', 'image/jpeg', '--local', '--persist-to', path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc')], { cwd: APP, stdio: 'ignore' });
    sqlLocal(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES ('${pid}', '${pup.breeder_id}', '${pup.id}', 'uploads/${pup.breeder_id}/${pid}.jpg', 'image/jpeg', 99, '${iso(Date.now())}')`);
    sqlLocal("UPDATE site_state SET generation = generation + 1, dirty = 1, dirty_since = COALESCE(dirty_since, '2026-01-01T00:00:00Z') WHERE id = 1");
    const before = sqlLocal('SELECT generation, published_generation FROM site_state WHERE id = 1')[0];
    const res = await fetch(`${ADMIN2}/api/site/publish`, { method: 'POST', headers: { origin: ADMIN2, 'content-type': 'application/json' }, body: '{}' });
    const body = await res.json();
    const g = await gs('/_state');
    check('Publish now goes through the PORTAL binding and commits to the stand-in', res.status === 200 && body.ok && body.sha === g.tip && g.changed.includes('site/data/puppies.json'), `${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    check('the operators screen shows the portal publisher', body.site && body.site.mode === 'portal' && body.site.last_publish_sha === g.tip);
    const after = sqlLocal('SELECT generation, published_generation, last_error FROM site_state WHERE id = 1')[0];
    check('the portal recorded the generation it read', after.published_generation >= before.generation && !after.last_error, JSON.stringify([before, after]));
    // Every uploaded photo of a public puppy went up, byte for byte the same as R2.
    const ups = sqlLocal("SELECT id, r2_key, content_type, committed_at FROM photos WHERE r2_key IS NOT NULL AND puppy_id IN (SELECT id FROM public_puppies)");
    const files = await gs('/_files?prefix=site/img/p/');
    let same = 0;
    for (const u of ups) {
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[u.content_type];
      const got = files[`site/img/p/${u.id}.${ext}`];
      const r2 = Buffer.from(await (await fetch(`${ADMIN2}/media/${u.id}`)).arrayBuffer());
      if (got && Buffer.from(got, 'base64').equals(r2) && u.committed_at) same += 1;
    }
    check(`every uploaded photo of a public puppy is committed from R2 and marked committed (${same} of ${ups.length})`, ups.length > 0 && same === ups.length, `${same} of ${ups.length}`);
    const audit = sqlLocal("SELECT actor_type, actor FROM audit_log WHERE action = 'site.publish' ORDER BY id DESC LIMIT 1")[0];
    check('the publish is audited under the operator who pressed it', audit.actor_type === 'operator' && audit.actor === 'amber@puppyconnection.test', JSON.stringify(audit));

    // The cron: a fresh change waits, a minute-old one publishes.
    sqlLocal(`UPDATE site_state SET generation = generation + 1, dirty = 1, dirty_since = '${iso(Date.now())}' WHERE id = 1`);
    await fetch(`${PORTAL}/__scheduled?cron=${encodeURIComponent('*/15 * * * *')}`);
    await sleep(1500);
    const j1 = JSON.parse(sqlLocal("SELECT last_result FROM job_runs WHERE job = 'publish'")[0]?.last_result || '{}');
    check('the */15 cron waits while the change is under a minute old', j1.wait === true && j1.waiting >= 1, JSON.stringify(j1));
    sqlLocal(`UPDATE site_state SET dirty_since = '${iso(Date.now() - 120000)}' WHERE id = 1`);
    await fetch(`${PORTAL}/__scheduled?cron=${encodeURIComponent('*/15 * * * *')}`);
    await sleep(3000);
    const j2 = JSON.parse(sqlLocal("SELECT last_result FROM job_runs WHERE job = 'publish'")[0]?.last_result || '{}');
    const st = sqlLocal('SELECT generation, published_generation, dirty FROM site_state WHERE id = 1')[0];
    check('... and publishes once it is a minute old, catching the site up', !!j2.sha && st.published_generation === st.generation && st.dirty === 0, JSON.stringify([j2, st]));
    const cronAudit = sqlLocal("SELECT actor FROM audit_log WHERE action = 'site.publish' ORDER BY id DESC LIMIT 1")[0];
    check('the cron publish is audited as the system', cronAudit.actor === 'publish-cron');
  } finally {
    admin.kill();
  }
}

const standin = spawn(process.execPath, [path.join(APP, 'dev/github-standin.mjs'), '--port', '8798'], { stdio: ['ignore', 'pipe', 'inherit'] });
try {
  await new Promise((r) => standin.stdout.once('data', r));
  await part1();
  if (!process.argv.includes('--node-only')) await part2();
} catch (e) {
  check('the test ran to the end', false, e.stack);
} finally {
  standin.kill();
  fs.rmSync(TMP, { recursive: true, force: true });
}
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
