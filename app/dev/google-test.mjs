// Tests "Continue with Google" (lib/google.js and the portal's /auth/google routes).
//
//   node app/dev/google-test.mjs     with pc-portal on 8787, its .dev.vars pointing the Google
//                                    endpoints at http://localhost:8799 (see .dev.vars.example)
//
// Part 1 checks the ID token verification directly with tokens this script signs, including
// forged ones. Part 2 runs the real sign-in through the portal against a stand-in Google on
// port 8799, which checks the PKCE proof and the client secret the way Google does.

import http from 'node:http';
import { webcrypto as crypto } from 'node:crypto';
import { verifyIdToken, b64url } from '../lib/google.js';

const PORTAL = 'http://localhost:8787';
const CLIENT_ID = 'local-test-client.apps.googleusercontent.com';
const CLIENT_SECRET = 'local-test-secret';
let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
async function keyPair(kid) {
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  return { kid, privateKey: kp.privateKey, jwk: { kty: jwk.kty, n: jwk.n, e: jwk.e, kid, alg: 'RS256', use: 'sig' } };
}
async function sign(k, claims, header = {}) {
  const head = enc({ alg: 'RS256', typ: 'JWT', kid: k.kid, ...header });
  const body = enc(claims);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k.privateKey, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}
const nowS = () => Math.floor(Date.now() / 1000);
const good = (over = {}) => ({ iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: '1234567890', email: 'test@example.com', email_verified: true, nonce: 'n-1', iat: nowS(), exp: nowS() + 3600, name: 'Test Person', ...over });

async function part1() {
  const k = await keyPair('k1'), other = await keyPair('k2');
  const keys = [k.jwk];
  const v = (token, nonce = 'n-1') => verifyIdToken(token, { clientId: CLIENT_ID, nonce, keys }).then(() => 'ok', (e) => e.message);
  check('a genuine token passes', await v(await sign(k, good())) === 'ok');
  check('a token for another app is refused', /different app/.test(await v(await sign(k, good({ aud: 'someone-else' })))));
  check('a token from another issuer is refused', /not issued by Google/.test(await v(await sign(k, good({ iss: 'https://evil.example' })))));
  check('an expired token is refused', /expired/.test(await v(await sign(k, good({ exp: nowS() - 600 })))));
  check('a token from another sign-in (nonce) is refused', /nonce/.test(await v(await sign(k, good()), 'n-2')));
  check('an unverified Google email is refused', /not verified/.test(await v(await sign(k, good({ email_verified: false })))));
  const t = await sign(k, good()); const [h, , s] = t.split('.');
  check('a token with an edited body is refused', /signature/.test(await v(`${h}.${enc(good({ email: 'amber@puppyconnection.test' }))}.${s}`)));
  check('a token signed by an unknown key is refused', /does not publish/.test(await v(await sign(other, good()))));
  check('an unsigned token is refused', /algorithm/.test(await v(`${enc({ alg: 'none', kid: 'k1' })}.${enc(good())}.`)));
  return k;
}

// A stand-in Google: /token checks the code, the PKCE verifier against the challenge the portal
// sent, and the client secret, then returns an ID token for whichever user the test chose.
function fakeGoogle(k) {
  const pending = new Map();   // code -> { challenge, nonce, claims }
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost:8799');
    if (url.pathname === '/certs') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ keys: [k.jwk] })); }
    if (url.pathname === '/token') {
      let body = ''; for await (const c of req) body += c;
      const p = new URLSearchParams(body), entry = pending.get(p.get('code'));
      const proof = entry && b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p.get('code_verifier') || '')));
      if (!entry || proof !== entry.challenge || p.get('client_secret') !== CLIENT_SECRET || p.get('client_id') !== CLIENT_ID) {
        res.statusCode = 400; return res.end(JSON.stringify({ error: 'invalid_grant' }));
      }
      pending.delete(p.get('code'));
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ id_token: await sign(k, good({ ...entry.claims, nonce: entry.nonce })) }));
    }
    res.statusCode = 404; res.end();
  });
  return { server, pending };
}

