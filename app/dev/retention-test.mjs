// The retention schedule and closed-account removal (lib/retention.js, launch workplan D1), run on
// Node against the node:sqlite D1 stand-in and a folder standing in for the R2 bucket, with no
// server. Dates are moved by writing old timestamps, so nothing waits on a real clock.
//
//   node app/dev/retention-test.mjs
//
// It proves: activity older than 2 years goes and newer stays; payment records older than 7 years
// go and newer stay; page and search counts are untouched; an unsubscribed address keeps only what
// stops it being emailed again; a close resolved 29 days ago removes nothing, and one resolved 30
// days ago removes every listed thing with its files, keeps its payment and activity records, and
// leaves the export and the generated pages; a second run changes nothing; another breeder is
// untouched. Then it measures the job's own CPU, with time inside SQLite left out, and its calls.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { d1, r2, freshSchema, APP } from './node-env.mjs';
import { retentionJob, LIMITS, KEEP, cutoffs } from '../lib/retention.js';
import { exportSite } from '../lib/shape.js';
import { build } from '../build/generate.mjs';

let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

const DAY = 86400000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';
const T0 = Date.now();
const ago = (days, extraMs = 0) => iso(T0 - days * DAY - extraMs);
const yearsAgo = (y, days = 0) => { const d = new Date(T0); d.setUTCFullYear(d.getUTCFullYear() - y); return iso(d.getTime() - days * DAY); };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-retention-'));
const BYTES = new Uint8Array([1, 2, 3]);

async function seededEnv(bucketDir) {
  const db = d1();
  await freshSchema(db);
  if (!fs.existsSync(path.join(APP, '.state/seed.sql'))) execFileSync(process.execPath, [path.join(APP, 'dev/seed.mjs')]);
  await db.exec(fs.readFileSync(path.join(APP, '.state/seed.sql'), 'utf8'));
  return { DB: db, FILES: r2(bucketDir), DEV_MODE: 'local', EMAIL_MODE: 'log', STREAM_MODE: 'sim' };
}

