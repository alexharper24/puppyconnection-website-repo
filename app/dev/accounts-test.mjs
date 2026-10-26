// Launch workplan A24 to A26, against the running local Workers: password sign-in and its limits,
// the authenticator and recovery codes, password links with and without the authenticator,
// emailed codes switched off, invitations, Make main contact, removing a person, and Manage as
// this breeder with its hand-over, banner, audit and access switch.
//
//   node app/dev/accounts-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788 (or PORTAL and ADMIN) on current code, started from
// app/.state after node app/dev/setup.mjs --reset, with TOTP_KEY in portal/.dev.vars as the example
// has it. It writes to the local database directly to age links and to clear its own failure counts.

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
const addr = (tag) => `acct-${tag}-${stamp}@breeders.test`;
const secretOf = (spaced) => unbase32(spaced.replace(/\s/g, ''));

async function breeder(tag) {
  const email = addr(tag);
  const s = await signUp(email, `Accounts Kennel ${tag} ${stamp}`);
  const me = (await s.c.get('/api/me')).data;
  return { ...s, email, id: me.id };
}

async function enroll(c) {
  const start = (await c.post('/api/account/authenticator')).data;
  const secret = secretOf(start.secret);
  const confirm = await c.post('/api/account/authenticator/confirm', { code: await totpCode(secret, totpStep()) });
  return { start, secret, confirm };
}

