// Breeder accounts (launch workplan A24 to A26, migrations/0055). Shared by the portal and the
// admin, so both check people, passwords, invitations and the authenticator the same way.
//
// A person is one sign-in address on one kennel: the kennel's main email (breeders.email) or one
// of up to MAX_MEMBERS extra people (breeder_members). Their password and authenticator live in
// credentials, keyed by that address, so they follow the person when Make main contact moves them.

import { now, addMinutes, randomToken, sha256hex, timingSafeEqual, bad, clean, ulid } from './util.js';
import { auditStmt } from './store.js';
import { sendMail } from './mail.js';

const ENC = new TextEncoder();
export const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_MEMBERS = 5;

// How long each emailed or handed-over link lasts.
export const INVITE_DAYS = 7;
export const RESET_MINUTES = 60;
export const VERIFY_HOURS = 24;
export const MFA_MINUTES = 5;
export const HANDOFF_MINUTES = 2;
// An operator's session in the portal (A24). Hours, not the breeder's 60 days, and never renewed.
export const OPERATOR_SESSION_HOURS = 8;

// Failed password and authenticator tries (A26), counted in signin_failures like the emailed codes
// were counted in login_tokens. An address stops taking tries for the window after EMAIL_FAILS, and
// a network address after IP_FAILS, which is higher because a household or office shares one.
export const FAIL_WINDOW_MINUTES = 15;
export const EMAIL_FAILS = 10;
export const IP_FAILS = 100;

// ------------------------------------------------------------------ bytes

export function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
export function unb64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export function unbase32(s) {
  const clean32 = String(s).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0, value = 0;
  const out = [];
  for (const ch of clean32) {
    value = (value << 5) | B32.indexOf(ch); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}

// ------------------------------------------------------------------ passwords

// Workers caps PBKDF2 at 100,000 iterations. PASSWORD_ITERATIONS can set fewer while staging runs
// on Workers Free (10 ms of CPU a request); each hash records its own count, and a sign-in with an
// older, lower count rehashes at the current one, so raising the setting upgrades everyone in turn.
export const MAX_ITERATIONS = 100000;
export function iterations(env) {
  const n = Number(env.PASSWORD_ITERATIONS || MAX_ITERATIONS);
  return Number.isInteger(n) && n >= 10000 && n <= MAX_ITERATIONS ? n : MAX_ITERATIONS;
}

async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}

/** "pbkdf2-sha256$<iterations>$<salt>$<hash>", base64, with a fresh 16-byte salt. */
export async function hashPassword(env, password) {
  const iter = iterations(env);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iter}$${b64(salt)}$${b64(await pbkdf2(password, salt, iter))}`;
}

/** { ok, rehash }. A missing hash still costs one derivation, so a stranger's address answers as slowly. */
export async function checkPassword(env, password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
    await pbkdf2(String(password), new Uint8Array(16), iterations(env));
    return { ok: false, rehash: false };
  }
  const iter = Number(parts[1]);
  const got = b64(await pbkdf2(String(password), unb64(parts[2]), iter));
  const ok = timingSafeEqual(got, parts[3]);
  return { ok, rehash: ok && iter < iterations(env) };
}

export function passwordProblem(password) {
  const p = String(password || '');
  if (p.length < 10) return 'Use at least 10 characters. A few words together is easy to remember and hard to guess.';
  if (p.length > 200) return 'That password is too long. Use 200 characters or fewer.';
  return null;
}

// ------------------------------------------------------------------ authenticator (TOTP, RFC 6238)

const STEP = 30;

async function hotp(secret, counter) {
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i -= 1) { msg[i] = c & 255; c = Math.floor(c / 256); }
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
  const o = h[19] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}

export const totpStep = (ms = Date.now()) => Math.floor(ms / 1000 / STEP);
export async function totpCode(secret, step = totpStep()) { return hotp(secret, step); }

/** The step a six-digit code matches, within one step either side, and only after lastStep (no replay). */
export async function matchTotp(secret, code, lastStep = -1, ms = Date.now()) {
  const c = String(code || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(c)) return null;
  const now0 = totpStep(ms);
  for (const step of [now0, now0 - 1, now0 + 1]) {
    if (step <= (lastStep ?? -1)) continue;
    if (timingSafeEqual(await hotp(secret, step), c)) return step;
  }
  return null;
}

// The secret is encrypted with AES-GCM under TOTP_KEY when that Worker secret is set, so a copy of
// the database alone does not give the codes. Without it the secret is stored as it is and marked
// plain, and each one is encrypted the next time it is used once TOTP_KEY is added.
async function totpKey(env) {
  if (!env.TOTP_KEY) return null;
  const raw = await crypto.subtle.digest('SHA-256', ENC.encode(`puppyconnection-totp:${env.TOTP_KEY}`));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function sealSecret(env, secret) {
  const key = await totpKey(env);
  if (!key) return `plain:${base32(secret)}`;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return `v1:${b64(iv)}:${b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, secret))}`;
}
export async function openSecret(env, sealed) {
  const s = String(sealed || '');
  if (s.startsWith('plain:')) return unbase32(s.slice(6));
  const [v, iv, ct] = s.split(':');
  if (v !== 'v1') throw new Error('unknown authenticator secret format');
  const key = await totpKey(env);
  if (!key) throw new Error('TOTP_KEY is not set, so the authenticator secret cannot be read');
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct)));
}

export function otpauthUri(secretB32, email) {
  const label = encodeURIComponent(`Puppy Connection:${email}`);
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent('Puppy Connection')}&algorithm=SHA1&digits=6&period=30`;
}

