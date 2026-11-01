// Amber's operator screens (spec sections 6.4 and 7). Behind Cloudflare Access when deployed,
// and behind DEV_IDENTITY on localhost in the simulation. Everything an operator does to a
// breeder's record keeps that record's breeder_id and is written to the audit log (test 8).

import {
  now, addDays, slugify, clean, cents, HttpError, notFound, forbidden, bad, json, readJson,
  requireSameOrigin, SECURITY_HEADERS, withHeaders, gate, showTestNotices, ulid,
} from '../lib/util.js';
import {
  loadBreeder, settings, auditStmt, dirtyStmt, checkVersion, littersWithPuppies, photoUrl,
  profileFields, profileStmt, profileBefore, noticeContactChange, breederBreeds, brandUrl, serveBrand,
  litterFields, puppyFields, litterInput, puppyInput, currentTerms, contactChanges, puppySet, puppyValues, loadReference,
} from '../lib/store.js';
import { sendMail } from '../lib/mail.js';
import { videoUrls, removeVideo } from '../lib/stream.js';
import { listReports, closeReport } from '../lib/reports.js';
import { reasonText } from '../lib/photocheck.js';
import { photoPassedStmts } from '../lib/inactivity.js';
import { identify } from './identity.js';
import {
  kennelPeople, checkNewPerson, addPersonStmts, removePersonStmts, makeMainStmts, sendInvitation, resetAuthenticatorStmts,
  accessStmts, ACCESS_HOW, newAuthToken, signInsEndStmts, HANDOFF_MINUTES, checkMakeMain, onKennel,
} from '../lib/accounts.js';
import { checkLitterParents, parentsFor, documentsFor } from '../lib/parents.js';
import { serveParentPhoto, serveDocument } from '../lib/media.js';
import { buildExport } from '../lib/export.js';
import { runJob, JOBS } from '../lib/jobs.js';
import { KEEP } from '../lib/retention.js';
import { provider, handleEvent } from '../lib/payments.js';
import { siteStatus, publishNow } from '../lib/publish.js';
import { csvResponse } from '../lib/csv.js';
import { addSubscriber, parseSubscriberCsv, readSubscriberRows, EMAIL_OK } from '../lib/subscribers.js';
import { mailingAddress, startCampaign, runCampaigns, sendCampaignTest, audienceCount, audienceOf } from '../lib/campaigns.js';
import { cleanImage } from '../lib/images.js';
import { randomToken } from '../lib/util.js';
import { resetDemo, demoResetAllowed, RESET_PHRASE } from '../lib/demo.js';
import {
  checklist, checklistSummary, checklistItem, addChecklistItem, editChecklistItem, tickChecklistItem, moveChecklistItem,
  archiveChecklistItem, commentChecklistItem, addChecklistPart, editChecklistPart, tickChecklistPart, moveChecklistPart, archiveChecklistPart,
} from '../lib/checklist.js';

/** The scheduled jobs, their last run, and a way to run one now (lib/jobs.js). */
async function listJobs(req, env) {
  const { results } = await env.DB.prepare('SELECT * FROM job_runs').all();
  const by = Object.fromEntries(results.map((r) => [r.job, r]));
  return json(Object.keys(JOBS).map((job) => ({ job, ...(by[job] || {}), last_result: by[job]?.last_result ? JSON.parse(by[job].last_result) : null })));
}
async function runJobNow(req, env, ctx, name, who) {
  requireSameOrigin(req);
  if (!JOBS[name]) throw notFound();
  const r = await runJob(env, name);
  await auditStmt(env, 'operator', who.email, 'job.run', 'job', name, null, r).run();
  return json(r, r.ok ? 200 : 500);
}

async function whoami(req, env, ctx, id, who) {
  return json({ email: who.email, name: who.person.name, role: who.person.role, dev: who.dev,
    payments_mode: env.PAYMENTS_MODE || 'off', email_mode: env.EMAIL_MODE || 'off', portal: env.PORTAL_ORIGIN,
    // Workplan A11. The public site, for the Visit site link.
    site: String(env.SITE_ORIGIN || '').replace(/\/+$/, '') || null,
    // Plan P7.3. Staging shows no test-copy notice, but the mailbox link stays while EMAIL_MODE is log.
    notices: showTestNotices(env),
    // Plan P5.1. Reset demo data shows its button only where the server allows it.
    demo_reset: demoResetAllowed(env), demo_phrase: RESET_PHRASE });
}

async function stats(req, env) {
  const one = (sql, ...b) => env.DB.prepare(sql).bind(...b).first().then((r) => r.n);
  const t = now();
  const site = await env.DB.prepare('SELECT * FROM site_state WHERE id = 1').first();
  return json({
    queue: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NOT NULL"),
    open_reports: await one("SELECT COUNT(*) AS n FROM listing_reports WHERE status = 'open'"),
    photo_review: await one("SELECT COUNT(*) AS n FROM photos WHERE quality = 'review'"),
    signing_up: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NULL"),
    approved: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'approved'"),
    suspended: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'suspended'"),
    declined: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'declined'"),
    public_puppies: await one('SELECT COUNT(*) AS n FROM public_puppies'),
    drafts: await one("SELECT COUNT(*) AS n FROM puppies WHERE publication_state = 'draft'"),
    held: await one('SELECT COUNT(*) AS n FROM puppies WHERE operator_hold = 1'),
    open_checkouts: await one("SELECT COUNT(*) AS n FROM checkouts WHERE status = 'open' AND expires_at > ?", t),
    needs_review: await one("SELECT COUNT(*) AS n FROM checkouts WHERE status = 'needs_review'"),
    unpublished_changes: site.generation - site.published_generation,
    // Plan P2.7. Breeders who asked to close their account and have not been followed up yet.
    close_requests: await one('SELECT COUNT(DISTINCT breeder_id) AS n FROM account_requests WHERE withdrawn_at IS NULL AND resolved_at IS NULL'),
  });
}

// ------------------------------------------------------------------ breeders

async function listBreeders(req, env) {
  const status = new URL(req.url).searchParams.get('status');
  const where = status === 'closing' ? 'WHERE b.id IN (SELECT breeder_id FROM account_requests WHERE withdrawn_at IS NULL AND resolved_at IS NULL)'
    : status === 'queue' ? "WHERE b.status = 'pending' AND b.profile_submitted_at IS NOT NULL"
    : status === 'signing_up' ? "WHERE b.status = 'pending' AND b.profile_submitted_at IS NULL"
      : status ? 'WHERE b.status = ?' : '';
  const binds = status && !['queue', 'signing_up', 'closing'].includes(status) ? [status] : [];
  const { results } = await env.DB.prepare(
    `SELECT b.id, b.email, b.status, b.created_at, b.profile_submitted_at, b.decided_at, b.legacy,
            p.business_name, p.city, p.state, p.slug,
            (SELECT COUNT(*) FROM puppies x WHERE x.breeder_id = b.id AND x.publication_state != 'archived') AS puppies,
            (SELECT COUNT(*) FROM public_puppies x WHERE x.breeder_id = b.id) AS public_puppies
       FROM breeders b LEFT JOIN breeder_profiles p ON p.breeder_id = b.id ${where}
      ORDER BY b.profile_submitted_at IS NULL, b.profile_submitted_at, b.created_at DESC`,
  ).bind(...binds).all();
  return json(results);
}

async function breederDetail(req, env, ctx, id) {
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const litters = await littersWithPuppies(env, id);
  const pub = new Set((await env.DB.prepare('SELECT id FROM public_puppies WHERE breeder_id = ?').bind(id).all()).results.map((r) => r.id));
  // Workplan A3. Each puppy's videos, with the player address once Stream has finished.
  const vids = {};
  for (const v of (await env.DB.prepare('SELECT id, puppy_id, stream_uid, status FROM puppy_videos WHERE breeder_id = ? ORDER BY position, created_at').bind(id).all()).results) {
    (vids[v.puppy_id] ||= []).push({ id: v.id, status: v.status, ...(v.status === 'ready' ? videoUrls(env, v.stream_uid, env.PORTAL_ORIGIN || '') : {}) });
  }
  // Workplan A19 and A20. The saved moms and dads, and every document with the private ones, which
  // only operators can open (/media/doc/<id> below).
  const parents = await parentsFor(env, id);
  const docs = {};
  for (const d of await documentsFor(env, id)) if (d.puppy_id) (docs[d.puppy_id] ||= []).push(d);
  for (const l of litters) for (const p of l.puppies) {
    p.photos = p.photos.map((ph) => ({ id: ph.id, url: photoUrl(ph) }));
    p.videos = vids[p.id] || [];
    p.documents = docs[p.id] || [];
    p.is_public = pub.has(p.id);
  }
  const checkouts = (await env.DB.prepare('SELECT * FROM checkouts WHERE breeder_id = ? ORDER BY created_at DESC LIMIT 50').bind(id).all()).results;
  const audit = (await env.DB.prepare(
    `SELECT at, actor_type, actor, action, entity, entity_id FROM audit_log
      WHERE (entity = 'breeder' AND entity_id = ?)
         OR entity_id IN (SELECT id FROM puppies WHERE breeder_id = ?)
         OR entity_id IN (SELECT id FROM litters WHERE breeder_id = ?)
         OR entity_id IN (SELECT id FROM checkouts WHERE breeder_id = ?)
      ORDER BY id DESC LIMIT 60`,
  ).bind(id, id, id, id).all()).results;
  // Plan P2.3 and P2.7. The optional profile extras, and an open request to close the account.
  const extras = {
    facebook_url: b.facebook_url || null, breeds: await breederBreeds(env, id),
    logo_url: brandUrl('', id, 'logo', b.logo_key), kennel_url: brandUrl('', id, 'kennel', b.kennel_key),
  };
  const closeRequest = await env.DB.prepare(
    'SELECT id, reason, created_at FROM account_requests WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1',
  ).bind(id).first();
  // A close already marked closed, with when the retention job removes or removed the account (lib/retention.js).
  const closed = await env.DB.prepare(
    'SELECT resolved_at, resolved_by, removed_at FROM account_requests WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NOT NULL ORDER BY resolved_at LIMIT 1',
  ).bind(id).first();
  // Plan P3.2 and P3.4. The private notes, newest first, and which terms version they accepted.
  const terms = await currentTerms(env);
  const breeds = (await env.DB.prepare('SELECT id, name FROM breeds ORDER BY name').all()).results;
  const members = (await env.DB.prepare('SELECT email, name, added_at, joined_at FROM breeder_members WHERE breeder_id = ? ORDER BY added_at').bind(id).all()).results;
  // Workplan A24 to A26. Everyone who signs in to the kennel with where their invitation and
  // authenticator stand, and whether Puppy Connection may open the portal as them.
  const people = await kennelPeople(env, id);
  const access = { on: !!b.manage_access, by: b.manage_access_by, at: b.manage_access_at, how: b.manage_access_how };
  // Workplan A13. The reference they named before submitting, shown beside Approve.
  const reference = await loadReference(env, id);
  return json({ breeder: b, litters, parents, checkouts, audit, extras, members, people, access, portal: !!env.PORTAL_ORIGIN, reference, close_request: closeRequest || null,
    closed: closed ? { ...closed, remove_after: new Date(Date.parse(closed.resolved_at) + KEEP.closeDays * 86400000).toISOString().slice(0, 19) + 'Z' } : null, notes: await notesFor(env, id),
    terms: { current: terms.version, accepted: b.terms_version || null }, breeds, registries: (await settings(env)).registries });
}

// ------------------------------------------------------------------ operator notes (plan P3.2)

// Private to operators. The breeder never sees them, and neither the site export nor a report
// reads this table. The audit row records that a note was added, never what it says.
const notesFor = async (env, breederId) => (await env.DB.prepare(
  'SELECT id, author, body, created_at FROM operator_notes WHERE breeder_id = ? ORDER BY created_at DESC, id DESC',
).bind(breederId).all()).results;