async function main() {
  // ---------------------------------------------------------------- sign-up, password, emailed codes off
  const A = await breeder('a');
  check('sign-up sets a password from the emailed link and signs in', A.verify.status === 303 && (await A.c.get('/api/me')).status === 200, JSON.stringify(A.verify));
  const credA = sql(`SELECT * FROM credentials WHERE email = ${q(A.email)}`)[0];
  check('the password is stored as PBKDF2-SHA256 with its iteration count and a salt', /^pbkdf2-sha256\$100000\$[A-Za-z0-9+/=]{24}\$[A-Za-z0-9+/=]{44}$/.test(credA?.password_hash || ''), credA?.password_hash);
  const weak = await usePasswordLink(new Client(PORTAL), await mailLink(A.email), 'short');
  check('a used link cannot set a password again', weak.status === 400);

  const ok = await signIn(A.email);
  check('a right password signs in', ok.r.status === 200 && ok.r.data.ok === true && !!ok.c.cookie);
  const wrong = await signIn(A.email, 'not the password at all');
  check('a wrong password is refused with the plain message', wrong.r.status === 400 && /do not match/.test(wrong.r.data.error), JSON.stringify(wrong.r.data));
  const stranger = await signIn(`nobody-${stamp}@breeders.test`, 'whatever it is');
  check('an unknown address gets the same answer', stranger.r.status === 400 && stranger.r.data.error === wrong.r.data.error);

  const code = await new Client(PORTAL).post('/auth/start', { email: A.email });
  const codeIn = await new Client(PORTAL).post('/auth/code', { code: '123456' });
  const oldLink = await new Client(PORTAL).req('POST', '/auth/verify', new URLSearchParams({ t: 'anything' }), FORM);
  check('emailed sign-in codes and links no longer work', code.status === 410 && codeIn.status === 410 && oldLink.status === 410 && !/pc_session=[^;]/.test(JSON.stringify(oldLink)), `${code.status} ${codeIn.status} ${oldLink.status}`);
  const mailsBefore = sql(`SELECT COUNT(*) AS n FROM dev_mailbox WHERE to_addr = ${q(A.email)}`)[0].n;
  await new Client(PORTAL).post('/auth/start', { email: A.email });
  check('asking for an emailed code sends no email', sql(`SELECT COUNT(*) AS n FROM dev_mailbox WHERE to_addr = ${q(A.email)}`)[0].n === mailsBefore);

  // ---------------------------------------------------------------- rate limits
  const R = await breeder('r');
  sql(`DELETE FROM signin_failures WHERE email = ${q(R.email)}`);
  let last;
  for (let i = 0; i < 10; i += 1) last = await signIn(R.email, `wrong ${i} wrong wrong`);
  const locked = await signIn(R.email);
  check('ten wrong passwords lock the address, even for the right one', last.r.status === 400 && locked.r.status === 429 && /15 minutes/.test(locked.r.data.error), JSON.stringify(locked.r.data));
  const ipRow = sql(`SELECT ip FROM signin_failures WHERE email = ${q(R.email)} LIMIT 1`)[0];
  sql(`DELETE FROM signin_failures WHERE email = ${q(R.email)}`);
  check('the right password works again once the count is cleared', (await signIn(R.email)).r.status === 200);
  sql(`INSERT INTO signin_failures (email, ip, kind, at) SELECT 'filler-' || value || '@breeders.test', ${q(ipRow.ip)}, 'password', strftime('%Y-%m-%dT%H:%M:%SZ','now') FROM json_each('[${Array.from({ length: 100 }, (_, i) => i).join(',')}]')`);
  const ipLocked = await signIn(A.email);
  check('a hundred failures from one network address lock every address from it', ipLocked.r.status === 429, JSON.stringify(ipLocked.r.data));
  sql("DELETE FROM signin_failures WHERE email LIKE 'filler-%'");
  check('and lift when they age out', (await signIn(A.email)).r.status === 200);

  // ---------------------------------------------------------------- authenticator
  const meBefore = (await A.c.get('/api/me')).data;
  check('the portal recommends an authenticator to a person without one', meBefore.authenticator_nudge === true);
  const start = (await A.c.post('/api/account/authenticator')).data;
  check('set-up gives a key and an otpauth address for the QR code', /^[A-Z2-7 ]{32,}$/.test(start.secret) && /^otpauth:\/\/totp\/Puppy%20Connection%3A.+secret=[A-Z2-7]+&issuer=Puppy%20Connection&algorithm=SHA1&digits=6&period=30$/.test(start.uri), JSON.stringify(start));
  const secret = secretOf(start.secret);
  const badConfirm = await A.c.post('/api/account/authenticator/confirm', { code: '000000' });
  check('a wrong code does not turn it on', badConfirm.status === 400 && !sql(`SELECT totp_enabled_at FROM credentials WHERE email = ${q(A.email)}`)[0].totp_enabled_at);
  const conf = await A.c.post('/api/account/authenticator/confirm', { code: await totpCode(secret) });
  check('one right code turns it on and hands back ten recovery codes', conf.status === 200 && conf.data.recovery_codes.length === 10 && conf.data.recovery_codes.every((x) => /^[a-z2-7]{4}-[a-z2-7]{4}$/.test(x)), JSON.stringify(conf.data));
  const stored = sql(`SELECT totp_secret FROM credentials WHERE email = ${q(A.email)}`)[0].totp_secret;
  const rc = sql(`SELECT code_hash FROM recovery_codes WHERE email = ${q(A.email)}`);
  check('the secret is sealed under TOTP_KEY and the recovery codes are stored hashed', /^v1:/.test(stored) && rc.length === 10 && rc.every((r) => /^[0-9a-f]{64}$/.test(r.code_hash) && !conf.data.recovery_codes.includes(r.code_hash)));
  check('the recommendation stops once it is on', (await A.c.get('/api/me')).data.authenticator_nudge === false);

  const step1 = await signIn(A.email);
  check('a right password now asks for the code', step1.r.status === 200 && step1.r.data.need_code === true && !!step1.r.data.ticket && !step1.c.cookie, JSON.stringify(step1.r.data));
  const wrongCode = await step1.c.post('/auth/totp', { ticket: step1.r.data.ticket, code: '000000' });
  check('a wrong code is refused', wrongCode.status === 400 && !step1.c.cookie);
  // The step confirmed at set-up is spent, so the next one (allowed as one step of drift) signs in.
  const next = await totpCode(secret, totpStep() + 1);
  const rightCode = await step1.c.post('/auth/totp', { ticket: step1.r.data.ticket, code: next });
  check('the code from the app signs in', rightCode.status === 200 && !!step1.c.cookie && (await step1.c.get('/api/me')).status === 200, JSON.stringify(rightCode.data));
  const reused = await step1.c.post('/auth/totp', { ticket: step1.r.data.ticket, code: next });
  check('the ticket works once', reused.status === 400);
  const step2 = await signIn(A.email);
  const replay = await step2.c.post('/auth/totp', { ticket: step2.r.data.ticket, code: next });
  check('the same code cannot sign in twice', replay.status === 400, JSON.stringify(replay.data));
  const recovery = conf.data.recovery_codes[0];
  const viaRecovery = await step2.c.post('/auth/totp', { ticket: step2.r.data.ticket, code: recovery.toUpperCase() });
  check('a recovery code signs in, and says how many are left', viaRecovery.status === 200 && viaRecovery.data.recovery_left === 9, JSON.stringify(viaRecovery.data));
  const step3 = await signIn(A.email);
  const recoveryAgain = await step3.c.post('/auth/totp', { ticket: step3.r.data.ticket, code: recovery });
  check('a recovery code works once', recoveryAgain.status === 400);
  for (let i = 0; i < 4; i += 1) await step3.c.post('/auth/totp', { ticket: step3.r.data.ticket, code: '111111' });
  const spent = await step3.c.post('/auth/totp', { ticket: step3.r.data.ticket, code: conf.data.recovery_codes[1] });
  check('five wrong codes spend the ticket', spent.status === 400 && /took too long/.test(spent.data.error), JSON.stringify(spent.data));
  sql(`DELETE FROM signin_failures WHERE email = ${q(A.email)}`);

  // ---------------------------------------------------------------- password reset by email
  const B = await breeder('b');
  const otherB = await signIn(B.email);
  const forgot = await new Client(PORTAL).post('/auth/forgot', { email: B.email });
  const resetLink = await mailLink(B.email, /Set your Puppy Connection password/);
  check('Forgot password answers neutrally and emails a link', forgot.status === 200 && /If that address/.test(forgot.data.message) && !!resetLink);
  const unknown = await new Client(PORTAL).post('/auth/forgot', { email: `nobody-${stamp}@breeders.test` });
  check('an unknown address gets the same answer and no email', unknown.data.message === forgot.data.message
    && sql(`SELECT COUNT(*) AS n FROM dev_mailbox WHERE to_addr = ${q(`nobody-${stamp}@breeders.test`)}`)[0].n === 0);
  const page = await new Client(PORTAL).get(new URL(resetLink).pathname + new URL(resetLink).search);
  check('the reset page asks for no code when there is no authenticator', page.status === 200 && !/authenticator app/.test(page.data));
  const mismatch = await new Client(PORTAL).req('POST', '/auth/set-password', new URLSearchParams({ t: new URL(resetLink).searchParams.get('t'), password: 'a new long password', confirm: 'something else entirely' }), FORM);
  check('two different passwords are refused and the link still works', mismatch.status === 400 && /not the same/.test(mismatch.data));
  const resetC = new Client(PORTAL);
  const reset = await usePasswordLink(resetC, resetLink, 'a brand new password');
  check('the reset sets the new password and signs in', reset.status === 303 && (await resetC.get('/api/me')).status === 200);
  check('the old password stops working and the new one works', (await signIn(B.email)).r.status === 400 && (await signIn(B.email, 'a brand new password')).r.status === 200);
  check('the reset signs out the other sessions of that person', (await otherB.c.get('/api/me')).status === 401);
  const expiredReset = await new Client(PORTAL).post('/auth/forgot', { email: B.email });
  const late = await mailLink(B.email, /Set your Puppy Connection password/);
  sql(`UPDATE auth_tokens SET expires_at = '2000-01-01T00:00:00Z' WHERE token_hash IN (SELECT token_hash FROM auth_tokens WHERE email = ${q(B.email)} AND purpose = 'reset' AND used_at IS NULL)`);
  check('a reset link stops working after its hour', expiredReset.status === 200 && (await new Client(PORTAL).get(new URL(late).pathname + new URL(late).search)).status === 400);

  await new Client(PORTAL).post('/auth/forgot', { email: A.email });
  const aLink = await mailLink(A.email, /Set your Puppy Connection password/);
  const aPage = await new Client(PORTAL).get(new URL(aLink).pathname + new URL(aLink).search);
  check('with an authenticator the reset page asks for the code', /authenticator app/.test(aPage.data));
  const noCode = await usePasswordLink(new Client(PORTAL), aLink, 'another long password');
  check('a reset without the code is refused and the link still works', noCode.status === 400 && /not right/.test(noCode.data));
  const aReset = new Client(PORTAL);
  const withCode = await usePasswordLink(aReset, aLink, 'another long password', { code: conf.data.recovery_codes[2] });
  check('a reset with a recovery code goes through', withCode.status === 303 && (await aReset.get('/api/me')).status === 200);

  // ---------------------------------------------------------------- admin reset of the authenticator
  const resetAuth = await admin.post(`/api/breeders/${A.id}/people/reset-authenticator`, { email: A.email });
  const after = sql(`SELECT totp_enabled_at, totp_secret FROM credentials WHERE email = ${q(A.email)}`)[0];
  const audit = sql(`SELECT actor FROM audit_log WHERE action = 'account.authenticator_reset' AND entity_id = ${q(A.id)}`);
  check('the admin resets an authenticator, and it is logged under the operator', resetAuth.status === 200 && !after.totp_enabled_at && !after.totp_secret
    && sql(`SELECT COUNT(*) AS n FROM recovery_codes WHERE email = ${q(A.email)}`)[0].n === 0 && audit[0]?.actor === OPERATOR, JSON.stringify(resetAuth.data).slice(0, 200));
  check('after the reset the password alone signs in again', (await signIn(A.email, 'another long password')).r.data.ok === true);

  // ---------------------------------------------------------------- invitations and people
  const P1 = addr('p1'), P2 = addr('p2');
  const added = await admin.post(`/api/breeders/${B.id}/people`, { email: P1, name: 'Pat One' });
  const inv1 = await mailLink(P1, /invited to manage/);
  check('the admin adds a person and sends an invitation', added.status === 200 && added.data.people.some((p) => p.email === P1 && p.invite_open_until) && !!inv1, JSON.stringify(added.data.people || added.data));
  const invRow = sql(`SELECT expires_at, created_at FROM auth_tokens WHERE email = ${q(P1)} AND purpose = 'invite'`)[0];
  check('an invitation lasts 7 days', Math.round((Date.parse(invRow.expires_at) - Date.parse(invRow.created_at)) / 86400000) === 7);
  // Workplan A27 (Alex, 2026-10-25). An address with its own account can now be added. It waits for
  // that person to confirm from their invitation, and multikennel-test.mjs covers the rest.
  const dupe = await admin.post(`/api/breeders/${B.id}/people`, { email: A.email, invite: false });
  const dupeRow = dupe.status === 200 && dupe.data.people.find((p) => p.email === A.email);
  check('an address with its own account is added, waiting for that person to confirm', !!dupeRow && dupeRow.awaiting === true && dupeRow.other_kennels === 1, JSON.stringify(dupe.data).slice(0, 300));
  if (dupeRow) await admin.req('DELETE', `/api/breeders/${B.id}/people/${dupeRow.member_id}`);
  check('and removing it again leaves that person signing in to their own kennel', (await signIn(A.email, 'another long password')).r.data.ok === true);
  await admin.post(`/api/breeders/${B.id}/people/invite`, { email: P1 });
  const inv2 = await mailLink(P1, /invited to manage/);
  check('sending again makes a new link and the earlier one stops working', inv2 !== inv1 && (await usePasswordLink(new Client(PORTAL), inv1)).status === 400);
  const P1c = new Client(PORTAL);
  const joined = await usePasswordLink(P1c, inv2);
  const p1me = (await P1c.get('/api/me')).data;
  check('the invitation link signs the person in to that kennel', joined.status === 303 && p1me.id === B.id);
  check('the invitation link works once', (await usePasswordLink(new Client(PORTAL), inv2)).status === 400);
  await admin.post(`/api/breeders/${B.id}/people`, { email: P2, name: 'Pat Two' });
  const inv3 = await mailLink(P2, /invited to manage/);
  sql(`UPDATE auth_tokens SET expires_at = '2000-01-01T00:00:00Z' WHERE email = ${q(P2)} AND purpose = 'invite'`);
  check('an invitation stops working once it expires', (await usePasswordLink(new Client(PORTAL), inv3)).status === 400);
  const det = (await admin.get(`/api/breeders/${B.id}`)).data;
  const s1 = det.people.find((p) => p.email === P1), s2 = det.people.find((p) => p.email === P2);
  check('the admin shows joined and invited states', s1.password_set && !!s1.joined_at && !s2.password_set && !s2.invite_open_until && !!s2.invited_at, JSON.stringify(det.people));

  // A breeder adding someone in the portal sends the same kind of link.
  const P3 = addr('p3');
  await resetC.post('/api/account/members', { email: P3, name: 'Pat Three' });
  const inv4 = await mailLink(P3, /You can now sign in/);
  check('a person a breeder adds gets a link to set a password, not a sign-in code', !!inv4 && /choose your password/.test(sql(`SELECT body FROM dev_mailbox WHERE to_addr = ${q(P3)} ORDER BY id DESC LIMIT 1`)[0].body));

  // Removing a person signs them out at once, from the admin and from the portal.
  const P1other = await signIn(P1);
  check('the person signs in with their own password', P1other.r.status === 200);
  const m1 = det.people.find((p) => p.email === P1).member_id;
  await admin.req('DELETE', `/api/breeders/${B.id}/people/${m1}`);
  check('removing a person in the admin signs them out everywhere at once', (await P1c.get('/api/me')).status === 401 && (await P1other.c.get('/api/me')).status === 401);
  check('and their password no longer signs in', (await signIn(P1)).r.status === 400);
  const P3c = new Client(PORTAL);
  await usePasswordLink(P3c, inv4);
  const m3 = (await resetC.get('/api/account')).data.members.find((m) => m.email === P3).id;
  await resetC.req('DELETE', `/api/account/members/${m3}`);
  check('removing a person in the portal signs them out too', (await P3c.get('/api/me')).status === 401);

  // ---------------------------------------------------------------- Make main contact
  const C = await breeder('c');
  const M1 = addr('m1'), M2 = addr('m2');
  await C.c.post('/api/account/members', { email: M1, name: 'Main One' });
  const M1c = new Client(PORTAL);
  await usePasswordLink(M1c, await mailLink(M1, /You can now sign in/));
  const notMain = await M1c.post(`/api/account/members/${(await M1c.get('/api/account')).data.members[0].id}/main`, { keep_old: true });
  check('only the main contact can hand over the main email', notMain.status === 403);
  const mid = (await C.c.get('/api/account')).data.members.find((m) => m.email === M1).id;
  const swap = await C.c.post(`/api/account/members/${mid}/main`, { keep_old: true });
  const cAfter = sql(`SELECT email FROM breeders WHERE id = ${q(C.id)}`)[0].email;
  check('the main contact makes a person the main contact and stays on as a person', swap.status === 200 && cAfter === M1 && swap.data.members.some((m) => m.email === C.email), JSON.stringify(swap.data).slice(0, 300));
  check('both keep signing in with their own passwords', (await C.c.get('/api/me')).status === 200 && (await M1c.get('/api/me')).status === 200
    && (await signIn(C.email)).r.status === 200 && (await signIn(M1)).r.status === 200);
  await admin.post(`/api/breeders/${C.id}/people`, { email: M2, invite: false });
  const M2id = (await admin.get(`/api/breeders/${C.id}`)).data.people.find((p) => p.email === M2).member_id;
  const swap2 = await admin.post(`/api/breeders/${C.id}/people/main`, { member_id: M2id, old: 'remove' });
  check('the admin makes a person the main contact and removes the old main', swap2.status === 200 && sql(`SELECT email FROM breeders WHERE id = ${q(C.id)}`)[0].email === M2
    && !swap2.data.people.some((p) => p.email === M1));
  check('the removed main contact is signed out and cannot sign in', (await M1c.get('/api/me')).status === 401 && (await signIn(M1)).r.status === 400);
  check('the admin must say what happens to the old main email', (await admin.post(`/api/breeders/${C.id}/people/main`, { member_id: 'x' })).status === 400);

  // ---------------------------------------------------------------- Manage as this breeder
  const D = await breeder('d');
  await D.c.put('/api/profile', { version: (await D.c.get('/api/me')).data.profile.version, business_name: `Accounts Kennel d ${stamp}`, public_phone: '555-0103', city: 'Goshen', state: 'IN' });
  await D.c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
  await admin.post(`/api/breeders/${D.id}/approve`, {});
  const refused = await admin.post(`/api/breeders/${D.id}/manage`, {});
  check('with access off the admin refuses Manage as this breeder', refused.status === 403);
  check('and the admin page shows access off', (await admin.get(`/api/breeders/${D.id}`)).data.access.on === false);
  // A hand-over put straight into the database for a breeder with access off is still refused.
  const forged = `forged-handoff-token-for-the-test-${stamp}`;
  const { createHash } = await import('node:crypto');
  sql(`INSERT INTO auth_tokens (token_hash, purpose, breeder_id, operator_email, created_at, expires_at) VALUES (${q(createHash('sha256').update(forged).digest('hex'))}, 'handoff', ${q(D.id)}, ${q(OPERATOR)}, strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now','+2 minutes'))`);
  const direct = await new Client(PORTAL).get(`/auth/handoff?t=${forged}`);
  check('the portal refuses a hand-over while access is off', direct.status === 403 && /access is off/i.test(direct.data));

  const onR = await D.c.put('/api/account/access', { on: true });
  const accRow = sql(`SELECT manage_access, manage_access_by, manage_access_how FROM breeders WHERE id = ${q(D.id)}`)[0];
  check('the breeder turns Puppy Connection access on, recorded with who and how', onR.status === 200 && onR.data.access.on && accRow.manage_access === 1 && accRow.manage_access_by === D.email && accRow.manage_access_how === 'breeder');
  const mint = await admin.post(`/api/breeders/${D.id}/manage`, {});
  check('the admin mints a hand-over to the portal', mint.status === 200 && mint.data.url.startsWith(`${PORTAL}/auth/handoff?t=`), JSON.stringify(mint.data));
  const tokRow = sql(`SELECT * FROM auth_tokens WHERE purpose = 'handoff' AND breeder_id = ${q(D.id)} AND used_at IS NULL`)[0];
  check('the hand-over is stored hashed, bound to the operator and the breeder, for 2 minutes', tokRow.operator_email === OPERATOR && /^[0-9a-f]{64}$/.test(tokRow.token_hash)
    && !tokRow.token_hash.includes(new URL(mint.data.url).searchParams.get('t')) && (Date.parse(tokRow.expires_at) - Date.parse(tokRow.created_at)) === 120000);
  const op = new Client(PORTAL);
  const land = await op.get(new URL(mint.data.url).pathname + new URL(mint.data.url).search);
  const opMe = (await op.get('/api/me')).data;
  check('the portal opens as the breeder, marked as the operator', land.status === 303 && opMe.id === D.id && opMe.operator && opMe.operator.email === OPERATOR, JSON.stringify(opMe.operator));
  const sess = sql(`SELECT created_at, expires_at, email FROM sessions WHERE breeder_id = ${q(D.id)} AND operator_email = ${q(OPERATOR)}`)[0];
  check('the operator session lasts 8 hours', Math.round((Date.parse(sess.expires_at) - Date.parse(sess.created_at)) / 3600000) === 8 && sess.email === null);
  check('the hand-over works once', (await new Client(PORTAL).get(new URL(mint.data.url).pathname + new URL(mint.data.url).search)).status === 400);
  const html = await op.get('/portal.js?v=28');
  check('the portal draws a banner naming the kennel and the operator, with End', /operator-banner/.test(html.data) && /Managing /.test(html.data) && /id="operator-end"/.test(html.data));

  const breeds = (await op.get('/api/breeds')).data;
  const lit = await op.post('/api/litters', { breed_id: breeds[0].id, born_on: '2026-09-01' });
  check('the operator adds a litter for the breeder', lit.status === 201, JSON.stringify(lit.data));
  const actor = sql(`SELECT actor_type, actor FROM audit_log WHERE action = 'litter.create' AND entity_id = ${q(lit.data.id)}`)[0];
  check('the audit log names the operator acting for the business', actor.actor_type === 'operator' && actor.actor === `${OPERATOR} acting for Accounts Kennel d ${stamp}`, JSON.stringify(actor));
  check('the operator cannot change the access, passwords, authenticator or people', (await op.put('/api/account/access', { on: false })).status === 403
    && (await op.put('/api/account/password', { password: 'operator password here' })).status === 403
    && (await op.post('/api/account/authenticator')).status === 403 && (await op.post('/api/account/members', { email: addr('x') })).status === 403);

  await D.c.put('/api/account/access', { on: false });
  check('turning access off ends the operator session at once', (await op.get('/api/me')).status === 401);
  check('and the audit log records it', sql(`SELECT COUNT(*) AS n FROM audit_log WHERE action = 'access.off' AND entity_id = ${q(D.id)}`)[0].n === 1);

  // An imported breeder Amber already manages: recorded by an owner, never signed in.
  const seed = sql("SELECT id FROM breeders WHERE id LIKE 'seed-%' AND first_signin_at IS NULL AND manage_access = 0 LIMIT 1")[0];
  const rec = await admin.put(`/api/breeders/${seed.id}/access`, { on: true });
  const seedRow = sql(`SELECT manage_access, manage_access_how, manage_access_by FROM breeders WHERE id = ${q(seed.id)}`)[0];
  check('the admin records the existing management arrangement', rec.status === 200 && seedRow.manage_access === 1 && seedRow.manage_access_how === 'existing_arrangement' && seedRow.manage_access_by === OPERATOR);
  const mint2 = await admin.post(`/api/breeders/${seed.id}/manage`, {});
  const op2 = new Client(PORTAL);
  await op2.get(new URL(mint2.data.url).pathname + new URL(mint2.data.url).search);
  check('managing an imported breeder neither counts as their first sign-in nor starts their clock', (await op2.get('/api/me')).status === 200
    && sql(`SELECT first_signin_at FROM breeders WHERE id = ${q(seed.id)}`)[0].first_signin_at === null);
  const end = await op2.post('/auth/signout');
  check('End closes the operator session and points back to the admin', end.status === 200 && /\/#\/breeders\//.test(end.data.back || '') && (await op2.get('/api/me')).status === 401);
  const mint3 = await admin.post(`/api/breeders/${seed.id}/manage`, {});
  sql(`UPDATE auth_tokens SET expires_at = '2000-01-01T00:00:00Z' WHERE purpose = 'handoff' AND breeder_id = ${q(seed.id)} AND used_at IS NULL`);
  check('a hand-over stops working after its 2 minutes', (await new Client(PORTAL).get(new URL(mint3.data.url).pathname + new URL(mint3.data.url).search)).status === 400);
  const mint4 = await admin.post(`/api/breeders/${seed.id}/manage`, {});
  const op4 = new Client(PORTAL);
  await op4.get(new URL(mint4.data.url).pathname + new URL(mint4.data.url).search);
  await admin.put(`/api/breeders/${seed.id}/access`, { on: false });
  check('turning access off in the admin also ends the operator session', (await op4.get('/api/me')).status === 401);
  sql(`UPDATE breeders SET manage_access = 0, manage_access_by = NULL, manage_access_at = NULL, manage_access_how = NULL WHERE id = ${q(seed.id)}`);

  // ---------------------------------------------------------------- the CPU of one password hash (A26)
  const timed = async (fn) => { const t = performance.now(); await fn(); return performance.now() - t; };
  const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const hashTimes = [], plainTimes = [];
  for (let i = 0; i < 15; i += 1) {
    hashTimes.push(await timed(() => fetch(`${PORTAL}/auth/password`, { method: 'POST', headers: { origin: PORTAL, 'content-type': 'application/json' }, body: JSON.stringify({ email: `timing-${stamp}@breeders.test`, password: 'x'.repeat(12) }) })));
    plainTimes.push(await timed(() => fetch(`${PORTAL}/auth/password`, { method: 'POST', headers: { origin: PORTAL, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'not an address', password: 'x' }) })));
  }
  sql(`DELETE FROM signin_failures WHERE email = ${q(`timing-${stamp}@breeders.test`)}`);
  console.log(`      one PBKDF2-SHA256 hash at 100,000 iterations adds a median ${(med(hashTimes) - med(plainTimes)).toFixed(1)} ms to a sign-in in local workerd (${med(hashTimes).toFixed(1)} ms against ${med(plainTimes).toFixed(1)} ms)`);
  check('the timing ran', hashTimes.length === 15);

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
