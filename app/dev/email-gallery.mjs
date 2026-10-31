// Every email a breeder can receive, on one page, to show Amber how each one reads and looks.
//
//   node app/dev/email-gallery.mjs [out.html]
//
// Renders each breeder template in lib/mail.js through lib/email-html.js with made-up sample
// data, and writes one page with the subject, when it is sent and the email itself. Staff
// notices (new breeder waiting, listing reported, alerts) are left out. The default output is
// dev/email-samples/all-breeder-emails.html. Open it in a browser, or print it to PDF.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../lib/mail.js';
import { templateHtml, esc } from '../lib/email-html.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || path.join(HERE, 'email-samples', 'all-breeder-emails.html');
const env = { SITE_ORIGIN: 'https://site.puppyconnection.workers.dev', PORTAL_ORIGIN: 'https://portal.puppyconnection.workers.dev' };
const P = env.PORTAL_ORIGIN;
const K = 'Maple Brook Doodles';
const link = (t) => `${P}/auth/set-password?t=${t}`;
const photos = (id) => `${P}/#/puppies/${id}/photos`;

// [group, template, when it is sent, sample data]
const EMAILS = [
  ['Signing in', 'signup_verify', 'A breeder creates an account on the breeder portal with an email address and password.', { link: link('sample') }],
  ['Signing in', 'password_reset', 'A breeder asks for a new password from the sign-in page.', { link: link('sample') }],
  ['Signing in', 'invitation', 'Puppy Connection adds a kennel, or a person who has no password yet, and sends the invitation.', { business: K, link: link('sample'), days: 7 }],
  ['Signing in', 'invitation', 'The same invitation when Puppy Connection gives one person several kennels in one step.', { business: K, kennels: [K, 'Ibar Canine Companions', 'Heartland Mini Schnauzers'], link: link('sample'), days: 7 }],
  ['Signing in', 'member_added', 'A breeder adds another person to their kennel from the Account screen.', { business: K, by: 'Sarah Miller', link: link('sample'), days: 7 }],
  ['Signing in', 'kennel_added', 'A breeder adds someone who already has a Puppy Connection password. They confirm with that password.', { business: K, by: 'Sarah Miller', link: link('sample'), days: 7 }],
  ['Signing in', 'kennel_access', 'Puppy Connection gives someone who already has a password another kennel. It opens at once.', { business: 'Ibar Canine Companions', kennels: ['Ibar Canine Companions'], by: 'Puppy Connection', link: `${P}/` }],
  ['Your account', 'approved', 'Puppy Connection approves a new breeder.', { business: K, portalUrl: `${P}/` }],
  ['Your account', 'declined', 'Puppy Connection declines an application. The message box is optional.', { business: K, message: 'Please add photos of your kennel and your parent dogs, then apply again.' }],
  ['Your account', 'suspended', 'Puppy Connection pauses an account.', { business: K }],
  ['Your account', 'reinstated', 'Puppy Connection makes a paused account active again.', { business: K, portalUrl: `${P}/` }],
  ['Your account', 'contact_changed', 'The phone, email or website families see is changed, by the breeder or by Puppy Connection. It goes to the sign-in address.', { business: K, by: 'operator', portalUrl: `${P}/`, changes: [{ label: 'Phone', from: '574 555 0100', to: '574 555 0199' }] }],
  ['Listings', 'listings_live', 'A breeder pays for listings and the puppies go on the site.', { names: ['Clover', 'Juniper'], portalUrl: `${P}/` }],
  ['Listings', 'expiring_soon', 'A paid listing is close to its end date.', { items: [{ name: 'Clover', until: 'November 16, 2026' }], portalUrl: `${P}/` }],
  ['Listings', 'expired', 'A paid listing reaches its end date.', { names: ['Clover'], portalUrl: `${P}/` }],
  ['Listings', 'listing_refunded', 'Puppy Connection refunds a listing payment.', { names: ['Clover'], amountCents: 1499, portalUrl: `${P}/` }],
  ['Photos', 'photo_reminder', 'A listing has had no new photo for four weeks.', { items: [{ name: 'Clover', link: photos('p1') }], first: true, offlineOn: '2026-11-28', portalUrl: `${P}/` }],
  ['Photos', 'photo_reminder', 'Still no new photo after five weeks, the last reminder.', { items: [{ name: 'Clover', link: photos('p1') }], first: false, offlineOn: '2026-11-28', portalUrl: `${P}/` }],
  ['Photos', 'listing_offline', 'Six weeks with no new photo. The listing comes off the site until one is added.', { items: [{ name: 'Clover', link: photos('p1') }], freeUntil: '2026-12-26', portalUrl: `${P}/` }],
  ['Photos', 'listing_removed', 'Twelve weeks with no new photo. The listing is removed and can be relisted.', { names: ['Clover'], feeCents: 1499, portalUrl: `${P}/` }],
  ['Photos', 'photo_hold', 'Puppy Connection takes a listing off the site until better photos are added.', { puppy: 'Clover', reason: 'The photos are too blurry to see the puppy clearly.', link: photos('p1') }],
  ['Photos', 'photo_sent_back', 'Puppy Connection sends a photo back for the breeder to replace.', { puppy: 'Clover', messages: ['The puppy is hard to see in this photo.'], portalUrl: `${P}/` }],
];

