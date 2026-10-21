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
// Part 3 checks the areas (migration 0044): the migration on a database from before them, the
// area routes, the drift check, and the By area grouping, its summary line and the asks for Amber,
// run from admin/public/checklist-areas.js in a Node sandbox.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import vm from 'node:vm';
import { SEED } from '../ops/checklist-seed.mjs';
import { workplanItems, drift, MERGED } from '../ops/checklist.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0034_launch_checklist.sql'), 'utf8');
const OWNERS_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0035_checklist_owners.sql'), 'utf8');
const DAY_ONE_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0036_checklist_day_one.sql'), 'utf8');
const GA4_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0037_checklist_ga4.sql'), 'utf8');
const DB_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0038_checklist_production_database.sql'), 'utf8');
const CALLS_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0039_checklist_alex_calls.sql'), 'utf8');
const BUILD_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0041_checklist_build_session.sql'), 'utf8');
const AREAS_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0044_checklist_areas.sql'), 'utf8');
const WAIT_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0045_checklist_search_console_wait.sql'), 'utf8');
const AMBER_NOTES_MIGRATION = fs.readFileSync(path.join(APP, 'migrations/0048_checklist_amber_plan_notes.sql'), 'utf8');
// schema.sql already has the area column, so the ALTER runs only on the database from before it (part 3).
const AREAS_NO_ALTER = AREAS_MIGRATION.replace(/^ALTER TABLE checklist_items ADD COLUMN area[^\n]*\n/m, '');
const DAY_ONE = 6;
// The day-one items from migration 0036, the Puppy video item from 0039, and Search Console access from 0044.
const ADDED = DAY_ONE + 4; // + search by distance and PayPal back as later Gate 1 items (0048)

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
const before0035 = db.prepare("SELECT (SELECT COUNT(*) FROM checklist_items WHERE owner IN ('Claude','Luke') OR waiting_owner IN ('Claude','Luke')) + (SELECT COUNT(*) FROM checklist_parts WHERE owner IN ('Claude','Luke')) AS n").get().n;
db.exec(OWNERS_MIGRATION);
db.exec(OWNERS_MIGRATION);
db.exec(DAY_ONE_MIGRATION);
db.exec(DAY_ONE_MIGRATION);
db.exec(GA4_MIGRATION);
db.exec(GA4_MIGRATION);
db.exec(DB_MIGRATION);
db.exec(DB_MIGRATION);
db.exec(CALLS_MIGRATION);
db.exec(CALLS_MIGRATION);
db.exec(BUILD_MIGRATION);
db.exec(BUILD_MIGRATION);
db.exec(AREAS_NO_ALTER);
db.exec(AREAS_NO_ALTER);
db.exec(WAIT_MIGRATION);
db.exec(WAIT_MIGRATION);
db.exec(AMBER_NOTES_MIGRATION);
db.exec(AMBER_NOTES_MIGRATION);
db.exec(MIGRATION);
const now = () => new Date().toISOString();
for (const [email, name, role] of [['alex24harper@gmail.com', 'Alex', 'owner'], ['luke.blakeslee@gmail.com', 'Amber and Luke Blakeslee', 'owner'], ['helper@puppyconnection.test', 'Helper', 'staff']]) {
  db.prepare('INSERT OR IGNORE INTO people (email, name, role, added_at) VALUES (?, ?, ?, ?)').run(email, name, role, now());
}

