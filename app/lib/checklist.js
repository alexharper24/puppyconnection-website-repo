// The launch checklist in the admin (workplan A17). Alex and Amber work through every item to
// go-live and the Gate 1, 2 and 3 additions here, each with an owner, a status, parts with their
// own owner and tick, and comments.
//
// Rules the routes keep:
// - Who is acting comes from the signed-in address. checklist_signers maps an address to the
//   names it may act as, and the shared Amber and Luke address picks one with `as` on each write.
// - Every write goes in audit_log under entity checklist_item and the item's id, with the name
//   acting in after_json, so an item's history is one indexed read and shows on Activity too.
// - Nothing is deleted. Archiving takes an item or a part off the list, and only Alex may do it
//   or undo it.
// - Edits carry the item's version, so two people editing at once get a reload message rather
//   than one quietly overwriting the other.

import { now, clean, ulid, bad, notFound, json, readJson, requireSameOrigin, HttpError } from './util.js';
import { auditStmt, checkVersion } from './store.js';

// Who an item or part can belong to (Alex, 2026-10-19: "I just want it to be Amber and Alex").
// Claude's work is Alex's, and migrations/0035 moved the earlier Claude and Luke rows across.
export const OWNERS = ['Alex', 'Amber'];
// Who can be acting. The shared address is Amber and Luke, and a session ticking through
// ops/checklist.mjs records Claude, so these stay wider than the owners.
const ACTORS = ['Alex', 'Amber', 'Luke', 'Claude'];
export const SECTIONS = ['launch', 'gate1', 'gate2', 'gate3'];
export const STATUSES = ['not_started', 'in_progress', 'waiting', 'done'];
const ARCHIVER = 'Alex';

/** The names this operator may act as, and the one acting on this request. */
export async function actor(env, who, asked) {
  const row = await env.DB.prepare('SELECT names FROM checklist_signers WHERE email = ?').bind(who.email).first();
  const names = row ? row.names.split(',').map((s) => s.trim()).filter((s) => ACTORS.includes(s)) : [];
  const name = names.includes(asked) ? asked : names[0] || who.person?.name || who.email;
  return { names, name, email: who.email, canArchive: names.includes(ARCHIVER) };
}

const audit = (env, me, action, itemId, before, after) =>
  auditStmt(env, 'operator', me.email, `checklist.${action}`, 'checklist_item', itemId, before, { ...(after || {}), as: me.name });

const pick = (v, list, what) => {
  if (!list.includes(v)) throw bad(`Choose ${what}.`);
  return v;
};

async function loadItem(env, id) {
  const it = await env.DB.prepare('SELECT * FROM checklist_items WHERE id = ?').bind(id).first();
  if (!it) throw notFound();
  return it;
}

/** The areas in the order that unblocks the most (migrations/0044). */
const allAreas = async (env) => (await env.DB.prepare('SELECT id, name, position FROM checklist_areas ORDER BY position, name').all()).results;

/** Every item with its parts and comment count. Archived items come only when asked for. */
async function allItems(env, archived) {
  const items = (await env.DB.prepare(
    `SELECT i.*, (SELECT COUNT(*) FROM checklist_comments c WHERE c.item_id = i.id) AS comments
       FROM checklist_items i WHERE ${archived ? 'i.archived_at IS NOT NULL' : 'i.archived_at IS NULL'}
      ORDER BY i.section, i.position, i.created_at`,
  ).all()).results;
  const parts = (await env.DB.prepare('SELECT * FROM checklist_parts WHERE archived_at IS NULL ORDER BY item_id, position, created_at').all()).results;
  const by = {};
  for (const p of parts) (by[p.item_id] ||= []).push(p);
  return items.map((i) => ({ ...i, parts: by[i.id] || [] }));
}

/** An item waits on me when I own it or its waiting names me, or I own an open part of it. */
export function waitingOn(item, names) {
  if (item.status === 'done' || item.archived_at) return false;
  return names.includes(item.owner) || names.includes(item.waiting_owner)
    || item.parts.some((p) => !p.done_at && names.includes(p.owner));
}

export async function checklist(req, env, ctx, id, who) {
  const me = await actor(env, who, new URL(req.url).searchParams.get('as'));
  const archived = new URL(req.url).searchParams.get('archived') === '1';
  return json({ items: await allItems(env, archived), areas: await allAreas(env), me: { names: me.names, name: me.name, can_archive: me.canArchive }, owners: OWNERS });
}

