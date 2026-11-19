// Where a visit began (Alex, 2026-11-19): the browser side, SOURCE_JS in build/generate.mjs, run
// on Node with a made-up address, referring site and localStorage for each case.
//
//   node app/dev/source-test.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const gen = fs.readFileSync(path.join(HERE, '../build/generate.mjs'), 'utf8');
const m = gen.match(/const SOURCE_JS = `([\s\S]*?)`;/);
if (!m) throw new Error('SOURCE_JS not found in generate.mjs');
// The template literal's escapes, as the generator writes them into js/main.js.
const code = new Function(`return \`${m[1]}\`;`)();

let pass = 0, fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass += 1; console.log(`  ok   ${name}`); } else { fail += 1; console.log(`  FAIL ${name}${detail ? `\n       ${detail}` : ''}`); }
}

function run(url, referrer, store = {}, nowMs = Date.now()) {
  const u = new URL(url);
  const ctx = {
    window: {}, URL, URLSearchParams, JSON, Date: { now: () => nowMs },
    location: { search: u.search, hostname: u.hostname },
    document: { referrer },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  };
  vm.runInNewContext(code, ctx);
  return { c: ctx.window.pcSource(), store };
}
const SITE = 'https://www.puppy-connection.com/';

console.log('\n-- each kind of arrival');
check('a Meta ad (utm_source=fb, utm_medium=paid) is paid', run(SITE + 'puppies.html?utm_source=fb&utm_medium=paid&utm_campaign=52681984445474&fbclid=x', 'https://m.facebook.com/').c === 'paid');
check('an Instagram ad (utm_source=ig, utm_medium=paid) is paid', run(SITE + '?utm_source=ig&utm_medium=paid', '').c === 'paid');
check('a Google ad click (gclid) is paid', run(SITE + '?gclid=abc', 'https://www.google.com/').c === 'paid');
check('Google with no ad tag is a search engine', run(SITE, 'https://www.google.com/').c === 'search');
check('Bing and DuckDuckGo are search engines', run(SITE, 'https://www.bing.com/').c === 'search' && run(SITE, 'https://duckduckgo.com/').c === 'search');
check('a Facebook post link (fbclid, no ad tag) is social media', run(SITE + '?fbclid=x', '').c === 'social');
check('facebook.com and l.facebook.com are social media', run(SITE, 'https://www.facebook.com/').c === 'social' && run(SITE, 'https://l.facebook.com/').c === 'social');
check('ChatGPT is an AI assistant, by its referring site or its utm_source', run(SITE, 'https://chatgpt.com/').c === 'ai' && run(SITE + '?utm_source=chatgpt.com', '').c === 'ai');
check('Gemini is an AI assistant rather than a search engine', run(SITE, 'https://gemini.google.com/').c === 'ai');
check('another website is other websites', run(SITE, 'https://marketplace.akc.org/').c === 'referral');
check('a typed address or bookmark is direct', run(SITE, '').c === 'direct');

console.log('\n-- a visit keeps its source');
const kept = run(SITE + '?utm_source=fb&utm_medium=paid', 'https://m.facebook.com/').store;
check('the next page of a visit from an ad stays paid', run(SITE + 'breeds.html', SITE, kept).c === 'paid');
const old = { pc_src: JSON.stringify({ c: 'paid', t: Date.now() - 31 * 60000 }) };
check('after 30 minutes with no page, a new page with no referring site is direct', run(SITE + 'breeds.html', SITE, old).c === 'direct');
const was = { pc_src: JSON.stringify({ c: 'paid', t: Date.now() }) };
check('arriving from Google during a visit starts a search visit', run(SITE, 'https://www.google.com/', was).c === 'search');
check('the stored value holds only the source and a time', Object.keys(JSON.parse(kept.pc_src)).sort().join() === 'c,t');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