async function addNote(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const text = clean((await readJson(req)).body, 4000);
  if (!text) throw bad('Write the note first.');
  if (!(await env.DB.prepare('SELECT 1 AS x FROM breeders WHERE id = ?').bind(id).first())) throw notFound();
  const noteId = ulid();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO operator_notes (id, breeder_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)').bind(noteId, id, who.email, text, now()),
    auditStmt(env, 'operator', who.email, 'breeder.note', 'breeder', id, null, { note: noteId }),
  ]);
  return json(await notesFor(env, id), 201);
}

/**
 * Mark a breeder's request to close their account as closed. Nothing is deleted here. The daily
 * retention job removes the account's information 30 days later (lib/retention.js, workplan D1).
 */
async function resolveClose(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const t = now();
  const r = await env.DB.batch([
    env.DB.prepare('UPDATE account_requests SET resolved_at = ?, resolved_by = ? WHERE breeder_id = ? AND withdrawn_at IS NULL AND resolved_at IS NULL').bind(t, who.email, id),
    auditStmt(env, 'operator', who.email, 'account.close_handled', 'breeder', id, null, null),
  ]);
  if (!r[0].meta.changes) throw notFound();
  return breederDetail(req, env, ctx, id);
}

async function uniqueSlug(env, name, breederId) {
  const base = slugify(name) || 'breeder';
  for (let i = 0; i < 50; i += 1) {
    const s = i ? `${base}-${i + 1}` : base;
    const taken = await env.DB.prepare('SELECT breeder_id FROM breeder_profiles WHERE slug = ? AND breeder_id != ?').bind(s, breederId).first();
    if (!taken) return s;
  }
  throw bad('Could not make a unique address for this breeder.');
}

async function decide(req, env, ctx, id, who, action) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const t = now();
  const rules = {
    approve: { from: ['pending'], to: 'approved', mail: 'approved' },
    decline: { from: ['pending'], to: 'declined', mail: 'declined' },
    suspend: { from: ['approved'], to: 'suspended', mail: 'suspended' },
    reinstate: { from: ['suspended'], to: 'approved', mail: 'reinstated' },
    reopen: { from: ['declined'], to: 'pending', mail: null },
  }[action];
  if (!rules.from.includes(b.status)) throw bad(`A ${b.status} breeder cannot be ${action}d.`);
  if (action === 'approve' && !b.profile_submitted_at) throw bad('This breeder has not submitted their profile yet.');
  const reason = clean(body.reason, 1000);
  if ((action === 'decline' || action === 'suspend') && !reason) throw bad('Add a private reason, for the record.');

  const stmts = [
    env.DB.prepare(
      `UPDATE breeders SET status = ?, decided_at = ?, decided_by = ?, status_reason = ?, updated_at = ?, version = version + 1
         ${action === 'reopen' ? ', profile_submitted_at = NULL' : ''}
       WHERE id = ? AND status = ?`,
    ).bind(rules.to, t, who.email, reason, t, id, b.status),
    auditStmt(env, 'operator', who.email, `breeder.${action}`, 'breeder', id, { status: b.status }, { status: rules.to, reason }),
  ];
  if (action === 'approve' && !b.slug) {
    stmts.push(env.DB.prepare('UPDATE breeder_profiles SET slug = ? WHERE breeder_id = ?').bind(await uniqueSlug(env, b.business_name, id), id));
  }
  if (action !== 'decline' && action !== 'reopen') stmts.push(dirtyStmt(env));
  const res = await env.DB.batch(stmts);
  checkVersion(res[0], 'breeder');
  if (rules.mail) {
    ctx.waitUntil(sendMail(env, b.email, rules.mail, {
      business: b.business_name, portalUrl: env.PORTAL_ORIGIN || '', message: clean(body.message, 2000),
    }).catch((e) => console.error(e)));
  }
  return breederDetail(req, env, ctx, id);
}

async function changeEmail(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const { email } = await readJson(req);
  const addr = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) throw bad('Enter a valid email address.');
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  if (addr === String(b.email).toLowerCase()) return breederDetail(req, env, ctx, id);
  // Workplan A25. A person already on this kennel is moved with Make main contact instead. Since A27
  // a person on another kennel may become the main contact here, as long as they are not the main
  // contact there too, which the UNIQUE answer below refuses.
  if (await env.DB.prepare('SELECT 1 AS x FROM breeder_members WHERE breeder_id = ? AND email = ?').bind(id, addr).first()) {
    throw bad('That address is a person on this kennel. To make them the main contact, use Make main contact.');
  }
  const t = now();
  try {
    await env.DB.batch([
      env.DB.prepare('UPDATE breeders SET email = ?, updated_at = ? WHERE id = ?').bind(addr, t, id),
      env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE breeder_id = ? AND revoked_at IS NULL').bind(t, id),
      // The old address's links, password and authenticator go with it. The new one gets an invitation.
      ...signInsEndStmts(env, id, b.email, { mainNull: true }),
      auditStmt(env, 'operator', who.email, 'breeder.email', 'breeder', id, { email: b.email }, { email: addr }),
    ]);
  } catch (e) {
    if (/UNIQUE/i.test(e.message)) throw bad('Another account already uses that address.');
    throw e;
  }
  return breederDetail(req, env, ctx, id);
}

// ------------------------------------------------------------------ people, access and Manage as this breeder (workplan A24 to A26)

// Every route here is owner-only, because STAFF_ALLOWED does not name it. The rules for who can be
// added are the portal's own (lib/accounts.js), so the two can never accept different things.

const opActor = (who) => ['operator', who.email];

async function breederOr404(env, id) {
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  return b;
}

/** The person on this kennel with this address, or a 400. */
async function personOn(env, b, email) {
  const e = String(email || '').trim().toLowerCase();
  if (e && e === String(b.email).toLowerCase()) return { email: e, main: true };
  const m = await env.DB.prepare('SELECT id, email FROM breeder_members WHERE breeder_id = ? AND email = ?').bind(b.id, e).first();
  if (!m) throw bad('That address does not sign in to this kennel.');
  return { email: m.email.toLowerCase(), main: false, id: m.id };
}

function needPortal(env) {
  if (!env.PORTAL_ORIGIN) throw bad('PORTAL_ORIGIN is not set, so a link to the portal cannot be made.');
  return env.PORTAL_ORIGIN;
}

/**
 * Add a person to a kennel, with the portal's limits, and send them an invitation unless asked not to.
 * Alex, 2026-10-31: `also` names more kennels to give the same person in the same step, such as the
 * Responsible Dog Breeder Network's kennels, and one email covers every kennel added. A kennel added
 * here opens at once, so someone who already has a password gets a notice rather than a link to confirm.
 */
async function addPersonAdmin(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  const body = await readJson(req);
  const email = await checkNewPerson(env, b, body.email);
  const kennels = [b];
  const also = [...new Set((Array.isArray(body.also) ? body.also : []).map(String))].filter((x) => x !== b.id);
  if (also.length > 60) throw bad('Choose at most 60 kennels at once.');
  for (const oid of also) {
    const o = await breederOr404(env, oid);
    if (await onKennel(env, email, o.id, { awaiting: true })) continue;
    try { await checkNewPerson(env, o, email); } catch (e) { throw bad(`${o.business_name || o.email}: ${e.message}`); }
    kennels.push(o);
  }
  await env.DB.batch(kennels.flatMap((k) => addPersonStmts(env, k.id, email, body.name, who.email, opActor(who), { immediate: true }).stmts));
  if (body.invite !== false) {
    await sendInvitation(env, { breeder: b, email, by: 'Puppy Connection', actor: opActor(who), portalOrigin: needPortal(env),
      added: kennels.map((k) => k.business_name || 'a kennel') });
  }
  return breederDetail(req, env, ctx, id);
}

/** Remove a person. Their sessions end at once, and their links, password and authenticator go. */
async function removePersonAdmin(req, env, ctx, id, who, memberId) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  const m = await env.DB.prepare('SELECT id, email FROM breeder_members WHERE id = ? AND breeder_id = ?').bind(memberId, b.id).first();
  if (!m) throw notFound();
  await env.DB.batch(removePersonStmts(env, b.id, m, opActor(who)));
  return breederDetail(req, env, ctx, id);
}

/** Send, or send again, an invitation. A new one stops the earlier link working. */
async function invitePerson(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  const p = await personOn(env, b, (await readJson(req)).email);
  await sendInvitation(env, { breeder: b, email: p.email, by: 'Puppy Connection', actor: opActor(who), portalOrigin: needPortal(env) });
  return breederDetail(req, env, ctx, id);
}

/** Make a person the main contact. The operator says whether the old main address stays on as a person. */
async function makeMainAdmin(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  const body = await readJson(req);
  if (!['keep', 'remove'].includes(body.old)) throw bad('Choose whether the current main email stays on as a person or is removed.');
  const m = await env.DB.prepare('SELECT id, email FROM breeder_members WHERE id = ? AND breeder_id = ?').bind(String(body.member_id || ''), b.id).first();
  if (!m) throw bad('Choose one of the people on this kennel.');
  await checkMakeMain(env, b, m);
  await env.DB.batch(makeMainStmts(env, b, m, { keepOld: body.old === 'keep', addedBy: who.email, actor: opActor(who) }));
  return breederDetail(req, env, ctx, id);
}

/** Turn a person's authenticator off so they set it up again, for example after losing a phone. */
async function resetAuthenticator(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  const p = await personOn(env, b, (await readJson(req)).email);
  await env.DB.batch(resetAuthenticatorStmts(env, b.id, p.email, opActor(who)));
  return breederDetail(req, env, ctx, id);
}

/**
 * Record the management arrangement that existed before launch, which turns access on with no new
 * consent asked (Alex, 2026-10-24), or turn access off. Off ends every operator session at once.
 */
async function setAccessAdmin(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  const on = (await readJson(req)).on === true;
  if (on !== !!b.manage_access) {
    await env.DB.batch(accessStmts(env, b.id, on, { by: who.email, how: on ? ACCESS_HOW.existing : ACCESS_HOW.operator_off, actor: opActor(who), before: b.manage_access }));
  }
  return breederDetail(req, env, ctx, id);
}

/**
 * Manage as this breeder. Mints a one-time hand-over that lasts two minutes, bound to the operator
 * Access identified and to this breeder, and gives the portal address that spends it. Only its
 * SHA-256 is stored, in the D1 both Workers share. The portal checks access again when it is spent.
 */
async function manageAs(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await breederOr404(env, id);
  if (!b.manage_access) throw forbidden('This breeder has not turned on Puppy Connection access, so the portal cannot be opened for them.');
  const origin = needPortal(env);
  const { token, stmts } = await newAuthToken(env, { purpose: 'handoff', breederId: b.id, operatorEmail: who.email, createdBy: who.email, minutes: HANDOFF_MINUTES });
  stmts.push(auditStmt(env, 'operator', who.email, 'operator.handoff', 'breeder', b.id, null, null));
  await env.DB.batch(stmts);
  return json({ url: `${origin}/auth/handoff?t=${encodeURIComponent(token)}` });
}

/**
 * An operator edits a breeder's profile on their behalf. The write is checked exactly as the
 * portal checks it, recorded in the audit as done by the operator, and a change to the public
 * phone, email or website is emailed to the breeder (plan P6.6). P3.1 gives it a screen.
 */
async function editProfile(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const b = await loadBreeder(env, id);
  if (!b) throw notFound();
  const body = await readJson(req);
  const f = profileFields(body);
  const stmts = [
    profileStmt(env, id, f, body.version),
    auditStmt(env, 'operator', who.email, 'profile.update', 'breeder', id, profileBefore(b), f),
  ];
  if (b.status === 'approved') stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'profile');
  noticeContactChange(env, ctx, b, f, 'operator');
  return breederDetail(req, env, ctx, id);
}