/** Counts by section and status for the overview, and how many wait on whoever is signed in. */
export async function checklistSummary(req, env, ctx, id, who) {
  const me = await actor(env, who, new URL(req.url).searchParams.get('as'));
  const items = await allItems(env, false);
  const counts = Object.fromEntries(SECTIONS.map((s) => [s, Object.fromEntries(STATUSES.map((t) => [t, 0]))]));
  for (const i of items) counts[i.section][i.status] += 1;
  const partly = items.filter((i) => i.status !== 'done' && i.parts.some((p) => p.done_at)).length;
  // The shared address is two people, so it counts for whichever of them is acting.
  return json({ counts, partly, mine: items.filter((i) => waitingOn(i, [me.name])).length, me: { names: me.names, name: me.name } });
}

export async function checklistItem(req, env, ctx, id) {
  const it = await loadItem(env, id);
  const parts = (await env.DB.prepare('SELECT * FROM checklist_parts WHERE item_id = ? ORDER BY archived_at IS NOT NULL, position, created_at').bind(id).all()).results;
  const comments = (await env.DB.prepare('SELECT id, author, author_email, body, created_at FROM checklist_comments WHERE item_id = ? ORDER BY created_at, id').bind(id).all()).results;
  const history = (await env.DB.prepare(
    "SELECT at, actor, action, before_json, after_json FROM audit_log WHERE entity = 'checklist_item' AND entity_id = ? ORDER BY id DESC LIMIT 100",
  ).bind(id).all()).results.map((h) => ({ at: h.at, actor: h.actor, action: h.action.replace(/^checklist\./, ''),
    before: h.before_json ? JSON.parse(h.before_json) : null, after: h.after_json ? JSON.parse(h.after_json) : null }));
  return json({ item: it, parts, comments, history });
}

/** The fields an add or an edit may set, checked the same way for both. areas is the list of area ids. */
function itemFields(body, current, areas) {
  const f = {};
  if ('title' in body || !current) { f.title = clean(body.title, 200); if (!f.title) throw bad('Give the item a title.'); }
  if ('description' in body) f.description = clean(body.description, 4000);
  if ('section' in body || !current) f.section = pick(body.section, SECTIONS, 'a section');
  if ('owner' in body || !current) f.owner = pick(body.owner, OWNERS, 'who owns it');
  if ('status' in body) f.status = pick(body.status, STATUSES, 'a status');
  if ('waiting_on' in body) f.waiting_on = clean(body.waiting_on, 300);
  if ('area' in body) f.area = body.area ? pick(body.area, areas, 'an area') : null;
  if ('waiting_owner' in body) f.waiting_owner = body.waiting_owner ? pick(body.waiting_owner, OWNERS, 'who it waits on') : null;
  const status = f.status || current?.status || 'not_started';
  const waiting = 'waiting_on' in f ? f.waiting_on : current?.waiting_on;
  if (status === 'waiting' && !waiting) throw bad('Say who or what it is waiting on.');
  return f;
}

export async function addChecklistItem(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const f = { status: 'not_started', ...itemFields(body, null, (await allAreas(env)).map((a) => a.id)) };
  const t = now();
  const newId = ulid();
  const { n } = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) AS n FROM checklist_items WHERE section = ?').bind(f.section).first();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO checklist_items (id, section, area, position, title, description, owner, status, waiting_on, waiting_owner, done_at, done_by, created_at, created_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(newId, f.section, f.area || null, n + 1, f.title, f.description || null, f.owner, f.status,
      f.status === 'waiting' ? f.waiting_on : null, f.status === 'waiting' ? f.waiting_owner || null : null,
      f.status === 'done' ? t : null, f.status === 'done' ? me.name : null, t, me.name, t),
    audit(env, me, 'add', newId, null, f),
  ]);
  return json({ id: newId }, 201);
}

