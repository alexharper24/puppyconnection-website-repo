// Exercises the scheduled jobs (lib/jobs.js) against the local simulation, through the
// admin's Run now route, which runs the same code as the cron.
//
//   node app/dev/jobs-test.mjs        with pc-portal on 8787 and pc-admin on 8788
//
// It makes a real (non-imported) breeder with three listed puppies, moves their expiry
// dates directly in the database, and checks each job does what lib/jobs.js says.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const PORTAL = 'http://localhost:8787', ADMIN = 'http://localhost:8788';
let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

let cookie = '';
async function req(base, method, p, body, raw) {
  const headers = { origin: base };
  if (base === PORTAL && cookie) headers.cookie = cookie;
  let b;
  if (raw) { headers['content-type'] = raw.type; b = raw.bytes; }
  else if (body instanceof URLSearchParams) { headers['content-type'] = 'application/x-www-form-urlencoded'; b = body; }
  else if (body !== undefined) { headers['content-type'] = 'application/json'; b = JSON.stringify(body); }
  const r = await fetch(base + p, { method, headers, body: b, redirect: 'manual' });
  const set = r.headers.get('set-cookie'); if (set && base === PORTAL) cookie = set.split(';')[0];
  const t = await r.text(); let data; try { data = JSON.parse(t); } catch { data = t; }
  return { status: r.status, data };
}

async function main() {
  // Expiry only runs when listings have an end date, so this run turns it on and puts it back.
  const before = sql("SELECT value FROM settings WHERE key = 'listing_days'")[0]?.value ?? '0';
  sql("UPDATE settings SET value = '60' WHERE key = 'listing_days'");
  try { await body(); } finally { sql(`UPDATE settings SET value = '${before}' WHERE key = 'listing_days'`); }
  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
}

