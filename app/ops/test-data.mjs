// The test data to clear before staging becomes the production database (launch workplan B12 and
// F2, launch checklist L13). Alex decided on 2026-10-19 that the staging database becomes the
// production one once its test data is cleared, keeping the breeder pairing, the imported contacts
// and the photo work already in it.
//
// Two steps, so nothing is removed that Amber has not approved.
//
//   node app/ops/test-data.mjs list --sqlite <copy> --out <list.json>
//   node app/ops/test-data.mjs list --remote --out <list.json>
//       Reads only. Writes the list of what counts as test data, with a reason for each breeder,
//       and prints it. Amber approves it, removing any line that is not test data.
//
//   node app/ops/test-data.mjs sql --list <approved list.json> --sqlite <copy> --out <clear.sql> --keys <r2-keys.txt>
//   node app/ops/test-data.mjs sql --list <approved list.json> --remote --out <clear.sql> --keys <r2-keys.txt>
//       Reads only. Writes the SQL that removes exactly the approved breeders and everything that
//       hangs off them, in an order the foreign keys accept, plus the test mailbox, sign-ins and the
//       other rows the list names. It also writes the R2 keys of their photos and logos. Run the
//       SQL with ops/d1-apply.mjs, on a copy first (--sqlite), and delete the keys from R2 after.
//
// It removes breeders by their ids from the approved list, never "everything that is not seed
// data", because by launch a real breeder may have signed up on staging.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };

async function source() {
  if (opt('sqlite')) {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(opt('sqlite'), { readOnly: true });
    return (sql) => db.prepare(sql).all();
  }
  if (argv.includes('--remote')) {
    return (sql) => {
      if (!/^\s*SELECT/i.test(sql)) throw new Error('test-data.mjs only reads');
      const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--remote', '--json', '--config', path.join(APP, 'portal/wrangler.hosted.jsonc'), '--command', sql],
        { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).toString();
      return JSON.parse(out.slice(out.indexOf('[')))[0].results;
    };
  }
  console.error('give --sqlite <file> or --remote'); process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

// Why a breeder counts as test data. A breeder matching none of these is not listed.
function reason(b) {
  if (b.id.startsWith('demo-')) return 'a made-up demo breeder (lib/demo.js)';
  if (/^(e2e|staging|jobs|access|signin|google|legal|portal|admin|publish)-/i.test(b.email)) return `made by a test suite (${b.email.split('-')[0]}-)`;
  if (/@(breeders|families|puppyconnection)\.test$|@example\.(com|org|net)$|\.example$|@userdomain\.com$/i.test(b.email) && !b.id.startsWith('seed-')) return `a test address (${b.email})`;
  if (!b.id.startsWith('seed-') && b.status === 'pending' && !b.business_name) return 'a sign-up never finished, with no business name. Confirm it was a test before clearing';
  return null;
}

async function list() {
  const all = await source();
  const tables = new Set(all("SELECT name FROM sqlite_master WHERE type = 'table'").map((r) => r.name));
  const breeders = all(`SELECT b.id, b.email, b.status, b.created_at, COALESCE(p.business_name, '') AS business_name,
      (SELECT COUNT(*) FROM litters x WHERE x.breeder_id = b.id) AS litters,
      (SELECT COUNT(*) FROM puppies x WHERE x.breeder_id = b.id) AS puppies,
      (SELECT COUNT(*) FROM photos x WHERE x.breeder_id = b.id) AS photos,
      (SELECT COUNT(*) FROM checkouts x WHERE x.breeder_id = b.id) AS checkouts
    FROM breeders b LEFT JOIN breeder_profiles p ON p.breeder_id = b.id ORDER BY b.created_at`)
    .map((b) => ({ ...b, reason: reason(b) })).filter((b) => b.reason);
  const n = (sql) => all(sql)[0].n;
  const rows = [
    { what: 'the test mailbox', table: 'dev_mailbox', count: n('SELECT COUNT(*) AS n FROM dev_mailbox'), action: 'clear' },
    { what: 'test mailbox owners', table: 'dev_mailbox_owners', count: n('SELECT COUNT(*) AS n FROM dev_mailbox_owners'), action: 'clear' },
    { what: 'practice checkout sessions', table: 'sim_sessions', count: n('SELECT COUNT(*) AS n FROM sim_sessions'), action: 'clear' },
    { what: 'sign-in links and sessions, so every staging sign-in ends', table: 'login_tokens, sessions', count: n('SELECT (SELECT COUNT(*) FROM login_tokens) + (SELECT COUNT(*) FROM sessions) AS n'), action: 'clear' },
    { what: 'Stripe events from test mode', table: 'stripe_events', count: n('SELECT COUNT(*) AS n FROM stripe_events WHERE livemode = 0'), action: 'clear' },
    { what: 'view and click counts and breed searches, all made by testing on staging', table: 'puppy_stats, breed_searches', count: n('SELECT (SELECT COUNT(*) FROM puppy_stats) + (SELECT COUNT(*) FROM breed_searches) AS n'), action: 'clear' },
    ...(tables.has('alert_state') ? [{ what: 'the quiet-window record of test alerts', table: 'alert_state', count: n('SELECT COUNT(*) AS n FROM alert_state'), action: 'clear' }] : []),
    { what: 'the email log and the activity log, kept as records the way Reset demo data keeps them', table: 'email_log, audit_log', count: n('SELECT (SELECT COUNT(*) FROM email_log) + (SELECT COUNT(*) FROM audit_log) AS n'), action: 'keep' },
  ];
  const owners = all("SELECT email, role FROM people ORDER BY role, email");
  const testOwners = owners.filter((p) => /\.test$|@example\./i.test(p.email));
  const subsTest = n("SELECT COUNT(*) AS n FROM subscribers WHERE email LIKE '%.test' OR email LIKE '%@example.%' OR email LIKE 'e2e-%'");
  const keep = {
    imported_breeders: n("SELECT COUNT(*) AS n FROM breeders WHERE id LIKE 'seed-%'"),
    imported_puppies: n("SELECT COUNT(*) AS n FROM puppies WHERE breeder_id LIKE 'seed-%'"),
    subscribers: n('SELECT COUNT(*) AS n FROM subscribers'),
  };
  const out = { made_at: new Date().toISOString().slice(0, 19) + 'Z', breeders, rows, people_to_change: testOwners, subscribers_with_test_addresses: subsTest, keep };
  if (opt('out')) fs.writeFileSync(opt('out'), JSON.stringify(out, null, 2));
  console.log(`Test data, for approval (${opt('sqlite') ? 'copy' : 'staging'})\n`);
  console.log('Breeders, removed with their litters, puppies, photos, checkouts and payments:');
  for (const b of breeders) console.log(`  ${b.id}  ${b.business_name || '(no name)'}  ${b.email}  ${b.status}, ${b.litters} litters, ${b.puppies} puppies, ${b.photos} photos, ${b.checkouts} checkouts\n      ${b.reason}`);
  console.log('\nOther rows:');
  for (const r of rows) console.log(`  ${r.action.padEnd(5)} ${String(r.count).padStart(5)}  ${r.what} (${r.table})`);
  console.log(`\nOperators with a test address, to replace with a real one before launch: ${testOwners.map((p) => p.email).join(', ') || 'none'}`);
  console.log(`Mailing list rows with a test address: ${subsTest}`);
  console.log(`Kept: ${keep.imported_breeders} imported breeders with ${keep.imported_puppies} puppies, ${keep.subscribers} mailing list rows.`);
}

async function sql() {
  const all = await source();
  const approved = JSON.parse(fs.readFileSync(opt('list'), 'utf8'));
  const ids = approved.breeders.map((b) => b.id);
  if (ids.some((id) => id.startsWith('seed-'))) throw new Error('The list names an imported seed- breeder. Those are the Wix listings and are never test data.');
  const tables = new Set(all("SELECT name FROM sqlite_master WHERE type = 'table'").map((r) => r.name));
  const inIds = `(${ids.map(q).join(', ') || "''"})`;
  const co = `(SELECT id FROM checkouts WHERE breeder_id IN ${inIds})`;
  const clear = new Set(approved.rows.filter((r) => r.action === 'clear').flatMap((r) => r.table.split(',').map((t) => t.trim())));
  const has = (t) => tables.has(t);
  const lines = [
    `-- Clear the approved test data (launch checklist L13), made ${new Date().toISOString().slice(0, 19)}Z by ops/test-data.mjs`,
    `-- from the list made ${approved.made_at}. ${ids.length} breeders. Run with ops/d1-apply.mjs, on a copy first.`,
    'PRAGMA defer_foreign_keys = true;',
    '-- group',
    `DELETE FROM disputes WHERE checkout_id IN ${co} OR payment_intent IN (SELECT stripe_payment_intent_id FROM payments WHERE checkout_id IN ${co});`,
    `DELETE FROM payments WHERE checkout_id IN ${co};`,
    `DELETE FROM sim_sessions WHERE client_reference_id IN ${co};`,
    `DELETE FROM puppy_holds WHERE checkout_id IN ${co} OR puppy_id IN (SELECT id FROM puppies WHERE breeder_id IN ${inIds});`,
    `DELETE FROM puppy_stats WHERE puppy_id IN (SELECT id FROM puppies WHERE breeder_id IN ${inIds});`,
    `DELETE FROM checkout_items WHERE breeder_id IN ${inIds};`,
    `DELETE FROM checkouts WHERE breeder_id IN ${inIds};`,
    `DELETE FROM photos WHERE breeder_id IN ${inIds};`,
    `DELETE FROM puppy_videos WHERE breeder_id IN ${inIds};`,
    `DELETE FROM puppies WHERE breeder_id IN ${inIds};`,
    `DELETE FROM litters WHERE breeder_id IN ${inIds};`,
    ...['breeder_breeds', 'operator_notes', 'account_requests', 'listing_reports', 'breeder_members', 'breeder_references']
      .filter(has).map((t) => `DELETE FROM ${t} WHERE breeder_id IN ${inIds};`),
    `DELETE FROM sessions WHERE breeder_id IN ${inIds};`,
    `DELETE FROM breeder_profiles WHERE breeder_id IN ${inIds};`,
    `DELETE FROM breeders WHERE id IN ${inIds};`,
    // The tables the list says to clear whole.
    ...[...clear].filter(has).map((t) => (t === 'stripe_events' ? 'DELETE FROM stripe_events WHERE livemode = 0;' : `DELETE FROM ${t};`)),
  ];
  // Each mutation of the breeders above is one group, so a breeder is never half removed.
  fs.writeFileSync(opt('out'), lines.join('\n') + '\n');
  const photos = all(`SELECT r2_key FROM photos WHERE breeder_id IN ${inIds} AND r2_key IS NOT NULL`).map((r) => r.r2_key);
  const brand = all(`SELECT logo_key, kennel_key FROM breeder_profiles WHERE breeder_id IN ${inIds}`).flatMap((r) => [r.logo_key, r.kennel_key]).filter(Boolean);
  // Each upload has a card copy beside it, named <key>.card. Videos live in Stream, not R2.
  const keys = [...photos, ...brand].flatMap((k) => [k, `${k}.card`]);
  if (opt('keys')) fs.writeFileSync(opt('keys'), keys.join('\n') + (keys.length ? '\n' : ''));
  console.log(`wrote ${opt('out')}: ${lines.length - 4} statements for ${ids.length} breeders and ${clear.size} whole tables`);
  console.log(`${keys.length} R2 keys${opt('keys') ? ` in ${opt('keys')}` : ''}, to delete from puppyconnection-files after the SQL has run`);
}

if (cmd === 'list') await list();
else if (cmd === 'sql') await sql();
else { console.error('usage: test-data.mjs list|sql ... (see the top of the file)'); process.exit(1); }
