// The privacy policy and the listing terms (plan P7.1), served by the portal at /privacy and
// /terms. The privacy policy is written and waits for Amber's confirmation, and says so at the
// top of the page. The terms are a draft waiting on her own words.
//
// The privacy policy is written from what this code actually does. When the code changes what
// it collects, keeps or shares, change this page in the same commit. Where to look:
//   passwords and sessions       lib/accounts.js, portal/worker.js, lib/jobs.js housekeeping (a day, a week)
//   photo metadata stripped      lib/images.js, and portal.js shrink() in the browser
//   photo quality check          lib/photocheck.js, Workers AI, the result kept on the photo row. A
//                                parent photo is checked at upload and not stored if it fails
//   puppy videos                 lib/stream.js, Cloudflare Stream
//   saved parents, documents     lib/parents.js, migrations/0050 (public docs/, private private/)
//   Google                       lib/google.js, scope "openid email profile", name and email kept
//   payments                     lib/payments.js, Stripe Checkout, no card data reaches us
//   backups                      lib/jobs.js backup, 90 days in R2
//   email                        lib/mail.js, Resend (or Cloudflare Email Sending at launch)
//   view and click counts        lib/stats.js, a number per puppy per day, nothing about the visitor
//   breed search counts          lib/stats.js, a number per breed per day, nothing about the visitor
//   report a listing             lib/reports.js, reporter email optional, owners only (not STAFF_ALLOWED)
//   profile extras               portal/worker.js saveExtras and uploadBrand (logo, kennel photo, breeds, Facebook)
//   people on an account         breeder_members, migrations/0010_kennel_members.sql
//   email list                   lib/subscribers.js, lib/campaigns.js, portal/worker.js subscribe (rate limit by address, not stored)
//   staff access                 admin/worker.js STAFF_ALLOWED (breeder detail includes checkouts; no email list, email log or reports)
//   pages set up from a breeder's own website   migrations/0014_breeder_profiles_from_sites.sql
//   how long things are kept     lib/retention.js (launch workplan D1, Alex 2026-10-24): activity 2
//                                years, payment records 7 years, counts kept, unsubscribed address
//                                only, a closed account removed 30 days after it is marked closed,
//                                operator notes and listing reports 2 years
// The terms are Amber's own words (build spec section 14). Until she supplies them the page
// shows a clearly marked placeholder, and the README pending list carries it.

import { esc } from '../lib/util.js';


// Alex, 2026-10-24. Amber confirms the address with the rest of the policy.
const CONTACT_EMAIL = 'info@puppy-connection.com';
const CONTACT = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;