// ------------------------------------------------------------------ listings

async function listListings(req, env) {
  const u = new URL(req.url).searchParams;
  const filter = u.get('filter') || 'public';
  const where = {
    public: 'p.id IN (SELECT id FROM public_puppies)',
    drafts: "p.publication_state = 'draft'",
    expired: "p.publication_state = 'expired'",
    held: 'p.operator_hold = 1',
    all: "p.publication_state != 'archived'",
  }[filter];
  if (!where) throw bad('Unknown filter.');
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.name, p.breeder_id, p.price_cents, p.payment_state, p.publication_state, p.availability,
            p.operator_hold, p.hold_kind, p.hold_reason, p.expires_at, p.version, br.name AS breed, bp.business_name,
            (SELECT COUNT(*) FROM photos ph WHERE ph.puppy_id = p.id) AS photos,
            (SELECT ph.id FROM photos ph WHERE ph.puppy_id = p.id ORDER BY ph.position LIMIT 1) AS cover_id,
            (SELECT COALESCE(ph.external_url, '') FROM photos ph WHERE ph.puppy_id = p.id ORDER BY ph.position LIMIT 1) AS cover_ext,
            p.id IN (SELECT id FROM public_puppies) AS is_public
       FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
       JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id
      WHERE ${where} ORDER BY p.updated_at DESC LIMIT 400`,
  ).all();
  for (const r of results) r.cover = r.cover_ext ? `${r.cover_ext}/v1/fill/w_120,h_90,al_t,q_80/i.jpg` : r.cover_id ? `/media/${r.cover_id}` : null;
  return json(results);
}

// A hold takes a listing off the site until an operator releases it. Workplan A14 adds a second
// kind, photos: take offline until new photos, with a short reason the breeder sees in the portal
// and by email. That kind lifts itself when the breeder uploads a photo that passes the photo
// check (photoPassedStmts in lib/inactivity.js), and Release still lifts either kind.
async function holdPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const on = !!body.on;
  const photos = on && body.kind === 'photos';
  const reason = photos ? clean(body.reason, 200) : null;
  if (photos && !reason) throw bad('Say in a few words what is wrong with the photos. The breeder sees it.');
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  const t = now();
  await env.DB.batch([
    env.DB.prepare('UPDATE puppies SET operator_hold = ?, hold_kind = ?, hold_reason = ?, hold_at = ?, updated_at = ?, version = version + 1 WHERE id = ?')
      .bind(on ? 1 : 0, photos ? 'photos' : null, reason, on ? t : null, t, id),
    auditStmt(env, 'operator', who.email, photos ? 'puppy.photo_hold' : on ? 'puppy.hold' : 'puppy.release', 'puppy', id,
      { operator_hold: p.operator_hold, hold_kind: p.hold_kind || null }, { operator_hold: on ? 1 : 0, breeder_id: p.breeder_id, ...(photos ? { reason } : {}) }),
    dirtyStmt(env),
  ]);
  if (photos) {
    const b = await env.DB.prepare('SELECT email FROM breeders WHERE id = ?').bind(p.breeder_id).first();
    ctx.waitUntil(sendMail(env, b.email, 'photo_hold', { puppy: p.name, reason, link: `${env.PORTAL_ORIGIN || ''}/#/litters?photos=${id}` }).catch((e) => console.error(e)));
  }
  return json({ ok: true });
}

/** A listing Amber grants without payment, which the Wix migration needs (spec 5). */
async function compPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  if (p.publication_state === 'archived') throw bad('That puppy was removed by the breeder.');
  const s = await settings(env);
  const t = now();
  const base = p.expires_at && p.expires_at > t ? p.expires_at : t;
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE puppies SET payment_state = CASE WHEN payment_state = 'paid' THEN 'paid' ELSE 'comped' END,
         publication_state = 'published', published_at = COALESCE(published_at, ?), expires_at = ?, updated_at = ?, version = version + 1,
         -- Workplan A12. Listing a puppy free starts its photo clock, as a payment does.
         last_photo_at = ?,
         inactive_stage = NULL, stage_at = NULL, inactive_at = NULL
       WHERE id = ?`,
    ).bind(t, s.listingDays > 0 ? addDays(base, s.listingDays) : null, t, t, id),
    auditStmt(env, 'operator', who.email, 'puppy.comp', 'puppy', id, { payment_state: p.payment_state, publication_state: p.publication_state },
      { breeder_id: p.breeder_id, days: s.listingDays }),
    dirtyStmt(env),
  ]);
  return json({ ok: true });
}

/**
 * Acting on a breeder's behalf (plan P3.1). The body may carry only the fields that change; the
 * rest come from the stored row, and the whole result passes the same puppyFields() rules the
 * portal uses. The row keeps its breeder_id, and the audit names the operator.
 */
async function editPuppy(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  if (p.publication_state === 'archived') throw bad('The breeder removed that puppy.');
  const f = puppyFields({ ...puppyInput(p), ...body }, [...(await settings(env)).registries, p.registry]);
  const res = await env.DB.batch([
    env.DB.prepare(
      `UPDATE puppies SET ${puppySet()}, updated_at = ?, version = version + 1
       WHERE id = ? AND version = ?`,
    ).bind(...puppyValues(f), now(), id, Number(body.version)),
    auditStmt(env, 'operator', who.email, 'puppy.update', 'puppy', id, { ...puppyInput(p), breeder_id: p.breeder_id }, { ...f, breeder_id: p.breeder_id }),
    dirtyStmt(env),
  ]);
  checkVersion(res[0], 'puppy');
  return json({ ok: true });
}

/** A litter edited on the breeder's behalf (plan P3.1), under the portal's litterFields() rules. */
async function editLitter(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const l = await env.DB.prepare('SELECT * FROM litters WHERE id = ?').bind(id).first();
  if (!l) throw notFound();
  if (l.archived_at) throw bad('The breeder removed that litter.');
  // The mom and dad must be the litter's own breeder's (workplan A19), whoever makes the edit.
  const f = await checkLitterParents(env, l.breeder_id, litterFields({ ...litterInput(l), ...body }), l);
  if (!(await env.DB.prepare('SELECT 1 AS x FROM breeds WHERE id = ?').bind(f.breed_id).first())) throw bad('Choose a breed from the list.');
  const stmts = [
    env.DB.prepare(
      `UPDATE litters SET breed_id = ?, born_on = ?, ready_on = ?, mom_weight_lb = ?, dad_weight_lb = ?, description = ?, mom_id = ?, dad_id = ?,
         updated_at = ?, version = version + 1 WHERE id = ? AND version = ?`,
    ).bind(f.breed_id, f.born_on, f.ready_on, f.mom_weight_lb, f.dad_weight_lb, f.description, f.mom_id, f.dad_id, now(), id, Number(body.version)),
    auditStmt(env, 'operator', who.email, 'litter.update', 'litter', id, { ...litterInput(l), breeder_id: l.breeder_id }, { ...f, breeder_id: l.breeder_id }),
  ];
  if (await env.DB.prepare('SELECT 1 AS x FROM public_puppies WHERE litter_id = ? LIMIT 1').bind(id).first()) stmts.push(dirtyStmt(env));
  checkVersion((await env.DB.batch(stmts))[0], 'litter');
  return json({ ok: true });
}

// ------------------------------------------------------------------ money, audit, settings

async function listCheckouts(req, env) {
  const status = new URL(req.url).searchParams.get('status');
  const { results } = await env.DB.prepare(
    `SELECT c.*, COALESCE(bp.business_name, b.email || ' (closed)') AS business_name,
            (SELECT group_concat(COALESCE(p.name, i.puppy_name), ', ') FROM checkout_items i LEFT JOIN puppies p ON p.id = i.puppy_id WHERE i.checkout_id = c.id) AS puppies,
            (SELECT status FROM payments pay WHERE pay.checkout_id = c.id) AS payment_status,
            (SELECT d.status FROM disputes d WHERE d.checkout_id = c.id ORDER BY d.opened_at DESC LIMIT 1) AS dispute_status,
            (SELECT COUNT(*) FROM disputes d WHERE d.checkout_id = c.id AND d.closed_at IS NULL) AS dispute_open
       FROM checkouts c JOIN breeders b ON b.id = c.breeder_id LEFT JOIN breeder_profiles bp ON bp.breeder_id = c.breeder_id
      ${status ? 'WHERE c.status = ?' : ''} ORDER BY c.created_at DESC LIMIT 200`,
  ).bind(...(status ? [status] : [])).all();
  return json(results);
}

async function auditList(req, env) {
  const { results } = await env.DB.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').all();
  return json(results);
}

async function getSettings(req, env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings ORDER BY key').all();
  return json(results);
}

const EDITABLE = {
  // 0 means listings stay up until removed (D8), so 0 is allowed.
  listing_days: (v) => /^\d{1,3}$/.test(v),
  warn_days: (v) => /^\d{1,2}$/.test(v),
  suspended_listings_visible: (v) => v === '0' || v === '1',
  min_photos: (v) => /^\d$/.test(v),
  max_photos: (v) => /^\d{1,2}$/.test(v) && Number(v) >= 1,
  // Workplan A3. The registry list breeders pick from, comma-separated, and the video limits.
  registries: (v) => v.length <= 400 && v.split(',').every((x) => x.trim() && x.trim().length <= 40),
  max_videos: (v) => /^\d$/.test(v),
  video_max_seconds: (v) => /^\d{2,3}$/.test(v) && Number(v) >= 10 && Number(v) <= 600,
  // Workplan A9. A photo that fails the quality check goes back to the breeder, or to Photo review.
  photo_check_route: (v) => v === 'breeder' || v === 'review',
  // Workplan A8. Days after adoption that a puppy page leaves the sitemap and becomes noindex.
  adopted_index_days: (v) => /^\d{1,3}$/.test(v) && Number(v) >= 1,
  // Workplan A12. The go-live date the photo clock waits for, as YYYY-MM-DD, or empty for no wait.
  photo_clock_start: (v) => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))),
  // Workplan A12. Days with no new photo to the two warnings, offline and removed, rising.
  inactivity_days: (v) => /^\d{1,3},\d{1,3},\d{1,3},\d{1,3}$/.test(v) && v.split(',').map(Number).every((n, i, a) => n >= 1 && (i === 0 || n > a[i - 1])),
  // terms_version is no longer typed in here. Publishing on the Terms screen sets it (plan P3.4).
};

async function putSettings(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const stmts = [];
  for (const [k, v] of Object.entries(body)) {
    const ok = EDITABLE[k];
    if (!ok) throw bad(`${k} is not editable here.`);
    if (!ok(String(v))) throw bad(`${k} has an invalid value.`);
    stmts.push(env.DB.prepare('UPDATE settings SET value = ? WHERE key = ?').bind(String(v), k));
    stmts.push(auditStmt(env, 'operator', who.email, 'settings.update', 'settings', k, null, { value: String(v) }));
  }
  if (!stmts.length) throw bad('Nothing to change.');
  stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return getSettings(req, env);
}

// ------------------------------------------------------------------ export for the site

async function exportData(req, env) {
  return json(await buildExport(env, `${env.PORTAL_ORIGIN || ''}/media`));
}

async function markPublished(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const { generation } = await readJson(req);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE site_state SET published_generation = ?, last_publish_at = ?, last_publish_sha = 'local-preview',
         dirty = CASE WHEN generation = ? THEN 0 ELSE 1 END, dirty_since = CASE WHEN generation = ? THEN NULL ELSE dirty_since END
       WHERE id = 1`,
    ).bind(Number(generation), now(), Number(generation), Number(generation)),
    auditStmt(env, 'operator', who.email, 'site.publish', 'site', 'preview', null, { generation }),
  ]);
  return json({ ok: true });
}

