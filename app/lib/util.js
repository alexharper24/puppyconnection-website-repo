// Small helpers shared by the portal and the admin Workers.

const ENC = new TextEncoder();

/** UTC to the second, the one timestamp format the database stores (schema.sql header). */
export function now(date = new Date()) {
  return date.toISOString().slice(0, 19) + 'Z';
}

export function addDays(iso, days) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return now(d);
}

export function addMinutes(iso, minutes) {
  return now(new Date(new Date(iso).getTime() + minutes * 60000));
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A ULID: sortable by creation time, 26 characters, no coordination needed. */
export function ulid() {
  let t = Date.now();
  let time = '';
  for (let i = 0; i < 10; i += 1) { time = CROCKFORD[t % 32] + time; t = Math.floor(t / 32); }
  const rand = crypto.getRandomValues(new Uint8Array(16));
  let r = '';
  for (let i = 0; i < 16; i += 1) r += CROCKFORD[rand[i] % 32];
  return time + r;
}

/** 32 random bytes, base64url. Used for sign-in links and session cookies. */
export function randomToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256hex(text) {
  const d = await crypto.subtle.digest('SHA-256', ENC.encode(text));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const notFound = () => new HttpError(404, 'Not found.');
export const forbidden = (msg) => new HttpError(403, msg || 'Not allowed.');
export const bad = (msg, extra) => new HttpError(400, msg, extra);

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function redirect(location, status = 303, headers = {}) {
  return new Response(null, { status, headers: { location, 'cache-control': 'no-store', ...headers } });
}

/** A JSON body, refused over 64 KB or when it is not an object. */
export async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw bad('Send JSON.');
  const text = await request.text();
  if (text.length > 65536) throw bad('Too large.');
  try {
    const v = JSON.parse(text || '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('shape');
    return v;
  } catch {
    throw bad('That was not valid JSON.');
  }
}

/**
 * The CSRF rule (spec 6.3). Every state-changing request carries an Origin equal to the
 * Worker's own. With SameSite=Lax cookies and JSON-only bodies, that is the defense.
 */
export function requireSameOrigin(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) throw forbidden('Cross-site request refused.');
}

export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Cookie attributes. Local http cannot carry Secure or the __Host- prefix. */
export function sessionCookieName(request) {
  return new URL(request.url).protocol === 'https:' ? '__Host-pc_session' : 'pc_session';
}

export function setCookie(request, name, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

/*
 * DEV_MODE, one value per Worker:
 *   local          the simulation on localhost, with the operator stand-in (DEV_IDENTITY)
 *   hosted-test    a hosted copy behind the TEST_GATE password
 *   hosted-open    the open hosted portal, with "test version" notices
 *   hosted-access  the hosted admin behind Cloudflare Access, with "test copy" notices
 *   staging        plan P7.3. The hosted copy made to look like production. It shows no test
 *                  notices, keeps noindex, and has no operator stand-in. The test mailbox and the
 *                  practice checkout still work, because each follows its own provider setting,
 *                  so the mailbox exists only while EMAIL_MODE is log and the practice checkout
 *                  only while PAYMENTS_MODE is sim. In the portal it keeps hosted-open's access
 *                  rules (each browser sees only its own mail, a checkout opens only for its own
 *                  breeder), and in the admin it keeps hosted-access's (Access, then people).
 *   (not set)      production. No helpers at all.
 */
const NOTICE_MODES = ['local', 'hosted-test', 'hosted-open', 'hosted-access'];

/** Whether the screens say out loud that this is a test copy. Off in staging and production. */
export function showTestNotices(env) {
  return NOTICE_MODES.includes(env.DEV_MODE);
}

/** The open hosted portal, where no password stands in front of the test helpers. */
export function isOpenHosted(env) {
  return env.DEV_MODE === 'hosted-open' || env.DEV_MODE === 'staging';
}

/**
 * Whether the simulation's helpers (the mailbox, the practice checkout, the operator
 * stand-in) may run. DEV_MODE "local" on localhost, DEV_MODE "hosted-test" with the
 * TEST_GATE secret set (gate() below has already made every request prove it knows the
 * password), or the open hosted portal. Anything else is production, where they are off.
 * Each helper also needs its own provider setting (EMAIL_MODE log, PAYMENTS_MODE sim).
 */
export function isLocal(request, env) {
  if (env.DEV_MODE === 'hosted-test') return !!env.TEST_GATE;
  // The open test portal. No password, so the mailbox shows each browser only the mail for
  // addresses it signed up with, and the practice checkout opens only for its own breeder.
  if (isOpenHosted(env)) return true;
  const host = new URL(request.url).hostname;
  return env.DEV_MODE === 'local' && (host === 'localhost' || host === '127.0.0.1');
}

/**
 * The password in front of a hosted test deployment. Only active with DEV_MODE
 * "hosted-test", and it fails closed: the mode without the secret refuses everything.
 * Returns a Response to send back, or null to carry on.
 */
export function gate(request, env) {
  if (env.DEV_MODE !== 'hosted-test') return null;
  if (!env.TEST_GATE) return new Response('This test environment is not set up.', { status: 503 });
  const m = (request.headers.get('authorization') || '').match(/^Basic\s+(.+)$/i);
  if (m) {
    try {
      const decoded = atob(m[1]);
      const pass = decoded.slice(decoded.indexOf(':') + 1);
      if (timingSafeEqual(pass, env.TEST_GATE)) return null;
    } catch { /* fall through to the challenge */ }
  }
  return new Response('The Puppy Connection test environment needs its password.', {
    status: 401,
    headers: { 'www-authenticate': 'Basic realm="Puppy Connection test", charset="UTF-8"', 'cache-control': 'no-store' },
  });
}

export function clean(v, max = 500) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

export function cents(v) {
  if (v === '' || v == null) return null;
  const n = Math.round(Number(String(v).replace(/[$,\s]/g, '')) * 100);
  if (!Number.isFinite(n) || n < 0 || n > 10000000) throw bad('Prices are dollars, like 1995 or 1995.00.');
  return n;
}

export const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  // The portal and the admin are never for search engines, in staging or at launch. Only the
  // public site turns indexing on at launch.
  'x-robots-tag': 'noindex, nofollow',
  'referrer-policy': 'same-origin',
  'content-security-policy':
    "default-src 'self'; img-src 'self' data: https://static.wixstatic.com; " +
    "script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

/**
 * The breeder portal's headers. Google's sign-in library (One Tap and its button) loads a
 * script, a frame and a stylesheet from accounts.google.com/gsi/, calls back to it, and needs
 * the page's origin in the Referer, so the portal allows exactly those. The admin keeps
 * SECURITY_HEADERS as they are.
 */
export const PORTAL_SECURITY_HEADERS = {
  ...SECURITY_HEADERS,
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy':
    "default-src 'self'; img-src 'self' data: https://static.wixstatic.com https://lh3.googleusercontent.com; " +
    "script-src 'self' https://challenges.cloudflare.com https://accounts.google.com/gsi/client; " +
    "frame-src https://challenges.cloudflare.com https://accounts.google.com/gsi/; " +
    "connect-src 'self' https://accounts.google.com/gsi/; " +
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

export function withHeaders(response, headers) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(headers)) if (!r.headers.has(k)) r.headers.set(k, v);
  return r;
}
