// Print each result's findings in one line, for a quick look after a partial run.
//   node app/dev/mobile-review/show.mjs <results.json> [width] [id-regex]
import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const w = process.argv[3] ? +process.argv[3] : null;
const re = process.argv[4] ? new RegExp(process.argv[4]) : null;
for (const v of Object.values(r)) {
  if ((w && v.w !== w) || (re && !re.test(v.id))) continue;
  if (v.error) { console.log(`${v.id}@${v.w} ERROR ${v.error}`); continue; }
  console.log(`${v.id}@${v.w}${v.probe ? ' probe=' + JSON.stringify(v.probe) : ''}`);
  for (const f of v.findings) console.log('   ', f.check, f.el.slice(0, 70), JSON.stringify(Object.fromEntries(Object.entries(f).filter(([k]) => !['check', 'el'].includes(k)))));
}
