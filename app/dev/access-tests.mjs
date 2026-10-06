// The ten acceptance tests from the build spec (section 4), against the running local Workers.
//
//   node app/dev/access-tests.mjs
//
// Breeder A and breeder B are approved, C is pending and D is suspended. Every breeder route
// that takes an id is called with the other breeder's ids, and the route list is checked
// against the portal's own router so a new route cannot ship without being attacked here.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client, signUp } from './e2e.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));

let failures = 0;
const results = [];
function check(test, label, ok, detail) {
  results.push({ test, label, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  [${test}] ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function sql(command) {
  try {
    const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to',
      path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command],
    { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const admin = new Client(ADMIN);
const form = (o) => new URLSearchParams(o);

async function makeBreeder(tag, state) {
  const stamp = `${tag}-${Date.now().toString(36)}`;
  const email = `${stamp}@breeders.test`;
  const { c } = await signUp(email, `Kennel ${stamp}`);
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: `Kennel ${stamp}`, public_phone: '555-0101', city: 'Elkhart', state: 'IN' });
  await c.post('/api/profile/submit', { accept_terms: true });
  const b = { c, id: me.id, email };
  if (state === 'pending') return b;
  await admin.post(`/api/breeders/${b.id}/approve`, {});
  const litter = (await c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const draft = (await c.post('/api/puppies', { litter_id: litter, name: `${tag} draft`, price: '1500' })).data.id;
  const paid = (await c.post('/api/puppies', { litter_id: litter, name: `${tag} paid`, price: '1600' })).data.id;
  const draftPhoto = (await c.req('POST', `/api/puppies/${draft}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } })).data.id;
  await c.req('POST', `/api/puppies/${paid}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } });
  const co = (await c.post('/api/checkouts', { puppy_ids: [paid] })).data;
  const sp = new URL(co.url).pathname;
  const pay = await c.req('POST', `${sp}/pay`, form({ webhook: '1' }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  await c.get(new URL(pay.location).pathname + new URL(pay.location).search);
  Object.assign(b, { litter, draft, paid, draftPhoto, checkout: co.checkout_id });
  if (state === 'suspended') await admin.post(`/api/breeders/${b.id}/suspend`, { reason: 'access test' });
  return b;
}

async function main() {
  const A = await makeBreeder('a', 'approved');
  const B = await makeBreeder('b', 'approved');
  const C = await makeBreeder('c', 'pending');
  const D = await makeBreeder('d', 'suspended');
  await C.c.req('POST', '/api/profile/logo', JPG, { headers: { 'content-type': 'image/jpeg' } });
  await C.c.req('POST', '/api/profile/kennel', JPG, { headers: { 'content-type': 'image/jpeg' } });

  // The routes a breeder can reach with an id, taken from the portal router itself.
  const router = fs.readFileSync(path.join(APP, 'portal/worker.js'), 'utf8');
  const idRoutes = [...router.matchAll(/\['(GET|POST|PUT|DELETE)', \/\^(.*?)\$\/, (\w+)\]/g)]
    .filter((m) => m[2].includes('([\\w-]+)') && !m[2].includes('sim') && !m[2].includes('media'));
  const attacks = {
    updateLitter: ['PUT', `/api/litters/${B.litter}`, { breed_id: 'breed-havanese', version: 1 }],
    archiveLitter: ['POST', `/api/litters/${B.litter}/archive`, {}],
    updatePuppy: ['PUT', `/api/puppies/${B.draft}`, { name: 'hijack', version: 1 }],
    archivePuppy: ['POST', `/api/puppies/${B.draft}/archive`, {}],
    uploadPhoto: ['POST', `/api/puppies/${B.draft}/photos`, JPG],
    orderPhotos: ['PUT', `/api/puppies/${B.draft}/photo-order`, { ids: [B.draftPhoto] }],
    deletePhoto: ['DELETE', `/api/photos/${B.draftPhoto}`, null],
    uploadCard: ['POST', `/api/photos/${B.draftPhoto}/card`, JPG],
    // Plan P2.4 and P2.3. A batch into B's litter, a copy of B's puppy, marking it placed, and
    // C's logo and kennel photo, which stay private while C is pending.
    addPuppies: ['POST', `/api/litters/${B.litter}/puppies`, { girls: 2 }],
    duplicatePuppy: ['POST', `/api/puppies/${B.draft}/duplicate`, {}],
    setAvailability: ['PUT', `/api/puppies/${B.draft}/availability`, { availability: 'placed', version: 1 }],
    brandLogo: ['GET', `/brand/${C.id}/logo`, null],
    brandKennel: ['GET', `/brand/${C.id}/kennel`, null],
  };
  const covered = idRoutes.every((m) => attacks[m[3]]);
  check(0, `every id route in the portal router is attacked (${idRoutes.map((m) => m[3]).join(', ')})`, covered,
    `missing: ${idRoutes.filter((m) => !attacks[m[3]]).map((m) => m[3]).join(', ')}`);

  // 1. A cannot read B's records
  const aList = (await A.c.get('/api/listings')).data.litters.flatMap((l) => l.puppies).map((p) => p.id);
  check(1, "A's listings contain none of B's puppies", !aList.includes(B.draft) && !aList.includes(B.paid));
  const aCheckouts = (await A.c.get('/api/checkouts')).data.map((x) => x.id);
  check(1, "A's payment history contains none of B's", !aCheckouts.includes(B.checkout));
  const peek = await fetch(`http://localhost:8787/media/${B.draftPhoto}`, { headers: { cookie: A.c.cookie } });
  check(1, "A cannot open B's unpublished photo", peek.status === 404);
  const cancel = await A.c.get(`/checkout/cancel?c=${B.checkout}`);
  const bCo = (await admin.get(`/api/breeders/${B.id}`)).data.checkouts.find((x) => x.id === B.checkout);
  check(1, "A cannot cancel B's checkout", cancel.status === 303 && bCo.status === 'paid');

  // 2. A cannot update or delete B's records (every id route)
  for (const [name, [method, url, body]] of Object.entries(attacks)) {
    const headers = body instanceof Uint8Array ? { 'content-type': 'image/jpeg' } : undefined;
    const r = await A.c.req(method, url, body, { headers });
    check(2, `A → ${name} on B's record answers 404`, r.status === 404, `got ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  }
  const bDetail = (await admin.get(`/api/breeders/${B.id}`)).data;
  const bDraft = bDetail.litters.flatMap((l) => l.puppies).find((p) => p.id === B.draft);
  check(2, "B's puppy, litter and photo are unchanged afterwards",
    bDraft.name === 'b draft' && bDraft.publication_state === 'draft' && bDraft.photos.length === 1 && !bDetail.litters[0].archived_at);
  check(2, "B's litter gained no puppies and B's draft is still available",
    bDetail.litters.flatMap((l) => l.puppies).length === 2 && bDraft.availability === 'available');
  check(2, "C's own logo is there, so the 404s above were the ownership rule", (await C.c.get(`/brand/${C.id}/logo`)).status === 200);

  // The profile extras, counts and account routes take no id at all, so a breeder can only
  // ever reach their own. These prove it from the other side (plan P2.3, P2.5, P2.7).
  await B.c.put('/api/profile/extras', { facebook_url: 'https://www.facebook.com/bkennel', breed_ids: ['breed-havanese'] });
  await B.c.post('/api/account/close', { reason: 'access test' });
  await A.c.put('/api/profile/extras', { facebook_url: '', breed_ids: [], breeder_id: B.id });
  await A.c.req('DELETE', '/api/profile/logo');
  await A.c.post('/api/account/close/withdraw', {});
  const bMe = (await B.c.get('/api/me')).data;
  check(2, "A's extras and account changes leave B's extras and close request alone",
    bMe.extras.facebook_url === 'https://www.facebook.com/bkennel' && bMe.extras.breeds.length === 1 && (await B.c.get('/api/account')).data.close_request !== null);
  check(1, "A's view counts and account screen show none of B's", !(await A.c.get('/api/stats')).data.puppies.some((x) => [B.draft, B.paid].includes(x.id))
    && (await A.c.get('/api/account')).data.close_request === null && (await A.c.get('/api/account')).data.email === A.email);
  await B.c.post('/api/account/close/withdraw', {});

  // 3. A cannot attach a photo to B's puppy, refused by the database itself
  const direct = sql(`INSERT INTO photos (id, breeder_id, puppy_id, external_url, position, created_at)
    VALUES ('attack-photo', '${A.id}', '${B.draft}', 'https://example.test/x.jpg', 0, '2026-09-30T00:00:00Z')`);
  check(3, "a direct insert of A's photo on B's puppy fails the composite foreign key", !direct.ok && /FOREIGN KEY/i.test(direct.out), direct.out.slice(0, 200));
  const directPup = sql(`INSERT INTO puppies (id, breeder_id, litter_id, slug, name, created_at, updated_at)
    VALUES ('attack-pup', '${A.id}', '${B.litter}', 'attack-pup', 'x', '2026-09-30T00:00:00Z', '2026-09-30T00:00:00Z')`);
  check(3, "a direct insert of A's puppy into B's litter fails too", !directPup.ok && /FOREIGN KEY/i.test(directPup.out), directPup.out.slice(0, 200));

  // 4. A cannot insert a row while spoofing breeder_id = B
  const spoof = await A.c.post('/api/puppies', { litter_id: A.litter, name: 'spoof', price: '100', breeder_id: B.id });
  const spoofRow = (await admin.get(`/api/breeders/${A.id}`)).data.litters.flatMap((l) => l.puppies).find((p) => p.id === spoof.data.id);
  check(4, 'a breeder_id in the body is ignored and the row belongs to A', spoof.status === 201 && spoofRow?.breeder_id === A.id);
  const intoB = await A.c.post('/api/puppies', { litter_id: B.litter, name: 'intrude', price: '100' });
  check(4, "A cannot add a puppy to B's litter", intoB.status === 404);
  const spoofCo = await A.c.post('/api/checkouts', { puppy_ids: [B.draft] });
  check(4, "A cannot pay for B's puppy", spoofCo.status === 404);

  // 5. A pending breeder cannot create litters, pay, or publish
  check(5, 'pending C cannot create a litter', (await C.c.post('/api/litters', { breed_id: 'breed-havanese' })).status === 403);
  check(5, 'pending C cannot start a checkout', (await C.c.post('/api/checkouts', { puppy_ids: ['x'] })).status === 403);
  check(5, 'pending C is not in the public export', !(await admin.get('/api/export')).data.listings.some((l) => l.breeder_name?.startsWith('Kennel c-')));

  // 6. A suspended breeder cannot create, edit, pay or publish, from the next request
  check(6, 'suspended D cannot add a puppy', (await D.c.post('/api/puppies', { litter_id: D.litter, name: 'x', price: '1' })).status === 403);
  check(6, 'suspended D cannot edit a puppy', (await D.c.put(`/api/puppies/${D.draft}`, { name: 'x', version: 1 })).status === 403);
  check(6, 'suspended D cannot upload', (await D.c.req('POST', `/api/puppies/${D.draft}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } })).status === 403);
  check(6, 'suspended D cannot pay', (await D.c.post('/api/checkouts', { puppy_ids: [D.draft] })).status === 403);
  check(6, "suspended D's paid listing leaves the public export", !(await admin.get('/api/export')).data.listings.some((l) => l.puppy_name === 'd paid'));
  check(6, 'suspended D can still sign in and read their records', (await D.c.get('/api/listings')).status === 200);

  // 7. Anonymous visitors see only published listings and no private field
  const anon = new Client('http://localhost:8787');
  check(7, 'no session, no listings API', (await anon.get('/api/listings')).status === 401);
  check(7, "a draft's photo is not served anonymously", (await fetch(`http://localhost:8787/media/${A.draftPhoto}`)).status === 404);
  const exp = await admin.get('/api/export');
  const text = JSON.stringify(exp.data);
  check(7, 'the export holds no draft', !exp.data.listings.some((l) => l.puppy_name?.endsWith(' draft')));
  check(7, 'the export holds no sign-in address, status or internal field',
    ![A.email, B.email, C.email, D.email].some((e) => text.includes(e)) && !/"(status_reason|stripe_customer_id|email_verified_at|decided_by)"/.test(text));
  sql(`UPDATE puppies SET expires_at = '2020-01-01T00:00:00Z' WHERE id = '${A.paid}'`);
  const exp2 = await admin.get('/api/export');
  check(7, 'an expired listing leaves the export even before the expiry job runs', !exp2.data.listings.some((l) => l.puppy_name === 'a paid'));

  // 8. Admin cross-breeder operations keep the owner and are audited
  const bPaid = (await admin.get(`/api/breeders/${B.id}`)).data.litters.flatMap((l) => l.puppies).find((p) => p.id === B.paid);
  const edit = await admin.put(`/api/puppies/${B.paid}`, { availability: 'placed', version: bPaid.version });
  const after = (await admin.get(`/api/breeders/${B.id}`)).data;
  const row = after.litters.flatMap((l) => l.puppies).find((p) => p.id === B.paid);
  check(8, 'Amber marks B\'s puppy placed and it still belongs to B', edit.status === 200 && row.breeder_id === B.id && row.availability === 'placed');
  check(8, 'the change is in the audit log under Amber', after.audit.some((a) => a.actor_type === 'operator' && a.action === 'puppy.update' && a.entity_id === B.paid));

  // 9. Sign-in links: once, 15 minutes, no enumeration
  const fresh = new Client('http://localhost:8787');
  const known = await fresh.post('/auth/start', { email: A.email });
  const unknown = await fresh.post('/auth/start', { email: `nobody-${Date.now()}@breeders.test` });
  check(9, 'a registered and an unregistered address get byte-identical answers',
    known.status === unknown.status && JSON.stringify(known.data) === JSON.stringify(unknown.data));
  const mail = (await fresh.get(`/dev/mail.json?to=${encodeURIComponent(A.email)}`)).data[0];
  const tok = new URL(mail.link).searchParams.get('t');
  sql(`UPDATE login_tokens SET expires_at = '2020-01-01T00:00:00Z' WHERE used_at IS NULL AND email = '${A.email}'`);
  const late = await fresh.req('POST', '/auth/verify', form({ t: tok }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  check(9, 'an expired link is refused', late.status === 400);
  for (let i = 0; i < 6; i += 1) await fresh.post('/auth/start', { email: B.email });
  const count = sql(`SELECT COUNT(*) AS n FROM login_tokens WHERE email = '${B.email}' AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 hour')`);
  const n = Number((count.out.match(/"n":\s*(\d+)/) || [])[1]);
  check(9, 'no more than five links an hour are issued to one address', n <= 5, `issued ${n}`);

  // 10. The two sides never accept each other's identity
  const crossed = await A.c.get('/api/breeders');
  check(10, 'a breeder session reaches no operator route on the portal', crossed.status === 404);
  const { identify } = await import(new URL('../admin/identity.js', import.meta.url));
  const noAccess = await identify(new Request('https://admin.example.test/api/stats'), { DEV_MODE: 'local', DEV_IDENTITY: 'amber@puppyconnection.test', ACCESS_TEAM_DOMAIN: 'PASTE_TEAM_DOMAIN', ACCESS_AUD: 'PASTE_APPLICATION_AUD', DB: null });
  check(10, 'off localhost the dev identity is ignored and Access not configured means 403', !noAccess.ok && noAccess.status === 403, noAccess.reason);
  const forged = await identify(new Request('https://admin.example.test/api/stats', { headers: { 'cf-access-jwt-assertion': 'not.a.jwt!' } }),
    { ACCESS_TEAM_DOMAIN: 'example', ACCESS_AUD: 'aud', DB: null }).catch((e) => ({ ok: false, reason: e.message }));
  check(10, 'a forged Access header is refused', !forged.ok, forged.reason);
  const withCookie = await identify(new Request('https://admin.example.test/api/stats', { headers: { cookie: A.c.cookie } }),
    { ACCESS_TEAM_DOMAIN: 'PASTE_TEAM_DOMAIN', ACCESS_AUD: 'PASTE_APPLICATION_AUD', DB: null });
  check(10, 'a breeder session cookie is not an operator identity', !withCookie.ok);

  const byTest = {};
  for (const r of results) (byTest[r.test] ||= []).push(r.ok);
  console.log('\nby test: ' + Object.entries(byTest).map(([t, v]) => `${t}:${v.every(Boolean) ? 'pass' : 'FAIL'}`).join('  '));
  console.log(failures ? `${failures} failed` : 'all ten acceptance tests pass');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
