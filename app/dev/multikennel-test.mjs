// Launch workplan A27, against the running local Workers: one person manages several kennels with
// one sign-in. One address on three kennels signs in once and chooses a kennel, each kennel shows
// only its own listings, a forged kennel is refused, Switch kennel, signing out of every kennel at
// once, an invitation to someone who already has a password, removing a person from one kennel,
// Make main contact with a shared sign-in, the authenticator across kennels, a person with one
// kennel seeing no chooser, and Manage as this breeder.
//
//   node app/dev/multikennel-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788 (or PORTAL and ADMIN) on current code, started from
// app/.state after node app/dev/setup.mjs --reset, with TOTP_KEY in portal/.dev.vars as the example
// has it. It writes to the local database directly only to clear failure counts and to step the
// authenticator's last-used code back, so one code a test can be used without waiting 30 seconds.

import { Client, signUp, signIn, mailLink, usePasswordLink, TEST_PASSWORD } from './e2e.mjs';
import { sql } from './launch-features-test.mjs';
import { totpCode, totpStep, unbase32 } from '../lib/accounts.js';

const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const OPERATOR = 'amber@puppyconnection.test';
const admin = new Client(ADMIN);
const FORM = { headers: { 'content-type': 'application/x-www-form-urlencoded' } };
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}
const stamp = Date.now().toString(36);
const addr = (tag) => `mk-${tag}-${stamp}@breeders.test`;
const audits = (action, entity) => sql(`SELECT actor_type, actor, entity_id, before_json, after_json FROM audit_log WHERE action = ${q(action)} AND entity_id = ${q(entity)} ORDER BY id`);
const tokenOf = (link) => (link ? new URL(link).searchParams.get('t') : '');

/** An approved kennel with one litter, signed in as its main contact. */
async function kennel(tag) {
  const email = addr(tag);
  const name = `Multi ${tag.toUpperCase()} Kennel ${stamp}`;
  const s = await signUp(email, name);
  const me = (await s.c.get('/api/me')).data;
  await s.c.put('/api/profile', { version: me.profile.version, business_name: name, public_phone: '555-0110', city: 'Goshen', state: 'IN' });
  await s.c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
  await admin.post(`/api/breeders/${me.id}/approve`, {});
  const breeds = (await s.c.get('/api/breeds')).data;
  const lit = await s.c.post('/api/litters', { breed_id: breeds[0].id, born_on: '2026-09-01' });
  return { ...s, email, name, id: me.id, litter: lit.data.id };
}

async function acceptPost(c, link, fields) {
  return c.req('POST', '/auth/set-password', new URLSearchParams({ t: tokenOf(link), ...fields }), FORM);
}
const litterIds = async (c) => ((await c.get('/api/listings')).data.litters || []).map((l) => l.id);
const choose = (c, id) => c.req('POST', '/choose', new URLSearchParams({ kennel: id }), FORM);

