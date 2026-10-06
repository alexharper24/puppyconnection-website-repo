// The breeder portal (spec sections 6, 7 and 8). Breeders sign up and sign in here with a
// one-time emailed link, manage their kennel, litters, puppies and photos, and pay to list.
// It also carries the Stripe webhook and, in the local simulation, a stand-in Checkout page.

import {
  now, addDays, addMinutes, ulid, randomToken, sha256hex, slugify, esc, clean, cents,
  HttpError, notFound, forbidden, bad, json, html, redirect, readJson, requireSameOrigin,
  parseCookies, sessionCookieName, setCookie, isLocal, PORTAL_SECURITY_HEADERS as SECURITY_HEADERS, withHeaders, gate,
  showTestNotices, isOpenHosted, timingSafeEqual,
} from '../lib/util.js';
import { privacyPage, termsPage } from './legal.js';
import {
  owned, loadBreeder, requireApproved, settings, auditStmt, dirtyStmt, checkVersion,
  littersWithPuppies, photoUrl, profileFields, profileStmt, profileBefore, noticeContactChange,
  BRAND, facebookUrl, breederBreeds, brandUrl, serveBrand,
} from '../lib/store.js';
import { sendMail, alertOps } from '../lib/mail.js';
import { siteBreederSlug } from '../lib/export.js';
import { breederStats } from '../lib/stats.js';
import { scheduled as runScheduled } from '../lib/jobs.js';
import {
  provider, sim, createCheckout, releaseCheckout, fulfillCheckout, handleEvent, verifyStripe, payability,
} from '../lib/payments.js';
import { cleanImage } from '../lib/images.js';
import { googleEnabled, startUrl, exchangeCode, verifyWithGoogle, randomString } from '../lib/google.js';

// Plan P6.3. A session lasts 60 days from its last renewal. Using it more than a day into
// its current window pushes the end out to 60 days from now and refreshes the cookie, so an
// active breeder stays signed in and an idle one is signed out after 60 days.
const SESSION_DAYS = 60;
const TOKEN_MINUTES = 15;
const LINKS_PER_HOUR = 5;
// Plan P6.2. Wrong codes allowed per emailed code before it is spent, and per address in a day.
const CODE_TRIES = 5;
const CODE_TRIES_PER_DAY = 20;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ------------------------------------------------------------------ sessions

// The refreshed session cookie for a request whose session was renewed, added to the
// response by the router (fetch, below) unless the handler set the session cookie itself.
const RENEWED = new WeakMap();

async function currentSession(request, env) {
  const token = parseCookies(request)[sessionCookieName(request)];
  if (!token) return null;
  const hash = await sha256hex(token);
  const s = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(hash).first();
  const t = now();
  if (!s || s.revoked_at || s.expires_at <= t) return null;
  const breeder = await loadBreeder(env, s.breeder_id);
  if (!breeder) return null;
  if (s.expires_at < addDays(t, SESSION_DAYS - 1)) {
    const r = await env.DB.prepare('UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
      .bind(addDays(t, SESSION_DAYS), t, hash).run();
    if (r.meta.changes === 1) RENEWED.set(request, setCookie(request, sessionCookieName(request), token, SESSION_DAYS * 86400));
  } else if (s.last_seen_at < addMinutes(t, -5)) {
    await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').bind(t, hash).run();
  }
  return { hash, breeder };
}

async function needSession(request, env) {
  const s = await currentSession(request, env);
  if (!s) throw new HttpError(401, 'Please sign in.');
  return s;
}

async function startSession(request, env, breederId) {
  const token = randomToken();
  const t = now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, breeder_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256hex(token), breederId, t, addDays(t, SESSION_DAYS), t).run();
  return setCookie(request, sessionCookieName(request), token, SESSION_DAYS * 86400);
}

// ------------------------------------------------------------------ sign-in links (spec 6.1, 6.2)

async function verifyTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET) {
    if (isLocal(request, env)) return;   // local simulation without a widget
    throw new HttpError(503, 'Sign-up is not set up yet.');
  }
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token || '');
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = await res.json().catch(() => ({}));
  const hostOk = !env.TURNSTILE_HOSTNAME || out.hostname === env.TURNSTILE_HOSTNAME;
  if (!out.success || !hostOk || (out.action && out.action !== 'auth')) {
    throw bad('The security check did not pass. Please try again.');
  }
}

