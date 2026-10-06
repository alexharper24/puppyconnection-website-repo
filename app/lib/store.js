// Reads and writes shared by both Workers, the ownership rule, and the audit trail.

import { now, notFound, forbidden, bad, clean, cents, HttpError } from './util.js';
import { sendMail } from './mail.js';

/**
 * The ownership rule (spec 7), the Williams Sisters ownedRecipe pattern. Every breeder
 * route that touches a row loads it through here. A row that does not exist and a row that
 * belongs to someone else both answer 404, so the response never confirms another breeder's
 * record exists. The table name comes from this fixed list, never from the request.
 */
const TABLES = {
  litter: 'litters',
  puppy: 'puppies',
  photo: 'photos',
  checkout: 'checkouts',
};

export async function owned(env, kind, id, breederId) {
  const table = TABLES[kind];
  if (!table) throw new Error(`owned(): unknown kind ${kind}`);
  if (!id || typeof id !== 'string') throw notFound();
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  if (!row || row.breeder_id !== breederId) throw notFound();
  return row;
}

/** Breeder status is read from the table on every request, never cached (test 6). */
export async function loadBreeder(env, breederId) {
  return env.DB.prepare(
    `SELECT b.*, p.business_name, p.slug, p.contact_name, p.public_phone, p.public_email,
            p.website_url, p.city, p.state, p.description, p.version AS profile_version,
            p.logo_key, p.kennel_key, p.facebook_url
       FROM breeders b LEFT JOIN breeder_profiles p ON p.breeder_id = b.id
      WHERE b.id = ?`,
  ).bind(breederId).first();
}

export function requireApproved(breeder) {
  if (breeder.status === 'approved') return;
  const why = {
    pending: 'Your account is waiting for approval, so listings are not open yet.',
    suspended: 'Your account is suspended, so changes and payments are paused.',
    declined: 'Your account was not approved.',
  }[breeder.status] || 'Not allowed.';
  throw forbidden(why);
}

export async function settings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const s = {};
  for (const r of results) s[r.key] = r.value;
  return {
    listingDays: Number(s.listing_days || 60),
    warnDays: Number(s.warn_days || 7),
    suspendedVisible: s.suspended_listings_visible === '1',
    minPhotos: Number(s.min_photos || 1),
    maxPhotos: Number(s.max_photos || 12),
    termsVersion: s.terms_version || 'draft',
    feeCents: Number(s.fee_cents || 1499),
  };
}

