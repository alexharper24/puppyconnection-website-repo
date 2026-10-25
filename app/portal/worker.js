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
import { addSubscriber, unsubscribeToken } from '../lib/subscribers.js';
import {
  owned, loadBreeder, requireApproved, settings, auditStmt, dirtyStmt, checkVersion,
  littersWithPuppies, photoUrl, profileFields, profileStmt, profileBefore, noticeContactChange,
  BRAND, facebookUrl, breederBreeds, brandUrl, serveBrand, litterFields, puppyFields, currentTerms, termsNeedAccept,
  PUPPY_EDIT_COLS, puppySet, puppyValues, referenceFields, referenceStmt, loadReference, REFERENCE_ROLES,
} from '../lib/store.js';
import { sendMail, noticeTo, noticeOps, alertOps, alertOnce, failTest } from '../lib/mail.js';
import { siteBreederSlug } from '../lib/export.js';
import { breederStats } from '../lib/stats.js';
import { scheduled as runScheduled } from '../lib/jobs.js';
import { publishSite } from '../lib/publish.js';
import { exportSite } from '../lib/shape.js';
import {
  provider, sim, createCheckout, releaseCheckout, fulfillCheckout, handleEvent, verifyStripe, payability,
} from '../lib/payments.js';
import { cleanImage } from '../lib/images.js';
import { reportTarget, reportForm, saveReport } from '../lib/reports.js';
import { photoCheckMode, checkPhoto, reasonText } from '../lib/photocheck.js';
import { photoPassedStmts, scheduleFor, inactivitySettings } from '../lib/inactivity.js';
import {
  streamMode, createUpload, refreshVideo, removeVideo, videoUrls, simUpload, simServe, MAX_UPLOAD_BYTES,
} from '../lib/stream.js';
import { googleEnabled, startUrl, exchangeCode, verifyWithGoogle, randomString } from '../lib/google.js';
import {
  parentFields, PARENT_EDIT_COLS, checkLitterParents, parentsFor, documentsFor, storeDocument, moveDocument, DOC_KINDS, MAX_DOCS, MAX_DOC_BYTES,
  healthCatalog,
} from '../lib/parents.js';
import { serveParentPhoto, serveDocument } from '../lib/media.js';
import {
  personFor, credentialFor, kennelPeople, checkNewPerson, addPersonStmts, removePersonStmts, makeMainStmts, newAuthToken,
  spendAuthToken, peekAuthToken, sendInvitation, hashPassword, checkPassword, passwordProblem, useSecondFactor, failureState,
  failureStmt, sealSecret, openSecret, base32, otpauthUri, matchTotp, newRecoveryCodes, accessStmts, ACCESS_HOW, MAX_MEMBERS,
  RESET_MINUTES, VERIFY_HOURS, MFA_MINUTES, OPERATOR_SESSION_HOURS, INVITE_DAYS,
} from '../lib/accounts.js';

/// Plan P6.3. A session lasts 60 days from its last renewal. Using it more than a day into
// its current window pushes the end out to 60 days from now and refreshes the cookie, so an
// active breeder stays signed in and an idle one is signed out after 60 days.
const SESSION_DAYS = 60;
// Launch workplan A26. Emails (sign-up confirmations and password resets) one address gets an hour.
const LINKS_PER_HOUR = 5;
// Wrong authenticator codes allowed on one sign-in or one set-password link before it is spent.
const CODE_TRIES = 5;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ipOf = (request) => request.headers.get('cf-connecting-ip') || 'local';

// ------------------------------------------------------------------ sessions

// The refreshed session cookie for a request whose session was renewed, added to the
// response by the router (fetch, below) unless the handler set the session cookie itself.
const RENEWED = new WeakMap();

/**
 * The signed-in kennel, or null. breeder.actor is who the audit log names for a write made in this
 * session: the breeder's own address, or, in a session an operator opened through the admin's
 * Manage as this breeder (workplan A24), "<operator> acting for <business>" as an operator.
 */
async function currentSession(request, env) {
  const token = parseCookies(request)[sessionCookieName(request)];
  if (!token) return null;
  const hash = await sha256hex(token);
  const s = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(hash).first();
  const t = now();
  if (!s || s.revoked_at || s.expires_at <= t) return null;
  const breeder = await loadBreeder(env, s.breeder_id);
  if (!breeder) return null;
  if (s.operator_email) {
    // An operator's session lasts while the breeder's access stays on and the operator is still one.
    // Turning access off also revokes it (lib/accounts.js accessStmts), so this is the second lock.
    if (!breeder.manage_access) return null;
    const person = await env.DB.prepare('SELECT name FROM people WHERE email = ?').bind(s.operator_email).first();
    if (!person) return null;
    breeder.actor = ['operator', `${s.operator_email} acting for ${breeder.business_name || breeder.email}`];
    return { hash, breeder, email: breeder.email, operator: { email: s.operator_email, name: person.name, until: s.expires_at } };
  }
  if (s.expires_at < addDays(t, SESSION_DAYS - 1)) {
    const r = await env.DB.prepare('UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
      .bind(addDays(t, SESSION_DAYS), t, hash).run();
    if (r.meta.changes === 1) RENEWED.set(request, setCookie(request, sessionCookieName(request), token, SESSION_DAYS * 86400));
  } else if (s.last_seen_at < addMinutes(t, -5)) {
    await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').bind(t, hash).run();
  }
  breeder.actor = ['breeder', breeder.email];
  return { hash, breeder, email: s.email || breeder.email, operator: null };
}

/** Who the audit log names for a write, [actor_type, actor]. */
const who = (breeder) => breeder.actor || ['breeder', breeder.email];

async function needSession(request, env) {
  const s = await currentSession(request, env);
  if (!s) throw new HttpError(401, 'Please sign in.');
  return s;
}

/**
 * A session the breeder opened themselves. Passwords, the authenticator, Puppy Connection access,
 * the people on the kennel and closing the account are the breeder's own, so an operator session
 * cannot change them (workplan A24). The admin has its own screens for people and access.
 */
async function needOwnSession(request, env) {
  const s = await needSession(request, env);
  if (s.operator) throw forbidden('Only the breeder can change this, signed in as themselves. Use the admin for people and access.');
  return s;
}

async function startSession(request, env, breederId, email = null, { operator = null } = {}) {
  const token = randomToken();
  const t = now();
  if (operator) {
    // Workplan A24. Hours, not 60 days, never renewed, and it neither counts as the breeder's
    // first sign-in nor starts an imported breeder's inactivity clock.
    const hours = OPERATOR_SESSION_HOURS;
    await env.DB.prepare('INSERT INTO sessions (token_hash, breeder_id, created_at, expires_at, last_seen_at, email, operator_email) VALUES (?, ?, ?, ?, ?, NULL, ?)')
      .bind(await sha256hex(token), breederId, t, addMinutes(t, hours * 60), t, operator).run();
    return setCookie(request, sessionCookieName(request), token, hours * 3600);
  }
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (token_hash, breeder_id, created_at, expires_at, last_seen_at, email) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(await sha256hex(token), breederId, t, addDays(t, SESSION_DAYS), t, email),
    // Workplan A2. The first sign-in starts the inactivity clock for an imported Wix breeder.
    env.DB.prepare('UPDATE breeders SET first_signin_at = ? WHERE id = ? AND first_signin_at IS NULL').bind(t, breederId),
  ]);
  return setCookie(request, sessionCookieName(request), token, SESSION_DAYS * 86400);
}

// ------------------------------------------------------------------ sign-in (launch workplan A26)

async function verifyTurnstile(request, env, token, action = 'auth') {
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
  if (!out.success || !hostOk || (out.action && out.action !== action)) {
    throw bad('The security check did not pass. Please try again.');
  }
}

async function limit(env, key, message = 'Too many requests. Please wait a minute and try again.') {
  if (!env.AUTH_LIMITER) return;
  const { success } = await env.AUTH_LIMITER.limit({ key });
  if (!success) throw new HttpError(429, message);
}

/** Test only: tie an address to this browser, so the test mailbox shows its mail to this browser alone. */
async function claimMailbox(request, env, email, res) {
  if (env.EMAIL_MODE !== 'log' || !isLocal(request, env)) return;
  let box = parseCookies(request).pc_mailbox;
  if (!box || !/^[\w-]{40,50}$/.test(box)) box = randomToken();
  await env.DB.prepare('INSERT OR IGNORE INTO dev_mailbox_owners (token, email, created_at) VALUES (?, ?, ?)').bind(box, email, now()).run();
  res.headers.append('set-cookie', setCookie(request, 'pc_mailbox', box, 30 * 86400));
}

const readEmail = (v) => {
  const email = String(v || '').trim().toLowerCase();
  if (!EMAIL_RX.test(email) || email.length > 200) throw bad('Enter a valid email address.');
  return email;
};

/** At most LINKS_PER_HOUR sign-up and reset emails to one address an hour, answered the same way. */
async function tooManyLinks(env, email) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM auth_tokens WHERE email = ? AND purpose IN ('verify','reset') AND created_at > ?")
    .bind(email, addMinutes(now(), -60)).first();
  return r.n >= LINKS_PER_HOUR;
}

async function emailLink(request, env, ctx, { email, purpose, breederId = null, signupName = null, minutes, template }) {
  const { token, stmts } = await newAuthToken(env, { purpose, email, breederId, signupName, ip: ipOf(request), minutes });
  await env.DB.batch(stmts);
  const link = `${new URL(request.url).origin}/auth/set-password?t=${encodeURIComponent(token)}`;
  ctx.waitUntil(sendMail(env, email, template, { link }).catch((e) => console.error(`${template} mail failed`, e)));
}

/**
 * Sign-up. A new address gets a link that proves it is theirs and opens the page that sets the
 * password, and the account is made only when that page is used, so nobody can claim an address
 * they cannot read. An address that already signs in gets a password link instead. The answer is
 * the same either way, so the form never says whether an address has an account.
 */
async function authSignup(request, env, ctx) {
  const body = await readJson(request);
  const email = readEmail(body.email);
  await verifyTurnstile(request, env, body.turnstile_token);
  await limit(env, `signup:${ipOf(request)}`);
  const res = json({ ok: true, message: 'Check your email. We sent a link to confirm the address and choose your password. It works once and stops working after 24 hours.' });
  if (!(await tooManyLinks(env, email))) {
    const person = await personFor(env, email);
    if (person) await emailLink(request, env, ctx, { email, purpose: 'reset', breederId: person.breeder_id, minutes: RESET_MINUTES, template: 'password_reset' });
    else await emailLink(request, env, ctx, { email, purpose: 'verify', signupName: clean(body.business_name, 120), minutes: VERIFY_HOURS * 60, template: 'signup_verify' });
  }
  await claimMailbox(request, env, email, res);
  return res;
}