async function authStart(request, env, ctx) {
  const body = await readJson(request);
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RX.test(email) || email.length > 200) throw bad('Enter a valid email address.');
  await verifyTurnstile(request, env, body.turnstile_token);

  const ip = request.headers.get('cf-connecting-ip') || 'local';
  if (env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: `ip:${ip}` });
    if (!success) throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
  }
  const neutral = { ok: true, message: 'We sent a sign-in code and link to that address. Type the code below, or open the link. Each works once and stops working after 15 minutes.' };
  // Plan P6.2. This browser's sign-in cookie. The emailed code only works alongside it, so a
  // code read over someone's shoulder is no use in another browser.
  let binder = parseCookies(request)[signinCookieName(request)];
  if (!binder || !/^[\w-]{40,50}$/.test(binder)) binder = randomToken();
  const res = json(neutral, 200, { 'set-cookie': setCookie(request, signinCookieName(request), binder, TOKEN_MINUTES * 60) });
  const t = now();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_tokens WHERE email = ? AND created_at > ?')
    .bind(email, addMinutes(t, -60)).first();
  if (recent.n >= LINKS_PER_HOUR) return res;   // same answer, no new link (test 9)

  const existing = await env.DB.prepare('SELECT id FROM breeders WHERE email = ?').bind(email).first();
  const token = randomToken();
  const code = randomCode();
  const purpose = existing ? 'signin' : 'signup';
  await env.DB.prepare(
    `INSERT INTO login_tokens (token_hash, email, breeder_id, purpose, signup_name, ip, created_at, expires_at, code_hash, browser_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(await sha256hex(token), email, existing?.id || null, purpose, clean(body.business_name, 120), ip, t, addMinutes(t, TOKEN_MINUTES),
    await sha256hex(`${binder}:${code}`), await sha256hex(binder)).run();
  const link = `${new URL(request.url).origin}/auth/verify?t=${encodeURIComponent(token)}`;
  ctx.waitUntil(sendMail(env, email, 'signin_link', { link, code, purpose }).catch((e) => console.error('sign-in mail failed', e)));
  if (env.EMAIL_MODE === 'log' && isLocal(request, env)) {
    // Test only: tie this address to this browser, so the mailbox can show it to them alone.
    let box = parseCookies(request).pc_mailbox;
    if (!box || !/^[\w-]{40,50}$/.test(box)) box = randomToken();
    await env.DB.prepare('INSERT OR IGNORE INTO dev_mailbox_owners (token, email, created_at) VALUES (?, ?, ?)').bind(box, email, t).run();
    res.headers.append('set-cookie', setCookie(request, 'pc_mailbox', box, 30 * 86400));
  }
  return res;
}

function signinCookieName(request) {
  return new URL(request.url).protocol === 'https:' ? '__Host-pc_signin' : 'pc_signin';
}

/** Six digits, every value equally likely. */
function randomCode() {
  const limit = 4294967296 - (4294967296 % 1000000);
  for (;;) {
    const n = crypto.getRandomValues(new Uint32Array(1))[0];
    if (n < limit) return String(n % 1000000).padStart(6, '0');
  }
}

/**
 * Plan P6.2. Sign in with the emailed code, in the browser that asked for it. The code is
 * checked only against this browser's live sign-in rows. A wrong code counts against every
 * one of them, and a row is spent (code and link together) after CODE_TRIES wrong codes. An
 * address also stops taking codes for a day after CODE_TRIES_PER_DAY wrong ones, which caps
 * guessing by someone who keeps asking for new codes, while its emailed links keep working.
 */
async function authCode(request, env) {
  requireSameOrigin(request);
  const body = await readJson(request);
  const code = String(body.code || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(code)) throw bad('The code is the six numbers in the email.');
  if (env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: `code:${request.headers.get('cf-connecting-ip') || 'local'}` });
    if (!success) throw new HttpError(429, 'Too many tries. Please wait a minute and try again.');
  }
  const binder = parseCookies(request)[signinCookieName(request)];
  const gone = 'That code has expired, or it was asked for in a different browser. Ask for a new one, or open the link in the email.';
  if (!binder || !/^[\w-]{40,50}$/.test(binder)) throw bad(gone);
  const browser = await sha256hex(binder);
  const t = now();
  let { results: live } = await env.DB.prepare(
    'SELECT token_hash, email, code_hash, code_tries FROM login_tokens WHERE browser_hash = ? AND used_at IS NULL AND expires_at > ? AND code_hash IS NOT NULL',
  ).bind(browser, t).all();
  if (!live.length) throw bad(gone);
  const emails = [...new Set(live.map((r) => r.email.toLowerCase()))];
  const { results: tries } = await env.DB.prepare(
    `SELECT lower(email) AS email, SUM(code_tries) AS n FROM login_tokens
      WHERE lower(email) IN (${emails.map(() => '?').join(',')}) AND created_at > ? GROUP BY lower(email)`,
  ).bind(...emails, addDays(t, -1)).all();
  const capped = new Set(tries.filter((r) => r.n >= CODE_TRIES_PER_DAY).map((r) => r.email));
  live = live.filter((r) => !capped.has(r.email.toLowerCase()));
  if (!live.length) throw new HttpError(429, 'Too many wrong codes have been tried for this address today. Open the link in the email instead.');
  const tooMany = 'That was too many wrong codes, so this code and its link no longer work. Please ask for a new one.';

  const want = await sha256hex(`${binder}:${code}`);
  const hit = live.find((r) => timingSafeEqual(r.code_hash, want));
  if (!hit) {
    await env.DB.prepare(
      `UPDATE login_tokens SET code_tries = code_tries + 1, used_at = CASE WHEN code_tries + 1 >= ? THEN ? ELSE used_at END
        WHERE browser_hash = ? AND used_at IS NULL AND expires_at > ? AND code_hash IS NOT NULL`,
    ).bind(CODE_TRIES, t, browser, t).run();
    if (live.every((r) => r.code_tries + 1 >= CODE_TRIES)) throw new HttpError(429, tooMany);
    throw bad('That code is not right. Check the email and try again.');
  }
  const used = await env.DB.prepare('UPDATE login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .bind(t, hit.token_hash, t).run();
  if (used.meta.changes !== 1) throw bad(gone);
  const tok = await env.DB.prepare('SELECT * FROM login_tokens WHERE token_hash = ?').bind(hit.token_hash).first();
  const breederId = await breederForVerifiedEmail(env, tok.email, { businessName: tok.signup_name, method: 'code' });
  const res = json({ ok: true }, 200, { 'set-cookie': await startSession(request, env, breederId) });
  res.headers.append('set-cookie', setCookie(request, signinCookieName(request), '', 0));
  return res;
}

/** A plain server-rendered page. wide is for reading pages such as the privacy policy. */
export function page(title, inner, { wide = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} | Puppy Connection</title><link rel="stylesheet" href="/portal.css?v=7"></head>
<body class="plain"><main class="plain-card${wide ? ' plain-wide' : ''}"><a class="plain-mark" href="/"><img src="/logo-white.webp?v=1" alt="Puppy Connection" width="420" height="203"></a>${inner}</main>
<footer class="plain-foot"><a href="/privacy">Privacy</a><a href="/terms">Listing terms</a></footer></body></html>`;
}

/** GET changes nothing, because mail scanners open links first (spec 6.2). */
function authVerifyPage(request) {
  const t = new URL(request.url).searchParams.get('t') || '';
  return html(page('Sign in', `<h1>Sign in to the breeder portal</h1>
<p>Press the button to finish signing in on this device.</p>
<form method="post" action="/auth/verify"><input type="hidden" name="t" value="${esc(t)}">
<button class="btn btn-primary" type="submit">Sign in</button></form>`));
}

async function authVerify(request, env) {
  requireSameOrigin(request);
  const form = await request.formData();
  const token = String(form.get('t') || '');
  const hash = await sha256hex(token);
  const t = now();
  const used = await env.DB.prepare('UPDATE login_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')
    .bind(t, hash, t).run();
  if (used.meta.changes !== 1) {
    return html(page('Link expired', `<h1>That link has expired</h1>
<p>Sign-in links work once and last 15 minutes. <a href="/">Ask for a new one</a>.</p>`), 400);
  }
  const tok = await env.DB.prepare('SELECT * FROM login_tokens WHERE token_hash = ?').bind(hash).first();
  const breederId = await breederForVerifiedEmail(env, tok.email, { businessName: tok.signup_name, method: 'email' });
  const cookie = await startSession(request, env, breederId);
  return redirect('/', 303, { 'set-cookie': cookie });
}

/**
 * The account for an email address that has just been proven, by an emailed link or by
 * Google. An existing breeder is signed in whatever their status, because approval and
 * suspension are enforced on every request after this. A new address becomes a pending
 * breeder, exactly as a first emailed sign-in does.
 */
