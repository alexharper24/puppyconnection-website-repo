// Reads and writes shared by both Workers, the ownership rule, and the audit trail.

import { now, notFound, forbidden, bad, clean, cents, HttpError } from './util.js';
import { sendMail } from './mail.js';
import { BRAND, serveBrand } from './media.js';

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
  video: 'puppy_videos',
  parent: 'parent_dogs',
  document: 'documents',
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

export const DEFAULT_REGISTRIES = 'AKC, AKC Canine Partners, APRI, ACA, CKC, UKC';

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
    // Breeder links checked per daily run. The free Workers plan allows 50 outside requests a
    // run, shared with the day's emails, so 30 covers about 280 links in a little over a week.
    linkBatch: Math.max(1, Math.min(40, Number(s.link_batch || 30))),
    // migrations/0016. The registries a breeder may pick, and the video limits per puppy.
    registries: String(s.registries ?? DEFAULT_REGISTRIES).split(',').map((x) => x.trim()).filter(Boolean),
    maxVideos: Math.max(0, Number(s.max_videos ?? 2)),
    videoMaxSeconds: Math.max(10, Number(s.video_max_seconds || 120)),
    // migrations/0018. Where a photo that fails the quality check goes: breeder or review.
    photoCheckRoute: s.photo_check_route === 'review' ? 'review' : 'breeder',
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
  // The UPDATE names one row by its id, so 0 means the version moved on. D1 counts rows a trigger
  // changes in the same total (the placed_at trigger, migrations/0019), so more than 1 is fine.
  if (!result.meta || !(result.meta.changes >= 1)) {
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
      `SELECT id, puppy_id, r2_key, external_url, position, aspect, quality, quality_reasons FROM photos
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

// Workplan A13 (Amber, 2026-10-19). Who can vouch for a new breeder, in the order sign-up shows them.
export const REFERENCE_ROLES = {
  akc: 'AKC representative',
  welfare: 'Board member of a local animal welfare council, such as ICAW',
  breeder: 'Respected breeder',
  vet: 'Veterinarian',
};

/** The one reference a breeder names before approval: a name, a role from the list and a contact. */
export function referenceFields(body) {
  const r = body || {};
  const name = clean(r.name, 120), role = clean(r.role, 20), contact = clean(r.contact, 200);
  if (!name || !role || !contact) throw bad('Add a reference who can confirm you are a real breeder: their name, who they are, and a phone number or email.');
  if (!REFERENCE_ROLES[role]) throw bad('Choose who your reference is from the list.');
  const digits = contact.replace(/\D/g, '');
  if (!EMAIL_RX.test(contact) && digits.length < 10) throw bad("The reference's contact needs to be a phone number or an email address.");
  return { name, role, contact };
}

/** Insert or replace a breeder's reference. */
export function referenceStmt(env, breederId, r) {
  const t = now();
  return env.DB.prepare(
    `INSERT INTO breeder_references (breeder_id, name, role, contact, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (breeder_id) DO UPDATE SET name = excluded.name, role = excluded.role, contact = excluded.contact, updated_at = excluded.updated_at`,
  ).bind(breederId, r.name, r.role, r.contact, t, t);
}

export async function loadReference(env, breederId) {
  const r = await env.DB.prepare('SELECT name, role, contact, updated_at FROM breeder_references WHERE breeder_id = ?').bind(breederId).first();
  return r ? { ...r, role_label: REFERENCE_ROLES[r.role] || r.role } : null;
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
// BRAND and serveBrand live in lib/media.js, so the small site Worker can use them without
// this file's imports. They are re-exported here for the portal and the admin.
export { BRAND, serveBrand };

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
    // The saved mom and dad (migrations/0050), checked against the breeder by lib/parents.js checkLitterParents.
    mom_id: clean(body.mom_id, 40), dad_id: clean(body.dad_id, 40),
  };
}

/**
 * The columns a breeder or an operator edits on a puppy, in the order puppyFields() returns
 * them. Both Workers build their INSERT and UPDATE from this list, so a new field is added once.
 */
export const PUPPY_EDIT_COLS = ['name', 'sex', 'color', 'coat', 'price_cents', 'deposit_cents', 'description', 'breeder_url',
  'includes_json', 'availability', 'registry', 'markings', 'health_notes', 'vaccinations', 'deworming', 'disclosures', 'deposit_url'];
export const puppySet = () => PUPPY_EDIT_COLS.map((c) => `${c} = ?`).join(', ');
export const puppyValues = (f) => PUPPY_EDIT_COLS.map((c) => f[c] ?? null);

const httpsLink = (v, what) => {
  const url = clean(v, 400);
  if (url && !/^https?:\/\//i.test(url)) throw bad(`${what} needs to start with https://`);
  return url;
};

export const PRICE_NEEDED = 'Give the puppy a price. Families see it on the listing, and a puppy needs one before you can pay to list it.';

/** registries is the list from settings(); a registry outside it is refused when it is given. */
export function puppyFields(body, registries) {
  const name = clean(body.name, 80);
  if (!name) throw bad('Give the puppy a name.');
  const sex = body.sex ? String(body.sex) : null;
  if (sex && !['male', 'female'].includes(sex)) throw bad('Sex is male or female.');
  const availability = body.availability ? String(body.availability) : 'available';
  if (!['available', 'pending', 'placed'].includes(availability)) throw bad('Status is available, pending or placed.');
  const url = httpsLink(body.breeder_url, 'The link to your site');
  const registry = clean(body.registry, 40);
  if (registry && registries && !registries.includes(registry)) throw bad(`Registration is one of ${registries.join(', ')}.`);
  const includes = Array.isArray(body.includes) ? body.includes.map((x) => clean(x, 80)).filter(Boolean).slice(0, 40) : [];
  // Alex, 2026-11-01. A puppy cannot be paid for without a price, so every save asks for one. A
  // puppy marked placed is no longer offered, so it may still save without one.
  const price = cents(body.price);
  if (price == null && availability !== 'placed') throw bad(PRICE_NEEDED);
  return {
    name, sex, color: clean(body.color, 60), coat: clean(body.coat, 40), price_cents: price, deposit_cents: cents(body.deposit),
    description: clean(body.description, 4000), breeder_url: url, includes_json: JSON.stringify(includes), availability,
    registry, markings: clean(body.markings, 200), health_notes: clean(body.health_notes, 2000), vaccinations: clean(body.vaccinations, 1000),
    deworming: clean(body.deworming, 1000), disclosures: clean(body.disclosures, 2000), deposit_url: httpsLink(body.deposit_url, 'The deposit link'),
  };
}

/** A stored litter or puppy in the shape the field rules read, so an edit may send only what changes. */
export function litterInput(l) {
  return { breed_id: l.breed_id, born_on: l.born_on, ready_on: l.ready_on, mom_weight_lb: l.mom_weight_lb, dad_weight_lb: l.dad_weight_lb, description: l.description,
    mom_id: l.mom_id, dad_id: l.dad_id };
}
export function puppyInput(p) {
  return {
    name: p.name, sex: p.sex, color: p.color, coat: p.coat, price: p.price_cents == null ? null : p.price_cents / 100,
    deposit: p.deposit_cents == null ? null : p.deposit_cents / 100, description: p.description, breeder_url: p.breeder_url,
    includes: JSON.parse(p.includes_json || '[]'), availability: p.availability,
    registry: p.registry, markings: p.markings, health_notes: p.health_notes, vaccinations: p.vaccinations,
    deworming: p.deworming, disclosures: p.disclosures, deposit_url: p.deposit_url,
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
 * profile accepted a version then, so a newer one is asked for on their next visit. A breeder who
 * has not yet confirmed they are the seller (workplan A6) is asked the same way, once. It never
 * blocks viewing anything.
 */
export function termsNeedAccept(breeder, version) {
  return !!breeder.profile_submitted_at && breeder.status !== 'declined' && (breeder.terms_version !== version || !breeder.seller_confirmed_at);
}
