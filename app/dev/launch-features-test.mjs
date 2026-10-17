// The launch additions in docs/launch-workplan.md, against the running local Workers.
//
//   node app/dev/launch-features-test.mjs            every part
//   node app/dev/launch-features-test.mjs details    one part (details, reports, placed, inactivity, approval, counts)
//
// Needs pc-portal on 8787 and pc-admin on 8788 on current code, started from app/.state after
// node app/dev/setup.mjs --reset, with the stand-in Stream (STREAM_MODE=sim in .dev.vars).
// Each part signs up its own breeders, so the parts can run in any order.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from './e2e.mjs';
import { build } from '../build/generate.mjs';
import { fetchData } from '../build/fetch-data.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
export const PORTAL = process.env.PORTAL || 'http://localhost:8787';
export const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));

let fails = 0, passes = 0;
export function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** SQL against the local database both Workers share. */
export function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

async function call(c, method, p, body, extra) {
  for (let i = 0; i < 3; i += 1) {
    const r = await c.req(method, p, body, extra);
    if (r.status !== 429 || !/wait a minute/.test(r.data?.error || '')) return r;
    console.log('      (rate limited, waiting a minute)');
    await sleep(62000);
  }
  throw new Error(`${p} stayed rate limited`);
}

const admin = new Client(ADMIN);

async function breeder(tag, approve = true) {
  const stamp = `${tag}-${Date.now().toString(36)}`;
  const email = `launch-${stamp}@breeders.test`;
  const c = new Client(PORTAL);
  await call(c, 'POST', '/auth/start', { email, business_name: `Launch Kennel ${stamp}` });
  const mail = await c.get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
  const token = new URL(mail.data[0].link).searchParams.get('t');
  await c.req('POST', '/auth/verify', new URLSearchParams({ t: token }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: `Launch Kennel ${stamp}`, public_phone: '555-0103', city: 'Goshen', state: 'IN' });
  await c.post('/api/profile/submit', { accept_terms: true });
  if (approve) await admin.post(`/api/breeders/${me.id}/approve`, {});
  return { c, id: me.id, email, name: `Launch Kennel ${stamp}` };
}

