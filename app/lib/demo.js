// Demo data and the staging reset (plan P5.1). Three made-up breeders at different stages, for
// showing Amber how the directory works, and an operator's Reset demo data that puts staging
// back to that state.
//
// Every breeder the seed imported from Wix has an id starting "seed-". The reset removes every
// other breeder and everything hanging off them, which covers the demo breeders and anyone a
// test or a visitor signed up through the portal. It then loads the three demo breeders again.
// Seed listings, breeds, settings, terms and operators are not touched. The audit log and the
// email log are records of what happened, so they stay too.
//
// The reset works only with DEV_MODE staging, takes the nightly backup first, and needs the
// operator to type RESET DEMO. Everything here is made up: the names, the @breeders.test
// sign-in addresses, the 555-01xx phone numbers, the .example websites and the drawn pictures.

import { now, HttpError, bad } from './util.js';
import { auditStmt, dirtyStmt } from './store.js';
import { runJob } from './jobs.js';
import { DEMO_IMAGES } from './demo-images.js';

export const RESET_PHRASE = 'RESET DEMO';
const DAY = 86400000;
const NOT_SEED = "NOT LIKE 'seed-%'";

/** Whether this deployment allows the reset. Staging only, never local or production. */
export function demoResetAllowed(env) {
  return env.DEV_MODE === 'staging';
}

const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';
const dateOnly = (ms) => iso(ms).slice(0, 10);

/**
 * The three demo breeders, built against the current time so dates read naturally on any day.
 * Returns rows per table and the files the photos, logo and kennel photo need in R2.
 */
