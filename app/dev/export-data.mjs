// Write the publish's data/*.json from the local database into a folder, exactly as a publish
// would commit them (lib/shape.js), so the site repository's build can be run locally on real
// data without a GitHub token:
//
//   node app/dev/export-data.mjs <folder>       writes <folder>/data/*.json
//
// It reads a snapshot of the local D1 database, so it is safe while wrangler dev is running.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { d1, localD1File } from './node-env.mjs';
import { exportSite } from '../lib/shape.js';

export async function exportData(folder) {
  const snap = path.join(os.tmpdir(), `pc-export-${process.pid}-${Date.now()}.sqlite`);
  const src = new DatabaseSync(localD1File(), { readOnly: true });
  src.exec(`VACUUM INTO '${snap.replace(/'/g, "''")}'`);
  src.close();
  const db = d1(snap);
  try {
    const exp = await exportSite({ DB: db });
    for (const [p, t] of Object.entries(exp.files)) {
      const f = path.join(folder, p);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, t);
    }
    return exp.counts;
  } finally {
    db.close();
    fs.rmSync(snap, { force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folder = process.argv[2];
  if (!folder) { console.error('usage: node app/dev/export-data.mjs <folder>'); process.exit(2); }
  exportData(path.resolve(folder)).then((c) => console.log(`wrote data/*.json: ${c.puppies} puppies, ${c.breeders} breeders, ${c.litters} litters, ${c.breeds} breeds`))
    .catch((e) => { console.error(e); process.exit(1); });
}