// ------------------------------------------------------------------ breeds (plan P3.3)

async function listBreedsAdmin(req, env) {
  const { results } = await env.DB.prepare(
    `SELECT b.id, b.slug, b.name, b.guide, b.guide_updated_at, b.colors, b.coats,
            (SELECT COUNT(*) FROM public_puppies pp JOIN litters l ON l.id = pp.litter_id WHERE l.breed_id = b.id) AS live,
            (SELECT COUNT(*) FROM puppies p JOIN litters l ON l.id = p.litter_id WHERE l.breed_id = b.id AND p.publication_state != 'archived') AS puppies,
            (SELECT COUNT(*) FROM breeder_breeds bb WHERE bb.breed_id = b.id) AS breeders
       FROM breeds b ORDER BY b.name`,
  ).all();
  return json(results);
}

/** A comma-separated suggestion list, tidied: each entry trimmed, blanks and repeats dropped. */
function listText(v) {
  const seen = new Set();
  const out = String(v || '').split(',').map((x) => clean(x, 40)).filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()));
  return out.length ? out.slice(0, 30).join(', ') : null;
}

async function breedClash(env, name, slug, exceptId) {
  const r = await env.DB.prepare('SELECT name, slug FROM breeds WHERE (lower(name) = lower(?) OR slug = ?) AND id != ?').bind(name, slug || '', exceptId || '').first();
  if (!r) return null;
  return r.name.toLowerCase() === name.toLowerCase() ? `There is already a breed called ${r.name}.` : `The address ${slug} is already used by ${r.name}.`;
}

/** Add a breed. Its slug is the address of its page on the site, so it must be unique. */
async function addBreed(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const name = clean(body.name, 60);
  if (!name) throw bad('Give the breed a name.');
  const slug = slugify(body.slug || name);
  if (!slug) throw bad('The breed needs a web address made of letters and numbers.');
  const clash = await breedClash(env, name, slug, null);
  if (clash) throw bad(clash);
  let newId = `breed-${slug}`;
  if (await env.DB.prepare('SELECT 1 AS x FROM breeds WHERE id = ?').bind(newId).first()) newId = `breed-${slug}-${ulid().slice(-6).toLowerCase()}`;
  const guide = clean(body.guide, 20000);
  const colors = listText(body.colors), coats = listText(body.coats);
  const t = now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO breeds (id, slug, name, guide, guide_updated_at, colors, coats) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(newId, slug, name, guide, guide ? t : null, colors, coats),
    auditStmt(env, 'operator', who.email, 'breed.add', 'breed', newId, null, { name, slug, guide_chars: guide ? guide.length : 0 }),
  ]);
  return json({ id: newId, slug, name }, 201);
}

/**
 * Rename a breed or edit its guide text. The slug stays as it was, because it is the address
 * of the breed's page and changing it would break links to it.
 */
async function editBreed(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const b = await env.DB.prepare('SELECT * FROM breeds WHERE id = ?').bind(id).first();
  if (!b) throw notFound();
  const name = body.name === undefined ? b.name : clean(body.name, 60);
  if (!name) throw bad('Give the breed a name.');
  const clash = name.toLowerCase() !== b.name.toLowerCase() ? await breedClash(env, name, null, id) : null;
  if (clash) throw bad(clash);
  const guide = body.guide === undefined ? b.guide : clean(body.guide, 20000);
  const colors = body.colors === undefined ? b.colors : listText(body.colors);
  const coats = body.coats === undefined ? b.coats : listText(body.coats);
  const t = now();
  const guideChanged = (guide || null) !== (b.guide || null);
  await env.DB.batch([
    env.DB.prepare('UPDATE breeds SET name = ?, guide = ?, guide_updated_at = ?, colors = ?, coats = ? WHERE id = ?').bind(name, guide, guideChanged ? t : b.guide_updated_at, colors, coats, id),
    auditStmt(env, 'operator', who.email, 'breed.update', 'breed', id, { name: b.name, guide_chars: (b.guide || '').length }, { name, guide_chars: (guide || '').length }),
    dirtyStmt(env),
  ]);
  return json({ ok: true });
}

// ------------------------------------------------------------------ listing terms (plan P3.4)

async function termsState(req, env) {
  const current = await currentTerms(env);
  const draft = await env.DB.prepare("SELECT body, updated_at, updated_by FROM terms_versions WHERE version = 'draft'").first();
  const { results: versions } = await env.DB.prepare(
    "SELECT version, published_at, published_by, length(body) AS chars FROM terms_versions WHERE version != 'draft' ORDER BY published_at DESC",
  ).all();
  const counts = await env.DB.prepare(
    `SELECT SUM(CASE WHEN terms_version = ? THEN 1 ELSE 0 END) AS accepted, SUM(CASE WHEN terms_version = ? THEN 0 ELSE 1 END) AS waiting
       FROM breeders WHERE profile_submitted_at IS NOT NULL AND status != 'declined' AND legacy = 0`,
  ).bind(current.version, current.version).first();
  return json({ current, draft: draft || { body: current.body, updated_at: null, updated_by: null }, versions,
    accepted: counts.accepted || 0, waiting: counts.waiting || 0 });
}

async function saveTermsDraft(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = String((await readJson(req)).body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 60000);
  if (!body) throw bad('The terms cannot be empty.');
  const t = now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO terms_versions (version, body, updated_at, updated_by) VALUES ('draft', ?, ?, ?)
       ON CONFLICT (version) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(body, t, who.email),
    auditStmt(env, 'operator', who.email, 'terms.draft', 'terms', 'draft', null, { chars: body.length }),
  ]);
  return termsState(req, env);
}

/**
 * Publish the draft as a new version. It becomes the version every new sign-up accepts, and
 * every breeder who accepted an older one is asked to accept it on their next visit.
 */
async function publishTerms(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const draft = await env.DB.prepare("SELECT body FROM terms_versions WHERE version = 'draft'").first();
  if (!draft || !draft.body.trim()) throw bad('Write the terms and save the draft first.');
  const current = await currentTerms(env);
  if (draft.body === current.body) throw bad('The draft is the same as the terms already published.');
  const t = now();
  const base = t.slice(0, 10);
  let version = base;
  for (let i = 2; await env.DB.prepare('SELECT 1 AS x FROM terms_versions WHERE version = ?').bind(version).first(); i += 1) version = `${base}-${i}`;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO terms_versions (version, body, updated_at, updated_by, published_at, published_by) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(version, draft.body, t, who.email, t, who.email),
    env.DB.prepare("UPDATE settings SET value = ? WHERE key = 'terms_version'").bind(version),
    auditStmt(env, 'operator', who.email, 'terms.publish', 'terms', version, { version: current.version }, { version, chars: draft.body.length }),
  ]);
  return termsState(req, env);
}

// ------------------------------------------------------------------ publish (plan P3.5)

async function siteScreen(req, env) {
  const { results: recent } = await env.DB.prepare(
    "SELECT at, actor, action, after_json FROM audit_log WHERE action IN ('site.publish', 'site.publish_failed') ORDER BY id DESC LIMIT 10",
  ).all();
  return json({ ...(await siteStatus(env)), recent: recent.map((r) => ({ at: r.at, actor: r.actor, ok: r.action === 'site.publish', detail: r.after_json ? JSON.parse(r.after_json) : null })) });
}

async function publishSite(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const r = await publishNow(env, { type: 'operator', email: who.email });
  return json({ ...r, site: await siteStatus(env) }, r.ok ? 200 : r.off ? 503 : 502);
}

// ------------------------------------------------------------------ email log (plan P3.6)

const EMAIL_LOG_MAX = 1000;

