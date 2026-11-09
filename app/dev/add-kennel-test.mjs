// Add a kennel from the breeder portal (Alex, 2026-11-09), against the running local Workers.
//
//   node app/dev/add-kennel-test.mjs
//
// Needs pc-portal on 8787 and pc-admin on 8788, as for the other suites. The main contact of an
// approved kennel adds another with its whole profile. It is created pending and submitted, the
// portal moves to it, Puppy Connection is emailed with who added it, and its parents, litters and
// puppies can be drafted while paying and the site stay shut. Approving it publishes the kennel and
// lets its drafts be listed, and declining another tells the person who added it.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, signUp, usePasswordLink } from './e2e.mjs';
import { sql } from './launch-features-test.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const OPERATOR = 'amber@puppyconnection.test';
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));
const FORM = { headers: { 'content-type': 'application/x-www-form-urlencoded' } };
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

let passes = 0, fails = 0;
function check(label, ok, detail) {
  if (ok) passes += 1; else fails += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
}

const admin = new Client(ADMIN);
const stamp = Date.now().toString(36);
const email = `adder-${stamp}@breeders.test`;
const mail = (to, rx) => sql(`SELECT subject, body, link FROM dev_mailbox WHERE to_addr = ${q(to)} ORDER BY id DESC LIMIT 30`).find((m) => rx.test(m.subject));
const audit = (action, id) => sql(`SELECT actor_type, actor, after_json FROM audit_log WHERE action = ${q(action)} AND entity_id = ${q(id)} ORDER BY id`);

// An approved kennel, signed in as its main contact.
const { c } = await signUp(email, `First Kennel ${stamp}`);
let me = (await c.get('/api/me')).data;
const first = me.id;
await c.put('/api/profile', { version: me.profile.version, business_name: `First Kennel ${stamp}`, public_phone: '555-0110', city: 'Goshen', state: 'IN' });
await c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
check('before approval the portal offers no Add a kennel', (await c.get('/api/me')).data.can_add_kennel === false);
await admin.post(`/api/breeders/${first}/approve`, {});
me = (await c.get('/api/me')).data;
check('once approved, the main contact is offered Add a kennel', me.can_add_kennel === true && me.drafts_ok === false, JSON.stringify({ can: me.can_add_kennel, d: me.drafts_ok }));

const breeds = (await c.get('/api/breeds')).data;
const name = `Second Kennel ${stamp}`;
const good = {
  business_name: name, contact_name: 'Pat Example', public_phone: '555-0144', public_email: `hello-${stamp}@breeders.test`,
  city: 'Nappanee', state: 'IN', website_url: 'https://example.com/second', description: 'A second family kennel.\n\nWith two paragraphs.',
  facebook_url: 'facebook.com/secondkennel', breed_ids: [breeds[0].id, breeds[1].id], accept_terms: true, confirm_seller: true,
};
check('the listing terms must be accepted', (await c.post('/api/kennels', { ...good, accept_terms: false })).status === 400);
check('the seller box must be ticked', (await c.post('/api/kennels', { ...good, confirm_seller: false })).status === 400);
const noState = await c.post('/api/kennels', { ...good, state: '' });
check('the portal profile rule refuses a kennel with no state', noState.status === 400 && /state/i.test(noState.data.error), JSON.stringify(noState.data));
check('a Facebook address that is not facebook.com is refused', (await c.post('/api/kennels', { ...good, facebook_url: 'https://example.com/x' })).status === 400);
check('nothing was created by the refused adds', sql(`SELECT COUNT(*) AS n FROM breeders WHERE email = ${q(email)}`)[0].n === 1);

const add = await c.post('/api/kennels', good);
const id = add.data && add.data.id;
check('the add answers 201 with the new kennel', add.status === 201 && !!id, JSON.stringify(add.data));
me = (await c.get('/api/me')).data;
check('the portal is now on the new kennel, pending and submitted, with drafts open', me.id === id && me.status === 'pending' && !!me.profile_submitted_at && me.drafts_ok === true,
  JSON.stringify({ id: me.id, s: me.status, sub: me.profile_submitted_at, d: me.drafts_ok }));