async function breederForVerifiedEmail(env, email, { businessName = '', contactName = null, method }) {
  const t = now();
  const existing = await env.DB.prepare('SELECT id, email_verified_at FROM breeders WHERE email = ?').bind(email).first();
  if (existing) {
    const stmts = [auditStmt(env, 'breeder', email, `breeder.signin.${method}`, 'breeder', existing.id, null, null)];
    if (!existing.email_verified_at) stmts.push(env.DB.prepare('UPDATE breeders SET email_verified_at = ? WHERE id = ?').bind(t, existing.id));
    await env.DB.batch(stmts);
    return existing.id;
  }
  const id = ulid();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO breeders (id, email, status, email_verified_at, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?, ?)`)
      .bind(id, email, t, t, t),
    env.DB.prepare('INSERT INTO breeder_profiles (breeder_id, business_name, contact_name, updated_at) VALUES (?, ?, ?, ?)')
      .bind(id, businessName || '', contactName, t),
    auditStmt(env, 'breeder', email, 'breeder.signup', 'breeder', id, null, { email, method }),
  ]);
  return id;
}

// ------------------------------------------------------------------ Continue with Google (plan P6.1)

const GOOGLE_COOKIE = 'pc_google';
const googleRedirect = (request) => `${new URL(request.url).origin}/auth/google/callback`;

async function googleStart(request, env) {
  if (!googleEnabled(env)) throw notFound();
  if (env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: `ip:${request.headers.get('cf-connecting-ip') || 'local'}` });
    if (!success) throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
  }
  const { url, cookie } = await startUrl(env, googleRedirect(request));
  // state, nonce and the PKCE verifier stay in this browser for ten minutes, never in the URL.
  return redirect(url, 302, { 'set-cookie': setCookie(request, GOOGLE_COOKIE, cookie, 600) });
}

async function googleCallback(request, env) {
  if (!googleEnabled(env)) throw notFound();
  const url = new URL(request.url);
  const clear = setCookie(request, GOOGLE_COOKIE, '', 0);
  const fail = (why) => {
    console.warn('google sign-in refused:', why);
    return redirect('/?google=failed', 303, { 'set-cookie': clear });
  };
  if (url.searchParams.get('error')) return redirect('/?google=cancelled', 303, { 'set-cookie': clear });
  const [state, nonce, verifier] = String(parseCookies(request)[GOOGLE_COOKIE] || '').split('.');
  if (!state || url.searchParams.get('state') !== state) return fail('state does not match this browser');
  let claims;
  try {
    const idToken = await exchangeCode(env, url.searchParams.get('code') || '', verifier, googleRedirect(request));
    claims = await verifyWithGoogle(env, idToken, nonce);
  } catch (e) {
    return fail(e.message);
  }
  const email = String(claims.email).trim().toLowerCase();
  if (!EMAIL_RX.test(email)) return fail('email address not usable');
  const breederId = await breederForVerifiedEmail(env, email, { contactName: clean(claims.name, 120), method: 'google' });
  const session = await startSession(request, env, breederId);
  const res = redirect('/', 303, { 'set-cookie': session });
  res.headers.append('set-cookie', clear);
  return res;
}

// One Tap and Google's in-page button (plan P6.8). The page asks for a nonce, which is also
// kept in an HttpOnly cookie, hands it to Google, and posts back the ID token Google returns.
// The token is checked exactly as the redirect flow checks it, nonce included, so a token
// lifted from another site or another sign-in is refused.
const ONETAP_COOKIE = 'pc_gnonce';

async function oneTapNonce(request, env) {
  if (!googleEnabled(env)) throw notFound();
  const nonce = randomString();
  return json({ nonce, client_id: env.GOOGLE_CLIENT_ID }, 200, { 'set-cookie': setCookie(request, ONETAP_COOKIE, nonce, 600), 'cache-control': 'no-store' });
}

async function oneTapSignIn(request, env) {
  if (!googleEnabled(env)) throw notFound();
  requireSameOrigin(request);
  const { credential } = await readJson(request);
  const nonce = parseCookies(request)[ONETAP_COOKIE];
  const clear = setCookie(request, ONETAP_COOKIE, '', 0);
  if (!nonce) throw new HttpError(400, 'That sign-in took too long. Please try again.');
  let claims;
  try {
    claims = await verifyWithGoogle(env, String(credential || ''), nonce);
  } catch (e) {
    console.warn('one tap refused:', e.message);
    return json({ error: 'Google sign-in did not go through. Please try again.' }, 400, { 'set-cookie': clear });
  }
  const email = String(claims.email).trim().toLowerCase();
  if (!EMAIL_RX.test(email)) return json({ error: 'That Google account has no usable email address.' }, 400, { 'set-cookie': clear });
  const breederId = await breederForVerifiedEmail(env, email, { contactName: clean(claims.name, 120), method: 'google' });
  const res = json({ ok: true }, 200, { 'set-cookie': await startSession(request, env, breederId) });
  res.headers.append('set-cookie', clear);
  return res;
}

async function signOut(request, env) {
  requireSameOrigin(request);
  const s = await currentSession(request, env);
  if (s) await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ?').bind(now(), s.hash).run();
  return json({ ok: true }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
}

/** Sign out of every device, this one included (plan P6.3; P2.7 gives it a screen). */
async function signOutAll(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  const r = await env.DB.batch([
    env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND revoked_at IS NULL').bind(now(), breeder.id),
    auditStmt(env, 'breeder', breeder.email, 'breeder.signout_all', 'breeder', breeder.id, null, null),
  ]);
  return json({ ok: true, ended: r[0].meta.changes }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
}

// ------------------------------------------------------------------ profile

function publicBreeder(b, s) {
  return {
    id: b.id, email: b.email, status: b.status, profile_submitted_at: b.profile_submitted_at,
    terms_accepted_at: b.terms_accepted_at,
    profile: {
      business_name: b.business_name, slug: b.slug, contact_name: b.contact_name, public_phone: b.public_phone,
      public_email: b.public_email, website_url: b.website_url, city: b.city, state: b.state,
      description: b.description, version: b.profile_version,
    },
    fee_cents: s.feeCents, min_photos: s.minPhotos, max_photos: s.maxPhotos, terms_version: s.termsVersion,
    listing_days: s.listingDays, payments_mode: null,
  };
}

/** The public site's address, with no trailing slash, or '' when it is not set (plan P2.2). */
function siteOrigin(env) { return String(env.SITE_ORIGIN || '').replace(/\/+$/, ''); }

async function isPublicBreeder(env, breederId) {
  return !!(await env.DB.prepare('SELECT 1 AS x FROM public_breeders WHERE breeder_id = ?').bind(breederId).first());
}

async function me(request, env) {
  const { breeder } = await needSession(request, env);
  const s = await settings(env);
  const out = publicBreeder(breeder, s);
  out.payments_mode = env.PAYMENTS_MODE || 'off';
  out.test_notices = showTestNotices(env);
  out.mailbox = env.EMAIL_MODE === 'log' && isLocal(request, env);
  // Plan P2.3, the optional extras, and P2.2, the breeder's page on the site once it is public.
  out.extras = {
    facebook_url: breeder.facebook_url || null,
    breeds: await breederBreeds(env, breeder.id),
    logo_url: brandUrl('', breeder.id, 'logo', breeder.logo_key),
    kennel_url: brandUrl('', breeder.id, 'kennel', breeder.kennel_key),
  };
  out.site_origin = siteOrigin(env) || null;
  out.site_url = siteOrigin(env) && breeder.slug && await isPublicBreeder(env, breeder.id)
    ? `${siteOrigin(env)}/breeder.html?slug=${encodeURIComponent(siteBreederSlug(breeder))}` : null;
  return json(out);
}

async function saveProfile(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  if (!['pending', 'approved'].includes(breeder.status)) throw forbidden('Your profile cannot be changed right now.');
  const body = await readJson(request);
  const f = profileFields(body);
  const stmts = [
    profileStmt(env, breeder.id, f, body.version),
    auditStmt(env, 'breeder', breeder.email, 'profile.update', 'breeder', breeder.id, profileBefore(breeder), f),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  const res = await env.DB.batch(stmts);
  checkVersion(res[0], 'profile');
  noticeContactChange(env, ctx, breeder, f, 'breeder');
  return me(request, env);
}

async function submitProfile(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  if (breeder.status !== 'pending') throw bad('Only a pending account can be submitted.');
  const body = await readJson(request);
  if (body.accept_terms !== true) throw bad('Please accept the listing terms first.');
  const missing = [];
  if (!breeder.business_name) missing.push('business name');
  if (!breeder.public_phone && !breeder.public_email) missing.push('a public phone or email');
  if (!breeder.city || !breeder.state) missing.push('city and state');
  if (missing.length) throw bad(`Your profile still needs ${missing.join(', ')}.`);
  const s = await settings(env);
  const t = now();
  const first = !breeder.profile_submitted_at;
  await env.DB.batch([
    env.DB.prepare('UPDATE breeders SET terms_version = ?, terms_accepted_at = ?, profile_submitted_at = COALESCE(profile_submitted_at, ?), updated_at = ? WHERE id = ?')
      .bind(s.termsVersion, t, t, t, breeder.id),
    auditStmt(env, 'breeder', breeder.email, 'profile.submit', 'breeder', breeder.id, null, { terms_version: s.termsVersion }),
  ]);
  if (first) {
    const { results } = await env.DB.prepare('SELECT email FROM people').all();
    const adminUrl = `${env.ADMIN_ORIGIN || ''}/#/approvals/${breeder.id}`;
    for (const r of results) {
      ctx.waitUntil(sendMail(env, r.email, 'profile_submitted', { business: breeder.business_name, adminUrl }).catch((e) => console.error(e)));
    }
  }
  return me(request, env);
}

// ------------------------------------------------------------------ profile extras (plan P2.3)

function requireEditableProfile(breeder) {
  if (!['pending', 'approved'].includes(breeder.status)) throw forbidden('Your profile cannot be changed right now.');
}