/** Forgot password, and the way an existing breeder with no password sets their first one. */
async function authForgot(request, env, ctx) {
  requireSameOrigin(request);
  const body = await readJson(request);
  const email = readEmail(body.email);
  await limit(env, `forgot:${ipOf(request)}`);
  const res = json({ ok: true, message: 'If that address signs in to Puppy Connection, we sent it a link to set a password. The link works once and stops working after 1 hour.' });
  if (!(await tooManyLinks(env, email))) {
    const person = await personFor(env, email);
    if (person) await emailLink(request, env, ctx, { email, purpose: 'reset', breederId: person.breeder_id, minutes: RESET_MINUTES, template: 'password_reset' });
  }
  await claimMailbox(request, env, email, res);
  return res;
}

/** A wrong password or code: counted for the address and the network address. */
async function lockedOut(env, email, ip) {
  const f = await failureState(env, email, ip);
  return f.email || f.ip;
}
const LOCKED = 'Too many wrong tries. Wait 15 minutes and try again, or use Forgot password to set a new password.';

/**
 * Sign in with an email and password. With an authenticator set up, a right password returns a
 * five-minute ticket and the code is asked for next (authTotp). An address with no password, or
 * none at all, still costs one hash, so the answer takes as long either way.
 */
async function authPassword(request, env) {
  requireSameOrigin(request);
  const body = await readJson(request);
  const email = readEmail(body.email);
  const ip = ipOf(request);
  if (await lockedOut(env, email, ip)) throw new HttpError(429, LOCKED);
  const person = await personFor(env, email);
  const cred = person ? await credentialFor(env, email) : null;
  const r = await checkPassword(env, String(body.password || '').slice(0, 200), cred && cred.password_hash);
  if (!person || !r.ok) {
    await failureStmt(env, email, ip, 'password').run();
    throw bad('That email and password do not match. If you have never set a password, use Forgot password and we will email you a link to set one.');
  }
  const stmts = [];
  if (r.rehash) stmts.push(env.DB.prepare('UPDATE credentials SET password_hash = ?, updated_at = ? WHERE email = ?').bind(await hashPassword(env, String(body.password)), now(), email));
  if (cred.totp_enabled_at) {
    const { token, stmts: mint } = await newAuthToken(env, { purpose: 'mfa', email, breederId: person.breeder_id, ip, minutes: MFA_MINUTES });
    await env.DB.batch([...stmts, ...mint]);
    return json({ need_code: true, ticket: token });
  }
  if (stmts.length) await env.DB.batch(stmts);
  const breederId = await breederForVerifiedEmail(env, email, { method: 'password' });
  return json({ ok: true }, 200, { 'set-cookie': await startSession(request, env, breederId, email) });
}

/** The second step: the authenticator code, or one recovery code, for a ticket from authPassword. */
async function authTotp(request, env) {
  requireSameOrigin(request);
  const body = await readJson(request);
  const gone = 'That sign-in took too long. Enter your email and password again.';
  const row = await peekAuthToken(env, body.ticket, ['mfa']);
  if (!row) throw bad(gone);
  const ip = ipOf(request);
  if (await lockedOut(env, row.email, ip)) throw new HttpError(429, LOCKED);
  const person = await personFor(env, row.email);
  const cred = await credentialFor(env, row.email);
  if (!person || person.breeder_id !== row.breeder_id || !cred || !cred.totp_enabled_at) throw bad(gone);
  const used = await useSecondFactor(env, cred, body.code);
  if (!used.ok) {
    await env.DB.batch([
      failureStmt(env, row.email, ip, 'code'),
      env.DB.prepare('UPDATE auth_tokens SET tries = tries + 1, used_at = CASE WHEN tries + 1 >= ? THEN ? ELSE used_at END WHERE token_hash = ?').bind(CODE_TRIES, now(), row.token_hash),
    ]);
    if (row.tries + 1 >= CODE_TRIES) throw new HttpError(429, 'That was too many wrong codes. Enter your email and password again.');
    throw bad('That code is not right. Use the six numbers your authenticator app shows now, or one of your recovery codes.');
  }
  if (!(await spendAuthToken(env, body.ticket, ['mfa']))) throw bad(gone);
  const breederId = await breederForVerifiedEmail(env, row.email, { method: used.how === 'recovery' ? 'recovery_code' : 'authenticator' });
  const left = used.how === 'recovery'
    ? (await env.DB.prepare('SELECT COUNT(*) AS n FROM recovery_codes WHERE email = ? AND used_at IS NULL').bind(row.email).first()).n : null;
  return json({ ok: true, recovery_left: left }, 200, { 'set-cookie': await startSession(request, env, breederId, row.email) });
}

// Emailed sign-in codes and links are switched off (A26). An old link or a cached page gets a plain answer.
const NO_EMAIL_SIGNIN = 'Emailed sign-in codes and links are no longer used. Sign in with your password or with Google. If you have not set a password yet, use Forgot password on the sign-in page.';
const emailSigninGone = () => json({ error: NO_EMAIL_SIGNIN }, 410);
function oldLinkPage() {
  return html(page('Sign in', `<h1>Sign-in links are no longer used</h1><p>${esc(NO_EMAIL_SIGNIN)}</p><p><a class="btn btn-primary" href="/">Go to sign in</a></p>`), 410);
}

/** A plain server-rendered page. wide is for reading pages such as the privacy policy. */
// Workplan A11. The public site's address for the Visit site link on server pages, set from
// SITE_ORIGIN at the start of each request. It is the same for every request a deployment serves.
let PAGE_SITE = '';
const siteLink = () => (PAGE_SITE ? `<a class="plain-site" href="${esc(PAGE_SITE)}/">Visit site</a>` : '');

export function page(title, inner, { wide = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><meta name="robots" content="noindex,nofollow">
<title>${esc(title)} | Puppy Connection</title><link rel="stylesheet" href="/portal.css?v=20"></head>
<body class="plain">${siteLink()}<main class="plain-card${wide ? ' plain-wide' : ''}"><a class="plain-mark" href="/"><img src="/logo-white.webp?v=1" alt="Puppy Connection" width="420" height="203"></a>${inner}</main>
<footer class="plain-foot"><a href="/privacy">Privacy</a><a href="/terms">Listing terms</a></footer></body></html>`;
}

// ------------------------------------------------------------------ set a password (A25, A26)

const SET_PURPOSES = ['invite', 'reset', 'verify'];

function linkGonePage() {
  return html(page('Link expired', `<h1>That link has expired</h1>
<p>Each link works once. An invitation lasts 7 days, a new account link 24 hours and a password link 1 hour. On the <a href="/">sign-in page</a>, use Forgot password for a new one, or ask whoever invited you to send the invitation again.</p>`), 400);
}

async function setPasswordContext(env, row) {
  if (row.purpose === 'verify') return { heading: 'Choose your password', intro: 'Your email address is confirmed. Choose a password to finish creating your breeder account.' };
  const b = row.breeder_id ? await loadBreeder(env, row.breeder_id) : null;
  const name = (b && b.business_name) || 'your kennel';
  if (row.purpose === 'invite') return { heading: `Manage ${name} on Puppy Connection`, intro: `Choose a password to sign in to ${name} in the breeder portal.` };
  return { heading: 'Choose a new password', intro: `This sets the password you use to sign in to ${name}.` };
}

function passwordForm({ t, email, heading, intro, needCode, error }) {
  return html(page('Choose a password', `<h1>${esc(heading)}</h1><p>${esc(intro)}</p>
${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
<form method="post" action="/auth/set-password" class="set-password"><input type="hidden" name="t" value="${esc(t)}">
<input type="email" name="username" value="${esc(email)}" autocomplete="username" readonly hidden>
<p class="muted small">Signing in as <b>${esc(email)}</b></p>
<div class="field"><label for="pw1">New password</label><input id="pw1" name="password" type="password" autocomplete="new-password" minlength="10" maxlength="200" required></div>
<div class="field"><label for="pw2">The same password again</label><input id="pw2" name="confirm" type="password" autocomplete="new-password" minlength="10" maxlength="200" required></div>
<p class="hint">At least 10 characters. A few words together is easy to remember and hard to guess.</p>
${needCode ? '<div class="field"><label for="code">Code from your authenticator app</label><input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="12" required><p class="hint">Lost your phone? Type one of your recovery codes instead.</p></div>' : ''}
<button class="btn btn-primary" type="submit">Save password and sign in</button></form>`), error ? 400 : 200);
}

/** GET changes nothing, because mail scanners open links first. */
async function setPasswordPage(request, env) {
  const t = new URL(request.url).searchParams.get('t') || '';
  const row = await peekAuthToken(env, t, SET_PURPOSES);
  if (!row) return linkGonePage();
  const cred = row.purpose === 'verify' ? null : await credentialFor(env, row.email);
  return passwordForm({ t, email: row.email, ...(await setPasswordContext(env, row)), needCode: !!(cred && cred.totp_enabled_at) });
}

/**
 * Set the password from an invitation, a password link or a new account's confirmation link, and
 * sign in. With an authenticator set up the code is asked for too, so an email account alone
 * cannot take over a kennel. The link is spent only once everything on the page is right.
 */
async function setPassword(request, env) {
  requireSameOrigin(request);
  const form = await request.formData();
  const t = String(form.get('t') || '');
  const row = await peekAuthToken(env, t, SET_PURPOSES);
  if (!row) return linkGonePage();
  const person = await personFor(env, row.email);
  // An invitation or reset is for one kennel. If the address has since come off it, the link is dead.
  if (row.purpose !== 'verify' && (!person || person.breeder_id !== row.breeder_id)) return linkGonePage();
  const cred = person ? await credentialFor(env, row.email) : null;
  const needCode = !!(cred && cred.totp_enabled_at);
  const again = async (error) => passwordForm({ t, email: row.email, ...(await setPasswordContext(env, row)), needCode, error });
  const password = String(form.get('password') || '');
  const problem = passwordProblem(password);
  if (problem) return again(problem);
  if (password !== String(form.get('confirm') || '')) return again('The two passwords are not the same. Type the same password in both boxes.');
  if (needCode) {
    const ip = ipOf(request);
    if (await lockedOut(env, row.email, ip)) return again(LOCKED);
    const used = await useSecondFactor(env, cred, form.get('code'));
    if (!used.ok) {
      await env.DB.batch([
        failureStmt(env, row.email, ip, 'code'),
        env.DB.prepare('UPDATE auth_tokens SET tries = tries + 1, used_at = CASE WHEN tries + 1 >= ? THEN ? ELSE used_at END WHERE token_hash = ?').bind(CODE_TRIES, now(), row.token_hash),
      ]);
      if (row.tries + 1 >= CODE_TRIES) return linkGonePage();
      return again('That code is not right. Use the six numbers your authenticator app shows now, or one of your recovery codes.');
    }
  }
  if (!(await spendAuthToken(env, t, SET_PURPOSES))) return linkGonePage();
  const breederId = await breederForVerifiedEmail(env, row.email, { businessName: row.signup_name || '', method: `password_${row.purpose}` });
  const tnow = now();
  const stmts = [
    env.DB.prepare(
      `INSERT INTO credentials (email, breeder_id, password_hash, password_set_at, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET breeder_id = excluded.breeder_id, password_hash = excluded.password_hash, password_set_at = excluded.password_set_at, updated_at = excluded.updated_at`,
    ).bind(row.email, breederId, await hashPassword(env, password), tnow, tnow),
    auditStmt(env, 'breeder', row.email, 'account.password_set', 'breeder', breederId, null, { email: row.email, via: row.purpose }),
  ];
  // A reset ends this person's other sessions, in case the password was reset because someone else had it.
  if (row.purpose === 'reset') {
    const main = person && person.main;
    stmts.push(env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND revoked_at IS NULL AND operator_email IS NULL AND (email = ?${main ? ' OR email IS NULL' : ''})`)
      .bind(tnow, breederId, row.email));
  }
  await env.DB.batch(stmts);
  return redirect('/', 303, { 'set-cookie': await startSession(request, env, breederId, row.email) });
}

