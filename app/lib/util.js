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

export function isLocal(request, env) {
  const host = new URL(request.url).hostname;
  return env.DEV_MODE === 'local' && (host === 'localhost' || host === '127.0.0.1');
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
  'referrer-policy': 'same-origin',
  'content-security-policy':
    "default-src 'self'; img-src 'self' data: https://static.wixstatic.com; " +
    "script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

export function withHeaders(response, headers) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(headers)) if (!r.headers.has(k)) r.headers.set(k, v);
  return r;
}