async function pay(c, ids) {
  const co = (await c.post('/api/checkouts', { puppy_ids: ids })).data;
  const sp = new URL(co.url).pathname;
  const r = await c.req('POST', `${sp}/pay`, new URLSearchParams({ webhook: '1' }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  await c.get(new URL(r.location).pathname + new URL(r.location).search);
}

/** A priced puppy with a photo, ready to pay for. */
async function readyPuppy(c, litter, name, extra = {}) {
  const id = (await c.post('/api/puppies', { litter_id: litter, name, price: 1500, sex: 'female', ...extra })).data.id;
  await c.req('POST', `/api/puppies/${id}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } });
  return id;
}

const puppies = async (c) => (await c.get('/api/listings')).data.litters.flatMap((l) => l.puppies);
const pup = async (c, id) => (await puppies(c)).find((p) => p.id === id);

/** The site as the next publish would build it, from the portal's export. */
async function buildSite() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-launch-'));
  await fetchData(`${PORTAL}/data/export.json`, tmp);
  const out = path.join(tmp, 'out');
  build({ dataDir: tmp, out, guides: path.join(APP, 'dev/fixtures/guides') });
  return { dir: tmp, out, page: (f) => (fs.existsSync(path.join(out, f)) ? fs.readFileSync(path.join(out, f), 'utf8') : null), data: (f) => JSON.parse(fs.readFileSync(path.join(tmp, 'data', f), 'utf8')) };
}

// ---------------------------------------------------------------- A3 puppy details and video
async function details() {
  const A = await breeder('details');
  const B = await breeder('other');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const L = (await A.c.get('/api/listings')).data;
  check('A3 the portal offers the registry list from her Wix form', JSON.stringify(L.registries) === JSON.stringify(['AKC', 'AKC Canine Partners', 'APRI', 'ACA', 'CKC', 'UKC']), JSON.stringify(L.registries));
  check('A3 the portal says videos are on, with the limits', L.videos && L.videos.on && L.videos.max === 2 && L.videos.max_seconds === 120, JSON.stringify(L.videos));

  const id = await readyPuppy(A.c, litter, 'Clover');
  let p = await pup(A.c, id);
  check('A3 every new field is optional, so a puppy saves without them', p && p.registry == null && p.deposit_url == null && p.videos.length === 0);
  const fields = {
    registry: 'APRI', markings: 'White blaze on the chest', health_notes: 'Vet checked at 7 weeks.\n\nParents health tested.',
    vaccinations: 'First shots at 6 weeks', deworming: 'At 2, 4, 6 and 8 weeks', disclosures: 'Small umbilical hernia, vet says it will close',
    deposit_url: 'https://example.com/deposit/clover',
  };
  let r = await A.c.put(`/api/puppies/${id}`, { ...p, includes: p.includes, price: 1500, version: p.version, ...fields });
  p = await pup(A.c, id);
  check('A3 a breeder saves each field', r.status === 200 && Object.entries(fields).every(([k, v]) => p[k] === v), JSON.stringify([r.status, r.data]));
  r = await A.c.put(`/api/puppies/${id}`, { ...p, price: 1500, version: p.version, registry: 'Made Up Kennel Club' });
  check('A3 a registry outside the list is refused', r.status === 400 && /Registration is one of/.test(r.data.error), JSON.stringify(r.data));
  r = await A.c.put(`/api/puppies/${id}`, { ...p, price: 1500, version: p.version, deposit_url: 'javascript:alert(1)' });
  check('A3 a deposit link must be a web address', r.status === 400, JSON.stringify(r.data));

  // A registry Amber later takes off the list stays on the puppy that has it.
  await admin.put('/api/settings', { registries: 'AKC, CKC' });
  p = await pup(A.c, id);
  r = await A.c.put(`/api/puppies/${id}`, { ...p, price: 1500, version: p.version, name: 'Clover' });
  check('A3 a registry taken off the list stays valid on the puppy that has it', r.status === 200 && (await pup(A.c, id)).registry === 'APRI', JSON.stringify(r.data));
  check('A3 the admin edits the registry list in Settings', JSON.stringify((await A.c.get('/api/listings')).data.registries) === '["AKC","CKC"]');
  r = await admin.put('/api/settings', { registries: 'AKC, ' });
  check('A3 an empty registry name is refused', r.status === 400);
  await admin.put('/api/settings', { registries: 'AKC, AKC Canine Partners, APRI, ACA, CKC, UKC' });

  // Video through the stand-in Stream: an upload address, the file sent straight to it, a check.
  r = await A.c.post(`/api/puppies/${id}/videos`, {});
  check('A3 the portal hands out a one-time upload address with the limits', r.status === 201 && /\/dev\/stream\/upload\/sim\w+$/.test(r.data.upload_url) && r.data.max_bytes === 200 * 1024 * 1024, JSON.stringify(r.data));
  const v1 = r.data;
  check('A3 another breeder cannot ask for an upload address on this puppy', (await B.c.post(`/api/puppies/${id}/videos`, {})).status === 404);
  let fd = new FormData(); fd.append('file', new Blob([new Uint8Array(4096).fill(7)], { type: 'video/mp4' }), 'clover.mp4');
  let up = await fetch(v1.upload_url, { method: 'POST', body: fd });
  check('A3 the file goes to the upload address', up.status === 200);
  fd = new FormData(); fd.append('file', new Blob([new Uint8Array(16)], { type: 'video/mp4' }), 'again.mp4');
  check('A3 an upload address takes one file only', (await fetch(v1.upload_url, { method: 'POST', body: fd })).status === 404);
  check('A3 another breeder cannot check or remove the video', (await B.c.post(`/api/videos/${v1.id}/check`, {})).status === 404 && (await B.c.req('DELETE', `/api/videos/${v1.id}`)).status === 404);
  r = await A.c.post(`/api/videos/${v1.id}/check`, {});
  p = await pup(A.c, id);
  check('A3 the check marks the video ready and the editor gets its player', r.data.status === 'ready' && p.videos.length === 1 && /\/dev\/stream\/sim\w+\/iframe$/.test(p.videos[0].iframe), JSON.stringify(p.videos));
  const player = await fetch(p.videos[0].iframe);
  check('A3 the stand-in player answers', player.status === 200 && /<video/.test(await player.text()));

  const v2 = (await A.c.post(`/api/puppies/${id}/videos`, {})).data;
  check('A3 a third video is refused at the limit of two', (await A.c.post(`/api/puppies/${id}/videos`, {})).status === 400);
  check('A3 removing a video frees its place', (await A.c.req('DELETE', `/api/videos/${v2.id}`)).status === 200 && (await A.c.post(`/api/puppies/${id}/videos`, {})).status === 201);
  sql(`DELETE FROM puppy_videos WHERE puppy_id = '${id}' AND status = 'uploading'`);

  // The generated page shows each field and the player once the puppy is paid for.
  await pay(A.c, [id]);
  const site = await buildSite();
  const data = site.data('puppies.json').find((x) => x.name === 'Clover' && x.registry === 'APRI');
  check('A3 the export carries the details and the ready video only', data && data.markings === fields.markings && data.health.length === 2 && data.videos.length === 1 && data.deposit_url === fields.deposit_url, JSON.stringify(data).slice(0, 300));
  const html = data && site.page(`puppy-${data.slug}.html`);
  check('A3 the generated puppy page shows registration, markings and the health block', !!html && html.includes('<dt>Registration</dt><dd>APRI</dd>') && html.includes('<dt>Markings</dt><dd>White blaze on the chest</dd>')
    && html.includes('Health and care') && html.includes('<h3>Breeder disclosures</h3>') && html.includes('Parents health tested.'), (html || '').slice(0, 200));
  check('A3 the generated puppy page plays the video and links the deposit page', !!html && html.includes(`<iframe src="${PORTAL}/dev/stream/sim`) && html.includes('href="https://example.com/deposit/clover"'));

  // Admin edits go through the same rules and can remove a video.
  const ab = (await admin.get(`/api/breeders/${A.id}`)).data;
  const ap = ab.litters.flatMap((l) => l.puppies).find((x) => x.id === id);
  check('A3 the admin sees the details, the registry list and the video', ap.registry === 'APRI' && ab.registries.length === 6 && ap.videos.length === 1);
  r = await admin.put(`/api/puppies/${id}`, { version: ap.version, markings: 'Blaze and white socks' });
  check('A3 an operator edits a detail on the breeder\'s behalf', r.status === 200 && (await pup(A.c, id)).markings === 'Blaze and white socks', JSON.stringify(r.data));
  check('A3 an operator removes the video', (await admin.req('DELETE', `/api/videos/${ap.videos[0].id}`)).status === 200 && (await pup(A.c, id)).videos.length === 0);
}


// ---------------------------------------------------------------- A5 report a listing
async function reports() {
  const R = await breeder('reported');
  const litter = (await R.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const id = await readyPuppy(R.c, litter, 'Biscuit');
  const draft = await readyPuppy(R.c, litter, 'Draft Pup');
  await pay(R.c, [id]);
  const slug = (await pup(R.c, id)).slug, draftSlug = (await pup(R.c, draft)).slug;
  const bslug = (await admin.get(`/api/breeders/${R.id}`)).data.breeder.slug;
  const anon = new Client(PORTAL);
  let r = await anon.get(`/report?puppy=${encodeURIComponent(slug)}`);
  check('A5 the report form opens for a public puppy', r.status === 200 && /Report a listing/.test(r.text || r.data) && /name="reason"/.test(r.text || r.data), String(r.text || r.data).slice(0, 120));
  check("A5 a draft's report form answers as not on the site, so it confirms nothing", (await anon.get(`/report?puppy=${encodeURIComponent(draftSlug)}`)).status === 404);
  check('A5 the form opens for a public breeder', (await anon.get(`/report?breeder=${encodeURIComponent(bslug)}`)).status === 200);
  const post = (fields, origin = PORTAL) => fetch(`${PORTAL}/report`, { method: 'POST', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields), redirect: 'manual' });
  const count = () => sql(`SELECT COUNT(*) AS n FROM listing_reports WHERE breeder_id = '${R.id}'`)[0].n;
  check('A5 a post from another site is refused', (await post({ puppy: slug, reason: 'scam', details: 'x' }, 'https://evil.example')).status === 403);
  r = await post({ puppy: slug, details: 'No reason picked' });
  check('A5 a report with no reason is sent back with the details kept', r.status === 400 && /Choose what the problem is/.test(await r.text()));
  check('A5 a bad reply address is refused', (await post({ puppy: slug, reason: 'scam', details: 'x', email: 'not-an-email' })).status === 400);
  r = await post({ puppy: slug, reason: 'scam', details: 'bot', website: 'http://spam.example' });
  check('A5 a filled honeypot gets the thanks and stores nothing', r.status === 200 && count() === 0);
  r = await post({ puppy: slug, reason: 'not_available', details: 'The breeder told me this puppy went home last week.', email: 'family@example.com' });
  check('A5 a report from the site is stored and thanked', r.status === 200 && /your report is in/.test(await r.text()) && count() === 1);
  const mail = (await anon.get(`/dev/mail.json?to=${encodeURIComponent('amber@puppyconnection.test')}`)).data;
  check('A5 the owner is emailed the report with the reason, details and reply address', mail.some((m) => /^Listing reported: Biscuit from Launch Kennel/.test(m.subject) && /went home last week/.test(m.body || '') && /family@example\.com/.test(m.body || '')), JSON.stringify(mail.slice(0, 2)).slice(0, 300));
  const log = sql("SELECT COUNT(*) AS n FROM email_log WHERE template = 'listing_report'")[0].n;
  check('A5 the email is in the email log', log >= 1);

  let list = (await admin.get('/api/listing-reports')).data;
  const rep = list.find((x) => x.breeder_id === R.id);
  check('A5 the report is in the admin list with the puppy, reason and reply address', rep && rep.puppy_name === 'Biscuit' && rep.reason_label === 'The puppy is no longer available' && rep.reporter_email === 'family@example.com');
  check('A5 the admin overview counts open reports', (await admin.get('/api/attention')).data.open_reports >= 1);
  // Suspend from the report, which takes the breeder's listings off the site, then reinstate.
  r = await admin.post(`/api/breeders/${R.id}/suspend`, { reason: 'Listing report, checking with the breeder' });
  check('A5 the admin suspends the breeder after a report', r.status === 200 && (await admin.get(`/api/breeders/${R.id}`)).data.breeder.status === 'suspended');
  check('A5 ... and their puppy leaves the site and the report form', sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${id}'`)[0].n === 0 && (await anon.get(`/report?puppy=${encodeURIComponent(slug)}`)).status === 404);
  r = await admin.post(`/api/breeders/${R.id}/reinstate`, {});
  check('A5 the admin reinstates the breeder and the puppy is back', r.status === 200 && sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${id}'`)[0].n === 1);
  r = await admin.post(`/api/listing-reports/${rep.id}/handled`, { note: 'Breeder marked the puppy placed' });
  check('A5 the report is marked handled with a private note', r.status === 200 && !(await admin.get('/api/listing-reports')).data.some((x) => x.id === rep.id));
  check('A5 a closed report cannot be closed again', (await admin.post(`/api/listing-reports/${rep.id}/dismissed`, {})).status === 400);
  list = (await admin.get('/api/listing-reports?status=closed')).data;
  check('A5 the closed list shows who handled it and the note', list.some((x) => x.id === rep.id && x.status === 'handled' && x.note === 'Breeder marked the puppy placed' && x.closed_by));
  const site = await buildSite();
  const page = site.page(`puppy-${slug}.html`) || '';
  check('A5 puppy and breeder pages link to the report form', page.includes(`/report?puppy=${encodeURIComponent(slug)}`) && (site.page(`breeder-${bslug}.html`) || '').includes(`/report?breeder=${encodeURIComponent(bslug)}`));
}

const PARTS = { details, reports };

async function main() {
  const only = process.argv[2];
  for (const [name, fn] of Object.entries(PARTS)) {
    if (only && only !== name) continue;
    console.log(`\n--- ${name}`);
    await fn();
  }
  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
