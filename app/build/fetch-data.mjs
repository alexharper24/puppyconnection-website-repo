// Fetch the public data for a site build (hook mode, app/lib/publish.js).
//
// The portal serves /data/export.json, exactly what a publish would commit (app/lib/shape.js),
// read from the database's public views only. This writes each file under <folder>/data/ so
// build/generate.mjs builds from it the same way it builds from committed data. Node only, no
// packages. The source is app/build/fetch-data.mjs in alexharper24/puppyconnection-website-repo,
// copied into the site repository by app/build/sync-site-repo.mjs.
//
//   node build/fetch-data.mjs <url> <folder>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_FILES = ['data/breeds.json', 'data/breeders.json', 'data/litters.json', 'data/puppies.json'];

export async function fetchData(url, folder, { tries = 3 } = {}) {
  let res, lastError;
  for (let i = 0; i < tries; i += 1) {
    try {
      res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'puppyconnection-site-build' } });
      if (res.ok) break;
      lastError = new Error(`${url} answered ${res.status}`);
    } catch (e) { lastError = e; }
    res = null;
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  if (!res) throw lastError;
  const body = await res.json();
  const files = body && body.files;
  // Every file must be there and must be a JSON list, or nothing is written and the build stops,
  // so the site already deployed stays as it was.
  for (const f of DATA_FILES) {
    if (!files || typeof files[f] !== 'string') throw new Error(`${url} did not include ${f}`);
    if (!Array.isArray(JSON.parse(files[f]))) throw new Error(`${f} from ${url} is not a list`);
  }
  for (const f of DATA_FILES) {
    const out = path.join(folder, f);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, files[f]);
  }
  return { generation: body.generation, counts: body.counts || {} };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [url, folder] = process.argv.slice(2);
  if (!url || !folder) { console.error('usage: node build/fetch-data.mjs <url> <folder>'); process.exit(2); }
  fetchData(url, path.resolve(folder))
    .then((r) => console.log(`fetched data at generation ${r.generation}: ${r.counts.puppies} puppies, ${r.counts.breeders} breeders, ${r.counts.litters} litters, ${r.counts.breeds} breeds`))
    .catch((e) => { console.error(`fetch-data: ${e.message}`); process.exit(1); });
}