/** The newest sends, searched on the server when q is given, so older mail can still be found. */
async function emailLog(req, env) {
  const q = clean(new URL(req.url).searchParams.get('q'), 200);
  const where = q ? 'WHERE to_addr LIKE ? OR template LIKE ? OR status LIKE ?' : '';
  const like = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];
  const { results } = await env.DB.prepare(`SELECT id, to_addr, template, sent_at, provider_id, status FROM email_log ${where} ORDER BY id DESC LIMIT ${EMAIL_LOG_MAX}`).bind(...like).all();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM email_log ${where}`).bind(...like).first();
  return json({ rows: results, total: total.n, limit: EMAIL_LOG_MAX });
}

// ------------------------------------------------------------------ reports (plan P3.7)

async function reportData(env) {
  const paid = (await env.DB.prepare(
    `SELECT substr(c.paid_at, 1, 7) AS month, SUM(c.quantity) AS paid_listings, SUM(c.amount_total_cents) AS revenue_cents,
            SUM(CASE WHEN pay.status = 'refunded' THEN pay.amount_cents ELSE 0 END) AS refunded_cents
       FROM checkouts c LEFT JOIN payments pay ON pay.checkout_id = c.id
      WHERE c.status = 'paid' AND c.paid_at IS NOT NULL GROUP BY 1`,
  ).all()).results;
  const comped = (await env.DB.prepare(
    "SELECT substr(published_at, 1, 7) AS month, COUNT(*) AS comped FROM puppies WHERE payment_state = 'comped' AND published_at IS NOT NULL GROUP BY 1",
  ).all()).results;
  const byMonth = {};
  for (const r of paid) byMonth[r.month] = { month: r.month, paid_listings: r.paid_listings, comped_listings: 0, revenue_cents: r.revenue_cents, refunded_cents: r.refunded_cents };
  for (const r of comped) (byMonth[r.month] ||= { month: r.month, paid_listings: 0, comped_listings: 0, revenue_cents: 0, refunded_cents: 0 }).comped_listings = r.comped;
  const months = Object.values(byMonth).sort((a, b) => (a.month < b.month ? 1 : -1));

  const breeds = (await env.DB.prepare(
    `SELECT br.name AS breed,
            SUM(CASE WHEN p.id IN (SELECT id FROM public_puppies) THEN 1 ELSE 0 END) AS live,
            SUM(CASE WHEN p.availability = 'placed' THEN 1 ELSE 0 END) AS placed,
            SUM(CASE WHEN p.publication_state = 'draft' THEN 1 ELSE 0 END) AS draft
       FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
      WHERE p.publication_state != 'archived' GROUP BY br.id ORDER BY live DESC, br.name`,
  ).all()).results;
  const one = (sql) => env.DB.prepare(sql).first().then((r) => r.n);
  const summary = {
    live: await one('SELECT COUNT(*) AS n FROM public_puppies'),
    placed: await one("SELECT COUNT(*) AS n FROM puppies WHERE availability = 'placed' AND publication_state != 'archived'"),
    draft: await one("SELECT COUNT(*) AS n FROM puppies WHERE publication_state = 'draft'"),
    held: await one('SELECT COUNT(*) AS n FROM puppies WHERE operator_hold = 1'),
    approved_breeders: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'approved'"),
    // Workplan A4.
    pending: await one("SELECT COUNT(*) AS n FROM public_puppies WHERE availability = 'pending'"),
    reminded: await one("SELECT COUNT(*) AS n FROM puppies WHERE inactive_stage IN ('reminded_1','reminded_2')"),
    offline: await one("SELECT COUNT(*) AS n FROM puppies WHERE inactive_stage = 'offline'"),
    removed: await one("SELECT COUNT(*) AS n FROM puppies WHERE inactive_stage = 'removed'"),
    new_breeders_30: await one(`SELECT COUNT(*) AS n FROM breeders WHERE legacy = 0 AND created_at >= '${addDays(now(), -30)}'`),
    waiting_approval: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NOT NULL"),
  };
  // New breeders by the month they signed up, and how many of those are approved now.
  const newBreeders = (await env.DB.prepare(
    `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS signed_up, SUM(status = 'approved') AS approved
       FROM breeders WHERE legacy = 0 GROUP BY 1 ORDER BY 1 DESC`,
  ).all()).results;
  // Sales the breeders reported by marking puppies placed, kept apart from paid listings because
  // Puppy Connection does not see the sale itself.
  const sales = (await env.DB.prepare(
    `SELECT substr(p.placed_at, 1, 7) AS month, COUNT(*) AS placed, SUM(b.legacy = 1) AS imported
       FROM puppies p JOIN breeders b ON b.id = p.breeder_id
      WHERE p.availability = 'placed' AND p.placed_at IS NOT NULL GROUP BY 1 ORDER BY 1 DESC`,
  ).all()).results;
  // Breed searches on the browse page over the last 30 days.
  const searches = (await env.DB.prepare(
    `SELECT br.name AS breed, SUM(s.searches) AS searches FROM breed_searches s JOIN breeds br ON br.id = s.breed_id
      WHERE s.day >= ? GROUP BY br.id ORDER BY searches DESC, br.name`,
  ).bind(addDays(now(), -30).slice(0, 10)).all()).results;
  const since = addDays(now(), -30).slice(0, 10);
  const views = (await env.DB.prepare(
    `SELECT p.id, p.name, br.name AS breed, bp.business_name,
            SUM(s.views) AS views, SUM(s.clicks) AS clicks,
            SUM(CASE WHEN s.day >= ? THEN s.views ELSE 0 END) AS views_30, SUM(CASE WHEN s.day >= ? THEN s.clicks ELSE 0 END) AS clicks_30,
            p.id IN (SELECT id FROM public_puppies) AS is_public
       FROM puppy_stats s JOIN puppies p ON p.id = s.puppy_id JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
       JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id
      GROUP BY p.id ORDER BY views DESC, clicks DESC LIMIT 25`,
  ).bind(since, since).all()).results;
  return { months, breeds, summary, views, new_breeders: newBreeders, sales, searches };
}

async function reports(req, env) {
  return json(await reportData(env));
}

const dollars = (c) => (c == null ? null : (c / 100).toFixed(2));
const REPORT_CSV = {
  months: (d) => [['Month', 'Paid listings', 'Comped listings', 'Revenue (USD)', 'Refunded (USD)', 'Net (USD)'],
    d.months.map((m) => [m.month, m.paid_listings, m.comped_listings, dollars(m.revenue_cents), dollars(m.refunded_cents), dollars(m.revenue_cents - m.refunded_cents)])],
  breeds: (d) => [['Breed', 'Live on the site', 'Marked placed', 'Drafts'], d.breeds.map((b) => [b.breed, b.live, b.placed, b.draft])],
  summary: (d) => [['Measure', 'Count'], [['Live on the site', d.summary.live], ['Marked placed', d.summary.placed], ['Drafts', d.summary.draft],
    ['On hold', d.summary.held], ['Approved breeders', d.summary.approved_breeders], ['Marked pending', d.summary.pending],
    ['Emailed for a new photo', d.summary.reminded], ['Off the site for no new photo', d.summary.offline], ['Removed for no new photo', d.summary.removed],
    ['New breeders, last 30 days', d.summary.new_breeders_30], ['Waiting for approval', d.summary.waiting_approval]]],
  new_breeders: (d) => [['Month', 'Signed up', 'Approved now'], d.new_breeders.map((m) => [m.month, m.signed_up, m.approved])],
  sales: (d) => [['Month', 'Marked placed by breeders', 'Of which imported Wix listings'], d.sales.map((m) => [m.month, m.placed, m.imported])],
  searches: (d) => [['Breed', 'Searches, last 30 days'], d.searches.map((s) => [s.breed, s.searches])],
  views: (d) => [['Puppy', 'Breed', 'Breeder', 'Views', 'Clicks', 'Views, last 30 days', 'Clicks, last 30 days', 'Live'],
    d.views.map((v) => [v.name, v.breed, v.business_name, v.views, v.clicks, v.views_30, v.clicks_30, v.is_public ? 'yes' : 'no'])],
};

async function reportCsv(req, env, ctx, name) {
  const make = REPORT_CSV[name];
  if (!make) throw notFound();
  const [header, rows] = make(await reportData(env));
  return csvResponse(`puppy-connection-${name}-${now().slice(0, 10)}.csv`, header, rows);
}

// ------------------------------------------------------------------ refunds and disputes (plan P3.8)

async function paymentFor(env, checkoutId) {
  const co = await env.DB.prepare('SELECT * FROM checkouts WHERE id = ?').bind(checkoutId).first();
  if (!co) throw notFound();
  const pay = await env.DB.prepare('SELECT * FROM payments WHERE checkout_id = ?').bind(checkoutId).first();
  if (!pay) throw bad('This checkout has no payment.');
  return { co, pay };
}

// Only the practice provider is driven from here for now. The Stripe provider's refund() is
// written to the same interface, and Stripe's own charge.refunded and dispute events already
// take the same path through handleEvent. P4.5 proves it in test mode and lifts this check.
function practiceOnly(env) {
  const p = provider(env);
  if (p.name !== 'sim') throw new HttpError(503, 'Refunds and disputes are handled in the Stripe Dashboard until the Stripe provider is proven. Its refund and dispute events still take listings down and show here.');
  return p;
}

/** Refund a whole listing payment. The puppies it paid for come off the site, and the breeder is emailed. */
async function refundCheckout(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const reason = clean((await readJson(req)).reason, 500);
  if (!reason) throw bad('Add a private reason, for the record.');
  const p = practiceOnly(env);
  const { pay } = await paymentFor(env, id);
  if (pay.status === 'refunded') throw bad('This payment was already refunded.');
  const event = await p.refund(env, pay.stripe_payment_intent_id);
  const result = event ? await handleEvent(env, event, ctx, { type: 'operator', email: who.email, reason }) : 'sent to the payment provider';
  return json({ ok: true, result });
}

/** Record a practice dispute opening, or closing as won or lost. Listings are not changed. */
async function disputeCheckout(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const action = String(body.action || '');
  if (!['open', 'won', 'lost'].includes(action)) throw bad('A dispute is opened, won or lost.');
  const p = practiceOnly(env);
  const { pay } = await paymentFor(env, id);
  const event = await p.dispute(env, pay.stripe_payment_intent_id, action, clean(body.reason, 200));
  const result = await handleEvent(env, event, ctx, { type: 'operator', email: who.email });
  return json({ ok: true, result });
}

// ------------------------------------------------------------------ needs attention (plan P3.9)

async function attention(req, env) {
  const one = (sql, ...b) => env.DB.prepare(sql).bind(...b).first().then((r) => r.n);
  const site = await siteStatus(env);
  const { results: failedJobs } = await env.DB.prepare('SELECT job, last_run_at, last_error FROM job_runs WHERE last_error IS NOT NULL').all();
  // Public contact details changed in the last week, after the breeder first submitted their
  // profile (before that nothing is public, so every sign-up would show here).
  const { results: rows } = await env.DB.prepare(
    `SELECT a.at, a.actor_type, a.action, a.entity_id, a.before_json, a.after_json, bp.business_name, b.email
       FROM audit_log a JOIN breeders b ON b.id = a.entity_id LEFT JOIN breeder_profiles bp ON bp.breeder_id = b.id
      WHERE a.entity = 'breeder' AND a.action IN ('profile.update', 'profile.extras') AND a.at > ?
        AND b.profile_submitted_at IS NOT NULL
        -- After the submit by audit order, not by the clock, because an edit in the same second as
        -- the submit has an equal timestamp (2026-10-17).
        -- An imported breeder has no submit row, so for them the time alone decides.
        AND a.at >= b.profile_submitted_at
        AND a.id > COALESCE((SELECT MAX(s.id) FROM audit_log s WHERE s.entity = 'breeder' AND s.entity_id = b.id AND s.action = 'profile.submit'), 0)
      ORDER BY a.id DESC`,
  ).bind(addDays(now(), -7)).all();
  const contact = {};
  for (const r of rows) {
    const before = JSON.parse(r.before_json || '{}'), after = JSON.parse(r.after_json || '{}');
    const labels = r.action === 'profile.extras'
      ? ((before.facebook_url || null) !== (after.facebook_url || null) ? ['Facebook page'] : [])
      : contactChanges(before, after).map((c) => c.label);
    if (!labels.length) continue;
    const c = (contact[r.entity_id] ||= { breeder_id: r.entity_id, business_name: r.business_name || r.email, at: r.at, fields: [], by: [] });
    for (const l of labels) if (!c.fields.includes(l)) c.fields.push(l);
    if (!c.by.includes(r.actor_type)) c.by.push(r.actor_type);
  }
  return json({
    queue: await one("SELECT COUNT(*) AS n FROM breeders WHERE status = 'pending' AND profile_submitted_at IS NOT NULL"),
    needs_review: await one("SELECT COUNT(*) AS n FROM checkouts WHERE status = 'needs_review'"),
    open_reports: await one("SELECT COUNT(*) AS n FROM listing_reports WHERE status = 'open'"),
    photo_review: await one("SELECT COUNT(*) AS n FROM photos WHERE quality = 'review'"),
    open_disputes: await one('SELECT COUNT(*) AS n FROM disputes WHERE closed_at IS NULL'),
    publish_error: site.last_error ? { error: site.last_error, at: site.last_error_at } : null,
    failed_jobs: failedJobs,
    close_requests: await one('SELECT COUNT(DISTINCT breeder_id) AS n FROM account_requests WHERE withdrawn_at IS NULL AND resolved_at IS NULL'),
    contact_changes: Object.values(contact),
    held: await one('SELECT COUNT(*) AS n FROM puppies WHERE operator_hold = 1'),
    unpublished_changes: site.waiting,
    // The breeder link check (lib/jobs.js, links): live links that fail or now land on a home page.
    broken_links: (await env.DB.prepare(
      `SELECT lc.url, lc.verdict, lc.failing_since, p.name AS puppy, bp.business_name, p.breeder_id
         FROM link_checks lc JOIN public_puppies p ON p.breeder_url = lc.url
         LEFT JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id WHERE lc.verdict <> 'ok'
       UNION ALL
       SELECT lc.url, lc.verdict, lc.failing_since, NULL, pb.business_name, pb.breeder_id
         FROM link_checks lc JOIN public_breeders pb ON pb.website_url = lc.url WHERE lc.verdict <> 'ok'
       ORDER BY failing_since`,
    ).all()).results,
  });
}

async function media(req, env, ctx, id, card) {
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo?.r2_key) throw notFound();
  // The small card copy the portal makes at upload, or the full photo when there is none.
  const obj = (card && await env.FILES.get(`${photo.r2_key}.card`)) || await env.FILES.get(photo.r2_key);
  if (!obj) throw notFound();
  return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || photo.content_type || 'application/octet-stream', 'cache-control': 'private, no-store' } });
}

/** A saved parent's photo (workplan A19). Operators see it whether or not it is on the site. */
async function parentPhotoAdmin(req, env, id, card) {
  const res = await serveParentPhoto(env, id, { card, allowPrivate: async () => true });
  if (!res) throw notFound();
  res.headers.set('cache-control', 'private, no-store');
  return res;
}

/** Any document, public or private, to a signed-in operator (workplan A20). The router has already checked who they are. */
async function documentAdmin(req, env, ctx, id) {
  const res = await serveDocument(env, id, { allowPrivate: async () => true });
  if (!res) throw notFound();
  res.headers.set('cache-control', 'private, no-store');
  return res;
}

/** A breeder's logo or kennel photo. Operators see them whether or not the breeder is public. */
async function brand(req, env, id, kind) {
  const res = await serveBrand(env, id, kind, { card: new URL(req.url).searchParams.get('size') === 'card', allowPrivate: async () => true });
  if (!res) throw notFound();
  res.headers.set('cache-control', 'private, no-store');
  return res;
}

/** Every test email, for the operator. Only in a test mode, behind the admin's own gate. */
// Plan P5.1. Staging only, after a backup, with the phrase typed (lib/demo.js).
async function demoReset(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  return json(await resetDemo(env, who.email, body.confirm));
}

async function devMail(req, env) {
  if (env.EMAIL_MODE !== 'log' || !['local', 'hosted-test', 'hosted-access', 'staging'].includes(env.DEV_MODE)) throw notFound();
  const { results } = await env.DB.prepare('SELECT * FROM dev_mailbox ORDER BY id DESC LIMIT 60').all();
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rows = results.map((m) => `<article class="mail"><header><b>${e(m.subject)}</b><span>${e(m.to_addr)} at ${e(m.sent_at)}</span></header><pre>${e(m.body)}</pre></article>`).join('');
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All test mail | Puppy Connection</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/portal.css?v=34"></head>
<body class="plain"><main class="plain-card"><p class="sim-flag">Every test email, newest first. Nothing is really sent.</p><h1>All test mail</h1>${rows || '<p>No mail yet.</p>'}<p><a href="/">Back to the admin</a></p></main></body></html>`,
  { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}

