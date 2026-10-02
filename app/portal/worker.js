// The breeder portal (spec sections 6, 7 and 8). Breeders sign up and sign in here with a
// one-time emailed link, manage their kennel, litters, puppies and photos, and pay to list.
// It also carries the Stripe webhook and, in the local simulation, a stand-in Checkout page.

import {
  now, addDays, addMinutes, ulid, randomToken, sha256hex, slugify, esc, clean, cents,
  HttpError, notFound, forbidden, bad, json, html, redirect, readJson, requireSameOrigin,
  parseCookies, sessionCookieName, setCookie, isLocal, SECURITY_HEADERS, withHeaders, gate,
} from '../lib/util.js';
import {
  owned, loadBreeder, requireApproved, settings, auditStmt, dirtyStmt, checkVersion,
  littersWithPuppies, photoUrl,
} from '../lib/store.js';
import { sendMail } from '../lib/mail.js';
import { scheduled as runScheduled } from '../lib/jobs.js';
import {
  provider, sim, createCheckout, releaseCheckout, fulfillCheckout, handleEvent, verifyStripe, payability,
} from '../lib/payments.js';
import { cleanImage } from '../lib/images.js';

const SESSION_DAYS = 30;
const TOKEN_MINUTES = 15;
const LINKS_PER_HOUR = 5;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ------------------------------------------------------------------ sessions