/** A breeder with one of everything closing removes, plus the things it must keep. */
async function makeBreeder(env, id, { resolvedAt = null, name } = {}) {
  const db = env.DB, t = ago(60), slug = `${id}-kennel`;
  const put = (k) => env.FILES.put(k, BYTES, { httpMetadata: { contentType: 'image/webp' } });
  await db.batch([
    db.prepare("INSERT INTO breeders (id, email, status, created_at, updated_at, terms_version, terms_accepted_at) VALUES (?, ?, 'approved', ?, ?, 'v1', ?)").bind(id, `${id}@breeders.test`, t, t, t),
    db.prepare(`INSERT INTO breeder_profiles (breeder_id, business_name, slug, public_phone, city, state, description, logo_key, kennel_key, updated_at)
      VALUES (?, ?, ?, '574-555-0100', 'Goshen', 'IN', 'We raise a few litters.', ?, ?, ?)`).bind(id, name, slug, `brand/${id}/logo-1.webp`, `brand/${id}/kennel-1.webp`, t),
    db.prepare("INSERT INTO breeder_breeds (breeder_id, breed_id) VALUES (?, 'breed-havanese')").bind(id),
    db.prepare("INSERT INTO breeder_references (breeder_id, name, role, contact, created_at, updated_at) VALUES (?, 'Dr. Vet', 'vet', '574-555-0199', ?, ?)").bind(id, t, t),
    db.prepare("INSERT INTO breeder_members (id, breeder_id, email, name, added_by, added_at) VALUES (?, ?, ?, 'Helper', ?, ?)").bind(`${id}-m1`, id, `${id}-helper@breeders.test`, `${id}@breeders.test`, t),
    db.prepare("INSERT INTO sessions (token_hash, breeder_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)")
      .bind(`${id}-s1`, id, t, ago(-30), t, `${id}-s2`, id, t, ago(-30), t),
    db.prepare("INSERT INTO parent_dogs (id, breeder_id, sex, name, photo_key, created_at, updated_at) VALUES (?, ?, 'female', 'Mama', ?, ?, ?)").bind(`${id}-mom`, id, `parents/${id}/mom.webp`, t, t),
    db.prepare("INSERT INTO litters (id, breeder_id, breed_id, born_on, mom_id, created_at, updated_at) VALUES (?, ?, 'breed-havanese', '2026-09-01', ?, ?, ?)").bind(`${id}-lit`, id, `${id}-mom`, t, t),
    ...[0, 1].map((i) => db.prepare(`INSERT INTO puppies (id, breeder_id, litter_id, slug, name, sex, price_cents, payment_state, publication_state, availability, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'female', 150000, 'paid', 'published', 'available', ?, ?, ?)`).bind(`${id}-p${i}`, id, `${id}-lit`, `${id}-pup-${i}`, `${name} Pup ${i}`, t, t, t)),
    ...[0, 1].map((i) => db.prepare("INSERT INTO photos (id, breeder_id, puppy_id, r2_key, content_type, position, aspect, created_at) VALUES (?, ?, ?, ?, 'image/webp', 0, 1.5, ?)")
      .bind(`${id}-ph${i}`, id, `${id}-p${i}`, `uploads/${id}/${id}-ph${i}.webp`, t)),
    db.prepare("INSERT INTO puppy_videos (id, breeder_id, puppy_id, stream_uid, status, created_at) VALUES (?, ?, ?, ?, 'ready', ?)").bind(`${id}-v0`, id, `${id}-p0`, `${id}-uid0`, t),
    db.prepare("INSERT INTO documents (id, breeder_id, puppy_id, kind, title, visibility, r2_key, content_type, bytes, created_at, updated_at) VALUES (?, ?, ?, 'health', 'Vet check', 'public', ?, 'application/pdf', 3, ?, ?)")
      .bind(`${id}-d0`, id, `${id}-p0`, `docs/${id}/${id}-d0.pdf`, t, t),
    db.prepare("INSERT INTO documents (id, breeder_id, parent_id, kind, title, visibility, r2_key, content_type, bytes, created_at, updated_at) VALUES (?, ?, ?, 'pedigree', 'Pedigree', 'private', ?, 'application/pdf', 3, ?, ?)")
      .bind(`${id}-d1`, id, `${id}-mom`, `private/${id}/${id}-d1.pdf`, t, t),
    db.prepare("INSERT INTO puppy_stats (puppy_id, day, views, clicks) VALUES (?, ?, 5, 1)").bind(`${id}-p0`, ago(3).slice(0, 10)),
    // A payment that covered both puppies, two months ago, so well inside its seven years.
    db.prepare(`INSERT INTO checkouts (id, breeder_id, status, stripe_session_id, stripe_payment_intent_id, price_id, quantity, unit_amount_cents, amount_total_cents, created_at, paid_at, fulfilled_at)
      VALUES (?, ?, 'paid', ?, ?, 'price_x', 2, 1499, 2998, ?, ?, ?)`).bind(`${id}-co`, id, `${id}-cs`, `${id}-pi`, t, t, t),
    ...[0, 1].map((i) => db.prepare('INSERT INTO checkout_items (checkout_id, puppy_id, breeder_id) VALUES (?, ?, ?)').bind(`${id}-co`, `${id}-p${i}`, id)),
    db.prepare("INSERT INTO payments (stripe_payment_intent_id, checkout_id, amount_cents, status, created_at, updated_at) VALUES (?, ?, 2998, 'succeeded', ?, ?)").bind(`${id}-pi`, `${id}-co`, t, t),
    db.prepare("INSERT INTO operator_notes (id, breeder_id, author, body, created_at) VALUES (?, ?, 'amber@puppyconnection.test', 'Called them.', ?)").bind(`${id}-n`, id, t),
    db.prepare("INSERT INTO listing_reports (id, breeder_id, puppy_id, reason, details, created_at) VALUES (?, ?, ?, 'other', 'A question.', ?)").bind(`${id}-r`, id, `${id}-p1`, t),
    db.prepare("INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id) VALUES (?, 'breeder', ?, 'profile.update', 'breeder', ?)").bind(ago(40), `${id}@breeders.test`, id),
    ...(resolvedAt ? [
      db.prepare("INSERT INTO account_requests (id, breeder_id, kind, reason, created_at, resolved_at, resolved_by) VALUES (?, ?, 'close', 'Retiring', ?, ?, 'amber@puppyconnection.test')").bind(`${id}-ar`, id, ago(45), resolvedAt),
    ] : []),
  ]);
  for (const k of [`brand/${id}/logo-1.webp`, `brand/${id}/logo-1.webp.card`, `brand/${id}/kennel-1.webp`, `brand/${id}/kennel-1.webp.card`,
    `uploads/${id}/${id}-ph0.webp`, `uploads/${id}/${id}-ph0.webp.card`, `uploads/${id}/${id}-ph1.webp`,
    // A file no row names any more, as a replaced upload whose delete failed would leave.
    `uploads/${id}/orphan.webp`,
    `parents/${id}/mom.webp`, `parents/${id}/mom.webp.card`, `docs/${id}/${id}-d0.pdf`, `private/${id}/${id}-d1.pdf`, `videos/${id}-uid0`]) await put(k);
}

