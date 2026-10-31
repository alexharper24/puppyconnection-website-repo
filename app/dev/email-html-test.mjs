// The branded HTML part of every email (lib/email-html.js), on Node with no server.
//
//   node app/dev/email-html-test.mjs
//
// Renders every template in lib/mail.js and a mailing-list email, and checks each HTML part for
// the logo's full address, the button with the email's own link, the footer contacts, escaped
// input, no em or en dashes, no postal-address placeholder, and the opening line and sign-off only
// where they belong. It also checks every text part is unchanged from origin/main, and writes the
// password reset, the invitation and a sample list email to dev/email-samples/ to open in a browser.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEMPLATES } from '../lib/mail.js';
import { TEMPLATE_HTML, CONTACT, emailLogoUrl, esc, templateHtml } from '../lib/email-html.js';
import { renderCampaign, ADDRESS_NOT_SET } from '../lib/campaigns.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const SAMPLES = path.join(HERE, 'email-samples');
const BASE = process.env.BASE_REF || 'origin/main';

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}

const env = { SITE_ORIGIN: 'https://site.puppyconnection.workers.dev', PORTAL_ORIGIN: 'https://portal.puppyconnection.workers.dev' };
const LOGO = emailLogoUrl(env);
const P = env.PORTAL_ORIGIN;
const EVIL = '<script>alert(1)</script> & "Kennel"';

// Sample data for each template, with hostile input in every field a person can type.
const DATA = {
  signup_verify: { link: `${P}/auth/set-password?t=verify-token` },
  password_reset: { link: `${P}/auth/set-password?t=sample-reset-token` },
  invitation: { business: 'Sample Kennel', link: `${P}/auth/set-password?t=sample-invite-token`, days: 7 },
  member_added: { business: EVIL, by: '<img src=x onerror=alert(1)>', link: `${P}/auth/set-password?t=member-token`, days: 7 },
  kennel_access: { business: EVIL, kennels: [EVIL, 'Ibar Canine Companions'], by: 'Puppy Connection', link: `${P}/` },
  kennel_added: { business: EVIL, by: '<img src=x onerror=alert(1)>', link: `${P}/auth/set-password?t=kennel-token`, days: 7 },
  contact_changed: { business: EVIL, by: 'operator', portalUrl: `${P}/`, changes: [{ label: 'Phone', from: '<b>555</b>', to: '574 555 0100' }, { label: 'Email', from: '', to: 'new@example.com' }] },
  profile_submitted: { business: EVIL, adminUrl: 'https://admin.puppyconnection.workers.dev/#/breeders/b1' },
  approved: { business: EVIL, portalUrl: `${P}/` },
  declined: { business: EVIL, message: 'Please add <a href="javascript:alert(1)">photos</a> first.' },
  suspended: { business: EVIL },
  reinstated: { business: EVIL, portalUrl: `${P}/` },
  listings_live: { names: ['Clover', EVIL], portalUrl: `${P}/` },
  expiring_soon: { items: [{ name: EVIL, until: 'November 16, 2026' }], portalUrl: `${P}/` },
  expired: { names: [EVIL], portalUrl: `${P}/` },
  listing_refunded: { names: [EVIL], amountCents: 2500, portalUrl: `${P}/` },
  photo_reminder: { items: [{ name: EVIL, link: `${P}/#/puppies/p1/photos` }, { name: 'Clover', link: `${P}/#/puppies/p2/photos` }], first: true, offlineOn: '2026-11-16', portalUrl: `${P}/` },
  listing_offline: { items: [{ name: EVIL, link: `${P}/#/puppies/p1/photos` }], freeUntil: '2026-12-01', portalUrl: `${P}/` },
  listing_removed: { names: [EVIL], feeCents: 2500, portalUrl: `${P}/` },
  photo_hold: { puppy: EVIL, reason: '<b>Blurry</b>', link: `${P}/#/puppies/p1/photos` },
  photo_sent_back: { puppy: EVIL, messages: ['<script>x</script> The puppy is hard to see.'], portalUrl: `${P}/` },
  listing_report: { business: EVIL, puppy: 'Clover', reason: 'Other', details: '<script>alert("details")</script>\n\nSecond paragraph https://example.com/x.', reporter: 'someone@example.com', adminUrl: 'https://admin.puppyconnection.workers.dev/#/reports/r1' },
  ops_alert: { title: EVIL, detail: 'The backup job failed.\n\n<script>alert(2)</script>' },
};