/** One audit row, as a prepared statement so it can join a batch. */
export function auditStmt(env, actorType, actor, action, entity, entityId, before, after) {
  return env.DB.prepare(
    `INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(now(), actorType, actor, action, entity, entityId,
    before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after));
}

/** Mark the public site as needing a publish. Also a statement, for batches. */
export function dirtyStmt(env) {
  return env.DB.prepare(
    `UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, ?), generation = generation + 1
      WHERE id = 1`,
  ).bind(now());
}

/**
 * Optimistic concurrency. A write names the version it started from, and it lands only if
 * nobody changed the row since. Two people editing one puppy get a 409, not a silent loss.
 */
export function checkVersion(result, what) {
  if (!result.meta || result.meta.changes !== 1) {
    throw new HttpError(409, `This ${what} was changed somewhere else. Reload to see the latest version.`);
  }
}

export async function puppyPhotos(env, puppyIds) {
  // D1 binds at most 100 values a statement, and an imported Wix breeder can have more puppies
  // than that, so the ids go in groups of 90.
  const by = {};
  for (let i = 0; i < puppyIds.length; i += 90) {
    const ids = puppyIds.slice(i, i + 90);
    const { results } = await env.DB.prepare(
      `SELECT id, puppy_id, r2_key, external_url, position, aspect FROM photos
        WHERE puppy_id IN (${ids.map(() => '?').join(',')}) ORDER BY puppy_id, position`,
    ).bind(...ids).all();
    for (const p of results) (by[p.puppy_id] ||= []).push(p);
  }
  return by;
}

/** Litters with their puppies and photos, for one breeder or (admin) everyone. */
export async function littersWithPuppies(env, breederId) {
  const where = breederId ? 'WHERE l.breeder_id = ?' : '';
  const binds = breederId ? [breederId] : [];
  const litters = (await env.DB.prepare(
    `SELECT l.*, br.name AS breed_name FROM litters l JOIN breeds br ON br.id = l.breed_id
      ${where} ORDER BY l.archived_at IS NOT NULL, l.created_at DESC`,
  ).bind(...binds).all()).results;
  const puppies = (await env.DB.prepare(
    `SELECT p.*, h.checkout_id AS held_by FROM puppies p
       LEFT JOIN puppy_holds h ON h.puppy_id = p.id AND h.expires_at > ?
      ${breederId ? 'WHERE p.breeder_id = ?' : ''} ORDER BY p.created_at`,
  ).bind(now(), ...binds).all()).results;
  const photos = await puppyPhotos(env, puppies.map((p) => p.id));
  const byLitter = {};
  for (const p of puppies) {
    p.photos = photos[p.id] || [];
    p.includes = JSON.parse(p.includes_json || '[]');
    (byLitter[p.litter_id] ||= []).push(p);
  }
  for (const l of litters) l.puppies = byLitter[l.id] || [];
  return litters;
}

export function photoUrl(photo) {
  return photo.r2_key ? `/media/${photo.id}` : photo.external_url;
}

// ------------------------------------------------------------------ the breeder profile

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A profile edit, checked the same way whether the breeder or an operator makes it. */
export function profileFields(body) {
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

/** The profile write, landing only on the version the editor started from. */
export function profileStmt(env, breederId, f, version) {
  return env.DB.prepare(
    `UPDATE breeder_profiles SET business_name = ?, contact_name = ?, public_phone = ?, public_email = ?, website_url = ?,
       city = ?, state = ?, description = ?, updated_at = ?, version = version + 1
     WHERE breeder_id = ? AND version = ?`,
  ).bind(f.business_name, f.contact_name, f.public_phone, f.public_email, f.website_url, f.city, f.state, f.description, now(),
    breederId, Number(version));
}

/** The profile as it stood, for the audit row's before side. */
export function profileBefore(b) {
  const out = {};
  for (const k of ['business_name', 'contact_name', 'public_phone', 'public_email', 'website_url', 'city', 'state', 'description']) out[k] = b[k] ?? null;
  return out;
}

// Plan P6.6. The contact details buyers use. A change to any of them is emailed to the
// breeder's sign-in address, never the new public one, so a stranger who changed them is
// noticed by the real owner.
const CONTACT_FIELDS = [['public_phone', 'Public phone'], ['public_email', 'Public email'], ['website_url', 'Website']];

export function contactChanges(before, after) {
  return CONTACT_FIELDS
    .filter(([k]) => (before[k] || null) !== (after[k] || null))
    .map(([k, label]) => ({ field: k, label, from: before[k] || null, to: after[k] || null }));
}

/**
 * Send the contact change notice after a profile write has landed. A breeder still filling
 * in the profile for the first time (never submitted) gets no notice, because nothing they
 * enter is public or under review yet and every sign-up would otherwise get one.
 */
export function noticeContactChange(env, ctx, breeder, after, by) {
  if (!breeder.profile_submitted_at) return 0;
  const changes = contactChanges(breeder, after);
  if (!changes.length) return 0;
  const send = sendMail(env, breeder.email, 'contact_changed', {
    business: after.business_name || breeder.business_name, changes, by, portalUrl: env.PORTAL_ORIGIN || '',
  }).catch((e) => console.error('contact change notice failed', e));
  if (ctx && ctx.waitUntil) ctx.waitUntil(send);
  return changes.length;
}

// ------------------------------------------------------------------ profile extras (plan P2.3)

// Optional extras on the breeder page: a logo, one kennel photo, the breeds they raise and a
// Facebook page. The images live in R2 under brand/<breeder id>/ with a ".card" copy beside
// the full one, made in the browser the same way as puppy photos.
export const BRAND = { logo: 'logo_key', kennel: 'kennel_key' };

const FACEBOOK_RX = /^https:\/\/(www\.|m\.|web\.)?facebook\.com\/[^\s<>"']+$/i;

/** A Facebook page address, or null. Only facebook.com addresses are taken. */
export function facebookUrl(v) {
  let s = clean(v, 300);
  if (!s) return null;
  if (/^(www\.|m\.|web\.)?facebook\.com\//i.test(s)) s = `https://${s}`;
  s = s.replace(/^http:\/\//i, 'https://');
  if (!FACEBOOK_RX.test(s)) throw bad('The Facebook page needs to be a facebook.com address, like https://www.facebook.com/yourkennel');
  return s;
}

/** The breeds a breeder raises, by name. */
export async function breederBreeds(env, breederId) {
  const { results } = await env.DB.prepare(
    'SELECT br.id, br.name FROM breeder_breeds bb JOIN breeds br ON br.id = bb.breed_id WHERE bb.breeder_id = ? ORDER BY br.name',
  ).bind(breederId).all();
  return results;
}

/** Where a brand image is served. The v changes with the file, so a replaced logo is fetched fresh. */
export function brandUrl(base, breederId, kind, key) {
  if (!key) return null;
  const v = String(key).split('/').pop().split('.')[0].slice(-10).toLowerCase();
  return `${base}/brand/${breederId}/${kind}?v=${v}`;
}

/**
 * A logo or kennel photo. Anyone may have it while the breeder is public; otherwise only a
 * caller that allowPrivate() says may see it (the breeder themselves, or an operator).
 * Returns null when it should answer 404.
 */
export async function serveBrand(env, breederId, kind, { card = false, allowPrivate = async () => false } = {}) {
  const col = BRAND[kind];
  if (!col || !breederId) return null;
  const row = await env.DB.prepare(
    `SELECT p.${col} AS k, EXISTS (SELECT 1 FROM public_breeders pb WHERE pb.breeder_id = p.breeder_id) AS pub
       FROM breeder_profiles p WHERE p.breeder_id = ?`,
  ).bind(breederId).first();
  if (!row || !row.k) return null;
  if (!row.pub && !(await allowPrivate())) return null;
  const obj = (card && await env.FILES.get(`${row.k}.card`)) || await env.FILES.get(row.k);
  if (!obj) return null;
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': row.pub ? 'public, max-age=86400' : 'private, no-store',
    },
  });
}