/** The breeds they raise and their Facebook page, both optional. */
async function saveExtras(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireEditableProfile(breeder);
  const body = await readJson(request);
  const facebook = facebookUrl(body.facebook_url);
  const ids = Array.isArray(body.breed_ids) ? [...new Set(body.breed_ids.map(String))] : [];
  if (ids.length > 20) throw bad('Choose up to 20 breeds.');
  if (ids.length) {
    const { results } = await env.DB.prepare(`SELECT id FROM breeds WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
    if (results.length !== ids.length) throw bad('Choose breeds from the list.');
  }
  const before = { facebook_url: breeder.facebook_url || null, breeds: (await breederBreeds(env, breeder.id)).map((b) => b.id) };
  const t = now();
  const stmts = [
    env.DB.prepare('UPDATE breeder_profiles SET facebook_url = ?, updated_at = ? WHERE breeder_id = ?').bind(facebook, t, breeder.id),
    env.DB.prepare('DELETE FROM breeder_breeds WHERE breeder_id = ?').bind(breeder.id),
    ...ids.map((id) => env.DB.prepare('INSERT INTO breeder_breeds (breeder_id, breed_id) VALUES (?, ?)').bind(breeder.id, id)),
    auditStmt(env, 'breeder', breeder.email, 'profile.extras', 'breeder', breeder.id, before, { facebook_url: facebook, breeds: ids }),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  // A changed Facebook page is a public contact link, so it gets the same notice as P6.6.
  if (breeder.profile_submitted_at && (breeder.facebook_url || null) !== facebook) {
    ctx.waitUntil(sendMail(env, breeder.email, 'contact_changed', {
      business: breeder.business_name, by: 'breeder', portalUrl: env.PORTAL_ORIGIN || '',
      changes: [{ field: 'facebook_url', label: 'Facebook page', from: breeder.facebook_url || null, to: facebook }],
    }).catch((e) => console.error('contact change notice failed', e)));
  }
  return me(request, env);
}

/** Upload or replace the logo or the kennel photo. The old file is removed from R2 afterwards. */
async function uploadBrand(request, env, ctx, kind) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireEditableProfile(breeder);
  const col = BRAND[kind];
  const raw = new Uint8Array(await request.arrayBuffer());
  const img = cleanImage(raw);
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[img.type];
  const key = `brand/${breeder.id}/${kind}-${ulid()}.${ext}`;
  await env.FILES.put(key, img.bytes, { httpMetadata: { contentType: img.type } });
  const old = breeder[col];
  const stmts = [
    env.DB.prepare(`UPDATE breeder_profiles SET ${col} = ?, updated_at = ? WHERE breeder_id = ?`).bind(key, now(), breeder.id),
    auditStmt(env, 'breeder', breeder.email, `profile.${kind}.add`, 'breeder', breeder.id, old ? { key: old } : null, { key, bytes: img.bytes.length }),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  if (old) await env.FILES.delete([old, cardKey(old)]);
  return json({ ok: true, url: brandUrl('', breeder.id, kind, key) }, 201);
}

async function uploadBrandCard(request, env, ctx, kind) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireEditableProfile(breeder);
  const key = breeder[BRAND[kind]];
  if (!key) throw bad('Upload the image first.');
  const img = cleanImage(new Uint8Array(await request.arrayBuffer()));
  if (!img.size || Math.max(img.size.w, img.size.h) > CARD_MAX_EDGE) throw bad(`A card copy can be up to ${CARD_MAX_EDGE} pixels on its longest side.`);
  await env.FILES.put(cardKey(key), img.bytes, { httpMetadata: { contentType: img.type } });
  return json({ ok: true }, 201);
}

async function removeBrand(request, env, ctx, kind) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireEditableProfile(breeder);
  const col = BRAND[kind];
  const old = breeder[col];
  if (!old) return json({ ok: true });
  const stmts = [
    env.DB.prepare(`UPDATE breeder_profiles SET ${col} = NULL, updated_at = ? WHERE breeder_id = ?`).bind(now(), breeder.id),
    auditStmt(env, 'breeder', breeder.email, `profile.${kind}.remove`, 'breeder', breeder.id, { key: old }, null),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  await env.FILES.delete([old, cardKey(old)]);
  return json({ ok: true });
}

/** A breeder's logo or kennel photo. Public once the breeder is, and before that only to them. */
async function brandImage(request, env, kind, breederId) {
  const res = await serveBrand(env, breederId, kind, {
    card: new URL(request.url).searchParams.get('size') === 'card',
    allowPrivate: async () => { const s = await currentSession(request, env); return !!s && s.breeder.id === breederId; },
  });
  if (!res) throw notFound();
  return res;
}

const brandLogo = (r, e, c, id) => brandImage(r, e, 'logo', id);
const brandKennel = (r, e, c, id) => brandImage(r, e, 'kennel', id);

// ------------------------------------------------------------------ account (plan P2.7)

const openRequest = (env, breederId) => env.DB.prepare(
  `SELECT id, kind, reason, created_at FROM account_requests
    WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1`,
).bind(breederId).first();

async function account(request, env) {
  const { breeder } = await needSession(request, env);
  const sessions = await env.DB.prepare('SELECT COUNT(*) AS n FROM sessions WHERE breeder_id = ? AND revoked_at IS NULL AND expires_at > ?')
    .bind(breeder.id, now()).first();
  return json({ email: breeder.email, created_at: breeder.created_at, sessions: sessions.n, close_request: await openRequest(env, breeder.id) });
}

/** Ask Puppy Connection to close the account. This records the request and deletes nothing. */
async function askToClose(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  if (await openRequest(env, breeder.id)) throw bad('You have already asked to close your account. Puppy Connection will be in touch.');
  const body = await readJson(request);
  const reason = clean(body.reason, 1000);
  const id = ulid();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO account_requests (id, breeder_id, kind, reason, created_at) VALUES (?, ?, 'close', ?, ?)").bind(id, breeder.id, reason, now()),
    auditStmt(env, 'breeder', breeder.email, 'account.close_request', 'breeder', breeder.id, null, { request: id }),
  ]);
  ctx.waitUntil(alertOps(env, `${breeder.business_name || breeder.email} asked to close their account`,
    `${breeder.business_name || breeder.email} asked Puppy Connection to close their breeder account.${reason ? `\n\nTheir reason: ${reason}` : ''}\n\nNothing has been removed. Open the breeder in the admin to follow up:\n${env.ADMIN_ORIGIN || ''}/#/breeders?status=closing`)
    .catch((e) => console.error(e)));
  return account(request, env);
}

async function withdrawClose(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  const open = await openRequest(env, breeder.id);
  if (!open) throw bad('There is no request to close your account.');
  await env.DB.batch([
    env.DB.prepare('UPDATE account_requests SET withdrawn_at = ? WHERE id = ? AND breeder_id = ?').bind(now(), open.id, breeder.id),
    auditStmt(env, 'breeder', breeder.email, 'account.close_withdrawn', 'breeder', breeder.id, { request: open.id }, null),
  ]);
  return account(request, env);
}

/** Views and clicks per puppy (plan P2.5), for this breeder only. */
async function myStats(request, env) {
  const { breeder } = await needSession(request, env);
  return json(await breederStats(env, breeder.id, 30));
}

// ------------------------------------------------------------------ litters and puppies

async function listBreeds(env) {
  const { results } = await env.DB.prepare('SELECT id, slug, name FROM breeds ORDER BY name').all();
  return json(results);
}

function num(v, max) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) throw bad('A number is out of range.');
  return n;
}

function isoDate(v) {
  const s = clean(v, 10);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw bad('Dates are YYYY-MM-DD.');
  return s;
}

