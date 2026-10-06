// The breeder portal features of plan P2 (P2.1 to P2.5, P2.7), against the running local Workers.
//
//   node app/dev/portal-features-test.mjs
//
// Needs pc-portal on 8787, pc-admin on 8788 and the site Worker on 8791 (app/site/wrangler.jsonc,
// after node app/dev/build-site.mjs). Breeders A and B are approved and C is pending. Every
// check that touches another breeder's extras, counts or account request is made from the
// wrong account and must change nothing. Sign-up is limited to ten requests a minute, so the
// suite waits out a 429 from the limiter.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from './e2e.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const SITE = process.env.SITE || 'http://localhost:8791';
const SITE_ORIGIN = 'http://localhost:8789';   // SITE_ORIGIN in portal/wrangler.jsonc
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));
const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

async function call(c, method, p, body, extra) {
  for (let i = 0; i < 3; i += 1) {
    const r = await c.req(method, p, body, extra);
    if (r.status !== 429 || !/wait a minute/.test(r.data?.error || '')) return r;
    console.log('      (rate limited, waiting a minute)');
    await sleep(62000);
  }
  throw new Error(`${p} stayed rate limited`);
}

const admin = new Client(ADMIN);
const img = (c, p) => c.req('POST', p, JPG, { headers: { 'content-type': 'image/jpeg' } });

async function breeder(tag, approve) {
  const stamp = `${tag}-${Date.now().toString(36)}`;
  const email = `feat-${stamp}@breeders.test`;
  const c = new Client(PORTAL);
  await call(c, 'POST', '/auth/start', { email, business_name: `Feature Kennel ${stamp}` });
  const mail = await c.get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
  const token = new URL(mail.data[0].link).searchParams.get('t');
  await c.req('POST', '/auth/verify', new URLSearchParams({ t: token }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: `Feature Kennel ${stamp}`, public_phone: '555-0102', city: 'Goshen', state: 'IN' });
  await c.post('/api/profile/submit', { accept_terms: true });
  if (approve) await admin.post(`/api/breeders/${me.id}/approve`, {});
  return { c, id: me.id, email, name: `Feature Kennel ${stamp}` };
}