const BREEDER_TABLES = {
  breeder_profiles: 'breeder_id', breeder_breeds: 'breeder_id', breeder_members: 'breeder_id', sessions: 'breeder_id', parent_dogs: 'breeder_id',
  litters: 'breeder_id', puppies: 'breeder_id', photos: 'breeder_id', puppy_videos: 'breeder_id', documents: 'breeder_id',
  checkouts: 'breeder_id', checkout_items: 'breeder_id', breeder_references: 'breeder_id', operator_notes: 'breeder_id', listing_reports: 'breeder_id',
  account_requests: 'breeder_id', breeders: 'id',
};
async function countsFor(env, id) {
  const out = {};
  for (const [t, col] of Object.entries(BREEDER_TABLES)) out[t] = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE ${col} = ?`).bind(id).first()).n;
  out.puppy_stats = (await env.DB.prepare('SELECT COUNT(*) AS n FROM puppy_stats WHERE puppy_id LIKE ?').bind(`${id}-%`).first()).n;
  out.payments = (await env.DB.prepare('SELECT COUNT(*) AS n FROM payments WHERE checkout_id = ?').bind(`${id}-co`).first()).n;
  out.audit = (await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity = 'breeder' AND entity_id = ? AND action != 'account.removed'").bind(id).first()).n;
  return out;
}
const filesOf = (env, id) => [...env.FILES.map.keys()].filter((k) => k.includes(`/${id}/`) || k === `videos/${id}-uid0`).sort();

/** Every row of every table, for "a second run changes nothing". */
async function dump(env) {
  const tables = (await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()).results.map((r) => r.name);
  const out = {};
  for (const t of tables) out[t] = JSON.stringify((await env.DB.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all()).results);
  return out;
}

async function siteText(env, tag) {
  const exp = await exportSite(env);
  const dataDir = path.join(TMP, `data-${tag}`), out = path.join(TMP, `out-${tag}`);
  for (const [p, text] of Object.entries(exp.files)) {
    const f = path.join(dataDir, p);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, text);
  }
  build({ dataDir, out, guides: path.join(APP, 'dev/fixtures/guides') });
  const pages = {};
  for (const f of fs.readdirSync(out)) if (f.endsWith('.html')) pages[f] = fs.readFileSync(path.join(out, f), 'utf8');
  return { exportText: Object.values(exp.files).join('\n'), pages };
}

async function main() {
  const bucket = path.join(TMP, 'bucket');
  const env = await seededEnv(bucket);
  const db = env.DB;

  // ------------------------------------------------------------ the set-up
  // C closed 30 days ago (a minute past, so the clock cannot tick it back inside), D 29 days ago, E never.
  await makeBreeder(env, 'ret-c', { resolvedAt: ago(30, 60000), name: 'Closing Kennel' });
  await makeBreeder(env, 'ret-d', { resolvedAt: ago(29), name: 'Waiting Kennel' });
  await makeBreeder(env, 'ret-e', { name: 'Staying Kennel' });
  const t = iso(T0);
  await db.batch([
    // Activity on both sides of two years.
    db.prepare("INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id) VALUES (?, 'system', 'test', 'old.thing', 'site', 'old'), (?, 'system', 'test', 'old.thing', 'site', 'old2'), (?, 'system', 'test', 'recent.thing', 'site', 'recent')")
      .bind(yearsAgo(2, 1), yearsAgo(2, 400), yearsAgo(2, -1)),
    // Payment records on both sides of seven years, for the breeder who stays.
    ...[['ret-e-old', yearsAgo(7, 1)], ['ret-e-new', yearsAgo(7, -1)]].flatMap(([co, at]) => [
      db.prepare(`INSERT INTO checkouts (id, breeder_id, status, stripe_session_id, stripe_payment_intent_id, price_id, quantity, unit_amount_cents, amount_total_cents, created_at, paid_at)
        VALUES (?, 'ret-e', 'paid', ?, ?, 'price_x', 1, 1499, 1499, ?, ?)`).bind(co, `${co}-cs`, `${co}-pi`, at, at),
      db.prepare("INSERT INTO checkout_items (checkout_id, puppy_id, breeder_id) VALUES (?, 'ret-e-p0', 'ret-e')").bind(co),
      db.prepare("INSERT INTO payments (stripe_payment_intent_id, checkout_id, amount_cents, status, created_at, updated_at) VALUES (?, ?, 1499, 'dispute_won', ?, ?)").bind(`${co}-pi`, co, at, at),
      db.prepare("INSERT INTO disputes (id, payment_intent, checkout_id, status, opened_at, updated_at) VALUES (?, ?, ?, 'won', ?, ?)").bind(`${co}-dp`, `${co}-pi`, co, at, at),
      db.prepare("INSERT INTO stripe_events (event_id, type, livemode, received_at) VALUES (?, 'checkout.session.completed', 0, ?)").bind(`${co}-ev`, at),
    ]),
    // Page and search counts, old and new.
    db.prepare("INSERT INTO puppy_stats (puppy_id, day, views, clicks) VALUES ('ret-e-p1', ?, 9, 2), ('ret-e-p1', ?, 4, 0)").bind(yearsAgo(8).slice(0, 10), ago(1).slice(0, 10)),
    db.prepare("INSERT INTO breed_searches (breed_id, day, searches) VALUES ('breed-havanese', ?, 12), ('breed-havanese', ?, 3)").bind(yearsAgo(8).slice(0, 10), ago(1).slice(0, 10)),
    // The mailing list: one who unsubscribed through an import, one still subscribed, and a finished email to both.
    db.prepare(`INSERT INTO subscribers (id, email, name, source, status, unsub_token, created_at, unsubscribed_at, import_batch) VALUES
      ('sub-gone', 'gone@family.test', 'Gone Family', 'import', 'unsubscribed', 'tok-gone', ?, ?, 'batch-1'),
      ('sub-here', 'here@family.test', 'Here Family', 'site', 'subscribed', 'tok-here', ?, NULL, NULL)`).bind(ago(300), ago(10), ago(300)),
    db.prepare("INSERT INTO campaigns (id, subject, body, status, created_by, created_at, updated_at, total, sent_count) VALUES ('camp-1', 'News', 'Hello', 'sent', 'amber@puppyconnection.test', ?, ?, 2, 2), ('camp-2', 'More', 'Hello', 'sending', 'amber@puppyconnection.test', ?, ?, 2, 0)").bind(ago(20), ago(20), t, t),
    db.prepare("INSERT INTO campaign_sends (campaign_id, subscriber_id, status, sent_at) VALUES ('camp-1', 'sub-gone', 'sent', ?), ('camp-1', 'sub-here', 'sent', ?), ('camp-2', 'sub-gone', 'pending', NULL), ('camp-2', 'sub-here', 'pending', NULL)").bind(ago(20), ago(20)),
    db.prepare("INSERT INTO email_log (to_addr, template, sent_at, status) VALUES ('gone@family.test', 'campaign', ?, 'sent'), ('here@family.test', 'campaign', ?, 'sent'), ('gone@family.test', 'signin', ?, 'sent')").bind(ago(20), ago(20), ago(20)),
  ]);

  const before = { c: await countsFor(env, 'ret-c'), d: await countsFor(env, 'ret-d'), e: await countsFor(env, 'ret-e') };
  const filesBefore = { c: filesOf(env, 'ret-c'), d: filesOf(env, 'ret-d'), e: filesOf(env, 'ret-e') };
  const siteBefore = await siteText(env, 'before');
  check('before the run, all three breeders are in the export and have a generated page',
    ['ret-c-kennel', 'ret-d-kennel', 'ret-e-kennel'].every((s) => siteBefore.exportText.includes(s) && Object.keys(siteBefore.pages).some((f) => f.includes(s))),
    Object.keys(siteBefore.pages).filter((f) => f.startsWith('breeder-')).join(', '));
  const auditMaxBefore = (await db.prepare('SELECT MAX(id) AS n FROM audit_log').first()).n;
  const countsBefore = {
    stats: JSON.stringify((await db.prepare("SELECT * FROM puppy_stats WHERE puppy_id NOT LIKE 'ret-c-%' ORDER BY puppy_id, day").all()).results),
    searches: JSON.stringify((await db.prepare('SELECT * FROM breed_searches ORDER BY breed_id, day').all()).results),
  };

  // ------------------------------------------------------------ the first run
  const r1 = await retentionJob(env);
  check('the run reports one account removed and none waiting', r1.accounts_removed === 1 && r1.accounts_waiting === 0, JSON.stringify(r1));

  // Activity
  const cut = cutoffs(T0);
  const oldAudit = (await db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'old.thing'").first()).n;
  const newAudit = (await db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'recent.thing'").first()).n;
  check(`activity older than ${KEEP.auditYears} years is deleted and activity a day inside it stays`, oldAudit === 0 && newAudit === 1 && r1.activity_deleted === 2, JSON.stringify({ oldAudit, newAudit, deleted: r1.activity_deleted }));
  const runRows = (await db.prepare("SELECT action, after_json FROM audit_log WHERE actor = 'retention' ORDER BY id").all()).results;
  check('the run wrote one audit row per account removed and one per batch deleted, and kept every one of them',
    runRows.filter((x) => x.action === 'account.removed').length === 1 && runRows.filter((x) => x.action === 'retention.activity_deleted').length === 1
      && runRows.filter((x) => x.action === 'retention.payments_deleted').length === 1 && runRows.filter((x) => x.action === 'retention.payment_events_deleted').length === 1
      && runRows.filter((x) => x.action === 'retention.unsubscribed_tidied').length === 1,
    runRows.map((x) => x.action).join(', '));
  check('the activity rows the run wrote all sit above the highest id that existed before it', (await db.prepare("SELECT MIN(id) AS n FROM audit_log WHERE actor = 'retention'").first()).n > auditMaxBefore);

  // Payments
  const co = async (id) => (await db.prepare('SELECT COUNT(*) AS n FROM checkouts WHERE id = ?').bind(id).first()).n;
  const kids = async (id) => ['checkout_items', 'payments', 'disputes'].map((tb) => db.prepare(`SELECT COUNT(*) AS n FROM ${tb} WHERE checkout_id = ?`).bind(id)).reduce(async (a, s) => (await a) + (await s.first()).n, Promise.resolve(0));
  const ev = async (id) => (await db.prepare('SELECT COUNT(*) AS n FROM stripe_events WHERE event_id = ?').bind(id).first()).n;
  check(`payment records older than ${KEEP.paymentYears} years are deleted with their items, payment, dispute and Stripe event`,
    (await co('ret-e-old')) === 0 && (await kids('ret-e-old')) === 0 && (await ev('ret-e-old-ev')) === 0 && r1.checkouts_deleted === 1);
  check('payment records a day inside seven years stay, with their items, payment, dispute and Stripe event',
    (await co('ret-e-new')) === 1 && (await kids('ret-e-new')) === 3 && (await ev('ret-e-new-ev')) === 1);

  // Counts
  check('page counts and breed search counts are untouched, however old',
    JSON.stringify((await db.prepare("SELECT * FROM puppy_stats WHERE puppy_id NOT LIKE 'ret-c-%' ORDER BY puppy_id, day").all()).results) === countsBefore.stats
      && JSON.stringify((await db.prepare('SELECT * FROM breed_searches ORDER BY breed_id, day').all()).results) === countsBefore.searches);

  // Mailing list
  const gone = await db.prepare("SELECT * FROM subscribers WHERE id = 'sub-gone'").first();
  check('an unsubscribed address keeps its address, state, date and unsubscribe link, and loses its name, import batch and join date',
    gone.email === 'gone@family.test' && gone.status === 'unsubscribed' && gone.unsubscribed_at && gone.unsub_token === 'tok-gone'
      && gone.name === null && gone.import_batch === null && gone.created_at === gone.unsubscribed_at, JSON.stringify(gone));
  const goneSends = (await db.prepare("SELECT campaign_id FROM campaign_sends WHERE subscriber_id = 'sub-gone' ORDER BY campaign_id").all()).results.map((x) => x.campaign_id).join(',');
  const goneLog = (await db.prepare("SELECT template FROM email_log WHERE to_addr = 'gone@family.test' ORDER BY id").all()).results.map((x) => x.template).join(',');
  check("its record of finished list emails and their email log lines go, and a send still in progress keeps its row so the totals add up",
    goneSends === 'camp-2' && goneLog === 'signin', JSON.stringify({ goneSends, goneLog }));
  const here = await db.prepare("SELECT * FROM subscribers WHERE id = 'sub-here'").first();
  check('a subscribed address is untouched, with its sends and log lines',
    here.name === 'Here Family' && (await db.prepare("SELECT COUNT(*) AS n FROM campaign_sends WHERE subscriber_id = 'sub-here'").first()).n === 2
      && (await db.prepare("SELECT COUNT(*) AS n FROM email_log WHERE to_addr = 'here@family.test'").first()).n === 1);

  // The closed account
  const after = { c: await countsFor(env, 'ret-c'), d: await countsFor(env, 'ret-d'), e: await countsFor(env, 'ret-e') };
  const gonePart = ['breeder_profiles', 'breeder_breeds', 'breeder_members', 'sessions', 'parent_dogs', 'litters', 'puppies', 'photos', 'puppy_videos', 'documents'];
  check('a close resolved 30 days ago removes the profile, breeds raised, people, sessions, saved parents, litters, puppies, photos, videos and documents',
    gonePart.every((tb) => before.c[tb] > 0 && after.c[tb] === 0), JSON.stringify(after.c));
  check("its R2 files go: photos and card copies, logo, kennel photo, parent photo, both documents, the video and a file no row named",
    filesBefore.c.length === 13 && filesOf(env, 'ret-c').length === 0 && !fs.existsSync(path.join(bucket, 'uploads', 'ret-c', 'orphan.webp')),
    filesOf(env, 'ret-c').join(', '));
  check('its payment records stay, and still say which puppies each payment covered',
    after.c.checkouts === 1 && after.c.checkout_items === 2 && after.c.payments === 1
      && (await db.prepare("SELECT group_concat(puppy_name, '|') AS n FROM (SELECT puppy_name FROM checkout_items WHERE checkout_id = 'ret-c-co' ORDER BY puppy_name)").first()).n === 'Closing Kennel Pup 0|Closing Kennel Pup 1');
  check('its activity record stays, with one row for the removal',
    after.c.audit === before.c.audit && (await db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'account.removed' AND entity_id = 'ret-c'").first()).n === 1);
  check('nothing else of the account is deleted: the breeder row, reference, notes, reports and the close request stay',
    ['breeders', 'breeder_references', 'operator_notes', 'listing_reports', 'account_requests'].every((tb) => after.c[tb] === before.c[tb]), JSON.stringify(after.c));
  const cRow = await db.prepare("SELECT b.status, b.status_reason, ar.removed_at FROM breeders b JOIN account_requests ar ON ar.breeder_id = b.id WHERE b.id = 'ret-c'").first();
  check('the account is suspended with the reason, the request records the removal, and the site is marked to publish',
    cRow.status === 'suspended' && /closed/i.test(cRow.status_reason) && cRow.removed_at && (await db.prepare('SELECT dirty FROM site_state WHERE id = 1').first()).dirty === 1, JSON.stringify(cRow));
  check("the closed account's own page counts went with its puppies", after.c.puppy_stats === 0 && before.c.puppy_stats === 1);

  // 29 days and the other breeder
  check('a close resolved 29 days ago removes nothing', JSON.stringify(after.d) === JSON.stringify(before.d) && JSON.stringify(filesOf(env, 'ret-d')) === JSON.stringify(filesBefore.d), JSON.stringify(after.d));
  const eExpect = { ...before.e, checkouts: before.e.checkouts - 1, checkout_items: before.e.checkout_items - 1 };
  check('the other breeder is untouched apart from its one payment past seven years',
    JSON.stringify(after.e) === JSON.stringify(eExpect) && JSON.stringify(filesOf(env, 'ret-e')) === JSON.stringify(filesBefore.e), JSON.stringify({ before: before.e, after: after.e }));

  // The site
  const siteAfter = await siteText(env, 'after');
  check('the closed breeder and its puppies are gone from the export and from every generated page',
    !siteAfter.exportText.includes('ret-c') && !Object.entries(siteAfter.pages).some(([f, html]) => f.includes('ret-c') || html.includes('Closing Kennel')));
  check('the other two breeders are still in the export and on their pages',
    ['ret-d-kennel', 'ret-e-kennel'].every((s) => siteAfter.exportText.includes(s) && Object.keys(siteAfter.pages).some((f) => f.includes(s))));

  // ------------------------------------------------------------ the second run
  const snap = await dump(env);
  const keys = [...env.FILES.map.keys()].sort().join('\n');
  const r2nd = await retentionJob(env);
  const snap2 = await dump(env);
  const changed = Object.keys(snap).filter((tb) => snap[tb] !== snap2[tb]);
  check('a second run changes nothing in any table or in the bucket', !changed.length && keys === [...env.FILES.map.keys()].sort().join('\n') && r2nd.accounts_removed === 0,
    `${changed.join(', ')} ${JSON.stringify(r2nd)}`);

  // ------------------------------------------------------------ the 29-day account a day later
  const r3 = await retentionJob(env, { nowMs: T0 + DAY + 60000 });
  check('a day later the 29-day account is removed too', r3.accounts_removed === 1 && (await countsFor(env, 'ret-d')).puppies === 0 && filesOf(env, 'ret-d').length === 0, JSON.stringify(r3));

  // ------------------------------------------------------------ caps
  // Seven closed accounts, each with two videos, against caps of two accounts and five videos a run.
  for (let i = 0; i < 7; i += 1) {
    await makeBreeder(env, `cap-${i}`, { resolvedAt: ago(40), name: `Cap ${i}` });
    await db.prepare("INSERT INTO puppy_videos (id, breeder_id, puppy_id, stream_uid, status, created_at) VALUES (?, ?, ?, ?, 'ready', ?)").bind(`cap-${i}-v1`, `cap-${i}`, `cap-${i}-p1`, `cap-${i}-uid1`, t).run();
  }
  let runs = 0, removed = 0, maxVideos = 0;
  while (runs < 10) {
    const n0 = (await db.prepare("SELECT COUNT(*) AS n FROM puppy_videos WHERE breeder_id LIKE 'cap-%'").first()).n;
    const r = await retentionJob(env, { nowMs: T0 + DAY + 60000 });
    const n1 = (await db.prepare("SELECT COUNT(*) AS n FROM puppy_videos WHERE breeder_id LIKE 'cap-%'").first()).n;
    maxVideos = Math.max(maxVideos, n0 - n1);
    runs += 1; removed += r.accounts_removed;
    if (r.accounts_removed + r.accounts_waiting > LIMITS.accounts) { check('a run never takes more accounts than its cap', false, JSON.stringify(r)); break; }
    if (!r.accounts_removed && !r.accounts_waiting) break;
  }
  check(`the caps hold: at most ${LIMITS.accounts} accounts and ${LIMITS.videos} videos a run, and the rest wait for later runs (${runs} runs for 7 accounts)`,
    removed === 7 && maxVideos <= LIMITS.videos && runs >= 4, JSON.stringify({ removed, maxVideos, runs }));

  // ------------------------------------------------------------ cost
  await cost();

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
}

/**
 * The job's own time on Node with the time inside SQLite and the bucket left out, because D1 and
 * R2 do that work elsewhere. process.cpuUsage counts in steps of about 15 ms on Windows, too coarse
 * for a job this small, so each run is timed with the high-resolution clock and the time spent
 * inside each D1 and R2 call is taken off. What is left is the job's own JavaScript plus the await
 * overhead, an upper bound on its CPU. Also the D1 and R2 calls of a run, which count toward the
 * 1,000 Cloudflare service calls a Free invocation allows, and the video deletes, which at Stream
 * count toward its 50 outside requests.
 */
async function cost() {
  const runs = 30;
  const counted = (env) => {
    const n = { d1: 0, r2: 0, inside: 0 };
    const db = env.DB, files = env.FILES;
    const timedCall = async (key, fn) => { n[key] += 1; const a = performance.now(); try { return await fn(); } finally { n.inside += performance.now() - a; } };
    const wrapStmt = (s) => new Proxy(s, { get(o, k) {
      if (k === 'bind') return (...a) => wrapStmt(o.bind(...a));
      if (['first', 'all', 'run'].includes(k)) return (...a) => timedCall('d1', () => o[k](...a));
      return o[k];
    } });
    env.DB = { ...db, prepare: (sql) => wrapStmt(db.prepare(sql)), batch: (st) => timedCall('d1', () => db.batch(st)), timing: db.timing };
    env.FILES = { ...files, list: (...a) => timedCall('r2', () => files.list(...a)), delete: (...a) => timedCall('r2', () => files.delete(...a)) };
    return n;
  };
  const own = async (n, fn) => { n.d1 = 0; n.r2 = 0; n.inside = 0; const a = performance.now(); await fn(); return { ms: performance.now() - a - n.inside, d1: n.d1, r2: n.r2 }; };
  const busy = [], idle = [];
  for (let i = 0; i < runs; i += 1) {
    const env = await seededEnv(null);
    // A heavy morning: two accounts to remove, a full batch of old activity, a batch of old payments, an unsubscribe to tidy.
    await makeBreeder(env, 'cost-a', { resolvedAt: ago(31), name: 'Cost A' });
    await makeBreeder(env, 'cost-b', { resolvedAt: ago(31), name: 'Cost B' });
    const old = yearsAgo(3);
    const rows = Array.from({ length: 200 }, () => "(?, 'system', 't', 'old', 'site', 'x')").join(',');
    for (let j = 0; j < 5; j += 1) await env.DB.prepare(`INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id) VALUES ${rows}`).bind(...Array(200).fill(old)).run();
    for (let j = 0; j < LIMITS.checkoutBatch; j += 1) {
      await env.DB.prepare("INSERT INTO checkouts (id, breeder_id, status, price_id, quantity, unit_amount_cents, amount_total_cents, created_at) VALUES (?, 'cost-a', 'paid', 'p', 1, 1499, 1499, ?)").bind(`old-${j}`, yearsAgo(8)).run();
    }
    await env.DB.prepare("INSERT INTO subscribers (id, email, name, source, status, unsub_token, created_at, unsubscribed_at, import_batch) VALUES ('s1', 's1@f.test', 'S', 'import', 'unsubscribed', 't1', ?, ?, 'b')").bind(ago(100), ago(1)).run();
    const n = counted(env);
    busy.push(await own(n, () => retentionJob(env)));
    idle.push(await own(n, () => retentionJob(env)));
    env.DB.close?.();
  }
  // The first few runs include Node compiling the code, which a warm Worker has done already, so the median is reported.
  const med = (xs) => { const s = xs.map((x) => x.ms).sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
  const busyMs = med(busy), idleMs = med(idle), busyCalls = busy[0], idleCalls = idle[0];
  console.log(`
