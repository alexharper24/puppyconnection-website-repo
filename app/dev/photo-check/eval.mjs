// Score the photo check against Alex's calls on the 100-photo sample (launch workplan A9).
//
//   node app/dev/photo-check/eval.mjs [--limit N]            PHOTO_MODEL, EVAL_PORT, PRICE_IN and PRICE_OUT override the model
//
// Starts the scoring Worker (worker.js) under wrangler dev on 8790, which calls the real Workers
// AI, sends each sample photo as the portal would (the 640 px card copy), and compares the answer
// with verdicts.tsv, where "flag" and "reject" both mean the photo does not pass straight through
// and "pass" and "fix" (crop closer) pass. It prints the disagreements, the tokens used and the
// cost per photo at the model's published Workers AI price, and writes results-<model>.json beside the
// sample. Each photo is fetched from Wix at 640 px, the size of the portal's card copy.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = process.env.PHOTO_SAMPLE || 'C:/Git_Repos/hs-seo-data/puppyconnection/2026-10-17-photo-sample';
const WRANGLER = process.env.WRANGLER_JS || path.resolve(HERE, '../../../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const PORT = Number(process.env.EVAL_PORT || 8790);
// Workers AI price for @cf/meta/llama-4-scout-17b-16e-instruct, USD per million tokens.
const PRICE_IN = Number(process.env.PRICE_IN || 0.27), PRICE_OUT = Number(process.env.PRICE_OUT || 0.85);
const limit = Number(process.argv[process.argv.indexOf('--limit') + 1]) || Infinity;

const metrics = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(SAMPLE, 'metrics.json'), 'utf8')).map((m) => [m.n, m]));
const calls = fs.readFileSync(path.join(SAMPLE, 'verdicts.tsv'), 'utf8').trim().split(/\r?\n/).slice(1)
  .map((l) => l.split('\t')).map(([n, verdict, reason]) => ({ n: Number(n), verdict, reason }));
const expected = (v) => (v === 'flag' || v === 'reject' ? 'send_back' : 'pass');
const card = (url) => `${url}/v1/fit/w_640,h_640,q_85,enc_auto/i.jpg`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const model = process.env.PHOTO_MODEL || '@cf/meta/llama-4-scout-17b-16e-instruct';
  const dev = spawn(process.execPath, [WRANGLER, 'dev', '--config', path.join(HERE, 'wrangler.jsonc'), '--port', String(PORT), '--var', `PHOTO_MODEL:${model}`], { cwd: HERE, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; dev.stdout.on('data', (d) => { log += d; }); dev.stderr.on('data', (d) => { log += d; });
  try {
    for (let i = 0; i < 60 && !/Ready on/.test(log); i += 1) await sleep(1000);
    if (!/Ready on/.test(log)) throw new Error(`the scoring Worker did not start:\n${log.slice(-800)}`);
    const out = [];
    for (const c of calls.slice(0, limit)) {
      const img = await fetch(card(metrics[c.n].url));
      const bytes = new Uint8Array(await img.arrayBuffer());
      let r;
      for (let t = 0; t < 3 && !r; t += 1) {
        const res = await fetch(`http://localhost:${PORT}/`, { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: bytes });
        const text = await res.text();
        try { r = JSON.parse(text); } catch { await sleep(3000); }
      }
      if (!r) r = { verdict: 'pass', reasons: [], judged: false, error: 'no answer from the scoring Worker' };
      const row = { n: c.n, alex: c.verdict, want: expected(c.verdict), got: r.verdict, reasons: r.reasons, judged: r.judged, error: r.error, usage: r.usage, ms: r.ms, bytes: bytes.length, why: c.reason };
      out.push(row);
      console.log(`${String(c.n).padStart(3)} ${row.want === row.got ? 'agree   ' : 'DISAGREE'} alex ${c.verdict.padEnd(6)} model ${String(r.verdict).padEnd(9)} ${(r.reasons || []).join(',')}${r.error ? ` (${r.error})` : ''}`);
    }
    const judged = out.filter((r) => r.judged);
    const tin = judged.reduce((a, r) => a + (r.usage?.prompt_tokens || 0), 0), tout = judged.reduce((a, r) => a + (r.usage?.completion_tokens || 0), 0);
    const per = judged.length ? ((tin / 1e6) * PRICE_IN + (tout / 1e6) * PRICE_OUT) / judged.length : 0;
    const dis = out.filter((r) => r.want !== r.got);
    const summary = {
      model, photos: out.length, judged: judged.length, disagreements: dis.length,
      missed: dis.filter((r) => r.want === 'send_back').map((r) => r.n), extra_send_backs: dis.filter((r) => r.want === 'pass').map((r) => r.n),
      tokens_in_per_photo: judged.length ? Math.round(tin / judged.length) : 0, tokens_out_per_photo: judged.length ? Math.round(tout / judged.length) : 0,
      usd_per_photo: Number(per.toFixed(6)), usd_per_1000_photos: Number((per * 1000).toFixed(3)),
      ms_median: judged.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(judged.length / 2)] || null,
    };
    console.log('\n' + JSON.stringify(summary, null, 1));
    fs.writeFileSync(path.join(SAMPLE, `results-${model.split('/').pop()}.json`), JSON.stringify({ run_at: new Date().toISOString(), summary, photos: out }, null, 1));
  } finally {
    dev.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