async function pay(c, ids) {
  const co = (await c.post('/api/checkouts', { puppy_ids: ids })).data;
  const sp = new URL(co.url).pathname;
  const r = await c.req('POST', `${sp}/pay`, new URLSearchParams({ webhook: '1' }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  await c.get(new URL(r.location).pathname + new URL(r.location).search);
}

const puppies = async (c) => (await c.get('/api/listings')).data.litters.flatMap((l) => l.puppies);
const pup = async (c, id) => (await puppies(c)).find((p) => p.id === id);

function beacon(kind, slug, { ua = BROWSER, origin = SITE } = {}) {
  return fetch(`${SITE}/api/beacon`, { method: 'POST', headers: { origin, 'user-agent': ua, 'content-type': 'text/plain' }, body: JSON.stringify({ k: kind, s: slug }) });
}

async function main() {
  const A = await breeder('a', true);
  const B = await breeder('b', true);
  const C = await breeder('c', false);

  // ---------------------------------------------------------------- P2.1 where a puppy stands
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const bare = (await A.c.post('/api/puppies', { litter_id: litter, name: 'Pepper' })).data.id;
  let p = await pup(A.c, bare);
  check('P2.1 a draft with no price and no photo names both', JSON.stringify(p.needs) === '["a price","a photo"]' && /price/.test(p.pay_block), JSON.stringify([p.needs, p.pay_block]));
  await A.c.put(`/api/puppies/${bare}`, { name: 'Pepper', price: '1800', version: p.version });
  p = await pup(A.c, bare);
  check('P2.1 with a price it needs only the photo', JSON.stringify(p.needs) === '["a photo"]' && /photo/.test(p.pay_block), JSON.stringify([p.needs, p.pay_block]));
  await img(A.c, `/api/puppies/${bare}/photos`);
  p = await pup(A.c, bare);
  check('P2.1 with a photo it needs nothing and can be paid for', p.needs.length === 0 && p.pay_block === null, JSON.stringify([p.needs, p.pay_block]));
  check('P2.1 a draft has no site link', p.site_url === null);
  await pay(A.c, [bare]);
  p = await pup(A.c, bare);
  const L = (await A.c.get('/api/listings')).data;
  check('P2.1 the paid puppy is listed with no end date while listing_days is 0', p.is_public && p.expires_at === null && L.listing_days === 0, JSON.stringify([p.is_public, p.expires_at, L.listing_days]));
  check('P2.1 a listed puppy cannot be paid for again', p.pay_block === 'Already listed.');

  // ---------------------------------------------------------------- P2.2 view on the site
  check('P2.2 the listed puppy links to its page on the site', p.site_url === `${SITE_ORIGIN}/puppy.html?slug=${p.slug}`, p.site_url);
  const exp = (await admin.get('/api/export')).data;
  check('P2.2 that slug is the one the site renders', exp.listings.some((x) => x.slug === p.slug));
  const meA = (await A.c.get('/api/me')).data;
  const prof = exp.profiles.find((x) => x.name === A.name);
  check('P2.2 an approved breeder links to their page on the site', !!prof && meA.site_url === `${SITE_ORIGIN}/breeder.html?slug=${prof.slug}`, `${meA.site_url} vs ${prof && prof.slug}`);
  check('P2.2 a pending breeder has no site link yet', (await C.c.get('/api/me')).data.site_url === null);

  // ---------------------------------------------------------------- P2.3 profile extras
  const bad = await A.c.put('/api/profile/extras', { facebook_url: 'https://evil.example/facebook.com/x' });
  check('P2.3 a Facebook address that is not facebook.com is refused', bad.status === 400);
  const bad2 = await A.c.put('/api/profile/extras', { facebook_url: 'https://facebook.com.evil.example/x' });
  check('P2.3 a look-alike Facebook host is refused', bad2.status === 400);
  const badBreed = await A.c.put('/api/profile/extras', { breed_ids: ['breed-not-real'] });
  check('P2.3 a breed that is not in the list is refused', badBreed.status === 400);
  const ok = await A.c.put('/api/profile/extras', { facebook_url: 'facebook.com/featurekennel', breed_ids: ['breed-havanese', 'breed-cavapoo'] });
  check('P2.3 Facebook and breeds save, and the address gains https://', ok.status === 200 && ok.data.extras.facebook_url === 'https://facebook.com/featurekennel'
    && ok.data.extras.breeds.map((b) => b.id).sort().join() === 'breed-cavapoo,breed-havanese', JSON.stringify(ok.data.extras || ok.data));
  const fbMail = (await new Client(PORTAL).get(`/dev/mail.json?to=${encodeURIComponent(A.email)}`)).data;
  check('P2.3 a new Facebook page sends the contact change notice to the sign-in address', fbMail.some((m) => /contact details were changed/.test(m.subject) && /Facebook page/.test(m.body)));

  const logoA = await img(A.c, '/api/profile/logo');
  const cardA = await img(A.c, '/api/profile/logo/card');
  check('P2.3 a logo and its card copy upload', logoA.status === 201 && cardA.status === 201, JSON.stringify([logoA.data, cardA.data]));
  await img(A.c, '/api/profile/kennel');
  const logoC = await img(C.c, '/api/profile/logo');
  check('P2.3 a pending breeder can add a logo while filling in the profile', logoC.status === 201);
  const meA2 = (await A.c.get('/api/me')).data;
  const anon = new Client(PORTAL);
  check('P2.3 a public breeder\'s logo is served to anyone', (await anon.get(`/brand/${A.id}/logo`)).status === 200);
  check('P2.3 its card copy is served with size=card', (await anon.get(`/brand/${A.id}/logo?size=card`)).status === 200);
  check('P2.3 the site Worker serves the public logo too', (await fetch(`${SITE}/brand/${A.id}/logo`)).status === 200);
  check('P2.3 a pending breeder\'s logo is not served to a stranger', (await anon.get(`/brand/${C.id}/logo`)).status === 404);
  check('P2.3 nor to another breeder', (await A.c.get(`/brand/${C.id}/logo`)).status === 404);
  check('P2.3 nor by the site', (await fetch(`${SITE}/brand/${C.id}/logo`)).status === 404);
  check('P2.3 the pending breeder sees their own logo', (await C.c.get(`/brand/${C.id}/logo`)).status === 200);
  check('P2.3 an operator sees it in the admin', (await admin.get(`/brand/${C.id}/logo`)).status === 200);
  const exp2 = (await admin.get('/api/export')).data;
  const prof2 = exp2.profiles.find((x) => x.name === A.name);
  check('P2.3 the export carries the logo, kennel photo, breeds and Facebook page',
    prof2 && /\/brand\/.+\/logo\?v=/.test(prof2.logo) && /\/brand\/.+\/kennel\?v=/.test(prof2.kennel_photo)
    && prof2.breeds.join() === 'Cavapoo,Havanese' && prof2.facebook === 'https://facebook.com/featurekennel', JSON.stringify(prof2));
  check('P2.3 the pending breeder is not in the export', !exp2.profiles.some((x) => x.name === C.name));
  const logoA2 = await img(A.c, '/api/profile/logo');
  check('P2.3 replacing the logo gives it a new address', logoA2.status === 201 && logoA2.data.url !== meA2.extras.logo_url, `${logoA2.data.url} vs ${meA2.extras.logo_url}`);

  // Ownership. The extras routes take no id, so A can only ever reach A's own.
  const bLogo = await img(B.c, '/api/profile/logo');
  await A.c.req('DELETE', '/api/profile/logo');
  await A.c.put('/api/profile/extras', { facebook_url: '', breed_ids: [] });
  const meB = (await B.c.get('/api/me')).data;
  check('P2.3 A removing and clearing their extras leaves B\'s logo and extras alone', bLogo.status === 201 && !!meB.extras.logo_url && (await new Client(PORTAL).get(`/brand/${B.id}/logo`)).status === 200);
  check('P2.3 a removed logo is no longer served', (await anon.get(`/brand/${A.id}/logo`)).status === 404);
  const extraSmuggle = await A.c.put('/api/profile/extras', { facebook_url: 'https://www.facebook.com/a', breed_ids: ['breed-havanese'], breeder_id: B.id });
  const meB2 = (await B.c.get('/api/me')).data;
  check('P2.3 a breeder_id in the body is ignored', extraSmuggle.status === 200 && meB2.extras.facebook_url === null && meB2.extras.breeds.length === 0);

  // ---------------------------------------------------------------- P2.4 faster entry
  const many = await A.c.post(`/api/litters/${litter}/puppies`, { girls: 2, boys: 1, price: '1200', deposit: '200' });
  check('P2.4 three puppies are added in one step', many.status === 201 && many.data.ids.length === 3, JSON.stringify(many.data));
  let all = await puppies(A.c);
  const made = all.filter((x) => many.data.ids.includes(x.id));
  check('P2.4 they are named, sexed and priced', made.map((x) => `${x.name}/${x.sex}/${x.price_cents}/${x.deposit_cents}`).sort().join() === 'Boy 1/male/120000/20000,Girl 1/female/120000/20000,Girl 2/female/120000/20000',
    made.map((x) => `${x.name}/${x.sex}/${x.price_cents}`).join());
  const more = await A.c.post(`/api/litters/${litter}/puppies`, { girls: 1, unknown: 1 });
  all = await puppies(A.c);
  check('P2.4 a second batch counts on from the first', more.status === 201 && all.some((x) => x.name === 'Girl 3' && x.sex === 'female') && all.some((x) => x.name === 'Puppy 1' && x.sex === null));
  check('P2.4 zero puppies is refused', (await A.c.post(`/api/litters/${litter}/puppies`, { girls: 0 })).status === 400);
  check('P2.4 more than fifteen at once is refused', (await A.c.post(`/api/litters/${litter}/puppies`, { girls: 10, boys: 6 })).status === 400);
  check('P2.4 a pending breeder cannot add a batch', (await C.c.post(`/api/litters/${litter}/puppies`, { girls: 1 })).status === 403);

  const dup = await A.c.post(`/api/puppies/${bare}/duplicate`, {});
  const copy = await pup(A.c, dup.data.id);
  check('P2.4 a duplicate is a draft copy with no photos', dup.status === 201 && copy.name === 'Pepper copy' && copy.price_cents === 180000
    && copy.photos.length === 0 && copy.publication_state === 'draft' && copy.slug !== p.slug, JSON.stringify(copy).slice(0, 200));

  p = await pup(A.c, bare);
  const placed = await A.c.put(`/api/puppies/${bare}/availability`, { availability: 'placed', version: p.version });
  const p2 = await pup(A.c, bare);
  check('P2.4 a puppy is marked placed from the list', placed.status === 200 && p2.availability === 'placed');
  check('P2.4 the site shows it placed', (await admin.get('/api/export')).data.listings.find((x) => x.slug === p.slug).status === 'adopted');
  check('P2.4 a stale version is refused', (await A.c.put(`/api/puppies/${bare}/availability`, { availability: 'available', version: p.version })).status === 409);
  check('P2.4 an unknown status is refused', (await A.c.put(`/api/puppies/${bare}/availability`, { availability: 'sold', version: p2.version })).status === 400);
  const back = await A.c.put(`/api/puppies/${bare}/availability`, { availability: 'available', version: p2.version });
  check('P2.4 and marked available again', back.status === 200 && (await pup(A.c, bare)).availability === 'available');

  // ---------------------------------------------------------------- P2.5 views and clicks
  const slug = p.slug;
  const before = (await A.c.get('/api/stats')).data;
  check('P2.5 a new listing starts at no views', before.total.views === 0 && before.total.clicks === 0, JSON.stringify(before.total));
  await beacon('view', slug);
  await beacon('view', slug);
  await beacon('click', slug);
  await beacon('view', slug, { ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });
  await beacon('view', slug, { ua: '' });
  await beacon('view', slug, { origin: 'https://elsewhere.example' });
  await beacon('view', copy.slug);   // a draft is not public, so it is not counted
  await beacon('view', 'no-such-puppy');
  const r = await beacon('nonsense', slug);
  check('P2.5 the beacon always answers 204 with no body', r.status === 204 && (await r.text()) === '');
  const after = (await A.c.get('/api/stats')).data;
  const row = after.puppies.find((x) => x.id === bare);
  check('P2.5 one view and one click are counted, a reload within a minute counts once', row && row.views === 1 && row.clicks === 1, JSON.stringify(row));
  check('P2.5 bots, a missing user agent and other sites are not counted', after.total.views === 1, JSON.stringify(after.total));
  check('P2.5 a draft puppy is not counted', !after.puppies.some((x) => x.id === copy.id && x.views));
  check('P2.5 the total matches', after.total.views === 1 && after.total.clicks === 1 && after.total.views_all === 1);
  check('P2.5 the listings carry the 30-day counts', (await pup(A.c, bare)).views === 1);
  const stored = sql(`SELECT * FROM puppy_stats WHERE puppy_id = '${bare}'`);
  check('P2.5 only a puppy, a day and two numbers are stored', stored.length === 1 && Object.keys(stored[0]).sort().join() === 'clicks,day,puppy_id,views', JSON.stringify(stored));
  const bStats = (await B.c.get('/api/stats')).data;
  check('P2.5 another breeder never sees these counts', !bStats.puppies.some((x) => x.id === bare) && bStats.total.views === 0);
  check('P2.5 the stats need a session', (await new Client(PORTAL).get('/api/stats')).status === 401);
  // Wait out the one-a-minute repeat rule, so only the per-address limit can stop the last view.
  console.log('      (waiting a minute for the repeat window to pass)');
  await sleep(61000);
  for (let i = 0; i < 31; i += 1) await beacon('view', `flood-${i}`);
  await beacon('view', slug);
  const flooded = (await A.c.get('/api/stats')).data.puppies.find((x) => x.id === bare);
  check('P2.5 more than 30 beacons a minute from one address are dropped', flooded.views === 1, JSON.stringify(flooded));
  await sleep(61000);
  await beacon('view', slug);
  const later = (await A.c.get('/api/stats')).data.puppies.find((x) => x.id === bare);
  check('P2.5 a view a minute later counts again', later.views === 2, JSON.stringify(later));

  // ---------------------------------------------------------------- P2.7 account
  let acc = (await A.c.get('/api/account')).data;
  check('P2.7 the account screen shows the sign-in email and devices', acc.email === A.email && acc.sessions >= 1 && acc.close_request === null, JSON.stringify(acc));
  const ask = await A.c.post('/api/account/close', { reason: 'Retiring from breeding' });
  check('P2.7 a breeder can ask to close the account', ask.status === 200 && ask.data.close_request && ask.data.close_request.reason === 'Retiring from breeding');
  check('P2.7 asking twice is refused', (await A.c.post('/api/account/close', {})).status === 400);
  check('P2.7 nothing is deleted', (await A.c.get('/api/me')).data.status === 'approved' && (await pup(A.c, bare)).is_public);
  const opsMail = (await admin.get('/dev/mail')).data;
  check('P2.7 the operators are told', String(opsMail).includes('asked to close their account'));
  check('P2.7 the admin lists them under Asked to close', (await admin.get('/api/breeders?status=closing')).data.some((x) => x.id === A.id));
  check('P2.7 the admin counts it as needing attention', (await admin.get('/api/stats')).data.close_requests >= 1);
  const det = (await admin.get(`/api/breeders/${A.id}`)).data;
  check('P2.7 the breeder record shows the request and reason', det.close_request && det.close_request.reason === 'Retiring from breeding');
  check('P2.7 another breeder does not see it', (await B.c.get('/api/account')).data.close_request === null);
  check('P2.7 another breeder cannot withdraw it', (await B.c.post('/api/account/close/withdraw', {})).status === 400 && (await A.c.get('/api/account')).data.close_request !== null);
  const wd = await A.c.post('/api/account/close/withdraw', {});
  check('P2.7 the breeder can withdraw it', wd.status === 200 && wd.data.close_request === null);
  await A.c.post('/api/account/close', { reason: 'Second thoughts' });
  const res = await admin.post(`/api/breeders/${A.id}/close-request/resolve`, {});
  check('P2.7 an operator marks it handled', res.status === 200 && res.data.close_request === null);
  check('P2.7 and it leaves the Asked to close list', !(await admin.get('/api/breeders?status=closing')).data.some((x) => x.id === A.id));
  check('P2.7 handling a request that is not there is a 404', (await admin.post(`/api/breeders/${B.id}/close-request/resolve`, {})).status === 404);
  check('P2.7 a pending breeder can ask too', (await C.c.post('/api/account/close', {})).status === 200);
  const audit = sql(`SELECT action FROM audit_log WHERE entity_id = '${A.id}' AND action LIKE 'account.%' ORDER BY id`).map((x) => x.action).join();
  check('P2.7 each step is in the activity record', audit === 'account.close_request,account.close_withdrawn,account.close_request,account.close_handled', audit);

  // ---------------------------------------------------------------- a paused breeder
  await admin.post(`/api/breeders/${B.id}/suspend`, { reason: 'feature test' });
  check('a suspended breeder cannot change extras', (await B.c.put('/api/profile/extras', { facebook_url: '' })).status === 403);
  check('a suspended breeder cannot upload a logo', (await img(B.c, '/api/profile/logo')).status === 403);
  check('a suspended breeder\'s logo leaves the public site', (await fetch(`${SITE}/brand/${B.id}/logo`)).status === 404);

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
