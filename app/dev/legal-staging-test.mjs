// The privacy and terms pages (plan P7.1) and the staging mode (plan P7.3).
//
//   node app/dev/legal-staging-test.mjs
//       with pc-portal on 8787 and pc-admin on 8788, as for the other suites
//   STAGING_PORTAL=http://localhost:8790 node app/dev/legal-staging-test.mjs
//       also checks a second local portal started with --var DEV_MODE:staging
//
// Part 1 reads the DEV_MODE rules straight from lib/util.js and admin/identity.js. Part 2 checks
// the legal pages and the notices on the running local portal and admin. Part 1b checks migration
// 0058 (Amber's terms as the draft) on node:sqlite and the terms renderer, with no server. Part 3, when
// STAGING_PORTAL is set, checks that a staging portal shows no test notices but keeps the
// mailbox, scoped to each browser, while EMAIL_MODE is log.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { showTestNotices, isOpenHosted, isLocal } from '../lib/util.js';
import { identify } from '../admin/identity.js';
import { termsHtml } from '../portal/legal.js';

const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const ADMIN = process.env.ADMIN || 'http://localhost:8788';
const STAGING = process.env.STAGING_PORTAL || '';

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}

// ---------------------------------------------------------------- part 1, the mode rules
{
  const on = (mode) => ({ DEV_MODE: mode, TEST_GATE: 'x' });
  const req = new Request('https://portal.example.test/');
  check('staging shows no test notices, every older test mode still does',
    !showTestNotices(on('staging')) && ['local', 'hosted-test', 'hosted-open', 'hosted-access'].every((m) => showTestNotices(on(m))));
  check('production (no DEV_MODE) shows no test notices and runs no test helpers',
    !showTestNotices({}) && !isLocal(req, {}) && !isOpenHosted({}));
  check('staging keeps the open portal access rules (per-browser mailbox, own-breeder checkout)',
    isOpenHosted(on('staging')) && isLocal(req, on('staging')));
  const stand = await identify(new Request('http://localhost:8788/api/stats'),
    { DEV_MODE: 'staging', DEV_IDENTITY: 'amber@puppyconnection.test', ACCESS_TEAM_DOMAIN: 'PASTE_TEAM_DOMAIN', ACCESS_AUD: 'PASTE_APPLICATION_AUD', DB: null });
  check('staging has no operator stand-in, even on localhost with DEV_IDENTITY set', !stand.ok && stand.status === 403, stand.reason);
}

