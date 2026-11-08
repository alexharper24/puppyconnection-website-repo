// Listing a puppy without payment (Alex, 2026-11-07, docs/batch-2026-11-07-listing-without-payment.md).
// The admin's List free and the portal's List without payment, which only an operator's Manage as
// session sees, both come here, so the two never disagree. A listing is recorded as comped, and
// comp_basis (migrations/0094) says why: 'package' for the $100 package Hope sells, which is paid
// to her outside Puppy Connection, or 'free' for a listing Puppy Connection gives away.

import { now, addDays, bad, notFound } from './util.js';
import { settings, auditStmt, dirtyStmt } from './store.js';

export const COMP_BASES = ['package', 'free'];

/** The puppies a litter's List free covers: drafts and expired listings, as the per-puppy button. */
export async function litterCompIds(env, litterId, breederId = null) {
  const l = await env.DB.prepare('SELECT id, breeder_id FROM litters WHERE id = ?').bind(litterId).first();
  if (!l || (breederId && l.breeder_id !== breederId)) throw notFound();
  const { results } = await env.DB.prepare(
    "SELECT id FROM puppies WHERE litter_id = ? AND publication_state IN ('draft','expired') ORDER BY created_at",
  ).bind(litterId).all();
  if (!results.length) throw bad('Every puppy in that litter is already listed or removed.');
  return results.map((r) => r.id);
}

/**
 * Publish puppies without payment. ids are puppy ids, breederId (when given) is the only kennel they
 * may belong to, and actor is { type, email } for the audit. A puppy already paid for stays paid.
 */
export async function listWithoutPayment(env, ids, actor, basis, breederId = null) {
  if (!COMP_BASES.includes(basis)) throw bad('Choose whether the listing package covers it or it is free.');
  if (!Array.isArray(ids) || !ids.length) throw bad('Choose at least one puppy.');
  const s = await settings(env);
  const t = now();
  const stmts = [];
  const uniq = [...new Set(ids.map(String))];
  for (const id of uniq) {
    const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
    if (!p || (breederId && p.breeder_id !== breederId)) throw notFound();
    if (p.publication_state === 'archived') throw bad(`${p.name || 'That puppy'} was removed by the breeder.`);
    const base = p.expires_at && p.expires_at > t ? p.expires_at : t;
    stmts.push(
      env.DB.prepare(
        `UPDATE puppies SET payment_state = CASE WHEN payment_state = 'paid' THEN 'paid' ELSE 'comped' END,
           comp_basis = CASE WHEN payment_state = 'paid' THEN comp_basis ELSE ? END,
           publication_state = 'published', published_at = COALESCE(published_at, ?), expires_at = ?, updated_at = ?, version = version + 1,
           -- Workplan A12. Listing a puppy free starts its photo clock, as a payment does.
           last_photo_at = ?,
           inactive_stage = NULL, stage_at = NULL, inactive_at = NULL
         WHERE id = ?`,
      ).bind(basis, t, s.listingDays > 0 ? addDays(base, s.listingDays) : null, t, t, id),
      auditStmt(env, actor.type, actor.email, 'puppy.comp', 'puppy', id, { payment_state: p.payment_state, publication_state: p.publication_state },
        { breeder_id: p.breeder_id, days: s.listingDays, basis }),
    );
  }
  stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return { listed: uniq.length };
}