export async function editChecklistItem(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const it = await loadItem(env, id);
  if (it.archived_at) throw bad('That item is archived. Restore it first.');
  const f = itemFields(body, it, (await allAreas(env)).map((a) => a.id));
  const changed = Object.keys(f).filter((k) => (f[k] ?? null) !== (it[k] ?? null));
  if (!changed.length) return checklistItem(req, env, ctx, id);
  const t = now();
  const next = { ...it, ...f };
  if (next.status !== 'waiting') { next.waiting_on = null; next.waiting_owner = null; }
  const doneNow = next.status === 'done' && it.status !== 'done';
  const stmt = env.DB.prepare(
    `UPDATE checklist_items SET title = ?, description = ?, section = ?, area = ?, position = ?, owner = ?, status = ?, waiting_on = ?, waiting_owner = ?,
       done_at = ?, done_by = ?, updated_at = ?, version = version + 1 WHERE id = ? AND version = ?`,
  ).bind(next.title, next.description, next.section, next.area ?? null,
    next.section !== it.section ? (await env.DB.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS n FROM checklist_items WHERE section = ?').bind(next.section).first()).n : it.position,
    next.owner, next.status, next.waiting_on, next.waiting_owner,
    next.status === 'done' ? (doneNow ? t : it.done_at) : null, next.status === 'done' ? (doneNow ? me.name : it.done_by) : null, t, id, Number(body.version) || 0);
  const before = Object.fromEntries(changed.map((k) => [k, it[k]]));
  const after = Object.fromEntries(changed.map((k) => [k, next[k]]));
  checkVersion((await env.DB.batch([stmt, audit(env, me, 'edit', id, before, after)]))[0], 'checklist item');
  return checklistItem(req, env, ctx, id);
}

/** Tick or untick an item. Unticking puts it back in progress. */
export async function tickChecklistItem(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const it = await loadItem(env, id);
  if (it.archived_at) throw bad('That item is archived. Restore it first.');
  const done = !!body.done;
  if (done === (it.status === 'done')) return checklistItem(req, env, ctx, id);
  const t = now();
  const res = await env.DB.batch([
    env.DB.prepare(`UPDATE checklist_items SET status = ?, done_at = ?, done_by = ?, waiting_on = NULL, waiting_owner = NULL, updated_at = ?, version = version + 1
      WHERE id = ? AND status ${done ? '!=' : '='} 'done'`).bind(done ? 'done' : 'in_progress', done ? t : null, done ? me.name : null, t, id),
    audit(env, me, done ? 'tick' : 'untick', id, { status: it.status }, { status: done ? 'done' : 'in_progress' }),
  ]);
  checkVersion(res[0], 'checklist item');
  return checklistItem(req, env, ctx, id);
}

/** Move an item up or down within its section, by swapping places with its neighbor. */
export async function moveChecklistItem(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const it = await loadItem(env, id);
  const up = body.dir === 'up';
  const other = await env.DB.prepare(
    `SELECT id, position FROM checklist_items WHERE section = ? AND archived_at IS NULL AND id != ? AND position ${up ? '<=' : '>='} ?
      ORDER BY position ${up ? 'DESC' : 'ASC'} LIMIT 1`,
  ).bind(it.section, id, it.position).first();
  if (!other) return json({ ok: true, moved: false });
  // Equal positions (two items added at once) still separate, because the mover takes one step past.
  const mine = other.position === it.position ? it.position + (up ? -1 : 1) : other.position;
  await env.DB.batch([
    env.DB.prepare('UPDATE checklist_items SET position = ?, updated_at = ? WHERE id = ?').bind(mine, now(), id),
    env.DB.prepare('UPDATE checklist_items SET position = ? WHERE id = ?').bind(it.position, other.id),
    audit(env, me, 'move', id, { position: it.position }, { position: mine, dir: up ? 'up' : 'down' }),
  ]);
  return json({ ok: true, moved: true });
}

/** Archive or restore an item. Alex alone, and nothing is deleted. */
export async function archiveChecklistItem(req, env, ctx, id, who, action) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  if (!me.canArchive) throw new HttpError(403, 'Only Alex can archive or restore an item.');
  const it = await loadItem(env, id);
  const archive = action === 'archive';
  if (archive === !!it.archived_at) return checklistItem(req, env, ctx, id);
  const t = now();
  await env.DB.batch([
    env.DB.prepare('UPDATE checklist_items SET archived_at = ?, archived_by = ?, updated_at = ?, version = version + 1 WHERE id = ?')
      .bind(archive ? t : null, archive ? me.name : null, t, id),
    audit(env, me, action, id, null, { reason: clean(body.reason, 500) }),
  ]);
  return checklistItem(req, env, ctx, id);
}

export async function commentChecklistItem(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const text = clean(body.body, 4000);
  if (!text) throw bad('Write the comment first.');
  await loadItem(env, id);
  const cid = ulid();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO checklist_comments (id, item_id, author, author_email, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(cid, id, me.name, me.email, text, now()),
    audit(env, me, 'comment', id, null, { comment: cid }),
  ]);
  return checklistItem(req, env, ctx, id);
}

// ---------------------------------------------------------------- parts

