// Tests the publish (spec section 9, plans P4.3 and P4.4) against a stand-in GitHub, with no
// token and no real repository.
//
//   node app/dev/publish-test.mjs            with pc-portal on 8787 and pc-admin on 8788
//
// The stand-in repository plays alexharper24/puppyconnection-site (decision D10), where the data
// sits at the root and no photo is ever committed (decision D11).
// Part 1 runs the real lib/ code on Node (dev/node-env.mjs) over a fresh database holding the
// seed's 273 listings and one made-up kennel with uploaded photos, against the stand-in GitHub
// (dev/github-standin.mjs) on 8798: no token, one commit of data/*.json and nothing else,
// generations, failures, a race, the cron's waiting rule, PUBLISH_DIR, and the generator over what
// was committed, checked with site-checks. It also measures the CPU a publish takes (plan P4.4).
// Part 2 goes through the Workers: the portal refuses /internal/publish from outside, a second
// admin on 8794 started with PUBLISH_MODE portal publishes through the PORTAL service binding,
// and the portal's */15 cron publishes only once changes have waited a minute. The portal's
// .dev.vars needs the GITHUB_* lines from .dev.vars.example.
// Part 3 builds the pages from the local database the way the site repository's build does, and
// runs the generated-pages site Worker (app/site/static-worker.js) on 8795 over them: the home
// page, an uploaded and an imported photo from R2 at /media, a photo that is not public, the Wix
// 301s, the 404 page, the cache headers and the view count. Its data comes from the portal's
// /data/export.json through build/fetch-data.mjs, the way the site build gets it in hook mode.
// Part 4 is hook mode, the staging default since Alex's change of 2026-10-06: on Node against a
// stand-in deploy hook on 8796 (off without PUBLISH_HOOK_URL, one build per dirty period, the
// cron leaving a running build alone, failures, the secret kept out of messages), then a second
// portal on 8793 started with PUBLISH_MODE hook, whose cron calls the stand-in hook. Parts 1 and 2
// cover commit mode, kept for later. The local portal on 8787 runs commit mode (.dev.vars).

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
import { exportData } from './export-data.mjs';
import { fetchData } from '../build/fetch-data.mjs';

