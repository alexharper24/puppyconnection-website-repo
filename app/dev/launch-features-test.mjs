// The launch additions in docs/launch-workplan.md, against the running local Workers.
//
//   node app/dev/launch-features-test.mjs            every part
//   node app/dev/launch-features-test.mjs details    one part (details, reports, photos, placed, inactivity, reference, photohold, approval, counts, visit, wixtext, notices)
//   NOTICE_PORTAL=http://localhost:8781 ...           also checks B9 against a second portal started with --var NOTICE_TO:info@puppy-connection.com
//
// Needs pc-portal on 8787 and pc-admin on 8788 on current code, started from app/.state after
// node app/dev/setup.mjs --reset, with the stand-in Stream (STREAM_MODE=sim in .dev.vars).
// Each part signs up its own breeders, so the parts can run in any order.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client, mailLink, usePasswordLink, signIn } from './e2e.mjs';
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
  await call(c, 'POST', '/auth/signup', { email, business_name: `Launch Kennel ${stamp}` });
  await usePasswordLink(c, await mailLink(email));
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: `Launch Kennel ${stamp}`, public_phone: '555-0103', city: 'Goshen', state: 'IN' });
  await c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
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

// ---------------------------------------------------------------- A12 the photo-based schedule, on a moved clock
async function inactivity() {
  const A = await breeder('inactive');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const x = await readyPuppy(A.c, litter, 'Rusty'), y = await readyPuppy(A.c, litter, 'Daisy'), z = await readyPuppy(A.c, litter, 'Hazel');
  await pay(A.c, [x, y, z]);
  const ago = (days) => `${new Date(Date.now() - days * 86400000).toISOString().slice(0, 19)}Z`;
  const row = (id) => sql(`SELECT inactive_stage, publication_state, payment_state, last_photo_at, inactive_at FROM puppies WHERE id = '${id}'`)[0];
  const isPublic = (id) => sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${id}'`)[0].n === 1;
  const run = async () => (await admin.post('/api/jobs/inactivity/run', {})).data;
  const clock = (id, photoDays, stageDays) => sql(`UPDATE puppies SET last_photo_at = '${ago(photoDays)}'${stageDays == null ? '' : `, stage_at = '${ago(stageDays)}'`} WHERE id = '${id}'`);
  const mails = async () => (await A.c.get(`/dev/mail.json?to=${encodeURIComponent(A.email)}`)).data;
  const recent = (id) => Date.parse(row(id).last_photo_at) > Date.now() - 600000;
  // A new photo through the portal and the stand-in check. sim names reasons for a photo that fails.
  const photo = async (id, sim) => {
    const ph = (await A.c.req('POST', `/api/puppies/${id}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } })).data.id;
    return (await A.c.req('POST', `/api/photos/${ph}/check`, {}, { headers: sim ? { 'x-sim-photo-check': sim } : {} })).data;
  };

  check('A12 paying for a listing starts its photo clock', [x, y, z].every(recent), JSON.stringify(row(x)));
  // The clock waits for the go-live date (migrations/0033). With it two weeks ahead, a listing whose
  // photo is five weeks old is not emailed, and the portal counts from the go-live date.
  const golive = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  check('A12 the go-live date is a setting that takes a date or nothing', (await admin.put('/api/settings', { photo_clock_start: '1 November' })).status === 400
    && (await admin.put('/api/settings', { photo_clock_start: golive })).status === 200);
  clock(x, 36);
  await run();
  check('A12 no listing is emailed before the go-live date', row(x).inactive_stage === null);
  sql(`UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '${ago(1)}' WHERE id = '${x}'`);
  const held = await pup(A.c, x);
  check('A12 the portal counts six weeks from the go-live date, not the old photo', held.schedule && held.schedule.by.slice(0, 10) === new Date(Date.parse(`${golive}T00:00:00Z`) + 42 * 86400000).toISOString().slice(0, 10), JSON.stringify(held.schedule));
  sql(`UPDATE puppies SET inactive_stage = NULL, stage_at = NULL WHERE id = '${x}'`);
  await admin.put('/api/settings', { photo_clock_start: '' });
  for (const id of [x, y, z]) clock(id, 27);
  await run();
  check('A12 nothing happens before four weeks', [x, y, z].every((id) => row(id).inactive_stage === null));
  // Only a new photo counts. A price change or a status change no longer restarts the clock.
  const pz = await pup(A.c, z);
  await A.c.put(`/api/puppies/${z}`, { ...pz, price: 1600, version: pz.version });
  await A.c.put(`/api/puppies/${z}/availability`, { availability: 'pending', version: (await pup(A.c, z)).version });
  await A.c.put(`/api/puppies/${z}/availability`, { availability: 'available', version: (await pup(A.c, z)).version });
  check('A12 a price or status change does not restart the clock', !recent(z), JSON.stringify(row(z)));
  for (const id of [x, y, z]) clock(id, 29);
  await run();
  check('A12 at four weeks with no new photo each listing gets its first email', [x, y, z].every((id) => row(id).inactive_stage === 'reminded_1'));
  let m = (await mails()).find((e) => /^Add new photos to keep your listings up/.test(e.subject));
  check('A12 the email is one per breeder, with a link to each puppy\'s photo step', !!m && (m.body.match(/#\/litters\?photos=/g) || []).length === 3 && m.body.includes(`#/litters?photos=${x}`), m && m.body.slice(0, 300));
  check('A12 it says the listings go offline in two weeks and why a current photo helps', !!m && /offline in two weeks, on \w+ \d{1,2}, \d{4}/.test(m.body) && /families/.test(m.body) && !/still-available/.test(m.body), m && m.body);
  let px = await pup(A.c, x);
  check('A12 the portal says by when the listing needs a photo', px.schedule && px.schedule.stage === 'warned' && Date.parse(px.schedule.by) - Date.parse(row(x).last_photo_at) >= 42 * 86400000 - 1000, JSON.stringify(px.schedule));
  // The old Still available link opens a page that points to the portal and changes nothing.
  const old = await fetch(`${PORTAL}/still-available?t=${'a'.repeat(40)}`);
  check('A12 an old Still available link explains the new rule and changes nothing', old.status === 200 && /new photo/.test(await old.text()) && row(x).inactive_stage === 'reminded_1');
  check('A12 the one-click keep-listed routes are gone', (await A.c.post(`/api/puppies/${x}/still-available`, {})).status === 404 && (await A.c.post(`/api/puppies/${x}/reactivate`, {})).status === 404
    && (await fetch(`${PORTAL}/still-available`, { method: 'POST', headers: { origin: PORTAL } })).status === 404);
  // A photo the check sends back keeps nothing. A photo that passes restarts the clock.
  let r = await photo(y, 'blurry');
  check('A12 a photo the check sends back does not count', r.quality === 'sent_back' && row(y).inactive_stage === 'reminded_1' && !recent(y), JSON.stringify([r, row(y)]));
  r = await photo(y);
  check('A12 a new photo that passes clears the warning and restarts the clock', r.quality === 'pass' && row(y).inactive_stage === null && recent(y), JSON.stringify(row(y)));
  // x has had a week since its first email, z only a day.
  clock(x, 36, 8); clock(z, 36, 1);
  await run();
  check('A12 at five weeks the last email goes, and a listing never skips a step', row(x).inactive_stage === 'reminded_2' && row(z).inactive_stage === 'reminded_1', JSON.stringify([row(x), row(z)]));
  m = (await mails()).find((e) => /goes offline next week without a new photo$/.test(e.subject));
  check('A12 the last email says it goes offline next week', !!m && /^Rusty/.test(m.subject) && /offline next week, on/.test(m.body) && m.body.includes(`#/litters?photos=${x}`), m && m.subject);
  await run();
  check('A12 a second run the same week moves nothing', row(x).inactive_stage === 'reminded_2');
  // Changing the listing does not save it. Only a photo does.
  px = await pup(A.c, x);
  await A.c.put(`/api/puppies/${x}`, { ...px, price: 1700, version: px.version });
  clock(x, 43, 8);
  await run();
  check('A12 at six weeks it goes offline, even after an edit', row(x).inactive_stage === 'offline' && row(x).publication_state === 'expired' && !isPublic(x), JSON.stringify(row(x)));
  m = (await mails()).find((e) => /^Rusty is off Puppy Connection until a new photo is added/.test(e.subject));
  check('A12 the breeder is told a new photo brings it back free, and until when', !!m && /straight back on the site, free, until \w+ \d{1,2}, \d{4}/.test(m.body) && m.body.includes(`#/litters?photos=${x}`), m && m.body);
  px = await pup(A.c, x);
  check('A12 an offline listing cannot be paid for, because a photo brings it back free', /new photo/.test(px.pay_block || '') && px.schedule.stage === 'offline'
    && (await A.c.post('/api/checkouts', { puppy_ids: [x] })).status === 400, JSON.stringify([px.pay_block, px.schedule]));
  let site = await buildSite();
  const slugX = (await pup(A.c, x)).slug;
  check("A12 an offline puppy's page forwards to its breed page", fs.readFileSync(path.join(site.out, '_redirects'), 'utf8').includes(`/puppy-${slugX}.html /breed-havanese.html 301`) && !site.page(`puppy-${slugX}.html`));
  r = await photo(x);
  check('A12 a new photo before week 12 puts it straight back on the site, free', r.quality === 'pass' && isPublic(x) && row(x).inactive_stage === null && row(x).payment_state === 'paid' && recent(x), JSON.stringify(row(x)));

  // Week 12. z goes offline, then six more weeks pass with nothing.
  sql(`UPDATE puppies SET inactive_stage = 'reminded_2' WHERE id = '${z}'`); clock(z, 43, 8);
  await run();
  clock(z, 85, 41);
  await run();
  check('A12 offline listings wait their six weeks before removal', row(z).inactive_stage === 'offline');
  clock(z, 85, 43);
  await run();
  check('A12 at twelve weeks it is removed and the record stays in the dashboard', row(z).inactive_stage === 'removed' && !isPublic(z) && !!(await pup(A.c, z)), JSON.stringify(row(z)));
  m = (await mails()).find((e) => /^Hazel has been removed from Puppy Connection/.test(e.subject));
  check('A12 the breeder is told they can relist it for the fee without entering it again', !!m && /press Relist/.test(m.body) && /\$\d+\.\d\d/.test(m.body) && /without entering it again/.test(m.body), m && m.body);
  site = await buildSite();
  const slugZ = (await pup(A.c, z)).slug;
  check("A12 a removed puppy's page still forwards to its breed page", fs.readFileSync(path.join(site.out, '_redirects'), 'utf8').includes(`/puppy-${slugZ}.html /breed-havanese.html 301`));
  r = await photo(z);
  check('A12 a new photo alone does not relist a removed listing', r.quality === 'pass' && row(z).inactive_stage === 'removed' && !isPublic(z));
  const pzz = await pup(A.c, z);
  check('A12 the dashboard offers to relist it through the checkout', pzz.schedule.stage === 'removed' && !pzz.pay_block, JSON.stringify([pzz.schedule, pzz.pay_block]));
  sql(`UPDATE puppies SET last_photo_at = '${ago(90)}' WHERE id = '${z}'`);
  await pay(A.c, [z]);
  check('A12 paying relists it with every detail kept and a fresh clock', isPublic(z) && row(z).inactive_stage === null && recent(z) && (await pup(A.c, z)).price_cents === 160000, JSON.stringify([row(z), (await pup(A.c, z)).price_cents]));

  // Imported Wix listings wait until their breeder signs in.
  sql(`UPDATE breeders SET legacy = 1, first_signin_at = NULL WHERE id = '${A.id}'`);
  clock(y, 30);
  await run();
  check('A12 an imported breeder who has never signed in is left out', row(y).inactive_stage === null);
  await signIn(A.email);
  const first = sql(`SELECT first_signin_at FROM breeders WHERE id = '${A.id}'`)[0].first_signin_at;
  await run();
  check('A12 signing in starts their clock, so an old listing is not emailed at once', !!first && row(y).inactive_stage === null, String(first));
  sql(`UPDATE breeders SET legacy = 0 WHERE id = '${A.id}'`);
  check('A12 the weeks are a setting and must rise', (await admin.put('/api/settings', { inactivity_days: '28,35,30,84' })).status === 400 && (await admin.put('/api/settings', { inactivity_days: '28,35,42,84' })).status === 200);
  await admin.put('/api/settings', { photo_clock_start: '2026-11-01' });
  check('A12 the separate free window setting is gone', !sql("SELECT key FROM settings WHERE key = 'reactivate_days'").length && (await admin.put('/api/settings', { reactivate_days: '42' })).status === 400);
  const portalJs = fs.readFileSync(path.join(APP, 'portal/public/portal.js'), 'utf8');
  check('A12 the portal banner lists every listing that needs a photo, with an Add a photo button', /function photoBanner\(\)/.test(portalJs) && /photoBanner\(\) \+ inner/.test(portalJs) && /data-photos=/.test(portalJs) && !/Still available/.test(portalJs));
}

// ---------------------------------------------------------------- A13 breeder approval by reference
async function reference() {
  const stamp = `ref-${Date.now().toString(36)}`;
  const email = `launch-${stamp}@breeders.test`;
  const c = new Client(PORTAL);
  await call(c, 'POST', '/auth/signup', { email, business_name: `Launch Kennel ${stamp}` });
  await usePasswordLink(c, await mailLink(email));
  let me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: `Launch Kennel ${stamp}`, public_phone: '555-0103', city: 'Goshen', state: 'IN' });
  const submit = (reference) => c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, ...(reference ? { reference } : {}) });
  let r = await submit();
  check('A13 sign-up cannot be submitted without a reference', r.status === 400 && /reference/i.test(r.data.error) && !(await c.get('/api/me')).data.profile_submitted_at, JSON.stringify(r.data));
  r = await submit({ name: 'Pat Example', role: 'mayor', contact: 'pat@example.com' });
  check('A13 the role must be one of the four on the list', r.status === 400);
  r = await submit({ name: 'Pat Example', role: 'akc', contact: 'call me' });
  check('A13 the contact must be a phone number or an email', r.status === 400 && /phone number or an email/.test(r.data.error));
  check('A13 sign-up offers the four kinds of reference', Object.keys(me.reference_roles || {}).join() === 'akc,welfare,breeder,vet' && /ICAW/.test(me.reference_roles.welfare), JSON.stringify(me.reference_roles));
  r = await submit({ name: 'Stacy Example', role: 'akc', contact: 'stacy@akc.example' });
  me = r.data;
  check('A13 with a reference the sign-up is submitted', r.status === 200 && !!me.profile_submitted_at && me.reference && me.reference.name === 'Stacy Example', JSON.stringify(r.data).slice(0, 200));
  r = await c.post('/api/profile/reference', { name: 'Stacy Example', role: 'akc', contact: '(317) 555-0123' });
  check('A13 a breeder waiting for approval can correct the reference', r.status === 200 && r.data.reference.contact === '(317) 555-0123');
  const d = (await admin.get(`/api/breeders/${me.id}`)).data;
  check('A13 the admin sees the reference with the approval', d.reference && d.reference.name === 'Stacy Example' && d.reference.role_label === 'AKC representative' && d.reference.contact === '(317) 555-0123', JSON.stringify(d.reference));
  check('A13 ... beside Approve on the approval screen', /referenceCard\(data\.reference\) : ''\) \+\s*'<div id="decide">/.test(fs.readFileSync(path.join(APP, 'admin/public/admin.js'), 'utf8')));
  const exp = await (await fetch(`${PORTAL}/data/export.json`)).text();
  check('A13 the reference is never public', !exp.includes('Stacy Example') && !exp.includes('555-0123'));
  await admin.post(`/api/breeders/${me.id}/approve`, {});
  me = (await c.get('/api/me')).data;
  check('A13 approval stays once per breeder, and an approved breeder is not asked again', me.status === 'approved' && me.reference === null && (await c.post('/api/profile/reference', { name: 'X Y', role: 'vet', contact: 'x@y.example' })).status === 403);
  // A breeder who submitted before references were asked for is not locked out.
  const B = await breeder('ref-before', false);
  sql(`DELETE FROM breeder_references WHERE breeder_id = '${B.id}'`);
  const bd = (await admin.get(`/api/breeders/${B.id}`)).data;
  r = await admin.post(`/api/breeders/${B.id}/approve`, {});
  check('A13 a breeder who submitted before references shows none and can still be approved', bd.reference === null && r.status === 200 && (await B.c.get('/api/me')).data.status === 'approved', JSON.stringify([bd.reference, r.status]));
  check('A13 approved and imported breeders keep their standing with no reference', sql("SELECT COUNT(*) AS n FROM breeders WHERE status = 'approved' AND id LIKE 'seed-%'")[0].n > 0
    && sql("SELECT COUNT(*) AS n FROM breeders b WHERE b.status = 'approved' AND b.id LIKE 'seed-%' AND EXISTS (SELECT 1 FROM breeder_references r WHERE r.breeder_id = b.id)")[0].n === 0);
}

