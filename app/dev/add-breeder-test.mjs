// Add a breeder from the admin (Alex, 2026-11-05), against the running local Workers.
//
//   node app/dev/add-breeder-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788, as for the other suites. An operator adds a kennel
// with its whole profile, the portal's rules refuse a bad one, the kennel is approved with Puppy
// Connection access on, Manage as this breeder adds a litter and a puppy at once, the invitation
// goes only when ticked, an address already in use is allowed, and staff can add one too.

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client, mailLink, usePasswordLink, TEST_PASSWORD } from './e2e.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');

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

const admin = new Client(ADMIN);
const stamp = Date.now().toString(36);
const email = `added-${stamp}@breeders.test`;
const mailTo = async (to) => (await new Client(PORTAL).get(`/dev/mail.json?to=${encodeURIComponent(to)}`)).data;
const breeds = (await admin.get('/api/breeds')).data;
const good = {
  email, business_name: `Added Kennel ${stamp}`, contact_name: 'Pat Example', public_phone: '555-0144', public_email: `hello-${stamp}@breeders.test`,
  city: 'Goshen', state: 'IN', website_url: 'https://example.com/kennel', description: 'A family kennel.\n\nSecond paragraph.',
  facebook_url: 'facebook.com/addedkennel', breed_ids: [breeds[0].id, breeds[1].id],
};

