// The whole breeder journey, driven over HTTP against the two local Workers.
//
//   node app/dev/e2e.mjs
//
// Signs up a new breeder, opens the sign-in link from the local mailbox, fills and submits
// the profile, has Amber approve it, adds a litter, two puppies and a photo carrying GPS
// metadata, pays for both through the simulated Stripe page, and checks they are public and
// in the site export. It then pays for a third puppy with the webhook "lost", to prove the
// success page publishes it on its own. Exits non-zero on the first failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';

// Against the hosted test deployment, TEST_GATE carries the password (read from
// app/.state/test-access.txt, never typed into the script).
const AUTH = process.env.TEST_GATE ? { authorization: `Basic ${Buffer.from(`tester:${process.env.TEST_GATE}`).toString('base64')}` } : {};

let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (!ok) failures += 1;
  return ok;
}

export class Client {
  constructor(base) { this.base = base; this.jar = {}; }
  get cookie() { return Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; '); }
  async req(method, p, body, extra = {}) {
    const headers = { origin: this.base, ...AUTH, ...(extra.headers || {}) };
    if (this.cookie) headers.cookie = this.cookie;
    let payload = body;
    if (body && !(body instanceof Uint8Array) && !(body instanceof URLSearchParams)) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(this.base + p, { method, headers, body: payload, redirect: 'manual' });
    for (const set of res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean)) {
      const [pair] = set.split(';');
      const i = pair.indexOf('=');
      this.jar[pair.slice(0, i)] = pair.slice(i + 1);
    }
    const text = await res.text();
    let data = text;
    try { data = JSON.parse(text); } catch { /* html or empty */ }
    return { status: res.status, data, location: res.headers.get('location') };
  }
  get(p) { return this.req('GET', p); }
  post(p, b) { return this.req('POST', p, b ?? {}); }
  put(p, b) { return this.req('PUT', p, b); }
}