export function privacyPage() {
  return `<div class="legal">
<h1>Privacy policy</h1>
<p class="small muted">Confirmed by Puppy Connection on October 25, 2026.</p>
<p>Puppy Connection is a listing service for family breeders. Breeders list their puppies with us, and families find them and contact the breeder directly. This page explains what we keep about breeders, about people on our email list and about visitors to the site, what shows publicly, who helps us run the service and how long we keep each thing.</p>

<h2>Visitors to the site</h2>
<p>You can browse every breed, breeder and puppy without an account, and the site asks you for nothing. It uses no advertising tools.</p>
<p>The site uses Google Analytics to see how visitors find it and which pages they use. Google Analytics sets cookies in your browser and sends Google the pages you open, how you reached the site, your browser and device, and your approximate location. Puppy Connection sees only totals and reports from it, never who a visitor is.</p>
<p>The site counts how many times each puppy's page is opened, and how many times a visitor follows a link from it to the breeder's website, phone or email. It keeps only those numbers for each puppy for each day, and shows them to that puppy's breeder. It keeps nothing about the visitor.</p>
<p>When you search for a breed on the browse page, the site adds one to a count for that breed for that day. Puppy Connection uses these counts to see which breeds families look for. Only the number is kept, and nothing about who searched.</p>
<p>When you contact a breeder, you do it directly with the details on the breeder's page, so that conversation does not pass through Puppy Connection. Each breeder handles what you send them under their own practices.</p>

<h2>Reporting a listing</h2>
<p>Every puppy and breeder page has a link to report the listing to Puppy Connection, for example if the details look wrong or you are worried about the animals. We keep the reason you choose, what you write and the listing it is about. Your email address is optional, and we keep it only if you give it so we can reply. We keep a report for 2 years from when it was made, and then delete it.</p>
<p>A report is emailed to Puppy Connection's owner and listed in our own tools. It is not shown on the site, and staff who help run Puppy Connection cannot see reports. The form uses Cloudflare's Turnstile check to keep out automated reports, and we look at the internet address a report came from to stop repeated reports. We do not save it.</p>

<h2>Our email list</h2>
<p>If you join our email list, we keep your email address, the name you give if you give one, the date you joined and how you joined. You may be on the list because you signed up on this site, or because you signed up on the earlier Puppy Connection website and your address was carried over when the site moved.</p>
<p>We use the list only to email you about puppies and news from Puppy Connection. We keep a record of which of our emails were sent to your address. Every email has a link to unsubscribe, and one click takes you off the list.</p>
<p>When you unsubscribe, we keep your email address marked as unsubscribed, with the date, only so it is never emailed again. We remove your name, how and when you joined, and our record of which of our emails were sent to you. If you sign up again later, the list treats you as a new sign-up.</p>
<p>When you sign up, we look at the internet address the request came from to stop repeated automated sign-ups. We do not save it.</p>

<h2>What we keep when a breeder signs up</h2>
<ul>
<li>Your sign-in email address. We use it to confirm your account, send password links and invitations, and send notices about your account. It is never shown on the site.</li>
<li>The business name you give when you sign up.</li>
<li>The profile you fill in, meaning your business name, the phone and email buyers can use, your website, your town and state, and the words about your kennel. A contact name is optional and stays private to Puppy Connection.</li>
<li>The email address, and the name if you give one, of each person you add to your account to help manage it.</li>
<li>The reference you name before your account is approved, meaning their name, who they are (for example your veterinarian) and their phone or email. Only Puppy Connection sees it, and may contact them to confirm you are a real breeder. It is never shown on the site.</li>
<li>Your litters and puppies, with the details, photos and videos you add.</li>
<li>The moms and dads you save, with their photos, registration, health testing and pedigree, and any documents you upload, such as health records, guarantees and pedigrees.</li>
<li>Any extras you choose to add to your profile, meaning a logo, a kennel photo, the breeds you raise and a Facebook page.</li>
<li>A record of your listing payments, meaning the amount, the date and which puppies each payment covers.</li>
<li>The date you accepted the listing terms, and which version you accepted.</li>
<li>An activity record of changes to your account and listings, showing what changed, when, and who made the change.</li>
<li>Notes Puppy Connection writes about your account, such as a record of a phone call with you. They are private to Puppy Connection and never shown to you or on the site.</li>
</ul>
<p>We never ask for your street address, and we do not keep one.</p>

<h2>What shows on the public site</h2>
<p>Your business name, the phone and email you give for buyers, your website, your town and state, and the words about your kennel show on your breeder page. Any extras you add, such as your logo or Facebook page, can show there too. A puppy shows once its listing is paid for, with the details, photos and videos you added and a link to the puppy on your own website if you have one. A saved mom or dad shows on the pages of their litters, and a document shows only if you mark it for families to see. Your sign-in email, your contact name, your reference and the people you add to your account are never shown.</p>
<p>When Puppy Connection sets up a breeder's page before the breeder signs in, it uses only details the breeder already publishes on their own website, such as the business name, phone, email, website, town and a short description. The breeder can change or remove any of it from the portal, or ask us to.</p>

<h2>Your photos and videos</h2>
<p>Photos taken on a phone can carry hidden details, such as where the photo was taken and what camera took it. The portal takes those details out of every photo you upload before it is saved, so they never reach the public site. Photos are also resized in your browser before they upload.</p>
<p>Each puppy photo you upload is looked at by an automated check, run on Cloudflare's AI service, to see whether the puppy can be seen clearly. We keep the result with the photo. A photo that does not pass goes back to you with the reason, or to Puppy Connection to look at, and does not show on the site until it passes. A photo of a saved mom or dad gets the same check when you upload it, and one that does not pass is not saved, so you see the reason and can upload another.</p>
<p>Puppy videos go straight from your browser to Cloudflare Stream, which stores them and plays them on the puppy's page.</p>

<h2>Signing in</h2>
<p>You sign in with your email address and a password, or with your Google account. We never store your password itself, only a scrambled form of it that cannot be turned back into the password. If you add an authenticator app, we keep the key it shares with your phone, locked with a separate key, and your recovery codes in scrambled form only. If you use Google, Google tells us your name and email address. We use those to find or start your account, and we keep nothing else from your Google account.</p>
<p>When a password or authenticator code is entered wrongly, or a password link is asked for, we note the internet address the request came from, to stop misuse. Those notes, and used and expired links, are deleted after a day, and ended sign-in sessions after a week.</p>
<p>If you turn on Puppy Connection access on your Account screen, the Puppy Connection team can open your portal to manage your listings for you. Every change they make is recorded under their own name, and turning access off ends their session straight away.</p>
<p>The portal sets one cookie to keep you signed in, and a short-lived one while a Google sign-in is in progress. It uses no advertising or tracking cookies.</p>

<h2>Payments</h2>
<p>Listing payments are taken by Stripe on its own secure checkout page. Your card details go straight to Stripe. Puppy Connection never sees or stores your card number.</p>

<h2>Who can see your information</h2>
<p>Puppy Connection's owner can see breeder accounts, listings, payments, listing reports and the email list to run the service. Staff who help run it can see breeder accounts, listings and each breeder's payments to look after breeder accounts, answer questions and keep the site accurate, and they cannot see the email list, the record of emails sent or listing reports.</p>

<h2>Who helps us run Puppy Connection</h2>
<ul>
<li><b>Cloudflare</b> hosts the site, the portal, the database, the photos and documents, and the puppy videos. Its AI service runs the photo check, and its Turnstile check on the sign-up and report forms helps keep out automated use.</li>
<li><b>Stripe</b> takes listing payments.</li>
<li><b>Google</b> handles sign-in for breeders who choose to sign in with Google, and Google Analytics counts visits to the site.</li>
<li><b>Resend</b> sends account confirmations, password links, invitations, account notices and our emails to the list.</li>
</ul>
<p>We do not sell your information, and we do not share it with anyone else except where the law requires it.</p>

<h2>How long we keep things</h2>
<ul>
<li>Your account, profile, listings, photos, videos, saved moms and dads, and documents are kept while your account is open, and removed when it closes, as the next section explains.</li>
<li>The activity record is kept for 2 years, and then each entry is deleted.</li>
<li>Payment records are kept for 7 years, and then they are deleted.</li>
<li>Listing reports, and Puppy Connection's own notes about a breeder, are kept for 2 years from when each was written, and then deleted.</li>
<li>The daily page, link and breed search counts are kept, because they hold nothing about any visitor.</li>
<li>An email list address is kept until you unsubscribe, and after that only as an unsubscribed address so it is never emailed again.</li>
<li>Sign-in records are deleted after a day, and ended sign-in sessions after a week.</li>
</ul>
<p>A copy of the database is saved every night for recovery, and each nightly copy is deleted after 90 days. Something deleted from the service can stay in those copies until they are deleted.</p>

<h2>Closing your account</h2>
<p>To close your account, use Ask to close my account on the Account screen of the portal, or write to ${CONTACT} from your sign-in email address. We confirm with you first, and then mark your account closed.</p>
<p>Within 30 days of your account being closed, we remove your profile, photos, videos, documents, listings, saved moms and dads, the people on your account, the reference you named and every sign-in session, including the stored files. Your breeder page and puppies leave the public site when it next updates. Your payment records and the activity record are kept for the periods above, together with your sign-in email address, which they belong to. Listing reports about your listings and Puppy Connection's notes about your account are kept for their 2 years too.</p>

<h2>Children</h2>
<p>Puppy Connection is meant for adults buying or selling puppies. A breeder account is for people 18 or older, and we do not knowingly collect information from anyone under 18.</p>

<h2>Questions</h2>
<p>Write to ${CONTACT} with any question about this policy or the information we keep about you, or to ask us to correct or delete it.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes, we update this page and the date at the top.</p>
</div>`;
}