async function loadPart(env, id) {
  const p = await env.DB.prepare('SELECT * FROM checklist_parts WHERE id = ?').bind(id).first();
  if (!p) throw notFound();
  return p;
}
const touch = (env, itemId) => env.DB.prepare('UPDATE checklist_items SET updated_at = ?, version = version + 1 WHERE id = ?').bind(now(), itemId);

export async function addChecklistPart(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  await loadItem(env, id);
  const title = clean(body.title, 200);
  if (!title) throw bad('Say what the part is.');
  const owner = pick(body.owner, OWNERS, 'who does this part');
  const pid = ulid();
  const { n } = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) AS n FROM checklist_parts WHERE item_id = ?').bind(id).first();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(pid, id, n + 1, title, owner, now(), me.name),
    touch(env, id),
    audit(env, me, 'part.add', id, null, { part: pid, title, owner }),
  ]);
  return checklistItem(req, env, ctx, id);
}

export async function editChecklistPart(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const p = await loadPart(env, id);
  const title = 'title' in body ? clean(body.title, 200) : p.title;
  if (!title) throw bad('Say what the part is.');
  const owner = 'owner' in body ? pick(body.owner, OWNERS, 'who does this part') : p.owner;
  if (title === p.title && owner === p.owner) return checklistItem(req, env, ctx, p.item_id);
  await env.DB.batch([
    env.DB.prepare('UPDATE checklist_parts SET title = ?, owner = ? WHERE id = ?').bind(title, owner, id),
    touch(env, p.item_id),
    audit(env, me, 'part.edit', p.item_id, { part: id, title: p.title, owner: p.owner }, { part: id, title, owner }),
  ]);
  return checklistItem(req, env, ctx, p.item_id);
}

export async function tickChecklistPart(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const p = await loadPart(env, id);
  const done = !!body.done;
  if (done === !!p.done_at) return checklistItem(req, env, ctx, p.item_id);
  const t = now();
  const stmts = [
    env.DB.prepare(`UPDATE checklist_parts SET done_at = ?, done_by = ? WHERE id = ? AND done_at IS ${done ? 'NULL' : 'NOT NULL'}`).bind(done ? t : null, done ? me.name : null, id),
    touch(env, p.item_id),
    audit(env, me, done ? 'part.tick' : 'part.untick', p.item_id, null, { part: id, title: p.title }),
  ];
  // A first part ticked on an item nobody has started shows it as under way.
  if (done) stmts.push(env.DB.prepare("UPDATE checklist_items SET status = 'in_progress' WHERE id = ? AND status = 'not_started'").bind(p.item_id));
  checkVersion((await env.DB.batch(stmts))[0], 'part');
  return checklistItem(req, env, ctx, p.item_id);
}

export async function moveChecklistPart(req, env, ctx, id, who) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  const p = await loadPart(env, id);
  const up = body.dir === 'up';
  const other = await env.DB.prepare(
    `SELECT id, position FROM checklist_parts WHERE item_id = ? AND archived_at IS NULL AND id != ? AND position ${up ? '<=' : '>='} ?
      ORDER BY position ${up ? 'DESC' : 'ASC'} LIMIT 1`,
  ).bind(p.item_id, id, p.position).first();
  if (other) {
    const mine = other.position === p.position ? p.position + (up ? -1 : 1) : other.position;
    await env.DB.batch([
      env.DB.prepare('UPDATE checklist_parts SET position = ? WHERE id = ?').bind(mine, id),
      env.DB.prepare('UPDATE checklist_parts SET position = ? WHERE id = ?').bind(p.position, other.id),
      touch(env, p.item_id),
      audit(env, me, 'part.move', p.item_id, null, { part: id, dir: up ? 'up' : 'down' }),
    ]);
  }
  return checklistItem(req, env, ctx, p.item_id);
}

export async function archiveChecklistPart(req, env, ctx, id, who, action) {
  requireSameOrigin(req);
  const body = await readJson(req);
  const me = await actor(env, who, body.as);
  if (!me.canArchive) throw new HttpError(403, 'Only Alex can archive or restore a part.');
  const p = await loadPart(env, id);
  const archive = action === 'archive';
  if (archive !== !!p.archived_at) {
    await env.DB.batch([
      env.DB.prepare('UPDATE checklist_parts SET archived_at = ?, archived_by = ? WHERE id = ?').bind(archive ? now() : null, archive ? me.name : null, id),
      touch(env, p.item_id),
      audit(env, me, `part.${action}`, p.item_id, null, { part: id, title: p.title }),
    ]);
  }
  return checklistItem(req, env, ctx, p.item_id);
}