// The text parts as origin/main has them, from a copy of its lib/mail.js.
async function mainTemplates() {
  const src = execFileSync('git', ['show', `${BASE}:app/lib/mail.js`], { cwd: APP }).toString()
    .replace("from './util.js'", `from '${pathToFileURL(path.join(APP, 'lib/util.js')).href}'`)
    // Since the HTML layout merged, main's mail.js imports it too, so point that at this copy's file.
    .replace("from './email-html.js'", `from '${pathToFileURL(path.join(APP, 'lib/email-html.js')).href}'`);
  const tmp = path.join(os.tmpdir(), `pc-mail-main-${process.pid}.mjs`);
  fs.writeFileSync(tmp, src);
  try { return (await import(pathToFileURL(tmp).href)).TEMPLATES; } finally { fs.rmSync(tmp, { force: true }); }
}

const DASHES = /[–—]/;
const NO_PLACEHOLDER = (h) => !/postal address|address to come|mailing address not set/i.test(h) && !h.includes(ADDRESS_NOT_SET);
const OPENER_STYLE = 'font-style:italic;font-size:21px';
const SIGNATURE = 'The Puppy Connection team';

function common(name, html) {
  check(`${name}: logo from the site by its full https address`, html.includes(`<img src="${esc(LOGO)}"`) && LOGO.startsWith('https://') && LOGO.endsWith('/img/brand/logo-white.png'));
  check(`${name}: logo alt text styled for images off`, /alt="Puppy Connection" style="[^"]*font-family:[^"]*color:#ffffff/.test(html));
  check(`${name}: footer has the email, phone, Facebook and Instagram`,
    html.includes(`mailto:${CONTACT.email}`) && html.includes(CONTACT.phone) && html.includes(`tel:${CONTACT.tel}`) && html.includes(CONTACT.facebook) && html.includes(CONTACT.instagram));
  check(`${name}: no unescaped input`, !/<script|<img src=x|<b>|<a href="javascript/i.test(html), (html.match(/<script[^]{0,60}/i) || [])[0]);
  check(`${name}: no em or en dashes`, !DASHES.test(html));
  check(`${name}: no postal-address placeholder`, NO_PLACEHOLDER(html));
  check(`${name}: 600px table layout, preheader and phone media query`, html.includes('max-width:600px') && html.includes('mso-hide:all') && html.includes('@media only screen and (max-width:480px)'));
}

const firstUrl = (text) => (text.split('\n').map((l) => l.trim()).find((l) => /^https?:\/\/\S+$/.test(l)) || null);

const main = await mainTemplates();
check('every template has its HTML settings', Object.keys(TEMPLATES).every((k) => TEMPLATE_HTML[k]) && Object.keys(TEMPLATE_HTML).every((k) => TEMPLATES[k]),
  Object.keys(TEMPLATES).filter((k) => !TEMPLATE_HTML[k]).join(', '));
check('every template has sample data here', Object.keys(TEMPLATES).every((k) => DATA[k]), Object.keys(TEMPLATES).filter((k) => !DATA[k]).join(', '));

const rendered = {};
for (const [name, make] of Object.entries(TEMPLATES)) {
  const data = DATA[name];
  const msg = make(data);
  const html = templateHtml(env, name, msg, data);
  rendered[name] = html;
  common(name, html);
  // A template added on this branch (kennel_added, workplan A27) has no text on the base to compare.
  if (main[name]) check(`${name}: text part unchanged from ${BASE}`, JSON.stringify(main[name](data)) === JSON.stringify(msg));
  else console.log(`NOTE  ${name}: new on this branch, so there is no text part on ${BASE} to compare`);
  const url = firstUrl(msg.text);
  const cfg = TEMPLATE_HTML[name];
  if (url && cfg.button) {
    check(`${name}: button "${cfg.button}" goes to the email's own link`, html.includes(`class="btn-a" href="${esc(url)}"`) && html.includes(`>${esc(cfg.button)}</a>`) && html.includes('If the button does not work'));
  } else {
    check(`${name}: no button, as the email has no link of its own`, !html.includes('class="btn-a"'));
  }
  if (cfg.staff) {
    check(`${name}: staff notice stays plain, with no opening line or sign-off`, !html.includes(OPENER_STYLE) && !html.includes(SIGNATURE));
  } else {
    check(`${name}: opening line and sign-off`, html.includes(`${OPENER_STYLE};line-height:30px;color:#262626;">${esc(cfg.opener)}</p>`) && html.includes(SIGNATURE) && !DASHES.test(cfg.opener));
  }
  check(`${name}: says it is an automatic message`, html.includes('This is an automatic message from the breeder portal.'));
}

check('password reset keeps its 1 hour promise', rendered.password_reset.includes('stops working after 1 hour') && rendered.password_reset.includes('stays as it is'));
check('invitation keeps its 7 days promise', rendered.invitation.includes('stops working after 7 days'));
check('the heading of a member notice escapes the business name', rendered.member_added.includes('You can now sign in to &lt;script&gt;'));
check('EMAIL_LOGO_URL overrides the logo address', emailLogoUrl({ ...env, EMAIL_LOGO_URL: 'https://cdn.example.com/l.png' }) === 'https://cdn.example.com/l.png');
check('without SITE_ORIGIN the logo comes from puppy-connection.com', emailLogoUrl({}) === 'https://www.puppy-connection.com/img/brand/logo-white.png');

// ---------- mailing-list email ----------
const SAMPLE = {
  subject: 'Puppy Connection has a new website',
  body: 'Hi friends, we have some happy news to share.\n\nPuppy Connection has a brand new website, and we would love for you to take a look.\n\n'
    + 'Visit the new site:\nhttps://www.puppy-connection.com/\n\nYou can browse puppies from the breeders we work with and get in touch with a breeder about a puppy you love.\n\n'
    + 'Thank you for being part of the Puppy Connection family.\n\nThe Puppy Connection team',
};
// A made-up address for the checks only. The sample file below is rendered with none set.
const ADDR = 'PO Box 100\nTest Town, IN 00000';
const list = renderCampaign(SAMPLE, { token: 'sample-unsubscribe-token', portalOrigin: P, address: ADDR, logoUrl: LOGO });
common('list email', list.html);
const unsub = `${P}/unsubscribe?t=sample-unsubscribe-token`;
check('list email: unsubscribe link and reason line', list.html.includes(`href="${esc(unsub)}"`) && list.html.includes('signed up for Puppy Connection emails.'));
check('list email: the List-Unsubscribe headers stay', list.headers['List-Unsubscribe'] === `<${unsub}>`);
check('list email: the mailing address shows in the footer when set', list.html.includes('PO Box 100<br>Test Town, IN 00000'));
check("list email: the author's greeting becomes the opening line", list.html.includes(`${OPENER_STYLE};line-height:30px;color:#262626;">Hi friends, we have some happy news to share.</p>`));
check('list email: a link on its own line becomes the button', list.html.includes('class="btn-a" href="https://www.puppy-connection.com/"') && list.html.includes('>Visit puppy-connection.com</a>'));
check('list email: text part as before', list.text === `${SAMPLE.body}\n\n--\nPuppy Connection\n${ADDR}\n\nYou're getting this because you signed up for Puppy Connection emails. To stop getting them, open this link:\n${unsub}\n`);
const contact = renderCampaign(SAMPLE, { token: 't2', portalOrigin: P, address: ADDR, status: 'contact', logoUrl: LOGO });
check('list email to a contact: its own reason line', contact.html.includes('you have been in touch with Puppy Connection.'));
const plain = renderCampaign({ subject: 'News <script>', body: 'We have news <script>alert(1)</script> for you.\n\nhttps://example.com/a' }, { token: 't3', portalOrigin: P, address: ADDR, logoUrl: LOGO });
check('list email with no greeting: no opening line is added', !plain.html.includes(OPENER_STYLE));
check('list email: input escaped', !/<script/i.test(plain.html));
const testCopy = renderCampaign(SAMPLE, { token: 'test-copy', portalOrigin: P, address: ADDRESS_NOT_SET, logoUrl: LOGO });
check('a test copy with no address set shows no placeholder in the HTML', NO_PLACEHOLDER(testCopy.html) && testCopy.text.includes(ADDRESS_NOT_SET));

// ---------- samples for Alex ----------
fs.mkdirSync(SAMPLES, { recursive: true });
fs.writeFileSync(path.join(SAMPLES, 'password-reset.html'), rendered.password_reset);
fs.writeFileSync(path.join(SAMPLES, 'invitation.html'), rendered.invitation);
fs.writeFileSync(path.join(SAMPLES, 'mailing-list.html'), renderCampaign(SAMPLE, { token: 'sample-unsubscribe-token', portalOrigin: P, address: '', logoUrl: LOGO }).html);
console.log(`\nwrote ${path.relative(APP, SAMPLES)}/password-reset.html, invitation.html, mailing-list.html`);

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
