// Summarize a run.mjs results.json (mobile review, 2026-11-11).
//   node app/dev/mobile-review/summarize.mjs <results.json> [--phones|--desk] [--json out.json]
// Prints one line per problem: how many screens show it, the widths, the measured range and the
// element, so repeated problems (one rule, many screens) sort to the top.
import fs from 'node:fs';

const file = process.argv[2];
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const desk = process.argv.includes('--desk');
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const rows = new Map();
let combos = 0, errors = [];
for (const v of Object.values(r)) {
  if (desk ? v.w < 1000 : v.w >= 1000) continue;
  combos++;
  if (v.error) { errors.push(`${v.id}@${v.w}: ${v.error}`); continue; }
  for (const f of v.findings || []) {
    const el = f.el.replace(/"[^"]*"/, '').replace(/#[\w-]*\d[\w-]*/g, '#…').trim();
    const sig = `${f.check} | ${el}`;
    const row = rows.get(sig) || { check: f.check, el, screens: new Set(), widths: new Set(), values: [], sample: f.el };
    row.screens.add(v.id); row.widths.add(v.w);
    const val = f.check === 'tap' ? f.h : f.px ?? f.heights ?? f.wrap ?? f.h;
    if (val !== undefined) row.values.push(val);
    rows.set(sig, row);
  }
}
const out = [...rows.values()].map((x) => {
  const nums = x.values.filter((n) => typeof n === 'number');
  return { check: x.check, el: x.el, sample: x.sample, screens: [...x.screens], widths: [...x.widths].sort(), measured: nums.length ? (Math.min(...nums) === Math.max(...nums) ? `${nums[0]}` : `${Math.min(...nums)}–${Math.max(...nums)}`) : [...new Set(x.values)].slice(0, 2).join(' ; ') };
}).sort((a, b) => b.screens.length - a.screens.length);
console.log(`${combos} combinations, ${errors.length} errors, ${out.length} distinct problems`);
for (const e of errors) console.log('ERROR', e);
for (const o of out) console.log(String(o.screens.length).padStart(3), o.check.padEnd(8), o.measured.toString().padEnd(14), o.widths.join('/').padEnd(12), o.el.slice(0, 70), '::', o.screens.slice(0, 5).join(','));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ combos, errors, problems: out }, null, 1));