async function main() {
  // ---------------------------------------------------------------- three kennels, one network address
  const K1 = await kennel('one'), K2 = await kennel('two'), K3 = await kennel('three'), K9 = await kennel('nine');
  check('four approved kennels, each with a litter of its own', [K1, K2, K3, K9].every((k) => k.id && k.litter), JSON.stringify([K1, K2, K3, K9].map((k) => [k.id, k.litter])));
  const N = addr('network');

  // The admin adds the network address to K1. It is new, so the invitation sets a password.
  await admin.post(`/api/breeders/${K1.id}/people`, { email: N, name: 'Responsible Dog Breeder Network' });
  const inv1 = await mailLink(N, /invited to manage/);
  const N1 = new Client(PORTAL);
  const first = await usePasswordLink(N1, inv1);
  check('a new person sets a password from their first invitation and lands on that kennel', first.status === 303 && first.location === '/' && (await N1.get('/api/me')).data.id === K1.id, JSON.stringify(first));

  // The admin adds the same address to K2, and K3's main contact adds it in the portal.
  const addK2 = await admin.post(`/api/breeders/${K2.id}/people`, { email: N, name: 'Network' });
  check('the admin accepts an address that already belongs to another kennel', addK2.status === 200 && addK2.data.people.some((p) => p.email === N && p.awaiting && p.other_kennels === 1), JSON.stringify(addK2.data.people || addK2.data).slice(0, 300));
  const addK3 = await K3.c.post('/api/account/members', { email: N, name: 'Network' });
  check('the portal accepts it too', addK3.status === 200 && addK3.data.members.some((m) => m.email === N), JSON.stringify(addK3.data).slice(0, 300));
  check('adding twice to the same kennel is still refused', (await admin.post(`/api/breeders/${K2.id}/people`, { email: N })).status === 400);
  check('the adds are in the audit log, naming the person and the kennel', audits('member.add', K2.id).some((a) => JSON.parse(a.after_json).email === N && a.actor === OPERATOR)
    && audits('member.add', K3.id).some((a) => JSON.parse(a.after_json).email === N && a.actor === K3.email));

  const inv2 = await mailLink(N, new RegExp(`You can now manage ${K2.name}`));
  const inv3 = await mailLink(N, new RegExp(`You can now manage ${K3.name}`));
  const body2 = sql(`SELECT body FROM dev_mailbox WHERE to_addr = ${q(N)} AND subject LIKE ${q(`%${K2.name}%`)} ORDER BY id DESC LIMIT 1`)[0]?.body || '';
  check('each invitation names the kennel and asks for the current password, not a new one', !!inv2 && !!inv3 && body2.includes(K2.name) && /current password/.test(body2) && !/choose your password/i.test(body2), body2.slice(0, 300));
  check('the two invitations are both open, because a new one spends only the earlier one to the same kennel',
    sql(`SELECT COUNT(*) AS n FROM auth_tokens WHERE email = ${q(N)} AND purpose = 'invite' AND used_at IS NULL`)[0].n === 2);

  // Until the person confirms it, the kennel does not open for them.
  const before = await signIn(N);
  check('before confirming, the person still has one kennel and sees no chooser', before.r.status === 200 && !before.r.data.choose && (await before.c.get('/api/me')).data.id === K1.id);
  check('and a forged choice of the waiting kennel is refused', (await choose(before.c, K2.id)).status === 403 && (await before.c.get('/api/me')).data.id === K1.id);

  // The invitation page for a person who has a password asks for it and sets nothing new.
  const page2 = await new Client(PORTAL).get(`/auth/set-password?t=${encodeURIComponent(tokenOf(inv2))}`);
  check('the invitation page asks for the existing password and names the kennel', page2.status === 200 && /Your current password/.test(page2.data) && page2.data.includes(K2.name)
    && !/New password/.test(page2.data) && !/name="confirm"/.test(page2.data), String(page2.data).slice(0, 400));
  const wrong = await acceptPost(new Client(PORTAL), inv2, { password: 'not the password at all' });
  check('a wrong password is refused and counted', wrong.status === 400 && /not right/.test(wrong.data)
    && sql(`SELECT COUNT(*) AS n FROM signin_failures WHERE email = ${q(N)} AND kind = 'password'`)[0].n >= 1);
  const newPw = await acceptPost(new Client(PORTAL), inv2, { password: 'a brand new password', confirm: 'a brand new password' });
  check('the page cannot be used to set a new password', newPw.status === 400 && sql(`SELECT COUNT(*) AS n FROM auth_tokens WHERE email = ${q(N)} AND purpose = 'invite' AND used_at IS NULL`)[0].n === 2);
  const hashBefore = sql(`SELECT password_hash FROM credentials WHERE email = ${q(N)}`)[0].password_hash;
  const N2 = new Client(PORTAL);
  const acc2 = await acceptPost(N2, inv2, { password: TEST_PASSWORD });
  check('the existing password adds the kennel and signs the person in to it', acc2.status === 303 && (await N2.get('/api/me')).data.id === K2.id, JSON.stringify(acc2).slice(0, 300));
  check('the password is unchanged and there is still one set of credentials', sql(`SELECT password_hash FROM credentials WHERE email = ${q(N)}`)[0].password_hash === hashBefore
    && sql(`SELECT COUNT(*) AS n FROM credentials WHERE email = ${q(N)}`)[0].n === 1);
  check('the join is in the audit log, naming the person and the kennel', audits('member.join', K2.id).some((a) => a.actor === N && JSON.parse(a.after_json).confirmed_with === 'password'));
  check('the invitation works once', (await acceptPost(new Client(PORTAL), inv2, { password: TEST_PASSWORD })).status === 400);
  const acc3 = await acceptPost(new Client(PORTAL), inv3, { password: TEST_PASSWORD });
  check('the second invitation adds the third kennel the same way', acc3.status === 303);
  sql(`DELETE FROM signin_failures WHERE email = ${q(N)}`);

  // ---------------------------------------------------------------- one sign-in, Choose a kennel
  const S = await signIn(N);
  check('one address on three kennels signs in once and is sent to Choose a kennel', S.r.status === 200 && S.r.data.choose === '/choose' && !!S.c.cookie, JSON.stringify(S.r.data));
  const pending = await S.c.get('/api/me');
  check('until a kennel is picked, the portal answers with the way to the chooser', pending.status === 409 && pending.data.choose === '/choose', JSON.stringify(pending));
  check('and no kennel route works', (await S.c.get('/api/listings')).status === 409 && (await S.c.post('/api/litters', { breed_id: 'breed-havanese' })).status === 409);
  const list = await S.c.get('/choose');
  const names = [K1, K2, K3].map((k) => k.name);
  check('the chooser lists each kennel by business name, and no other', list.status === 200 && names.every((n) => list.data.includes(n)) && !list.data.includes(K9.name)
    && (list.data.match(/class="kennel-pick/g) || []).length === 3, String(list.data).slice(0, 300));
  check('in business-name order', names.slice().sort((a, b) => a.localeCompare(b)).every((n, i, a) => i === 0 || list.data.indexOf(a[i - 1]) < list.data.indexOf(n)));

  const own = {};
  for (const k of [K1, K2, K3]) {
    const r = await choose(S.c, k.id);
    const me = (await S.c.get('/api/me')).data;
    own[k.id] = await litterIds(S.c);
    check(`picking ${k.name} opens it`, r.status === 303 && r.location === '/' && me.id === k.id && me.kennel_count === 3 && me.signed_in_as === N, JSON.stringify(me).slice(0, 200));
    check(`and shows only its own listings`, own[k.id].length === 1 && own[k.id][0] === k.litter, JSON.stringify(own[k.id]));
  }
  check('picking and switching are in the audit log, naming the person and the kennel', audits('session.kennel_open', K1.id).some((a) => a.actor === N)
    && audits('session.kennel_switch', K2.id).some((a) => a.actor === N && JSON.parse(a.before_json).kennel === K1.id)
    && audits('session.kennel_switch', K3.id).some((a) => a.actor === N && JSON.parse(a.before_json).kennel === K2.id));

  // ---------------------------------------------------------------- forged requests
  const forged = await choose(S.c, K9.id);
  check('a forged choice of a kennel the person is not on is refused', forged.status === 403 && (await S.c.get('/api/me')).data.id === K3.id);
  const stranger = new Client(PORTAL);
  const viaJson = await S.c.req('POST', '/choose', { kennel: K9.id });
  check('a forged choice sent as JSON is refused too', viaJson.status >= 400 && (await S.c.get('/api/me')).data.id === K3.id, JSON.stringify(viaJson).slice(0, 200));
  const cross = await S.c.put(`/api/litters/${K1.litter}`, { born_on: '2026-09-02' });
  check('on one kennel, a request for another of their own kennels’ litters is refused', cross.status === 404 || cross.status === 403, JSON.stringify(cross));
  const crossOther = await S.c.put(`/api/litters/${K9.litter}`, { born_on: '2026-09-02' });
  check('and so is one for a kennel they are not on', crossOther.status === 404 || crossOther.status === 403);
  check('a choice with no session goes to sign in', (await choose(stranger, K1.id)).status === 303 && (await stranger.get('/api/me')).status === 401);
  const crossSite = await S.c.req('POST', '/choose', new URLSearchParams({ kennel: K1.id }), { headers: { ...FORM.headers, origin: 'https://evil.example' } });
  check('a choice posted from another site is refused', crossSite.status === 403 && (await S.c.get('/api/me')).data.id === K3.id);

  // ---------------------------------------------------------------- Switch kennel
  const portalJs = await S.c.get('/portal.js');
  check('the portal header has Switch kennel for a person on more than one kennel', /id="switch-kennel" href="\/choose">Switch kennel</.test(portalJs.data) && /me\.kennel_count > 1/.test(portalJs.data));
  const back = await S.c.get('/choose');
  check('Switch kennel returns to the list, marking the kennel open now', back.status === 200 && /class="kennel-pick is-here"/.test(back.data) && /Open now/.test(back.data));
  await choose(S.c, K1.id);
  check('switching works', (await S.c.get('/api/me')).data.id === K1.id && (await litterIds(S.c))[0] === K1.litter);

  // ---------------------------------------------------------------- signing out ends every kennel
  const other = await signIn(N);
  await choose(other.c, K2.id);
  const out = await S.c.post('/auth/signout');
  const after = await Promise.all([K1, K2, K3].map(async (k) => { const r = await choose(S.c, k.id); return [r.status, (await S.c.get('/api/me')).status]; }));
  check('signing out ends the session on every kennel at once', out.status === 200 && after.every(([a, b]) => a === 303 && b === 401), JSON.stringify(after));
  check('the chooser goes back to sign in once signed out', (await S.c.get('/choose')).status === 303);
  check('a session in another browser carries on', (await other.c.get('/api/me')).data.id === K2.id);
  const formOut = await other.c.req('POST', '/auth/signout', new URLSearchParams({}), FORM);
  check('the Sign out button on the chooser signs out and returns to the sign-in page', formOut.status === 303 && formOut.location === '/' && (await other.c.get('/api/me')).status === 401);

  // ---------------------------------------------------------------- one kennel, no chooser
  const solo = await signIn(K9.email);
  const soloMe = await solo.c.get('/api/me');
  check('a person with one kennel signs in exactly as before, with no chooser', solo.r.status === 200 && !('choose' in solo.r.data && solo.r.data.choose) && soloMe.status === 200 && soloMe.data.id === K9.id && soloMe.data.kennel_count === 1);
  check('their chooser lists just their own kennel', (await solo.c.get('/choose')).data.match(/class="kennel-pick/g)?.length === 1);
  check('and they cannot choose someone else’s kennel', (await choose(solo.c, K1.id)).status === 403 && (await solo.c.get('/api/me')).data.id === K9.id);

  // ---------------------------------------------------------------- the authenticator across kennels
  const A = await signIn(N);
  await choose(A.c, K1.id);
  const start = (await A.c.post('/api/account/authenticator')).data;
  const secret = unbase32(start.secret.replace(/\s/g, ''));
  const conf = await A.c.post('/api/account/authenticator/confirm', { code: await totpCode(secret, totpStep()) });
  check('the person turns the authenticator on while on one kennel', conf.status === 200 && conf.data.recovery_codes.length === 10);
  const back1 = () => sql(`UPDATE credentials SET totp_last_step = ${totpStep() - 2} WHERE email = ${q(N)}`);
  await choose(A.c, K3.id);
  const onK3 = (await A.c.get('/api/account')).data;
  check('it shows as on for the same person on every kennel', onK3.security.authenticator === true && sql(`SELECT COUNT(*) AS n FROM recovery_codes WHERE email = ${q(N)}`)[0].n === 10);
  await A.c.post('/auth/signout');
  back1();
  const T = await signIn(N);
  const tc = await T.c.post('/auth/totp', { ticket: T.r.data.ticket, code: await totpCode(secret, totpStep()) });
  check('the next sign-in asks for the code once and then goes to Choose a kennel', T.r.data.need_code === true && tc.status === 200 && tc.data.choose === '/choose', JSON.stringify(tc.data));
  check('and each kennel opens without asking again', (await choose(T.c, K2.id)).status === 303 && (await T.c.get('/api/me')).data.id === K2.id
    && (await choose(T.c, K3.id)).status === 303 && (await T.c.get('/api/me')).data.id === K3.id);

  // An invitation to a person with an authenticator asks for its code instead of the password.
  const K4 = await kennel('four');
  await admin.post(`/api/breeders/${K4.id}/people`, { email: N });
  const inv4 = await mailLink(N, new RegExp(`You can now manage ${K4.name}`));
  const page4 = await new Client(PORTAL).get(`/auth/set-password?t=${encodeURIComponent(tokenOf(inv4))}`);
  check('for a person with an authenticator, the invitation asks for its code', /Code from your authenticator app/.test(page4.data) && !/Your current password/.test(page4.data));
  check('a password alone does not add the kennel then', (await acceptPost(new Client(PORTAL), inv4, { password: TEST_PASSWORD })).status === 400);
  back1();
  const N4 = new Client(PORTAL);
  const acc4 = await acceptPost(N4, inv4, { code: await totpCode(secret, totpStep()) });
  check('the authenticator code adds it and signs in to it', acc4.status === 303 && (await N4.get('/api/me')).data.id === K4.id
    && audits('member.join', K4.id).some((a) => JSON.parse(a.after_json).confirmed_with === 'authenticator'));
  sql(`DELETE FROM signin_failures WHERE email = ${q(N)}`);

  // ---------------------------------------------------------------- Make main contact with a shared sign-in
  const nOnK1 = (await admin.get(`/api/breeders/${K1.id}`)).data.people.find((p) => p.email === N);
  const mm = await admin.post(`/api/breeders/${K1.id}/people/main`, { member_id: nOnK1.member_id, old: 'keep' });
  check('Make main contact works for a person who is also on other kennels', mm.status === 200 && sql(`SELECT email FROM breeders WHERE id = ${q(K1.id)}`)[0].email === N);
  const nOnK2 = (await admin.get(`/api/breeders/${K2.id}`)).data.people.find((p) => p.email === N);
  const mm2 = await admin.post(`/api/breeders/${K2.id}/people/main`, { member_id: nOnK2.member_id, old: 'keep' });
  check('but a person can be the main contact of one kennel only', mm2.status === 400 && /main contact of one kennel only/.test(mm2.data.error), JSON.stringify(mm2.data));
  const K2own = (await K2.c.get('/api/account')).data.members.find((m) => m.email === N);
  check('and the portal says the same', (await K2.c.post(`/api/account/members/${K2own.id}/main`, { keep_old: true })).status === 400);
  // K1's old main contact stays on as a person, and N signs in to K1 now as its main contact.
  check('the old main contact of K1 keeps signing in', (await K1.c.get('/api/me')).data.id === K1.id);

  // ---------------------------------------------------------------- removing a person from one kennel
  const R1 = await signIn(N), R2 = await signIn(N), R3 = await signIn(N);
  back1();
  for (const r of [R1, R2, R3]) await r.c.post('/auth/totp', { ticket: r.r.data.ticket, code: await totpCode(secret, totpStep() - 1 + [R1, R2, R3].indexOf(r)) });
  await choose(R1.c, K1.id); await choose(R2.c, K2.id); await choose(R3.c, K3.id);
  check('three browsers, one on each kennel', (await R1.c.get('/api/me')).data.id === K1.id && (await R2.c.get('/api/me')).data.id === K2.id && (await R3.c.get('/api/me')).data.id === K3.id);
  const nK2 = (await admin.get(`/api/breeders/${K2.id}`)).data.people.find((p) => p.email === N);
  const rm = await admin.req('DELETE', `/api/breeders/${K2.id}/people/${nK2.member_id}`);
  check('removing the person from one kennel ends only their session on it', rm.status === 200 && (await R2.c.get('/api/me')).status === 401
    && (await R1.c.get('/api/me')).data.id === K1.id && (await R3.c.get('/api/me')).data.id === K3.id);
  check('their password and authenticator stay, because they are on other kennels', sql(`SELECT COUNT(*) AS n FROM credentials WHERE email = ${q(N)} AND password_hash IS NOT NULL AND totp_enabled_at IS NOT NULL`)[0].n === 1);
  check('the removal is in the audit log, naming the person and the kennel', audits('member.remove', K2.id).some((a) => JSON.parse(a.before_json).email === N && a.actor === OPERATOR));
  const listAfter = await R1.c.get('/choose');
  check('the chooser no longer lists that kennel', !listAfter.data.includes(K2.name) && listAfter.data.includes(K3.name));
  check('and the kennel can no longer be chosen', (await choose(R1.c, K2.id)).status === 403);
  const k3member = (await K3.c.get('/api/account')).data.members.find((m) => m.email === N);
  await K3.c.req('DELETE', `/api/account/members/${k3member.id}`);
  check('removing them in the portal works the same way', (await R3.c.get('/api/me')).status === 401 && (await R1.c.get('/api/me')).data.id === K1.id && (await R1.c.get('/api/me')).data.kennel_count === 2);
  check('a person with their password still signs in to what is left', (await signIn(N)).r.status === 200);

  // A person on one kennel only is removed exactly as before, password and all.
  const solo2 = addr('solo2');
  await admin.post(`/api/breeders/${K9.id}/people`, { email: solo2 });
  await usePasswordLink(new Client(PORTAL), await mailLink(solo2, /invited to manage/));
  const s2 = (await admin.get(`/api/breeders/${K9.id}`)).data.people.find((p) => p.email === solo2);
  await admin.req('DELETE', `/api/breeders/${K9.id}/people/${s2.member_id}`);
  check('removing a person from their only kennel still removes their password, as before', sql(`SELECT COUNT(*) AS n FROM credentials WHERE email = ${q(solo2)}`)[0].n === 0
    && (await signIn(solo2)).r.status === 400);

  // ---------------------------------------------------------------- Manage as this breeder
  await K4.c.put('/api/account/access', { on: true });
  const mint = await admin.post(`/api/breeders/${K4.id}/manage`, {});
  const op = new Client(PORTAL);
  const land = await op.get(new URL(mint.data.url).pathname + new URL(mint.data.url).search);
  const opMe = (await op.get('/api/me')).data;
  check('Manage as this breeder still opens the kennel with the operator banner', land.status === 303 && opMe.id === K4.id && opMe.operator?.email === OPERATOR && opMe.kennel_count === 1, JSON.stringify(opMe).slice(0, 200));
  check('an operator session has no chooser and cannot switch kennel', (await op.get('/choose')).status === 303 && (await choose(op, K1.id)).status === 403 && (await op.get('/api/me')).data.id === K4.id);
  const lit = await op.post('/api/litters', { breed_id: (await op.get('/api/breeds')).data[0].id, born_on: '2026-09-03' });
  const actor = sql(`SELECT actor_type, actor FROM audit_log WHERE action = 'litter.create' AND entity_id = ${q(lit.data.id)}`)[0];
  check('and the audit log names the operator acting for the kennel', lit.status === 201 && actor.actor_type === 'operator' && actor.actor === `${OPERATOR} acting for ${K4.name}`, JSON.stringify(actor));
  await op.post('/auth/signout');

  // A person's own writes on a kennel are recorded as that person, not as the kennel's main email.
  const W = await signIn(N);
  back1();
  await W.c.post('/auth/totp', { ticket: W.r.data.ticket, code: await totpCode(secret, totpStep()) });
  await choose(W.c, K4.id);
  const wl = await W.c.post('/api/litters', { breed_id: (await W.c.get('/api/breeds')).data[0].id, born_on: '2026-09-04' });
  check('a write by the person is recorded as them', sql(`SELECT actor FROM audit_log WHERE action = 'litter.create' AND entity_id = ${q(wl.data.id)}`)[0]?.actor === N);

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