// ------------------------------------------------------------------ Manage as this breeder (A24)

/**
 * The admin mints a two-minute, one-time hand-over (admin/worker.js manageAs) for an operator
 * Cloudflare Access has identified, and sends their browser here. Only its SHA-256 is in D1, which
 * the two Workers share. The portal spends it once, checks again that the breeder's access is on
 * and that the operator is still in people, and opens an eight-hour session marked as theirs.
 */
async function authHandoff(request, env) {
  const t = new URL(request.url).searchParams.get('t') || '';
  const row = await spendAuthToken(env, t, ['handoff']);
  const refuse = (title, text, status) => html(page(title, `<h1>${esc(title)}</h1><p>${esc(text)}</p>`), status);
  if (!row || !row.operator_email) return refuse('That link has expired', 'Open the breeder in the admin again and press Manage as this breeder. The link works once, for two minutes.', 400);
  const breeder = await loadBreeder(env, row.breeder_id);
  if (!breeder || !breeder.manage_access) return refuse('Puppy Connection access is off', 'This breeder has not turned on Puppy Connection access, so the portal cannot be opened for them.', 403);
  if (!(await env.DB.prepare('SELECT 1 AS x FROM people WHERE email = ?').bind(row.operator_email).first())) return refuse('Not allowed', 'That address is no longer an operator.', 403);
  const cookie = await startSession(request, env, breeder.id, null, { operator: row.operator_email });
  await auditStmt(env, 'operator', row.operator_email, 'operator.session_start', 'breeder', breeder.id, null, { hours: OPERATOR_SESSION_HOURS }).run();
  return redirect('/', 303, { 'set-cookie': cookie });
}