export function demoData(nowMs = Date.now()) {
  const ago = (days) => iso(nowMs - days * DAY);
  const t = iso(nowMs);
  const rows = { breeders: [], breeder_profiles: [], breeder_breeds: [], litters: [], puppies: [], photos: [],
    checkouts: [], checkout_items: [], sim_sessions: [], payments: [], puppy_stats: [], operator_notes: [] };
  const files = [];
  const image = (name, key) => {
    files.push({ key, b64: DEMO_IMAGES[name].b64, type: 'image/png' });
    return DEMO_IMAGES[name];
  };

  // 1. Signing up. Email checked, profile part filled, not yet submitted.
  rows.breeders.push({ id: 'demo-buttercup', email: 'buttercup@breeders.test', status: 'pending', email_verified_at: ago(1),
    profile_submitted_at: null, terms_version: null, terms_accepted_at: null, created_at: ago(1), updated_at: ago(1) });
  rows.breeder_profiles.push({ breeder_id: 'demo-buttercup', business_name: 'Buttercup Lane Puppies', contact_name: 'Casey Sample',
    city: 'Middlebury', state: 'IN', updated_at: ago(1) });

  // 2. Waiting for approval. Profile submitted and the current terms accepted.
  rows.breeders.push({ id: 'demo-thistledown', email: 'thistledown@breeders.test', status: 'pending', email_verified_at: ago(3),
    profile_submitted_at: ago(2), terms_version: '@current', terms_accepted_at: ago(2), created_at: ago(3), updated_at: ago(2) });
  rows.breeder_profiles.push({ breeder_id: 'demo-thistledown', business_name: 'Thistledown Pups', contact_name: 'Jordan Example',
    public_phone: '(260) 555-0142', public_email: 'hello@thistledownpups.example', city: 'Berne', state: 'IN',
    description: 'A made-up breeder for the Puppy Connection demo. We raise Cavalier King Charles Spaniels in our home, and every puppy grows up around children and a friendly old cat.',
    updated_at: ago(2) });
  rows.breeder_breeds.push({ breeder_id: 'demo-thistledown', breed_id: 'breed-cavalier-king-charles-spaniel' });

  // 3. Approved, with two litters.
  const mb = 'demo-maplebrook';
  rows.breeders.push({ id: mb, email: 'maplebrook@breeders.test', status: 'approved', email_verified_at: ago(40),
    profile_submitted_at: ago(39), terms_version: '@current', terms_accepted_at: ago(39), decided_at: ago(38), decided_by: 'demo',
    created_at: ago(40), updated_at: ago(38) });
  image('logo', `brand/${mb}/logo-demo.png`);
  image('kennel', `brand/${mb}/kennel-demo.png`);
  rows.breeder_profiles.push({ breeder_id: mb, business_name: 'Maple Brook Doodles', slug: 'maple-brook-doodles', contact_name: 'Riley Sample',
    public_phone: '(574) 555-0187', public_email: 'puppies@maplebrookdoodles.example', website_url: 'https://maplebrookdoodles.example',
    city: 'Nappanee', state: 'IN', logo_key: `brand/${mb}/logo-demo.png`, kennel_key: `brand/${mb}/kennel-demo.png`,
    description: 'A made-up breeder for the Puppy Connection demo. Our family raises Cavapoos and Mini Bernedoodles on a small farm, with the puppies inside the house from the day they are born.\n\nEvery puppy goes home with its first shots, a vet check and a small bag of the food it knows.',
    updated_at: ago(38) });
  rows.breeder_breeds.push({ breeder_id: mb, breed_id: 'breed-cavapoo' }, { breeder_id: mb, breed_id: 'breed-mini-bernedoodle' });

  rows.litters.push(
    { id: 'demo-l-maplebrook-cavapoo', breeder_id: mb, breed_id: 'breed-cavapoo', born_on: dateOnly(nowMs - 49 * DAY), ready_on: dateOnly(nowMs + 7 * DAY),
      mom_weight_lb: 14, dad_weight_lb: 11, description: 'Our spring Cavapoo litter. Mom is a cream Cavapoo and dad is an apricot Toy Poodle.', created_at: ago(30), updated_at: ago(30) },
    { id: 'demo-l-maplebrook-bernedoodle', breeder_id: mb, breed_id: 'breed-mini-bernedoodle', born_on: dateOnly(nowMs - 21 * DAY), ready_on: dateOnly(nowMs + 35 * DAY),
      mom_weight_lb: 30, dad_weight_lb: 24, description: null, created_at: ago(5), updated_at: ago(5) },
  );
  const includes = JSON.stringify(['First shots and deworming', 'Vet check', 'A small bag of food']);
  const pup = (id, litter, name, sex, color, price, extra) => ({ id, breeder_id: mb, litter_id: litter, slug: `${name.toLowerCase()}-maple-brook-doodles`,
    name, sex, color, price_cents: price, deposit_cents: 30000, description: null, includes_json: includes, hypoallergenic: 1,
    payment_state: 'unpaid', publication_state: 'draft', availability: 'available', published_at: null, created_at: ago(20), updated_at: ago(20), ...extra });
  const listed = { payment_state: 'paid', publication_state: 'published', published_at: ago(18), updated_at: ago(18) };
  rows.puppies.push(
    pup('demo-p-maple', 'demo-l-maplebrook-cavapoo', 'Maple', 'female', 'Cream', 180000,
      { ...listed, description: 'Maple is the calm one of the litter and loves to be held.' }),
    pup('demo-p-biscuit', 'demo-l-maplebrook-cavapoo', 'Biscuit', 'male', 'Apricot', 180000,
      { ...listed, availability: 'placed', updated_at: ago(4), description: 'Biscuit has found his family.' }),
    pup('demo-p-clover', 'demo-l-maplebrook-cavapoo', 'Clover', 'female', 'Chocolate', 175000, { ...listed }),
    pup('demo-p-pepper', 'demo-l-maplebrook-bernedoodle', 'Pepper', 'male', 'Tricolor', 220000, { created_at: ago(4), updated_at: ago(4) }),
    pup('demo-p-juniper', 'demo-l-maplebrook-bernedoodle', 'Juniper', 'female', 'Merle', 220000, { created_at: ago(4), updated_at: ago(4) }),
  );
  // Juniper has no photo, so she shows what a draft still needs before it can be paid for.
  [['demo-p-maple', 'puppy-cream'], ['demo-p-biscuit', 'puppy-apricot'], ['demo-p-clover', 'puppy-chocolate'], ['demo-p-pepper', 'puppy-tricolor']]
    .forEach(([pid, name], i) => {
      const key = `uploads/${mb}/${pid}-1.png`;
      const img = image(name, key);
      rows.photos.push({ id: `${pid}-1`, breeder_id: mb, puppy_id: pid, r2_key: key, content_type: 'image/png',
        bytes: Math.floor(img.b64.length * 3 / 4), position: 0, aspect: Math.round((img.w / img.h) * 1000) / 1000, created_at: ago(20 - i) });
    });

  // The three Cavapoos were listed with one practice payment of three listing fees.
  const fee = '@fee';
  rows.checkouts.push({ id: 'demo-co-maplebrook', breeder_id: mb, status: 'paid', stripe_session_id: 'cs_sim_demo_maplebrook',
    stripe_payment_intent_id: 'pi_sim_demo_maplebrook', price_id: 'price_sim_listing', quantity: 3, unit_amount_cents: fee,
    amount_total_cents: '@fee3', currency: 'usd', created_at: ago(18), expires_at: ago(18), paid_at: ago(18), fulfilled_at: ago(18) });
  for (const pid of ['demo-p-maple', 'demo-p-biscuit', 'demo-p-clover']) rows.checkout_items.push({ checkout_id: 'demo-co-maplebrook', puppy_id: pid, breeder_id: mb });
  rows.sim_sessions.push({ id: 'cs_sim_demo_maplebrook', status: 'complete', payment_status: 'paid', client_reference_id: 'demo-co-maplebrook',
    price_id: 'price_sim_listing', quantity: 3, unit_amount: fee, amount_total: '@fee3', currency: 'usd', payment_intent: 'pi_sim_demo_maplebrook',
    customer_email: 'maplebrook@breeders.test', success_url: '/checkout/success', cancel_url: '/checkout/cancel',
    created: Math.floor((nowMs - 18 * DAY) / 1000), expires_at: Math.floor((nowMs - 18 * DAY) / 1000) + 1800 });
  rows.payments.push({ stripe_payment_intent_id: 'pi_sim_demo_maplebrook', checkout_id: 'demo-co-maplebrook', stripe_charge_id: 'ch_sim_demo_maplebrook',
    amount_cents: '@fee3', status: 'succeeded', created_at: ago(18), updated_at: ago(18) });

  // A few views and clicks over the last week.
  const pattern = { 'demo-p-maple': [[6, 4], [5, 7], [3, 5], [1, 9], [0, 3]], 'demo-p-biscuit': [[6, 6], [4, 3], [2, 2]], 'demo-p-clover': [[5, 2], [2, 4], [0, 1]] };
  for (const [pid, days] of Object.entries(pattern)) {
    for (const [d, views] of days) rows.puppy_stats.push({ puppy_id: pid, day: dateOnly(nowMs - d * DAY), views, clicks: Math.floor(views / 3) });
  }

  rows.operator_notes.push({ id: 'demo-note-maplebrook', breeder_id: mb, author: 'amber@puppyconnection.test',
    body: 'Demo note, only operators see this. Called to welcome them. Riley prefers a text in the afternoon.', created_at: ago(37) });
  return { rows, files, at: t };
}

