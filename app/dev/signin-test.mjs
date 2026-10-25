// Sliding 60-day sessions (plan P6.3) and the contact change notice (P6.6), against the running
// local Workers. The emailed sign-in code of P6.2 was switched off by launch workplan A26, so this
// suite checks it stays off, and dev/accounts-test.mjs covers the password and authenticator.
//
//   node app/dev/signin-test.mjs        with pc-portal on 8787 and pc-admin on 8788
//
// Each "browser" is a Client with its own cookie jar. Dates are moved directly in the local
// database, the way jobs-test.mjs does. Sign-in requests are limited to ten a minute, so the
// suite waits out a 429 from the limiter and carries on.

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client, signUp, signIn } from './e2e.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}

function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';
const DAY = 86400000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A request that waits out the per-minute limiter instead of failing on it. */
async function call(c, method, p, body, extra) {
  for (let i = 0; i < 3; i += 1) {
    const r = await c.req(method, p, body, extra);
    if (r.status !== 429 || !/wait a minute/.test(r.data?.error || '')) return r;
    console.log('      (rate limited, waiting a minute)');
    await sleep(62000);
  }
  throw new Error(`${p} stayed rate limited`);
}

async function mailFor(email, template) {
  for (let i = 0; i < 20; i += 1) {
    const r = await new Client(PORTAL).get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
    const hit = (r.data || []).filter((m) => (template ? template.test(m.subject) : true));
    if (hit.length) return hit;
    await sleep(150);
  }
  return [];
}

