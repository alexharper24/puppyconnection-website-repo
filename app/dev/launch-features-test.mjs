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
async function buildSite(opts = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-launch-'));
  await fetchData(`${PORTAL}/data/export.json`, tmp);
  const out = path.join(tmp, 'out');
  build({ dataDir: tmp, out, guides: path.join(APP, 'dev/fixtures/guides'), ...opts });
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

// ---------------------------------------------------------------- A9 photo quality check
async function photos() {
  const P = await breeder('photos');
  const O = await breeder('photos-other');
  const litter = (await P.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const id = (await P.c.post('/api/puppies', { litter_id: litter, name: 'Maple', price: 1500 })).data.id;
  const upload = async () => (await P.c.req('POST', `/api/puppies/${id}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } })).data.id;
  const judge = (c, ph, sim) => c.req('POST', `/api/photos/${ph}/check`, {}, { headers: sim ? { 'x-sim-photo-check': sim } : {} });
  const photo = async (ph) => (await pup(P.c, id)).photos.find((x) => x.id === ph);

  const bad = await upload();
  let p = await pup(P.c, id);
  check('A9 a new photo waits for the check, and counts meanwhile so a slow check never blocks paying', (await photo(bad)).quality === 'pending' && !p.needs.includes('a photo'), JSON.stringify(p.needs));
  check('A9 another breeder cannot run the check on the photo', (await judge(O.c, bad)).status === 404);
  let r = await judge(P.c, bad, 'person,hidden');
  check('A9 by default a failed photo is sent back with what is wrong', r.status === 200 && r.data.quality === 'sent_back' && r.data.route === 'breeder'
    && r.data.messages.length === 2 && /person takes up much of the photo/.test(r.data.messages.join(' ')), JSON.stringify(r.data));
  p = await pup(P.c, id);
  check('A9 the sent-back photo is marked with the reasons and no longer counts', (await photo(bad)).quality === 'sent_back' && (await photo(bad)).messages.length === 2 && /photo/.test(p.pay_block || ''), JSON.stringify([p.pay_block]));
  r = await judge(P.c, bad);
  check('A9 a photo already judged is not judged again', r.data.quality === 'sent_back');
  const good = await upload();
  r = await judge(P.c, good);
  p = await pup(P.c, id);
  check('A9 a photo that passes counts toward the listing', r.data.quality === 'pass' && !p.pay_block, JSON.stringify([r.data, p.pay_block]));
  await pay(P.c, [id]);
  const slug = (await pup(P.c, id)).slug;
  const site = await buildSite();
  const data = site.data('puppies.json').find((x) => x.slug === slug);
  check('A9 only the passed photo reaches the site', data && data.photos.length === 1 && data.photos[0].src === `media/${good}`, JSON.stringify(data && data.photos));
  check('A9 the sent-back photo is not served to the public', (await fetch(`${PORTAL}/media/${bad}`)).status === 404 && (await fetch(`${PORTAL}/media/${good}`)).status === 200);

  // The setting that sends failed photos to Amber's queue instead.
  check('A9 the route setting takes only breeder or review', (await admin.put('/api/settings', { photo_check_route: 'amber' })).status === 400);
  await admin.put('/api/settings', { photo_check_route: 'review' });
  const held = await upload(), sendBack = await upload();
  r = await judge(P.c, held, 'too_small');
  await judge(P.c, sendBack, 'blurry');
  check('A9 with the review setting a failed photo waits for Amber', r.data.quality === 'review' && r.data.route === 'review');
  let q = (await admin.get('/api/photo-review')).data;
  check('A9 the photo review queue lists it with the reason', q.some((x) => x.id === held && /too small/.test(x.messages.join(' '))) && (await admin.get('/api/attention')).data.photo_review >= 2);
  const gen0 = sql('SELECT generation FROM site_state WHERE id = 1')[0].generation;
  r = await admin.post(`/api/photo-review/${held}/keep`, {});
  check('A9 Keep puts the photo on the listing and marks the site to publish', r.status === 200 && (await photo(held)).quality === 'pass' && sql('SELECT generation FROM site_state WHERE id = 1')[0].generation > gen0);
  r = await admin.post(`/api/photo-review/${sendBack}/send_back`, {});
  const mail = (await P.c.get(`/dev/mail.json?to=${encodeURIComponent(P.email)}`)).data;
  check('A9 Send back marks the photo and emails the breeder what is wrong', r.status === 200 && (await photo(sendBack)).quality === 'sent_back'
    && mail.some((m) => /^Please replace a photo of Maple/.test(m.subject) && /blurred/.test(m.body || '')), JSON.stringify(mail.slice(0, 1)).slice(0, 200));
  check('A9 a photo already decided cannot be decided again', (await admin.post(`/api/photo-review/${held}/send_back`, {})).status === 400);
  await admin.put('/api/settings', { photo_check_route: 'breeder' });

  // A photo whose check never ran is picked up by the job every 15 minutes.
  const late = await upload();
  sql(`UPDATE photos SET created_at = '2026-01-01T00:00:00Z' WHERE id = '${late}'`);
  r = await admin.post('/api/jobs/photos/run', {});
  check('A9 the photo job checks a photo left pending', r.status === 200 && (await photo(late)).quality === 'pass', JSON.stringify(r.data));
}

// ---------------------------------------------------------------- A8 adopted puppies out of Google
async function placed() {
  const A = await breeder('placed');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const old = await readyPuppy(A.c, litter, 'Pepper'), recent = await readyPuppy(A.c, litter, 'Ginger'), open = await readyPuppy(A.c, litter, 'Nutmeg');
  await pay(A.c, [old, recent, open]);
  const at = (id) => sql(`SELECT placed_at FROM puppies WHERE id = '${id}'`)[0].placed_at;
  const mark = async (id, availability) => A.c.put(`/api/puppies/${id}/availability`, { availability, version: (await pup(A.c, id)).version });
  const m = await mark(old, 'placed');
  check('A8 marking a puppy adopted answers ok and records when', m.status === 200 && /^\d{4}-\d\d-\d\dT/.test(at(old) || ''), JSON.stringify([m.status, at(old)]));
  await mark(old, 'available');
  check('A8 marking it available again clears the date', at(old) === null);
  await mark(old, 'placed'); await mark(recent, 'placed');
  const ap = (await admin.get(`/api/breeders/${A.id}`)).data.litters.flatMap((l) => l.puppies).find((x) => x.id === open);
  const e = await admin.put(`/api/puppies/${open}`, { version: ap.version, availability: 'placed' });
  check('A8 an operator marking a puppy adopted answers ok and records when', e.status === 200 && !!at(open), JSON.stringify([e.status, e.data]));
  await admin.put(`/api/puppies/${open}`, { version: ap.version + 1, availability: 'pending' });
  check('A8 an operator edit that is not adoption sets no date', at(open) === null);
  sql(`UPDATE puppies SET placed_at = '${new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 19)}Z' WHERE id = '${old}'`);
  sql(`UPDATE puppies SET placed_at = '${new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 19)}Z' WHERE id = '${recent}'`);
  const site = await buildSite({ indexable: true, base: 'https://puppy-connection.com/' });
  const slug = async (id) => (await pup(A.c, id)).slug;
  const map = fs.readFileSync(path.join(site.out, 'sitemap.xml'), 'utf8');
  const oldPage = site.page(`puppy-${await slug(old)}.html`), recentPage = site.page(`puppy-${await slug(recent)}.html`);
  check('A8 a puppy adopted 31 days ago leaves the sitemap', !map.includes(`puppy-${await slug(old)}.html`) && map.includes(`puppy-${await slug(recent)}.html`) && map.includes(`puppy-${await slug(open)}.html`));
  check('A8 ... and its page stays up, marked noindex', !!oldPage && oldPage.includes('<meta name="robots" content="noindex, follow">') && /Adopted/.test(oldPage));
  check('A8 a puppy adopted 5 days ago is still indexed', !!recentPage && !recentPage.includes('noindex'));
  const data = site.data('puppies.json').find((x) => x.name === 'Pepper' && x.unlist_after);
  check('A8 the export carries the adoption date and when the page unlists', data && data.placed_at && Date.parse(data.unlist_after) - Date.parse(data.placed_at) === 30 * 86400000, JSON.stringify(data && [data.placed_at, data.unlist_after]));
  // The daily job marks the site to publish on the day a puppy crosses the window.
  sql(`UPDATE puppies SET placed_at = '${new Date(Date.now() - 30.5 * 86400000).toISOString().slice(0, 19)}Z' WHERE id = '${recent}'`);
  sql('UPDATE site_state SET dirty = 0 WHERE id = 1');
  const r = await admin.post('/api/jobs/housekeeping/run', {});
  check('A8 the daily job marks the site to publish when a puppy crosses 30 days', r.status === 200 && sql('SELECT dirty FROM site_state WHERE id = 1')[0].dirty === 1, JSON.stringify(r.data));
  check('A8 the window is a setting', (await admin.put('/api/settings', { adopted_index_days: '0' })).status === 400 && (await admin.put('/api/settings', { adopted_index_days: '30' })).status === 200);
}

// ---------------------------------------------------------------- A2 the inactivity schedule, on a moved clock
async function inactivity() {
  const A = await breeder('inactive');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const x = await readyPuppy(A.c, litter, 'Rusty'), y = await readyPuppy(A.c, litter, 'Daisy'), z = await readyPuppy(A.c, litter, 'Hazel');
  await pay(A.c, [x, y, z]);
  const ago = (days) => `${new Date(Date.now() - days * 86400000).toISOString().slice(0, 19)}Z`;
  const row = (id) => sql(`SELECT inactive_stage, publication_state, payment_state, last_update_at, inactive_at FROM puppies WHERE id = '${id}'`)[0];
  const isPublic = (id) => sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${id}'`)[0].n === 1;
  const run = async () => (await admin.post('/api/jobs/inactivity/run', {})).data;
  const clock = (id, lastDays, stageDays) => sql(`UPDATE puppies SET last_update_at = '${ago(lastDays)}'${stageDays == null ? '' : `, stage_at = '${ago(stageDays)}'`} WHERE id = '${id}'`);
  const mails = async () => (await A.c.get(`/dev/mail.json?to=${encodeURIComponent(A.email)}`)).data;

  for (const id of [x, y, z]) clock(id, 13);
  await run();
  check('A2 nothing happens before day 14', [x, y, z].every((id) => row(id).inactive_stage === null));
  for (const id of [x, y, z]) clock(id, 15);
  await run();
  check('A2 at week 2 each listing gets its first reminder', [x, y, z].every((id) => row(id).inactive_stage === 'reminded_1'));
  let m = (await mails()).find((e) => /^Are these puppies still available/.test(e.subject));
  check('A2 the reminder is one email with a Still available link per puppy', !!m && (m.body.match(/still-available\?t=/g) || []).length === 3, m && m.body.slice(0, 300));
  const lines = m.body.split('\n');
  const link = lines[lines.indexOf('Daisy') + 1].replace('Still available: ', '');
  const t = new URL(link).searchParams.get('t');
  const get = await fetch(`${PORTAL}/still-available?t=${t}`);
  check('A2 opening the link changes nothing, because mail scanners open links', get.status === 200 && row(y).inactive_stage === 'reminded_1');
  const post = (tok) => fetch(`${PORTAL}/still-available`, { method: 'POST', headers: { origin: PORTAL, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ t: tok }) });
  let r = await post(t);
  check('A2 one click on Still available keeps that puppy listed and restarts its clock', r.status === 200 && row(y).inactive_stage === null && Date.parse(row(y).last_update_at) > Date.now() - 600000, JSON.stringify(row(y)));
  check('A2 the link works once', (await post(t)).status === 410);
  // A price change counts as an update too.
  const pz = await pup(A.c, z);
  await A.c.put(`/api/puppies/${z}`, { ...pz, price: 1600, version: pz.version });
  check('A2 a price change clears the reminder', row(z).inactive_stage === null);
  clock(z, 15); await run();
  // x has had a week since its first reminder, z only a day.
  clock(x, 22, 8); clock(z, 22, 1);
  await run();
  check('A2 at week 3 the second reminder goes, and a listing never skips a step', row(x).inactive_stage === 'reminded_2' && row(z).inactive_stage === 'reminded_1', JSON.stringify([row(x), row(z)]));
  m = (await mails()).find((e) => /^Last reminder/.test(e.subject));
  check('A2 the second reminder says it is the last', !!m && /comes off the site/.test(m.body));
  await run();
  check('A2 a second run the same week moves nothing', row(x).inactive_stage === 'reminded_2');
  clock(x, 29, 8);
  await run();
  check('A2 at week 4 the listing goes offline', row(x).inactive_stage === 'offline' && row(x).publication_state === 'expired' && !isPublic(x));
  check('A2 the breeder is told it can come back free', (await mails()).some((e) => /off Puppy Connection for now/.test(e.subject) && /free until/.test(e.body)));
  let site = await buildSite();
  const slugX = (await pup(A.c, x)).slug;
  const redir = fs.readFileSync(path.join(site.out, '_redirects'), 'utf8');
  check("A2 an offline puppy's page forwards to its breed page", redir.includes(`/puppy-${slugX}.html /breed-havanese.html 301`) && !site.page(`puppy-${slugX}.html`), redir.split('\n').filter((l) => l.includes(slugX)).join(' | '));
  clock(x, 43, 15);
  await run();
  check('A2 at week 6 it is removed from the directory and its record is kept', row(x).inactive_stage === 'removed' && !!(await pup(A.c, x)));
  check('A2 the breeder is told it was removed', (await mails()).some((e) => /removed from the directory/.test(e.subject)));
  site = await buildSite();
  check("A2 a removed puppy's page still forwards to its breed page", fs.readFileSync(path.join(site.out, '_redirects'), 'utf8').includes(`/puppy-${slugX}.html /breed-havanese.html 301`));
  const px = await pup(A.c, x);
  check('A2 the portal offers to bring it back free', px.reactivation && px.reactivation.free === true);
  r = await A.c.post(`/api/puppies/${x}/reactivate`, {});
  check('A2 bringing it back within six weeks is free and puts it straight back', r.status === 200 && r.data.relisted === true && isPublic(x) && row(x).inactive_stage === null, JSON.stringify(r.data));
  // A listing offline longer than the window comes back as a draft to pay for again.
  sql(`UPDATE puppies SET inactive_stage = 'reminded_2' WHERE id = '${z}'`); clock(z, 29, 8);
  await run();
  sql(`UPDATE puppies SET inactive_at = '${ago(43)}' WHERE id = '${z}'`);
  r = await A.c.post(`/api/puppies/${z}/reactivate`, {});
  check('A2 after the free window it comes back as a draft to pay for again', r.status === 200 && r.data.relisted === false && row(z).publication_state === 'draft' && row(z).payment_state === 'unpaid', JSON.stringify([r.data, row(z)]));
  check('A2 bringing back a listing that is not offline is refused', (await A.c.post(`/api/puppies/${y}/reactivate`, {})).status === 400);

  // Imported Wix listings wait until their breeder signs in.
  sql(`UPDATE breeders SET legacy = 1, first_signin_at = NULL WHERE id = '${A.id}'`);
  clock(y, 20);
  await run();
  check('A2 an imported breeder who has never signed in is left out', row(y).inactive_stage === null);
  const again = new Client(PORTAL);
  await call(again, 'POST', '/auth/start', { email: A.email });
  const tok = new URL((await again.get(`/dev/mail.json?to=${encodeURIComponent(A.email)}`)).data[0].link).searchParams.get('t');
  await again.req('POST', '/auth/verify', new URLSearchParams({ t: tok }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const first = sql(`SELECT first_signin_at FROM breeders WHERE id = '${A.id}'`)[0].first_signin_at;
  await run();
  check('A2 signing in starts their clock, so an old listing is not reminded at once', !!first && row(y).inactive_stage === null, String(first));
  sql(`UPDATE breeders SET legacy = 0 WHERE id = '${A.id}'`);
  check('A2 the schedule days are a setting and must rise', (await admin.put('/api/settings', { inactivity_days: '14,21,20,42' })).status === 400 && (await admin.put('/api/settings', { inactivity_days: '14,21,28,42' })).status === 200);
}

// ---------------------------------------------------------------- A1 listing review: breeders once, listings never
async function approval() {
  const A = await breeder('approval');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const id = await readyPuppy(A.c, litter, 'Juniper');
  const queue0 = (await admin.get('/api/stats')).data.queue;
  await pay(A.c, [id]);
  check("A1 an approved breeder's paid puppy is public straight away, with no approval step", sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${id}'`)[0].n === 1);
  check('A1 ... and nothing joins the approvals queue', (await admin.get('/api/stats')).data.queue === queue0);
  const portal = fs.readFileSync(path.join(APP, 'portal/public/portal.js'), 'utf8') + fs.readFileSync(path.join(APP, 'portal/legal.js'), 'utf8');
  const adminJs = fs.readFileSync(path.join(APP, 'admin/public/admin.js'), 'utf8');
  check('A1 no breeder-facing or admin wording says a listing waits for approval', !/approv\w* (each |every |the |a )?(listing|puppy|puppies|litter)/i.test(portal + adminJs) && !/(listing|puppy|litter)s? (is |are )?(waiting for|awaiting|pending) (approval|review)/i.test(portal + adminJs));
}

// ---------------------------------------------------------------- A4 more reports
async function counts() {
  const A = await breeder('reports');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const id = await readyPuppy(A.c, litter, 'Pending Pup');
  await pay(A.c, [id]);
  await A.c.put(`/api/puppies/${id}/availability`, { availability: 'pending', version: (await pup(A.c, id)).version });
  // The beacon runs on the site Worker. It is driven here on Node against the same local database.
  const { recordBeacon } = await import('../lib/stats.js');
  const { d1, localD1File } = await import('./node-env.mjs');
  const env = { DB: d1(localD1File()) };
  const beacon = (body, origin = 'https://site.test') => recordBeacon(new Request('https://site.test/api/beacon', { method: 'POST', headers: { origin, 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0', 'content-type': 'text/plain' }, body: JSON.stringify(body) }), env);
  const before = sql("SELECT COALESCE(SUM(searches), 0) AS n FROM breed_searches WHERE breed_id = 'breed-havanese'")[0].n;
  let r = await beacon({ k: 'search', s: 'havanese' });
  check('A4 a breed search from the browse page is counted per breed per day', r.why === 'counted' && sql("SELECT COALESCE(SUM(searches), 0) AS n FROM breed_searches WHERE breed_id = 'breed-havanese'")[0].n === before + 1);
  check('A4 an unknown breed is not counted', (await beacon({ k: 'search', s: 'not-a-breed' })).why === 'unknown');
  check('A4 a search from another site is not counted', (await beacon({ k: 'search', s: 'havanese' }, 'https://evil.example')).why === 'origin');
  const cols = sql("SELECT name FROM pragma_table_info('breed_searches')").map((c) => c.name).sort().join();
  check('A4 the count keeps nothing about the visitor', cols === 'breed_id,day,searches', cols);
  env.DB.close && env.DB.close();

  const d = (await admin.get('/api/reports')).data;
  check('A4 the reports screen counts pending, inactive and new breeders', d.summary.pending >= 1 && typeof d.summary.reminded === 'number' && typeof d.summary.offline === 'number' && d.summary.new_breeders_30 >= 1, JSON.stringify(d.summary));
  check('A4 breed searches show by breed for the last 30 days', d.searches.some((x) => x.breed === 'Havanese' && x.searches >= 1), JSON.stringify(d.searches.slice(0, 3)));
  check('A4 new breeders show by month', d.new_breeders.length >= 1 && d.new_breeders[0].signed_up >= 1);
  check('A4 sales breeders reported are their own table, apart from paid listings', Array.isArray(d.sales) && Array.isArray(d.months), JSON.stringify(d.sales.slice(0, 2)));
  for (const name of ['searches', 'new_breeders', 'sales', 'summary']) {
    const csv = await admin.get(`/api/reports/${name}.csv`);
    check(`A4 the ${name} table downloads as a CSV`, csv.status === 200 && typeof csv.data === 'string' && csv.data.trim().split(/\r?\n/).length >= 2, String(csv.status));
  }
  const site = await buildSite();
  const browse = site.page('puppies.html') || '';
  check('A4 the browse page loads the search counter', /<script src="js\/search-count\.js\?v=\w+"><\/script>/.test(browse) && fs.existsSync(path.join(site.out, 'js/search-count.js')));
}

// ---------------------------------------------------------------- A11 Visit site in the portal and the admin
async function visit() {
  const site = fs.readFileSync(path.join(APP, 'portal/wrangler.jsonc'), 'utf8').match(/"SITE_ORIGIN":\s*"([^"]+)"/)[1].replace(/\/+$/, '');
  const cfg = (await new Client(PORTAL).get('/api/config')).data;
  check('A11 the portal takes the site address from SITE_ORIGIN in config', cfg.site_origin === site, JSON.stringify([cfg.site_origin, site]));
  const who = (await admin.get('/api/whoami')).data;
  check('A11 the admin takes it from its own SITE_ORIGIN', /^https?:\/\//.test(who.site || ''), String(who.site));
  const page = await (await fetch(`${PORTAL}/privacy`)).text();
  check('A11 a signed-out server page links to the site at the top right, in the same tab', page.includes(`<a class="plain-site" href="${site}/">Visit site</a>`) && !/plain-site[^>]*target=/.test(page));
  const portalJs = fs.readFileSync(path.join(APP, 'portal/public/portal.js'), 'utf8'), adminJs = fs.readFileSync(path.join(APP, 'admin/public/admin.js'), 'utf8');
  check('A11 the sign-in page and both top bars carry the link, with no address written into the code',
    (portalJs.match(/>Visit site<\/a>/g) || []).length === 2 && (adminJs.match(/>Visit site<\/a>/g) || []).length === 1 && !/puppy-connection\.com|workers\.dev/.test(portalJs + adminJs));
}

// ---------------------------------------------------------------- A10 Wix form labels out of descriptions
async function wixtext() {
  const { wixResidue, hasWixResidue, cleanListing } = await import('../lib/wixtext.js');
  const dixon = wixResidue("Mom's information weight: 8 pounds color: Dad's information weight: 6 pounds color: Puppy's color - black with white markings Introducing a beautiful litter of Poodle puppies.");
  check('A10 empty labels are dropped and the prose is kept exactly', dixon.prose === 'Introducing a beautiful litter of Poodle puppies.' && dixon.mom.weight === 8 && dixon.dad.weight === 6 && !dixon.mom.color && !dixon.dad.color && dixon.puppyColor === 'black with white markings', JSON.stringify(dixon));
  const mia = wixResidue("Dad's information:Weight: 25 pounds Color: Blue tri Mom's information:Weight: 20 poundsColor: Fawn Puppy's color - Merle Bella is an unforgettable little doll!");
  check('A10 labels in the other order and run together still parse', mia.dad.weight === 25 && mia.dad.color === 'Blue tri' && mia.mom.weight === 20 && mia.mom.color === 'Fawn' && mia.puppyColor === 'Merle' && mia.prose === 'Bella is an unforgettable little doll!', JSON.stringify(mia));
  check('A10 ordinary prose that mentions information is left alone', !hasWixResidue('Feel free to call or text for more information about this puppy.') && wixResidue('Call us for more information.') === null);
  const l = cleanListing({ description: "Mom's information weight: 24 pounds color: red and white Dad's information weight: 14 pounds color: red Puppy's color - red and white This is a stunning litter.", mom_weight: null });
  check('A10 the seed and the import clean a listing before writing it', l.description === 'This is a stunning litter.' && l.mom_weight === '24 lbs' && l.form_color === 'red and white' && l.parent_colors === "Mom's color: red and white. Dad's color: red.", JSON.stringify(l));
  // The migration, against the local database, which holds the same seed listings as staging.
  const file = fs.readdirSync(path.join(APP, 'migrations')).find((f) => /_wix_descriptions\.sql$/.test(f));
  execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc'), '--file', path.join(APP, 'migrations', file)], { cwd: APP, stdio: 'ignore' });
  const left = sql('SELECT id, description FROM puppies WHERE description IS NOT NULL').filter((r) => hasWixResidue(r.description));
  check('A10 no description starts with the Wix label run', left.length === 0, left.map((r) => r.id).join(', '));
  const d = sql("SELECT p.description, p.color, l.mom_weight_lb, l.dad_weight_lb FROM puppies p JOIN litters l ON l.id = p.litter_id WHERE p.id = 'seed-p-0086'")[0];
  check("A10 Dixon keeps the breeder's prose, with the color and the parents' weights in their fields", d && /^Introducing a beautiful litter of Poodle puppies/.test(d.description) && d.color === 'black with white markings' && d.mom_weight_lb === 8 && d.dad_weight_lb === 6, JSON.stringify(d));
}

const PARTS = { details, reports, photos, placed, inactivity, approval, counts, visit, wixtext };

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