function litterFields(body) {
  if (!body.breed_id) throw bad('Choose a breed.');
  return {
    breed_id: String(body.breed_id), born_on: isoDate(body.born_on), ready_on: isoDate(body.ready_on),
    mom_weight_lb: num(body.mom_weight_lb, 300), dad_weight_lb: num(body.dad_weight_lb, 300),
    description: clean(body.description, 4000),
  };
}

async function createLitter(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const f = litterFields(await readJson(request));
  const breed = await env.DB.prepare('SELECT id FROM breeds WHERE id = ?').bind(f.breed_id).first();
  if (!breed) throw bad('Choose a breed from the list.');
  const id = ulid();
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, breeder.id, f.breed_id, f.born_on, f.ready_on, f.mom_weight_lb, f.dad_weight_lb, f.description, t, t),
    auditStmt(env, 'breeder', breeder.email, 'litter.create', 'litter', id, null, f),
  ]);
  return json({ id }, 201);
}

async function hasPublic(env, whereSql, bind) {
  const r = await env.DB.prepare(`SELECT 1 AS x FROM public_puppies WHERE ${whereSql} LIMIT 1`).bind(bind).first();
  return !!r;
}

async function updateLitter(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const before = await owned(env, 'litter', id, breeder.id);
  const body = await readJson(request);
  const f = litterFields(body);
  const stmts = [
    env.DB.prepare(
      `UPDATE litters SET breed_id = ?, born_on = ?, ready_on = ?, mom_weight_lb = ?, dad_weight_lb = ?, description = ?,
         updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ? AND version = ?`,
    ).bind(f.breed_id, f.born_on, f.ready_on, f.mom_weight_lb, f.dad_weight_lb, f.description, now(), id, breeder.id, Number(body.version)),
    auditStmt(env, 'breeder', breeder.email, 'litter.update', 'litter', id, before, f),
  ];
  if (await hasPublic(env, 'litter_id = ?', id)) stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'litter');
  return json({ ok: true });
}

async function archiveLitter(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  await owned(env, 'litter', id, breeder.id);
  const t = now();
  const stmts = [
    env.DB.prepare('UPDATE litters SET archived_at = ?, updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ?').bind(t, t, id, breeder.id),
    env.DB.prepare("UPDATE puppies SET publication_state = 'archived', updated_at = ?, version = version + 1 WHERE litter_id = ? AND breeder_id = ?").bind(t, id, breeder.id),
    auditStmt(env, 'breeder', breeder.email, 'litter.archive', 'litter', id, null, null),
  ];
  if (await hasPublic(env, 'litter_id = ?', id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

function puppyFields(body) {
  const name = clean(body.name, 80);
  if (!name) throw bad('Give the puppy a name.');
  const sex = body.sex ? String(body.sex) : null;
  if (sex && !['male', 'female'].includes(sex)) throw bad('Sex is male or female.');
  const availability = body.availability ? String(body.availability) : 'available';
  if (!['available', 'pending', 'placed'].includes(availability)) throw bad('Status is available, pending or placed.');
  const url = clean(body.breeder_url, 400);
  if (url && !/^https?:\/\//i.test(url)) throw bad('The link to your site needs to start with https://');
  const includes = Array.isArray(body.includes) ? body.includes.map((x) => clean(x, 80)).filter(Boolean).slice(0, 15) : [];
  return {
    name, sex, color: clean(body.color, 60), price_cents: cents(body.price), deposit_cents: cents(body.deposit),
    description: clean(body.description, 4000), breeder_url: url, includes_json: JSON.stringify(includes), availability,
  };
}

async function createPuppy(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const body = await readJson(request);
  const litter = await owned(env, 'litter', String(body.litter_id || ''), breeder.id);
  if (litter.archived_at) throw bad('That litter has been removed.');
  const f = puppyFields(body);
  const breed = await env.DB.prepare('SELECT name FROM breeds WHERE id = ?').bind(litter.breed_id).first();
  const id = ulid();
  const slug = `${slugify(`${f.name} ${breed.name}`)}-${id.slice(-6).toLowerCase()}`;
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO puppies (id, breeder_id, litter_id, slug, name, sex, color, price_cents, deposit_cents, description,
         breeder_url, includes_json, availability, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, breeder.id, litter.id, slug, f.name, f.sex, f.color, f.price_cents, f.deposit_cents, f.description,
      f.breeder_url, f.includes_json, f.availability, t, t),
    auditStmt(env, 'breeder', breeder.email, 'puppy.create', 'puppy', id, null, f),
  ]);
  return json({ id }, 201);
}

// Plan P2.4. Faster entry for a whole litter.
const MAX_AT_ONCE = 15;

function newPuppySlug(name, breedName, id) {
  return `${slugify(`${name} ${breedName}`)}-${id.slice(-6).toLowerCase()}`;
}

/**
 * Add a litter's puppies in one step. The body gives how many girls, boys and puppies whose
 * sex is not set yet, and an optional shared price, deposit and color. Each puppy is named
 * "Girl 1", "Boy 1" or "Puppy 1" and so on, counting on from any already named that way, and
 * every field stays editable afterwards.
 */
async function addPuppies(request, env, ctx, litterId) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const litter = await owned(env, 'litter', litterId, breeder.id);
  if (litter.archived_at) throw bad('That litter has been removed.');
  const body = await readJson(request);
  const count = (v) => { const n = v === '' || v == null ? 0 : Number(v); if (!Number.isInteger(n) || n < 0 || n > MAX_AT_ONCE) throw bad(`Each count is a whole number up to ${MAX_AT_ONCE}.`); return n; };
  const groups = [['female', 'Girl', count(body.girls)], ['male', 'Boy', count(body.boys)], [null, 'Puppy', count(body.unknown)]];
  const total = groups.reduce((n, g) => n + g[2], 0);
  if (!total) throw bad('Say how many puppies to add.');
  if (total > MAX_AT_ONCE) throw bad(`Add up to ${MAX_AT_ONCE} puppies at a time.`);
  const shared = { price_cents: cents(body.price), deposit_cents: cents(body.deposit), color: clean(body.color, 60) };
  const breed = await env.DB.prepare('SELECT name FROM breeds WHERE id = ?').bind(litter.breed_id).first();
  const { results: names } = await env.DB.prepare("SELECT name FROM puppies WHERE litter_id = ? AND breeder_id = ? AND publication_state != 'archived'")
    .bind(litter.id, breeder.id).all();
  const t = now();
  const ids = [];
  const stmts = [];
  for (const [sex, word, n] of groups) {
    const rx = new RegExp(`^${word} (\\d+)$`);
    let next = names.reduce((m, r) => { const k = rx.exec(r.name); return k ? Math.max(m, Number(k[1])) : m; }, 0);
    for (let i = 0; i < n; i += 1) {
      next += 1;
      const id = ulid();
      const name = `${word} ${next}`;
      ids.push(id);
      stmts.push(env.DB.prepare(
        `INSERT INTO puppies (id, breeder_id, litter_id, slug, name, sex, color, price_cents, deposit_cents, includes_json, availability, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'available', ?, ?)`,
      ).bind(id, breeder.id, litter.id, newPuppySlug(name, breed.name, id), name, sex, shared.color, shared.price_cents, shared.deposit_cents, t, t));
    }
  }
  stmts.push(auditStmt(env, 'breeder', breeder.email, 'puppy.create_many', 'litter', litter.id, null, { ids, ...shared }));
  await env.DB.batch(stmts);
  return json({ ids }, 201);
}

/** A copy of a puppy in the same litter, as a draft with no photos, named "<name> copy". */
async function duplicatePuppy(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const src = await owned(env, 'puppy', id, breeder.id);
  if (src.publication_state === 'archived') throw bad('That puppy has been removed.');
  const litter = await owned(env, 'litter', src.litter_id, breeder.id);
  if (litter.archived_at) throw bad('That litter has been removed.');
  const breed = await env.DB.prepare('SELECT name FROM breeds WHERE id = ?').bind(litter.breed_id).first();
  const newId = ulid();
  const name = `${src.name} copy`.slice(0, 80);
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO puppies (id, breeder_id, litter_id, slug, name, sex, color, price_cents, deposit_cents, description,
         breeder_url, includes_json, hypoallergenic, availability, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)`,
    ).bind(newId, breeder.id, litter.id, newPuppySlug(name, breed.name, newId), name, src.sex, src.color, src.price_cents, src.deposit_cents,
      src.description, src.breeder_url, src.includes_json, src.hypoallergenic, t, t),
    auditStmt(env, 'breeder', breeder.email, 'puppy.duplicate', 'puppy', newId, null, { from: src.id }),
  ]);
  return json({ id: newId }, 201);
}

/** Mark a puppy available, pending or placed straight from the list. */
async function setAvailability(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const before = await owned(env, 'puppy', id, breeder.id);
  if (before.publication_state === 'archived') throw bad('That puppy has been removed.');
  const body = await readJson(request);
  const availability = String(body.availability || '');
  if (!['available', 'pending', 'placed'].includes(availability)) throw bad('Status is available, pending or placed.');
  const stmts = [
    env.DB.prepare('UPDATE puppies SET availability = ?, updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ? AND version = ?')
      .bind(availability, now(), id, breeder.id, Number(body.version)),
    auditStmt(env, 'breeder', breeder.email, 'puppy.availability', 'puppy', id, { availability: before.availability }, { availability }),
  ];
  if (await hasPublic(env, 'id = ?', id)) stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'puppy');
  return json({ ok: true });
}

async function updatePuppy(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const before = await owned(env, 'puppy', id, breeder.id);
  if (before.publication_state === 'archived') throw bad('That puppy has been removed.');
  const body = await readJson(request);
  const f = puppyFields(body);
  const stmts = [
    env.DB.prepare(
      `UPDATE puppies SET name = ?, sex = ?, color = ?, price_cents = ?, deposit_cents = ?, description = ?, breeder_url = ?,
         includes_json = ?, availability = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND breeder_id = ? AND version = ?`,
    ).bind(f.name, f.sex, f.color, f.price_cents, f.deposit_cents, f.description, f.breeder_url, f.includes_json,
      f.availability, now(), id, breeder.id, Number(body.version)),
    auditStmt(env, 'breeder', breeder.email, 'puppy.update', 'puppy', id, before, f),
  ];
  if (await hasPublic(env, 'id = ?', id)) stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'puppy');
  return json({ ok: true });
}

async function archivePuppy(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  await owned(env, 'puppy', id, breeder.id);
  const wasPublic = await hasPublic(env, 'id = ?', id);
  const stmts = [
    env.DB.prepare("UPDATE puppies SET publication_state = 'archived', updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ?")
      .bind(now(), id, breeder.id),
    auditStmt(env, 'breeder', breeder.email, 'puppy.archive', 'puppy', id, null, null),
  ];
  if (wasPublic) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

// ------------------------------------------------------------------ photos

async function uploadPhoto(request, env, ctx, puppyId) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const puppy = await owned(env, 'puppy', puppyId, breeder.id);
  if (puppy.publication_state === 'archived') throw bad('That puppy has been removed.');
  const s = await settings(env);
  const count = (await env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(MAX(position), -1) AS last FROM photos WHERE puppy_id = ?').bind(puppyId).first());
  if (count.n >= s.maxPhotos) throw bad(`A puppy can have up to ${s.maxPhotos} photos.`);
  const raw = new Uint8Array(await request.arrayBuffer());
  const img = cleanImage(raw);
  const id = ulid();
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[img.type];
  const key = `uploads/${breeder.id}/${id}.${ext}`;
  await env.FILES.put(key, img.bytes, { httpMetadata: { contentType: img.type } });
  const aspect = img.size && img.size.h ? Math.round((img.size.w / img.size.h) * 1000) / 1000 : null;
  const stmts = [
    env.DB.prepare(
      `INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, bytes, position, aspect, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, breeder.id, puppyId, key, img.type, img.bytes.length, count.last + 1, aspect, now()),
    auditStmt(env, 'breeder', breeder.email, 'photo.add', 'puppy', puppyId, null, { photo: id, bytes: img.bytes.length, stripped: raw.length - img.bytes.length }),
  ];
  if (await hasPublic(env, 'id = ?', puppyId)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ id, url: `/media/${id}`, stripped_bytes: raw.length - img.bytes.length }, 201);
}

