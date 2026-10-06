// Set up (or reset) the local simulation.
//
//   node app/dev/setup.mjs            create .dev.vars files, apply schema.sql, load the seed
//   node app/dev/setup.mjs --reset    delete the local database and files first (staging backups stay)
//   node app/dev/setup.mjs --demo     also load the three demo breeders (plan P5.1), as staging's
//                                      Reset demo data does. The test suites expect them absent.
//
// Wrangler comes from Teapup's editor, because npm install does not work from this account.
// Point WRANGLER_JS somewhere else to use a different copy.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const STATE = path.join(APP, '.state');
export const WRANGLER = process.env.WRANGLER_JS
  || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');

if (!fs.existsSync(WRANGLER)) {
  console.error(`Wrangler not found at ${WRANGLER}. Set WRANGLER_JS to a wrangler.js.`);
  process.exit(1);
}

// A staging backup (app/.state/staging-*.sql) is the only copy of staging taken before a schema
// change, so a reset keeps those files and removes everything else under app/.state.
const KEEP = /^staging-.*\.sql$/;
if (process.argv.includes('--reset')) {
  const kept = [];
  for (const name of fs.existsSync(STATE) ? fs.readdirSync(STATE) : []) {
    if (KEEP.test(name)) { kept.push(name); continue; }
    fs.rmSync(path.join(STATE, name), { recursive: true, force: true });
  }
  console.log(`emptied app/.state${kept.length ? `, keeping ${kept.length} staging backup${kept.length === 1 ? '' : 's'}: ${kept.join(', ')}` : ''}`);
}

for (const worker of ['portal', 'admin']) {
  const target = path.join(APP, worker, '.dev.vars');
  if (!fs.existsSync(target)) {
    fs.copyFileSync(path.join(APP, worker, '.dev.vars.example'), target);
    console.log(`created app/${worker}/.dev.vars from the example`);
  }
}

// One stylesheet for both tools. The portal's copy is the source, and this keeps the admin's
// copy identical so the two cannot drift.
fs.copyFileSync(path.join(APP, 'portal/public/portal.css'), path.join(APP, 'admin/public/portal.css'));

execFileSync(process.execPath, [path.join(HERE, 'seed.mjs')], { stdio: 'inherit' });

function d1(file) {
  execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local',
    '--persist-to', STATE, '--config', path.join(APP, 'portal/wrangler.jsonc'), '--file', file],
  { stdio: ['ignore', 'pipe', 'inherit'], cwd: APP });
}

d1(path.join(APP, 'schema.sql'));
console.log('applied schema.sql');
d1(path.join(STATE, 'seed.sql'));
console.log('loaded the seed');

if (process.argv.includes('--demo')) {
  // The same rows the staging reset loads, written straight into the local database file while
  // the servers are stopped, and the pictures put into the local R2 with wrangler.
  const { d1, localD1File } = await import('./node-env.mjs');
  const { demoData, wipeStatements, demoStatements } = await import('../lib/demo.js');
  const db = d1(localD1File());
  const env = { DB: db };
  const data = demoData();
  await db.batch([...wipeStatements(env), ...demoStatements(env, data)]);
  db.close();
  const tmp = fs.mkdtempSync(path.join(STATE, 'demo-'));
  for (const f of data.files) {
    const file = path.join(tmp, path.basename(f.key));
    fs.writeFileSync(file, Buffer.from(f.b64, 'base64'));
    execFileSync(process.execPath, [WRANGLER, 'r2', 'object', 'put', `puppyconnection-files/${f.key}`, '--file', file,
      '--content-type', f.type, '--local', '--persist-to', STATE, '--config', path.join(APP, 'portal/wrangler.jsonc')],
    { stdio: 'ignore', cwd: APP });
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`loaded the demo: ${data.rows.breeders.length} breeders, ${data.rows.puppies.length} puppies, ${data.files.length} pictures`);
}
console.log('\nNext: start pc-portal and pc-admin (see app/README.md), then open http://localhost:8787');