async function body() {
  const email = `jobs-${Date.now().toString(36)}@breeders.test`;
  // Sign-up is rate limited per minute, so after the other suites this may need one wait.
  let started = await req(PORTAL, 'POST', '/auth/start', { email, business_name: 'Jobs Test Kennel' });
  if (started.status === 429) {
    console.log('sign-up rate limited, waiting a minute');
    await new Promise((r) => setTimeout(r, 65000));
    started = await req(PORTAL, 'POST', '/auth/start', { email, business_name: 'Jobs Test Kennel' });
  }
  check('the test breeder can start signing up', started.status === 200, JSON.stringify(started.data));
  const mail = (await req(PORTAL, 'GET', `/dev/mail.json?to=${encodeURIComponent(email)}`)).data;
  await req(PORTAL, 'POST', '/auth/verify', new URLSearchParams({ t: new URL(mail[0].link).searchParams.get('t') }));
  let me = (await req(PORTAL, 'GET', '/api/me')).data;
  await req(PORTAL, 'PUT', '/api/profile', { version: me.profile.version, business_name: 'Jobs Test Kennel', public_phone: '555-0100', city: 'Goshen', state: 'IN', description: 'A test kennel.' });
  await req(PORTAL, 'POST', '/api/profile/submit', { accept_terms: true });
  await req(ADMIN, 'POST', `/api/breeders/${me.id}/approve`, {});
  const litter = (await req(PORTAL, 'POST', '/api/litters', { breed_id: 'breed-havanese', born_on: '2026-09-01', ready_on: '2026-10-27' })).data;
  const jpg = { type: 'image/jpeg', bytes: new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg'))) };
  const ids = [];
  for (const name of ['Soon', 'Gone', 'Cart']) {
    const p = (await req(PORTAL, 'POST', '/api/puppies', { litter_id: litter.id, name, sex: 'female', price: '1500', deposit: '300', includes: [] })).data;
    await req(PORTAL, 'POST', `/api/puppies/${p.id}/photos`, undefined, jpg);
    ids.push(p.id);
  }
  const [soon, gone, cart] = ids;
  for (const id of [soon, gone]) await req(ADMIN, 'POST', `/api/puppies/${id}/comp`, {});
  sql(`UPDATE puppies SET expires_at = '${iso(Date.now() + 2 * 86400000)}' WHERE id = '${soon}'`);
  sql(`UPDATE puppies SET expires_at = '${iso(Date.now() - 3600000)}' WHERE id = '${gone}'`);

  // expiry
  let r = await req(ADMIN, 'POST', '/api/jobs/expiry/run', {});
  check('expiry runs', r.status === 200 && r.data.ok, JSON.stringify(r.data));
  check('a listing two days from its end is warned', r.data.warned >= 1, JSON.stringify(r.data));
  check('a listing past its end is expired', r.data.expired >= 1, JSON.stringify(r.data));
  const [s1] = sql(`SELECT expiry_warned_at FROM puppies WHERE id = '${soon}'`);
  const [g1] = sql(`SELECT publication_state FROM puppies WHERE id = '${gone}'`);
  check('the warned listing is marked warned and stays live', !!s1.expiry_warned_at);
  check('the expired listing is off the site', g1.publication_state === 'expired');
  check('the expired listing is out of the public view', sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${gone}'`)[0].n === 0);
  const box = (await req(PORTAL, 'GET', `/dev/mail.json?to=${encodeURIComponent(email)}`)).data;
  check('the breeder got an ending-soon email naming the puppy', box.some((m) => /ends? soon/.test(m.subject) && /Soon/.test(m.subject + m.body)), JSON.stringify(box.map((m) => m.subject)));
  check('the breeder got an ended email', box.some((m) => /has ended|have ended/.test(m.subject)), JSON.stringify(box.map((m) => m.subject)));
  r = await req(ADMIN, 'POST', '/api/jobs/expiry/run', {});
  const again = (await req(PORTAL, 'GET', `/dev/mail.json?to=${encodeURIComponent(email)}`)).data;
  check('running expiry again sends no second warning', again.filter((m) => /ends? soon/.test(m.subject)).length === 1, JSON.stringify(again.map((m) => m.subject)));

  // reconcile: an abandoned checkout is closed and its hold released
  const co = (await req(PORTAL, 'POST', '/api/checkouts', { puppy_ids: [cart] })).data;
  const coId = sql(`SELECT checkout_id FROM puppy_holds WHERE puppy_id = '${cart}'`)[0]?.checkout_id;
  check('starting a checkout holds the puppy', !!coId, JSON.stringify(co));
  sql(`UPDATE checkouts SET expires_at = '${iso(Date.now() - 60000)}' WHERE id = '${coId}'`);
  r = await req(ADMIN, 'POST', '/api/jobs/reconcile/run', {});
  check('reconcile closes the abandoned checkout', r.data.ok && r.data.closed >= 1, JSON.stringify(r.data));
  check('the checkout is marked expired', sql(`SELECT status FROM checkouts WHERE id = '${coId}'`)[0].status === 'expired');
  check('the puppy is free to pay for again', sql(`SELECT COUNT(*) AS n FROM puppy_holds WHERE puppy_id = '${cart}'`)[0].n === 0);

  // housekeeping and backup
  r = await req(ADMIN, 'POST', '/api/jobs/housekeeping/run', {});
  check('housekeeping runs', r.data.ok, JSON.stringify(r.data));
  r = await req(ADMIN, 'POST', '/api/jobs/backup/run', {});
  check('the backup holds every table', r.data.ok && r.data.rows > 1000 && /^backups\/\d{4}-\d{2}-\d{2}\.json\.gz$/.test(r.data.key), JSON.stringify(r.data));
  check('the backup is not served by the media route', (await fetch(`${PORTAL}/media/${encodeURIComponent(r.data.key)}`)).status === 404);

  const jobs = (await req(ADMIN, 'GET', '/api/jobs')).data;
  check('the admin shows a last run for all four jobs', jobs.length === 4 && jobs.every((j) => j.last_run_at && !j.last_error), JSON.stringify(jobs));
  check('an unknown job is refused', (await req(ADMIN, 'POST', '/api/jobs/nothing/run', {})).status === 404);
  check('Run now refuses a request from another site', (await fetch(`${ADMIN}/api/jobs/expiry/run`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' })).status === 403);

}
main().catch((e) => { console.error(e); process.exit(1); });
