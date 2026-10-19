// The launch checklist in the admin (workplan A17).
//
//   node app/dev/checklist-test.mjs
//
// Needs no server. It builds a database from schema.sql in memory with Node's own SQLite, applies
// migrations/0034 twice, and calls the admin Worker in this process with a stand-in D1, signed in
// as each operator in turn through DEV_IDENTITY on localhost. Part 1 checks the seed against the
// workplan and the rules for its wording. Part 2 walks every route: ticking as Alex, as Amber and
// as Luke on the shared address, parts, comments, waiting, moving, a stale edit, archiving that
// only Alex may do, the summary and its waiting-on-me count, and the history in audit_log.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SEED } from '../ops/checklist-seed.mjs';
import { workplanItems, drift } from '../ops/checklist.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0034_launch_checklist.sql'), 'utf8');

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}

// A D1 stand-in over node:sqlite: prepare, bind, first, all, run and batch, with meta.changes.
function d1(db) {
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
  });
  return {
    prepare: (sql) => stmt(sql),
    batch: async (list) => {
      db.exec('BEGIN');
      try {
        const out = list.map((s) => (/^\s*SELECT/i.test(s.sql) ? { results: db.prepare(s.sql).all(...s.args), meta: { changes: 0 } }
          : { meta: { changes: Number(db.prepare(s.sql).run(...s.args).changes) } }));
        db.exec('COMMIT');
        return out;
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON');
db.exec(fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8'));
db.exec(MIGRATION);
const firstCount = db.prepare('SELECT COUNT(*) AS n FROM checklist_items').get().n;
db.exec(MIGRATION);
const now = () => new Date().toISOString();
for (const [email, name, role] of [['alex24harper@gmail.com', 'Alex', 'owner'], ['luke.blakeslee@gmail.com', 'Amber and Luke Blakeslee', 'owner'], ['helper@puppyconnection.test', 'Helper', 'staff']]) {
  db.prepare('INSERT OR IGNORE INTO people (email, name, role, added_at) VALUES (?, ?, ?, ?)').run(email, name, role, now());
}

// ---------------------------------------------------------------- part 1, the seed
function seedChecks() {
  const items = db.prepare('SELECT * FROM checklist_items').all();
  const parts = db.prepare('SELECT * FROM checklist_parts').all();
  check(`the migration seeds ${SEED.length} items and a second run adds nothing`, firstCount === SEED.length && items.length === SEED.length, `${firstCount}, then ${items.length}`);
  check('the seed is recorded once in the audit trail', db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'checklist.seed'").get().n === 1);
  const sections = new Set(items.map((i) => i.section));
  check('items sit in the four sections Launch, Gate 1, Gate 2 and Gate 3', ['launch', 'gate1', 'gate2', 'gate3'].every((s) => sections.has(s)) && sections.size === 4);
  const wp = workplanItems(fs.readFileSync(path.join(APP, 'docs/launch-workplan.md'), 'utf8'));
  const problems = drift(wp, items);
  check(`every open and closed workplan item is on the checklist with a matching status (${wp.length} items read)`, wp.length > 40 && !problems.length, problems.join('; '));
  const closed = wp.filter((w) => w.closed).map((w) => items.find((i) => i.ref === w.id));
  check('every closed workplan item is done with its evidence date and marked as from the launch plan',
    closed.every((i) => i && i.status === 'done' && /^2026-10-1\d/.test(i.done_at) && i.done_by === 'launch plan'));
  const text = [...items.flatMap((i) => [i.title, i.description, i.waiting_on]), ...parts.map((p) => p.title)].filter(Boolean);
  check('no price, hour figure or rate in any seeded text or in the migration',
    !/\$\s?\d|\bper hour\b|\b\d+(\.\d+)?\s?(hours?|hrs?)\b|\brate\b/i.test(text.join(' ') + MIGRATION.replace(/--[^\n]*/g, '')),
    text.find((t) => /\$\s?\d|\b\d+\s?(hours?|hrs?)\b|\brate\b/i.test(t)));
  check('no internal id in a title, description, waiting line or part', !text.some((t) => /\b(?:[A-G]\d{1,2}|L\d{1,2}|P\d\.\d|g\d-[a-z]+|pc-[a-z-]+)\b/.test(t)),
    text.find((t) => /\b(?:[A-G]\d{1,2}|L\d{1,2}|P\d\.\d)\b/.test(t)));
  check('no em dash in the seeded wording', !text.some((t) => t.includes('—')));
  const titles = (s) => items.filter((i) => i.section === s).map((i) => i.title.toLowerCase());
  check('family accounts with a subscription are in Gate 1', titles('gate1').some((t) => t.includes('family accounts') && t.includes('subscription')));
  check('PayPal and search by distance are not in Gate 1', !titles('gate1').some((t) => /paypal|distance/.test(t)));
  check('public reviews are gone from Gate 3, with Stripe Connect and messaging there as later items',
    !items.some((i) => /review/i.test(i.title) && i.section === 'gate3') && titles('gate3').some((t) => t.includes('stripe connect')) && titles('gate3').some((t) => t.includes('messages')));
  const partlyGate = items.filter((i) => i.section !== 'launch' && i.status !== 'done' && parts.some((p) => p.item_id === i.id && p.done_at));
  check(`gate items with parts done before launch show as partly done (${partlyGate.length})`, partlyGate.length >= 2);
  check('every waiting item says what it waits on', items.filter((i) => i.status === 'waiting').every((i) => i.waiting_on));
  check('owners are only Alex, Amber, Luke and Claude, and Amber and Luke both own something',
    [...items, ...parts].every((x) => ['Alex', 'Amber', 'Luke', 'Claude'].includes(x.owner)) && [...items, ...parts].some((x) => x.owner === 'Amber') && parts.some((p) => p.owner === 'Luke'));
}

// ---------------------------------------------------------------- part 2, the routes
const { default: worker } = await import(new URL('../admin/worker.js', import.meta.url));
const ORIGIN = 'http://localhost:8788';
const ctx = { waitUntil() {}, passThroughOnException() {} };
const DB = d1(db);
async function call(email, method, p, body) {
  const env = { DEV_MODE: 'local', DEV_IDENTITY: email, DB };
  const init = { method, headers: { origin: ORIGIN, accept: 'application/json' } };
  if (body !== undefined) { init.body = JSON.stringify(body); init.headers['content-type'] = 'application/json'; }
  const res = await worker.fetch(new Request(ORIGIN + p, init), env, ctx);
  const t = await res.text();
  let data = null; try { data = JSON.parse(t); } catch { data = t; }
  return { status: res.status, data };
}
const ALEX = 'alex24harper@gmail.com', SHARED = 'luke.blakeslee@gmail.com', STAFF = 'helper@puppyconnection.test';
const row = (id) => db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id);
const lastAudit = (id) => db.prepare("SELECT * FROM audit_log WHERE entity = 'checklist_item' AND entity_id = ? ORDER BY id DESC LIMIT 1").get(id);

async function routeChecks() {
  let r = await call(ALEX, 'GET', '/api/checklist');
  check('Alex reads the checklist, acting as Alex with archiving allowed', r.status === 200 && r.data.me.name === 'Alex' && r.data.me.can_archive && r.data.items.length === SEED.length);
  r = await call(SHARED, 'GET', '/api/checklist');
  check('the shared address acts as Amber or Luke, Amber first, and may not archive', r.status === 200 && r.data.me.names.join() === 'Amber,Luke' && r.data.me.name === 'Amber' && !r.data.me.can_archive);
  r = await call(STAFF, 'GET', '/api/checklist');
  check('a staff sign-in is refused, as the checklist is for owners', r.status === 403);
  check('an outside request without the same origin is refused', (await worker.fetch(new Request(`${ORIGIN}/api/checklist/items`, { method: 'POST', headers: { origin: 'https://evil.test', 'content-type': 'application/json' }, body: '{}' }),
    { DEV_MODE: 'local', DEV_IDENTITY: ALEX, DB }, ctx)).status === 403);

  // Add, as Amber.
  r = await call(SHARED, 'POST', '/api/checklist/items', { title: 'Test the welcome email', description: 'Send one to each of us.', section: 'launch', owner: 'Amber', as: 'Amber' });
  const id = r.data.id;
  check('Amber adds an item, recorded as created by Amber with an audit row', r.status === 201 && row(id).created_by === 'Amber' && JSON.parse(lastAudit(id).after_json).as === 'Amber');
  r = await call(SHARED, 'POST', '/api/checklist/items', { title: 'Waits on nothing named', section: 'gate1', owner: 'Luke', status: 'waiting' });
  check('an item set to waiting without saying on what is refused', r.status === 400 && /waiting on/i.test(r.data.error));

  // Edit, with the version, then a stale one.
  const v = row(id).version;
  r = await call(ALEX, 'PUT', `/api/checklist/items/${id}`, { version: v, status: 'waiting', waiting_on: 'Real email being on', waiting_owner: 'Alex', owner: 'Claude' });
  check('Alex edits it to waiting on real email, owned by Claude, and the edit lists before and after',
    r.status === 200 && row(id).status === 'waiting' && row(id).owner === 'Claude' && JSON.parse(lastAudit(id).before_json).owner === 'Amber' && JSON.parse(lastAudit(id).after_json).owner === 'Claude');
  r = await call(SHARED, 'PUT', `/api/checklist/items/${id}`, { version: v, title: 'Overwritten' });
  check('an edit from an older copy of the item is refused rather than overwriting', r.status === 409 && row(id).title === 'Test the welcome email');

  // Waiting on me.
  r = await call(ALEX, 'GET', '/api/checklist/summary');
  const s1 = r.data;
  const total = Object.values(s1.counts).reduce((n, sec) => n + Object.values(sec).reduce((a, b) => a + b, 0), 0);
  check('the summary counts every item once by section and status', r.status === 200 && total === SEED.length + 1 && s1.counts.launch.waiting >= 1);
  const mineAlex = s1.mine;
  r = await call(SHARED, 'GET', '/api/checklist/summary?as=Luke');
  check(`waiting on me differs by person (Alex ${mineAlex}, Luke ${r.data.mine})`, mineAlex > 0 && r.data.mine >= 1 && r.data.mine < mineAlex && r.data.me.name === 'Luke');

  // Parts.
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/parts`, { title: 'Write the email', owner: 'Amber', as: 'Amber' });
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/parts`, { title: 'Check it on a phone', owner: 'Luke', as: 'Luke' });
  const parts = r.data.parts;
  check('parts are added with their own owners, in order', r.status === 200 && parts.length === 2 && parts[0].owner === 'Amber' && parts[1].owner === 'Luke');
  r = await call(SHARED, 'POST', `/api/checklist/parts/${parts[1].id}/tick`, { done: true, as: 'Luke' });
  const ticked = r.data.parts.find((p) => p.id === parts[1].id);
  check('Luke ticks his part, and the part records Luke and when', ticked.done_by === 'Luke' && ticked.done_at && JSON.parse(lastAudit(id).after_json).as === 'Luke');
  r = await call(SHARED, 'POST', `/api/checklist/parts/${parts[0].id}/tick`, { done: true, as: 'Alex' });
  check('the shared address cannot tick as Alex, and the tick falls to Amber', r.data.parts.find((p) => p.id === parts[0].id).done_by === 'Amber');
  r = await call(SHARED, 'POST', `/api/checklist/parts/${parts[0].id}/tick`, { done: false });
  r = await call(ALEX, 'GET', '/api/checklist/summary');
  check('an item with some parts ticked counts as partly done', r.data.partly > s1.partly);
  r = await call(ALEX, 'PUT', `/api/checklist/parts/${parts[0].id}`, { owner: 'Alex' });
  check('a part is reassigned', r.data.parts.find((p) => p.id === parts[0].id).owner === 'Alex');
  r = await call(ALEX, 'POST', `/api/checklist/parts/${parts[1].id}/move`, { dir: 'up' });
  check('a part moves up', r.data.parts.filter((p) => !p.archived_at)[0].id === parts[1].id);
  r = await call(SHARED, 'POST', `/api/checklist/parts/${parts[0].id}/archive`, {});
  check('Amber cannot archive a part', r.status === 403);
  r = await call(ALEX, 'POST', `/api/checklist/parts/${parts[0].id}/archive`, {});
  check('Alex archives a part, and it is kept', r.status === 200 && db.prepare('SELECT archived_by FROM checklist_parts WHERE id = ?').get(parts[0].id).archived_by === 'Alex');

  // Comments.
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/comments`, { body: 'Sent the draft to Alex.', as: 'Amber' });
  check('Amber comments, and the comment carries her name, address and time',
    r.status === 200 && r.data.comments.length === 1 && r.data.comments[0].author === 'Amber' && r.data.comments[0].author_email === SHARED && r.data.comments[0].created_at);
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/comments`, { body: '   ' });
  check('an empty comment is refused', r.status === 400);

  // Tick the item.
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/tick`, { done: true, as: 'Amber' });
  check('Amber ticks the item done, recording her and when, and the waiting line clears',
    row(id).status === 'done' && row(id).done_by === 'Amber' && row(id).done_at && !row(id).waiting_on && lastAudit(id).action === 'checklist.tick');
  r = await call(ALEX, 'POST', `/api/checklist/items/${id}/tick`, { done: false });
  check('unticking puts it back in progress', row(id).status === 'in_progress' && !row(id).done_at);

  // Move.
  const launch = () => db.prepare("SELECT id FROM checklist_items WHERE section = 'launch' AND archived_at IS NULL ORDER BY position, created_at").all().map((x) => x.id);
  const before = launch();
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/move`, { dir: 'up' });
  const after = launch();
  check('an item moves up one place in its section', after.indexOf(id) === before.indexOf(id) - 1 && after.length === before.length);
  r = await call(SHARED, 'POST', `/api/checklist/items/${before[0]}/move`, { dir: 'up' });
  check('the first item does not move further up', r.data.moved === false);
  r = await call(ALEX, 'PUT', `/api/checklist/items/${id}`, { version: row(id).version, section: 'gate2' });
  check('moving an item to another section puts it at the end there', row(id).section === 'gate2' &&
    row(id).position === db.prepare("SELECT MAX(position) AS n FROM checklist_items WHERE section = 'gate2'").get().n);

  // Archive.
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/archive`, {});
  check('Amber cannot archive an item', r.status === 403 && !row(id).archived_at);
  r = await call(ALEX, 'POST', `/api/checklist/items/${id}/archive`, { reason: 'Test item' });
  const list = (await call(ALEX, 'GET', '/api/checklist')).data.items;
  const arch = (await call(ALEX, 'GET', '/api/checklist?archived=1')).data.items;
  check('Alex archives it, it leaves the list and shows under Archived, and the row and its parts are kept',
    row(id).archived_by === 'Alex' && !list.some((i) => i.id === id) && arch.some((i) => i.id === id) && db.prepare('SELECT COUNT(*) AS n FROM checklist_parts WHERE item_id = ?').get(id).n === 2);
  r = await call(ALEX, 'PUT', `/api/checklist/items/${id}`, { version: row(id).version, title: 'x' });
  check('an archived item cannot be edited until it is restored', r.status === 400);
  r = await call(ALEX, 'POST', `/api/checklist/items/${id}/restore`, {});
  check('Alex restores it', !row(id).archived_at);
  check('there is no route that deletes a checklist row', !/DELETE FROM checklist/i.test(fs.readFileSync(path.join(APP, 'lib/checklist.js'), 'utf8')) &&
    !/\['DELETE', \/\^\\\/api\\\/checklist/.test(fs.readFileSync(path.join(APP, 'admin/worker.js'), 'utf8')));

  // History.
  r = await call(ALEX, 'GET', `/api/checklist/items/${id}`);
  const acts = r.data.history.map((h) => h.action);
  check(`the item's history reads back from the audit trail with who acted (${acts.length} entries)`,
    ['add', 'edit', 'part.add', 'part.tick', 'comment', 'tick', 'untick', 'move', 'archive', 'restore'].every((a) => acts.includes(a)) && r.data.history.every((h) => h.after && h.after.as));
  r = await call(ALEX, 'GET', '/api/audit');
  check('checklist writes also show on the Activity screen', r.status === 200 && r.data.some((a) => a.action === 'checklist.tick'));

  // A seeded shared item keeps who does which part.
  const shared = db.prepare("SELECT id FROM checklist_items WHERE title = 'Seller statement on every puppy page'").get().id;
  r = await call(SHARED, 'GET', `/api/checklist/items/${shared}`);
  check('a seeded shared item shows Amber\'s part and Claude\'s part', r.data.parts.map((p) => p.owner).join() === 'Amber,Claude');
}

seedChecks();
await routeChecks();
console.log(`\n${passes} passed, ${fails} failed`);
process.exitCode = fails ? 1 : 0;