retention job's own time on Node, D1 and R2 time left out, median of ${runs} runs:`);
  console.log(`  a heavy morning (2 accounts removed, 1,000 old activity rows, ${LIMITS.checkoutBatch} old checkouts, 1 unsubscribe): ${busyMs.toFixed(2)} ms, ${busyCalls.d1} D1 calls, ${busyCalls.r2} R2 calls, 2 video deletes`);
  console.log(`  a morning with nothing to do: ${idleMs.toFixed(2)} ms, ${idleCalls.d1} D1 calls, ${idleCalls.r2} R2 calls`);
  check('the job stays well inside the Free plan: under 3 ms of its own time on a heavy morning, and under 60 Cloudflare service calls',
    busyMs < 3 && busyCalls.d1 + busyCalls.r2 < 60, JSON.stringify({ busyMs, idleMs, busyCalls, idleCalls }));
  // The steady-state reads use an index rather than reading a whole table every morning.
  const env = await seededEnv(null);
  const plan = async (sql, ...b) => (await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).bind(...b).all()).results.map((r) => r.detail).join(' | ');
  const c = cutoffs();
  const plans = {
    audit: await plan('SELECT id FROM audit_log WHERE at < ? AND id <= ? ORDER BY at, id LIMIT 1000', c.audit, 1e9),
    checkouts: await plan('SELECT id FROM checkouts WHERE created_at < ? ORDER BY created_at, id LIMIT 40', c.payment),
    events: await plan('SELECT 1 FROM stripe_events WHERE received_at < ? LIMIT 500', c.payment),
    log: await plan("SELECT e.id FROM subscribers s JOIN email_log e ON e.to_addr = s.email WHERE s.status = 'unsubscribed' AND e.template = 'campaign' LIMIT 1000"),
  };
  check('the daily reads of the activity record, checkouts, Stripe events and email log go through an index, not a whole-table scan',
    !/SCAN (audit_log|checkouts|stripe_events|e)\b(?! USING)/.test(Object.values(plans).join(' | ')), JSON.stringify(plans));
}

main().catch((e) => { console.error(e); process.exit(1); });