check('both kennels are in the switch menu', me.kennels.length === 2 && me.kennels.some((k) => k.id === first) && me.kennels.some((k) => k.id === id && /Waiting/.test(k.status_label)));
check('the profile and extras were saved', me.profile.business_name === name && me.profile.city === 'Nappanee' && me.extras.breeds.length === 2
  && me.extras.facebook_url === 'https://facebook.com/secondkennel', JSON.stringify(me.extras));
const row = sql(`SELECT email, status, terms_version, seller_confirmed_at, decided_at FROM breeders WHERE id = ${q(id)}`)[0];
check('the signed-in person is its main contact, with the terms accepted and nothing decided', row.email === email && row.status === 'pending' && !!row.terms_version && !!row.seller_confirmed_at && !row.decided_at, JSON.stringify(row));

const logo = await c.req('POST', '/api/profile/logo', JPG, { headers: { 'content-type': 'image/jpeg' } });
const photo = await c.req('POST', '/api/profile/kennel', JPG, { headers: { 'content-type': 'image/jpeg' } });
const keys = sql(`SELECT logo_key, kennel_key FROM breeder_profiles WHERE breeder_id = ${q(id)}`)[0];
check('the logo and kennel photo upload to the new kennel', logo.status < 300 && photo.status < 300 && !!keys.logo_key && !!keys.kennel_key, `${logo.status} ${photo.status} ${JSON.stringify(keys)}`);
check("the first kennel's pictures are untouched", !sql(`SELECT logo_key FROM breeder_profiles WHERE breeder_id = ${q(first)}`)[0].logo_key);

const notice = mail(OPERATOR, new RegExp(`New kennel waiting for approval: ${name}, added by ${email}`));
check('Puppy Connection is emailed, naming who added it, with a link to Approvals', !!notice && notice.link.endsWith(`/#/approvals/${id}`) && /main contact of an approved kennel/.test(notice.body),
  JSON.stringify(notice || null).slice(0, 300));
const added = audit('breeder.add', id);
check('the add is audited under the person, naming the kennel it came from', added.length === 1 && added[0].actor === email && JSON.parse(added[0].after_json).from_kennel === first);
check('the submit and the switch are audited too', audit('profile.submit', id).length === 1 && audit('session.kennel_switch', id).some((a) => a.actor === email));

const dup = await c.post('/api/kennels', good);
check('a second kennel with the same name is refused once with its name', dup.status === 409 && dup.data.duplicate === true && dup.data.error.includes(name), JSON.stringify(dup.data));

// Drafts while it waits.
const litter = await c.post('/api/litters', { breed_id: breeds[0].id, born_on: '2026-10-01' });
const puppy = litter.data ? await c.post('/api/puppies', { litter_id: litter.data.id, name: `Waffles ${stamp}`, price: '1500' }) : { status: 0 };
const parent = await c.post('/api/parents', { name: `Mom ${stamp}`, sex: 'female', breed: 'havanese' });
check('a litter, a puppy and a mom can be saved while the kennel waits', litter.status === 201 && puppy.status === 201 && parent.status === 201, `${litter.status} ${puppy.status} ${parent.status}`);
const pup = puppy.data && puppy.data.id;
check('paying stays shut while it waits', (await c.post('/api/checkouts', { puppy_ids: [pup] })).status === 403);
const listings = (await c.get('/api/listings')).data;
const mine = listings.litters.flatMap((l) => l.puppies).find((x) => x.id === pup);
check('the puppy is a draft that says why it cannot be paid for yet', mine && mine.publication_state === 'draft' && /not approved/i.test(mine.pay_block || ''), JSON.stringify(mine || null).slice(0, 200));
check('the kennel is not public', !sql(`SELECT breeder_id FROM public_breeders WHERE breeder_id = ${q(id)}`).length);
const early = await admin.post(`/api/puppies/${pup}/comp`, { basis: 'free' });
check('Puppy Connection cannot list its puppy without payment before approval', early.status === 400 && /not approved/.test(early.data.error), JSON.stringify(early.data));
check('so its listing clock has not started', !sql(`SELECT expires_at FROM puppies WHERE id = ${q(pup)}`)[0].expires_at);

// The admin's side.
const queue = (await admin.get('/api/breeders?status=queue')).data;
check('the kennel is in Approvals', queue.some((b) => b.id === id));
const detail = (await admin.get(`/api/breeders/${id}`)).data;
check('the drawer names who added it and that they run one approved kennel', detail.added && detail.added.by === email && detail.added.runs === 1, JSON.stringify(detail.added));
check('a kennel that signed up the usual way shows no added-by', (await admin.get(`/api/breeders/${first}`)).data.added === null);