/** Ten one-time recovery codes like "k7m2-9xqa", and the hashes that are stored. */
export async function newRecoveryCodes() {
  const codes = [];
  for (let i = 0; i < 10; i += 1) {
    const raw = base32(crypto.getRandomValues(new Uint8Array(5))).toLowerCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return { codes, hashes: await Promise.all(codes.map(recoveryHash)) };
}
export const recoveryHash = (code) => sha256hex(`recovery:${String(code || '').toLowerCase().replace(/[^a-z2-7]/g, '')}`);

/**
 * Check a second factor for an address: a six-digit authenticator code or an unused recovery
 * code. Returns { ok, how, stmts } where stmts records the use (the step, or the spent code).
 */
export async function checkSecondFactor(env, cred, code) {
  const c = String(code || '').trim();
  if (/^\d[\d\s]{5,6}$/.test(c)) {
    let secret;
    try { secret = await openSecret(env, cred.totp_secret); } catch (e) { console.error(e); return { ok: false }; }
    const step = await matchTotp(secret, c, cred.totp_last_step);
    if (step == null) return { ok: false };
    const stmts = [env.DB.prepare('UPDATE credentials SET totp_last_step = ? WHERE email = ? AND (totp_last_step IS NULL OR totp_last_step < ?)').bind(step, cred.email, step)];
    // A secret stored plain before TOTP_KEY existed is sealed now that it does.
    if (env.TOTP_KEY && String(cred.totp_secret).startsWith('plain:')) {
      stmts.push(env.DB.prepare('UPDATE credentials SET totp_secret = ? WHERE email = ?').bind(await sealSecret(env, secret), cred.email));
    }
    return { ok: true, how: 'authenticator', stmts, step };
  }
  const hash = await recoveryHash(c);
  const row = await env.DB.prepare('SELECT id FROM recovery_codes WHERE email = ? AND code_hash = ? AND used_at IS NULL').bind(cred.email, hash).first();
  if (!row) return { ok: false };
  return { ok: true, how: 'recovery', recoveryId: row.id,
    stmts: [env.DB.prepare('UPDATE recovery_codes SET used_at = ? WHERE id = ? AND used_at IS NULL').bind(now(), row.id)] };
}

/**
 * Check a second factor and record its use in one step. The use is conditional (a newer step for a
 * code, an unspent row for a recovery code), so the same code raced from two browsers counts once.
 */
export async function useSecondFactor(env, cred, code) {
  const sf = await checkSecondFactor(env, cred, code);
  if (!sf.ok) return { ok: false };
  const r = await env.DB.batch(sf.stmts);
  return r[0].meta.changes === 1 ? { ok: true, how: sf.how } : { ok: false };
}

// ------------------------------------------------------------------ failed tries (A26)

export async function failureState(env, email, ip) {
  const since = addMinutes(now(), -FAIL_WINDOW_MINUTES);
  const r = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM signin_failures WHERE email = ? AND at > ?) AS by_email,
            (SELECT COUNT(*) FROM signin_failures WHERE ip = ? AND at > ?) AS by_ip`,
  ).bind(String(email || '').toLowerCase(), since, ip, since).first();
  return { email: r.by_email >= EMAIL_FAILS, ip: r.by_ip >= IP_FAILS };
}
export const failureStmt = (env, email, ip, kind) => env.DB.prepare('INSERT INTO signin_failures (email, ip, kind, at) VALUES (?, ?, ?, ?)')
  .bind(String(email || '').toLowerCase(), ip, kind, now());

// ------------------------------------------------------------------ people on a kennel

/** Who an address is: { breeder_id, member_id, main } or null. */
export async function personFor(env, email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return null;
  const b = await env.DB.prepare('SELECT id FROM breeders WHERE email = ?').bind(e).first();
  if (b) return { email: e, breeder_id: b.id, member_id: null, main: true };
  const m = await env.DB.prepare('SELECT id, breeder_id FROM breeder_members WHERE email = ?').bind(e).first();
  return m ? { email: e, breeder_id: m.breeder_id, member_id: m.id, main: false } : null;
}

export const credentialFor = (env, email) => env.DB.prepare('SELECT * FROM credentials WHERE email = ?').bind(String(email || '').toLowerCase()).first();

/**
 * The main email and each extra person on a kennel, with where they are: invited (an open
 * invitation), joined (has signed in or set a password) and whether an authenticator is on.
 */
export async function kennelPeople(env, breederId) {
  const b = await env.DB.prepare('SELECT id, email, first_signin_at FROM breeders WHERE id = ?').bind(breederId).first();
  if (!b) return [];
  const { results: members } = await env.DB.prepare('SELECT id, email, name, added_by, added_at, joined_at FROM breeder_members WHERE breeder_id = ? ORDER BY added_at').bind(breederId).all();
  const emails = [b.email, ...members.map((m) => m.email)].map((e) => e.toLowerCase());
  const marks = emails.map(() => '?').join(',');
  const creds = Object.fromEntries((await env.DB.prepare(`SELECT email, password_set_at, totp_enabled_at FROM credentials WHERE email IN (${marks})`).bind(...emails).all())
    .results.map((c) => [c.email.toLowerCase(), c]));
  const t = now();
  const invites = Object.fromEntries((await env.DB.prepare(
    `SELECT lower(email) AS email, MAX(created_at) AS sent_at, MAX(CASE WHEN used_at IS NULL AND expires_at > ? THEN expires_at END) AS open_until
       FROM auth_tokens WHERE purpose = 'invite' AND breeder_id = ? GROUP BY lower(email)`,
  ).bind(t, breederId).all()).results.map((r) => [r.email, r]));
  const one = (email, extra) => {
    const c = creds[email.toLowerCase()] || {};
    const inv = invites[email.toLowerCase()] || {};
    return { email, password_set: !!c.password_set_at, authenticator: !!c.totp_enabled_at, invited_at: inv.sent_at || null, invite_open_until: inv.open_until || null, ...extra };
  };
  return [
    one(b.email, { main: true, member_id: null, name: null, joined_at: b.first_signin_at || (creds[b.email.toLowerCase()] || {}).password_set_at || null }),
    ...members.map((m) => one(m.email, { main: false, member_id: m.id, name: m.name, added_at: m.added_at, added_by: m.added_by, joined_at: m.joined_at })),
  ];
}

/** Check a new person for a kennel against the same limits the portal always had. */
export async function checkNewPerson(env, breeder, email) {
  const e = String(email || '').trim().toLowerCase();
  if (!EMAIL_RX.test(e) || e.length > 200) throw bad('Enter a valid email address.');
  if (e === String(breeder.email).toLowerCase()) throw bad('That address already signs in to this kennel.');
  const taken = await env.DB.prepare('SELECT breeder_id FROM breeder_members WHERE email = ?').bind(e).first();
  if (taken) throw bad(taken.breeder_id === breeder.id ? 'That person can already sign in.' : 'That address is already used by another kennel on Puppy Connection.');
  if (await env.DB.prepare('SELECT 1 AS x FROM breeders WHERE email = ?').bind(e).first()) {
    throw bad('That address already has its own breeder account. Use a different address, or contact Puppy Connection.');
  }
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM breeder_members WHERE breeder_id = ?').bind(breeder.id).first();
  if (n >= MAX_MEMBERS) throw bad(`A kennel can have up to ${MAX_MEMBERS} extra people. Remove someone first.`);
  return e;
}

/** Statements that add a person. actor is [actor_type, actor] for the audit row. */
export function addPersonStmts(env, breederId, email, name, addedBy, actor) {
  const id = ulid();
  return { id, stmts: [
    env.DB.prepare('INSERT INTO breeder_members (id, breeder_id, email, name, added_by, added_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, breederId, email, clean(name, 120), addedBy, now()),
    auditStmt(env, actor[0], actor[1], 'member.add', 'breeder', breederId, null, { member: id, email }),
  ] };
}

/**
 * Statements that take an address off a kennel's sign-ins: its sessions end at once, its open
 * invitation and reset links stop working, and its password and authenticator are removed, so an
 * address added again later starts from a new invitation.
 */
export function signInsEndStmts(env, breederId, email, { mainNull = false } = {}) {
  const t = now();
  const e = String(email).toLowerCase();
  return [
    env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND revoked_at IS NULL AND operator_email IS NULL AND (email = ?${mainNull ? ' OR email IS NULL' : ''})`).bind(t, breederId, e),
    env.DB.prepare("UPDATE auth_tokens SET used_at = ? WHERE email = ? AND used_at IS NULL AND purpose IN ('invite','reset','mfa')").bind(t, e),
    env.DB.prepare('DELETE FROM recovery_codes WHERE email = ?').bind(e),
    env.DB.prepare('DELETE FROM credentials WHERE email = ?').bind(e),
  ];
}