async function currentSession(request, env) {
  const token = parseCookies(request)[sessionCookieName(request)];
  if (!token) return null;
  const hash = await sha256hex(token);
  const s = await env.DB.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(hash).first();
  const t = now();
  if (!s || s.revoked_at || s.expires_at <= t) return null;
  const breeder = await loadBreeder(env, s.breeder_id);
  if (!breeder) return null;
  if (s.last_seen_at < addMinutes(t, -5)) {
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
  const neutral = { ok: true, message: 'Check your email for a sign-in link. It works once and expires in 15 minutes.' };
  const t = now();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_tokens WHERE email = ? AND created_at > ?')
    .bind(email, addMinutes(t, -60)).first();
  if (recent.n >= LINKS_PER_HOUR) return json(neutral);   // same answer, no new link (test 9)

  const existing = await env.DB.prepare('SELECT id FROM breeders WHERE email = ?').bind(email).first();
  const token = randomToken();
  const purpose = existing ? 'signin' : 'signup';
  await env.DB.prepare(
    `INSERT INTO login_tokens (token_hash, email, breeder_id, purpose, signup_name, ip, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(await sha256hex(token), email, existing?.id || null, purpose, clean(body.business_name, 120), ip, t, addMinutes(t, TOKEN_MINUTES)).run();
  const link = `${new URL(request.url).origin}/auth/verify?t=${encodeURIComponent(token)}`;
  ctx.waitUntil(sendMail(env, email, 'signin_link', { link, purpose }).catch((e) => console.error('sign-in mail failed', e)));
  if (env.EMAIL_MODE === 'log' && isLocal(request, env)) {
    // Test only: tie this address to this browser, so the mailbox can show it to them alone.
    let box = parseCookies(request).pc_mailbox;
    if (!box || !/^[\w-]{40,50}$/.test(box)) box = randomToken();
    await env.DB.prepare('INSERT OR IGNORE INTO dev_mailbox_owners (token, email, created_at) VALUES (?, ?, ?)').bind(box, email, t).run();
    return json(neutral, 200, { 'set-cookie': setCookie(request, 'pc_mailbox', box, 30 * 86400) });
  }
  return json(neutral);
}

function page(title, inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(title)} | Puppy Connection</title><link rel="stylesheet" href="/portal.css?v=2"></head>
<body class="plain"><main class="plain-card"><a class="plain-mark" href="/"><img src="/logo-white.webp?v=1" alt="Puppy Connection" width="420" height="203"></a>${inner}</main></body></html>`;
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
  let breeder = await env.DB.prepare('SELECT id, email_verified_at FROM breeders WHERE email = ?').bind(tok.email).first();
  if (!breeder) {
    const id = ulid();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO breeders (id, email, status, email_verified_at, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?, ?)`)
        .bind(id, tok.email, t, t, t),
      env.DB.prepare('INSERT INTO breeder_profiles (breeder_id, business_name, updated_at) VALUES (?, ?, ?)')
        .bind(id, tok.signup_name || '', t),
      auditStmt(env, 'breeder', tok.email, 'breeder.signup', 'breeder', id, null, { email: tok.email }),
    ]);
    breeder = { id };
  } else if (!breeder.email_verified_at) {
    await env.DB.prepare('UPDATE breeders SET email_verified_at = ? WHERE id = ?').bind(t, breeder.id).run();
  }
  const cookie = await startSession(request, env, breeder.id);
  return redirect('/', 303, { 'set-cookie': cookie });
}

async function signOut(request, env) {
  requireSameOrigin(request);
  const s = await currentSession(request, env);
  if (s) await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ?').bind(now(), s.hash).run();
  return json({ ok: true }, 200, { 'set-cookie': setCookie(request, sessionCookieName(request), '', 0) });
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

async function me(request, env) {
  const { breeder } = await needSession(request, env);
  const s = await settings(env);
  const out = publicBreeder(breeder, s);
  out.payments_mode = env.PAYMENTS_MODE || 'off';
  return json(out);
}

function profileFields(body) {
  const website = clean(body.website_url, 300);
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) throw bad('The website needs to start with https://');
  const pubEmail = clean(body.public_email, 200);
  if (pubEmail && !EMAIL_RX.test(pubEmail)) throw bad('The public email does not look right.');
  const name = clean(body.business_name, 120);
  if (!name) throw bad('Your business name is required.');
  return {
    business_name: name, contact_name: clean(body.contact_name, 120), public_phone: clean(body.public_phone, 40),
    public_email: pubEmail, website_url: website, city: clean(body.city, 80), state: clean(body.state, 40),
    description: clean(body.description, 4000),
  };
}

async function saveProfile(request, env) {
  requireSameOrigin(request);
  const { breeder } = await needSession(request, env);
  if (!['pending', 'approved'].includes(breeder.status)) throw forbidden('Your profile cannot be changed right now.');
  const body = await readJson(request);
  const f = profileFields(body);
  const t = now();
  const stmts = [
    env.DB.prepare(
      `UPDATE breeder_profiles SET business_name = ?, contact_name = ?, public_phone = ?, public_email = ?, website_url = ?,
         city = ?, state = ?, description = ?, updated_at = ?, version = version + 1
       WHERE breeder_id = ? AND version = ?`,
    ).bind(f.business_name, f.contact_name, f.public_phone, f.public_email, f.website_url, f.city, f.state, f.description, t,
      breeder.id, Number(body.version)),
    auditStmt(env, 'breeder', breeder.email, 'profile.update', 'breeder', breeder.id, null, f),
  ];
  if (breeder.status === 'approved') stmts.push(dirtyStmt(env));
  const res = await env.DB.batch(stmts);
  checkVersion(res[0], 'profile');
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
  for (const l of litters) {
    for (const p of l.puppies) {
      p.photos = p.photos.map((ph) => ({ id: ph.id, url: photoUrl(ph), position: ph.position }));
      p.is_public = pubIds.has(p.id);
      p.pay_block = breeder.status === 'approved' ? await payability(env, p, s, p.photos.length, p.held_by) : 'Account not approved.';
    }
  }
  return json({ litters, fee_cents: s.feeCents, listing_days: s.listingDays });
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
  return html(page('Simulated checkout', `<p class="sim-flag">Practice checkout for the test version. No card is charged.</p>
<h1>Pay to list</h1>
<table class="sim-table"><tr><td>Puppy listing x ${q}</td><td>${money(s.line_items.data[0].price.unit_amount)} each</td></tr>
<tr class="sim-total"><td>Total</td><td>${money(s.amount_total)}</td></tr></table>
<p class="muted">Billed to ${esc(s.customer_email)}. This practice checkout closes ${esc(new Date(s.expires_at * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Indiana/Indianapolis' }))} Indiana time.</p>
<form method="post" action="/sim/checkout/${esc(s.id)}/pay"><input type="hidden" name="webhook" value="1">
<button class="btn btn-primary" type="submit">Pay ${money(s.amount_total)} (simulated card)</button></form>
<form method="post" action="/sim/checkout/${esc(s.id)}/pay"><input type="hidden" name="webhook" value="0">
<button class="btn" type="submit">Pay, but lose the webhook (tests the success-page backstop)</button></form>
<form method="post" action="/sim/checkout/${esc(s.id)}/cancel"><button class="btn btn-quiet" type="submit">Cancel and go back</button></form>`));
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
  if (env.DEV_MODE !== 'hosted-open') return { where: '', binds: [] };
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
    local: isLocal(request, env),
    email_mode: env.EMAIL_MODE || 'off',
    payments_mode: env.PAYMENTS_MODE || 'off',
  });
}

// ------------------------------------------------------------------ router

const ROUTES = [
  ['POST', /^\/auth\/start$/, authStart],
  ['GET', /^\/auth\/verify$/, (r) => authVerifyPage(r)],
  ['POST', /^\/auth\/verify$/, authVerify],
  ['POST', /^\/auth\/signout$/, signOut],
  ['GET', /^\/api\/config$/, config],
  ['GET', /^\/api\/me$/, me],
  ['PUT', /^\/api\/profile$/, saveProfile],
  ['POST', /^\/api\/profile\/submit$/, submitProfile],
  ['GET', /^\/api\/breeds$/, (r, e) => listBreeds(e)],
  ['GET', /^\/api\/listings$/, listings],
  ['POST', /^\/api\/litters$/, createLitter],
  ['PUT', /^\/api\/litters\/([\w-]+)$/, updateLitter],
  ['POST', /^\/api\/litters\/([\w-]+)\/archive$/, archiveLitter],
  ['POST', /^\/api\/puppies$/, createPuppy],
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
        const res = await fn(request, env, ctx, m[1]);
        return withHeaders(res, SECURITY_HEADERS);
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
