// The privacy policy and the listing terms (plan P7.1), served by the portal at /privacy and
// /terms. Both are drafts for Amber's review and say so at the top of the page.
//
// The privacy policy is written from what this code actually does. When the code changes what
// it collects, keeps or shares, change this page in the same commit. Where to look:
//   sign-in links and sessions   portal/worker.js, lib/jobs.js housekeeping (a day, a week)
//   photo metadata stripped      lib/images.js, and portal.js shrink() in the browser
//   Google                       lib/google.js, scope "openid email profile", name and email kept
//   payments                     lib/payments.js, Stripe Checkout, no card data reaches us
//   backups                      lib/jobs.js backup, 90 days in R2
//   email                        lib/mail.js, Resend (or Cloudflare Email Sending at launch)
//   view and click counts        lib/stats.js, a number per puppy per day, nothing about the visitor
//   profile extras               portal/worker.js saveExtras and uploadBrand (logo, kennel photo, breeds, Facebook)
//   people on an account         breeder_members, migrations/0010_kennel_members.sql
//   email list                   lib/subscribers.js, lib/campaigns.js, portal/worker.js subscribe (rate limit by address, not stored)
//   staff access                 admin/worker.js STAFF_ALLOWED (breeder detail includes checkouts; no email list)
//   pages set up from a breeder's own website   migrations/0014_breeder_profiles_from_sites.sql
// The terms are Amber's own words (build spec section 14). Until she supplies them the page
// shows a clearly marked placeholder, and the README pending list carries it.

import { esc } from '../lib/util.js';

const DRAFT_DATE = 'October 12, 2026';

// REPLACE THIS: the address breeders write to about privacy and closing an account. Listed in
// app/README.md under Pending. Nothing is invented here, so the page shows the placeholder.
const CONTACT = '<span class="replace">REPLACE THIS: the Puppy Connection contact email address</span>';