const GH = 'http://localhost:8798';
const PORTAL = 'http://localhost:8787', ADMIN2 = 'http://localhost:8794', STATIC = 'http://localhost:8795';
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
    PUBLISH_MODE: 'commit', GITHUB_API: GH, GITHUB_REPO: REPO, GITHUB_TOKEN: TOKEN,
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
  const want = ['data/breeders.json', 'data/breeds.json', 'data/litters.json', 'data/puppies.json'];
  check('it holds the four data files at the root of the site repository and nothing else, no photo (D11)', JSON.stringify(g1.changed) === JSON.stringify(want), JSON.stringify(g1.changed));
  check('only the Git Data API was used, through branch, commit, tree, blobs, tree, commit and ref',
    g1.log.slice(-10).every((l) => /\/git\//.test(l)) && g1.log.some((l) => l.startsWith('PATCH /repos/')));
  const files = await gs('/_files?prefix=');
  check('the README the repository started with is still there, and no image went up',
    Buffer.from(files['README.md'] || '', 'base64').toString() === 'Puppy Connection site\n' && !Object.keys(files).some((f) => /\.(webp|jpe?g|png)$/.test(f)), Object.keys(files).join(', '));
  check('the committed puppies.json is the export', Buffer.from(files['data/puppies.json'], 'base64').toString() === e1.files['data/puppies.json']);
  const pups = JSON.parse(e1.files['data/puppies.json']);
  const pepper = pups.find((x) => x.slug === 'pepper-havanese-test');
  check('an uploaded photo is named media/<id> with its card at media/<id>/card, served from R2 by the site Worker',
    pepper && pepper.photos[0].src === 'media/tph0' && pepper.photos[0].card === 'media/tph0/card', JSON.stringify(pepper && pepper.photos));
  const wixPhoto = pups.flatMap((x) => x.photos).find((ph) => /wixstatic\.com/.test(ph.src));
  check('a Wix photo not imported yet keeps its Wix address', !!wixPhoto && wixPhoto.card === null);
  const kennelRow = JSON.parse(e1.files['data/breeders.json']).find((b) => b.slug === 'publish-test-kennel');
  check('the logo and kennel photo are named brand/<breeder id>/<kind> with a v= that follows the file',
    kennelRow.logo.src === 'brand/test-kennel-id/logo?v=01testlogo' && kennelRow.logo.card === 'brand/test-kennel-id/logo?size=card&v=01testlogo'
    && kennelRow.kennel_photo.src === 'brand/test-kennel-id/kennel?v=testkennel', JSON.stringify([kennelRow.logo, kennelRow.kennel_photo]));
  const st1 = await state(env);
  check('published_generation is the generation read at the start, and the SHA is recorded', st1.published_generation === gen && st1.last_publish_sha === r1.sha && !st1.dirty && !st1.last_error, JSON.stringify(st1));
  const audit1 = await one(env, "SELECT actor, after_json FROM audit_log WHERE action = 'site.publish' ORDER BY id DESC LIMIT 1");
  check('the publish is audited under the operator, with what it wrote', audit1.actor === 'amber@puppyconnection.test' && JSON.parse(audit1.after_json).files === 4);

  // Nothing changed: no commit.
  const r2nd = await publishSite(env);
  const g2 = await gs('/_state');
  check('publishing again with nothing changed makes no commit', r2nd.ok && r2nd.nothing && g2.commits === g1.commits && r2nd.sha === g1.tip);

  // One change: only that file goes.
  await env.DB.batch([env.DB.prepare("UPDATE puppies SET price_cents = 140000 WHERE id = 'test-pup-0'"), dirtyStmt(env)]);
  const r3 = await publishSite(env);
  const g3 = await gs('/_state');
  check('a price change commits only data/puppies.json', r3.ok && JSON.stringify(g3.changed) === JSON.stringify(['data/puppies.json']) && r3.files === 1, JSON.stringify(g3.changed));
  // A new photo is a change to puppies.json alone, however many photos come with it.
  const photoStmts = ['tph4', 'tph5', 'tph6'].map((id, i) => env.DB.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES (?, 'test-kennel-id', 'test-pup-1', ?, 'image/webp', ?, ?)`).bind(id, `uploads/test-kennel-id/${id}.webp`, i + 2, iso(Date.now())));
  await env.DB.batch([...photoStmts, dirtyStmt(env)]);
  const r3b = await publishSite(env);
  const g3b = await gs('/_state');
  check('three new photos commit only data/puppies.json, naming them at media/', r3b.ok && JSON.stringify(g3b.changed) === JSON.stringify(['data/puppies.json'])
, JSON.stringify(g3b.changed));
  const afterPhotos = Buffer.from((await gs('/_files?prefix=data/'))['data/puppies.json'], 'base64').toString();
  check('... and the committed data names each of them', ['tph4', 'tph5', 'tph6'].every((id) => afterPhotos.includes(`"src": "media/${id}"`)));

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

  // Failure: recorded, alerted once per distinct error, the generation left alone.
  await env.DB.batch([env.DB.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES ('tph2', 'test-kennel-id', 'test-pup-0', 'uploads/test-kennel-id/tph2.webp', 'image/webp', 1, ?)`).bind(iso(Date.now())), dirtyStmt(env)]);
  const mail0 = (await one(env, "SELECT COUNT(*) AS n FROM email_log WHERE template = 'ops_alert'")).n;
  const pg = (await state(env)).published_generation;
  await gs('/_fail', { method: 'POST', path: '/git/trees$', status: 500, times: 2 });
  const f1 = await publishSite(env);
  const f2 = await publishSite(env);
  const st6 = await state(env);
  const mail1 = (await one(env, "SELECT COUNT(*) AS n FROM email_log WHERE template = 'ops_alert'")).n;
  check('a failed publish records last_error and leaves published_generation alone', !f1.ok && f1.recorded && /500/.test(st6.last_error) && st6.published_generation === pg, JSON.stringify(f1));
  check('the operators are alerted once for the same error twice', mail1 === mail0 + 1 && !f2.ok, `${mail0} -> ${mail1}`);
  check('the failure is in the audit log', !!(await one(env, "SELECT 1 AS x FROM audit_log WHERE action = 'site.publish_failed'")));

  // A race: someone moved the branch, so the move is refused rather than forced.
  await gs('/_race', {});
  const f3 = await publishSite(env);
  check('a branch moved by someone else is never overwritten', !f3.ok && /not a fast forward/.test((await state(env)).last_error), JSON.stringify(f3));

  // Recovery.
  const ok = await publishSite(env);
  const st7 = await state(env);
  const g7 = await gs('/_state');
  check('the next good publish clears the error and commits the data naming the new photo', ok.ok && !st7.last_error && JSON.stringify(g7.changed) === JSON.stringify(['data/puppies.json'])
    && Buffer.from((await gs('/_files?prefix=data/'))['data/puppies.json'], 'base64').toString().includes('"src": "media/tph2"'), JSON.stringify(g7.changed));

  // PUBLISH_DIR and GITHUB_BRANCH are settings, so the target can move without a code change.
  await env.DB.batch([env.DB.prepare("UPDATE puppies SET color = 'apricot' WHERE id = 'test-pup-0'"), dirtyStmt(env)]);
  const sub = await publishSite({ ...env, PUBLISH_DIR: '/nested/' });
  const gsub = await gs('/_state');
  check('PUBLISH_DIR puts the data under that folder instead', sub.ok && gsub.changed.length === 4 && gsub.changed.every((f) => /^nested\/data\/\w+\.json$/.test(f)), JSON.stringify(gsub.changed));
  await env.DB.batch([dirtyStmt(env)]);
  const other = await publishSite({ ...env, GITHUB_BRANCH: 'no-such-branch' });
  check('GITHUB_BRANCH names the branch, and a branch that does not exist fails without a commit', !other.ok && /no-such-branch/.test(other.error) && (await gs('/_state')).commits === gsub.commits, JSON.stringify(other));
  await publishSite(env);

  // publishNow with the portal publisher reports what the portal said and records nothing itself.
  const viaPortal = await publishNow({ ...env, PUBLISH_MODE: 'portal', PORTAL: { fetch: async () => new Response(JSON.stringify({ ok: false, off: true, error: 'GITHUB_TOKEN is not set, so the site is not published to GitHub.' }), { status: 503 }) } }, { type: 'operator', email: 'amber@puppyconnection.test' });
  check('Publish now through a portal without its token says so and records no error', !viaPortal.ok && viaPortal.off && !(await state(env)).last_error, JSON.stringify(viaPortal));

  // ------------------------------------------------------------ the generator over the commit
  const dataDir = path.join(TMP, 'repo'), out = path.join(TMP, 'out');
  for (const [p, b64] of Object.entries(await gs('/_files?prefix=data/'))) {
    const f = path.join(dataDir, p);
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
    pup.includes('<title>Pepper, Havanese Puppy for Sale | Puppy Connection</title>') && pup.includes('<meta name="description" content="Pepper is a female Havanese puppy from Publish Test Kennel in Goshen, IN.')
    && pup.includes('<link rel="canonical" href="https://site.puppyconnection.workers.dev/puppy-pepper-havanese-test.html">') && pup.includes('og:title') && pup.includes('og:image'));
  // SEO plan batch 1 (2026-10-07): P5, P7, P11, P13, P14, P15.
  const hav = fs.readFileSync(path.join(out, 'breed-havanese.html'), 'utf8');
  check('a breed page is titled for "<breed> puppies for sale", naming a state only when every listed breeder shares it',
    /<title>Havanese Puppies for Sale( in [A-Z][a-z]+)? \| Puppy Connection<\/title>/.test(hav) && hav.includes('<h1>Havanese puppies for sale</h1>'), (hav.match(/<title>[^<]*/) || [''])[0]);
  check('a breed page description comes from the listings, not a cut-off guide sentence', /<meta name="description" content="\d+ Havanese puppies? for sale from (a small family breeder|small family breeders)/.test(hav), (hav.match(/<meta name="description" content="[^"]*/) || [''])[0]);
  const itemList = [...hav.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => JSON.parse(m[1])).find((o) => o['@type'] === 'ItemList');
  check('a breed page carries an ItemList of the puppies it shows', !!itemList && itemList.itemListElement.length === itemList.numberOfItems && itemList.itemListElement.every((x) => x.url.startsWith('https://site.puppyconnection.workers.dev/puppy-')), JSON.stringify(itemList || {}).slice(0, 200));
  // The breeder sentence is off until the Wix pairing is confirmed (SHOW_BREED_BREEDERS).
  check('a breed page does not name its breeders until the pairing is confirmed', !/come from <a href="breeder-/.test(hav));
  check('the puppy page names its breeder in an h2, not an h3 under the h1', pup.includes('<h2 class="breeder-name">') && !/<h3>/.test(pup.split('<main')[1] || ''));
  const hub = fs.readFileSync(path.join(out, 'breeders.html'), 'utf8');
  check('the breeders hub is titled for the breeder search', hub.includes('<title>Dog Breeders in Indiana and the Midwest | Puppy Connection</title>') && hub.includes('<h1>Dog breeders in Indiana and the Midwest</h1>'));
  const sm = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  check('the sitemap carries image entries for the pages that show photos', sm.includes('xmlns:image=') && /<image:loc>[^<]+media\/tph0<\/image:loc>/.test(sm), (sm.match(/<image:loc>[^<]*/g) || []).length + ' image entries');
  check('staging pages keep noindex and robots.txt turns crawlers away', pup.includes('<meta name="robots" content="noindex, nofollow">') && /Disallow: \//.test(fs.readFileSync(path.join(out, 'robots.txt'), 'utf8')));
  check('the puppy page shows the photo from media/, and the breeder contact', pup.includes('src="media/tph0"') && pup.includes('tel:5745550100') && pup.includes('breeder-publish-test-kennel.html'));
  const salt = fs.readFileSync(path.join(out, 'puppy-salt-havanese-test.html'), 'utf8');
  check('a gallery takes card copies for its thumbnails and full photos for the main view', salt.includes('src="media/tph4/card"') && salt.includes('data-full="media/tph4"'), (salt.match(/media\/[^"]+/g) || []).slice(0, 6).join(' '));
  const kennel = fs.readFileSync(path.join(out, 'breeder-publish-test-kennel.html'), 'utf8');
  check('the breeder page shows the logo, kennel photo, breeds raised and Facebook page (plan P2.3)',
    kennel.includes('src="brand/test-kennel-id/logo?size=card&amp;v=01testlogo"') && kennel.includes('src="brand/test-kennel-id/kennel?v=testkennel"')
    && kennel.includes('href="breed-havanese.html">Havanese') && kennel.includes('facebook.com/publishtestkennel') && kennel.includes('Visits by appointment.'));
  const guide = fs.readFileSync(path.join(out, 'breed-cocker-spaniel.html'), 'utf8');
  const guideText = JSON.parse(fs.readFileSync(path.join(dataDir, 'data/breeds.json'), 'utf8')).find((b) => b.slug === 'cocker-spaniel').guide[0];
  check('a breed page shows the guide text from breeds.guide', guideText && guide.includes(guideText.slice(0, 60).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;')));
  const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
  check('sitemap.xml lists every generated page', (sitemap.match(/<loc>/g) || []).length === g.pages && sitemap.includes('/puppy-pepper-havanese-test.html'));
  const dataJs = fs.readFileSync(path.join(out, 'data/data.js'), 'utf8');
  check('each listing carries a 4:5 phone photo cropped around its focus point, Cap\'n Crunch at its hand-set 0.6 (migration 0007)',
    /"lead_tall":"https:\/\/static\.wixstatic\.com\/media\/8d80ac_f00c67917ee9451d8a12729457e762ee~mv2\.jpg\/v1\/crop\/x_360,y_0,w_576,h_720\/fill\/w_480,h_600,/.test(dataJs)
    && (dataJs.match(/"lead_tall":"[^"]*\/v1\/crop\//g) || []).length >= 270);
  const redirects = fs.readFileSync(path.join(out, '_redirects'), 'utf8');
  check('each imported Wix product page gets a 301 to its puppy', g.redirects === 273 && /^\/product-page\/alexa-cocker-spaniel \/puppy-alexa-cocker-spaniel\.html 301$/m.test(redirects));
  const named = [pup, salt, kennel].flatMap((h) => [...h.matchAll(/(?:src|data-full)="([^"]+)"/g)].map((m) => m[1])).filter((u) => !/^https?:/.test(u));
  check('every image a page names is a file in the output, or a photo the site Worker serves',
    named.length > 4 && named.every((u) => (u.startsWith('img/') || u.startsWith('css/') || u.startsWith('js/') || u.startsWith('data/') ? fs.existsSync(path.join(out, u.split('?')[0])) : /^(media\/[\w-]+(\/card)?|brand\/[\w-]+\/(logo|kennel)\?.*)$/.test(u.replace(/&amp;/g, '&')))), named.join(' '));
  check('no photo is copied into the output, only the concept\'s own images', !fs.existsSync(path.join(out, 'img/p')) && !fs.existsSync(path.join(out, 'img/b')) && !fs.existsSync(path.join(out, 'media')));
  check('_headers keeps versioned stylesheets and scripts for a year', /\/css\/\*\n  Cache-Control: public, max-age=31536000, immutable/.test(fs.readFileSync(path.join(out, '_headers'), 'utf8')));
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
    check('Publish now goes through the PORTAL binding and commits to the stand-in', res.status === 200 && body.ok && body.sha === g.tip && g.changed.includes('data/puppies.json'), `${res.status} ${JSON.stringify(body).slice(0, 300)}`);
    check('the operators screen shows the portal publisher', body.site && body.site.mode === 'portal' && body.site.last_publish_sha === g.tip);
    const after = sqlLocal('SELECT generation, published_generation, last_error FROM site_state WHERE id = 1')[0];
    check('the portal recorded the generation it read', after.published_generation >= before.generation && !after.last_error, JSON.stringify([before, after]));
    check('the commit holds data files only, no photo (D11)', g.changed.length > 0 && g.changed.every((f) => /^data\/\w+\.json$/.test(f)), JSON.stringify(g.changed));
    const committed = Buffer.from((await gs('/_files?prefix=data/'))['data/puppies.json'], 'base64').toString();
    check('the committed data names the uploaded photo at media/', committed.includes(`"src": "media/${pid}"`));
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

// ---------------------------------------------------------------- part 3, the generated site

function r2Local(command, ...args) {
  execFileSync(process.execPath, [WRANGLER, 'r2', 'object', command, ...args, '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc')], { cwd: APP, stdio: 'ignore' });
}

// wrangler dev drops a connection now and then (one run of 2026-10-06 lost the 301 request), so
// a request that never got an answer is tried once more. A wrong answer is never retried.
async function tryFetch(url, init) {
  try { return await fetch(url, init); } catch { await sleep(1500); return fetch(url, init); }
}

async function part3() {
  console.log('\n-- part 3: the generated pages and their site Worker on 8795');
  if (!(await waitFor(`${PORTAL}/api/config`, 5000))) { check('pc-portal is running on 8787', false); return; }
  const stamp = Date.now().toString(36);
  const pup = sqlLocal("SELECT p.id, p.slug, p.breeder_id, p.litter_id, b.logo_key FROM public_puppies p JOIN public_breeders b ON b.breeder_id = p.breeder_id WHERE b.slug <> 'unassigned' ORDER BY p.slug LIMIT 1")[0];
  const up = `st-up-${stamp}`, imp = `wix-ph-st-${stamp}`, hid = `st-hid-${stamp}`;
  // A draft puppy of the same breeder, which is not public, so its photo must not be served.
  const hidden = { id: `st-draft-${stamp}`, breeder_id: pup.breeder_id };
  const logoKey = `brand/${pup.breeder_id}/logo-st${stamp}.jpg`;
  const jpg = path.join(APP, 'dev/fixtures/gps-test.jpg');
  const key = (b, id) => `uploads/${b}/${id}.jpg`;
  // A breeder's upload, and a photo as the Wix import leaves one: in R2 under the upload key, with
  // its Wix address kept in external_url. Plus a photo of a puppy that is not public.
  r2Local('put', `puppyconnection-files/${key(pup.breeder_id, up)}`, '--file', jpg, '--content-type', 'image/jpeg');
  r2Local('put', `puppyconnection-files/${key(pup.breeder_id, imp)}`, '--file', jpg, '--content-type', 'image/jpeg');
  const t = iso(Date.now());
  sqlLocal(`INSERT INTO puppies (id, breeder_id, litter_id, slug, name, created_at, updated_at) VALUES ('${hidden.id}', '${pup.breeder_id}', '${pup.litter_id}', '${hidden.id}', 'Draft', '${t}', '${t}')`);
  r2Local('put', `puppyconnection-files/${logoKey}`, '--file', jpg, '--content-type', 'image/jpeg');
  sqlLocal(`UPDATE breeder_profiles SET logo_key = '${logoKey}' WHERE breeder_id = '${pup.breeder_id}'`);
  sqlLocal(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, external_url, content_type, position, created_at) VALUES
    ('${up}', '${pup.breeder_id}', '${pup.id}', '${key(pup.breeder_id, up)}', NULL, 'image/jpeg', 97, '${t}'),
    ('${imp}', '${pup.breeder_id}', '${pup.id}', '${key(pup.breeder_id, imp)}', 'https://static.wixstatic.com/media/st-test~mv2.jpg', 'image/jpeg', 98, '${t}')`);
  {
    r2Local('put', `puppyconnection-files/${key(hidden.breeder_id, hid)}`, '--file', jpg, '--content-type', 'image/jpeg');
    sqlLocal(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, created_at) VALUES ('${hid}', '${hidden.breeder_id}', '${hidden.id}', '${key(hidden.breeder_id, hid)}', 'image/jpeg', 99, '${t}')`);
  }
  let site = null;
  try {
    const dataDir = path.join(TMP, 'static-data');
    // The data comes the way the site build gets it in hook mode, from the portal's export.
    const fetched = await fetchData(`${PORTAL}/data/export.json`, dataDir);
    const counts = fetched.counts;
    const direct = path.join(TMP, 'static-direct');
    await exportData(direct);
    check('/data/export.json gives exactly the bytes a publish would commit (lib/shape.js)',
      ['breeds', 'breeders', 'litters', 'puppies'].every((f) => fs.readFileSync(path.join(dataDir, `data/${f}.json`)).equals(fs.readFileSync(path.join(direct, `data/${f}.json`)))));
    const exRes = await fetch(`${PORTAL}/data/export.json`);
    check('... and is never cached', exRes.headers.get('cache-control') === 'no-store');
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, 'data/puppies.json'), 'utf8'));
    const ph = data.find((x) => x.slug === pup.slug).photos;
    check('the data names the uploaded photo and the imported one at media/, not at Wix', ph.some((x) => x.src === `media/${up}`) && ph.some((x) => x.src === `media/${imp}` && x.card === `media/${imp}/card`), JSON.stringify(ph.slice(-2)));
    // Checked outside the checkout, because check_site.py counts any file git does not track there
    // as an image nobody committed, then built again where the local Worker serves it from.
    const checked = path.join(TMP, 'static-check');
    const g = build({ dataDir, out: checked, base: `${STATIC}/` });
    const chk = siteChecks(checked);
    build({ dataDir, out: path.join(APP, '.preview/static-site'), base: `${STATIC}/` });
    check(`the full local dataset builds and passes check_site.py (${g.pages} pages, ${counts.puppies} puppies)`, chk.ok && g.puppies === counts.puppies, chk.out.split('\n').filter((l) => /ERROR|error\(s\)/.test(l)).slice(0, 6).join('\n'));

    site = spawn(process.execPath, [WRANGLER, 'dev', '--config', path.join(APP, 'site/wrangler.static.jsonc'), '--persist-to', path.join(APP, '.state'),
      '--port', '8795', '--inspector-port', '9335'], { cwd: path.resolve(APP, '../..'), stdio: ['ignore', 'pipe', 'pipe'] });
    let log = ''; site.stdout.on('data', (d) => { log += d; }); site.stderr.on('data', (d) => { log += d; });
    const upNow = await waitFor(`${STATIC}/`, 120000);
    check('the generated-pages site Worker starts on 8795', upNow, log.slice(-600));
    if (!upNow) return;
    const home = await tryFetch(`${STATIC}/`);
    const homeText = await home.text();
    check('/ serves the home page, though html_handling is none', home.status === 200 && /<title>/.test(homeText) && /data\/data\.js\?v=/.test(homeText));
    const page = await tryFetch(`${STATIC}/puppy-${pup.slug}.html`);
    const pageText = await page.text();
    check('a puppy page is served at its .html address with no redirect', page.status === 200 && !page.redirected && pageText.includes(`media/${up}`));
    const bytes0 = fs.readFileSync(jpg);
    const m1 = await tryFetch(`${STATIC}/media/${up}`);
    check('/media/<id> serves an uploaded photo from R2', m1.status === 200 && m1.headers.get('content-type') === 'image/jpeg' && Buffer.from(await m1.arrayBuffer()).equals(bytes0) && /max-age=86400/.test(m1.headers.get('cache-control')));
    const m2 = await tryFetch(`${STATIC}/media/${imp}/card`);
    check('/media/<id>/card serves an imported photo, whole when it has no card copy', m2.status === 200 && Buffer.from(await m2.arrayBuffer()).equals(bytes0));
    check('a photo of a puppy that is not public answers 404', (await tryFetch(`${STATIC}/media/${hid}`)).status === 404);
    check('an unknown photo answers 404', (await tryFetch(`${STATIC}/media/no-such-photo`)).status === 404);
    const lg = await tryFetch(`${STATIC}/brand/${pup.breeder_id}/logo?size=card`);
    check('/brand/<id>/logo serves a public breeder\'s logo from R2, whole when it has no card copy', lg.status === 200 && Buffer.from(await lg.arrayBuffer()).equals(bytes0));
    const hasKennel = !!sqlLocal(`SELECT kennel_key FROM breeder_profiles WHERE breeder_id = '${pup.breeder_id}'`)[0].kennel_key;
    if (!hasKennel) check('/brand/<id>/kennel answers 404 for a breeder with no kennel photo', (await tryFetch(`${STATIC}/brand/${pup.breeder_id}/kennel`)).status === 404);
    const legacy = sqlLocal('SELECT slug, legacy_slug FROM public_puppies WHERE legacy_slug IS NOT NULL ORDER BY slug LIMIT 1')[0];
    const r301 = await tryFetch(`${STATIC}/product-page/${legacy.legacy_slug}`, { redirect: 'manual' });
    check('an old Wix product page answers 301 to its puppy page', r301.status === 301 && (r301.headers.get('location') || '').endsWith(`/puppy-${legacy.slug}.html`), `${r301.status} ${r301.headers.get('location')}`);
    const nf = await tryFetch(`${STATIC}/no-such-page.html`);
    check('an unknown address gets the 404 page', nf.status === 404 && (await nf.text()).includes('That page is not here'));
    const css = await tryFetch(`${STATIC}/css/style.css?v=1`);
    check('stylesheets carry the year-long cache from _headers', css.status === 200 && /immutable/.test(css.headers.get('cache-control') || ''), css.headers.get('cache-control'));
    const robots = await (await tryFetch(`${STATIC}/robots.txt`)).text();
    check('robots.txt turns crawlers away while the site is in review', /Disallow: \//.test(robots));
    const day = new Date().toISOString().slice(0, 10);
    const views = () => (sqlLocal(`SELECT views FROM puppy_stats WHERE puppy_id = '${pup.id}' AND day = '${day}'`)[0] || { views: 0 }).views;
    const v0 = views();
    const bc = await tryFetch(`${STATIC}/api/beacon`, { method: 'POST', headers: { origin: STATIC, 'content-type': 'text/plain', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36' }, body: JSON.stringify({ k: 'view', s: pup.slug }) });
    check('/api/beacon counts a view of a puppy page', bc.status === 204 && views() === v0 + 1, `${bc.status} ${v0} -> ${views()}`);
  } finally {
    if (site) site.kill();
    sqlLocal(`DELETE FROM photos WHERE id IN ('${up}', '${imp}', '${hid}')`);
    sqlLocal(`DELETE FROM puppies WHERE id = '${hidden.id}'`);
    sqlLocal(`UPDATE breeder_profiles SET logo_key = ${pup.logo_key ? `'${pup.logo_key}'` : 'NULL'} WHERE breeder_id = '${pup.breeder_id}'`);
    for (const k of [key(pup.breeder_id, up), key(pup.breeder_id, imp), key(hidden.breeder_id, hid), logoKey]) {
      try { r2Local('delete', `puppyconnection-files/${k}`); } catch { /* left behind in the local store only */ }
    }
  }
}

// ---------------------------------------------------------------- part 4, hook mode

// A stand-in for a Workers Builds deploy hook. It counts the POSTs and answers the way Cloudflare's
// API does, or with a failure when told to.
const HOOK_PORT = 8796, HOOK = `http://localhost:${HOOK_PORT}/hook/secret-part`;
const hook = { posts: 0, fail: 0, agents: [] };
const hookServer = http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith('/hook/secret-part')) { res.statusCode = 404; return res.end(); }
  hook.posts += 1;
  hook.agents.push(req.headers['user-agent']);
  res.setHeader('content-type', 'application/json');
  if (hook.fail > 0) { hook.fail -= 1; res.statusCode = 500; return res.end('{"success":false,"errors":[{"message":"internal"}]}'); }
  res.end(JSON.stringify({ success: true, errors: [], messages: [], result: { build_uuid: `build-${hook.posts}` } }));
});

async function part4node() {
  console.log('\n-- part 4a: hook mode on Node, against a stand-in deploy hook on 8796');
  const env0 = await seededEnv();
  const env = { ...env0, PUBLISH_MODE: 'hook', PUBLISH_HOOK_URL: HOOK, GITHUB_TOKEN: '' };
  delete env.GITHUB_API;
  const gh0 = (await gs('/_state')).requests;
  const s0 = await state(env);

  const off = await publishSite({ ...env, PUBLISH_HOOK_URL: '' });
  check('without PUBLISH_HOOK_URL the publish does nothing and says so', !off.ok && off.off && /PUBLISH_HOOK_URL is not set/.test(off.error), JSON.stringify(off));
  const wrong = await publishSite({ ...env, DEV_MODE: 'staging', PUBLISH_HOOK_URL: 'https://example.com/hook' });
  check('a deployed portal calls nothing but a Cloudflare API address', !wrong.ok && wrong.off && /not a Cloudflare deploy hook/.test(wrong.error));
  const local = await publishSite({ ...env, DEV_MODE: 'staging' });
  check('... and a localhost hook only while DEV_MODE is local', !local.ok && local.off);
  await env.DB.batch([dirtyStmt(env)]);
  const cronOff = await publishIfDue({ ...env, PUBLISH_HOOK_URL: '' }, { minAgeMs: 0 });
  check('the cron says so too', cronOff.off && /PUBLISH_HOOK_URL/.test(cronOff.reason), JSON.stringify(cronOff));
  check('... the site state is untouched and the hook was never called', hook.posts === 0 && (await state(env)).published_generation === s0.published_generation);

  const gen = (await state(env)).generation;
  const r1 = await publishSite(env, { type: 'operator', email: 'amber@puppyconnection.test' });
  const st1 = await state(env);
  check('a publish POSTs the deploy hook once and records the build', r1.ok && hook.posts === 1 && r1.sha === 'hook:build-1' && r1.build === 'build-1', JSON.stringify(r1));
  check('the generation read at the start counts as published once the hook accepts', st1.published_generation === gen && !st1.dirty && st1.last_publish_sha === 'hook:build-1' && !st1.last_error, JSON.stringify(st1));
  check('the request names itself, and GitHub is never called in hook mode', hook.agents[0] === 'puppyconnection-publish' && (await gs('/_state')).requests === gh0);
  const audit = await one(env, "SELECT actor, entity_id, after_json FROM audit_log WHERE action = 'site.publish' ORDER BY id DESC LIMIT 1");
  check('the publish is audited under the operator, with the build id', audit.actor === 'amber@puppyconnection.test' && audit.entity_id === 'hook' && JSON.parse(audit.after_json).build === 'build-1');

  const again = await publishSite(env);
  check('with nothing changed it starts no build', again.ok && again.nothing && hook.posts === 1);

  // One dirty period starts at most one build, and the cron leaves a running build alone.
  await env.DB.batch([env.DB.prepare("UPDATE puppies SET price_cents = 120000 WHERE id = 'test-pup-0'"), dirtyStmt(env)]);
  await env.DB.prepare('UPDATE site_state SET dirty_since = ? WHERE id = 1').bind(iso(Date.now() - 120000)).run();
  const busy = await publishIfDue(env);
  check('the cron waits while the last build may still be running', busy.wait && busy.build_running && hook.posts === 1, JSON.stringify(busy));
  await env.DB.prepare('UPDATE site_state SET last_publish_at = ? WHERE id = 1').bind(iso(Date.now() - 600000)).run();
  const due = await publishIfDue(env);
  const due2 = await publishIfDue(env);
  check('... then starts one build for the waiting changes, and the next run starts none', due.sha === 'hook:build-2' && due.mode === 'hook' && due2.waiting === 0 && hook.posts === 2, JSON.stringify([due, due2]));
  const cronAudit = await one(env, "SELECT actor FROM audit_log WHERE action = 'site.publish' ORDER BY id DESC LIMIT 1");
  check('the cron build is audited as the system', cronAudit.actor === 'publish-cron');

  // Failure: recorded once per distinct error, the generation left alone, the address never shown.
  await env.DB.batch([env.DB.prepare("UPDATE puppies SET price_cents = 110000 WHERE id = 'test-pup-0'"), dirtyStmt(env)]);
  const pg = (await state(env)).published_generation;
  const mail0 = (await one(env, "SELECT COUNT(*) AS n FROM email_log WHERE template = 'ops_alert'")).n;
  hook.fail = 2;
  const f1 = await publishSite(env);
  const f2 = await publishSite(env);
  const stf = await state(env);
  const mail1 = (await one(env, "SELECT COUNT(*) AS n FROM email_log WHERE template = 'ops_alert'")).n;
  check('a refused hook records last_error and leaves the generation waiting', !f1.ok && f1.recorded && /answered 500/.test(stf.last_error) && stf.published_generation === pg && stf.dirty === 1, JSON.stringify(stf));
  check('the operators are alerted once for the same error twice', !f2.ok && mail1 === mail0 + 1, `${mail0} -> ${mail1}`);
  check('the hook address, which is the secret, is in no error and no audit row', !stf.last_error.includes('secret-part')
    && !(await one(env, "SELECT COUNT(*) AS n FROM audit_log WHERE after_json LIKE '%secret-part%'")).n);
  const ok = await publishSite(env);
  check('the next good publish clears the error', ok.ok && !(await state(env)).last_error && hook.posts === 5, JSON.stringify(ok));

  // The admin's Publish now in hook mode hands the work to the portal.
  let asked = 0;
  const viaPortal = await publishNow({ ...env, PUBLISH_MODE: 'hook', PORTAL: { fetch: async () => { asked += 1; return new Response(JSON.stringify({ ok: true, sha: 'hook:build-x', generation: 9 }), { status: 200 }); } } }, { type: 'operator', email: 'amber@puppyconnection.test' });
  check('the admin with PUBLISH_MODE hook asks the portal through the binding', viaPortal.ok && asked === 1 && viaPortal.sha === 'hook:build-x');
  env.DB.close();
}

async function part4workers() {
  console.log('\n-- part 4b: a second portal on 8793 in hook mode, its cron and its export');
  const posts0 = hook.posts;
  const portal = spawn(process.execPath, [WRANGLER, 'dev', '--config', path.join(APP, 'portal/wrangler.jsonc'), '--persist-to', path.join(APP, '.state'),
    // Its own name, so the admin's PORTAL binding to pc-portal never finds this one, even after it stops.
    '--name', 'pc-portal-hook', '--port', '8793', '--inspector-port', '9336', '--test-scheduled', '--var', 'PUBLISH_MODE:hook', '--var', `PUBLISH_HOOK_URL:${HOOK}`], { cwd: path.resolve(APP, '../..'), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; portal.stdout.on('data', (d) => { log += d; }); portal.stderr.on('data', (d) => { log += d; });
  try {
    const up = await waitFor('http://localhost:8793/api/config', 120000);
    check('a second portal starts on 8793 with PUBLISH_MODE hook', up, log.slice(-600));
    if (!up) return;
    sqlLocal(`UPDATE site_state SET generation = generation + 1, dirty = 1, dirty_since = '${iso(Date.now() - 120000)}', last_publish_at = '${iso(Date.now() - 600000)}' WHERE id = 1`);
    await fetch(`http://localhost:8793/__scheduled?cron=${encodeURIComponent('*/15 * * * *')}`);
    await sleep(3000);
    const j = JSON.parse(sqlLocal("SELECT last_result FROM job_runs WHERE job = 'publish'")[0]?.last_result || '{}');
    const st = sqlLocal('SELECT generation, published_generation, dirty, last_publish_sha FROM site_state WHERE id = 1')[0];
    check('the */15 cron on the Worker calls the deploy hook once and catches the site up', hook.posts === posts0 + 1 && j.mode === 'hook' && /^build-/.test(j.build) && st.published_generation === st.generation && st.dirty === 0, JSON.stringify([j, st, hook.posts - posts0]));
    await fetch(`http://localhost:8793/__scheduled?cron=${encodeURIComponent('*/15 * * * *')}`);
    await sleep(2000);
    check('... and the next run starts no second build', hook.posts === posts0 + 1);
    const ex = await fetch('http://localhost:8793/data/export.json');
    const body = await ex.json();
    check('the portal serves /data/export.json to anyone, with the four files', ex.status === 200 && Object.keys(body.files).sort().join() === 'data/breeders.json,data/breeds.json,data/litters.json,data/puppies.json' && body.counts.puppies > 200);
    const keys = (f) => [...new Set(JSON.parse(body.files[f]).flatMap((o) => Object.keys(o)))].sort().join();
    check('... holding only the public fields, so no sign-in address, note or payment can be in it',
      keys('data/breeders.json') === 'about,breeds,city,email,facebook,kennel_photo,logo,name,phone,slug,state,website'
      && keys('data/puppies.json') === 'about,availability,breeder,breeder_url,deposit,hypoallergenic,includes,legacy_slug,litter,name,photos,price,published_at,sex,slug,color'.split(',').sort().join(), `${keys('data/breeders.json')} | ${keys('data/puppies.json')}`);
  } finally {
    portal.kill();
  }
}

const standin = spawn(process.execPath, [path.join(APP, 'dev/github-standin.mjs'), '--port', '8798'], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => hookServer.listen(HOOK_PORT, r));
try {
  await new Promise((r) => standin.stdout.once('data', r));
  await part1();
  await part4node();
  if (!process.argv.includes('--node-only')) { await part2(); await part3(); await part4workers(); }
} catch (e) {
  check('the test ran to the end', false, e.stack);
} finally {
  standin.kill();
  hookServer.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