// ---------------------------------------------------------------- A14 the photo standard and take offline until new photos
async function photohold() {
  const A = await breeder('photohold');
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const id = await readyPuppy(A.c, litter, 'Biscuit');
  await pay(A.c, [id]);
  const row = () => sql(`SELECT operator_hold, hold_kind, hold_reason, hold_at FROM puppies WHERE id = '${id}'`)[0];
  const isPublic = () => sql(`SELECT COUNT(*) AS n FROM public_puppies WHERE id = '${id}'`)[0].n === 1;
  const photo = async (sim) => {
    const ph = (await A.c.req('POST', `/api/puppies/${id}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } })).data.id;
    return { id: ph, ...(await A.c.req('POST', `/api/photos/${ph}/check`, {}, { headers: sim ? { 'x-sim-photo-check': sim } : {} })).data };
  };
  check('A14 the listing starts on the site', isPublic());
  let r = await admin.post(`/api/puppies/${id}/hold`, { on: true, kind: 'photos', reason: '  ' });
  check('A14 taking a listing offline for photos needs a reason', r.status === 400 && isPublic());
  // A photo uploaded before the hold and still waiting for its check must not lift it.
  const early = (await A.c.req('POST', `/api/puppies/${id}/photos`, JPG, { headers: { 'content-type': 'image/jpeg' } })).data.id;
  sql(`UPDATE photos SET created_at = '2026-01-01T00:00:00Z' WHERE id = '${early}'`);
  r = await admin.post(`/api/puppies/${id}/hold`, { on: true, kind: 'photos', reason: 'The photos are blurry. Please upload clear photos of Biscuit.' });
  check('A14 the admin takes the listing offline until new photos', r.status === 200 && row().operator_hold === 1 && row().hold_kind === 'photos' && !isPublic(), JSON.stringify(row()));
  const p = await pup(A.c, id);
  check('A14 the breeder sees why in the portal', p.operator_hold === 1 && p.hold_kind === 'photos' && p.hold_reason === 'The photos are blurry. Please upload clear photos of Biscuit.' && /Paused|photo/.test(p.pay_block || ''), JSON.stringify([p.hold_reason, p.pay_block]));
  await sleep(300);
  const m = (await A.c.get(`/dev/mail.json?to=${encodeURIComponent(A.email)}`)).data.find((e) => /^Biscuit is off Puppy Connection until new photos are added/.test(e.subject));
  check('A14 the breeder is emailed the reason, the standard and a link to the photos', !!m && /blurry/.test(m.body) && /no signs of illness or distress/.test(m.body) && m.body.includes(`#/litters?photos=${id}`), m && m.body);
  const held = (await admin.get('/api/listings?filter=held')).data.find((x) => x.id === id);
  check('A14 the admin listings show it as offline for photos with the reason', held && held.hold_kind === 'photos' && /blurry/.test(held.hold_reason));
  await admin.post('/api/jobs/photos/run', {});
  check('A14 a photo from before the hold does not lift it', row().operator_hold === 1 && sql(`SELECT quality FROM photos WHERE id = '${early}'`)[0].quality === 'pass');
  r = await photo('blurry');
  check('A14 a new photo that fails the check does not lift it', r.quality === 'sent_back' && row().operator_hold === 1);
  r = await photo();
  check('A14 a new photo that passes the check lifts it and the listing is back', r.quality === 'pass' && row().operator_hold === 0 && row().hold_kind === null && isPublic(), JSON.stringify(row()));
  check('A14 the lift is in the activity record', sql(`SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = '${id}' AND action = 'puppy.photo_hold_lifted'`)[0].n === 1);
  // The plain hold is not lifted by a photo.
  await admin.post(`/api/puppies/${id}/hold`, { on: true });
  await photo();
  check('A14 a plain hold stays until an operator releases it', row().operator_hold === 1 && row().hold_kind === null && !isPublic());
  await admin.post(`/api/puppies/${id}/hold`, { on: false });
  check('A14 Release lifts it', row().operator_hold === 0 && isPublic());
  // Photo review: a photo Amber keeps counts too.
  await admin.put('/api/settings', { photo_check_route: 'review' });
  await admin.post(`/api/puppies/${id}/hold`, { on: true, kind: 'photos', reason: 'The puppy is hard to see.' });
  r = await photo('too_small');
  await admin.post(`/api/photo-review/${r.id}/keep`, {});
  await admin.put('/api/settings', { photo_check_route: 'breeder' });
  check('A14 a photo Amber keeps in Photo review lifts the hold too', row().operator_hold === 0 && isPublic());
  const portalJs = fs.readFileSync(path.join(APP, 'portal/public/portal.js'), 'utf8');
  const standard = 'Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.';
  check("A14 the portal photo step shows Amber's photo standard", portalJs.includes(standard) && /'<p class="photo-standard"><b>Photo standard\.<\/b> ' \+ esc\(PHOTO_STANDARD\)/.test(portalJs));
  // The admin suite rewrites the local draft, so the starting draft is read from schema.sql.
  const seedDraft = (fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8').match(/\('draft', ([\s\S]*?)'2026-09-30T00:00:00Z', 'setup', NULL, NULL\)/) || [])[1] || '';
  check('A14 the listing terms draft carries the photo standard', seedDraft.includes(`'Photo standard. ${standard}'`), seedDraft.slice(-260));
  const mig = fs.readFileSync(path.join(APP, 'migrations/0032_photo_hold.sql'), 'utf8');
  check('A14 the migration adds the standard to the draft only, once', mig.includes(standard) && /WHERE version = 'draft' AND instr\(body, 'Photo standard\. Photos must be high quality'\) = 0/.test(mig));
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

// ---------------------------------------------------------------- B9 business notices to NOTICE_TO
// The default local portal has no NOTICE_TO, so a sign-up still reaches every operator. With
// NOTICE_PORTAL set to a second local portal started with --var NOTICE_TO:info@puppy-connection.com
// on the same app/.state, the sign-up notice and a listing report go to that address only.
async function notices() {
  const box = async (to, subject) => ((await new Client(PORTAL).get(`/dev/mail.json?to=${encodeURIComponent(to)}`)).data || []).filter((m) => subject.test(m.subject));
  const A = await breeder('notice-default', false);
  const plain = new RegExp(`^New breeder waiting for approval: ${A.name}$`);
  check('B9 without NOTICE_TO a new sign-up still emails the operators in people', (await box('amber@puppyconnection.test', plain)).length === 1 && (await box('info@puppy-connection.com', plain)).length === 0);
  const NP = process.env.NOTICE_PORTAL;
  if (!NP) { console.log('SKIP  B9 with NOTICE_TO: set NOTICE_PORTAL to a portal started with --var NOTICE_TO:info@puppy-connection.com'); return; }
  const stamp = `notice-${Date.now().toString(36)}`;
  const email = `launch-${stamp}@breeders.test`;
  const name = `Launch Kennel ${stamp}`;
  const c = new Client(NP);
  await call(c, 'POST', '/auth/signup', { email, business_name: name });
  await usePasswordLink(c, await mailLink(email));
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: name, public_phone: '555-0103', city: 'Goshen', state: 'IN' });
  const r = await c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
  const subj = new RegExp(`^New breeder waiting for approval: ${name}$`);
  check('B9 with NOTICE_TO a new sign-up emails info@puppy-connection.com and no operator', r.status === 200 && (await box('info@puppy-connection.com', subj)).length === 1
    && (await box('amber@puppyconnection.test', subj)).length === 0, JSON.stringify(sql(`SELECT to_addr FROM email_log WHERE template = 'profile_submitted' ORDER BY id DESC LIMIT 3`)));
  await admin.post(`/api/breeders/${me.id}/approve`, {});
  const bslug = (await admin.get(`/api/breeders/${me.id}`)).data.breeder.slug;
  const rep = await fetch(`${NP}/report`, { method: 'POST', headers: { origin: NP, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ breeder: bslug, reason: 'other', details: `Notice test ${stamp}` }), redirect: 'manual' });
  const rsub = new RegExp(`^Listing reported: .*${name}`);
  check('B9 with NOTICE_TO a listing report emails info@puppy-connection.com and no owner', rep.status === 200 && (await box('info@puppy-connection.com', rsub)).length === 1
    && (await box('amber@puppyconnection.test', rsub)).length === 0, `${rep.status} ${JSON.stringify(sql("SELECT to_addr, template FROM email_log WHERE template = 'listing_report' ORDER BY id DESC LIMIT 3"))}`);
}

const PARTS = { details, reports, photos, placed, inactivity, reference, photohold, approval, counts, visit, wixtext, notices };

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