// Approve.
const ok = await admin.post(`/api/breeders/${id}/approve`, {});
check('approving answers 200 and the kennel is approved', ok.status === 200 && sql(`SELECT status FROM breeders WHERE id = ${q(id)}`)[0].status === 'approved', `${ok.status}`);
const approvedMail = mail(email, new RegExp(`${name} is approved on Puppy Connection`));
check('the person who added it is emailed in words for an added kennel', !!approvedMail && /prepared for it/.test(approvedMail.body), JSON.stringify(approvedMail || null).slice(0, 200));
check('the kennel is public once approved', sql(`SELECT breeder_id FROM public_breeders WHERE breeder_id = ${q(id)}`).length === 1);
check('its unpaid draft is still not on the site', !sql(`SELECT id FROM public_puppies WHERE id = ${q(pup)}`).length);
me = (await c.get('/api/me')).data;
check('the drafts can now be paid for', me.status === 'approved' && (await c.get('/api/listings')).data.litters.flatMap((l) => l.puppies).find((x) => x.id === pup).pay_block !== 'Account not approved.');
const comp = await admin.post(`/api/puppies/${pup}/comp`, { basis: 'free' });
check('and Puppy Connection can list it without payment', comp.status === 200 && sql(`SELECT publication_state FROM puppies WHERE id = ${q(pup)}`)[0].publication_state === 'published', JSON.stringify(comp.data));

// Decline another.
const third = `Third Kennel ${stamp}`;
const add3 = await c.post('/api/kennels', { ...good, business_name: third });
const id3 = add3.data && add3.data.id;
check('the main contact of two approved kennels adds a third', add3.status === 201 && (await c.get('/api/me')).data.id === id3);
check('the notice counts the approved kennels they run', !!mail(OPERATOR, new RegExp(`${third}, added by`)) && /main contact of 2 approved kennels/.test(mail(OPERATOR, new RegExp(`${third}, added by`)).body));
check('declining needs a private reason', (await admin.post(`/api/breeders/${id3}/decline`, {})).status === 400);
const no = await admin.post(`/api/breeders/${id3}/decline`, { reason: 'test decline', message: 'We already list this kennel.' });
check('declining answers 200 and the kennel is declined', no.status === 200 && sql(`SELECT status FROM breeders WHERE id = ${q(id3)}`)[0].status === 'declined');
const declinedMail = mail(email, new RegExp(`About ${third} on Puppy Connection`));
check('the person who added it is told, with the message and that their other kennels are not affected',
  !!declinedMail && /other kennels are not affected/.test(declinedMail.body) && /already list this kennel/.test(declinedMail.body), JSON.stringify(declinedMail || null).slice(0, 300));
check('the decline is audited under the operator', audit('breeder.decline', id3).some((a) => a.actor === OPERATOR));
me = (await c.get('/api/me')).data;
check('a declined kennel keeps nothing open for drafting', me.drafts_ok === false && (await c.post('/api/litters', { breed_id: breeds[0].id })).status === 403);
const back = await c.req('POST', '/choose', new URLSearchParams({ kennel: first }), FORM);
check('Switch kennel still opens the first kennel', back.status === 303 && (await c.get('/api/me')).data.id === first);

// A person who signs in to a kennel but is not its main contact cannot add one.
const member = `member-${stamp}@breeders.test`;
await admin.post(`/api/breeders/${first}/people`, { email: member, name: 'Helper' });
const inv = sql(`SELECT link FROM dev_mailbox WHERE to_addr = ${q(member)} ORDER BY id DESC LIMIT 1`)[0];
const m = new Client(PORTAL);
await usePasswordLink(m, inv.link);
const mm = (await m.get('/api/me')).data;
check('a person on the kennel who is not its main contact is not offered Add a kennel', mm && mm.id === first && mm.can_add_kennel === false, JSON.stringify(mm && { id: mm.id, can: mm.can_add_kennel }));
check('and the route refuses them', (await m.post('/api/kennels', { ...good, business_name: `Member ${stamp}` })).status === 403);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