/**
 * The listing terms (plan P3.4). The text is the current version in terms_versions, written and
 * published from the admin's Terms screen, and termsHtml below draws it. While it still holds a REPLACE
 * THIS placeholder the page says it is waiting on Amber's own words.
 */
export function termsPage(terms) {
  const draft = /REPLACE THIS/.test(terms.body);
  return `${draft ? `<p class="draft-flag"><b>Draft, waiting on Amber's own words.</b> The listing terms breeders accept are written by Puppy Connection. They go on this page before launch.</p>` : ''}
<div class="legal">
<h1>Listing terms</h1>
${termsHtml(terms.body)}
<p class="muted small">Terms version on file: ${esc(terms.version)}${terms.published_at ? `, published ${esc(terms.published_at.slice(0, 10))}` : ''}. A breeder accepts this version when they submit their profile for approval, and is asked again when a new version is published.</p>
<p>See also the <a href="/privacy">privacy policy</a>.</p>
</div>`;
}

/**
 * The terms text as HTML, escaped. Blocks are separated by blank lines and a REPLACE THIS block is
 * marked. Inside a block a line starting "* " is a list item, a heading line (isTermsHeading) is a
 * heading, and the other lines run together as one paragraph, broken where the text breaks. That
 * is how Amber's terms of 2026-10-25 are written. portal/public/portal.js and
 * admin/public/admin.js carry the same rule in termsParas.
 */
export function termsHtml(body) {
  return String(body || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((para) => {
    const m = /^REPLACE THIS:\s*([\s\S]*)$/.exec(para);
    if (m) return `<p class="replace-block"><b>REPLACE THIS:</b> ${esc(m[1])}</p>`;
    const out = [];
    let lines = [];
    let items = [];
    const flush = () => {
      if (lines.length) out.push(`<p>${lines.join('<br>')}</p>`);
      if (items.length) out.push(`<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`);
      lines = [];
      items = [];
    };
    for (const raw of para.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const li = /^\*\s+(.+)$/.exec(line);
      if (li) {
        if (lines.length) flush();
        items.push(esc(li[1]));
      } else if (isTermsHeading(line)) {
        flush();
        out.push(`<h2>${esc(line)}</h2>`);
      } else {
        if (items.length) flush();
        lines.push(esc(line));
      }
    }
    flush();
    return out.join('\n');
  }).join('\n');
}

/**
 * A heading in the terms text is a short line, 80 characters or fewer, with no closing
 * punctuation, such as "2. Protecting Puppy Connection". A sentence ends in a full stop or a colon.
 */
export function isTermsHeading(line) {
  return line.length <= 80 && !/[.,:;!?"')\]]$/.test(line);
}
