// The admin features of plan P3 (P3.1 to P3.9 and the sortable lists), against the running
// local Workers.
//
//   node app/dev/admin-features-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788, as for the other suites. Part 1 needs no
// server. It loads the admin Worker in this process and calls EVERY route in its router with
// no operator identity, and again with a signed-in address that is not an operator, and every
// call must answer 403 without reading the database. A route added later is picked up from the
// router itself, so it cannot ship without passing. Part 2 runs the features over HTTP with
// real breeders, and checks the CSV downloads cannot carry a spreadsheet formula.
//
// The suite publishes listing terms to test them, then publishes Amber's placeholder again at
// the end, so the terms page is back to its marked placeholder for the other suites.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from './e2e.mjs';
import { csvCell, toCsv } from '../lib/csv.js';
import { publisher } from '../lib/publish.js';
import { TERMS_PLACEHOLDER } from '../lib/store.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to', path.join(APP, '.state'),
    '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

// ---------------------------------------------------------------- part 1, operator only
async function operatorOnly() {
  const src = fs.readFileSync(path.join(APP, 'admin/worker.js'), 'utf8');
  const routes = [...src.matchAll(/\['(GET|POST|PUT|DELETE)', \/\^(.*?)\$\/, (\w+|null|\(r)/g)].map((m) => {
    const p = m[2].replace(/\(\[\\w-\]\+\)/g, 'id1').replace(/\(\\w\+\)/g, 'job1').replace(/\(([\w-]+)(\|[\w-]+)*\)/g, '$1')
      .replace(/\\\//g, '/').replace(/\\\./g, '.');
    return { method: m[1], path: p, name: m[3] };
  });
  const NEW = ['/api/breeders/id1/notes', '/api/litters/id1', '/api/breeds', '/api/breeds/id1', '/api/terms', '/api/terms/draft', '/api/terms/publish',
    '/api/site', '/api/site/publish', '/api/email-log', '/api/reports', '/api/reports/months.csv', '/api/checkouts/id1/refund',
    '/api/checkouts/id1/dispute', '/api/attention'];
  check(`part 1 finds every new P3 route in the admin router (${routes.length} routes in all)`, NEW.every((n) => routes.some((r) => r.path === n)),
    `missing: ${NEW.filter((n) => !routes.some((r) => r.path === n)).join(', ')}`);
  const { default: worker } = await import(new URL('../admin/worker.js', import.meta.url));
  let touched = 0;
  const trapDb = { prepare() { touched += 1; throw new Error('the database was read before the identity check'); } };
  // A signed-in address the people table does not know: identity resolves, and the lookup finds nobody.
  const strangerDb = {
    prepare(q) {
      if (!/FROM people/i.test(q)) { touched += 1; throw new Error(`read ${q.slice(0, 40)} before the operator check`); }
      return { bind: () => ({ first: async () => null }) };
    },
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const envs = [
    ['no identity (Access not configured, a breeder cookie on the request)', { DEV_MODE: 'staging', ACCESS_TEAM_DOMAIN: 'PASTE_TEAM_DOMAIN', ACCESS_AUD: 'PASTE_APPLICATION_AUD', DB: trapDb }, 'https://admin.example.test', { cookie: '__Host-pc_session=abc' }],
    ['a signed-in address that is not an operator', { DEV_MODE: 'local', DEV_IDENTITY: 'stranger@breeders.test', DB: strangerDb }, 'http://localhost:8788', {}],
  ];
  for (const [label, env, origin, headers] of envs) {
    const bad = [];
    touched = 0;
    for (const r of routes) {
      const init = { method: r.method, headers: { origin, accept: 'application/json', ...headers } };
      if (r.method !== 'GET') { init.body = '{}'; init.headers['content-type'] = 'application/json'; }
      const res = await worker.fetch(new Request(origin + r.path, init), env, ctx);
      if (res.status !== 403) bad.push(`${r.method} ${r.path} ${res.status}`);
    }
    check(`part 1 every admin route answers 403 to ${label}`, !bad.length && touched === 0, `${bad.join('; ')} touched=${touched}`);
  }
}

// ---------------------------------------------------------------- part 2 helpers
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
const img = (c, p) => c.req('POST', p, JPG, { headers: { 'content-type': 'image/jpeg' } });
async function breeder(tag, approve, name) {
  const stamp = `${tag}-${Date.now().toString(36)}`;
  const email = `adm-${stamp}@breeders.test`;
  const business = name || `Admin Test Kennel ${stamp}`;
  const c = new Client(PORTAL);
  await call(c, 'POST', '/auth/start', { email, business_name: business });
  const mail = await c.get(`/dev/mail.json?to=${encodeURIComponent(email)}`);
  const token = new URL(mail.data[0].link).searchParams.get('t');
  await c.req('POST', '/auth/verify', new URLSearchParams({ t: token }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: business, public_phone: '555-0103', city: 'Nappanee', state: 'IN' });
  await c.post('/api/profile/submit', { accept_terms: true });
  if (approve) await admin.post(`/api/breeders/${me.id}/approve`, {});
  return { c, id: me.id, email, name: business };
}
async function pay(c, ids) {
  const co = (await c.post('/api/checkouts', { puppy_ids: ids })).data;
  const sp = new URL(co.url).pathname;
  const r = await c.req('POST', `${sp}/pay`, new URLSearchParams({ webhook: '1' }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  await c.get(new URL(r.location).pathname + new URL(r.location).search);
  return co.checkout_id;
}
async function listedPuppy(b, name) {
  const litter = (await b.c.post('/api/litters', { breed_id: 'breed-havanese' })).data.id;
  const id = (await b.c.post('/api/puppies', { litter_id: litter, name, price: '1500' })).data.id;
  await img(b.c, `/api/puppies/${id}/photos`);
  return { litter, id };
}
const detail = async (id) => (await admin.get(`/api/breeders/${id}`)).data;
const pupOf = async (b, id) => (await b.c.get('/api/listings')).data.litters.flatMap((l) => l.puppies).find((p) => p.id === id);
const mailTo = async (email) => (await new Client(PORTAL).get(`/dev/mail.json?to=${encodeURIComponent(email)}`)).data;
const exportText = async () => JSON.stringify((await admin.get('/api/export')).data);

/** A CSV parsed into rows of cells, quotes removed. */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (q) { if (ch === '"' && s[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') q = false; else cell += ch; continue; }
    if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\r') { /* skip */ } else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function features() {
  const A = await breeder('a', true);
  const B = await breeder('b', true);
  const C = await breeder('c', false);
  const a1 = await listedPuppy(A, 'Biscuit');
  const coA = await pay(A.c, [a1.id]);
  const b1 = await listedPuppy(B, 'Clover');
  const coB = await pay(B.c, [b1.id]);

  // ---------------------------------------------------------------- P3.1 editing on their behalf
  let d = await detail(A.id);
  const badSite = await admin.put(`/api/breeders/${A.id}/profile`, { version: d.breeder.profile_version, business_name: A.name, website_url: 'ftp://kennel.test' });
  const portalSite = await A.c.put('/api/profile', { version: d.breeder.profile_version, business_name: A.name, website_url: 'ftp://kennel.test' });
  check('P3.1 the operator profile edit refuses what the portal refuses, with the same words', badSite.status === 400 && badSite.data.error === portalSite.data.error, JSON.stringify([badSite.data, portalSite.data]));
  const prof = await admin.put(`/api/breeders/${A.id}/profile`, { version: d.breeder.profile_version, business_name: A.name, public_phone: '555-0199', city: 'Nappanee', state: 'IN' });
  d = await detail(A.id);
  check('P3.1 an operator changes the public phone and it saves', prof.status === 200 && d.breeder.public_phone === '555-0199', JSON.stringify(prof.data).slice(0, 160));
  check('P3.1 the profile change is audited under the operator', d.audit.some((a) => a.action === 'profile.update' && a.actor_type === 'operator'));
  check('P3.1 the breeder is emailed about the contact change at their sign-in address', (await mailTo(A.email)).some((m) => /contact details were changed/.test(m.subject) && /Puppy Connection team/.test(m.body)));

  const litter = d.litters.find((l) => l.id === a1.litter);
  const badDate = await admin.put(`/api/litters/${a1.litter}`, { born_on: 'last week', version: litter.version });
  check('P3.1 a litter edit uses the portal rules (a bad date is refused)', badDate.status === 400 && /YYYY-MM-DD/.test(badDate.data.error), JSON.stringify(badDate.data));
  const lit = await admin.put(`/api/litters/${a1.litter}`, { born_on: '2026-08-01', mom_weight_lb: '18', version: litter.version });
  d = await detail(A.id);
  const litAfter = d.litters.find((l) => l.id === a1.litter);
  check('P3.1 an operator edits a litter, it keeps its breeder and breed', lit.status === 200 && litAfter.born_on === '2026-08-01' && litAfter.mom_weight_lb === 18 && litAfter.breeder_id === A.id && litAfter.breed_id === 'breed-havanese',
    JSON.stringify([lit.data, litAfter.born_on, litAfter.mom_weight_lb]));
  check('P3.1 the litter edit is audited under the operator', d.audit.some((a) => a.action === 'litter.update' && a.actor_type === 'operator' && a.entity_id === a1.litter));
  const staleLit = await admin.put(`/api/litters/${a1.litter}`, { born_on: '2026-08-02', version: litter.version });
  check('P3.1 a stale litter edit answers 409', staleLit.status === 409);

  let pp = d.litters.flatMap((l) => l.puppies).find((p) => p.id === a1.id);
  const noName = await admin.put(`/api/puppies/${a1.id}`, { name: '', version: pp.version });
  const badUrl = await admin.put(`/api/puppies/${a1.id}`, { breeder_url: 'javascript:alert(1)', version: pp.version });
  check('P3.1 a puppy edit uses the portal rules (no name, a bad link)', noName.status === 400 && /name/.test(noName.data.error) && badUrl.status === 400, JSON.stringify([noName.data, badUrl.data]));
  const pupEdit = await admin.put(`/api/puppies/${a1.id}`, { color: 'Chocolate merle', includes: ['Vet exam', 'Microchip'], deposit: '200', version: pp.version });
  const seen = await pupOf(A, a1.id);
  check('P3.1 an operator edits a puppy and the breeder sees it, untouched fields kept', pupEdit.status === 200 && seen.color === 'Chocolate merle' && seen.includes.join() === 'Vet exam,Microchip'
    && seen.deposit_cents === 20000 && seen.price_cents === 150000 && seen.name === 'Biscuit' && seen.breeder_id === A.id, JSON.stringify([pupEdit.data, seen.color, seen.includes, seen.price_cents]));
  d = await detail(A.id);
  check('P3.1 the puppy edit is audited under the operator', d.audit.some((a) => a.action === 'puppy.update' && a.actor_type === 'operator' && a.entity_id === a1.id));

  // ---------------------------------------------------------------- P3.2 private notes
  const secret = `Private note ${Date.now().toString(36)} about their kennel visit`;
  check('P3.2 an empty note is refused', (await admin.post(`/api/breeders/${A.id}/notes`, { body: '  ' })).status === 400);
  await admin.post(`/api/breeders/${A.id}/notes`, { body: `${secret} (first)` });
  await sleep(1100);
  const notes = await admin.post(`/api/breeders/${A.id}/notes`, { body: `${secret} (second)` });
  check('P3.2 notes list newest first, with the author and time', notes.status === 201 && notes.data.length === 2 && /second/.test(notes.data[0].body)
    && notes.data[0].author === 'amber@puppyconnection.test' && !!notes.data[0].created_at, JSON.stringify(notes.data).slice(0, 200));
  check('P3.2 the breeder drawer carries them', (await detail(A.id)).notes.length === 2);
  check('P3.2 a note on a breeder that does not exist answers 404', (await admin.post('/api/breeders/no-such-breeder/notes', { body: 'x' })).status === 404);
  const breederSees = JSON.stringify([(await A.c.get('/api/me')).data, (await A.c.get('/api/listings')).data, (await A.c.get('/api/account')).data, (await A.c.get('/api/checkouts')).data]);
  check('P3.2 the breeder never sees a note anywhere in the portal', !breederSees.includes(secret));
  check('P3.2 the site export holds no note', !(await exportText()).includes(secret));
  check('P3.2 the audit row records that a note was added, not what it says', !JSON.stringify((await admin.get('/api/audit')).data).includes(secret)
    && (await detail(A.id)).audit.some((a) => a.action === 'breeder.note'));

  // ---------------------------------------------------------------- P3.3 breeds
  const stamp = Date.now().toString(36);
  const breeds = (await admin.get('/api/breeds')).data;
  const hav = breeds.find((b) => b.id === 'breed-havanese');
  check('P3.3 breeds list with live counts', !!hav && hav.live >= 2 && hav.puppies >= hav.live && typeof hav.breeders === 'number', JSON.stringify(hav));
  const add = await admin.post('/api/breeds', { name: `Test Doodle ${stamp}`, guide: 'A friendly test breed.\n\nSecond paragraph.' });
  check('P3.3 an operator adds a breed, its slug made from the name', add.status === 201 && add.data.slug === `test-doodle-${stamp}`, JSON.stringify(add.data));
  const dupName = await admin.post('/api/breeds', { name: `test doodle ${stamp}` });
  const dupSlug = await admin.post('/api/breeds', { name: `Another ${stamp}`, slug: `test-doodle-${stamp}` });
  check('P3.3 a second breed with the same name or the same address is refused', dupName.status === 400 && dupSlug.status === 400 && /address/.test(dupSlug.data.error), JSON.stringify([dupName.data, dupSlug.data]));
  const ren = await admin.put(`/api/breeds/${add.data.id}`, { name: `Test Poodle Mix ${stamp}`, guide: 'Rewritten guide.' });
  const after = (await admin.get('/api/breeds')).data.find((b) => b.id === add.data.id);
  check('P3.3 rename and guide edit save, and the address stays the same', ren.status === 200 && after.name === `Test Poodle Mix ${stamp}` && after.slug === `test-doodle-${stamp}` && after.guide === 'Rewritten guide.' && !!after.guide_updated_at,
    JSON.stringify(after));
  check('P3.3 renaming onto an existing breed is refused', (await admin.put(`/api/breeds/${add.data.id}`, { name: 'Havanese' })).status === 400);
  check('P3.3 breeders can pick the new breed in the portal', (await A.c.get('/api/breeds')).data.some((b) => b.id === add.data.id));

  // ---------------------------------------------------------------- P3.4 terms
  const t0 = (await admin.get('/api/terms')).data;
  check('P3.4 the terms screen starts from the version on file, marked as a placeholder', !!t0.current.version && /REPLACE THIS/.test(t0.draft.body) && (await A.c.get('/api/me')).data.terms.needs_accept === false,
    JSON.stringify(t0.current));
  check('P3.4 publishing a draft identical to the current terms is refused', (await admin.post('/api/terms/publish', {})).status === 400);
  const newText = `Test terms ${stamp}. Listings must describe real puppies.\n\nThis is a test version written by the admin suite.`;
  await admin.put('/api/terms/draft', { body: newText });
  const pub = await admin.post('/api/terms/publish', {});
  const v1 = pub.data.current.version;
  check('P3.4 the draft publishes as a new version and becomes current', pub.status === 200 && v1 !== t0.current.version && pub.data.current.body === newText, JSON.stringify(pub.data.current).slice(0, 200));
  let meA = (await A.c.get('/api/me')).data;
  check('P3.4 an approved breeder is now asked to accept it, with the new text', meA.terms.needs_accept === true && meA.terms.version === v1 && meA.terms.body === newText);
  check('P3.4 and is not blocked from anything meanwhile', (await A.c.get('/api/listings')).status === 200 && (await A.c.post('/api/litters', { breed_id: 'breed-havanese' })).status === 201);
  const termsPage = await (await fetch(`${PORTAL}/terms`)).text();
  check('P3.4 /terms shows the published text and drops the placeholder flag', termsPage.includes(`Test terms ${stamp}.`) && !/Draft, waiting on Amber/.test(termsPage) && termsPage.includes(`Terms version on file: ${v1}`));
  check('P3.4 accepting an older version answers 409', (await A.c.post('/api/terms/accept', { version: t0.current.version })).status === 409);
  const acc = await A.c.post('/api/terms/accept', { version: v1 });
  meA = acc.data;
  check('P3.4 accepting the current version clears the banner', acc.status === 200 && meA.terms.needs_accept === false && meA.terms.accepted_version === v1);
  check('P3.4 the acceptance is audited', (await detail(A.id)).audit.some((a) => a.action === 'terms.accept' && a.actor_type === 'breeder'));
  const t1 = (await admin.get('/api/terms')).data;
  check('P3.4 the terms screen counts who is on the current version', t1.accepted >= 1 && t1.waiting >= 1 && t1.versions.some((v) => v.version === v1), JSON.stringify([t1.accepted, t1.waiting]));
  const D = await breeder('d', false);
  check('P3.4 a new sign-up accepts the current version when they submit', (await D.c.get('/api/me')).data.terms.needs_accept === false && (await detail(D.id)).breeder.terms_version === v1);

  // ---------------------------------------------------------------- P3.8 refunds and disputes
  const before = await pupOf(A, a1.id);
  check('P3.8 the paid puppy is live before the refund', before.is_public === true);
  check('P3.8 a refund needs a private reason', (await admin.post(`/api/checkouts/${coA}/refund`, {})).status === 400);
  const ref = await admin.post(`/api/checkouts/${coA}/refund`, { reason: 'Breeder asked, test' });
  const refunded = await pupOf(A, a1.id);
  check('P3.8 the operator refunds the payment through the provider', ref.status === 200 && /refunded, 1 off the site/.test(ref.data.result), JSON.stringify(ref.data));
  check('P3.8 the puppy is off the site, payment refunded, back to a draft', !refunded.is_public && refunded.payment_state === 'refunded' && refunded.publication_state === 'draft',
    JSON.stringify([refunded.is_public, refunded.payment_state, refunded.publication_state]));
  check('P3.8 the public export no longer has it', !(await admin.get('/api/export')).data.listings.some((l) => l.slug === refunded.slug));
  const pays = (await admin.get('/api/checkouts')).data;
  check('P3.8 the payment shows as refunded', pays.find((c) => c.id === coA).payment_status === 'refunded');
  d = await detail(A.id);
  check('P3.8 the refund is audited under the operator, with the reason', d.audit.some((a) => a.action === 'payment.refund' && a.actor_type === 'operator'));
  const auditRow = sql(`SELECT after_json FROM audit_log WHERE action = 'payment.refund' AND entity_id = '${coA}'`)[0];
  check('P3.8 the audit row keeps the reason', /Breeder asked, test/.test(auditRow?.after_json || ''), JSON.stringify(auditRow));
  check('P3.8 the breeder is emailed that the payment was refunded', (await mailTo(A.email)).some((m) => /listing payment was refunded/.test(m.subject) && /Biscuit/.test(m.body)));
  check('P3.8 the event went through handleEvent like a Stripe webhook', sql("SELECT COUNT(*) AS n FROM stripe_events WHERE type = 'charge.refunded' AND result LIKE 'refunded%'")[0].n >= 1);
  check('P3.8 a second refund is refused', (await admin.post(`/api/checkouts/${coA}/refund`, { reason: 'again' })).status === 400);
  check('P3.8 the breeder can pay to list it again', refunded.pay_block === null, refunded.pay_block);

  const dOpen = await admin.post(`/api/checkouts/${coB}/dispute`, { action: 'open', reason: 'fraudulent' });
  let payB = (await admin.get('/api/checkouts')).data.find((c) => c.id === coB);
  check('P3.8 a dispute is recorded and shown on the payment', dOpen.status === 200 && payB.payment_status === 'disputed' && payB.dispute_status === 'needs_response' && payB.dispute_open === 1, JSON.stringify(payB));
  check('P3.8 a dispute leaves the listing up', (await pupOf(B, b1.id)).is_public === true);
  check('P3.8 a second open dispute on the same payment is refused', (await admin.post(`/api/checkouts/${coB}/dispute`, { action: 'open' })).status === 400);
  const att0 = (await admin.get('/api/attention')).data;
  check('P3.9 an open dispute is in needs attention', att0.open_disputes >= 1);
  await admin.post(`/api/checkouts/${coB}/dispute`, { action: 'won' });
  payB = (await admin.get('/api/checkouts')).data.find((c) => c.id === coB);
  check('P3.8 closing it as won records that', payB.payment_status === 'dispute_won' && payB.dispute_status === 'won' && payB.dispute_open === 0, JSON.stringify(payB));
  const fresh = (await A.c.post('/api/puppies', { litter_id: a1.litter, name: 'Unpaid', price: '100' })).data.id;
  await img(A.c, `/api/puppies/${fresh}/photos`);
  const unpaid = (await A.c.post('/api/checkouts', { puppy_ids: [fresh] })).data.checkout_id;
  const r1 = await admin.post(`/api/checkouts/${unpaid}/refund`, { reason: 'x' });
  const r2 = await admin.post(`/api/checkouts/${unpaid}/dispute`, { action: 'open' });
  check('P3.8 a checkout with no payment cannot be refunded or disputed', !!unpaid && r1.status === 400 && r2.status === 400 && /no payment/.test(r1.data.error), JSON.stringify([unpaid, r1.data, r2.data]));
  check('P3.8 refunding a checkout that does not exist answers 404', (await admin.post('/api/checkouts/no-such-checkout/refund', { reason: 'x' })).status === 404);

  // ---------------------------------------------------------------- P3.5 publish
  const s0 = (await admin.get('/api/site')).data;
  check('P3.5 the publish screen shows changes waiting', s0.waiting > 0 && s0.mode === 'mark', JSON.stringify(s0).slice(0, 200));
  sql("UPDATE site_state SET last_error = 'test failure from the admin suite' WHERE id = 1");
  const att1 = (await admin.get('/api/attention')).data;
  check('P3.9 a failed publish is in needs attention', att1.publish_error && att1.publish_error.error === 'test failure from the admin suite');
  const pubNow = await admin.post('/api/site/publish', {});
  check('P3.5 Publish now marks the site published and clears the error', pubNow.status === 200 && pubNow.data.ok && pubNow.data.site.waiting === 0 && !pubNow.data.site.last_error && pubNow.data.site.last_publish_sha === 'marked',
    JSON.stringify(pubNow.data).slice(0, 200));
  check('P3.5 the publish is audited', (await admin.get('/api/site')).data.recent[0]?.ok === true);
  let failed = null;
  try { await publisher({ PUBLISH_MODE: 'portal' }).publish({}, 1); } catch (e) { failed = e.message; }
  check('P3.5 the portal publisher (for P4.4) fails clearly without its service binding', /service binding is missing/.test(failed || ''), failed);

  // ---------------------------------------------------------------- P3.9 needs attention
  sql("INSERT INTO job_runs (job, last_run_at, last_error) VALUES ('backup', '2026-10-05T13:00:00Z', 'test job failure') ON CONFLICT (job) DO UPDATE SET last_error = excluded.last_error");
  await B.c.post('/api/account/close', { reason: 'admin suite' });
  const att = (await admin.get('/api/attention')).data;
  check('P3.9 a failed job is in needs attention', att.failed_jobs.some((j) => j.job === 'backup' && j.last_error === 'test job failure'));
  check('P3.9 waiting approvals and close requests are counted', att.queue >= 1 && att.close_requests >= 1, JSON.stringify([att.queue, att.close_requests]));
  const cc = att.contact_changes.find((x) => x.breeder_id === A.id);
  check('P3.9 a contact change in the last week names the breeder, the field and who made it', !!cc && cc.fields.includes('Public phone') && cc.by.includes('operator'), JSON.stringify(cc));
  check('P3.9 a breeder filling in the profile before submitting is not counted', !att.contact_changes.some((x) => x.breeder_id === D.id));
  sql("UPDATE job_runs SET last_error = NULL WHERE job = 'backup'");
  await B.c.post('/api/account/close/withdraw', {});

  // ---------------------------------------------------------------- P3.6 email log
  const log = (await admin.get('/api/email-log')).data;
  check('P3.6 the email log lists sends with status, template and recipient', log.rows.length > 0 && log.total >= log.rows.length && ['to_addr', 'template', 'status', 'sent_at'].every((k) => k in log.rows[0]));
  const mine = (await admin.get(`/api/email-log?q=${encodeURIComponent(A.email)}`)).data;
  check('P3.6 searching by address finds only that address', mine.rows.length >= 3 && mine.rows.every((m) => m.to_addr === A.email) && mine.rows.some((m) => m.template === 'listing_refunded'),
    JSON.stringify(mine.rows.map((m) => m.template)));

  // ---------------------------------------------------------------- P3.7 reports and CSV safety
  check('P3.7 csvCell prefixes = + - @ tab and carriage return, and leaves numbers alone',
    csvCell('=1+1') === "'=1+1" && csvCell('+SUM(A1)') === "'+SUM(A1)" && csvCell('-2+3') === "'-2+3" && csvCell('@cmd') === "'@cmd"
    && csvCell('\t=x') === "'\t=x" && csvCell(-5) === '-5' && csvCell(12) === '12' && csvCell('a,b') === '"a,b"' && csvCell('say "hi"') === '"say ""hi"""' && csvCell(null) === '',
    JSON.stringify([csvCell('=1+1'), csvCell('\t=x'), csvCell('a,b')]));
  check('P3.7 toCsv quotes a risky cell that also needs quoting', toCsv(['h'], [['=HYPERLINK("x","y")']]) === `h\r\n"'=HYPERLINK(""x"",""y"")"\r\n`);
  const E = await breeder('e', true, `=HYPERLINK("http://evil.test","Kennel ${stamp}")`);
  const eLitter = (await E.c.post('/api/litters', { breed_id: add.data.id })).data.id;
  const evil = ['+SUM(1,2)', '-2+3', '@cmd'];
  const evilIds = [];
  for (const n of evil) {
    const id = (await E.c.post('/api/puppies', { litter_id: eLitter, name: n, price: '100' })).data.id;
    evilIds.push(id);
    await img(E.c, `/api/puppies/${id}/photos`);
  }
  await pay(E.c, evilIds);
  await admin.put(`/api/breeds/${add.data.id}`, { name: `=cmd|' /C calc'!A0 ${stamp}` });
  // More views than any earlier run of this suite gave its own puppies, so these are the top three.
  const top = Math.floor(Date.now() / 1000);
  sql(`INSERT INTO puppy_stats (puppy_id, day, views, clicks) VALUES ${evilIds.map((id, i) => `('${id}', '2026-10-05', ${top + i}, 3)`).join(', ')}
       ON CONFLICT (puppy_id, day) DO UPDATE SET views = excluded.views`);
  const rep = (await admin.get('/api/reports')).data;
  const month = new Date().toISOString().slice(0, 7);
  check('P3.7 the report has listings and revenue by month', rep.months.some((m) => m.month === month && m.paid_listings >= 5 && m.revenue_cents > 0 && m.refunded_cents >= 1499), JSON.stringify(rep.months[0]));
  check('P3.7 listings by breed, live, placed and draft counts, and the most viewed puppies', rep.breeds.length > 0 && rep.summary.live > 0 && typeof rep.summary.placed === 'number'
    && rep.summary.draft > 0 && rep.views[0] && evilIds.includes(rep.views[0].id), JSON.stringify(rep.summary));
  const all = [];
  for (const name of ['months', 'breeds', 'summary', 'views']) {
    const res = await fetch(`${ADMIN}/api/reports/${name}.csv`);
    const text = await res.text();
    const rows = parseCsv(text);
    all.push(text);
    check(`P3.7 ${name}.csv downloads as an attachment with a header row`,
      res.status === 200 && /text\/csv/.test(res.headers.get('content-type')) && /attachment; filename="puppy-connection-/.test(res.headers.get('content-disposition') || '') && rows.length >= 2,
      `${res.status} ${res.headers.get('content-type')} ${rows.length}`);
    const risky = rows.flat().filter((c) => /^[=+\-@\t\r]/.test(c));
    check(`P3.7 no cell in ${name}.csv starts a formula`, risky.length === 0, risky.slice(0, 4).join(' | '));
  }
  const views = parseCsv(all[3]).flat();
  check('P3.7 the dangerous names arrive as text with a leading apostrophe', views.includes("'+SUM(1,2)") && views.includes("'-2+3") && views.includes("'@cmd")
    && views.some((c) => c.startsWith("'=HYPERLINK(")) && parseCsv(all[1]).flat().some((c) => c.startsWith("'=cmd|")), views.slice(0, 16).join(' | '));
  check('P3.7 no report carries a sign-in address or a private note', !all.some((t) => t.includes('@breeders.test') || t.includes(secret)));
  check('P3.7 a report that does not exist answers 404', (await admin.get('/api/reports/notes.csv')).status === 404);

  // ---------------------------------------------------------------- put the placeholder terms back
  await admin.put('/api/terms/draft', { body: TERMS_PLACEHOLDER });
  const back = await admin.post('/api/terms/publish', {});
  const tp = await (await fetch(`${PORTAL}/terms`)).text();
  check('P3.4 publishing the placeholder again puts the marked draft back on /terms', back.status === 200 && /Draft, waiting on Amber's own words/.test(tp) && /REPLACE THIS:<\/b> the listing terms/.test(tp));
}

await operatorOnly();
// PART1_ONLY=1 runs only the operator-only check, which needs no server (used by the break test).
if (!process.env.PART1_ONLY) await features();
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