export async function signUp(email, business) {
  const c = new Client(PORTAL);
  const start = await c.post('/auth/start', { email, business_name: business });
  const mail = await c.get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
  const link = mail.data[0]?.link;
  const token = link && new URL(link).searchParams.get('t');
  const verify = await c.req('POST', '/auth/verify', new URLSearchParams({ t: token || '' }),
    { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  return { c, start, link, token, verify };
}

async function main() {
  const stamp = Date.now().toString(36);
  const email = `e2e-${stamp}@breeders.test`;
  const admin = new Client(ADMIN);

  // Sign up and sign in
  const { c, start, link, token, verify } = await signUp(email, `E2E Kennel ${stamp}`);
  check('sign-up answers with the neutral message', start.status === 200 && /sign-in code and link/.test(start.data.message));
  check('a sign-in link reached the local mailbox', !!link, JSON.stringify(start.data));
  const scanner = await new Client(PORTAL).get(`/auth/verify?t=${encodeURIComponent(token)}`);
  check('opening the link with GET changes nothing (mail scanners)', scanner.status === 200 && /Sign in/.test(scanner.data));
  check('pressing Sign in starts a session', verify.status === 303 && !!c.cookie, `status ${verify.status}`);
  const reuse = await new Client(PORTAL).req('POST', '/auth/verify', new URLSearchParams({ t: token }),
    { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  check('the same link cannot be used twice', reuse.status === 400);

  let me = await c.get('/api/me');
  check('the new account is pending', me.data.status === 'pending');
  const early = await c.post('/api/litters', { breed_id: 'breed-havanese' });
  check('a pending breeder cannot create a litter', early.status === 403);

  // Profile and submission
  let r = await c.put('/api/profile', { version: me.data.profile.version, business_name: `E2E Kennel ${stamp}`, public_phone: '555-0100',
    city: 'Goshen', state: 'IN', website_url: 'https://e2e-kennel.test', description: 'A simulated kennel.' });
  check('the profile saves', r.status === 200, JSON.stringify(r.data));
  r = await c.post('/api/profile/submit', { accept_terms: true });
  check('the profile submits for approval', r.status === 200 && !!r.data.profile_submitted_at, JSON.stringify(r.data));
  // Amber's mail is read from the admin's own mailbox, which the portal does not show.
  const amberMail = await admin.get('/dev/mail');
  check('Amber was emailed about the new breeder', String(amberMail.data).includes(`E2E Kennel ${stamp}`));

  // Approval
  const queue = await admin.get('/api/breeders?status=queue');
  check('the breeder is in Amber\'s queue', queue.data.some((b) => b.email === email));
  const breederId = me.data.id;
  r = await admin.post(`/api/breeders/${breederId}/approve`, {});
  check('Amber approves the breeder', r.status === 200 && r.data.breeder.status === 'approved', JSON.stringify(r.data).slice(0, 200));
  me = await c.get('/api/me');
  check('the portal sees the approval on the next request', me.data.status === 'approved');

  // Litter, puppies, photo
  r = await c.post('/api/litters', { breed_id: 'breed-havanese', born_on: '2026-09-01', ready_on: '2026-10-27', mom_weight_lb: 10, dad_weight_lb: 12 });
  check('an approved breeder creates a litter', r.status === 201, JSON.stringify(r.data));
  const litterId = r.data.id;
  const ids = [];
  for (const [name, price] of [['Biscuit', '2100'], ['Clover', '2250'], ['Dash', '1995']]) {
    r = await c.post('/api/puppies', { litter_id: litterId, name, sex: 'female', price, deposit: '500', includes: ['Vet exam', 'Microchipped'] });
    check(`puppy ${name} is created`, r.status === 201, JSON.stringify(r.data));
    ids.push(r.data.id);
  }
  const noPhoto = await c.post('/api/checkouts', { puppy_ids: [ids[0]] });
  check('a puppy with no photo cannot be paid for', noPhoto.status === 400 && noPhoto.data.problems?.length === 1);

  const jpg = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));
  for (const id of ids) {
    r = await c.req('POST', `/api/puppies/${id}/photos`, jpg, { headers: { 'content-type': 'image/jpeg' } });
    check('a photo uploads', r.status === 201, JSON.stringify(r.data));
  }
  const served = await fetch(`${PORTAL}${r.data.url}`, { headers: { cookie: c.cookie, ...AUTH } });
  const bytes = new Uint8Array(await served.arrayBuffer());
  const asText = Buffer.from(bytes).toString('latin1');
  check('the stored photo has its GPS and camera metadata stripped', !asText.includes('Exif') && !asText.includes('SimCam') && bytes.length < jpg.length,
    `stored ${bytes.length} bytes against ${jpg.length}`);
  const stranger = await fetch(`${PORTAL}${r.data.url}`, { headers: AUTH });
  check('an unpublished photo is not served to a stranger', stranger.status === 404);
  const before = await fetch(`${PORTAL}${r.data.url}/card`, { headers: { cookie: c.cookie, ...AUTH } });
  check('a photo with no card copy serves the full copy at /card', before.status === 200 && (await before.arrayBuffer()).byteLength === bytes.length);
  const card = await c.req('POST', `/api/photos/${r.data.id}/card`, jpg, { headers: { 'content-type': 'image/jpeg' } });
  check('a card copy uploads', card.status === 201, JSON.stringify(card.data));
  const cardServed = await fetch(`${PORTAL}${r.data.url}/card`, { headers: { cookie: c.cookie, ...AUTH } });
  const cardText = Buffer.from(await cardServed.arrayBuffer()).toString('latin1');
  check('the card copy is served and stripped too', cardServed.status === 200 && !cardText.includes('SimCam'));
  check('an unpublished card copy is not served to a stranger', (await fetch(`${PORTAL}${r.data.url}/card`, { headers: AUTH })).status === 404);

  // Pay for two puppies through the simulated Stripe page
  r = await c.post('/api/checkouts', { puppy_ids: [ids[0], ids[1]] });
  check('a checkout opens for two puppies', r.status === 201 && /\/sim\/checkout\/cs_sim_/.test(r.data.url), JSON.stringify(r.data));
  const sessionPath = new URL(r.data.url).pathname;
  const sessionId = sessionPath.split('/').pop();
  const again = await c.post('/api/checkouts', { puppy_ids: [ids[1]] });
  check('a puppy already in an open checkout cannot start a second one', again.status === 400 || again.status === 409);
  const pagePrice = await c.get(sessionPath);
  check('the simulated checkout shows two listings for $29.98', /\$29\.98/.test(pagePrice.data));
  const pay = await c.req('POST', `${sessionPath}/pay`, new URLSearchParams({ webhook: '1' }),
    { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  check('paying redirects to the success page', pay.status === 303 && pay.location.includes('/checkout/success'));
  const success = await c.get(new URL(pay.location).pathname + new URL(pay.location).search);
  check('the success page lands on the listings screen', success.status === 303 && success.location.includes('paid='));
  const listings = await c.get('/api/listings');
  const mine = listings.data.litters.flatMap((l) => l.puppies);
  const pub = mine.filter((p) => p.is_public).map((p) => p.name).sort();
  check('both paid puppies are public', JSON.stringify(pub) === '["Biscuit","Clover"]', JSON.stringify(pub));
  const live = await c.get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
  check('the breeder got exactly one "now listed" email', live.data.filter((m) => /now listed/.test(m.subject)).length === 1);

  // Replaying fulfillment changes nothing
  const replay = await c.get(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`);
  const mail2 = await c.get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
  check('running fulfillment again is a no-op', replay.status === 303 && mail2.data.filter((m) => /now listed/.test(m.subject)).length === 1);

  // Lose the webhook: the success page must publish on its own
  r = await c.post('/api/checkouts', { puppy_ids: [ids[2]] });
  const p2 = new URL(r.data.url).pathname;
  const pay2 = await c.req('POST', `${p2}/pay`, new URLSearchParams({ webhook: '0' }),
    { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  let l2 = await c.get('/api/listings');
  const dashBefore = l2.data.litters.flatMap((l) => l.puppies).find((p) => p.name === 'Dash');
  check('with the webhook lost, Dash is not public before the success page', !dashBefore.is_public);
  await c.get(new URL(pay2.location).pathname + new URL(pay2.location).search);
  l2 = await c.get('/api/listings');
  const dashAfter = l2.data.litters.flatMap((l) => l.puppies).find((p) => p.name === 'Dash');
  check('the success page published Dash on its own', dashAfter.is_public);

  // Export
  const exp = await admin.get('/api/export');
  const inExport = exp.data.listings.filter((x) => ['Biscuit', 'Clover', 'Dash'].includes(x.puppy_name) && x.breeder_name === `E2E Kennel ${stamp}`);
  check('all three are in the site export', inExport.length === 3, `${inExport.length} found`);

  // Suspension hides the listings on the next request
  await admin.post(`/api/breeders/${breederId}/suspend`, { reason: 'e2e check' });
  const blocked = await c.post('/api/puppies', { litter_id: litterId, name: 'Echo', price: '1' });
  check('a suspended breeder cannot add a puppy', blocked.status === 403);
  const exp2 = await admin.get('/api/export');
  check('a suspended breeder\'s listings leave the export', !exp2.data.listings.some((x) => x.breeder_name === `E2E Kennel ${stamp}`));
  await admin.post(`/api/breeders/${breederId}/reinstate`, {});
  const exp3 = await admin.get('/api/export');
  check('reinstating brings them back', exp3.data.listings.filter((x) => x.breeder_name === `E2E Kennel ${stamp}`).length === 3);

  console.log(`\n${failures ? `${failures} failed` : 'all passed'}`);
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('e2e.mjs')) main().catch((e) => { console.error(e); process.exit(1); });