// ---------------------------------------------------------------- part 1b, Amber's terms draft (migration 0058, workplan D2)
{
  const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const schema = fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8');
  const mig = fs.readFileSync(path.join(APP, 'migrations/0058_amber_listing_terms_draft.sql'), 'utf8');
  const fresh = () => { const db = new DatabaseSync(':memory:'); db.exec(schema); return db; };
  const draftOf = (db) => db.prepare("SELECT body, updated_by FROM terms_versions WHERE version = 'draft'").get();
  const audits = (db) => db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'terms.draft' AND after_json LIKE '%0058%'").get().n;
  const seedBody = draftOf(fresh()).body;
  check("a new database starts with Amber's terms as the draft, with the PC sentence spelled out and her photo standard kept",
    seedBody.startsWith('1. Essential breeder listing terms\n1. Accurate and honest listings\n') && seedBody.includes('because Puppy Connection connects buyers and breeders')
      && !/\bPC\b/.test(seedBody) && seedBody.includes('\n\nPhoto standard. Photos must be high quality') && seedBody.endsWith('a useful, welcoming place for breeders and families to connect.')
      && !/[—–]/.test(seedBody) && !/REPLACE THIS/.test(seedBody), seedBody.slice(0, 120));
  // Staging today: the placeholder published, and the placeholder with the photo standard as the draft (migration 0032).
  const db = fresh();
  const old = "REPLACE THIS: the listing terms, in Amber's own words (build spec section 14). Nothing has been written here on her behalf.\n\nPhoto standard. Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.";
  db.prepare("UPDATE terms_versions SET body = ?, updated_by = 'setup' WHERE version = 'draft'").run(old);
  const before = db.prepare("SELECT version, body, published_at FROM terms_versions WHERE version != 'draft' ORDER BY version").all();
  const setting = () => db.prepare("SELECT value FROM settings WHERE key = 'terms_version'").get().value;
  const v0 = setting();
  db.exec(mig);
  const once = draftOf(db);
  db.exec(mig);
  check('migration 0058 writes the same draft as schema.sql over the staging placeholder, with one audit row, and a second run changes nothing',
    once.body === seedBody && once.updated_by === 'migration 0058' && draftOf(db).body === seedBody && audits(db) === 1, `${audits(db)} audit rows`);
  check('migration 0058 publishes nothing: the published versions and settings.terms_version are as they were',
    JSON.stringify(db.prepare("SELECT version, body, published_at FROM terms_versions WHERE version != 'draft' ORDER BY version").all()) === JSON.stringify(before) && setting() === v0);
  const edited = fresh();
  edited.prepare("UPDATE terms_versions SET body = 'Terms someone wrote on the Terms screen.', updated_by = 'amber@example.test' WHERE version = 'draft'").run();
  edited.exec(mig);
  check('migration 0058 leaves a draft someone already wrote alone', draftOf(edited).body === 'Terms someone wrote on the Terms screen.' && audits(edited) === 0);
  const none = fresh();
  none.exec("DELETE FROM terms_versions WHERE version = 'draft'");
  none.exec(mig);
  check('migration 0058 makes the draft on a database that has none', draftOf(none)?.body === seedBody && audits(none) === 1);
  // The renderer: her numbered lines are headings, "* " lines are lists, the rest paragraphs, all escaped.
  const h = termsHtml(seedBody);
  const h2 = h.match(/<h2>[^<]*<\/h2>/g) || [];
  check("Amber's terms render with her nine headings, two lists of seven, and paragraphs",
    h2.length === 9 && h2[0] === '<h2>1. Essential breeder listing terms</h2>' && h2[7] === '<h2>2. Protecting Puppy Connection</h2>' && h2[8] === '<h2>Puppy Connection Breeder Listing Agreement</h2>'
      && (h.match(/<ul>/g) || []).length === 2 && (h.match(/<li>/g) || []).length === 14 && h.includes('<p>By submitting a puppy listing to Puppy Connection, I confirm that:</p>')
      && h.includes('<li>No guarantee of a transaction: A listing on Puppy Connection does not guarantee a puppy&#39;s health'), h.slice(0, 300));
  check('the renderer still escapes, still marks REPLACE THIS, and keeps a plain paragraph as before',
    termsHtml('REPLACE THIS: x <b>') === '<p class="replace-block"><b>REPLACE THIS:</b> x &lt;b&gt;</p>'
      && termsHtml('Line one is a sentence.\nLine two is too.') === '<p>Line one is a sentence.<br>Line two is too.</p>'
      && termsHtml('* <script>') === '<ul><li>&lt;script&gt;</li></ul>');
  // The portal and the admin draw the terms in the browser with the same rule.
  for (const [name, file] of [['portal', 'portal/public/portal.js'], ['admin', 'admin/public/admin.js']]) {
    const src = fs.readFileSync(path.join(APP, file), 'utf8');
    const fn = src.slice(src.indexOf('function termsParas(body)'), src.indexOf('\n  }', src.indexOf('function termsParas(body)')) + 4);
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const termsParas = new Function('esc', `${fn}; return termsParas;`)(esc);
    check(`the ${name} draws Amber's terms the same way as the /terms page`, termsParas(seedBody) === termsHtml(seedBody).replace(/\n/g, ''));
  }
}