// ------------------------------------------------------------------ litter and puppy fields

// The rules for a litter or a puppy, shared by the portal and the admin (plan P3.1), so an
// operator editing on a breeder's behalf is held to exactly what the breeder is held to.

export function num(v, max) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) throw bad('A number is out of range.');
  return n;
}

export function isoDate(v) {
  const s = clean(v, 10);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw bad('Dates are YYYY-MM-DD.');
  return s;
}

export function litterFields(body) {
  if (!body.breed_id) throw bad('Choose a breed.');
  return {
    breed_id: String(body.breed_id), born_on: isoDate(body.born_on), ready_on: isoDate(body.ready_on),
    mom_weight_lb: num(body.mom_weight_lb, 300), dad_weight_lb: num(body.dad_weight_lb, 300),
    description: clean(body.description, 4000),
  };
}

export function puppyFields(body) {
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

/** A stored litter or puppy in the shape the field rules read, so an edit may send only what changes. */
export function litterInput(l) {
  return { breed_id: l.breed_id, born_on: l.born_on, ready_on: l.ready_on, mom_weight_lb: l.mom_weight_lb, dad_weight_lb: l.dad_weight_lb, description: l.description };
}
export function puppyInput(p) {
  return {
    name: p.name, sex: p.sex, color: p.color, price: p.price_cents == null ? null : p.price_cents / 100,
    deposit: p.deposit_cents == null ? null : p.deposit_cents / 100, description: p.description, breeder_url: p.breeder_url,
    includes: JSON.parse(p.includes_json || '[]'), availability: p.availability,
  };
}

// ------------------------------------------------------------------ listing terms (plan P3.4)

export const TERMS_PLACEHOLDER = "REPLACE THIS: the listing terms, in Amber's own words (build spec section 14). Nothing has been written here on her behalf.";

/** The current listing terms: the version in settings and its text. */
export async function currentTerms(env) {
  const s = await settings(env);
  const row = await env.DB.prepare('SELECT body, published_at FROM terms_versions WHERE version = ?').bind(s.termsVersion).first();
  return { version: s.termsVersion, body: row ? row.body : TERMS_PLACEHOLDER, published_at: row ? row.published_at : null };
}

/**
 * Whether a breeder should be asked to accept the current terms. Anyone who has submitted a
 * profile accepted a version then, so a newer one is asked for on their next visit. It never
 * blocks viewing anything.
 */
export function termsNeedAccept(breeder, version) {
  return !!breeder.profile_submitted_at && breeder.status !== 'declined' && breeder.terms_version !== version;
}