// ---------------------------------------------------------------- the portal's rules
const refused = async (label, patch, rx) => {
  const r = await admin.post('/api/breeders', { ...good, ...patch });
  check(`refused: ${label}`, r.status === 400 && rx.test(r.data.error || ''), `${r.status} ${JSON.stringify(r.data)}`);
};
await refused('no main contact email', { email: 'not an address' }, /valid email/);
await refused('no business name', { business_name: ' ' }, /business name/);
await refused('no public phone or email', { public_phone: '', public_email: '' }, /public phone or email/);
await refused('no city or state', { state: '' }, /city and state/);
await refused('a website without https', { website_url: 'example.com' }, /https:\/\//);
await refused('a public email that is not one', { public_email: 'nope' }, /public email/);
await refused('a Facebook page off facebook.com', { facebook_url: 'https://example.com/me' }, /facebook\.com/);
await refused('a breed not on the list', { breed_ids: ['breed-not-real'] }, /from the list/);
check('nothing was created by the refused tries', sql(`SELECT COUNT(*) AS n FROM breeders WHERE email = '${email}'`)[0].n === 0);
const cross = await new Client(ADMIN).req('POST', '/api/breeders', good, { headers: { origin: 'https://evil.example' } });
check('a cross-site post is refused', cross.status === 403, String(cross.status));

// ---------------------------------------------------------------- the create
let r = await admin.post('/api/breeders', good);
check('an owner adds a breeder', r.status === 201 && r.data.breeder && r.data.breeder.email === email, `${r.status} ${JSON.stringify(r.data).slice(0, 300)}`);
const id = r.data.breeder.id;
const b = r.data.breeder;
check('it starts approved, submitted and decided by the operator', b.status === 'approved' && !!b.profile_submitted_at && b.decided_by === 'amber@puppyconnection.test');
check('the profile is saved as entered', b.business_name === good.business_name && b.public_phone === '555-0144' && b.city === 'Goshen' && b.website_url === good.website_url && b.contact_name === 'Pat Example');
check('it has a public address', /^added-kennel-/.test(b.slug || ''), b.slug);
check('the extras are saved, Facebook tidied to https', r.data.extras.facebook_url === 'https://facebook.com/addedkennel' && r.data.extras.breeds.length === 2);
check('access is on, recorded as the existing arrangement by the operator',
  r.data.access.on && r.data.access.how === 'existing_arrangement' && r.data.access.by === 'amber@puppyconnection.test');
check('the terms and the seller box wait for the breeder', !b.terms_version && !b.seller_confirmed_at);
check('no invitation went, because it was not ticked', r.data.invited === false && !(await mailTo(email)).length);
const audit = sql(`SELECT action, actor FROM audit_log WHERE entity = 'breeder' AND entity_id = '${id}' ORDER BY id`);
check('the create and the access are audited by the operator',
  audit.some((a) => a.action === 'breeder.create' && a.actor === 'amber@puppyconnection.test') && audit.some((a) => a.action === 'access.on'), JSON.stringify(audit));
check('the site is marked as needing a publish', (await admin.get('/api/stats')).data.unpublished_changes > 0);
check('it is on the Approved list', (await admin.get('/api/breeders?status=approved')).data.some((x) => x.id === id));

// ---------------------------------------------------------------- a second kennel with the same name
r = await admin.post('/api/breeders', { ...good, email: `other-${stamp}@breeders.test` });
check('the same business name is refused once, naming the kennel', r.status === 409 && r.data.duplicate === id && /already exists/.test(r.data.error), JSON.stringify(r.data));

// ---------------------------------------------------------------- Manage as this breeder, at once
r = await admin.post(`/api/breeders/${id}/manage`, {});
check('Manage as this breeder gives a hand-over', r.status === 200 && /\/auth\/handoff\?t=/.test(r.data.url || ''), JSON.stringify(r.data));
const op = new Client(PORTAL);
const h = await op.get(new URL(r.data.url).pathname + new URL(r.data.url).search);
check('the portal opens it', h.status === 303);
const me = (await op.get('/api/me')).data;
check('the portal session is on the new kennel, as the operator', me.id === id && !!me.operator, JSON.stringify({ id: me.id, operator: me.operator }));
const litter = await op.post('/api/litters', { breed_id: breeds[0].id });
check('the operator adds a litter', litter.status === 201 || litter.status === 200, JSON.stringify(litter.data));
const pup = await op.post('/api/puppies', { litter_id: litter.data.id, name: 'Biscuit', price: '1800' });
check('the operator adds a puppy', (pup.status === 201 || pup.status === 200) && !!pup.data.id, JSON.stringify(pup.data));
const detail = (await admin.get(`/api/breeders/${id}`)).data;
check('the admin shows the litter and the puppy', detail.litters.length === 1 && detail.litters[0].puppies.some((p) => p.name === 'Biscuit'));

// ---------------------------------------------------------------- an address already in use, with the invitation ticked
r = await admin.post('/api/breeders', { ...good, business_name: `Second Kennel ${stamp}`, invite: true });
check('the same main contact may have a second kennel', r.status === 201 && r.data.breeder.email === email, `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
check('the invitation went when ticked', r.data.invited === true && !r.data.invite_error, JSON.stringify({ invited: r.data.invited, e: r.data.invite_error }));
const id2 = r.data.breeder.id;
const link = await mailLink(email);
check('the invitation is in the mailbox with a set-password link', /\/auth\/set-password\?t=/.test(link || ''), link);
const breederC = new Client(PORTAL);
await usePasswordLink(breederC, link, TEST_PASSWORD);
await breederC.req('POST', '/choose', new URLSearchParams({ kennel: id }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
const mine = (await breederC.get('/api/me')).data;
check('the breeder sets a password and is on both kennels', mine.id === id && mine.kennel_count === 2, JSON.stringify({ kc: mine.kennel_count, id: mine.id }).slice(0, 200));
check('the breeder is asked to accept the terms and confirm they are the seller', !!(mine.terms && mine.terms.needs_accept && !mine.terms.accepted_version && !mine.terms.seller_confirmed), JSON.stringify(mine.terms).slice(0, 200));
const acc = await breederC.post('/api/terms/accept', { version: mine.terms.version, confirm_seller: true });
check('the breeder accepts them', acc.status === 200 && !acc.data.terms.needs_accept, `${acc.status} ${JSON.stringify(acc.data).slice(0, 200)}`);
check('the second kennel is audited', sql(`SELECT COUNT(*) AS n FROM audit_log WHERE entity_id = '${id2}' AND action IN ('breeder.create','access.on','member.invite')`)[0].n === 3);

// ---------------------------------------------------------------- staff
sql("UPDATE people SET role = 'staff' WHERE email = 'amber@puppyconnection.test'");
try {
  r = await admin.post('/api/breeders', { ...good, email: `staff-${stamp}@breeders.test`, business_name: `Staff Kennel ${stamp}` });
  check('staff add a breeder (Hope is staff)', r.status === 201 && r.data.access.on, `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
  check('staff are still refused approvals', (await admin.post(`/api/breeders/${id}/suspend`, { reason: 'x' })).status === 403);
  // Alex, 2026-11-05. Staff open a kennel with Manage as this breeder, and still cannot change access or people.
  const sm = await admin.post(`/api/breeders/${r.data.breeder.id}/manage`, {});
  check('staff get a Manage as hand-over', sm.status === 200 && /\/auth\/handoff\?t=/.test(sm.data.url || ''), JSON.stringify(sm.data));
  const sop = new Client(PORTAL);
  await sop.get(new URL(sm.data.url).pathname + new URL(sm.data.url).search);
  const sl = await sop.post('/api/litters', { breed_id: breeds[0].id });
  check('staff add a litter as the breeder', (sl.status === 201 || sl.status === 200) && !!sl.data.id, JSON.stringify(sl.data));
  check('staff are refused turning access off', (await admin.put(`/api/breeders/${id}/access`, { on: false })).status === 403);
  check('staff are refused sending an invitation', (await admin.post(`/api/breeders/${id}/people/invite`, { email })).status === 403);
} finally {
  sql("UPDATE people SET role = 'owner' WHERE email = 'amber@puppyconnection.test'");
}
check('the owner role is back', (await admin.get('/api/whoami')).data.role === 'owner');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