// ------------------------------------------------------------------ the mailing list
// migrations/0011_mailing_list.sql. Sending waits on real email (launch checklist L4).

const LIST_STATES = ['subscribed', 'contact', 'unsubscribed'];
// How many rows the Mailing list screen loads for one tab: the newest 200 unless the operator
// picks more. "all" is capped well above the Wix list, so one request can never grow without end.
const LIST_SHOW = { 200: 200, 1000: 1000, all: 20000 };

async function listSubscribers(req, env) {
  const url = new URL(req.url);
  const status = LIST_STATES.includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'subscribed';
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
  const show = LIST_SHOW[url.searchParams.get('show')] ? url.searchParams.get('show') : '200';
  const counts = (await env.DB.prepare('SELECT status, source, COUNT(*) AS n FROM subscribers GROUP BY status, source').all()).results;
  const where = q ? 'AND (email LIKE ? OR lower(name) LIKE ?)' : '';
  const bind = q ? [status, `%${q}%`, `%${q}%`] : [status];
  const { results } = await env.DB.prepare(
    `SELECT id, email, name, source, created_at, unsubscribed_at FROM subscribers WHERE status = ? ${where} ORDER BY created_at DESC, email LIMIT ?`,
  ).bind(...bind, LIST_SHOW[show]).all();
  return json({ counts, rows: results, status, q, show });
}

async function addSubscriberAdmin(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const r = await addSubscriber(env, { email: body.email, name: body.name, source: 'admin' });
  if (!r.ok) throw bad('Enter a valid email address.');
  if (r.result === 'kept_unsubscribed') throw bad('That person unsubscribed, so they stay off the list. They can sign up again from the site themselves.');
  if (r.result === 'already') throw bad('That address is already on the list.');
  await auditStmt(env, 'operator', who.email, 'subscriber.add', 'subscriber', r.id, null, { email: String(body.email).trim().toLowerCase() }).run();
  return json({ ok: true, id: r.id }, 201);
}

/**
 * Import a CSV such as the Wix contacts export, keeping each contact's Wix email state
 * (lib/subscribers.js). Subscribed contacts join the list, unsubscribed ones are stored
 * unsubscribed, and never-subscribed ones are stored as contacts who get no list email.
 *
 * For a row already held, an unsubscribe always wins and nobody who unsubscribed is put back, a
 * contact who subscribed in Wix joins, and anyone else is left as they are. The same rule settles
 * an address that appears twice in the file. Done in a few batched queries rather than one per
 * row. The admin screen splits a large file into parts of a few hundred rows, sent as
 * { cells, batch, part }, so each request stays inside the free plan's CPU, and the counts from
 * each part add up to the file's. A short file can still come whole, as { csv }.
 */
const IMPORT_PART_ROWS = 500;
async function importSubscribers(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req, 1_000_000);
  let parsed;
  if (Array.isArray(body.cells)) {
    if (body.cells.length > IMPORT_PART_ROWS + 1) throw bad(`Send at most ${IMPORT_PART_ROWS} rows at a time.`);
    const cells = body.cells.map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '').slice(0, 500)) : []));
    parsed = readSubscriberRows(cells, { repeatedHead: Number(body.part) > 0 });
  } else {
    const text = String(body.csv || '');
    if (!text.trim()) throw bad('Choose a CSV file first.');
    parsed = parseSubscriberCsv(text);
    if (parsed.rows.length > IMPORT_PART_ROWS) throw bad('That file is too large to send whole. Import it from the Mailing list screen, which sends it in parts.');
  }
  if (!parsed.rows.length && !parsed.blank) throw bad('No email column was found in that file.');
  const batchId = /^[0-9A-Z]{26}$/.test(String(body.batch || '')) ? body.batch : ulid();
  const rank = { contact: 1, subscribed: 2, unsubscribed: 3 };
  const seen = new Map();
  let invalid = 0, dupes = 0;
  for (const r of parsed.rows) {
    const e = r.email.trim().toLowerCase();
    if (!EMAIL_OK.test(e) || e.length > 200) { invalid += 1; continue; }
    const had = seen.get(e);
    if (had) { dupes += 1; if (rank[r.state] > rank[had.state]) had.state = r.state; } else seen.set(e, { name: r.name, state: r.state });
  }
  const emails = [...seen.keys()];
  const have = new Map();
  for (let i = 0; i < emails.length; i += 90) {
    const part = emails.slice(i, i + 90);
    const { results } = await env.DB.prepare(`SELECT id, lower(email) AS email, status, import_batch FROM subscribers WHERE lower(email) IN (${part.map(() => '?').join(',')})`).bind(...part).all();
    for (const x of results) have.set(x.email, x);
  }
  const t = now();
  const added = { subscribed: 0, unsubscribed: 0, contact: 0 };
  const out = { added, already: 0, kept_unsubscribed: 0, joined: 0, unsubscribed_now: 0 };
  const stmts = [];
  for (const [e, r] of seen) {
    const x = have.get(e);
    if (!x) {
      added[r.state] += 1;
      stmts.push(env.DB.prepare(
        "INSERT OR IGNORE INTO subscribers (id, email, name, source, status, unsub_token, created_at, unsubscribed_at, import_batch) VALUES (?, ?, ?, 'import', ?, ?, ?, ?, ?)",
      ).bind(ulid(), e, clean(r.name, 120), r.state, randomToken(), t, r.state === 'unsubscribed' ? t : null, batchId));
      continue;
    }
    // A repeat of an address an earlier part of this same file added counts as a duplicate row.
    if (x.import_batch === batchId) dupes += 1;
    if (x.status === 'unsubscribed') { if (x.import_batch !== batchId) out.kept_unsubscribed += 1; continue; }
    const to = r.state === 'unsubscribed' ? 'unsubscribed' : r.state === 'subscribed' && x.status === 'contact' ? 'subscribed' : null;
    if (to) stmts.push(to === 'unsubscribed'
      ? env.DB.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?").bind(t, x.id)
      : env.DB.prepare("UPDATE subscribers SET status = 'subscribed' WHERE id = ?").bind(x.id));
    // Within one file the added counts move with the row, so they always say where its rows ended up.
    if (x.import_batch === batchId) { if (to) { added[x.status] -= 1; added[to] += 1; } } else if (to === 'unsubscribed') out.unsubscribed_now += 1;
    else if (to) out.joined += 1;
    else out.already += 1;
  }
  for (let i = 0; i < stmts.length; i += 100) await env.DB.batch(stmts.slice(i, i + 100));
  Object.assign(out, { invalid, no_address: parsed.blank, duplicates_in_file: dupes, status_column: parsed.statusColumn, batch: batchId });
  await auditStmt(env, 'operator', who.email, 'subscriber.import', 'subscriber', batchId, null, { ...out, part: Number(body.part) || 0 }).run();
  return json(out);
}

async function unsubscribeAdmin(req, env, ctx, id, who) {
  requireSameOrigin(req);
  // Only what keeps the address from being emailed again stays (lib/retention.js).
  const t = now();
  const r = await env.DB.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ?, name = NULL, source = NULL, import_batch = NULL, created_at = ? WHERE id = ? AND status IN ('subscribed', 'contact')").bind(t, t, id).run();
  if (r.meta.changes !== 1) throw notFound();
  await auditStmt(env, 'operator', who.email, 'subscriber.unsubscribe', 'subscriber', id, null, null).run();
  return json({ ok: true });
}

async function subscribersCsv(req, env) {
  const { results } = await env.DB.prepare("SELECT email, name, source, created_at FROM subscribers WHERE status = 'subscribed' ORDER BY created_at").all();
  return csvResponse('puppy-connection-mailing-list.csv', ['Email', 'Name', 'Joined from', 'Joined'], results.map((r) => [r.email, r.name, r.source, r.created_at]));
}

// ------------------------------------------------------------------ sending to the mailing list

async function listCampaigns(req, env) {
  const { results } = await env.DB.prepare(
    'SELECT id, subject, body, status, audience, created_by, created_at, updated_at, send_started_at, sent_at, total, sent_count, failed_count FROM campaigns ORDER BY created_at DESC LIMIT 50',
  ).all();
  // The count for each audience, shown on the send button before anything is sent (launch workplan C5).
  const n = await audienceCount(env, 'subscribers'), all = await audienceCount(env, 'all');
  return json({ campaigns: results, subscribed: n, audiences: { subscribers: n, all }, address: await mailingAddress(env), email_mode: env.EMAIL_MODE || 'off' });
}

function campaignInput(body) {
  const subject = clean(body.subject, 150);
  const text = String(body.body || '').replace(/\r\n/g, '\n').trim().slice(0, 20000);
  if (!subject) throw bad('Give the email a subject.');
  if (!text) throw bad('Write the email before saving it.');
  return { subject, text };
}

async function createCampaign(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const { subject, text } = campaignInput(await readJson(req));
  const cid = ulid(), t = now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO campaigns (id, subject, body, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(cid, subject, text, who.email, t, t),
    auditStmt(env, 'operator', who.email, 'campaign.create', 'campaign', cid, null, { subject }),
  ]);
  return json({ id: cid }, 201);
}

async function draftOf(env, id) {
  const c = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  if (!c) throw notFound();
  return c;
}

async function updateCampaign(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const c = await draftOf(env, id);
  if (c.status !== 'draft') throw bad('That email has been sent, so it can no longer be changed.');
  const { subject, text } = campaignInput(await readJson(req));
  await env.DB.batch([
    env.DB.prepare('UPDATE campaigns SET subject = ?, body = ?, updated_at = ? WHERE id = ?').bind(subject, text, now(), id),
    auditStmt(env, 'operator', who.email, 'campaign.update', 'campaign', id, { subject: c.subject }, { subject }),
  ]);
  return json({ ok: true });
}

async function deleteCampaign(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const c = await draftOf(env, id);
  if (c.status !== 'draft') throw bad('A sent email stays in the list as a record.');
  await env.DB.batch([
    env.DB.prepare("DELETE FROM campaigns WHERE id = ? AND status = 'draft'").bind(id),
    auditStmt(env, 'operator', who.email, 'campaign.delete', 'campaign', id, { subject: c.subject }, null),
  ]);
  return json({ ok: true });
}

async function testCampaign(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const c = await draftOf(env, id);
  await sendCampaignTest(env, c, who.email);
  return json({ ok: true, to: who.email });
}

