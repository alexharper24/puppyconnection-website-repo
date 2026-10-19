// Apply a migration to the hosted D1 database in batches of `d1 execute --command`, each opening
// with PRAGMA defer_foreign_keys = true. Hosted D1 honors that pragma only inside one --command,
// and --file ignores it (README, 2026-10-12), while a whole migration can be far longer than one
// Windows command line. A line reading "-- group" starts statements that must share a batch, such
// as a litter moving with its puppies; each other statement may go in any batch.
//
//   node app/ops/d1-apply.mjs <migration.sql> --remote     apply to staging (wrangler.hosted.jsonc)
//   node app/ops/d1-apply.mjs <migration.sql> --sqlite <f> apply to a SQLite file instead (rehearsal)
//   node app/ops/d1-apply.mjs <migration.sql> --dry-run    print the batches it would send
//
// Take the export backup first and confirm it downloaded. A batch that fails stops the run, and the
// batches before it stay applied, so a migration run this way must be safe to run twice.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const argv = process.argv.slice(2);
const file = argv[0];
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
const LIMIT = 20000;
if (!file || !(argv.includes('--remote') || opt('sqlite') || argv.includes('--dry-run'))) {
  console.error('usage: d1-apply.mjs <migration.sql> --remote | --sqlite <file> | --dry-run');
  process.exit(1);
}

// Split into statements, outside quoted strings, dropping comments but noting "-- group" lines.
const text = fs.readFileSync(file, 'utf8');
const units = [];
let cur = null, stmt = '', inStr = false, groupNext = false;
for (let i = 0; i < text.length; i += 1) {
  const c = text[i];
  if (inStr) { stmt += c; if (c === "'") { if (text[i + 1] === "'") { stmt += "'"; i += 1; } else inStr = false; } continue; }
  if (c === '-' && text[i + 1] === '-') {
    const end = text.indexOf('\n', i);
    const line = text.slice(i, end < 0 ? text.length : end).trim();
    const atLineStart = /(^|\n)[ \t]*$/.test(text.slice(Math.max(0, i - 200), i));
    if (atLineStart && line === '-- group') groupNext = true;
    else if (atLineStart && !stmt.trim()) cur = null;  // a section heading ends any open group
    i = (end < 0 ? text.length : end) - 1;
    continue;
  }
  if (c === "'") { inStr = true; stmt += c; continue; }
  if (c === ';') {
    const s = stmt.trim();
    stmt = '';
    if (!s || /^PRAGMA\s+defer_foreign_keys/i.test(s)) continue;
    if (groupNext || !cur || !cur.group) { cur = { group: groupNext, stmts: [] }; units.push(cur); groupNext = false; }
    cur.stmts.push(`${s};`);
    if (!cur.group) cur = null;
    continue;
  }
  stmt += c;
}
if (stmt.trim()) throw new Error('the file ends inside a statement');

const PRAGMA = 'PRAGMA defer_foreign_keys = true;';
const batches = [];
let batch = [];
let size = PRAGMA.length;
for (const u of units) {
  const body = u.stmts.join('\n');
  if (body.length + PRAGMA.length > LIMIT) throw new Error(`one group is ${body.length} characters, over the ${LIMIT} limit`);
  if (size + body.length + 1 > LIMIT && batch.length) { batches.push(batch); batch = []; size = PRAGMA.length; }
  batch.push(body);
  size += body.length + 1;
}
if (batch.length) batches.push(batch);
const statements = units.reduce((n, u) => n + u.stmts.length, 0);
console.log(`${path.basename(file)}: ${statements} statements in ${units.length} units, ${batches.length} batches`);

if (argv.includes('--dry-run')) {
  batches.forEach((b, i) => console.log(`batch ${i + 1}: ${b.join('\n').length} characters, ${b.length} units`));
  process.exit(0);
}

let db = null;
if (opt('sqlite')) {
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(opt('sqlite'));
  db.exec('PRAGMA foreign_keys = ON;');
}
for (const [i, b] of batches.entries()) {
  const sql = `${PRAGMA}\n${b.join('\n')}`;
  if (db) {
    db.exec('BEGIN;');
    try { db.exec(sql); db.exec('COMMIT;'); } catch (e) { db.exec('ROLLBACK;'); throw new Error(`batch ${i + 1} failed: ${e.message}`); }
  } else {
    const args = [WRANGLER, 'd1', 'execute', 'puppyconnection', '--remote', '--config', path.join(APP, 'portal/wrangler.hosted.jsonc'), '--json', '--command', sql];
    let raw;
    try {
      raw = execFileSync(process.execPath, args, { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    } catch (e) {
      console.error(`batch ${i + 1} failed:\n${(e.stdout || '').toString().slice(-2000)}\n${(e.stderr || '').toString().slice(-2000)}`);
      process.exit(1);
    }
    const res = JSON.parse(raw.slice(raw.indexOf('[')));
    if (!res.every((r) => r.success)) { console.error(`batch ${i + 1} reported a failure`); process.exit(1); }
  }
  console.log(`batch ${i + 1} of ${batches.length} applied`);
}