// ---------------------------------------------------------------- part 2, the local portal and admin
const get = (url, headers = {}) => fetch(url, { headers, redirect: 'manual' });
{
  const priv = await get(`${PORTAL}/privacy`);
  const p = await priv.text();
  check('/privacy answers 200', priv.status === 200, String(priv.status));
  // Launch workplan D1. The policy is written to Alex's decisions of 2026-10-24 and waits for Amber to
  // confirm it, so the banner stays and D1 stays open until she does. Then the banner comes out and
  // this check turns to its absence.
  check('/privacy says it is written and waiting for Amber to confirm it', /class="draft-flag"><b>Waiting for Amber's confirmation\./.test(p));
  check('/privacy has no open decisions and no REPLACE THIS left', !/review-note|For Amber to decide|REPLACE THIS/.test(p));
  check('/privacy covers what the system does (photo details, Google name and email, Stripe, Cloudflare, Turnstile, email, 90-day backups, closing)',
    [/where the photo was taken/, /Google tells us your name and email address/, /never sees or stores your card number/, /Cloudflare<\/b> hosts/,
      /Turnstile/, /<b>Resend<\/b> sends/, /Google Analytics/, /deleted after 90 days/, /Closing your account/].every((rx) => rx.test(p)));
  check('/privacy covers the email list, the people on an account and staff access (added 2026-10-12)',
    [/<h2>Our email list<\/h2>/, /one click takes you off the list/, /each person you add to your account/, /cannot see the email list/].every((rx) => rx.test(p)));
  check('/privacy gives the contact address Alex set, info@puppy-connection.com, for questions and closing',
    (p.match(/<a href="mailto:info@puppy-connection\.com">info@puppy-connection\.com<\/a>/g) || []).length === 2);
  check('/privacy states the retention rules of 2026-10-24: activity 2 years, payments 7 years, counts kept, unsubscribed address only, closed accounts within 30 days with the reference, notes and reports 2 years, staff kept from the email log',
    [/activity record is kept for 2 years/, /Payment records are kept for 7 years/, /breed search counts are kept, because they hold nothing about any visitor/,
      /only so it is never emailed again\. We remove your name/, /Within 30 days of your account being closed, we remove your profile, photos, videos, documents, listings, saved moms and dads, the people on your account, the reference you named and every sign-in session/,
      /Listing reports, and Puppy Connection's own notes about a breeder, are kept for 2 years/, /cannot see the email list, the record of emails sent or listing reports/,
      /payment records and the activity record are kept for the periods above/].every((rx) => rx.test(p)));
  check('/privacy describes the launch additions: breed search counting, listing reports, the photo check and puppy videos',
    [/search for a breed on the browse page/, /<h2>Reporting a listing<\/h2>/, /automated check, run on Cloudflare's AI service/, /Cloudflare Stream/].every((rx) => rx.test(p)));
  check('/privacy is kept out of search engines', /<meta name="robots" content="noindex,nofollow">/.test(p) && /noindex/.test(priv.headers.get('x-robots-tag') || ''));
  check('/privacy carries no em or en dash', !/[—–]/.test(p));
  const terms = await get(`${PORTAL}/terms`);
  const t = await terms.text();
  check('/terms answers 200, marked as waiting on Amber, with the REPLACE THIS placeholder and the version on file',
    terms.status === 200 && /Draft, waiting on Amber's own words/.test(t) && /REPLACE THIS:<\/b> the listing terms/.test(t) && /Terms version on file: [\w.-]+/.test(t));
  check('every plain portal page links to privacy and terms', /class="plain-foot"><a href="\/privacy">Privacy<\/a><a href="\/terms">/.test(t));

  const js = await (await get(`${PORTAL}/portal.js?v=9`)).text();
  check('the sign-in page and the portal shell link to privacy and terms',
    /<\/main><footer class="plain-foot"><a href="\/privacy">/.test(js) && /<footer class="work-foot"><a href="\/privacy">/.test(js));
  check('the profile submit card links to the terms page', /accept the <a href="\/terms"/.test(js));
  const index = await (await get(`${PORTAL}/`)).text();
  check('the portal page keeps noindex', /<meta name="robots" content="noindex,nofollow">/.test(index));

  const cfg = await (await get(`${PORTAL}/api/config`)).json();
  check('the local portal still says it is a test copy, and has its mailbox', cfg.notices === true && cfg.mailbox === true, JSON.stringify(cfg));
  const who = await (await get(`${ADMIN}/api/whoami`)).json();
  check('the local admin still says it is a test copy', who.notices === true && who.email_mode === 'log', JSON.stringify(who));
  const ajs = await (await get(`${ADMIN}/admin.js?v=7`)).text();
  check('the admin menu links the mailbox only while EMAIL_MODE is log', /state\.who\.email_mode === 'log' \? '<a href="\/dev\/mail"/.test(ajs));
}

// ---------------------------------------------------------------- part 3, a staging portal
if (STAGING) {
  const cfg = await (await get(`${STAGING}/api/config`)).json();
  check('staging says nothing about a test version, but keeps the mailbox while EMAIL_MODE is log',
    cfg.notices === false && cfg.mailbox === true && cfg.email_mode === 'log' && cfg.payments_mode === 'sim', JSON.stringify(cfg));
  const email = `staging-${Date.now().toString(36)}@breeders.test`;
  const start = await fetch(`${STAGING}/auth/signup`, { method: 'POST', headers: { origin: STAGING, 'content-type': 'application/json' }, body: JSON.stringify({ email, business_name: 'Staging Check Kennel' }) });
  const box = (start.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('pc_mailbox='));
  check('staging ties a sign-up to this browser for the mailbox', start.status === 200 && !!box, String(start.status));
  const mine = await (await get(`${STAGING}/dev/mail.json`, { cookie: box })).json();
  check('this browser sees its own confirmation link', mine.length >= 1 && mine.every((m) => m.to_addr === email) && !!mine[0].link, JSON.stringify(mine).slice(0, 200));
  const other = await (await get(`${STAGING}/dev/mail.json?to=${encodeURIComponent(email)}`)).json();
  check('another browser cannot read it, even by asking for the address', Array.isArray(other) && other.length === 0, JSON.stringify(other).slice(0, 200));
  const mailPage = await (await get(`${STAGING}/dev/mail`, { cookie: box })).text();
  check('the staging mailbox page is kept out of search engines', /<meta name="robots" content="noindex,nofollow">/.test(mailPage));
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