async function sendCampaign(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const c = await draftOf(env, id);
  if (c.status !== 'draft') throw bad('That email has already been sent or is sending.');
  if (!(await mailingAddress(env))) throw bad('Add the mailing address first. The law on marketing email requires one in every email.');
  const body = await readJson(req);
  let audience;
  try { audience = audienceOf(body.audience); } catch { throw bad('Choose subscribers only, or all contacts.'); }
  const n = await audienceCount(env, audience);
  if (!n) throw bad(audience === 'all' ? 'There are no contacts to send to.' : 'Nobody is on the list yet.');
  // The count the operator saw must still be the count, so a send never reaches more people than they confirmed.
  if (Number(body.confirm_count) !== n) throw bad(`${audience === 'all' ? 'All contacts come' : 'The list comes'} to ${n} people now. Check the number and send again.`);
  const total = await startCampaign(env, id, audience);
  await auditStmt(env, 'operator', who.email, 'campaign.send', 'campaign', id, null, { subject: c.subject, audience, total }).run();
  ctx.waitUntil(runCampaigns(env).catch((e) => console.error('campaign run failed', e)));
  return json({ ok: true, total });
}

async function putMailingAddress(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const address = String((await readJson(req)).address || '').replace(/\r\n/g, '\n').trim().slice(0, 300);
  if (address.length < 10 || !/\d/.test(address)) throw bad('Enter a full postal address, such as a street address or a PO box with its city, state and ZIP.');
  const before = await mailingAddress(env);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO settings (key, value) VALUES ('mailing_address', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").bind(address),
    auditStmt(env, 'operator', who.email, 'settings.update', 'settings', 'mailing_address', { value: before || null }, { value: address }),
  ]);
  return json({ ok: true, address });
}

// ------------------------------------------------------------------ the people who sign in here

async function listPeople(req, env) {
  const { results } = await env.DB.prepare('SELECT email, name, role, added_at FROM people ORDER BY role, name').all();
  return json(results);
}

async function addPerson(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const name = clean(body.name, 120);
  const role = body.role === 'owner' ? 'owner' : 'staff';
  if (!EMAIL_OK.test(email)) throw bad('Enter a valid email address.');
  if (!name) throw bad('Enter their name.');
  if (await env.DB.prepare('SELECT 1 AS x FROM people WHERE email = ?').bind(email).first()) throw bad('That person can already sign in here.');
  await env.DB.batch([
    env.DB.prepare('INSERT INTO people (email, name, role, added_at) VALUES (?, ?, ?, ?)').bind(email, name, role, now()),
    auditStmt(env, 'operator', who.email, 'person.add', 'person', email, null, { name, role }),
  ]);
  return listPeople(req, env);
}

async function ownersLeft(env, excluding) {
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM people WHERE role = 'owner' AND email != ?").bind(excluding).first();
  return n;
}

async function setPersonRole(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const email = decodeURIComponent(id).toLowerCase();
  const p = await env.DB.prepare('SELECT * FROM people WHERE email = ?').bind(email).first();
  if (!p) throw notFound();
  const role = (await readJson(req)).role === 'owner' ? 'owner' : 'staff';
  if (p.role === 'owner' && role === 'staff' && !(await ownersLeft(env, email))) throw bad('There has to be at least one owner.');
  await env.DB.batch([
    env.DB.prepare('UPDATE people SET role = ? WHERE email = ?').bind(role, email),
    auditStmt(env, 'operator', who.email, 'person.role', 'person', email, { role: p.role }, { role }),
  ]);
  return listPeople(req, env);
}

async function removePerson(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const email = decodeURIComponent(id).toLowerCase();
  const p = await env.DB.prepare('SELECT * FROM people WHERE email = ?').bind(email).first();
  if (!p) throw notFound();
  if (email === String(who.email).toLowerCase()) throw bad('Ask another owner to remove you.');
  if (p.role === 'owner' && !(await ownersLeft(env, email))) throw bad('There has to be at least one owner.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM people WHERE email = ?').bind(email),
    auditStmt(env, 'operator', who.email, 'person.remove', 'person', email, { name: p.name, role: p.role }, null),
  ]);
  return listPeople(req, env);
}

// ------------------------------------------------------------------ photos, managed for a breeder
// The same rules as the portal's photo upload: a puppy holds up to the photo limit, camera and
// location details are removed before storing, and the browser sends a small card copy after.

const CARD_MAX_EDGE = 1000;
const cardKeyOf = (key) => `${key}.card`;
const isPublicPuppy = async (env, id) => !!(await env.DB.prepare('SELECT 1 AS x FROM public_puppies WHERE id = ?').bind(id).first());

async function adminPuppyPhotos(req, env, ctx, id) {
  const { results } = await env.DB.prepare('SELECT id, position, aspect, r2_key, external_url FROM photos WHERE puppy_id = ? ORDER BY position').bind(id).all();
  // Uploaded photos come from R2 through /media; imported ones still live at their Wix address.
  return json(results.map((r) => ({ id: r.id, position: r.position, aspect: r.aspect, url: photoUrl(r), card: r.r2_key ? `/media/${r.id}/card` : r.external_url })));
}

async function adminUploadPhoto(req, env, ctx, puppyId, who) {
  requireSameOrigin(req);
  const p = await env.DB.prepare('SELECT * FROM puppies WHERE id = ?').bind(puppyId).first();
  if (!p) throw notFound();
  if (p.publication_state === 'archived') throw bad('The breeder removed that puppy.');
  const s = await settings(env);
  const count = await env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(MIN(position), 1) - 1 AS first FROM photos WHERE puppy_id = ?').bind(puppyId).first();
  if (count.n >= s.maxPhotos) throw bad(`A puppy can have up to ${s.maxPhotos} photos.`);
  const raw = new Uint8Array(await req.arrayBuffer());
  const img = cleanImage(raw);
  const id = ulid();
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[img.type];
  const key = `uploads/${p.breeder_id}/${id}.${ext}`;
  await env.FILES.put(key, img.bytes, { httpMetadata: { contentType: img.type } });
  const aspect = img.size && img.size.h ? Math.round((img.size.w / img.size.h) * 1000) / 1000 : null;
  const stmts = [
    env.DB.prepare(`INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, bytes, position, aspect, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, p.breeder_id, puppyId, key, img.type, img.bytes.length, count.first, aspect, now()),
    auditStmt(env, 'operator', who.email, 'photo.add', 'puppy', puppyId, null, { photo: id, bytes: img.bytes.length, breeder_id: p.breeder_id }),
  ];
  if (await isPublicPuppy(env, puppyId)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ id, url: `/media/${id}` }, 201);
}

async function adminUploadCard(req, env, ctx, id) {
  requireSameOrigin(req);
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo || !photo.r2_key) throw notFound();
  const img = cleanImage(new Uint8Array(await req.arrayBuffer()));
  if (!img.size || Math.max(img.size.w, img.size.h) > CARD_MAX_EDGE) throw bad(`A card copy can be up to ${CARD_MAX_EDGE} pixels on its longest side.`);
  await env.FILES.put(cardKeyOf(photo.r2_key), img.bytes, { httpMetadata: { contentType: img.type } });
  return json({ ok: true }, 201);
}

async function adminDeletePhoto(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const photo = await env.DB.prepare('SELECT * FROM photos WHERE id = ?').bind(id).first();
  if (!photo) throw notFound();
  const stmts = [
    env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id),
    auditStmt(env, 'operator', who.email, 'photo.remove', 'puppy', photo.puppy_id, { photo: id, breeder_id: photo.breeder_id }, null),
  ];
  if (await isPublicPuppy(env, photo.puppy_id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  if (photo.r2_key) await env.FILES.delete([photo.r2_key, cardKeyOf(photo.r2_key)]);
  return json({ ok: true });
}

// ------------------------------------------------------------------ photo review (workplan A9)

// Photos the quality check held back while photo_check_route is review. Keep puts one on the
// listing; Send back tells the breeder what is wrong, as the breeder route does on its own.
async function photoReview(req, env) {
  const { results } = await env.DB.prepare(
    `SELECT ph.id, ph.puppy_id, ph.breeder_id, ph.quality_reasons, ph.created_at, p.name AS puppy, bp.business_name
       FROM photos ph JOIN puppies p ON p.id = ph.puppy_id LEFT JOIN breeder_profiles bp ON bp.breeder_id = ph.breeder_id
      WHERE ph.quality = 'review' ORDER BY ph.created_at LIMIT 200`,
  ).all();
  return json(results.map((r) => ({ ...r, url: `/media/${r.id}`, messages: reasonText(r.quality_reasons) })));
}

async function decidePhoto(req, env, ctx, id, who, outcome) {
  requireSameOrigin(req);
  const ph = await env.DB.prepare("SELECT * FROM photos WHERE id = ? AND quality = 'review'").bind(id).first();
  if (!ph) throw bad('That photo is no longer waiting for review.');
  const quality = outcome === 'keep' ? 'pass' : 'sent_back';
  const stmts = [
    env.DB.prepare("UPDATE photos SET quality = ?, quality_note = ? WHERE id = ? AND quality = 'review'").bind(quality, `${outcome} by ${who.email}`, id),
    auditStmt(env, 'operator', who.email, `photo.${quality}`, 'puppy', ph.puppy_id, null, { photo: id }),
  ];
  if (quality === 'pass' && await isPublicPuppy(env, ph.puppy_id)) stmts.push(dirtyStmt(env));
  // Workplan A12 and A14. A kept photo counts as a new photo for the schedule and a photo hold.
  if (quality === 'pass') stmts.push(...await photoPassedStmts(env, ph.puppy_id, ph.created_at, { type: 'operator', email: who.email }));
  await env.DB.batch(stmts);
  if (quality === 'sent_back') {
    const b = await loadBreeder(env, ph.breeder_id);
    const pup = await env.DB.prepare('SELECT name FROM puppies WHERE id = ?').bind(ph.puppy_id).first();
    ctx.waitUntil(sendMail(env, b.email, 'photo_sent_back', { puppy: pup.name, messages: reasonText(ph.quality_reasons), portalUrl: `${env.PORTAL_ORIGIN || ''}/#/litters` })
      .catch((e) => console.error(e)));
  }
  return json({ ok: true, quality });
}

// ------------------------------------------------------------------ reported listings (workplan A5)

async function listingReports(req, env) {
  return json(await listReports(env, new URL(req.url).searchParams.get('status')));
}

async function closeListingReport(req, env, ctx, id, who, outcome) {
  requireSameOrigin(req);
  const body = await readJson(req);
  if (!(await closeReport(env, id, outcome, body.note, who))) throw bad('That report is already closed.');
  return json({ ok: true });
}

