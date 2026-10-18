// Write the migration that cleans Wix form labels out of imported puppy descriptions (launch
// workplan A10, lib/wixtext.js), from the rows a database holds now.
//
//   node app/dev/make-wix-description-migration.mjs [--remote] [--out migrations/0022_wix_descriptions.sql]
//
// --remote reads the staging database through wrangler; without it, the local one. Each UPDATE
// names the puppy by id and its exact current description, so a description a breeder has edited
// since is left alone, and running it twice changes nothing. Prints a before and after for the
// first three.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { wixResidue, parentColorLine } from '../lib/wixtext.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const remote = process.argv.includes('--remote');
const outArg = process.argv.indexOf('--out');
const out = path.resolve(APP, outArg > 0 ? process.argv[outArg + 1] : 'migrations/0022_wix_descriptions.sql');

const query = `SELECT p.id, p.name, p.color, p.description, p.litter_id, l.mom_weight_lb, l.dad_weight_lb, l.description AS litter_description
  FROM puppies p JOIN litters l ON l.id = p.litter_id
 WHERE p.description LIKE 'Mom%s information%' OR p.description LIKE 'Mother%s information%' OR p.description LIKE 'Dam%s information%'
    OR p.description LIKE 'Dad%s information%' OR p.description LIKE 'Father%s information%' OR p.description LIKE 'Sire%s information%'
    OR p.description LIKE 'Puppy%s color%' ORDER BY p.id`;
const args = [WRANGLER, 'd1', 'execute', 'puppyconnection', '--json', '--command', query,
  ...(remote ? ['--remote', '--config', path.join(APP, 'portal/wrangler.hosted.jsonc')] : ['--local', '--persist-to', path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc')])];
const raw = execFileSync(process.execPath, args, { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const rows = JSON.parse(raw.slice(raw.indexOf('[')))[0].results;

const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const sql = [];
const litters = {};
const shown = [];
for (const r of rows) {
  const c = wixResidue(r.description);
  if (!c) continue;
  sql.push(`UPDATE puppies SET description = ${q(c.prose || null)}, color = COALESCE(color, ${q(c.puppyColor)}),
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'), version = version + 1
 WHERE id = ${q(r.id)} AND description = ${q(r.description)};`);
  // A litter takes the first puppy's parent values, and only where its own are empty.
  if (!litters[r.litter_id]) {
    litters[r.litter_id] = true;
    const line = parentColorLine(c);
    sql.push(`UPDATE litters SET mom_weight_lb = COALESCE(mom_weight_lb, ${q(c.mom.weight ?? null)}), dad_weight_lb = COALESCE(dad_weight_lb, ${q(c.dad.weight ?? null)}),
  description = CASE WHEN description IS NULL OR trim(description) = '' THEN ${q(line)} ELSE description END,
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'), version = version + 1
 WHERE id = ${q(r.litter_id)};`);
  }
  if (shown.length < 3) shown.push({ name: r.name, before: r.description.slice(0, 240), after: { description: (c.prose || '').slice(0, 120), color: r.color || c.puppyColor, mom_weight_lb: r.mom_weight_lb ?? c.mom.weight ?? null, dad_weight_lb: r.dad_weight_lb ?? c.dad.weight ?? null, litter: parentColorLine(c) } });
}

const head = `-- ${new Date().toISOString().slice(0, 10)}. Wix form labels out of imported puppy descriptions (launch workplan A10), written by
-- dev/make-wix-description-migration.mjs from the ${remote ? 'staging' : 'local'} database. ${sql.filter((s) => s.startsWith('UPDATE puppies')).length} descriptions started with the run of labels,
-- such as "Mom's information weight: 8 pounds color: Dad's information ...". Each keeps the breeder's own prose
-- exactly as written, the puppy's color moves to its color where that is empty, the parents' weights to the
-- litter where those are empty, and the parents' colors, which have no field, become one line for the
-- litter. Each UPDATE names the exact current description, so an edited one is left alone.
`;
fs.writeFileSync(out, `${head}\n${sql.join('\n')}\n\nUPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;\n`);
console.log(`${rows.length} descriptions found, migration written to ${path.relative(APP, out)}`);
console.log(JSON.stringify(shown, null, 1));