async function deletePhoto(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const photo = await owned(env, 'photo', id, breeder.id);
  const stmts = [
    env.DB.prepare('DELETE FROM photos WHERE id = ? AND breeder_id = ?').bind(id, breeder.id),
    auditStmt(env, 'breeder', breeder.email, 'photo.remove', 'puppy', photo.puppy_id, { photo: id }, null),
  ];
  if (await hasPublic(env, 'id = ?', photo.puppy_id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  if (photo.r2_key) await env.FILES.delete([photo.r2_key, cardKey(photo.r2_key)]);
  return json({ ok: true });
}

// The card copy is a second, smaller file the portal makes in the browser at upload, so a
// listing card or a thumbnail never downloads the full photo. It sits beside the full copy
// in R2, and a photo without one is served at full size.
const CARD_MAX_EDGE = 1000;
function cardKey(key) { return `${key}.card`; }

async function uploadCard(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const photo = await owned(env, 'photo', id, breeder.id);
  if (!photo.r2_key) throw bad('That photo has no uploaded file.');
  const img = cleanImage(new Uint8Array(await request.arrayBuffer()));
  if (!img.size || Math.max(img.size.w, img.size.h) > CARD_MAX_EDGE) throw bad(`A card copy can be up to ${CARD_MAX_EDGE} pixels on its longest side.`);
  await env.FILES.put(cardKey(photo.r2_key), img.bytes, { httpMetadata: { contentType: img.type } });
  return json({ ok: true, bytes: img.bytes.length }, 201);
}

async function orderPhotos(request, env, ctx, puppyId) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  await owned(env, 'puppy', puppyId, breeder.id);
  const { ids } = await readJson(request);
  const { results } = await env.DB.prepare('SELECT id FROM photos WHERE puppy_id = ? AND breeder_id = ?').bind(puppyId, breeder.id).all();
  const mine = new Set(results.map((r) => r.id));
  if (!Array.isArray(ids) || ids.length !== mine.size || !ids.every((x) => mine.has(x))) throw bad('That photo order does not match this puppy.');
  const stmts = ids.map((pid, i) => env.DB.prepare('UPDATE photos SET position = ? WHERE id = ? AND breeder_id = ?').bind(i, pid, breeder.id));
  if (await hasPublic(env, 'id = ?', puppyId)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

/** A photo is served to its owner, or to anyone once its puppy is public. */
async function media(request, env, ctx, id, card) {
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo || !photo.r2_key) throw notFound();
  const pub = await env.DB.prepare('SELECT 1 AS x FROM public_puppies WHERE id = ?').bind(photo.puppy_id).first();
  if (!pub) {
    const s = await currentSession(request, env);
    if (!s || s.breeder.id !== photo.breeder_id) throw notFound();
  }
  const obj = (card && await env.FILES.get(cardKey(photo.r2_key))) || await env.FILES.get(photo.r2_key);
  if (!obj) throw notFound();
  // A photo id never changes its file, so a public one can sit in the browser for a day.
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || photo.content_type || 'application/octet-stream',
      'cache-control': pub ? 'public, max-age=86400' : 'private, no-store',
    },
  });
}

// ------------------------------------------------------------------ listings and payment