export function removePersonStmts(env, breederId, member, actor) {
  return [
    env.DB.prepare('DELETE FROM breeder_members WHERE id = ? AND breeder_id = ?').bind(member.id, breederId),
    ...signInsEndStmts(env, breederId, member.email),
    auditStmt(env, actor[0], actor[1], 'member.remove', 'breeder', breederId, { member: member.id, email: member.email }, null),
  ];
}

/**
 * Make an extra person the kennel's main email (A25). The old main email either stays on as an
 * extra person (keepOld) or comes off the kennel with its sessions ended. Sessions record which
 * address signed in, and the main address's own sessions carry NULL, so those are named first.
 */
export function makeMainStmts(env, breeder, member, { keepOld, addedBy, actor }) {
  const t = now();
  const old = String(breeder.email).toLowerCase();
  const stmts = [
    env.DB.prepare('UPDATE sessions SET email = ? WHERE breeder_id = ? AND email IS NULL AND operator_email IS NULL').bind(old, breeder.id),
    env.DB.prepare('DELETE FROM breeder_members WHERE id = ? AND breeder_id = ?').bind(member.id, breeder.id),
    env.DB.prepare('UPDATE breeders SET email = ?, updated_at = ?, version = version + 1 WHERE id = ?').bind(member.email.toLowerCase(), t, breeder.id),
  ];
  if (keepOld) {
    stmts.push(env.DB.prepare('INSERT INTO breeder_members (id, breeder_id, email, name, added_by, added_at, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(ulid(), breeder.id, old, clean(breeder.contact_name, 120), addedBy, t, breeder.first_signin_at || t));
  } else {
    stmts.push(...signInsEndStmts(env, breeder.id, old));
  }
  stmts.push(auditStmt(env, actor[0], actor[1], 'breeder.main_contact', 'breeder', breeder.id, { email: old }, { email: member.email.toLowerCase(), old_main: keepOld ? 'kept' : 'removed' }));
  return stmts;
}

// ------------------------------------------------------------------ one-time links

/**
 * A one-time token for an emailed link or a handoff. Only its SHA-256 is stored. An invitation or
 * reset for an address spends any earlier one of the same kind, so only the newest link works.
 */
export async function newAuthToken(env, { purpose, email = null, breederId = null, operatorEmail = null, signupName = null, createdBy = null, ip = null, minutes }) {
  const token = randomToken();
  const t = now();
  const stmts = [];
  if (email && (purpose === 'invite' || purpose === 'reset' || purpose === 'verify')) {
    stmts.push(env.DB.prepare('UPDATE auth_tokens SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL').bind(t, String(email).toLowerCase(), purpose));
  }
  stmts.push(env.DB.prepare(
    `INSERT INTO auth_tokens (token_hash, purpose, email, breeder_id, operator_email, signup_name, created_by, ip, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(await sha256hex(token), purpose, email ? String(email).toLowerCase() : null, breederId, operatorEmail, signupName, createdBy, ip, t, addMinutes(t, minutes)));
  return { token, stmts };
}

/** Spend a token once. Returns its row, or null when it is unknown, used or expired. */
export async function spendAuthToken(env, token, purposes) {
  const hash = await sha256hex(String(token || ''));
  const t = now();
  const r = await env.DB.prepare(
    `UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? AND purpose IN (${purposes.map(() => '?').join(',')})`,
  ).bind(t, hash, t, ...purposes).run();
  if (r.meta.changes !== 1) return null;
  return env.DB.prepare('SELECT * FROM auth_tokens WHERE token_hash = ?').bind(hash).first();
}

/** Look at a token without spending it. */
export async function peekAuthToken(env, token, purposes) {
  const hash = await sha256hex(String(token || ''));
  return env.DB.prepare(
    `SELECT * FROM auth_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? AND purpose IN (${purposes.map(() => '?').join(',')})`,
  ).bind(hash, now(), ...purposes).first();
}

/** Send an invitation to someone on a kennel (A25): a set-password link that works once for 7 days. */
export async function sendInvitation(env, { breeder, email, by, actor, portalOrigin, template = 'invitation' }) {
  const { token, stmts } = await newAuthToken(env, { purpose: 'invite', email, breederId: breeder.id, createdBy: by, minutes: INVITE_DAYS * 24 * 60 });
  stmts.push(auditStmt(env, actor[0], actor[1], 'member.invite', 'breeder', breeder.id, null, { email: String(email).toLowerCase() }));
  await env.DB.batch(stmts);
  const link = `${portalOrigin}/auth/set-password?t=${encodeURIComponent(token)}`;
  await sendMail(env, String(email).toLowerCase(), template, { business: breeder.business_name || 'a kennel', by, link, days: INVITE_DAYS });
  return { ok: true };
}

/** Turn a person's authenticator off, so they set it up again (A26, the admin's Reset authenticator). */
export function resetAuthenticatorStmts(env, breederId, email, actor) {
  const e = String(email).toLowerCase();
  return [
    env.DB.prepare('UPDATE credentials SET totp_secret = NULL, totp_pending = NULL, totp_enabled_at = NULL, totp_last_step = NULL, updated_at = ? WHERE email = ?').bind(now(), e),
    env.DB.prepare('DELETE FROM recovery_codes WHERE email = ?').bind(e),
    auditStmt(env, actor[0], actor[1], 'account.authenticator_reset', 'breeder', breederId, null, { email: e }),
  ];
}

/** Statements that turn Puppy Connection access on or off (A24). Off ends every operator session. */
export function accessStmts(env, breederId, on, { by, how, actor, before }) {
  const t = now();
  const stmts = [
    env.DB.prepare('UPDATE breeders SET manage_access = ?, manage_access_by = ?, manage_access_at = ?, manage_access_how = ?, updated_at = ? WHERE id = ?')
      .bind(on ? 1 : 0, by, t, how, t, breederId),
    auditStmt(env, actor[0], actor[1], on ? 'access.on' : 'access.off', 'breeder', breederId, { on: !!before }, { on: !!on, how }),
  ];
  if (!on) stmts.push(env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND operator_email IS NOT NULL AND revoked_at IS NULL').bind(t, breederId));
  return stmts;
}

// How access was last set: by the breeder in the portal, or by an operator recording the
// arrangement that already existed before launch (Alex, 2026-10-24), or turning it off.
export const ACCESS_HOW = { breeder: 'breeder', existing: 'existing_arrangement', operator_off: 'operator' };