const groups = [...new Set(EMAILS.map((e) => e[0]))];
const card = ([, name, when, data]) => {
  const msg = TEMPLATES[name](data);
  const html = templateHtml(env, name, msg, data);
  return `<article class="mail"><div class="meta"><p class="when">${esc(when)}</p>
<dl><dt>From</dt><dd>Puppy Connection &lt;notices@puppy-connection.com&gt;</dd><dt>Subject</dt><dd class="subj">${esc(msg.subject)}</dd></dl></div>
<iframe title="${esc(msg.subject)}" srcdoc="${esc(html)}" loading="eager"></iframe></article>`;
};

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Breeder Emails</title>
<style>
:root{--ink:#262626;--muted:#6b6457;--line:#ddd5c3;--ground:#ece6d8;--paper:#fcfcfc;--olive:#5d6b3a}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:16px/1.5 Georgia,'Times New Roman',serif}
header{max-width:720px;margin:0 auto;padding:40px 16px 8px}
h1{font-size:30px;margin:0 0 8px}
header p{margin:0 0 10px;color:var(--muted);font-family:Arial,sans-serif;font-size:15px}
nav{font-family:Arial,sans-serif;font-size:14px;margin:14px 0 0}
nav a{color:var(--olive);margin-right:16px}
section{max-width:720px;margin:0 auto;padding:16px}
h2{font-size:22px;margin:24px 0 12px;break-after:avoid}
.mail{background:var(--paper);border:1px solid var(--line);border-radius:6px;margin:0 0 24px;overflow:hidden;break-inside:avoid}
.meta{padding:14px 18px;border-bottom:1px solid var(--line);font-family:Arial,sans-serif;font-size:14px}
.when{margin:0 0 8px;color:var(--olive);font-weight:600}
dl{display:grid;grid-template-columns:64px 1fr;gap:2px 10px;margin:0}
dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}.subj{font-weight:700}
iframe{display:block;width:100%;height:700px;border:0;background:#f4f1ea}
@page{size:letter;margin:.5in}
@media print{body{background:#fff;zoom:.72}header{padding-top:0}.mail{border-color:#ccc}nav{display:none}section{break-before:page}.mail+.mail{break-before:page}h2{margin-top:0}}
</style></head><body>
<header><h1>Emails breeders receive</h1>
<p>Every email the breeder portal sends to a breeder, shown with made-up kennel and puppy names. Each one is sent automatically from notices@puppy-connection.com, and a reply goes to info@puppy-connection.com.</p>
<nav>${groups.map((g) => `<a href="#${g.toLowerCase().replace(/\W+/g, '-')}">${esc(g)}</a>`).join('')}</nav></header>
${groups.map((g) => `<section id="${g.toLowerCase().replace(/\W+/g, '-')}"><h2>${esc(g)}</h2>${EMAILS.filter((e) => e[0] === g).map(card).join('\n')}</section>`).join('\n')}
<script>
// Size each email to its own height once it has drawn.
document.querySelectorAll('iframe').forEach(function (f) {
  function fit() { try { f.style.height = f.contentDocument.documentElement.scrollHeight + 'px'; } catch (e) {} }
  f.addEventListener('load', function () { fit(); setTimeout(fit, 300); });
});
</script>
</body></html>`;

// EMAIL_GALLERY_PARTS=<folder> also writes each email on its own with a list of them, which the
// PDF copy is made from, because a printed page cannot size an email's frame to fit it.
if (process.env.EMAIL_GALLERY_PARTS) {
  const dir = process.env.EMAIL_GALLERY_PARTS; fs.mkdirSync(dir, { recursive: true });
  const list = EMAILS.map(([group, name, when, data], i) => {
    const msg = TEMPLATES[name](data); const file = `${String(i + 1).padStart(2, '0')}-${name}.html`;
    fs.writeFileSync(path.join(dir, file), templateHtml(env, name, msg, data));
    return { group, when, subject: msg.subject, file };
  });
  fs.writeFileSync(path.join(dir, 'emails.json'), JSON.stringify(list, null, 1));
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, page);
console.log(`wrote ${EMAILS.length} emails to ${OUT}`);