async function main() {
  const stamp = Date.now().toString(36);
  const addr = (n) => `code-${n}-${stamp}@breeders.test`;

  // ------------------------------------------------------------ P6.2, switched off by A26
  const off = await call(new Client(PORTAL), 'POST', '/auth/start', { email: addr('probe') });
  const offCode = await new Client(PORTAL).post('/auth/code', { code: '123456' });
  check('asking for an emailed sign-in code is refused and sends nothing', off.status === 410 && offCode.status === 410
    && (await mailFor(addr('probe'))).length === 0, JSON.stringify(off.data));
  const offLink = await new Client(PORTAL).get('/auth/verify?t=anything');
  check('an old sign-in link says sign-in links are no longer used', offLink.status === 410 && /no longer used/.test(offLink.data));

  const { c: a } = await signUp(addr('a'), `Code Kennel a ${stamp}`);
  const meA = await a.get('/api/me');
  check('a new breeder is signed in after choosing a password', meA.status === 200 && meA.data.email === addr('a'), JSON.stringify(meA.data).slice(0, 200));

  // ------------------------------------------------------------ P6.3 sessions
  const id = meA.data.id;
  const sess = () => sql(`SELECT created_at, expires_at, revoked_at FROM sessions WHERE breeder_id = '${id}' ORDER BY created_at DESC`);
  const s0 = sess()[0];
  const days = (x) => (new Date(x.expires_at) - Date.now()) / DAY;
  check('a new session lasts 60 days', Math.abs(days(s0) - 60) < 0.01, s0.expires_at);
  const rawCookie = async (cl) => {
    const r = await fetch(`${PORTAL}/api/me`, { headers: { cookie: cl.cookie } });
    return { status: r.status, set: r.headers.getSetCookie().find((x) => x.startsWith('pc_session=')) };
  };
  const fresh = await rawCookie(a);
  check('a session less than a day into its window is not renewed', fresh.status === 200 && !fresh.set, fresh.set);

  sql(`UPDATE sessions SET expires_at = '${iso(Date.now() + 50 * DAY)}' WHERE breeder_id = '${id}'`);
  const renewed = await rawCookie(a);
  check('a session used ten days in is renewed and its cookie refreshed for 60 days', renewed.status === 200 && /Max-Age=5184000/.test(renewed.set || '') && /HttpOnly/.test(renewed.set || ''), renewed.set);
  check('its end moves out to 60 days from now', Math.abs(days(sess()[0]) - 60) < 0.01, sess()[0].expires_at);

  sql(`UPDATE sessions SET expires_at = '${iso(Date.now() + 0.5 * DAY)}' WHERE breeder_id = '${id}'`);
  check('a session 59 and a half days idle still works and renews', (await rawCookie(a)).status === 200 && days(sess()[0]) > 59.9);

  sql(`UPDATE sessions SET expires_at = '${iso(Date.now() - 60000)}' WHERE breeder_id = '${id}'`);
  check('a session idle past 60 days is signed out, not renewed', (await a.get('/api/me')).status === 401 && days(sess()[0]) < 0);

  // Revocation and signing out of every device
  const p1 = (await signIn(addr('a'))).c, p2 = (await signIn(addr('a'))).c;
  check('two browsers are signed in to one account', (await p1.get('/api/me')).status === 200 && (await p2.get('/api/me')).status === 200);
  sql(`UPDATE sessions SET revoked_at = '${iso(Date.now())}', expires_at = '${iso(Date.now() + 10 * DAY)}' WHERE breeder_id = '${id}' AND token_hash = (SELECT token_hash FROM sessions WHERE breeder_id = '${id}' AND revoked_at IS NULL AND expires_at > '${iso(Date.now())}' ORDER BY created_at LIMIT 1)`);
  const revokedSeen = [(await p1.get('/api/me')).status, (await p2.get('/api/me')).status].sort().join(',');
  check('a revoked session is refused and never renewed back to life', revokedSeen === '200,401', revokedSeen);
  const live = (await p1.get('/api/me')).status === 200 ? p1 : p2;
  const still = live === p1 ? p2 : p1;
  await still.post('/auth/password', { email: addr('a'), password: 'correct horse battery staple' });
  const bye = await live.post('/auth/signout-all');
  check('sign out of every device answers and ends every session', bye.status === 200 && bye.data.ended >= 2, JSON.stringify(bye.data));
  check('both browsers are signed out', (await p1.get('/api/me')).status === 401 && (await p2.get('/api/me')).status === 401);
  check('signing out of every device is in the audit log', sql(`SELECT COUNT(*) AS n FROM audit_log WHERE action = 'breeder.signout_all' AND entity_id = '${id}'`)[0].n === 1);
  const { c: one } = await signUp(addr('c'), `Code Kennel c ${stamp}`);
  const out = await one.post('/auth/signout');
  check('signing out of one browser still works', out.status === 200 && (await one.get('/api/me')).status === 401);

  // ------------------------------------------------------------ P6.6 contact change notice
  const kEmail = addr('k');
  const { c: k } = await signUp(kEmail, `Contact Kennel ${stamp}`);
  let me = (await k.get('/api/me')).data;
  await k.put('/api/profile', { version: me.profile.version, business_name: `Contact Kennel ${stamp}`, public_phone: '555-0100', public_email: `kennel-${stamp}@public.test`, city: 'Goshen', state: 'IN' });
  check('filling in the profile before submitting sends no notice', (await mailFor(kEmail, /contact details/)).length === 0);
  await k.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
  const admin = new Client(ADMIN);
  await admin.post(`/api/breeders/${me.id}/approve`, {});
  me = (await k.get('/api/me')).data;
  const saved = await k.put('/api/profile', { ...me.profile, version: me.profile.version, public_phone: '555-0199', website_url: 'https://contact-kennel.test' });
  check('the breeder changes the public phone and adds a website', saved.status === 200, JSON.stringify(saved.data).slice(0, 200));
  const [n1] = await mailFor(kEmail, /contact details/);
  check('a notice reaches the sign-in address', !!n1, 'no mail');
  check('it names each change with the old and new value', n1 && /Public phone\s+was 555-0100\s+now 555-0199/.test(n1.body) && /Website\s+was \(blank\)\s+now https:\/\/contact-kennel\.test/.test(n1.body) && !/Public email/.test(n1.body), n1?.body);
  check('it says to contact Puppy Connection if they did not make the change', n1 && /If you did not, please contact Puppy Connection/.test(n1.body) && /in the breeder portal/.test(n1.body));
  me = (await k.get('/api/me')).data;
  await k.put('/api/profile', { ...me.profile, version: me.profile.version, description: 'Only the description changed.' });
  check('a save that leaves the contact details alone sends no notice', (await mailFor(kEmail, /contact details/)).length === 1);

  const detail = (await admin.get(`/api/breeders/${me.id}`)).data.breeder;
  const newPublic = `new-${stamp}@public.test`;
  const op = await admin.put(`/api/breeders/${me.id}/profile`, { ...detail, version: detail.profile_version, public_email: newPublic });
  check('an operator can change the public email from the admin', op.status === 200 && op.data.breeder.public_email === newPublic, JSON.stringify(op.data).slice(0, 200));
  const notices = await mailFor(kEmail, /contact details/);
  check('the operator change is emailed to the sign-in address too', notices.length === 2 && /by the Puppy Connection team/.test(notices[0].body)
    && notices[0].body.includes(`was kennel-${stamp}@public.test`) && notices[0].body.includes(`now ${newPublic}`), notices[0]?.body);
  check('nothing is sent to the new public address', (await mailFor(newPublic)).length === 0);
  const audit = sql(`SELECT actor_type, before_json, after_json FROM audit_log WHERE action = 'profile.update' AND entity_id = '${me.id}' ORDER BY id DESC LIMIT 1`)[0];
  check('the operator change is in the audit log with the old and new values', audit && audit.actor_type === 'operator'
    && JSON.parse(audit.before_json).public_email === `kennel-${stamp}@public.test` && JSON.parse(audit.after_json).public_email === newPublic, JSON.stringify(audit));
  const stale = await admin.put(`/api/breeders/${me.id}/profile`, { ...detail, version: detail.profile_version, public_phone: '555-0000' });
  check('an operator edit from an old copy is refused, not lost', stale.status === 409);

  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