async function adminDeleteVideo(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const v = await env.DB.prepare('SELECT * FROM puppy_videos WHERE id = ?').bind(id).first();
  if (!v) throw notFound();
  await removeVideo(env, v.stream_uid);
  const stmts = [
    env.DB.prepare('DELETE FROM puppy_videos WHERE id = ?').bind(id),
    auditStmt(env, 'operator', who.email, 'video.remove', 'puppy', v.puppy_id, { video: id, breeder_id: v.breeder_id }, null),
  ];
  if (v.status === 'ready' && await isPublicPuppy(env, v.puppy_id)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

async function adminOrderPhotos(req, env, ctx, puppyId, who) {
  requireSameOrigin(req);
  const { ids } = await readJson(req);
  const { results } = await env.DB.prepare('SELECT id FROM photos WHERE puppy_id = ?').bind(puppyId).all();
  const have = new Set(results.map((r) => r.id));
  if (!Array.isArray(ids) || ids.length !== have.size || !ids.every((x) => have.has(x))) throw bad('That photo order does not match this puppy.');
  const stmts = ids.map((pid, i) => env.DB.prepare('UPDATE photos SET position = ? WHERE id = ? AND puppy_id = ?').bind(i, pid, puppyId));
  stmts.push(auditStmt(env, 'operator', who.email, 'photo.order', 'puppy', puppyId, null, { ids }));
  if (await isPublicPuppy(env, puppyId)) stmts.push(dirtyStmt(env));
  await env.DB.batch(stmts);
  return json({ ok: true });
}

// ------------------------------------------------------------------ staff
// Owners can do everything. Staff manage listings for breeders and nothing more (the draft
// Amber marks up, hs-proposals/puppyconnection/staff-permissions.html). This is an allow list,
// so a route added later is owner-only until someone decides staff should have it.
const STAFF_ALLOWED = [
  // The email log is owner-only (Alex, 2026-10-24), because list emails name the people on the mailing list.
  ['GET', /^\/api\/(whoami|stats|attention|listings|breeds|site|audit)$/],
  ['GET', /^\/api\/breeders(\/[\w-]+)?$/],
  ['GET', /^\/(media|brand)\//],
  ['GET', /^\/dev\/mail$/],
  ['GET', /^\/api\/puppies\/[\w-]+\/photos$/],
  ['POST', /^\/api\/breeders\/[\w-]+\/notes$/],
  ['PUT', /^\/api\/breeders\/[\w-]+\/profile$/],
  ['POST', /^\/api\/puppies\/[\w-]+\/(hold|photos)$/],
  ['PUT', /^\/api\/puppies\/[\w-]+(\/photo-order)?$/],
  ['PUT', /^\/api\/litters\/[\w-]+$/],
  ['POST', /^\/api\/site\/publish$/],
  ['POST', /^\/api\/photos\/[\w-]+\/card$/],
  ['DELETE', /^\/api\/photos\/[\w-]+$/],
  ['DELETE', /^\/api\/videos\/[\w-]+$/],
  // Workplan A5. Staff read and close reports. Suspending the breeder stays with the owners.
  ['GET', /^\/api\/listing-reports$/],
  ['GET', /^\/api\/photo-review$/],
  ['POST', /^\/api\/photo-review\/[\w-]+\/(keep|send_back)$/],
  ['POST', /^\/api\/listing-reports\/[\w-]+\/(handled|dismissed)$/],
];
const staffMay = (method, pathname) => STAFF_ALLOWED.some(([m, rx]) => m === method && rx.test(pathname));

const ROUTES = [
  // Workplan A17. The launch checklist (lib/checklist.js). Owners only, like every route staff are not given.
  ['GET', /^\/api\/checklist$/, checklist],
  ['GET', /^\/api\/checklist\/summary$/, checklistSummary],
  ['POST', /^\/api\/checklist\/items$/, addChecklistItem],
  ['GET', /^\/api\/checklist\/items\/([\w-]+)$/, checklistItem],
  ['PUT', /^\/api\/checklist\/items\/([\w-]+)$/, editChecklistItem],
  ['POST', /^\/api\/checklist\/items\/([\w-]+)\/tick$/, tickChecklistItem],
  ['POST', /^\/api\/checklist\/items\/([\w-]+)\/move$/, moveChecklistItem],
  ['POST', /^\/api\/checklist\/items\/([\w-]+)\/(archive|restore)$/, archiveChecklistItem],
  ['POST', /^\/api\/checklist\/items\/([\w-]+)\/comments$/, commentChecklistItem],
  ['POST', /^\/api\/checklist\/items\/([\w-]+)\/parts$/, addChecklistPart],
  ['PUT', /^\/api\/checklist\/parts\/([\w-]+)$/, editChecklistPart],
  ['POST', /^\/api\/checklist\/parts\/([\w-]+)\/tick$/, tickChecklistPart],
  ['POST', /^\/api\/checklist\/parts\/([\w-]+)\/move$/, moveChecklistPart],
  ['POST', /^\/api\/checklist\/parts\/([\w-]+)\/(archive|restore)$/, archiveChecklistPart],
  ['GET', /^\/api\/photo-review$/, photoReview],
  ['POST', /^\/api\/photo-review\/([\w-]+)\/(keep|send_back)$/, decidePhoto],
  ['GET', /^\/api\/listing-reports$/, listingReports],
  ['POST', /^\/api\/listing-reports\/([\w-]+)\/(handled|dismissed)$/, closeListingReport],
  ['DELETE', /^\/api\/videos\/([\w-]+)$/, adminDeleteVideo],
  ['GET', /^\/api\/campaigns$/, listCampaigns],
  ['POST', /^\/api\/campaigns$/, createCampaign],
  ['PUT', /^\/api\/campaigns\/([\w-]+)$/, updateCampaign],
  ['DELETE', /^\/api\/campaigns\/([\w-]+)$/, deleteCampaign],
  ['POST', /^\/api\/campaigns\/([\w-]+)\/test$/, testCampaign],
  ['POST', /^\/api\/campaigns\/([\w-]+)\/send$/, sendCampaign],
  ['PUT', /^\/api\/mailing-address$/, putMailingAddress],
  ['GET', /^\/api\/people$/, listPeople],
  ['POST', /^\/api\/people$/, addPerson],
  ['PUT', /^\/api\/people\/([^/]+)$/, setPersonRole],
  ['DELETE', /^\/api\/people\/([^/]+)$/, removePerson],
  ['GET', /^\/api\/puppies\/([\w-]+)\/photos$/, adminPuppyPhotos],
  ['POST', /^\/api\/puppies\/([\w-]+)\/photos$/, adminUploadPhoto],
  ['PUT', /^\/api\/puppies\/([\w-]+)\/photo-order$/, adminOrderPhotos],
  ['POST', /^\/api\/photos\/([\w-]+)\/card$/, adminUploadCard],
  ['DELETE', /^\/api\/photos\/([\w-]+)$/, adminDeletePhoto],
  ['GET', /^\/api\/subscribers$/, listSubscribers],
  ['POST', /^\/api\/subscribers$/, addSubscriberAdmin],
  ['POST', /^\/api\/subscribers\/import$/, importSubscribers],
  ['GET', /^\/api\/subscribers\.csv$/, subscribersCsv],
  ['POST', /^\/api\/subscribers\/([\w-]+)\/unsubscribe$/, unsubscribeAdmin],
  ['GET', /^\/dev\/mail$/, devMail],
  ['GET', /^\/api\/whoami$/, whoami],
  ['GET', /^\/api\/stats$/, stats],
  ['GET', /^\/api\/breeders$/, listBreeders],
  ['GET', /^\/api\/breeders\/([\w-]+)$/, breederDetail],
  ['POST', /^\/api\/breeders\/([\w-]+)\/(approve|decline|suspend|reinstate|reopen)$/, null],
  ['PUT', /^\/api\/breeders\/([\w-]+)\/email$/, changeEmail],
  ['POST', /^\/api\/breeders\/([\w-]+)\/people$/, addPersonAdmin],
  ['DELETE', /^\/api\/breeders\/([\w-]+)\/people\/([\w-]+)$/, (r, e, c, id, who, mid) => removePersonAdmin(r, e, c, id, who, mid)],
  ['POST', /^\/api\/breeders\/([\w-]+)\/people\/invite$/, invitePerson],
  ['POST', /^\/api\/breeders\/([\w-]+)\/people\/main$/, makeMainAdmin],
  ['POST', /^\/api\/breeders\/([\w-]+)\/people\/reset-authenticator$/, resetAuthenticator],
  ['PUT', /^\/api\/breeders\/([\w-]+)\/access$/, setAccessAdmin],
  ['POST', /^\/api\/breeders\/([\w-]+)\/manage$/, manageAs],
  ['PUT', /^\/api\/breeders\/([\w-]+)\/profile$/, editProfile],
  ['POST', /^\/api\/breeders\/([\w-]+)\/notes$/, addNote],
  ['POST', /^\/api\/breeders\/([\w-]+)\/close-request\/resolve$/, resolveClose],
  ['GET', /^\/brand\/([\w-]+)\/logo$/, (r, e, c, id) => brand(r, e, id, 'logo')],
  ['GET', /^\/brand\/([\w-]+)\/kennel$/, (r, e, c, id) => brand(r, e, id, 'kennel')],
  ['GET', /^\/api\/listings$/, listListings],
  ['POST', /^\/api\/puppies\/([\w-]+)\/hold$/, holdPuppy],
  ['POST', /^\/api\/puppies\/([\w-]+)\/comp$/, compPuppy],
  ['PUT', /^\/api\/puppies\/([\w-]+)$/, editPuppy],
  ['PUT', /^\/api\/litters\/([\w-]+)$/, editLitter],
  ['GET', /^\/api\/breeds$/, listBreedsAdmin],
  ['POST', /^\/api\/breeds$/, addBreed],
  ['PUT', /^\/api\/breeds\/([\w-]+)$/, editBreed],
  ['GET', /^\/api\/terms$/, termsState],
  ['PUT', /^\/api\/terms\/draft$/, saveTermsDraft],
  ['POST', /^\/api\/terms\/publish$/, publishTerms],
  ['GET', /^\/api\/site$/, siteScreen],
  ['POST', /^\/api\/site\/publish$/, publishSite],
  ['GET', /^\/api\/email-log$/, emailLog],
  ['GET', /^\/api\/reports$/, reports],
  ['GET', /^\/api\/reports\/(months|breeds|summary|views|searches|new_breeders|sales)\.csv$/, reportCsv],
  ['POST', /^\/api\/checkouts\/([\w-]+)\/refund$/, refundCheckout],
  ['POST', /^\/api\/checkouts\/([\w-]+)\/dispute$/, disputeCheckout],
  ['GET', /^\/api\/attention$/, attention],
  ['GET', /^\/api\/checkouts$/, listCheckouts],
  ['GET', /^\/api\/audit$/, auditList],
  ['GET', /^\/api\/settings$/, getSettings],
  ['GET', /^\/api\/jobs$/, listJobs],
  ['POST', /^\/api\/jobs\/(\w+)\/run$/, runJobNow],
  ['POST', /^\/api\/demo\/reset$/, demoReset],
  ['PUT', /^\/api\/settings$/, putSettings],
  ['GET', /^\/api\/export$/, exportData],
  ['POST', /^\/api\/site\/published$/, markPublished],
  ['GET', /^\/media\/parent\/([\w-]+)$/, (r, e, c, id) => parentPhotoAdmin(r, e, id, false)],
  ['GET', /^\/media\/parent\/([\w-]+)\/card$/, (r, e, c, id) => parentPhotoAdmin(r, e, id, true)],
  ['GET', /^\/media\/doc\/([\w-]+)$/, documentAdmin],
  ['GET', /^\/media\/([\w-]+)$/, media],
  ['GET', /^\/media\/([\w-]+)\/card$/, (r, e, c, id, who) => media(r, e, c, id, true)],
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const locked = gate(request, env);
    if (locked) return locked;
    try {
      const who = await identify(request, env, ctx);
      if (!who.ok) {
        const wantsHtml = (request.headers.get('accept') || '').includes('text/html');
        if (wantsHtml) {
          return new Response(`<!doctype html><meta charset="utf-8"><title>Not signed in</title><p style="font:16px system-ui;margin:3rem">${who.reason}</p>`,
            { status: who.status, headers: { 'content-type': 'text/html; charset=utf-8', ...SECURITY_HEADERS } });
        }
        return json({ error: who.reason }, who.status);
      }
      if (who.person.role !== 'owner' && !staffMay(request.method, url.pathname)) {
        if (url.pathname.startsWith('/api/')) return withHeaders(json({ error: 'Only an owner can do that.' }, 403), SECURITY_HEADERS);
      }
      for (const [method, rx, fn] of ROUTES) {
        const m = url.pathname.match(rx);
        if (!m || request.method !== method) continue;
        const res = fn ? await fn(request, env, ctx, m[1], who, m[2]) : await decide(request, env, ctx, m[1], who, m[2]);
        return withHeaders(res, SECURITY_HEADERS);
      }
      if (url.pathname.startsWith('/api/')) throw notFound();
      const asset = await env.ASSETS.fetch(new Request(new URL(url.pathname === '/' ? '/index.html' : url.pathname, url), request));
      return withHeaders(asset, SECURITY_HEADERS);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, ...(e.extra || {}) }, e.status);
      console.error(e);
      return json({ error: 'Something went wrong.' }, 500);
    }
  },
};
