// Restore a nightly backup (spec section 10, plan P4.8) into a FRESH database, then prove every
// table holds the number of rows the backup holds.
//
// The backup job (lib/jobs.js) writes every table as JSON, gzipped, to R2 at
// backups/YYYY-MM-DD.json.gz. This turns one of those files into SQL (schema.sql first, then every
// row, with the backup winning over the starting rows schema.sql adds) and runs it with wrangler.
//
//   node app/ops/restore-backup.mjs --backup <file.json.gz> --persist-to <empty folder>
//        a local rehearsal: the fresh database is wrangler's local D1 under that folder
//   node app/ops/restore-backup.mjs --backup <file.json.gz> --remote --database <new D1 name> --config <wrangler config>
//        a real restore into a NEW, empty D1 database (docs/launch-checklist.md has the procedure)
//   --sql-only <file>   write the SQL and stop, to read it before running it
//
// It never writes into a database that already has rows, so it cannot overwrite the live one.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);

// Parents before children, so the order reads naturally. Foreign keys are deferred anyway.
export const ORDER = ['people', 'breeds', 'settings', 'site_state', 'terms_versions', 'breeders', 'breeder_profiles', 'breeder_breeds',
  'litters', 'puppies', 'photos', 'checkouts', 'checkout_items', 'puppy_holds', 'payments', 'stripe_events', 'disputes',
  'puppy_stats', 'account_requests', 'operator_notes', 'audit_log', 'email_log', 'job_runs'];

const lit = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? '1' : '0') : `'${String(v).replace(/'/g, "''")}'`);

export function readBackup(file) {
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
}

/** The restore as SQL text. Tables the backup has that ORDER does not name go last. */
export function restoreSql(dump) {
  const tables = [...ORDER.filter((t) => dump.tables[t]), ...Object.keys(dump.tables).filter((t) => !ORDER.includes(t))];
  const out = [fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8'), 'PRAGMA defer_foreign_keys = true;'];
  for (const t of tables) {
    for (const row of dump.tables[t]) {
      const cols = Object.keys(row);
      out.push(`INSERT OR REPLACE INTO ${t} (${cols.join(', ')}) VALUES (${cols.map((c) => lit(row[c])).join(', ')});`);
    }
  }
  return { sql: `${out.join('\n')}\n`, tables };
}

function wrangler(args) {
  return execFileSync(process.execPath, [WRANGLER, ...args], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).toString();
}

/** Run one query against the target and return its rows. */
export function query(target, sql) {
  const where = target.remote ? ['--remote'] : ['--local', '--persist-to', target.persistTo];
  const out = wrangler(['d1', 'execute', target.database, ...where, '--config', target.config, '--json', '--command', sql]);
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

export function restore({ backup, target, sqlOnly }) {
  const dump = readBackup(backup);
  const { sql, tables } = restoreSql(dump);
  const sqlFile = sqlOnly || path.join(os.tmpdir(), `pc-restore-${process.pid}.sql`);
  fs.writeFileSync(sqlFile, sql);
  if (sqlOnly) return { sqlFile, tables };
  // Refuse a database that already holds anything, so a slip cannot land on the live one.
  let existing = 0;
  try { existing = query(target, "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'breeders'")[0].n; } catch { existing = 0; }
  if (existing) {
    const rows = query(target, 'SELECT COUNT(*) AS n FROM breeders')[0].n;
    if (rows) throw new Error(`The target database already has ${rows} breeders. A restore goes into a new, empty database.`);
  }
  const where = target.remote ? ['--remote'] : ['--local', '--persist-to', target.persistTo];
  wrangler(['d1', 'execute', target.database, ...where, '--config', target.config, '--file', sqlFile, '--yes']);
  fs.rmSync(sqlFile, { force: true });
  // Prove it, table by table.
  // One row of subqueries, because D1 refuses a UNION of this many SELECTs.
  const got = query(target, `SELECT ${tables.map((t) => `(SELECT COUNT(*) FROM ${t}) AS "${t}"`).join(', ')}`)[0];
  const rows = tables.map((t) => ({ table: t, backup: dump.tables[t].length, restored: got[t] }));
  return { taken_at: dump.taken_at, rows, ok: rows.every((r) => r.backup === r.restored) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const backup = opt('backup');
  if (!backup) { console.error('usage: node app/ops/restore-backup.mjs --backup <file.json.gz> (--persist-to <folder> | --remote --database <name> --config <file>) [--sql-only <file>]'); process.exit(2); }
  const target = flag('remote')
    ? { remote: true, database: opt('database'), config: path.resolve(opt('config', '')) }
    : { remote: false, database: 'puppyconnection', persistTo: path.resolve(opt('persist-to', '')), config: path.join(APP, 'portal/wrangler.jsonc') };
  if (opt('sql-only')) {
    const r = restore({ backup: path.resolve(backup), sqlOnly: path.resolve(opt('sql-only')) });
    console.log(`wrote ${r.sqlFile} covering ${r.tables.length} tables`);
    process.exit(0);
  }
  if (target.remote && (!target.database || !opt('config'))) { console.error('a remote restore needs --database and --config'); process.exit(2); }
  if (!target.remote && !opt('persist-to')) { console.error('a local restore needs --persist-to <empty folder>'); process.exit(2); }
  const r = restore({ backup: path.resolve(backup), target });
  console.log(`backup taken ${r.taken_at}`);
  for (const x of r.rows) console.log(`${x.backup === x.restored ? 'ok ' : 'BAD'}  ${x.table.padEnd(18)} backup ${String(x.backup).padStart(6)}  restored ${String(x.restored).padStart(6)}`);
  console.log(r.ok ? 'every table matches' : 'MISMATCH, do not use this restore');
  process.exit(r.ok ? 0 : 1);
}
