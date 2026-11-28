// Hope's feedback (Alex, 2026-11-27, docs/batch-2026-11-27-hope-feedback.md), against the running
// local Workers.
//
//   node app/dev/hope-batch-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788, as for the other suites. Staff acting for a breeder
// can use a puppy photo the check sent back and keep a refused mom or dad photo, while the breeder
// signed in as themselves cannot. The staff session lasts 30 days. A document left on "Read it for
// me" that cannot be read is kept as Other document under a tidied file name. Socialization saves,
// is copied by Duplicate and reaches the site export.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client, mailLink, usePasswordLink, TEST_PASSWORD } from './e2e.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));
const BIG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test-1200.jpg')));

let passes = 0, fails = 0;
function check(label, ok, detail) {
  if (ok) passes += 1; else fails += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
}
function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to',
    path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command],
  { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out)[0].results;
}
const jpeg = { headers: { 'content-type': 'image/jpeg' } };

// ---------------------------------------------------------------- a kennel, the breeder and staff on it
const admin = new Client(ADMIN);
const stamp = Date.now().toString(36);
const email = `hope-${stamp}@breeders.test`;
const breeds = (await admin.get('/api/breeds')).data;
let r = await admin.post('/api/breeders', {
  email, business_name: `Hope Batch ${stamp}`, contact_name: 'Pat Example', public_phone: '555-0144', city: 'Goshen', state: 'IN',
  breed_ids: [breeds[0].id], invite: true,
});
check('a kennel is added from the admin', r.status === 201, `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
const id = r.data.breeder.id;
const mine = new Client(PORTAL);
await usePasswordLink(mine, await mailLink(email), TEST_PASSWORD);
r = await admin.post(`/api/breeders/${id}/manage`, {});
const op = new Client(PORTAL);
const u = new URL(r.data.url);
await op.get(u.pathname + u.search);
const me = (await op.get('/api/me')).data;
check('staff are in the portal as the operator', me.id === id && !!me.operator, JSON.stringify(me.operator));
const sess = sql(`SELECT created_at, expires_at FROM sessions WHERE breeder_id = '${id}' AND operator_email IS NOT NULL ORDER BY created_at DESC LIMIT 1`)[0];
check('the staff session lasts 30 days', Math.round((Date.parse(sess.expires_at) - Date.parse(sess.created_at)) / 86400000) === 30, JSON.stringify(sess));

const litter = (await op.post('/api/litters', { breed_id: breeds[0].id })).data.id;
const pup = (await op.post('/api/puppies', { litter_id: litter, name: 'Clover', price: '1800', socialization: 'Raised with children.\n\nUsed to car rides.' })).data.id;

// ---------------------------------------------------------------- a sent-back puppy photo
const ph = (await op.req('POST', `/api/puppies/${pup}/photos`, JPG, jpeg)).data.id;
r = await op.req('POST', `/api/photos/${ph}/check`, {}, { headers: { 'x-sim-photo-check': 'person' } });
check('the check sends the photo back', r.data.quality === 'sent_back', JSON.stringify(r.data));
r = await mine.post(`/api/photos/${ph}/use`, {});
check('the breeder signed in as themselves cannot use it anyway', r.status === 403, `${r.status} ${JSON.stringify(r.data)}`);
r = await op.post(`/api/photos/${ph}/use`, {});
check('staff acting for the breeder can', r.status === 200 && r.data.quality === 'pass', `${r.status} ${JSON.stringify(r.data)}`);
const row = sql(`SELECT quality, quality_note FROM photos WHERE id = '${ph}'`)[0];
check('the photo passes, noting who used it', row.quality === 'pass' && /used anyway by /.test(row.quality_note || ''), JSON.stringify(row));
check('the override is audited as the operator acting for the kennel',
  sql(`SELECT actor FROM audit_log WHERE action = 'photo.override' AND entity_id = '${pup}'`).some((a) => /acting for/.test(a.actor)));
r = await op.post(`/api/photos/${ph}/use`, {});
check('a second use is refused', r.status === 400, String(r.status));

// ---------------------------------------------------------------- a refused mom photo
const mom = (await op.post('/api/parents', { name: 'Hazel', sex: 'female' })).data.id;
const sim = { headers: { 'content-type': 'image/jpeg', 'x-sim-photo-check': 'hidden' } };
r = await op.req('POST', `/api/parents/${mom}/photo`, BIG, sim);
check('the mom photo is refused, offering staff the override', r.status === 422 && r.data.can_override === true && (r.data.photo_check || []).includes('hidden'), JSON.stringify(r.data));
r = await mine.req('POST', `/api/parents/${mom}/photo?override=1`, BIG, sim);
check('the breeder cannot override it', r.status === 403, String(r.status));
r = await op.req('POST', `/api/parents/${mom}/photo?override=1`, BIG, sim);
check('staff keep it anyway', r.status === 201, `${r.status} ${JSON.stringify(r.data)}`);
check('the parent photo audit says it was overridden',
  sql(`SELECT after_json FROM audit_log WHERE action = 'parent.photo' AND entity_id = '${mom}'`).some((a) => /overridden/.test(a.after_json || '')));
r = await mine.req('POST', `/api/parents/${mom}/photo`, BIG, sim);
check('a breeder refused is not offered the override', r.status === 422 && r.data.can_override === false, JSON.stringify(r.data));

// ---------------------------------------------------------------- documents
r = await op.req('POST', `/api/parents/${mom}/documents?kind=auto&visibility=public&title=&name=${encodeURIComponent('CMW_S HAZEL HIPS 04_22_2025')}`, JPG, jpeg);
check('a document on Read it for me is added', r.status === 201 && r.data.visibility === 'public', `${r.status} ${JSON.stringify(r.data)}`);
const doc = sql(`SELECT kind, title FROM documents WHERE id = '${r.data.id}'`)[0];
check('it has a kind and a readable name', ['health', 'guarantee', 'pedigree', 'other'].includes(doc.kind) && !/_/.test(doc.title), JSON.stringify(doc));
r = await op.req('POST', `/api/parents/${mom}/documents?kind=pedigree&visibility=private&title=&name=a_b`, JPG, jpeg);
check('a chosen kind is kept as chosen', r.status === 201 && sql(`SELECT kind, title FROM documents WHERE id = '${r.data.id}'`)[0].kind === 'pedigree');

// ---------------------------------------------------------------- socialization
let p = sql(`SELECT socialization FROM puppies WHERE id = '${pup}'`)[0];
check('socialization saves', p.socialization === 'Raised with children.\n\nUsed to car rides.', JSON.stringify(p));
r = await op.post(`/api/puppies/${pup}/duplicate`, {});
const copy = r.data.id || (r.data.ids || [])[0];
check('Duplicate copies socialization', !!copy && sql(`SELECT socialization FROM puppies WHERE id = '${copy}'`)[0].socialization === p.socialization, JSON.stringify(r.data));
const v = sql(`SELECT name, version FROM puppies WHERE id = '${pup}'`)[0];
r = await admin.put(`/api/puppies/${pup}`, { name: v.name, price: 1800, socialization: 'Raised with cats.', version: v.version });
check('the admin edits socialization', sql(`SELECT socialization FROM puppies WHERE id = '${pup}'`)[0].socialization === 'Raised with cats.', `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
check('the public view carries socialization', sql("SELECT COUNT(*) AS n FROM pragma_table_info('public_puppies') WHERE name = 'socialization'")[0].n === 1);

// ---------------------------------------------------------------- the photo check's confirm step (no model)
const { confirmReasons } = await import('../lib/photocheck.js');
const clear = { dog_visible: true, face_visible: true, puppy_sharp: true, text_on_puppy: false, too_dark: false, puppy_tiny: false, pixelated: false };
check('a person holding a puppy whose face shows is not sent back', confirmReasons(['person'], clear).length === 0);
check('a plant in a corner is not sent back as hidden', confirmReasons(['hidden'], clear).length === 0);
check('a sharp running puppy is not sent back as blurry', confirmReasons(['blurry'], clear).length === 0);
check('a small brand on a dog bed is not sent back as a watermark', confirmReasons(['watermark'], clear).length === 0);
check('a person hiding the puppy\'s face is still sent back', confirmReasons(['person'], { ...clear, face_visible: false }).join() === 'person');
check('only the reasons the facts confirm are kept', confirmReasons(['blurry', 'too_small'], { ...clear, puppy_sharp: false }).join() === 'blurry');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
