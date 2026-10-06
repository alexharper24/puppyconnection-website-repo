// "Continue with Google" for the breeder portal (plan P6.1), as OpenID Connect with the
// authorization code flow, PKCE, a state value and a nonce.
//
// Google's answer is trusted only after the server checks it: the ID token's RS256 signature
// against Google's published keys, the issuer, the audience (our client ID), the expiry, the
// nonce we sent, and that Google says the email address is verified. Only then does the email
// match or create a breeder account, so a Google sign-in carries exactly the same approval and
// suspension rules as an emailed link.

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const json = (part) => JSON.parse(new TextDecoder().decode(fromB64url(part)));
export const randomString = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

export function googleEnabled(env) { return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET); }

// The local tests run a stand-in Google, so the endpoints can be pointed at it, but only in
// the local simulation. Anywhere else the real addresses are fixed.
function endpoint(env, name, real) {
  return env.DEV_MODE === 'local' && env[name] ? env[name] : real;
}

export async function startUrl(env, redirectUri) {
  const state = randomString(), nonce = randomString(), verifier = randomString(48);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const u = new URL(endpoint(env, 'GOOGLE_AUTH_URL', AUTH_URL));
  u.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile',
    state, nonce, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
  }).toString();
  return { url: u.toString(), cookie: `${state}.${nonce}.${verifier}` };
}

export async function exchangeCode(env, code, verifier, redirectUri) {
  const res = await fetch(endpoint(env, 'GOOGLE_TOKEN_URL', TOKEN_URL), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, code_verifier: verifier, redirect_uri: redirectUri, grant_type: 'authorization_code',
      client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.id_token) throw new Error(`Google did not return a sign-in token (${res.status} ${out.error || ''})`.trim());
  return out.id_token;
}

let keyCache = null;
// Google rotates its keys, so a token naming a key the cache does not hold fetches the list
// again, at most once a minute so forged key ids cannot make the Worker fetch on every request.
let lastForced = 0;
async function googleKeys(env, kid) {
  const url = endpoint(env, 'GOOGLE_JWKS_URL', JWKS_URL);
  const fresh = keyCache && keyCache.url === url && keyCache.until > Date.now();
  const missing = kid && fresh && !keyCache.keys.some((k) => k.kid === kid) && Date.now() - lastForced > 60000;
  if (fresh && !missing) return keyCache.keys;
  if (missing) lastForced = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch Google's signing keys (${res.status})`);
  const keys = (await res.json()).keys || [];
  keyCache = { url, keys, until: Date.now() + 3600000 };
  return keys;
}

/**
 * Checks a Google ID token and returns its claims, or throws with the reason. Exported with
 * the keys as a parameter so dev/google-test.mjs can try forged and broken tokens directly.
 */
export async function verifyIdToken(idToken, { clientId, nonce, keys, nowSeconds = Math.floor(Date.now() / 1000) }) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('not a token');
  const header = json(parts[0]), claims = json(parts[1]);
  if (header.alg !== 'RS256') throw new Error('unexpected signing algorithm');
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('signed with a key Google does not publish');
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!ok) throw new Error('signature does not match');
  if (!ISSUERS.includes(claims.iss)) throw new Error('not issued by Google');
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(clientId)) throw new Error('issued for a different app');
  if (!(claims.exp > nowSeconds - 60)) throw new Error('expired');
  if (claims.iat && claims.iat > nowSeconds + 300) throw new Error('issued in the future');
  if (!nonce || claims.nonce !== nonce) throw new Error('nonce does not match this sign-in');
  if (claims.email_verified !== true && claims.email_verified !== 'true') throw new Error('Google has not verified this email address');
  if (!claims.email) throw new Error('no email address');
  return claims;
}

export async function verifyWithGoogle(env, idToken, nonce) {
  let kid = null;
  try { kid = json(String(idToken || '').split('.')[0]).kid || null; } catch { /* verifyIdToken reports it */ }
  return verifyIdToken(idToken, { clientId: env.GOOGLE_CLIENT_ID, nonce, keys: await googleKeys(env, kid) });
}
