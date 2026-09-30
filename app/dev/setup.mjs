// Set up (or reset) the local simulation.
//
//   node app/dev/setup.mjs            create .dev.vars files, apply schema.sql, load the seed
//   node app/dev/setup.mjs --reset    delete the local database and files first
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

if (process.argv.includes('--reset')) {
  fs.rmSync(STATE, { recursive: true, force: true });
  console.log('removed app/.state');
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
console.log('\nNext: start pc-portal and pc-admin (see app/README.md), then open http://localhost:8787');
