// Build app/site/public for the hosted site Worker: the concept pages, patched to render
// database data (site-copy.mjs), plus data/base.json holding the concept's own breed and
// profile records. data/data.js itself is built live by site/worker.js on each request.
//
//   node app/dev/build-site.mjs

import fs from 'node:fs';
import path from 'node:path';
import { copyConcept, REPO } from './site-copy.mjs';

const OUT = path.join(REPO, 'app/site/public');
const base = copyConcept(OUT);
fs.writeFileSync(path.join(OUT, 'data/base.json'), JSON.stringify(base));
fs.rmSync(path.join(OUT, 'data/data.js'), { force: true });
console.log(`site built into app/site/public: ${base.breeds.length} breeds, ${base.profiles.length} profiles`);