async function listings(request, env) {
  const { breeder } = await needSession(request, env);
  const litters = await littersWithPuppies(env, breeder.id);
  const s = await settings(env);
  const pubIds = new Set((await env.DB.prepare('SELECT id FROM public_puppies WHERE breeder_id = ?').bind(breeder.id).all()).results.map((r) => r.id));
  // Plan P2.5, this breeder's views and clicks per puppy over the last 30 days.
  const counts = Object.fromEntries((await breederStats(env, breeder.id, 30)).puppies.map((r) => [r.id, r]));
  const site = siteOrigin(env);
  for (const l of litters) {
    for (const p of l.puppies) {
      p.photos = p.photos.map((ph) => ({ id: ph.id, url: photoUrl(ph), position: ph.position }));
      p.is_public = pubIds.has(p.id);
      p.pay_block = breeder.status === 'approved' ? await payability(env, p, s, p.photos.length, p.held_by) : 'Account not approved.';
      // Plan P2.1. Everything a draft is missing, not only the first thing payability() names.
      p.needs = [];
      if (p.price_cents == null) p.needs.push('a price');
      const short = s.minPhotos - p.photos.length;
      if (short > 0) p.needs.push(short === 1 ? (p.photos.length ? 'one more photo' : 'a photo') : `${short} more photos`);
      // Plan P2.2. Where buyers see this puppy, once it is live.
      p.site_url = site && p.is_public ? `${site}/puppy.html?slug=${encodeURIComponent(p.slug)}` : null;
      p.views = counts[p.id]?.views || 0;
      p.clicks = counts[p.id]?.clicks || 0;
    }
  }
  return json({ litters, fee_cents: s.feeCents, listing_days: s.listingDays, warn_days: s.warnDays, min_photos: s.minPhotos });
}

async function startCheckout(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const body = await readJson(request);
  const out = await createCheckout(env, breeder, body.puppy_ids, new URL(request.url).origin);
  return json(out, 201);
}

async function myCheckouts(request, env) {
  const { breeder } = await needSession(request, env);
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.status, c.quantity, c.amount_total_cents, c.created_at, c.paid_at,
            (SELECT group_concat(p.name, ', ') FROM checkout_items i JOIN puppies p ON p.id = i.puppy_id WHERE i.checkout_id = c.id) AS puppies
       FROM checkouts c WHERE c.breeder_id = ? ORDER BY c.created_at DESC LIMIT 100`,
  ).bind(breeder.id).all();
  return json(results);
}

/** The success page runs fulfillment too, so a slow webhook never leaves a paid breeder waiting (spec 8.5). */
async function checkoutSuccess(request, env, ctx) {
  const s = await currentSession(request, env);
  if (!s) return redirect('/');
  const sessionId = new URL(request.url).searchParams.get('session_id') || '';
  const co = await env.DB.prepare('SELECT id FROM checkouts WHERE stripe_session_id = ? AND breeder_id = ?').bind(sessionId, s.breeder.id).first();
  if (!co) return redirect('/#/listings');
  const r = await fulfillCheckout(env, sessionId, 'success_page', ctx);
  return redirect(`/#/listings?paid=${encodeURIComponent(co.id)}&result=${encodeURIComponent(r.status)}`);
}

async function checkoutCancel(request, env) {
  const s = await currentSession(request, env);
  if (!s) return redirect('/');
  const id = new URL(request.url).searchParams.get('c') || '';
  const co = await env.DB.prepare('SELECT * FROM checkouts WHERE id = ? AND breeder_id = ?').bind(id, s.breeder.id).first();
  if (co && co.status === 'open' && !co.fulfilled_at) {
    await provider(env).expireSession(env, co.stripe_session_id);
    await releaseCheckout(env, co.id, 'expired');
  }
  return redirect('/#/pay?canceled=1');
}

// ------------------------------------------------------------------ simulated Stripe (local only)

async function simAllowed(request, env, sessionId) {
  if (env.PAYMENTS_MODE !== 'sim' || !isLocal(request, env)) throw notFound();
  const s = await currentSession(request, env);
  const co = await env.DB.prepare('SELECT breeder_id FROM checkouts WHERE stripe_session_id = ?').bind(sessionId).first();
  if (!s || !co || co.breeder_id !== s.breeder.id) throw notFound();
}

async function simCheckoutPage(request, env, ctx, id) {
  await simAllowed(request, env, id);
  const s = await sim.retrieveSession(env, id);
  const money = (c) => `$${(c / 100).toFixed(2)}`;
  const q = s.line_items.data[0].quantity;
  if (s.status !== 'open') {
    return html(page('Checkout closed', `<h1>This checkout is ${esc(s.status)}</h1><p><a href="/#/listings">Back to your listings</a></p>`));
  }
  // The lost-webhook button tests the success-page backstop, so it shows only where the
  // screens admit to being a test copy (not in staging, plan P7.3).
  const lostWebhook = showTestNotices(env) ? `<form method="post" action="/sim/checkout/${esc(s.id)}/pay"><input type="hidden" name="webhook" value="0">
<button class="btn" type="submit">Pay, but lose the webhook (tests the success-page backstop)</button></form>` : '';
  return html(page('Practice checkout', `<p class="sim-flag">Practice checkout. No card is charged.</p>
<h1>Pay to list</h1>
<table class="sim-table"><tr><td>Puppy listing x ${q}</td><td>${money(s.line_items.data[0].price.unit_amount)} each</td></tr>
<tr class="sim-total"><td>Total</td><td>${money(s.amount_total)}</td></tr></table>
<p class="muted">Billed to ${esc(s.customer_email)}. This practice checkout closes ${esc(new Date(s.expires_at * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Indiana/Indianapolis' }))} Indiana time.</p>
<form method="post" action="/sim/checkout/${esc(s.id)}/pay"><input type="hidden" name="webhook" value="1">
<button class="btn btn-primary" type="submit">Pay ${money(s.amount_total)} (practice card)</button></form>
${lostWebhook}<form method="post" action="/sim/checkout/${esc(s.id)}/cancel"><button class="btn btn-quiet" type="submit">Cancel and go back</button></form>`));
}

async function simPay(request, env, ctx, id) {
  await simAllowed(request, env, id);
  requireSameOrigin(request);
  const form = await request.formData();
  const event = await sim.pay(env, id);
  if (form.get('webhook') === '1') await handleEvent(env, event, ctx);
  return redirect(event.data.object.success_url.replace('{CHECKOUT_SESSION_ID}', encodeURIComponent(id)));
}

async function simCancel(request, env, ctx, id) {
  await simAllowed(request, env, id);
  requireSameOrigin(request);
  const s = await sim.retrieveSession(env, id);
  return redirect(s.cancel_url);
}

// ------------------------------------------------------------------ webhook

async function stripeWebhook(request, env, ctx) {
  if (env.PAYMENTS_MODE !== 'stripe' || !env.STRIPE_WEBHOOK_SECRET) throw notFound();
  let event;
  try { event = await verifyStripe(request, env.STRIPE_WEBHOOK_SECRET); } catch (e) {
    return json({ error: e.message }, 400);
  }
  const result = await handleEvent(env, event, ctx);
  return json({ received: true, result });
}

// ------------------------------------------------------------------ local mailbox

/** In the open test portal, only the mail for addresses this browser signed up with. */
function mailboxScope(request, env) {
  if (!isOpenHosted(env)) return { where: '', binds: [] };
  const box = parseCookies(request).pc_mailbox || '-';
  return { where: 'WHERE to_addr IN (SELECT email FROM dev_mailbox_owners WHERE token = ?)', binds: [box] };
}

