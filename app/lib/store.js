// Reads and writes shared by both Workers, the ownership rule, and the audit trail.

import { now, notFound, forbidden, HttpError } from './util.js';

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
            p.website_url, p.city, p.state, p.description, p.version AS profile_version
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
  if (!puppyIds.length) return {};
  const marks = puppyIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, puppy_id, r2_key, external_url, position, aspect FROM photos
      WHERE puppy_id IN (${marks}) ORDER BY puppy_id, position`,
  ).bind(...puppyIds).all();
  const by = {};
  for (const p of results) (by[p.puppy_id] ||= []).push(p);
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
