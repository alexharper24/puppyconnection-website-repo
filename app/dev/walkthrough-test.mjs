// The breeder walkthrough (Alex, 2026-11-01, migrations/0087), against the running local Workers. It
// opens by itself the first time a person is in an approved kennel, as its main contact or as someone
// managing it, and once closed it stays closed for that person on that kennel. A pending kennel, an
// operator session and another site's request get nothing, and a person removed and added back sees it again.
//
//   node app/dev/walkthrough-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788 (or PORTAL and ADMIN) on current code, started from
// app/.state after node app/dev/setup.mjs --reset. It reads the local database only to count rows.

import fs from 'node:fs';
import { Client, signUp, signIn, mailLink, usePasswordLink } from './e2e.mjs';
import { sql } from './launch-features-test.mjs';

const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const admin = new Client(ADMIN);
const FORM = { headers: { 'content-type': 'application/x-www-form-urlencoded' } };
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}
const stamp = Date.now().toString(36);
const addr = (tag) => `wt-${tag}-${stamp}@breeders.test`;
const flag = async (c) => (await c.get('/api/me')).data.walkthrough;
const seenRows = (email) => sql(`SELECT breeder_id FROM walkthrough_seen WHERE email = ${q(email)} ORDER BY breeder_id`).map((r) => r.breeder_id);
const choose = (c, id) => c.req('POST', '/choose', new URLSearchParams({ kennel: id }), FORM);

/** A kennel signed in as its main contact, submitted and, unless asked not to, approved. */
async function kennel(tag, { approve = true } = {}) {
  const email = addr(tag);
  const name = `Walkthrough ${tag.toUpperCase()} Kennel ${stamp}`;
  const s = await signUp(email, name);
  const me = (await s.c.get('/api/me')).data;
  await s.c.put('/api/profile', { version: me.profile.version, business_name: name, public_phone: '555-0110', city: 'Goshen', state: 'IN' });
  await s.c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
  return { ...s, email, name, id: me.id, before: me.walkthrough, approved: approve ? (await admin.post(`/api/breeders/${me.id}/approve`, {})).status : null };
}

async function main() {
  // ---------------------------------------------------------------- the main contact
  const A = await kennel('a');
  check('a kennel waiting for approval does not open the walkthrough', A.before === false, String(A.before));
  check('once approved, the main contact\'s next visit opens it', A.approved === 200 && (await flag(A.c)) === true);
  check('the portal serves the walkthrough files', (await new Client(PORTAL).get('/walkthrough.js')).status === 200 && (await new Client(PORTAL).get('/walkthrough.css')).status === 200);

  const foreign = await A.c.req('POST', '/api/walkthrough/seen', {}, { headers: { origin: 'https://example.com' } });
  check('a request from another site cannot mark it seen', foreign.status === 403 && (await flag(A.c)) === true && seenRows(A.email).length === 0, JSON.stringify(foreign));

  const seen = await A.c.post('/api/walkthrough/seen');
  check('closing it is recorded and it no longer opens by itself', seen.status === 200 && (await flag(A.c)) === false && seenRows(A.email).join() === A.id);
  await A.c.post('/api/walkthrough/seen');
  check('closing it again changes nothing', seenRows(A.email).length === 1);
  const again = await signIn(A.email);
  check('signing in again does not open it', again.r.status === 200 && (await flag(again.c)) === false);

  // ---------------------------------------------------------------- a new manager on an approved kennel
  const M = addr('manager');
  await admin.post(`/api/breeders/${A.id}/people`, { email: M, name: 'New Manager' });
  const MC = new Client(PORTAL);
  const joined = await usePasswordLink(MC, await mailLink(M, /invited to manage/));
  check('a new manager\'s first visit to the approved kennel opens it', joined.status === 303 && (await MC.get('/api/me')).data.id === A.id && (await flag(MC)) === true, JSON.stringify(joined));
  check('while the main contact still sees it closed', (await flag(A.c)) === false);
  await MC.post('/api/walkthrough/seen');
  check('the manager closing it closes it for them alone', (await flag(MC)) === false && seenRows(M).join() === A.id && seenRows(A.email).join() === A.id);

  // ---------------------------------------------------------------- the same person on a second kennel
  const B = await kennel('b');
  await B.c.post('/api/walkthrough/seen');
  const add = await admin.post(`/api/breeders/${B.id}/people`, { email: M, name: 'New Manager' });
  const MB = (await signIn(M)).c;
  const picked = await choose(MB, B.id);
  check('the same person opening a second approved kennel for the first time sees it there',
    add.status === 200 && picked.status === 303 && (await MB.get('/api/me')).data.id === B.id && (await flag(MB)) === true, JSON.stringify([add.status, picked.status]));
  await MB.post('/api/walkthrough/seen');
  await choose(MB, A.id);
  check('and still not on the kennel where they closed it', (await flag(MB)) === false && seenRows(M).length === 2);

  // ---------------------------------------------------------------- removed and added back
  const member = (await A.c.get('/api/account')).data.members.find((m) => m.email === M);
  const removed = await A.c.req('DELETE', `/api/account/members/${member.id}`);
  check('removing the person clears their record on that kennel only', removed.status === 200 && seenRows(M).join() === B.id, JSON.stringify(seenRows(M)));
  await admin.post(`/api/breeders/${A.id}/people`, { email: M, name: 'New Manager' });
  const MA = (await signIn(M)).c;
  await choose(MA, A.id);
  check('added back, they are new to the kennel and see it again', (await MA.get('/api/me')).data.id === A.id && (await flag(MA)) === true);

  // ---------------------------------------------------------------- a helper on a kennel still waiting
  const P = await kennel('p', { approve: false });
  check('a pending kennel\'s main contact is not shown it', (await flag(P.c)) === false);

  // ---------------------------------------------------------------- Manage as this breeder
  const C = await kennel('c');
  await C.c.put('/api/account/access', { on: true });
  const mint = await admin.post(`/api/breeders/${C.id}/manage`, {});
  const op = new Client(PORTAL);
  await op.get(new URL(mint.data.url).pathname + new URL(mint.data.url).search);
  const opMe = (await op.get('/api/me')).data;
  const opSeen = await op.post('/api/walkthrough/seen');
  check('an operator managing the kennel is not shown it and cannot close it for the breeder',
    opMe.id === C.id && !!opMe.operator && opMe.walkthrough === false && opSeen.status === 403 && (await flag(C.c)) === true, JSON.stringify([opMe.walkthrough, opSeen.status]));

  // ---------------------------------------------------------------- the panel in the portal
  const js = fs.readFileSync(new URL('../portal/public/portal.js', import.meta.url), 'utf8');
  check('the portal opens the panel from the flag, and Help and the Overview offer it', /state\.me\.walkthrough && !tourAuto/.test(js) && (js.match(/data-tour>/g) || []).length >= 2);

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