/**
 * The account for an email address that has just been proven, by a password, an emailed link or
 * by Google. An existing breeder is signed in whatever their status, because approval and
 * suspension are enforced on every request after this. A new address becomes a pending
 * breeder.
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
  // Someone a breeder added to their kennel signs in to that kennel, never to a new account.
  const member = await env.DB.prepare('SELECT id, breeder_id, joined_at FROM breeder_members WHERE email = ?').bind(email).first();
  if (member) {
    const stmts = [auditStmt(env, 'breeder', email, `breeder.signin.${method}`, 'breeder', member.breeder_id, null, { member: member.id })];
    if (!member.joined_at) stmts.push(env.DB.prepare('UPDATE breeder_members SET joined_at = ? WHERE id = ?').bind(t, member.id));
    await env.DB.batch(stmts);
    return member.breeder_id;
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
  const session = await startSession(request, env, breederId, email);
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
  const res = json({ ok: true }, 200, { 'set-cookie': await startSession(request, env, breederId, email) });
  res.headers.append('set-cookie', clear);
  return res;
}

async function signOut(request, env) {
  requireSameOrigin(request);
  const s = await currentSession(request, env);
  if (s) {
    await env.DB.batch([
      env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ?').bind(now(), s.hash),
      // Workplan A24. End, on the banner of an operator's session, is recorded as theirs.
      ...(s.operator ? [auditStmt(env, 'operator', s.operator.email, 'operator.session_end', 'breeder', s.breeder.id, null, null)] : []),
    ]);
  }
  return json({ ok: true, back: s && s.operator && env.ADMIN_ORIGIN ? `${env.ADMIN_ORIGIN}/#/breeders/${encodeURIComponent(s.breeder.id)}` : null }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
}

/** Sign out of every device, this one included (plan P6.3; P2.7 gives it a screen). */
async function signOutAll(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needOwnSession(request, env);
  const r = await env.DB.batch([
    env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND revoked_at IS NULL').bind(now(), breeder.id),
    auditStmt(env, ...who(breeder), 'breeder.signout_all', 'breeder', breeder.id, null, null),
  ]);
  return json({ ok: true, ended: r[0].meta.changes }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
}

// ------------------------------------------------------------------ profile

function publicBreeder(b, s) {
  return {
    id: b.id, email: b.email, status: b.status, profile_submitted_at: b.profile_submitted_at,
    terms_accepted_at: b.terms_accepted_at, seller_confirmed_at: b.seller_confirmed_at || null,
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
  const sess = await needSession(request, env);
  const { breeder } = sess;
  const s = await settings(env);
  const out = publicBreeder(breeder, s);
  // Workplan A24. An operator's session carries a banner naming the kennel and the operator.
  out.operator = sess.operator;
  // Workplan A26. Recommend an authenticator to a person who has none, until they say Not now.
  const cred = sess.operator ? null : await credentialFor(env, sess.email);
  out.signed_in_as = sess.operator ? null : sess.email;
  out.authenticator_nudge = !sess.operator && !(cred && (cred.totp_enabled_at || cred.totp_nudge_dismissed_at));
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
  // Plan P3.4. The current listing terms, and whether this breeder has accepted that version.
  const terms = await currentTerms(env);
  out.terms = { version: terms.version, body: terms.body, published_at: terms.published_at, accepted_version: breeder.terms_version || null,
    needs_accept: termsNeedAccept(breeder, terms.version), seller_confirmed: !!breeder.seller_confirmed_at };
  out.site_origin = siteOrigin(env) || null;
  // Workplan A13. The reference a breeder names before approval, shown back to them while pending.
  out.reference_roles = REFERENCE_ROLES;
  out.reference = breeder.status === 'pending' ? await loadReference(env, breeder.id) : null;
  out.site_url = siteOrigin(env) && breeder.slug && await isPublicBreeder(env, breeder.id)
    ? sitePage(env, 'breeder', breeder.slug, siteBreederSlug(breeder)) : null;
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
    auditStmt(env, ...who(breeder), 'profile.update', 'breeder', breeder.id, profileBefore(breeder), f),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  const res = await env.DB.batch(stmts);
  checkVersion(res[0], 'profile');
  noticeContactChange(env, ctx, breeder, f, who(breeder)[0]);
  return me(request, env);
}

/**
 * Plan P3.4. Accept the current listing terms, after Puppy Connection publishes a new version.
 * Nothing is blocked while a breeder has not, so this only records the acceptance. A breeder who
 * has not confirmed they are the seller (workplan A6) ticks that box here too, and only once.
 */
// Workplan A6. The box a breeder ticks once, with the listing terms (Amber and Alex, 2026-10-24).
const SELLER_UNTICKED = 'Tick the box to confirm you are the seller of the puppies you list.';

async function acceptTerms(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needOwnSession(request, env);
  const body = await readJson(request);
  const terms = await currentTerms(env);
  if (body.version !== terms.version) throw new HttpError(409, 'The listing terms changed again. Reload to read the latest version.');
  if (!breeder.profile_submitted_at) throw bad('Accept the terms when you submit your profile.');
  if (!breeder.seller_confirmed_at && body.confirm_seller !== true) throw bad(SELLER_UNTICKED);
  const t = now();
  await env.DB.batch([
    env.DB.prepare('UPDATE breeders SET terms_version = ?, terms_accepted_at = ?, seller_confirmed_at = COALESCE(seller_confirmed_at, ?), updated_at = ? WHERE id = ?')
      .bind(terms.version, t, t, t, breeder.id),
    auditStmt(env, ...who(breeder), 'terms.accept', 'breeder', breeder.id, { terms_version: breeder.terms_version || null, seller_confirmed_at: breeder.seller_confirmed_at || null },
      { terms_version: terms.version, seller_confirmed_at: breeder.seller_confirmed_at || t }),
  ]);
  return me(request, env);
}

async function submitProfile(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder } = await needOwnSession(request, env);
  if (breeder.status !== 'pending') throw bad('Only a pending account can be submitted.');
  const body = await readJson(request);
  if (body.accept_terms !== true) throw bad('Please accept the listing terms first.');
  if (!breeder.seller_confirmed_at && body.confirm_seller !== true) throw bad(SELLER_UNTICKED);
  const missing = [];
  if (!breeder.business_name) missing.push('business name');
  if (!breeder.public_phone && !breeder.public_email) missing.push('a public phone or email');
  if (!breeder.city || !breeder.state) missing.push('city and state');
  if (missing.length) throw bad(`Your profile still needs ${missing.join(', ')}.`);
  // Workplan A13. Sign-up cannot finish without one reference who can confirm the breeder is real.
  const ref = referenceFields(body.reference);
  const s = await settings(env);
  const t = now();
  const first = !breeder.profile_submitted_at;
  await env.DB.batch([
    referenceStmt(env, breeder.id, ref),
    auditStmt(env, ...who(breeder), 'reference.save', 'breeder', breeder.id, null, { role: ref.role }),
    env.DB.prepare('UPDATE breeders SET terms_version = ?, terms_accepted_at = ?, seller_confirmed_at = COALESCE(seller_confirmed_at, ?), profile_submitted_at = COALESCE(profile_submitted_at, ?), updated_at = ? WHERE id = ?')
      .bind(s.termsVersion, t, t, t, t, breeder.id),
    auditStmt(env, ...who(breeder), 'profile.submit', 'breeder', breeder.id, null, { terms_version: s.termsVersion, seller_confirmed_at: breeder.seller_confirmed_at || t }),
  ]);
  if (first) {
    // Workplan B9. NOTICE_TO (info@puppy-connection.com) when set, otherwise every operator as before.
    const to = await noticeTo(env, 'SELECT email FROM people');
    const adminUrl = `${env.ADMIN_ORIGIN || ''}/#/approvals/${breeder.id}`;
    for (const addr of to) {
      ctx.waitUntil(sendMail(env, addr, 'profile_submitted', { business: breeder.business_name, adminUrl }).catch((e) => console.error(e)));
    }
  }
  return me(request, env);
}

/**
 * Workplan A13. A breeder still waiting for approval adds or corrects their reference. A breeder
 * who submitted before references were asked for adds one here, and the admin sees it at once.
 */
async function saveReference(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  if (breeder.status !== 'pending') throw forbidden('A reference is asked for only while an account waits for approval.');
  const ref = referenceFields(await readJson(request));
  await env.DB.batch([
    referenceStmt(env, breeder.id, ref),
    auditStmt(env, ...who(breeder), 'reference.save', 'breeder', breeder.id, null, { role: ref.role }),
  ]);
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
    auditStmt(env, ...who(breeder), 'profile.extras', 'breeder', breeder.id, before, { facebook_url: facebook, breeds: ids }),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  // A changed Facebook page is a public contact link, so it gets the same notice as P6.6.
  if (breeder.profile_submitted_at && (breeder.facebook_url || null) !== facebook) {
    ctx.waitUntil(sendMail(env, breeder.email, 'contact_changed', {
      business: breeder.business_name, by: who(breeder)[0], portalUrl: env.PORTAL_ORIGIN || '',
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
    auditStmt(env, ...who(breeder), `profile.${kind}.add`, 'breeder', breeder.id, old ? { key: old } : null, { key, bytes: img.bytes.length }),
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
    auditStmt(env, ...who(breeder), `profile.${kind}.remove`, 'breeder', breeder.id, { key: old }, null),
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

/// ------------------------------------------------------------------ account (plan P2.7)

const openRequest = (env, breederId) => env.DB.prepare(
  `SELECT id, kind, reason, created_at FROM account_requests
    WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1`,
).bind(breederId).first();

async function account(request, env) {
  const s = await needSession(request, env);
  const { breeder, email } = s;
  const sessions = await env.DB.prepare('SELECT COUNT(*) AS n FROM sessions WHERE breeder_id = ? AND revoked_at IS NULL AND expires_at > ? AND operator_email IS NULL')
    .bind(breeder.id, now()).first();
  const people = await kennelPeople(env, breeder.id);
  // Workplan A26. This person's own password and authenticator. An operator session sees neither.
  let security = null;
  if (!s.operator) {
    const cred = await credentialFor(env, email);
    const left = cred && cred.totp_enabled_at
      ? (await env.DB.prepare('SELECT COUNT(*) AS n FROM recovery_codes WHERE email = ? AND used_at IS NULL').bind(email.toLowerCase()).first()).n : 0;
    security = { password_set: !!(cred && cred.password_set_at), password_set_at: cred ? cred.password_set_at : null,
      authenticator: !!(cred && cred.totp_enabled_at), authenticator_since: cred ? cred.totp_enabled_at : null, recovery_left: left };
  }
  return json({ email: breeder.email, signed_in_as: email, created_at: breeder.created_at, sessions: sessions.n,
    members: people.filter((p) => !p.main).map((p) => ({ id: p.member_id, email: p.email, name: p.name, added_at: p.added_at, joined_at: p.joined_at,
      invited_at: p.invited_at, invite_open_until: p.invite_open_until, password_set: p.password_set })),
    max_members: MAX_MEMBERS, close_request: await openRequest(env, breeder.id),
    is_main: !s.operator && email.toLowerCase() === String(breeder.email).toLowerCase(),
    operator: s.operator, security,
    // Workplan A24. Whether Puppy Connection may open the portal as this kennel.
    access: { on: !!breeder.manage_access, by: breeder.manage_access_by, at: breeder.manage_access_at, how: breeder.manage_access_how } });
}

// ------------------------------------------------------------------ people in the kennel

// Amber, 2026-10-10: a kennel run by a couple or a family wants a sign-in for each person. Each
// extra person signs in with their own address and has the same access as the first. Since
// workplan A26 they get an invitation link that sets their password (lib/accounts.js).

/** Add a person who can sign in to this kennel with their own address, and email them their link. */
async function addMember(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder, email: by } = await needOwnSession(request, env);
  const body = await readJson(request);
  const email = await checkNewPerson(env, breeder, body.email);
  const { stmts } = addPersonStmts(env, breeder.id, email, body.name, by, who(breeder));
  await env.DB.batch(stmts);
  ctx.waitUntil(sendInvitation(env, { breeder, email, by, actor: who(breeder), portalOrigin: new URL(request.url).origin, template: 'member_added' })
    .catch((e) => console.error('member mail failed', e)));
  return account(request, env);
}

/** Remove a person from the kennel. Their sessions end at once and their links stop working. Their past changes stay in the log. */
async function removeMember(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder, email: by } = await needOwnSession(request, env);
  const m = await env.DB.prepare('SELECT id, email FROM breeder_members WHERE id = ? AND breeder_id = ?').bind(id, breeder.id).first();
  if (!m) throw notFound();
  await env.DB.batch(removePersonStmts(env, breeder.id, m, who(breeder)));
  if (String(by).toLowerCase() === m.email.toLowerCase()) {
    return json({ ok: true, signed_out: true }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
  }
  return account(request, env);
}

/**
 * Workplan A25. The main contact hands the kennel's main email to another person on it. The old
 * main address stays on as an extra person, or comes off with its sessions ended.
 */
async function makeMain(request, env, ctx, id) {
  requireSameOrigin(request);
  const s = await needOwnSession(request, env);
  const { breeder, email } = s;
  if (email.toLowerCase() !== String(breeder.email).toLowerCase()) throw forbidden('Only the main contact can hand the main email to someone else.');
  const m = await env.DB.prepare('SELECT id, email FROM breeder_members WHERE id = ? AND breeder_id = ?').bind(id, breeder.id).first();
  if (!m) throw notFound();
  const keepOld = (await readJson(request)).keep_old !== false;
  await env.DB.batch(makeMainStmts(env, breeder, m, { keepOld, addedBy: email, actor: who(breeder) }));
  if (!keepOld) return json({ ok: true, signed_out: true }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
  return account(request, env);
}

// ------------------------------------------------------------------ Puppy Connection access (A24)

async function setAccess(request, env) {
  requireSameOrigin(request);
  const { breeder, email } = await needOwnSession(request, env);
  const on = (await readJson(request)).on === true;
  if (on !== !!breeder.manage_access) {
    await env.DB.batch(accessStmts(env, breeder.id, on, { by: email, how: ACCESS_HOW.breeder, actor: who(breeder), before: breeder.manage_access }));
  }
  return account(request, env);
}

// ------------------------------------------------------------------ password and authenticator (A26)

const upsertCred = (env, email, breederId) => env.DB.prepare(
  `INSERT INTO credentials (email, breeder_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING`,
).bind(email.toLowerCase(), breederId, now());

/** Change the password, or set a first one for someone who signs in with Google. */
async function changePassword(request, env) {
  requireSameOrigin(request);
  const s = await needOwnSession(request, env);
  const email = s.email.toLowerCase();
  const body = await readJson(request);
  const cred = await credentialFor(env, email);
  if (cred && cred.password_hash) {
    const ip = ipOf(request);
    if (await lockedOut(env, email, ip)) throw new HttpError(429, LOCKED);
    const r = await checkPassword(env, String(body.current || '').slice(0, 200), cred.password_hash);
    if (!r.ok) { await failureStmt(env, email, ip, 'password').run(); throw bad('Your current password is not right.'); }
  }
  const problem = passwordProblem(body.password);
  if (problem) throw bad(problem);
  const t = now();
  await env.DB.batch([
    upsertCred(env, email, s.breeder.id),
    env.DB.prepare('UPDATE credentials SET password_hash = ?, password_set_at = ?, updated_at = ? WHERE email = ?').bind(await hashPassword(env, String(body.password)), t, t, email),
    // Every other session of this person ends, and this one carries on.
    env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND token_hash != ? AND revoked_at IS NULL AND operator_email IS NULL AND (email = ?${email === String(s.breeder.email).toLowerCase() ? ' OR email IS NULL' : ''})`)
      .bind(t, s.breeder.id, s.hash, email),
    auditStmt(env, 'breeder', email, 'account.password_change', 'breeder', s.breeder.id, null, { email }),
  ]);
  return account(request, env);
}

/** Start setting up an authenticator app. The secret waits in totp_pending until one code confirms it. */
async function authenticatorStart(request, env) {
  requireSameOrigin(request);
  const s = await needOwnSession(request, env);
  const email = s.email.toLowerCase();
  const secret = crypto.getRandomValues(new Uint8Array(20));
  await env.DB.batch([
    upsertCred(env, email, s.breeder.id),
    env.DB.prepare('UPDATE credentials SET totp_pending = ?, updated_at = ? WHERE email = ?').bind(await sealSecret(env, secret), now(), email),
  ]);
  const b32 = base32(secret);
  return json({ secret: b32.replace(/(.{4})/g, '$1 ').trim(), uri: otpauthUri(b32, email) });
}

/** Confirm the app with one code, turn the authenticator on and hand back ten recovery codes, once. */
async function authenticatorConfirm(request, env) {
  requireSameOrigin(request);
  const s = await needOwnSession(request, env);
  const email = s.email.toLowerCase();
  const cred = await credentialFor(env, email);
  if (!cred || !cred.totp_pending) throw bad('Start setting up the authenticator first.');
  const step = await matchTotp(await openSecret(env, cred.totp_pending), (await readJson(request)).code, -1);
  if (step == null) throw bad('That code is not right. Check the app shows Puppy Connection and type the six numbers it shows now.');
  const { codes, hashes } = await newRecoveryCodes();
  const t = now();
  await env.DB.batch([
    env.DB.prepare('UPDATE credentials SET totp_secret = totp_pending, totp_pending = NULL, totp_enabled_at = ?, totp_last_step = ?, updated_at = ? WHERE email = ?').bind(t, step, t, email),
    env.DB.prepare('DELETE FROM recovery_codes WHERE email = ?').bind(email),
    ...hashes.map((h) => env.DB.prepare('INSERT INTO recovery_codes (id, email, code_hash, created_at) VALUES (?, ?, ?, ?)').bind(ulid(), email, h, t)),
    auditStmt(env, 'breeder', email, 'account.authenticator_on', 'breeder', s.breeder.id, null, { email }),
  ]);
  return json({ ok: true, recovery_codes: codes });
}

/** Turn the authenticator off, with a code from it or a recovery code. */
async function authenticatorOff(request, env) {
  requireSameOrigin(request);
  const s = await needOwnSession(request, env);
  const email = s.email.toLowerCase();
  const cred = await credentialFor(env, email);
  if (!cred || !cred.totp_enabled_at) return account(request, env);
  const ip = ipOf(request);
  if (await lockedOut(env, email, ip)) throw new HttpError(429, LOCKED);
  const used = await useSecondFactor(env, cred, (await readJson(request)).code);
  if (!used.ok) { await failureStmt(env, email, ip, 'code').run(); throw bad('That code is not right. Use the six numbers your authenticator app shows now, or a recovery code.'); }
  await env.DB.batch([
    env.DB.prepare('UPDATE credentials SET totp_secret = NULL, totp_pending = NULL, totp_enabled_at = NULL, totp_last_step = NULL, updated_at = ? WHERE email = ?').bind(now(), email),
    env.DB.prepare('DELETE FROM recovery_codes WHERE email = ?').bind(email),
    auditStmt(env, 'breeder', email, 'account.authenticator_off', 'breeder', s.breeder.id, null, { email }),
  ]);
  return account(request, env);
}

/** Not now, on the recommendation to set up an authenticator. It does not come back for this person. */
async function authenticatorDismiss(request, env) {
  requireSameOrigin(request);
  const s = await needOwnSession(request, env);
  const email = s.email.toLowerCase();
  await env.DB.batch([
    upsertCred(env, email, s.breeder.id),
    env.DB.prepare('UPDATE credentials SET totp_nudge_dismissed_at = ?, updated_at = ? WHERE email = ?').bind(now(), now(), email),
  ]);
  return json({ ok: true });
}

/** Ask to close the account. This records the request and deletes nothing. */
async function askToClose(request, env, ctx) {
  requireSameOrigin(request);
  const { breeder } = await needOwnSession(request, env);
  if (await openRequest(env, breeder.id)) throw bad('You have already asked to close your account. Puppy Connection will be in touch.');
  const body = await readJson(request);
  const reason = clean(body.reason, 1000);
  const id = ulid();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO account_requests (id, breeder_id, kind, reason, created_at) VALUES (?, ?, 'close', ?, ?)").bind(id, breeder.id, reason, now()),
    auditStmt(env, ...who(breeder), 'account.close_request', 'breeder', breeder.id, null, { request: id }),
  ]);
  ctx.waitUntil(noticeOps(env, `${breeder.business_name || breeder.email} asked to close their account`,
    `${breeder.business_name || breeder.email} asked Puppy Connection to close their breeder account.${reason ? `\n\nTheir reason: ${reason}` : ''}\n\nNothing has been removed. Open the breeder in the admin to follow up:\n${env.ADMIN_ORIGIN || ''}/#/breeders?status=closing`)
    .catch((e) => console.error(e)));
  return account(request, env);
}

async function withdrawClose(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needOwnSession(request, env);
  const open = await openRequest(env, breeder.id);
  if (!open) throw bad('There is no request to close your account.');
  await env.DB.batch([
    env.DB.prepare('UPDATE account_requests SET withdrawn_at = ? WHERE id = ? AND breeder_id = ?').bind(now(), open.id, breeder.id),
    auditStmt(env, ...who(breeder), 'account.close_withdrawn', 'breeder', breeder.id, { request: open.id }, null),
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
  // The color and coat suggestions travel with each breed for the puppy editor (migrations/0009).
  const { results } = await env.DB.prepare('SELECT id, slug, name, colors, coats FROM breeds ORDER BY name').all();
  const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  return json(results.map((b) => ({ id: b.id, slug: b.slug, name: b.name, colors: list(b.colors), coats: list(b.coats) })));
}

// litterFields and puppyFields live in lib/store.js, shared with the admin (plan P3.1).

async function createLitter(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const f = await checkLitterParents(env, breeder.id, litterFields(await readJson(request)));
  const breed = await env.DB.prepare('SELECT id FROM breeds WHERE id = ?').bind(f.breed_id).first();
  if (!breed) throw bad('Choose a breed from the list.');
  const id = ulid();
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, mom_id, dad_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, breeder.id, f.breed_id, f.born_on, f.ready_on, f.mom_weight_lb, f.dad_weight_lb, f.description, f.mom_id, f.dad_id, t, t),
    auditStmt(env, ...who(breeder), 'litter.create', 'litter', id, null, f),
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
  const f = await checkLitterParents(env, breeder.id, litterFields(body), before);
  const stmts = [
    env.DB.prepare(
      `UPDATE litters SET breed_id = ?, born_on = ?, ready_on = ?, mom_weight_lb = ?, dad_weight_lb = ?, description = ?, mom_id = ?, dad_id = ?,
         updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ? AND version = ?`,
    ).bind(f.breed_id, f.born_on, f.ready_on, f.mom_weight_lb, f.dad_weight_lb, f.description, f.mom_id, f.dad_id, now(), id, breeder.id, Number(body.version)),
    auditStmt(env, ...who(breeder), 'litter.update', 'litter', id, before, f),
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
    auditStmt(env, ...who(breeder), 'litter.archive', 'litter', id, null, null),
  ];
  if (await hasPublic(env, 'litter_id = ?', id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

async function createPuppy(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const body = await readJson(request);
  const litter = await owned(env, 'litter', String(body.litter_id || ''), breeder.id);
  if (litter.archived_at) throw bad('That litter has been removed.');
  const f = puppyFields(body, (await settings(env)).registries);
  const breed = await env.DB.prepare('SELECT name FROM breeds WHERE id = ?').bind(litter.breed_id).first();
  const id = ulid();
  const slug = `${slugify(`${f.name} ${breed.name}`)}-${id.slice(-6).toLowerCase()}`;
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO puppies (id, breeder_id, litter_id, slug, ${PUPPY_EDIT_COLS.join(', ')}, created_at, updated_at)
       VALUES (?, ?, ?, ?, ${PUPPY_EDIT_COLS.map(() => '?').join(', ')}, ?, ?)`,
    ).bind(id, breeder.id, litter.id, slug, ...puppyValues(f), t, t),
    auditStmt(env, ...who(breeder), 'puppy.create', 'puppy', id, null, f),
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
  stmts.push(auditStmt(env, ...who(breeder), 'puppy.create_many', 'litter', litter.id, null, { ids, ...shared }));
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
      // Markings belong to one puppy, so they are not copied. The litter-wide details are.
      `INSERT INTO puppies (id, breeder_id, litter_id, slug, name, sex, color, coat, price_cents, deposit_cents, description,
         breeder_url, includes_json, hypoallergenic, availability, registry, health_notes, vaccinations, deworming, disclosures,
         deposit_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(newId, breeder.id, litter.id, newPuppySlug(name, breed.name, newId), name, src.sex, src.color, src.coat, src.price_cents, src.deposit_cents,
      src.description, src.breeder_url, src.includes_json, src.hypoallergenic, src.registry, src.health_notes, src.vaccinations,
      src.deworming, src.disclosures, src.deposit_url, t, t),
    auditStmt(env, ...who(breeder), 'puppy.duplicate', 'puppy', newId, null, { from: src.id }),
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
    auditStmt(env, ...who(breeder), 'puppy.availability', 'puppy', id, { availability: before.availability }, { availability }),
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
  // A registry since taken off the list stays valid on the puppy that already has it.
  const f = puppyFields(body, [...(await settings(env)).registries, before.registry]);
  const stmts = [
    env.DB.prepare(
      `UPDATE puppies SET ${puppySet()}, updated_at = ?, version = version + 1
       WHERE id = ? AND breeder_id = ? AND version = ?`,
    ).bind(...puppyValues(f), now(), id, breeder.id, Number(body.version)),
    auditStmt(env, ...who(breeder), 'puppy.update', 'puppy', id, before, f),
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
    auditStmt(env, ...who(breeder), 'puppy.archive', 'puppy', id, null, null),
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
  // Workplan A9. The photo waits for the quality check (POST /api/photos/<id>/check, which the
  // portal calls once the card copy is up, or the job every 15 minutes) unless the check is off.
  const quality = photoCheckMode(env) === 'off' ? null : 'pending';
  const stmts = [
    env.DB.prepare(
      `INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, bytes, position, aspect, width, height, created_at, quality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, breeder.id, puppyId, key, img.type, img.bytes.length, count.last + 1, aspect, img.size ? img.size.w : null, img.size ? img.size.h : null, now(), quality),
    auditStmt(env, ...who(breeder), 'photo.add', 'puppy', puppyId, null, { photo: id, bytes: img.bytes.length, stripped: raw.length - img.bytes.length }),
  ];
  // Workplan A12. With the check off a new photo counts at once. Otherwise it counts when it passes
  // (lib/photocheck.js), so a photo that is sent back keeps nothing on the site.
  if (!quality) stmts.push(...await photoPassedStmts(env, puppyId, now(), { type: who(breeder)[0], email: who(breeder)[1] }));
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
    auditStmt(env, ...who(breeder), 'photo.remove', 'puppy', photo.puppy_id, { photo: id }, null),
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

// ------------------------------------------------------------------ the photo-based schedule (workplan A12)

/**
 * The emailed Still available link of the old schedule (A2). Listings now stay up with a new photo,
 * so an old link only says so and opens the portal. It changes nothing.
 */
function stillAvailablePage() {
  return html(page('Add a new photo', `<h1>Listings now stay up with a new photo</h1>
<p>Puppy Connection keeps a listing on the site while it has a new photo at least every four weeks. Sign in to the breeder portal and add a photo to any listing that needs one.</p>
<p><a class="btn btn-primary" href="/#/litters">Breeder portal</a></p>`));
}

/** Workplan A9. Run the quality check on one of the breeder's photos and say what it found. */
async function checkMyPhoto(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  const photo = await owned(env, 'photo', id, breeder.id);
  // A test can ask the local stand-in for a verdict. Nothing else can choose one.
  const sim = isLocal(request, env) ? request.headers.get('x-sim-photo-check') : null;
  const s = await settings(env);
  const r = await checkPhoto(env, photo, s.photoCheckRoute, { sim });
  if (r.judged && r.quality !== 'pass') {
    await auditStmt(env, 'system', 'photo check', `photo.${r.quality}`, 'puppy', photo.puppy_id, null, { photo: id, reasons: r.reasons }).run();
  }
  return json({ quality: r.quality, reasons: r.reasons, messages: r.messages, route: s.photoCheckRoute });
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

// ------------------------------------------------------------------ puppy videos (workplan A3)

const videoOrigin = (request, env) => env.PORTAL_ORIGIN || new URL(request.url).origin;

/** A one-time Stream upload address for one video. The browser sends the file there itself. */
async function startVideo(request, env, ctx, puppyId) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  if (!streamMode(env)) throw bad('Video uploads are not switched on yet.');
  const puppy = await owned(env, 'puppy', puppyId, breeder.id);
  if (puppy.publication_state === 'archived') throw bad('That puppy has been removed.');
  const s = await settings(env);
  const have = await env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(MAX(position), -1) AS last FROM puppy_videos WHERE puppy_id = ? AND status != 'error'").bind(puppyId).first();
  if (have.n >= s.maxVideos) throw bad(s.maxVideos ? `A puppy can have up to ${s.maxVideos} ${s.maxVideos === 1 ? 'video' : 'videos'}.` : 'Videos are not open for listings.');
  const up = await createUpload(env, { maxSeconds: s.videoMaxSeconds, breederId: breeder.id, puppyId, portalOrigin: videoOrigin(request, env) });
  const id = ulid();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO puppy_videos (id, breeder_id, puppy_id, stream_uid, status, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, breeder.id, puppyId, up.uid, 'uploading', have.last + 1, now()),
    auditStmt(env, ...who(breeder), 'video.add', 'puppy', puppyId, null, { video: id }),
  ]);
  return json({ id, upload_url: up.uploadURL, max_bytes: MAX_UPLOAD_BYTES, max_seconds: s.videoMaxSeconds }, 201);
}

/** Called by the portal once the file is sent, and again while Stream is still working on it. */
async function checkVideo(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  const row = await owned(env, 'video', id, breeder.id);
  return json({ status: await refreshVideo(env, row) });
}

async function deleteVideo(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const row = await owned(env, 'video', id, breeder.id);
  await removeVideo(env, row.stream_uid);
  const stmts = [
    env.DB.prepare('DELETE FROM puppy_videos WHERE id = ? AND breeder_id = ?').bind(id, breeder.id),
    auditStmt(env, ...who(breeder), 'video.remove', 'puppy', row.puppy_id, { video: id }, null),
  ];
  if (row.status === 'ready' && await hasPublic(env, 'id = ?', row.puppy_id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

/** A photo is served to its owner, or to anyone once its puppy is public. */
async function media(request, env, ctx, id, card) {
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo || !photo.r2_key) throw notFound();
  // A photo the quality check sent back or is holding is served only to its breeder (workplan A9).
  const pub = (!photo.quality || photo.quality === 'pass') && await env.DB.prepare('SELECT 1 AS x FROM public_puppies WHERE id = ?').bind(photo.puppy_id).first();
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

// ------------------------------------------------------------------ moms and dads (workplan A19)

const isPublicParent = async (env, id) => !!(await env.DB.prepare('SELECT 1 AS x FROM public_parents WHERE id = ?').bind(id).first());

/** The breeder's saved moms and dads, with the health test list for each breed. */
async function parentsScreen(request, env) {
  const { breeder } = await needSession(request, env);
  const s = await settings(env);
  const site = (await env.DB.prepare('SELECT slug, name FROM breeds').all()).results;
  return json({ parents: await parentsFor(env, breeder.id), breeds: healthCatalog(site), registries: s.registries,
    doc_kinds: DOC_KINDS, max_doc_bytes: MAX_DOC_BYTES, max_docs: MAX_DOCS });
}

async function createParent(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const f = parentFields(await readJson(request), (await settings(env)).registries);
  const id = ulid();
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO parent_dogs (id, breeder_id, ${PARENT_EDIT_COLS.join(', ')}, created_at, updated_at)
       VALUES (?, ?, ${PARENT_EDIT_COLS.map(() => '?').join(', ')}, ?, ?)`,
    ).bind(id, breeder.id, ...PARENT_EDIT_COLS.map((c) => f[c] ?? null), t, t),
    auditStmt(env, ...who(breeder), 'parent.create', 'parent', id, null, f),
  ]);
  return json({ id }, 201);
}

async function updateParent(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const before = await owned(env, 'parent', id, breeder.id);
  const body = await readJson(request);
  // A registry since taken off the list stays valid on the parent that already has it.
  const f = parentFields(body, [...(await settings(env)).registries, before.registry]);
  if (f.sex !== before.sex && await env.DB.prepare('SELECT 1 AS x FROM litters WHERE mom_id = ? OR dad_id = ? LIMIT 1').bind(id, id).first()) {
    throw bad(`${before.name} is the ${before.sex === 'female' ? 'mom' : 'dad'} of a litter, so that cannot change.`);
  }
  const stmts = [
    env.DB.prepare(
      `UPDATE parent_dogs SET ${PARENT_EDIT_COLS.map((c) => `${c} = ?`).join(', ')}, updated_at = ?, version = version + 1
       WHERE id = ? AND breeder_id = ? AND version = ?`,
    ).bind(...PARENT_EDIT_COLS.map((c) => f[c] ?? null), now(), id, breeder.id, Number(body.version)),
    auditStmt(env, ...who(breeder), 'parent.update', 'parent', id, before, f),
  ];
  if (await isPublicParent(env, id)) stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'mom or dad');
  return json({ ok: true });
}

/** Take a parent out of the litter picker, or put it back. Litters that already name it keep it. */
async function archiveParent(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  await owned(env, 'parent', id, breeder.id);
  const off = (await readJson(request)).archived !== false;
  await env.DB.batch([
    env.DB.prepare('UPDATE parent_dogs SET archived_at = ?, updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ?').bind(off ? now() : null, now(), id, breeder.id),
    auditStmt(env, ...who(breeder), off ? 'parent.archive' : 'parent.restore', 'parent', id, null, null),
  ]);
  return json({ ok: true });
}

const PARENT_CARD_EDGE = 1000;

/** The parent's photo, shrunk in the browser as puppy photos are, with its metadata stripped here. */
async function uploadParentPhoto(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const p = await owned(env, 'parent', id, breeder.id);
  const img = cleanImage(new Uint8Array(await request.arrayBuffer()));
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[img.type];
  const key = `parents/${breeder.id}/${id}-${ulid().slice(-10).toLowerCase()}.${ext}`;
  await env.FILES.put(key, img.bytes, { httpMetadata: { contentType: img.type } });
  const stmts = [
    env.DB.prepare('UPDATE parent_dogs SET photo_key = ?, updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ?').bind(key, now(), id, breeder.id),
    auditStmt(env, ...who(breeder), 'parent.photo', 'parent', id, null, { bytes: img.bytes.length }),
  ];
  if (await isPublicParent(env, id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  if (p.photo_key) await env.FILES.delete([p.photo_key, `${p.photo_key}.card`]);
  return json({ ok: true }, 201);
}

async function uploadParentCard(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const p = await owned(env, 'parent', id, breeder.id);
  if (!p.photo_key) throw bad('Add the photo first.');
  const img = cleanImage(new Uint8Array(await request.arrayBuffer()));
  if (!img.size || Math.max(img.size.w, img.size.h) > PARENT_CARD_EDGE) throw bad(`A card copy can be up to ${PARENT_CARD_EDGE} pixels on its longest side.`);
  await env.FILES.put(`${p.photo_key}.card`, img.bytes, { httpMetadata: { contentType: img.type } });
  return json({ ok: true }, 201);
}

async function removeParentPhoto(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const p = await owned(env, 'parent', id, breeder.id);
  if (!p.photo_key) return json({ ok: true });
  const stmts = [
    env.DB.prepare('UPDATE parent_dogs SET photo_key = NULL, updated_at = ?, version = version + 1 WHERE id = ? AND breeder_id = ?').bind(now(), id, breeder.id),
    auditStmt(env, ...who(breeder), 'parent.photo.remove', 'parent', id, null, null),
  ];
  if (await isPublicParent(env, id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  await env.FILES.delete([p.photo_key, `${p.photo_key}.card`]);
  return json({ ok: true });
}

/** A parent photo is served to its breeder, or to anyone once the parent is on a public litter. */
async function parentPhoto(request, env, ctx, id, card) {
  const res = await serveParentPhoto(env, id, {
    card: !!card, allowPrivate: async (row) => { const s = await currentSession(request, env); return !!s && s.breeder.id === row.breeder_id; },
  });
  if (!res) throw notFound();
  return res;
}

// ------------------------------------------------------------------ documents (workplan A20)

/** Whether a document's puppy or parent is on the site now, so a change to it needs a publish. */
async function docOnSite(env, doc) {
  return doc.puppy_id ? hasPublic(env, 'id = ?', doc.puppy_id) : isPublicParent(env, doc.parent_id);
}

async function addDocument(request, env, breeder, { puppyId = null, parentId = null }) {
  const n = await env.DB.prepare(`SELECT COUNT(*) AS n FROM documents WHERE ${puppyId ? 'puppy_id' : 'parent_id'} = ?`).bind(puppyId || parentId).first();
  if (n.n >= MAX_DOCS) throw bad(`Each ${puppyId ? 'puppy' : 'mom or dad'} can have up to ${MAX_DOCS} documents.`);
  if (Number(request.headers.get('content-length') || 0) > MAX_DOC_BYTES) throw bad('Documents can be up to 10 MB. A scan at a lower resolution, or one page per file, will fit.');
  const url = new URL(request.url);
  const { row, stmt } = await storeDocument(env, {
    breederId: breeder.id, puppyId, parentId, raw: new Uint8Array(await request.arrayBuffer()), params: url.searchParams, fileName: url.searchParams.get('name'),
  });
  const stmts = [stmt, auditStmt(env, ...who(breeder), 'document.add', puppyId ? 'puppy' : 'parent', puppyId || parentId, null,
    { document: row.id, kind: row.kind, visibility: row.visibility, bytes: row.bytes })];
  if (row.visibility === 'public' && await docOnSite(env, row)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ id: row.id, visibility: row.visibility }, 201);
}

async function uploadPuppyDocument(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const puppy = await owned(env, 'puppy', id, breeder.id);
  if (puppy.publication_state === 'archived') throw bad('That puppy has been removed.');
  return addDocument(request, env, breeder, { puppyId: id });
}

async function uploadParentDocument(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  await owned(env, 'parent', id, breeder.id);
  return addDocument(request, env, breeder, { parentId: id });
}

/** Rename a document, change what it is, or show it to families or keep it private. */
async function updateDocument(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const doc = await owned(env, 'document', id, breeder.id);
  const body = await readJson(request);
  const kind = body.kind == null ? doc.kind : String(body.kind);
  if (!DOC_KINDS[kind]) throw bad('Choose what the document is: a health record, a health guarantee, a pedigree or other.');
  const visibility = body.visibility == null ? doc.visibility : String(body.visibility);
  if (!['public', 'private'].includes(visibility)) throw bad('Choose whether families can see the document.');
  const title = body.title == null ? doc.title : (clean(body.title, 120) || DOC_KINDS[kind]);
  const key = await moveDocument(env, doc, visibility);
  const stmts = [
    env.DB.prepare('UPDATE documents SET kind = ?, title = ?, visibility = ?, r2_key = ?, updated_at = ? WHERE id = ? AND breeder_id = ?')
      .bind(kind, title, visibility, key, now(), id, breeder.id),
    auditStmt(env, ...who(breeder), 'document.update', doc.puppy_id ? 'puppy' : 'parent', doc.puppy_id || doc.parent_id,
      { document: id, kind: doc.kind, title: doc.title, visibility: doc.visibility }, { document: id, kind, title, visibility }),
  ];
  if ((visibility === 'public' || doc.visibility === 'public') && await docOnSite(env, doc)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  if (key !== doc.r2_key) await env.FILES.delete(doc.r2_key);
  return json({ ok: true });
}

async function deleteDocument(request, env, ctx, id) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  requireApproved(breeder);
  const doc = await owned(env, 'document', id, breeder.id);
  const stmts = [
    env.DB.prepare('DELETE FROM documents WHERE id = ? AND breeder_id = ?').bind(id, breeder.id),
    auditStmt(env, ...who(breeder), 'document.remove', doc.puppy_id ? 'puppy' : 'parent', doc.puppy_id || doc.parent_id, { document: id, title: doc.title }, null),
  ];
  if (doc.visibility === 'public' && await docOnSite(env, doc)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  await env.FILES.delete(doc.r2_key);
  return json({ ok: true });
}

/**
 * A document's file. Families get a public one once its puppy or parent is on the site, and the
 * breeder can open their own public ones before that. A private one is never served here, only
 * to signed-in staff in the admin.
 */
async function documentFile(request, env, ctx, id) {
  const res = await serveDocument(env, id, {
    allowPrivate: async (row) => {
      if (row.visibility !== 'public') return false;
      const s = await currentSession(request, env);
      return !!s && s.breeder.id === row.breeder_id;
    },
  });
  if (!res) throw notFound();
  return res;
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
  const inact = await inactivitySettings(env);
  const docs = {};
  for (const d of await documentsFor(env, breeder.id)) if (d.puppy_id) (docs[d.puppy_id] ||= []).push(d);
  const parents = (await env.DB.prepare('SELECT id, name, sex, archived_at FROM parent_dogs WHERE breeder_id = ? ORDER BY name').bind(breeder.id).all()).results;
  const vids = {};
  for (const v of (await env.DB.prepare('SELECT id, puppy_id, stream_uid, status, duration_s FROM puppy_videos WHERE breeder_id = ? ORDER BY position, created_at').bind(breeder.id).all()).results) {
    (vids[v.puppy_id] ||= []).push({ id: v.id, status: v.status, duration: v.duration_s, ...(v.status === 'ready' ? videoUrls(env, v.stream_uid, videoOrigin(request, env)) : {}) });
  }
  for (const l of litters) {
    for (const p of l.puppies) {
      p.videos = vids[p.id] || [];
      p.documents = docs[p.id] || [];
      // Workplan A12. Where the puppy is in the photo schedule and by when it needs a new photo.
      p.schedule = scheduleFor(p, breeder, inact);
      p.photos = p.photos.map((ph) => ({ id: ph.id, url: photoUrl(ph), position: ph.position, quality: ph.quality, messages: reasonText(ph.quality_reasons) }));
      // Workplan A9. A photo the check sent back or is holding does not count toward the listing.
      const usable = p.photos.filter((ph) => !ph.quality || ph.quality === 'pass' || ph.quality === 'pending').length;
      p.is_public = pubIds.has(p.id);
      p.pay_block = breeder.status === 'approved' ? await payability(env, p, s, usable, p.held_by) : 'Account not approved.';
      // Plan P2.1. Everything a draft is missing, not only the first thing payability() names.
      p.needs = [];
      if (p.price_cents == null) p.needs.push('a price');
      const short = s.minPhotos - usable;
      if (short > 0) p.needs.push(short === 1 ? (usable ? 'one more photo' : 'a photo') : `${short} more photos`);
      // Plan P2.2. Where buyers see this puppy, once it is live.
      p.site_url = site && p.is_public ? sitePage(env, 'puppy', p.slug, p.slug) : null;
      p.views = counts[p.id]?.views || 0;
      p.clicks = counts[p.id]?.clicks || 0;
    }
  }
  return json({ litters, fee_cents: s.feeCents, listing_days: s.listingDays, warn_days: s.warnDays, min_photos: s.minPhotos,
    registries: s.registries, videos: { on: !!streamMode(env), max: s.maxVideos, max_seconds: s.videoMaxSeconds, max_bytes: MAX_UPLOAD_BYTES },
    parents, doc_kinds: DOC_KINDS, max_doc_bytes: MAX_DOC_BYTES, max_docs: MAX_DOCS });
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
    // Launch workplan B10. A refused webhook is either a stranger or a signing secret out of step
    // with Stripe, and the second stops every listing payment, so the owners hear of it, once an hour.
    ctx.waitUntil(alertOnce(env, 'stripe_webhook', 'A Stripe webhook was refused',
      `The portal refused a call to /stripe/webhook: ${e.message}\n\nOne refusal can be a stranger. Repeated refusals mean STRIPE_WEBHOOK_SECRET no longer matches the endpoint's signing secret in Stripe, and paid listings then go live only through the success page and the checkout check job.`)
      .catch((x) => console.error('alert failed', x)));
    return json({ error: e.message }, 400);
  }
  try {
    if (failTest(env, 'stripe')) throw new Error('Forced test failure of the webhook handler (FAIL_TEST).');
    const result = await handleEvent(env, event, ctx);
    return json({ received: true, result });
  } catch (e) {
    console.error('webhook failed', e);
    // A 500 makes Stripe send the event again, with backoff, for up to three days.
    await alertOnce(env, 'stripe_webhook_failed', 'A Stripe webhook failed', `Event ${event.id} (${event.type}) could not be handled: ${String(e.message || e)}\n\nStripe sends it again over the next three days. The Payments screen shows the checkout.`)
      .catch((x) => console.error('alert failed', x));
    return json({ error: 'The event could not be handled.' }, 500);
  }
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
    // Workplan A11. The public site, for the Visit site link. SITE_ORIGIN in config, never in code.
    site_origin: siteOrigin(env) || null,
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

// ------------------------------------------------------------------ publish now (plan P4.4)

/**
 * True only for a request from another Worker over a service binding. The admin calls
 * https://portal.internal/internal/publish through its PORTAL binding, and that request carries
 * no cf object and no CF-Connecting-IP. Every request from the internet comes through
 * Cloudflare's edge, which always attaches both (wrangler dev attaches a stand-in cf object), so
 * a forged Host header alone does not get in. Checked locally on 2026-10-06 (dev/publish-test.mjs).
 */
function overBinding(request) {
  return new URL(request.url).hostname === 'portal.internal' && !request.cf && !request.headers.get('cf-connecting-ip');
}

async function internalPublish(request, env) {
  if (!overBinding(request)) throw notFound();
  const body = await request.json().catch(() => ({}));
  const email = body && body.actor && typeof body.actor.email === 'string' ? body.actor.email.slice(0, 200) : 'admin';
  const r = await publishSite(env, { type: 'operator', email });
  return json(r, r.ok ? 200 : r.off ? 503 : 502);
}

/**
 * The public data the site build reads (hook mode, lib/publish.js). It is exactly what
 * lib/shape.js gives a publish, read from the public views and breeds only, so it holds nothing
 * the site itself does not show. The build in the site repository fetches it, writes each file
 * as data/<name>.json and builds the pages from them. Never cached, so a build always gets the
 * database as it is.
 */
async function dataExport(request, env) {
  const exp = await exportSite(env);
  return json({ generation: exp.generation, counts: exp.counts, files: exp.files }, 200, { 'cache-control': 'no-store' });
}

// ------------------------------------------------------------------ the mailing list

// The sign-up box in the site footer posts here as a plain form, so it works with no script on
// the site. The page that comes back links straight back to the site. The hidden "website" field
// is a honeypot that people never see and form-filling bots fill in.
async function subscribe(request, env) {
  const origin = request.headers.get('origin');
  const site = siteOrigin(env);
  if (origin && origin !== new URL(request.url).origin && origin !== site) throw forbidden('Cross-site request refused.');
  const form = await request.formData();
  const back = site ? `${site}/` : '/';
  const done = (title, text, status = 200) => html(page(title, `<h1>${esc(title)}</h1><p>${text}</p><p><a class="btn btn-primary" href="${esc(back)}">Back to Puppy Connection</a></p>`), status);
  if (String(form.get('website') || '')) return done("You're on the list", 'Thanks for signing up.');
  if (env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: `sub:${request.headers.get('cf-connecting-ip') || 'local'}` });
    if (!success) return done('Please try again in a minute', 'Too many sign-ups came from here just now.', 429);
  }
  const r = await addSubscriber(env, { email: form.get('email'), name: form.get('name'), source: 'site' });
  if (!r.ok) return done('That address did not look right', 'Go back and check the email address, then try again.', 400);
  return done("You're on the list", 'Thanks for signing up. We will email you about new puppies and news from Puppy Connection, and every email has a link to unsubscribe.');
}

// ------------------------------------------------------------------ report a listing (workplan A5)

async function reportPage(request, env) {
  const q = new URL(request.url).searchParams;
  const target = await reportTarget(env, { puppy: q.get('puppy'), breeder: q.get('breeder') });
  if (!target) return html(page('Report a listing', '<h1>That listing is not on the site</h1><p>It may have been taken down already. Thank you for looking out for families.</p>'), 404);
  return html(page('Report a listing', reportForm(target, { siteKey: env.TURNSTILE_SITE_KEY })));
}

async function reportSubmit(request, env, ctx) {
  requireSameOrigin(request);
  const form = await request.formData();
  const target = await reportTarget(env, { puppy: form.get('puppy'), breeder: form.get('breeder') });
  if (!target) return html(page('Report a listing', '<h1>That listing is not on the site</h1><p>It may have been taken down already.</p>'), 404);
  const back = siteOrigin(env) ? `${siteOrigin(env)}/` : '/';
  const thanks = () => html(page('Thank you', `<h1>Thank you, your report is in</h1><p>Puppy Connection reads every report and follows up with the breeder where it is needed.</p><p><a class="btn btn-primary" href="${esc(back)}">Back to Puppy Connection</a></p>`));
  // A filled honeypot gets the same thanks and stores nothing.
  if (String(form.get('website') || '')) return thanks();
  if (env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: `report:${request.headers.get('cf-connecting-ip') || 'local'}` });
    if (!success) return html(page('Please try again in a minute', '<h1>Please try again in a minute</h1><p>Too many reports came from here just now.</p>'), 429);
  }
  const values = { reason: String(form.get('reason') || ''), details: String(form.get('details') || ''), email: String(form.get('email') || '') };
  try {
    await verifyTurnstile(request, env, form.get('cf-turnstile-response'), 'report');
  } catch (e) {
    return html(page('Report a listing', reportForm(target, { siteKey: env.TURNSTILE_SITE_KEY, error: e.message, values })), 400);
  }
  const r = await saveReport(env, ctx, target, form);
  if (r.error) return html(page('Report a listing', reportForm(target, { siteKey: env.TURNSTILE_SITE_KEY, error: r.error, values })), 400);
  return thanks();
}

/** GET changes nothing, because mail scanners open links first. The button posts. */
function unsubscribePage(request) {
  const t = new URL(request.url).searchParams.get('t') || '';
  return html(page('Unsubscribe', `<h1>Unsubscribe from Puppy Connection emails</h1>
<p>Press the button and we will stop sending you our emails.</p>
<form method="post" action="/unsubscribe"><input type="hidden" name="t" value="${esc(t)}">
<button class="btn btn-primary" type="submit">Unsubscribe</button></form>`));
}

/** The button, and the one-click POST mail providers send for List-Unsubscribe-Post (RFC 8058). */
async function unsubscribe(request, env) {
  const url = new URL(request.url);
  let t = url.searchParams.get('t') || '';
  if (!t) { const form = await request.formData().catch(() => null); t = String(form?.get('t') || ''); }
  const row = await unsubscribeToken(env, t);
  if (!row) return html(page('Link not recognized', '<h1>That link was not recognized</h1><p>If you still get our emails, reply to one and we will take you off the list.</p>'), 400);
  return html(page('Unsubscribed', `<h1>You are unsubscribed</h1><p>${esc(row.email)} will not get Puppy Connection emails any more. If that was a mistake, you can sign up again from the bottom of any page on the site.</p>`));
}

// ------------------------------------------------------------------ router

const ROUTES = [
  // Launch workplan A26. Emailed sign-in codes and links are off, and these answer so.
  ['POST', /^\/auth\/start$/, emailSigninGone],
  ['POST', /^\/auth\/code$/, emailSigninGone],
  ['GET', /^\/auth\/verify$/, oldLinkPage],
  ['POST', /^\/auth\/verify$/, oldLinkPage],
  ['POST', /^\/auth\/signup$/, authSignup],
  ['POST', /^\/auth\/forgot$/, authForgot],
  ['POST', /^\/auth\/password$/, authPassword],
  ['POST', /^\/auth\/totp$/, authTotp],
  ['GET', /^\/auth\/set-password$/, setPasswordPage],
  ['POST', /^\/auth\/set-password$/, setPassword],
  ['GET', /^\/auth\/handoff$/, authHandoff],
  ['POST', /^\/auth\/signout$/, signOut],
  ['POST', /^\/auth\/signout-all$/, signOutAll],
  ['GET', /^\/auth\/google$/, googleStart],
  ['GET', /^\/auth\/google\/callback$/, googleCallback],
  ['GET', /^\/auth\/google\/nonce$/, oneTapNonce],
  ['POST', /^\/auth\/google\/onetap$/, oneTapSignIn],
  ['GET', /^\/api\/config$/, config],
  ['POST', /^\/subscribe$/, subscribe],
  ['GET', /^\/report$/, reportPage],
  ['POST', /^\/report$/, reportSubmit],
  ['GET', /^\/unsubscribe$/, (r) => unsubscribePage(r)],
  ['POST', /^\/unsubscribe$/, unsubscribe],
  ['GET', /^\/privacy$/, (r, e) => html(page('Privacy policy', privacyPage(e), { wide: true }))],
  ['GET', /^\/terms$/, async (r, e) => html(page('Listing terms', termsPage(await currentTerms(e)), { wide: true }))],
  ['POST', /^\/api\/terms\/accept$/, acceptTerms],
  ['GET', /^\/api\/me$/, me],
  ['PUT', /^\/api\/profile$/, saveProfile],
  ['POST', /^\/api\/profile\/submit$/, submitProfile],
  ['POST', /^\/api\/profile\/reference$/, saveReference],
  ['PUT', /^\/api\/profile\/extras$/, saveExtras],
  ['POST', /^\/api\/profile\/(logo|kennel)$/, uploadBrand],
  ['POST', /^\/api\/profile\/(logo|kennel)\/card$/, uploadBrandCard],
  ['DELETE', /^\/api\/profile\/(logo|kennel)$/, removeBrand],
  ['GET', /^\/brand\/([\w-]+)\/logo$/, brandLogo],
  ['GET', /^\/brand\/([\w-]+)\/kennel$/, brandKennel],
  ['GET', /^\/api\/account$/, account],
  ['POST', /^\/api\/account\/close$/, askToClose],
  ['POST', /^\/api\/account\/members$/, addMember],
  ['DELETE', /^\/api\/account\/members\/([\w-]+)$/, removeMember],
  ['POST', /^\/api\/account\/close\/withdraw$/, withdrawClose],
  ['POST', /^\/api\/account\/members\/([\w-]+)\/main$/, makeMain],
  ['PUT', /^\/api\/account\/access$/, setAccess],
  ['PUT', /^\/api\/account\/password$/, changePassword],
  ['POST', /^\/api\/account\/authenticator$/, authenticatorStart],
  ['POST', /^\/api\/account\/authenticator\/confirm$/, authenticatorConfirm],
  ['POST', /^\/api\/account\/authenticator\/off$/, authenticatorOff],
  ['POST', /^\/api\/account\/authenticator\/dismiss$/, authenticatorDismiss],
  ['GET', /^\/api\/stats$/, myStats],
  ['GET', /^\/api\/breeds$/, (r, e) => listBreeds(e)],
  ['GET', /^\/api\/listings$/, listings],
  ['GET', /^\/api\/parents$/, parentsScreen],
  ['POST', /^\/api\/parents$/, createParent],
  ['PUT', /^\/api\/parents\/([\w-]+)$/, updateParent],
  ['POST', /^\/api\/parents\/([\w-]+)\/archive$/, archiveParent],
  ['POST', /^\/api\/parents\/([\w-]+)\/photo$/, uploadParentPhoto],
  ['POST', /^\/api\/parents\/([\w-]+)\/photo\/card$/, uploadParentCard],
  ['DELETE', /^\/api\/parents\/([\w-]+)\/photo$/, removeParentPhoto],
  ['POST', /^\/api\/parents\/([\w-]+)\/documents$/, uploadParentDocument],
  ['POST', /^\/api\/puppies\/([\w-]+)\/documents$/, uploadPuppyDocument],
  ['PUT', /^\/api\/documents\/([\w-]+)$/, updateDocument],
  ['DELETE', /^\/api\/documents\/([\w-]+)$/, deleteDocument],
  ['GET', /^\/media\/parent\/([\w-]+)$/, parentPhoto],
  ['GET', /^\/media\/parent\/([\w-]+)\/card$/, (r, e, c, id) => parentPhoto(r, e, c, id, true)],
  ['GET', /^\/media\/doc\/([\w-]+)$/, documentFile],
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
  ['POST', /^\/api\/puppies\/([\w-]+)\/videos$/, startVideo],
  ['POST', /^\/api\/videos\/([\w-]+)\/check$/, checkVideo],
  ['DELETE', /^\/api\/videos\/([\w-]+)$/, deleteVideo],
  ['POST', /^\/dev\/stream\/upload\/(\w+)$/, (r, e, c, uid) => simUpload(r, e, uid)],
  ['GET', /^\/dev\/stream\/(\w+)\/(iframe|video)$/, (r, e, c, uid, what) => simServe(e, uid, what)],
  ['POST', /^\/api\/photos\/([\w-]+)\/card$/, uploadCard],
  ['POST', /^\/api\/photos\/([\w-]+)\/check$/, checkMyPhoto],
  ['GET', /^\/still-available$/, () => stillAvailablePage()],
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
  ['POST', /^\/internal\/publish$/, internalPublish],
  ['GET', /^\/data\/export\.json$/, dataExport],
];

// Plan P2.2. A generated site (PUBLISH_MODE hook or commit) names pages puppy-<slug>.html and
// breeder-<profile slug>.html, as build/generate.mjs writes them. The live-data site Worker used
// before that reads breeder.html?slug=<website slug> instead.
function sitePage(env, kind, slug, liveSlug) {
  if (env.PUBLISH_MODE === 'hook' || env.PUBLISH_MODE === 'commit') return `${siteOrigin(env)}/${kind}-${encodeURIComponent(slug)}.html`;
  return `${siteOrigin(env)}/${kind}.html?slug=${encodeURIComponent(liveSlug)}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const locked = gate(request, env);
    if (locked) return locked;
    PAGE_SITE = siteOrigin(env);
    try {
      for (const [method, rx, fn] of ROUTES) {
        const m = url.pathname.match(rx);
        if (!m) continue;
        if (request.method !== method) continue;
        // Every handler takes (request, env, ctx, id), with id from the route when it has one.
        const res = withHeaders(await fn(request, env, ctx, m[1], m[2]), SECURITY_HEADERS);
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
    // Each job alerts on its own failure (lib/jobs.js). This catches a run that fails outside them.
    ctx.waitUntil(runScheduled(event, env).then((r) => console.log('jobs', JSON.stringify(r)))
      .catch((e) => alertOnce(env, 'cron', `The scheduled run ${event.cron} failed`, String(e.stack || e)).catch((x) => console.error('alert failed', x))));
  },
};