// ---------------------------------------------------------------- part 1, the seed
function seedChecks() {
  const items = db.prepare('SELECT * FROM checklist_items').all();
  const parts = db.prepare('SELECT * FROM checklist_parts').all();
  check(`the migration seeds ${SEED.length} items and a second run adds nothing`, firstCount === SEED.length && items.length === SEED.length + ADDED, `${firstCount}, then ${items.length}`);
  check('the seed is recorded once in the audit trail', db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'checklist.seed'").get().n === 1);
  const sections = new Set(items.map((i) => i.section));
  check('items sit in the four sections Launch, Gate 1, Gate 2 and Gate 3', ['launch', 'gate1', 'gate2', 'gate3'].every((s) => sections.has(s)) && sections.size === 4);
  const wp = workplanItems(fs.readFileSync(path.join(APP, 'docs/launch-workplan.md'), 'utf8'));
  const problems = drift(wp, items);
  check(`every open and closed workplan item is on the checklist with a matching status (${wp.length} items read)`, wp.length > 40 && !problems.length, problems.join('; '));
  const closed = wp.filter((w) => w.closed && !MERGED[w.id]).map((w) => items.find((i) => i.ref === w.id));
  check('every closed workplan item is done with its evidence date and marked as from the launch plan',
    closed.every((i) => i && i.status === 'done' && /^2026-10-(1\d|2\d)/.test(i.done_at) && ['launch plan', 'Alex', 'Claude'].includes(i.done_by)));
  const text = [...items.flatMap((i) => [i.title, i.description, i.waiting_on]), ...parts.map((p) => p.title)].filter(Boolean);
  check('no price, hour figure or rate in any seeded text or in the migration',
    !/\$\s?\d|\bper hour\b|\b\d+(\.\d+)?\s?(hours?|hrs?)\b|\brate\b/i.test(text.join(' ') + MIGRATION.replace(/--[^\n]*/g, '') + AREAS_MIGRATION.replace(/--[^\n]*/g, '')),
    text.find((t) => /\$\s?\d|\b\d+\s?(hours?|hrs?)\b|\brate\b/i.test(t)));
  check('no internal id in a title, description, waiting line or part', !text.some((t) => /\b(?:[A-G]\d{1,2}|L\d{1,2}|P\d\.\d|g\d-[a-z]+|pc-[a-z-]+)\b/.test(t)),
    text.find((t) => /\b(?:[A-G]\d{1,2}|L\d{1,2}|P\d\.\d)\b/.test(t)));
  check('no em dash in the seeded wording', !text.some((t) => t.includes('—')));
  const titles = (s) => items.filter((i) => i.section === s).map((i) => i.title.toLowerCase());
  check('family accounts with a subscription are in Gate 1', titles('gate1').some((t) => t.includes('family accounts') && t.includes('subscription')));
  check('PayPal and search by distance are back in Gate 1 as later items (Amber, 2026-10-21)', ['later: paypal for the listing fee', 'later: search by distance'].every((t) => titles('gate1').includes(t)));
  check('public reviews are gone from Gate 3, with Stripe Connect and messaging there as later items',
    !items.some((i) => /review/i.test(i.title) && i.section === 'gate3') && titles('gate3').some((t) => t.includes('stripe connect')) && titles('gate3').some((t) => t.includes('messages')));
  const partlyGate = items.filter((i) => i.section !== 'launch' && i.status !== 'done' && parts.some((p) => p.item_id === i.id && p.done_at));
  check(`gate items with parts done before launch show as partly done (${partlyGate.length})`, partlyGate.length >= 2);
  check('every waiting item says what it waits on', items.filter((i) => i.status === 'waiting').every((i) => i.waiting_on));
  check(`after migration 0035 every owner and waiting person is Alex or Amber (${before0035} rows named Claude or Luke before)`,
    before0035 > 0 && [...items, ...parts].every((x) => ['Alex', 'Amber'].includes(x.owner)) && items.every((i) => !i.waiting_owner || ['Alex', 'Amber'].includes(i.waiting_owner)));
  check("Luke's training part moved to Amber with his name kept in the title", parts.some((p) => p.title === 'Luke attends the training' && p.owner === 'Amber'));
  const dayOne = items.filter((i) => /^B(7|8|9|10|11|12)$/.test(i.ref || ''));
  check('migration 0036 adds the six day-one items to Launch, owned by Alex or Amber, each audited once, and a second run adds nothing',
    dayOne.length === DAY_ONE && dayOne.every((i) => i.section === 'launch' && ['Alex', 'Amber'].includes(i.owner)) &&
    db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'checklist.add' AND entity_id IN ('cl-074','cl-075','cl-076','cl-077','cl-078','cl-079')").get().n === DAY_ONE);
  const ga4 = items.find((i) => i.ref === 'B11');
  const ga4Parts = parts.filter((p) => p.item_id === ga4.id);
  check('migration 0037 makes the analytics item Google Analytics 4, waiting on Amber, with her one part and four for Alex, once',
    ga4.title === 'Google Analytics 4 on the new site' && ga4.status === 'waiting' &&
    ga4Parts.map((p) => p.owner).join() === 'Amber,Alex,Alex,Alex,Alex' &&
    db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = ? AND action = 'checklist.edit' AND after_json LIKE '%chose Google Analytics 4%'").get(ga4.id).n === 1);
  const prod = items.find((i) => i.ref === 'B12');
  const prodParts = parts.filter((p) => p.item_id === prod.id);
  check('migration 0038 ticks the production database decision as Alex, leaves writing the steps open, puts the item in progress and notes it follows clearing test data, once',
    prodParts[0].done_by === 'Alex' && /^2026-10-19/.test(prodParts[0].done_at) &&
    db.prepare("SELECT COUNT(*) AS n FROM checklist_comments WHERE item_id = ? AND body LIKE '%Clear the test breeders and test data%'").get(prod.id).n === 1 &&
    db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = ? AND actor = 'claude'").get(prod.id).n >= 4);
  const byRef = (r) => items.find((i) => i.ref === r);
  const video = items.find((i) => i.title === 'Puppy video');
  check('migration 0039 closes Furry Freight and the puppy details as Alex, and moves the Stream part to a new Gate 1 Puppy video item',
    byRef('D6').status === 'done' && byRef('D6').done_by === 'Alex' && byRef('A3').status === 'done' && video && video.section === 'gate1' && video.owner === 'Alex' &&
    parts.some((p) => p.item_id === video.id && /Stream/.test(p.title)) && !parts.some((p) => p.item_id === byRef('A3').id && /Stream/.test(p.title)));
  check('migration 0039 makes the invitation item a build item for Alex, points analytics at Alex and archives the access part for Amber, and names the three notices',
    byRef('C5').title === 'Let a mailing list send go to all contacts' && byRef('C5').owner === 'Alex' &&
    byRef('B11').waiting_owner === 'Alex' && parts.some((p) => p.item_id === byRef('B11').id && p.owner === 'Amber' && p.archived_at) &&
    /^Three notices/.test(byRef('B9').description));
  check('migration 0041 closes failure alerts, the database plan and the send to all contacts as Claude with evidence, ticks the built parts, and keeps Let\'s Chat waiting on Amber',
    ['B10', 'B12', 'C5'].every((r) => byRef(r).status === 'done' && byRef(r).done_by === 'Claude') &&
    parts.filter((p) => p.item_id === byRef('B12').id).every((p) => p.done_at) && parts.some((p) => p.item_id === byRef('A15').id && p.owner === 'Alex' && p.done_at) &&
    byRef('A15').status === 'waiting' && byRef('A15').waiting_owner === 'Amber' &&
    db.prepare("SELECT COUNT(*) AS n FROM checklist_comments WHERE id IN ('cl-077-c1','cl-079-c2','cl-016-c1','cl-028-c1')").get().n === 4);
  check('the nightly backup carries every checklist table', ['checklist_signers', 'checklist_areas', 'checklist_items', 'checklist_parts', 'checklist_comments']
    .every((t) => new RegExp(`'${t}'`).test(fs.readFileSync(path.join(APP, 'lib/jobs.js'), 'utf8').match(/BACKUP_TABLES = \[([\s\S]*?)\];/)[1])));
  check('migration 0035 audits each moved item once, and running it again adds nothing',
    db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'checklist.edit' AND actor = 'claude' AND after_json LIKE '%Alex and Amber only%'").get().n === db.prepare("SELECT COUNT(DISTINCT entity_id) AS n FROM audit_log WHERE action = 'checklist.edit' AND actor = 'claude' AND after_json LIKE '%Alex and Amber only%'").get().n);
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
  check('Alex reads the checklist, acting as Alex with archiving allowed', r.status === 200 && r.data.me.name === 'Alex' && r.data.me.can_archive && r.data.items.length === SEED.length + ADDED);
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
  r = await call(SHARED, 'POST', '/api/checklist/items', { title: 'Waits on nothing named', section: 'gate1', owner: 'Amber', status: 'waiting' });
  check('an item set to waiting without saying on what is refused', r.status === 400 && /waiting on/i.test(r.data.error));

  // Edit, with the version, then a stale one.
  const v = row(id).version;
  r = await call(ALEX, 'PUT', `/api/checklist/items/${id}`, { version: v, status: 'waiting', waiting_on: 'Real email being on', waiting_owner: 'Alex', owner: 'Alex' });
  check('Alex edits it to waiting on real email, owned by Alex, and the edit lists before and after',
    r.status === 200 && row(id).status === 'waiting' && row(id).owner === 'Alex' && JSON.parse(lastAudit(id).before_json).owner === 'Amber' && JSON.parse(lastAudit(id).after_json).owner === 'Alex');
  r = await call(SHARED, 'PUT', `/api/checklist/items/${id}`, { version: v, title: 'Overwritten' });
  check('an edit from an older copy of the item is refused rather than overwriting', r.status === 409 && row(id).title === 'Test the welcome email');

  // Waiting on me.
  r = await call(ALEX, 'GET', '/api/checklist/summary');
  const s1 = r.data;
  const total = Object.values(s1.counts).reduce((n, sec) => n + Object.values(sec).reduce((a, b) => a + b, 0), 0);
  check('the summary counts every item once by section and status', r.status === 200 && total === SEED.length + ADDED + 1 && s1.counts.launch.waiting >= 1);
  const mineAlex = s1.mine;
  r = await call(SHARED, 'GET', '/api/checklist/summary?as=Amber');
  const mineAmber = r.data.mine;
  const luke = (await call(SHARED, 'GET', '/api/checklist/summary?as=Luke')).data;
  check(`waiting on me differs by person (Alex ${mineAlex}, Amber ${mineAmber}, Luke ${luke.mine}, as he owns nothing now)`,
    mineAlex > 0 && mineAmber > 0 && mineAmber !== mineAlex && luke.mine === 0 && luke.me.name === 'Luke');

  // Parts.
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/parts`, { title: 'Write the email', owner: 'Amber', as: 'Amber' });
  r = await call(SHARED, 'POST', `/api/checklist/items/${id}/parts`, { title: 'Check it on a phone', owner: 'Amber', as: 'Luke' });
  const refused = await call(ALEX, 'POST', `/api/checklist/items/${id}/parts`, { title: 'Claude part', owner: 'Claude' });
  check('Claude or Luke can no longer be given a part or an item', refused.status === 400 && (await call(ALEX, 'POST', '/api/checklist/items', { title: 'x', section: 'launch', owner: 'Luke' })).status === 400);
  const parts = r.data.parts;
  check('parts are added with their own owners, in order', r.status === 200 && parts.length === 2 && parts[0].owner === 'Amber' && parts[1].owner === 'Amber' && parts[1].created_by === 'Luke');
  r = await call(SHARED, 'POST', `/api/checklist/parts/${parts[1].id}/tick`, { done: true, as: 'Luke' });
  const ticked = r.data.parts.find((p) => p.id === parts[1].id);
  check('Luke ticks a part on the shared address, and the part records Luke and when', ticked.done_by === 'Luke' && ticked.done_at && JSON.parse(lastAudit(id).after_json).as === 'Luke');
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
  check('a seeded shared item shows Amber\'s part and Alex\'s part', r.data.parts.map((p) => p.owner).join() === 'Amber,Alex');
}

// ---------------------------------------------------------------- part 3, areas
// The areas Alex named on 2026-10-20, by workplan id. E6 is the Search Console access item 0044 adds.
const BRIEF = {
  'domain-email': ['E1', 'E2', 'B7', 'B8', 'B3', 'B9'],
  payments: ['B2', 'F3'],
  access: ['B4', 'B5', 'E6'],
  content: ['A18', 'A6', 'A15', 'D1', 'A4', 'A5', 'D2', 'D4'],
  listings: ['C1', 'C2', 'F2'],
  search: ['E3', 'E4', 'B11', 'C4', 'E5'],
  readiness: ['F1', 'F4', 'F5', 'F6'],
};
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(APP, 'admin/public/checklist-areas.js'), 'utf8'), sandbox);
const AR = sandbox.pcChecklistAreas;
const withParts = (items) => items.map((i) => ({ ...i, parts: db.prepare('SELECT * FROM checklist_parts WHERE item_id = ? AND archived_at IS NULL ORDER BY position').all(i.id) }));

function areaSeedChecks() {
  const items = db.prepare('SELECT * FROM checklist_items').all();
  const areas = db.prepare('SELECT * FROM checklist_areas ORDER BY position').all();
  const byRef = (r) => items.find((i) => i.ref === r);
  check('migration 0044 adds eight areas, in the order that unblocks the most, with Domain and email first and the launch build last',
    areas.map((a) => a.id).join() === 'domain-email,access,content,payments,listings,search,readiness,build' && areas[0].name === 'Domain and email');
  const wrong = Object.entries(BRIEF).flatMap(([a, refs]) => refs.filter((r) => !byRef(r) || byRef(r).area !== a).map((r) => `${r} is ${byRef(r)?.area}`));
  check('every item Alex named sits in the area he named for it', !wrong.length, wrong.join('; '));
  const openLaunch = items.filter((i) => i.section === 'launch' && i.status !== 'done' && !i.archived_at);
  check(`every open launch item has an area (${openLaunch.length})`, openLaunch.length >= 30 && openLaunch.every((i) => i.area), openLaunch.filter((i) => !i.area).map((i) => i.title).join('; '));
  check('every launch item, open or done, has an area', items.filter((i) => i.section === 'launch').every((i) => i.area));
  const gateAreas = items.filter((i) => i.section !== 'launch' && i.area);
  check('the gate items take an area only where one fits, which is Stripe Connect under Payments',
    gateAreas.length === 1 && /Stripe Connect/.test(gateAreas[0].title) && gateAreas[0].area === 'payments');
  const grants = ['B4', 'B5', 'E6'].map((r) => db.prepare('SELECT owner FROM checklist_parts WHERE item_id = ? AND archived_at IS NULL ORDER BY position').all(byRef(r).id).map((p) => p.owner));
  check('each grant under Access to grant has parts naming who gives it (Amber) and who uses it (Alex)',
    grants.every((o) => o.includes('Amber') && o.includes('Alex')), JSON.stringify(grants));
  const e6 = byRef('E6');
  const oldPart = db.prepare("SELECT * FROM checklist_parts WHERE id = 'cl-024-2'").get();
  check("Search Console access is its own item waiting on Amber, and her old part on the Search Console item is archived and kept",
    e6.title === 'Search Console access for Alex' && e6.status === 'waiting' && e6.waiting_owner === 'Amber' && e6.created_by === 'Claude' &&
    oldPart && oldPart.archived_at && byRef('E4').waiting_on === 'Search Console access for Alex, under Access to grant');
  const areaAudits = db.prepare("SELECT entity_id, COUNT(*) AS n FROM audit_log WHERE action = 'checklist.edit' AND actor = 'claude' AND json_extract(after_json, '$.area') IS NOT NULL GROUP BY entity_id").all();
  check(`each item's area is audited once as Claude, and running the migration again adds nothing (${areaAudits.length} items)`,
    areaAudits.length === items.filter((i) => i.area).length && areaAudits.every((a) => a.n === 1) &&
    db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'checklist.part.add' AND entity_id IN ('cl-012','cl-013','cl-081')").get().n === 8);
  const wp = workplanItems(fs.readFileSync(path.join(APP, 'docs/launch-workplan.md'), 'utf8'));
  check('the workplan gives every item an area except the one that moved to Gate 1', wp.filter((w) => !w.area).map((w) => w.id).join() === 'A16');

  // A database from before areas takes the whole migration, ALTER included, and ends the same.
  const old = new DatabaseSync(':memory:');
  old.exec('PRAGMA foreign_keys = ON');
  old.exec(fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8')
    .replace(/CREATE TABLE IF NOT EXISTS checklist_areas \([\s\S]*?\);\r?\n/, '').replace(/,\r?\n\s*area\s+TEXT REFERENCES checklist_areas\(id\)/, ''));
  const hadArea = old.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('checklist_items') WHERE name = 'area'").get().n;
  for (const m of [MIGRATION, OWNERS_MIGRATION, DAY_ONE_MIGRATION, GA4_MIGRATION, DB_MIGRATION, CALLS_MIGRATION, BUILD_MIGRATION, AREAS_MIGRATION, WAIT_MIGRATION, AMBER_NOTES_MIGRATION]) old.exec(m);
  let again = '';
  try { old.exec(AREAS_MIGRATION); } catch (e) { again = e.message; }
  const same = old.prepare('SELECT id, area FROM checklist_items ORDER BY id').all().map((r) => `${r.id}:${r.area}`).join() ===
    db.prepare('SELECT id, area FROM checklist_items ORDER BY id').all().map((r) => `${r.id}:${r.area}`).join();
  check('on a database from before areas the whole migration applies, a second run stops at the ALTER, and the areas match a new database',
    hadArea === 0 && same && /duplicate column/i.test(again) && old.prepare('SELECT COUNT(*) AS n FROM checklist_areas').get().n === 8);
  old.close();
}

async function areaRouteChecks() {
  let r = await call(SHARED, 'GET', '/api/checklist');
  check('the checklist answer carries the areas in order', r.status === 200 && r.data.areas.map((a) => a.id)[0] === 'domain-email' && r.data.areas.length === 8 &&
    r.data.items.every((i) => 'area' in i));
  const terms = db.prepare("SELECT * FROM checklist_items WHERE ref = 'D2'").get();
  r = await call(SHARED, 'PUT', `/api/checklist/items/${terms.id}`, { version: terms.version, area: 'listings', as: 'Amber' });
  const audit = lastAudit(terms.id);
  check('Amber moves an item to another area in the editor, and the history records the area before and after',
    r.status === 200 && row(terms.id).area === 'listings' && JSON.parse(audit.before_json).area === 'content' && JSON.parse(audit.after_json).area === 'listings' &&
    JSON.parse(audit.after_json).as === 'Amber');
  const problems = drift(workplanItems(fs.readFileSync(path.join(APP, 'docs/launch-workplan.md'), 'utf8')), db.prepare('SELECT * FROM checklist_items').all());
  check('the drift check reports an item whose area changed on the checklist', problems.join() === 'D2 is in area listings on the checklist and content in the workplan', problems.join('; '));
  r = await call(ALEX, 'PUT', `/api/checklist/items/${terms.id}`, { version: row(terms.id).version, area: 'nowhere' });
  check('an area that does not exist is refused', r.status === 400 && row(terms.id).area === 'listings');
  r = await call(ALEX, 'PUT', `/api/checklist/items/${terms.id}`, { version: row(terms.id).version, area: null });
  check('an item can be taken out of every area', r.status === 200 && row(terms.id).area === null);
  r = await call(ALEX, 'PUT', `/api/checklist/items/${terms.id}`, { version: row(terms.id).version, area: 'content' });
  check('and put back, so the workplan and the checklist agree again', r.status === 200 && row(terms.id).area === 'content' &&
    !drift(workplanItems(fs.readFileSync(path.join(APP, 'docs/launch-workplan.md'), 'utf8')), db.prepare('SELECT * FROM checklist_items').all()).length);
  r = await call(ALEX, 'POST', '/api/checklist/items', { title: 'Area test item', section: 'launch', area: 'payments', owner: 'Alex' });
  const added = r.data.id;
  check('a new item can be added straight into an area', r.status === 201 && row(added).area === 'payments');
  await call(ALEX, 'POST', `/api/checklist/items/${added}/archive`, { reason: 'Area test item' });
}

function areaViewChecks() {
  const items = withParts(db.prepare('SELECT * FROM checklist_items WHERE archived_at IS NULL').all());
  const areas = db.prepare('SELECT id, name, position FROM checklist_areas ORDER BY position').all();
  const groups = AR.byArea(items, areas);
  check('By area lists the areas in order, then the gate items with no area under their gate, and every item once',
    groups.map((g) => g.label).slice(0, 8).join('|') === areas.map((a) => a.name).join('|') &&
    groups.slice(8).map((g) => g.label).join('|') === 'Gate 1 additions|Gate 2 additions|Gate 3 additions' &&
    groups.reduce((n, g) => n + g.items.length, 0) === items.length);
  const dom = groups[0];
  const line = AR.waitSummary(dom.items);
  check(`the summary names who an area waits on, people first ("${line}")`,
    /^Waiting on Amber for \d/.test(line) && /, on the domain for 2/.test(line) && !/,\s*$/.test(line));
  check('a waiting line with no person is cut to its subject, and a line naming both people stays both',
    AR.waitWho({ status: 'waiting', waiting_on: 'the domain moving to Cloudflare', owner: 'Alex' }) === 'the domain' &&
    AR.waitWho({ status: 'waiting', waiting_on: 'the site, portal and admin being on puppy-connection.com', owner: 'Alex' }) === 'the site' &&
    AR.waitWho({ status: 'waiting', waiting_on: 'Alex and Amber deciding who opens the account', owner: 'Amber' }) === 'Alex and Amber' &&
    AR.waitWho({ status: 'not_started', owner: 'Alex' }) === 'Alex' && AR.waitSummary([{ status: 'done' }]) === 'Nothing open');

  const asks = AR.asksFor(items, areas, 'Amber');
  const flat = asks.flatMap((g) => g.asks);
  const openAmberParts = items.filter((i) => i.status !== 'done').flatMap((i) => i.parts.filter((p) => !p.done_at && p.owner === 'Amber'));
  check(`Asks for Amber lists every open part she owns once, grouped by area in order (${flat.length} asks in ${asks.length} groups)`,
    openAmberParts.every((p) => flat.filter((a) => a.partId === p.id).length === 1) &&
    asks.map((g) => g.label).join('|') === groups.filter((g) => asks.some((a) => a.label === g.label)).map((g) => g.label).join('|') && asks[0].label === 'Domain and email');
  check('migration 0045 stops the Search Console item naming Amber, so Asks for Amber asks for Search Console access once, audited once',
    !flat.some((a) => a.text === 'Search Console, Bing and the Business Profile') && flat.filter((a) => /Search Console/.test(a.text)).length === 1 &&
    db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = 'cl-024' AND at = '2026-10-20T17:00:00Z'").get().n === 1);
  check('it adds an item waiting on her with no part of hers, such as the listing terms, and leaves out done and archived parts',
    flat.some((a) => a.text === 'Listing terms' && !a.partId) && !flat.some((a) => a.partId === 'cl-024-2') &&
    !flat.some((a) => a.partId && db.prepare('SELECT done_at FROM checklist_parts WHERE id = ?').get(a.partId).done_at) &&
    flat.some((a) => a.partId === 'cl-081-1'));
  const text = AR.asksText(asks, 'Amber', new Date('2026-10-20T12:00:00'));
  const lines = text.trim().split('\n');
  check('Copy as text gives a plain list headed by the date, each area a heading and each ask a dash line',
    lines[0] === 'Asks for Amber, October 20, 2026' && asks.every((g) => lines.includes(g.label)) &&
    lines.filter((l) => l.startsWith('- ')).length === flat.length && !/<|—|\bcl-\d|\b[A-G]\d{1,2}\b/.test(text), text.slice(0, 300));

  const js = fs.readFileSync(path.join(APP, 'admin/public/checklist.js'), 'utf8');
  const html = fs.readFileSync(path.join(APP, 'admin/public/index.html'), 'utf8');
  check('the screen offers By area first and makes it the default, with an Asks for Amber tab and Copy as text',
    js.indexOf('>By area<') > 0 && js.indexOf('>By area<') < js.indexOf('>By section<') && /if \(!v\.areaDefault\) \{ v\.group = 'area'/.test(js) &&
    js.includes('>Asks for Amber<') && js.includes('Copy as text') && js.includes("id=\"f-area\""));
  check('the admin page loads the area script before the checklist script, each with a cache number',
    /checklist-areas\.js\?v=\d+"><\/script>\s*<script src="\/checklist\.js\?v=\d+"/.test(html));
}

seedChecks();
areaSeedChecks();
await routeChecks();
await areaRouteChecks();
areaViewChecks();
console.log(`\n${passes} passed, ${fails} failed`);
process.exitCode = fails ? 1 : 0;