async function signIn(g, claims, tamper = {}) {
  const start = await fetch(`${PORTAL}/auth/google`, { redirect: 'manual' });
  const loc = new URL(start.headers.get('location'));
  const cookie = (start.headers.get('set-cookie') || '').split(';')[0];
  const code = `code-${Math.random().toString(36).slice(2)}`;
  g.pending.set(code, { challenge: loc.searchParams.get('code_challenge'), nonce: loc.searchParams.get('nonce'), claims });
  const state = tamper.state || loc.searchParams.get('state');
  const back = await fetch(`${PORTAL}/auth/google/callback?code=${code}&state=${encodeURIComponent(state)}`, { headers: { cookie }, redirect: 'manual' });
  const session = (back.headers.getSetCookie?.() || [back.headers.get('set-cookie') || '']).map((c) => c.split(';')[0]).find((c) => /pc_session=./.test(c));
  const me = session ? await (await fetch(`${PORTAL}/api/me`, { headers: { cookie: session } })).json() : null;
  return { start, loc, back, me };
}

async function part2(k) {
  const g = fakeGoogle(k);
  await new Promise((r) => g.server.listen(8799, r));
  try {
    const email = `google-${Date.now().toString(36)}@example.com`;
    const first = await signIn(g, { email, name: 'Pat Example' });
    check('the portal sends the browser to Google with PKCE, state and nonce',
      first.start.status === 302 && first.loc.searchParams.get('code_challenge_method') === 'S256' && first.loc.searchParams.get('state') && first.loc.searchParams.get('nonce') &&
      first.loc.searchParams.get('client_id') === CLIENT_ID && first.loc.searchParams.get('scope') === 'openid email profile', first.loc.toString());
    check('a new Google user lands signed in as a pending breeder', first.back.status === 303 && first.back.headers.get('location') === '/' && first.me?.email === email && first.me?.status === 'pending', JSON.stringify(first.me));
    const again = await signIn(g, { email: email.toUpperCase(), name: 'Pat Example' });
    check('signing in with Google again reaches the same account', again.me?.id === first.me?.id, `${again.me?.id} vs ${first.me?.id}`);

    // an account made by an emailed link is reached by Google with the same address
    const linkEmail = `link-${Date.now().toString(36)}@example.com`;
    await fetch(`${PORTAL}/auth/start`, { method: 'POST', headers: { origin: PORTAL, 'content-type': 'application/json' }, body: JSON.stringify({ email: linkEmail, business_name: 'Link Kennel' }) });
    const mail = await (await fetch(`${PORTAL}/dev/mail.json?to=${encodeURIComponent(linkEmail)}`)).json();
    const t = new URL(mail[0].link).searchParams.get('t');
    const v = await fetch(`${PORTAL}/auth/verify`, { method: 'POST', headers: { origin: PORTAL, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ t }), redirect: 'manual' });
    const linkSession = (v.headers.get('set-cookie') || '').split(';')[0];
    const linkMe = await (await fetch(`${PORTAL}/api/me`, { headers: { cookie: linkSession } })).json();
    const viaGoogle = await signIn(g, { email: linkEmail });
    check('Google reaches the account an emailed link created', viaGoogle.me?.id === linkMe.id && viaGoogle.me?.profile?.business_name === 'Link Kennel', JSON.stringify(viaGoogle.me));

    const forged = await signIn(g, { email: `forged-${Date.now()}@example.com` }, { state: 'not-the-state' });
    check('a callback whose state does not match this browser is refused', forged.back.headers.get('location') === '/?google=failed' && !forged.me);
    const unverified = await signIn(g, { email: `unverified-${Date.now()}@example.com`, email_verified: false });
    check('a Google account with an unverified email is refused', unverified.back.headers.get('location') === '/?google=failed' && !unverified.me);
    const replay = await fetch(`${PORTAL}/auth/google/callback?code=x&state=y`, { redirect: 'manual' });
    check('a callback with no sign-in started in this browser is refused', replay.headers.get('location') === '/?google=failed');
    const cancelled = await fetch(`${PORTAL}/auth/google/callback?error=access_denied`, { redirect: 'manual' });
    check('choosing Cancel at Google returns quietly to the sign-in page', cancelled.headers.get('location') === '/?google=cancelled');
    const cfg = await (await fetch(`${PORTAL}/api/config`)).json();
    check('the sign-in page is told Google is available', cfg.google === true);
  } finally {
    g.server.close();
  }
}

const k = await part1();
await part2(k);
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