/** INSERT statements for the demo rows. @current, @fee and @fee3 are read from settings. */
export function demoStatements(env, data) {
  const out = [];
  for (const [table, list] of Object.entries(data.rows)) {
    for (const row of list) {
      const cols = Object.keys(row);
      const vals = cols.map((c) => {
        const v = row[c];
        if (v === '@current') return "(SELECT value FROM settings WHERE key = 'terms_version')";
        if (v === '@fee') return "(SELECT CAST(value AS INTEGER) FROM settings WHERE key = 'fee_cents')";
        if (v === '@fee3') return "(SELECT 3 * CAST(value AS INTEGER) FROM settings WHERE key = 'fee_cents')";
        return '?';
      });
      const binds = cols.map((c) => row[c]).filter((v) => !['@current', '@fee', '@fee3'].includes(v));
      out.push(env.DB.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')})`).bind(...binds));
    }
  }
  return out;
}

/**
 * Every statement that removes what is not seed data, in an order the foreign keys accept.
 * Sign-in links, sessions, the test mailbox, practice checkout sessions and view counts all go,
 * because each was made by someone using the portal or the site.
 */
export function wipeStatements(env) {
  const co = `(SELECT id FROM checkouts WHERE breeder_id ${NOT_SEED})`;
  return [
    'DELETE FROM puppy_stats',
    `DELETE FROM disputes WHERE checkout_id IN ${co} OR payment_intent IN (SELECT stripe_payment_intent_id FROM payments WHERE checkout_id IN ${co})`,
    `DELETE FROM payments WHERE checkout_id IN ${co}`,
    `DELETE FROM sim_sessions WHERE client_reference_id IN ${co}`,
    `DELETE FROM puppy_holds WHERE checkout_id IN ${co} OR puppy_id IN (SELECT id FROM puppies WHERE breeder_id ${NOT_SEED})`,
    `DELETE FROM checkout_items WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM checkouts WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM photos WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM puppies WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM litters WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM breeder_breeds WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM operator_notes WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM account_requests WHERE breeder_id ${NOT_SEED}`,
    'DELETE FROM sessions',
    'DELETE FROM login_tokens',
    'DELETE FROM dev_mailbox',
    'DELETE FROM dev_mailbox_owners',
    `DELETE FROM breeder_profiles WHERE breeder_id ${NOT_SEED}`,
    `DELETE FROM breeders WHERE id ${NOT_SEED}`,
  ].map((sql) => env.DB.prepare(sql));
}

/** The R2 files that belong to breeders the reset removes. */
async function filesToRemove(env) {
  const photos = (await env.DB.prepare(`SELECT r2_key FROM photos WHERE breeder_id ${NOT_SEED} AND r2_key IS NOT NULL`).all()).results.map((r) => r.r2_key);
  const brand = (await env.DB.prepare(`SELECT logo_key, kennel_key FROM breeder_profiles WHERE breeder_id ${NOT_SEED}`).all()).results
    .flatMap((r) => [r.logo_key, r.kennel_key]).filter(Boolean);
  // Each upload has a card copy beside it, named <key>.card.
  return [...photos, ...brand].flatMap((k) => [k, `${k}.card`]);
}

const b64bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

/** Put the demo pictures in R2. Their keys never change, so a second run overwrites them. */
export async function putDemoFiles(env, data) {
  for (const f of data.files) await env.FILES.put(f.key, b64bytes(f.b64), { httpMetadata: { contentType: f.type } });
}

/**
 * The operator's Reset demo data. Refuses outside staging and without the typed phrase, runs
 * the backup job and stops if it fails, then swaps everything that is not seed data for the
 * three demo breeders in one batch, so a failure leaves the database as it was.
 */
export async function resetDemo(env, who, confirm, nowMs = Date.now()) {
  if (!demoResetAllowed(env)) throw new HttpError(403, 'Reset demo data works only on the staging copy.');
  if (String(confirm || '').trim() !== RESET_PHRASE) throw bad(`Type ${RESET_PHRASE} to confirm.`);
  const backup = await runJob(env, 'backup');
  if (!backup.ok) throw new HttpError(500, `The backup did not finish, so nothing was reset. ${backup.error}`);

  const data = demoData(nowMs);
  const keep = new Set(data.files.map((f) => f.key));
  const drop = (await filesToRemove(env)).filter((k) => !keep.has(k));
  const before = {
    breeders: (await env.DB.prepare(`SELECT COUNT(*) AS n FROM breeders WHERE id ${NOT_SEED}`).first()).n,
    puppies: (await env.DB.prepare(`SELECT COUNT(*) AS n FROM puppies WHERE breeder_id ${NOT_SEED}`).first()).n,
  };
  await putDemoFiles(env, data);
  await env.DB.batch([
    ...wipeStatements(env),
    ...demoStatements(env, data),
    dirtyStmt(env),
    auditStmt(env, 'operator', who, 'demo.reset', 'site', 'demo', before, { backup: backup.key, breeders: data.rows.breeders.length }),
  ]);
  // R2 deletes take up to 1,000 keys a call. A file left behind is harmless, so this runs last.
  for (let i = 0; i < drop.length; i += 1000) await env.FILES.delete(drop.slice(i, i + 1000));
  return { ok: true, at: now(), backup: backup.key, removed: { ...before, files: drop.length }, demo_breeders: data.rows.breeders.map((b) => b.id) };
}
