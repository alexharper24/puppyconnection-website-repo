// The restore rehearsal (plan P4.8). Runs the nightly backup job, takes the file it wrote out of
// the local R2, restores it with app/ops/restore-backup.mjs into a fresh local database, and
// proves every table matches, by count and by content.
//
//   node app/dev/restore-test.mjs        with pc-portal on 8787 and pc-admin on 8788

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { APP, localD1File } from './node-env.mjs';
import { restore, readBackup, query } from '../ops/restore-backup.mjs';

const ADMIN = 'http://localhost:8788';
const WRANGLER = path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-restore-'));
let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

try {
  // The backup job, through the admin's Run now, which runs the same code as the cron.
  const run = await fetch(`${ADMIN}/api/jobs/backup/run`, { method: 'POST', headers: { origin: ADMIN, 'content-type': 'application/json' }, body: '{}' });
  const job = await run.json();
  check('the nightly backup job runs and writes to R2', run.status === 200 && job.ok && /^backups\/\d{4}-\d\d-\d\d\.json\.gz$/.test(job.key), JSON.stringify(job));

  // What the database held when the backup ran, read from a snapshot of the local file.
  const snap = path.join(TMP, 'live.sqlite');
  const src = new DatabaseSync(localD1File(), { readOnly: true });
  src.exec(`VACUUM INTO '${snap.replace(/'/g, "''")}'`);
  src.close();
  const live = new DatabaseSync(snap, { readOnly: true });

  const file = path.join(TMP, 'backup.json.gz');
  execFileSync(process.execPath, [WRANGLER, 'r2', 'object', 'get', `puppyconnection-files/${job.key}`, '--file', file, '--local',
    '--persist-to', path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc')], { cwd: APP, stdio: 'ignore' });
  const dump = readBackup(file);
  check('the backup file comes back out of R2 and opens', !!dump.taken_at && Object.keys(dump.tables).length >= 20, Object.keys(dump.tables).join(', '));
  check('the backup row count is the one the job reported', Object.values(dump.tables).reduce((n, r) => n + r.length, 0) === job.rows);
  // The job writes its own job_runs row, and Run now its audit row, just after the dump is taken.
  const liveCount = (t) => live.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  const liveMatch = Object.entries(dump.tables).filter(([t, rows]) => !['audit_log', 'job_runs'].includes(t) && liveCount(t) !== rows.length);
  check('every table in the backup holds what the database held', liveMatch.length === 0, liveMatch.map(([t]) => t).join(', '));
  check('... apart from the run of the backup itself, recorded just after it',
    liveCount('audit_log') === dump.tables.audit_log.length + 1 && liveCount('job_runs') - dump.tables.job_runs.length <= 1);

  const persistTo = path.join(TMP, 'fresh-state');
  const target = { remote: false, database: 'puppyconnection', persistTo, config: path.join(APP, 'portal/wrangler.jsonc') };
  const r = restore({ backup: file, target });
  for (const x of r.rows) check(`restored ${x.table}: ${x.restored} of ${x.backup} rows`, x.backup === x.restored);
  check('every table matches, table by table', r.ok && r.rows.length === Object.keys(dump.tables).length);

  // Content as well as counts, for the tables the site and the money depend on.
  for (const [t, key] of [['puppies', 'id'], ['photos', 'id'], ['breeder_profiles', 'breeder_id'], ['payments', 'stripe_payment_intent_id'], ['checkouts', 'id'], ['audit_log', 'id'], ['settings', 'key']]) {
    const restored = query(target, `SELECT * FROM ${t} ORDER BY ${key}`);
    const fromBackup = dump.tables[t].slice().sort((a, b) => String(a[key]).localeCompare(String(b[key]), 'en', { numeric: false }));
    const norm = (rows) => JSON.stringify(rows.map((x) => Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))).sort((a, b) => (String(a[key]) < String(b[key]) ? -1 : 1)));
    check(`${t} rows are identical to the backup`, norm(restored) === norm(fromBackup));
  }
  const pub = query(target, 'SELECT COUNT(*) AS n FROM public_puppies')[0].n;
  check('the restored database shows the same public puppies', pub === live.prepare('SELECT COUNT(*) AS n FROM public_puppies').get().n, String(pub));

  // A restore never lands on a database that already has rows.
  let refused = '';
  try { restore({ backup: file, target }); } catch (e) { refused = e.message; }
  check('restoring into a database that already has rows is refused', /already has \d+ breeders/.test(refused), refused);
  live.close();
} catch (e) {
  check('the test ran to the end', false, e.stack);
} finally {
  // wrangler's local runtime can hold its files a moment after it exits on Windows.
  try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); } catch { /* left in the temp folder */ }
}
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