export function privacyPage() {
  return `<p class="draft-flag"><b>Draft for Amber's review.</b> This privacy policy is a working draft of ${DRAFT_DATE}. It describes what the breeder portal and the Puppy Connection site actually do today. It is not final until Amber has read and approved it.</p>
<div class="legal">
<h1>Privacy policy</h1>
<p>Puppy Connection is a listing service for family breeders. Breeders list their puppies with us, and families find them and contact the breeder directly. This page explains what we keep about breeders, about people on our email list and about visitors to the site, what shows publicly, and who helps us run the service.</p>

<h2>Visitors to the site</h2>
<p>You can browse every breed, breeder and puppy without an account, and the site asks you for nothing. It sets no cookies and uses no advertising or tracking tools.</p>
<p>The site counts how many times each puppy's page is opened, and how many times a visitor follows a link from it to the breeder's website, phone or email. It keeps only those numbers for each puppy for each day, and shows them to that puppy's breeder. It keeps nothing about the visitor.</p>
<p>When you contact a breeder, you do it directly with the details on the breeder's page, so that conversation does not pass through Puppy Connection. Each breeder handles what you send them under their own practices.</p>

<h2>Our email list</h2>
<p>If you join our email list, we keep your email address, the name you give if you give one, the date you joined and how you joined. You may be on the list because you signed up on this site, or because you signed up on the earlier Puppy Connection website and your address was carried over when the site moved.</p>
<p>We use the list only to email you about puppies and news from Puppy Connection. We keep a record of which of our emails were sent to your address. Every email has a link to unsubscribe, and one click takes you off the list. We keep an unsubscribed address marked as unsubscribed so it is not emailed again.</p>
<p>When you sign up, we look at the internet address the request came from to stop repeated automated sign-ups. We do not save it.</p>

<h2>What we keep when a breeder signs up</h2>
<ul>
<li>Your sign-in email address. We use it to send your sign-in codes and links and notices about your account. It is never shown on the site.</li>
<li>The business name you give when you sign up.</li>
<li>The profile you fill in, meaning your business name, the phone and email buyers can use, your website, your town and state, and the words about your kennel. A contact name is optional and stays private to Puppy Connection.</li>
<li>The email address, and the name if you give one, of each person you add to your account to help manage it.</li>
<li>Your litters and puppies, with the details and photos you add.</li>
<li>Any extras you choose to add to your profile, meaning a logo, a kennel photo, the breeds you raise and a Facebook page.</li>
<li>A record of your listing payments, meaning the amount, the date and which puppies each payment covers.</li>
<li>The date you accepted the listing terms, and which version you accepted.</li>
<li>An activity record of changes to your account and listings, showing what changed, when, and who made the change.</li>
</ul>
<p>We never ask for your street address, and we do not keep one.</p>

<h2>What shows on the public site</h2>
<p>Your business name, the phone and email you give for buyers, your website, your town and state, and the words about your kennel show on your breeder page. Any extras you add, such as your logo or Facebook page, can show there too. A puppy shows once its listing is paid for, with the details and photos you added and a link to the puppy on your own website if you have one. Your sign-in email, your contact name and the people you add to your account are never shown.</p>
<p>When Puppy Connection sets up a breeder's page before the breeder signs in, it uses only details the breeder already publishes on their own website, such as the business name, phone, email, website, town and a short description. The breeder can change or remove any of it from the portal, or ask us to.</p>

<h2>Your photos</h2>
<p>Photos taken on a phone can carry hidden details, such as where the photo was taken and what camera took it. The portal takes those details out of every photo you upload before it is saved, so they never reach the public site. Photos are also resized in your browser before they upload.</p>

<h2>Signing in</h2>
<p>You can sign in with a code and link we email to you, or with your Google account. If you use Google, Google tells us your name and email address. We use those to find or start your account, and we keep nothing else from your Google account.</p>
<p>When you ask for a sign-in code, we note the internet address the request came from, to stop misuse. Used and expired codes and links are deleted after a day, and ended sign-in sessions after a week.</p>
<p>The portal sets one cookie to keep you signed in, and a short-lived one while a Google sign-in is in progress. It uses no advertising or tracking cookies.</p>

<h2>Payments</h2>
<p>Listing payments are taken by Stripe on its own secure checkout page. Your card details go straight to Stripe. Puppy Connection never sees or stores your card number.</p>

<h2>Who can see your information</h2>
<p>Puppy Connection's owner can see breeder accounts, listings, payments and the email list to run the service. Staff who help run it can see breeder accounts, listings and each breeder's payments to approve listings, answer questions and keep the site accurate, and they cannot see the email list.</p>

<h2>Who helps us run Puppy Connection</h2>
<ul>
<li><b>Cloudflare</b> hosts the site, the portal, the database and the photos. Its Turnstile check on the sign-up form helps keep out automated sign-ups.</li>
<li><b>Stripe</b> takes listing payments.</li>
<li><b>Google</b> handles sign-in for breeders who choose to sign in with Google.</li>
<li><b>An email service</b> (Resend or Cloudflare) sends sign-in codes, account notices and our emails to the list.</li>
</ul>
<p>We do not sell your information, and we do not share it with anyone else except where the law requires it.</p>

<h2>How long we keep things</h2>
<p>We keep your account, profile and listings while your account is open. We keep an email list address until you unsubscribe, and then only as an unsubscribed address. A copy of the database is saved every night for recovery, and each nightly copy is deleted after 90 days.</p>
<p class="review-note"><b>For Amber to decide:</b> how long the activity record, payment records and daily page counts are kept, and whether an unsubscribed address is deleted after a set time. Today none of these is deleted on a schedule.</p>

<h2>Closing your account</h2>
<p>To close your account, use Ask to close my account on the Account screen of the portal, or write to ${CONTACT} from your sign-in email address. We take your listings and breeder page off the site. Records of past payments may be kept for accounting.</p>
<p class="review-note"><b>For Amber to decide:</b> what else closing an account removes, such as the profile, the photos and the people added to the account. Today Puppy Connection handles each request by hand and nothing is deleted automatically.</p>

<h2>Children</h2>
<p>Puppy Connection is meant for adults buying or selling puppies. We do not knowingly collect information from children under 13.</p>

<h2>Questions</h2>
<p>Write to ${CONTACT} with any question about this policy or the information we keep about you, or to ask us to correct or delete it.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes, we update this page and the date at the top.</p>
</div>`;
}

/**
 * The listing terms (plan P3.4). The text is the current version in terms_versions, written and
 * published from the admin's Terms screen as plain paragraphs. While it still holds a REPLACE
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

/** Plain paragraphs, blank-line separated, escaped. A REPLACE THIS paragraph is marked. */
export function termsHtml(body) {
  return String(body || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((para) => {
    const m = /^REPLACE THIS:\s*([\s\S]*)$/.exec(para);
    if (m) return `<p class="replace-block"><b>REPLACE THIS:</b> ${esc(m[1])}</p>`;
    return `<p>${esc(para).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
