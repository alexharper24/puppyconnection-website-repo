// The privacy and terms pages (plan P7.1) and the staging mode (plan P7.3).
//
//   node app/dev/legal-staging-test.mjs
//       with pc-portal on 8787 and pc-admin on 8788, as for the other suites
//   STAGING_PORTAL=http://localhost:8790 node app/dev/legal-staging-test.mjs
//       also checks a second local portal started with --var DEV_MODE:staging
//
// Part 1 reads the DEV_MODE rules straight from lib/util.js and admin/identity.js. Part 2 checks
// the legal pages and the notices on the running local portal and admin. Part 3, when
// STAGING_PORTAL is set, checks that a staging portal shows no test notices but keeps the
// mailbox, scoped to each browser, while EMAIL_MODE is log.

import { showTestNotices, isOpenHosted, isLocal } from '../lib/util.js';
import { identify } from '../admin/identity.js';

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
      /Turnstile/, /Resend or Cloudflare/, /deleted after 90 days/, /Closing your account/].every((rx) => rx.test(p)));
  check('/privacy covers the email list, the people on an account and staff access (added 2026-10-12)',
    [/<h2>Our email list<\/h2>/, /one click takes you off the list/, /each person you add to your account/, /cannot see the email list/].every((rx) => rx.test(p)));
  check('/privacy gives the contact address Alex set, info@puppy-connection.com, for questions and closing',
    (p.match(/<a href="mailto:info@puppy-connection\.com">info@puppy-connection\.com<\/a>/g) || []).length === 2);
  check('/privacy states the retention rules of 2026-10-24: activity 2 years, payments 7 years, counts kept, unsubscribed address only, closed accounts within 30 days',
    [/activity record is kept for 2 years/, /Payment records are kept for 7 years/, /breed search counts are kept, because they hold nothing about any visitor/,
      /only so it is never emailed again\. We remove your name/, /Within 30 days of your account being closed, we remove your profile, photos, videos, documents, listings, saved moms and dads, the people on your account and every sign-in session/,
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
  const start = await fetch(`${STAGING}/auth/start`, { method: 'POST', headers: { origin: STAGING, 'content-type': 'application/json' }, body: JSON.stringify({ email, business_name: 'Staging Check Kennel' }) });
  const box = (start.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('pc_mailbox='));
  check('staging ties a sign-up to this browser for the mailbox', start.status === 200 && !!box, String(start.status));
  const mine = await (await get(`${STAGING}/dev/mail.json`, { cookie: box })).json();
  check('this browser sees its own sign-in link', mine.length >= 1 && mine.every((m) => m.to_addr === email) && !!mine[0].link, JSON.stringify(mine).slice(0, 200));
  const other = await (await get(`${STAGING}/dev/mail.json?to=${encodeURIComponent(email)}`)).json();
  check('another browser cannot read it, even by asking for the address', Array.isArray(other) && other.length === 0, JSON.stringify(other).slice(0, 200));
  const mailPage = await (await get(`${STAGING}/dev/mail`, { cookie: box })).text();
  check('the staging mailbox page is kept out of search engines', /<meta name="robots" content="noindex,nofollow">/.test(mailPage));
}

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