async function devMail(request, env) {
  if (!isLocal(request, env) || env.EMAIL_MODE !== 'log') throw notFound();
  const scope = mailboxScope(request, env);
  const { results } = await env.DB.prepare(`SELECT * FROM dev_mailbox ${scope.where} ORDER BY id DESC LIMIT 50`).bind(...scope.binds).all();
  const rows = results.map((m) => `<article class="mail"><header><b>${esc(m.subject)}</b><span>${esc(m.to_addr)} at ${esc(m.sent_at)}</span></header>
<pre>${esc(m.body)}</pre>${m.link ? `<a class="btn btn-primary" href="${esc(m.link)}">Open the link</a>` : ''}</article>`).join('');
  return html(page('Test mailbox', `<p class="sim-flag">Test mailbox. Nothing is really emailed. This shows the mail for addresses you signed up with in this browser.</p>
<h1>Mail</h1>${rows || '<p>No mail yet. Sign up or ask for a sign-in link first, and it appears here.</p>'}<p><a href="/">Back to the portal</a></p>`));
}

async function devMailJson(request, env) {
  if (!isLocal(request, env) || env.EMAIL_MODE !== 'log') throw notFound();
  const to = new URL(request.url).searchParams.get('to');
  const scope = mailboxScope(request, env);
  const where = [scope.where.replace(/^WHERE /, ''), to ? 'to_addr = ?' : ''].filter(Boolean).join(' AND ');
  const { results } = await env.DB.prepare(`SELECT * FROM dev_mailbox ${where ? `WHERE ${where}` : ''} ORDER BY id DESC LIMIT 20`)
    .bind(...scope.binds, ...(to ? [to] : [])).all();
  return json(results);
}

// ------------------------------------------------------------------ public config for the sign-in page

function config(request, env) {
  return json({
    turnstile_site_key: env.TURNSTILE_SITE_KEY || null,
    google: googleEnabled(env),
    local: isLocal(request, env),
    // Plan P7.3. notices is whether to say this is a test copy. mailbox is whether the test
    // mailbox exists, which follows EMAIL_MODE alone, so staging keeps it until real email.
    notices: showTestNotices(env),
    mailbox: env.EMAIL_MODE === 'log' && isLocal(request, env),
    email_mode: env.EMAIL_MODE || 'off',
    payments_mode: env.PAYMENTS_MODE || 'off',
  });
}

// ------------------------------------------------------------------ router

const ROUTES = [
  ['POST', /^\/auth\/start$/, authStart],
  ['GET', /^\/auth\/verify$/, (r) => authVerifyPage(r)],
  ['POST', /^\/auth\/verify$/, authVerify],
  ['POST', /^\/auth\/code$/, authCode],
  ['POST', /^\/auth\/signout$/, signOut],
  ['POST', /^\/auth\/signout-all$/, signOutAll],
  ['GET', /^\/auth\/google$/, googleStart],
  ['GET', /^\/auth\/google\/callback$/, googleCallback],
  ['GET', /^\/auth\/google\/nonce$/, oneTapNonce],
  ['POST', /^\/auth\/google\/onetap$/, oneTapSignIn],
  ['GET', /^\/api\/config$/, config],
  ['GET', /^\/privacy$/, (r, e) => html(page('Privacy policy', privacyPage(e), { wide: true }))],
  ['GET', /^\/terms$/, async (r, e) => html(page('Listing terms', termsPage(e, await settings(e)), { wide: true }))],
  ['GET', /^\/api\/me$/, me],
  ['PUT', /^\/api\/profile$/, saveProfile],
  ['POST', /^\/api\/profile\/submit$/, submitProfile],
  ['PUT', /^\/api\/profile\/extras$/, saveExtras],
  ['POST', /^\/api\/profile\/(logo|kennel)$/, uploadBrand],
  ['POST', /^\/api\/profile\/(logo|kennel)\/card$/, uploadBrandCard],
  ['DELETE', /^\/api\/profile\/(logo|kennel)$/, removeBrand],
  ['GET', /^\/brand\/([\w-]+)\/logo$/, brandLogo],
  ['GET', /^\/brand\/([\w-]+)\/kennel$/, brandKennel],
  ['GET', /^\/api\/account$/, account],
  ['POST', /^\/api\/account\/close$/, askToClose],
  ['POST', /^\/api\/account\/close\/withdraw$/, withdrawClose],
  ['GET', /^\/api\/stats$/, myStats],
  ['GET', /^\/api\/breeds$/, (r, e) => listBreeds(e)],
  ['GET', /^\/api\/listings$/, listings],
  ['POST', /^\/api\/litters$/, createLitter],
  ['PUT', /^\/api\/litters\/([\w-]+)$/, updateLitter],
  ['POST', /^\/api\/litters\/([\w-]+)\/archive$/, archiveLitter],
  ['POST', /^\/api\/litters\/([\w-]+)\/puppies$/, addPuppies],
  ['POST', /^\/api\/puppies$/, createPuppy],
  ['POST', /^\/api\/puppies\/([\w-]+)\/duplicate$/, duplicatePuppy],
  ['PUT', /^\/api\/puppies\/([\w-]+)\/availability$/, setAvailability],
  ['PUT', /^\/api\/puppies\/([\w-]+)$/, updatePuppy],
  ['POST', /^\/api\/puppies\/([\w-]+)\/archive$/, archivePuppy],
  ['POST', /^\/api\/puppies\/([\w-]+)\/photos$/, uploadPhoto],
  ['PUT', /^\/api\/puppies\/([\w-]+)\/photo-order$/, orderPhotos],
  ['DELETE', /^\/api\/photos\/([\w-]+)$/, deletePhoto],
  ['POST', /^\/api\/photos\/([\w-]+)\/card$/, uploadCard],
  ['GET', /^\/media\/([\w-]+)$/, media],
  ['GET', /^\/media\/([\w-]+)\/card$/, (r, e, c, id) => media(r, e, c, id, true)],
  ['POST', /^\/api\/checkouts$/, startCheckout],
  ['GET', /^\/api\/checkouts$/, myCheckouts],
  ['GET', /^\/checkout\/success$/, checkoutSuccess],
  ['GET', /^\/checkout\/cancel$/, checkoutCancel],
  ['GET', /^\/sim\/checkout\/([\w-]+)$/, simCheckoutPage],
  ['POST', /^\/sim\/checkout\/([\w-]+)\/pay$/, simPay],
  ['POST', /^\/sim\/checkout\/([\w-]+)\/cancel$/, simCancel],
  ['POST', /^\/stripe\/webhook$/, stripeWebhook],
  ['GET', /^\/dev\/mail$/, devMail],
  ['GET', /^\/dev\/mail\.json$/, devMailJson],
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const locked = gate(request, env);
    if (locked) return locked;
    try {
      for (const [method, rx, fn] of ROUTES) {
        const m = url.pathname.match(rx);
        if (!m) continue;
        if (request.method !== method) continue;
        // Every handler takes (request, env, ctx, id), with id from the route when it has one.
        const res = withHeaders(await fn(request, env, ctx, m[1]), SECURITY_HEADERS);
        // A renewed session refreshes its cookie (plan P6.3), unless the handler set or
        // cleared the session cookie itself, or the response may be cached publicly.
        const renewed = RENEWED.get(request);
        if (renewed && !(res.headers.get('set-cookie') || '').includes(`${sessionCookieName(request)}=`)
          && !/public/.test(res.headers.get('cache-control') || '')) res.headers.append('set-cookie', renewed);
        return res;
      }
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) throw notFound();
      const asset = await env.ASSETS.fetch(new Request(new URL(url.pathname === '/' ? '/index.html' : url.pathname, url), request));
      return withHeaders(asset, SECURITY_HEADERS);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, ...(e.extra || {}) }, e.status);
      console.error(e);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  },
  // The two cron triggers in wrangler.jsonc (lib/jobs.js says which job runs when).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(event, env).then((r) => console.log('jobs', JSON.stringify(r))));
  },
};
