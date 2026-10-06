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
// The terms are Amber's own words (build spec section 14). Until she supplies them the page
// shows a clearly marked placeholder, and the README pending list carries it.

import { esc } from '../lib/util.js';

const DRAFT_DATE = 'October 5, 2026';

// REPLACE THIS: the address breeders write to about privacy and closing an account. Listed in
// app/README.md under Pending. Nothing is invented here, so the page shows the placeholder.
const CONTACT = '<span class="replace">REPLACE THIS: the Puppy Connection contact email address</span>';

export function privacyPage() {
  return `<p class="draft-flag"><b>Draft for Amber's review.</b> This privacy policy is a working draft of ${DRAFT_DATE}. It describes what the breeder portal and the Puppy Connection site actually do today. It is not final until Amber has read and approved it.</p>
<div class="legal">
<h1>Privacy policy</h1>
<p>Puppy Connection is a listing service for small family breeders. This page explains what we keep about breeders who use the portal, what shows on the public site, and who helps us run it.</p>

<h2>What we keep when you sign up</h2>
<ul>
<li>Your sign-in email address. We use it to send your sign-in links and notices about your account. It is never shown on the site.</li>
<li>The business name you give when you sign up.</li>
<li>The profile you fill in. That is your business name, the phone and email buyers can use, your website, your town and state, and the words about your kennel. A contact name is optional and stays private to Puppy Connection.</li>
<li>Your litters and puppies, with the details and photos you add.</li>
<li>Any extras you choose to add to your profile, meaning a logo, a kennel photo, the breeds you raise and a Facebook page.</li>
<li>A record of your listing payments, meaning the amount, the date and which puppies each payment covers.</li>
<li>The date you accepted the listing terms, and which version you accepted.</li>
<li>An activity record of changes to your account and listings, showing what changed and when.</li>
</ul>
<p>We never ask for your street address, and we do not keep one.</p>

<h2>What shows on the public site</h2>
<p>Only what you choose to publish. Your business name, the phone and email you give for buyers, your website, your town and state, and the words about your kennel show on your breeder page. Any extras you add, such as your logo or Facebook page, can show there too. A puppy shows once its listing is paid for, with the details and photos you added. Your sign-in email and your contact name are never shown.</p>

<h2>Your photos</h2>
<p>Photos taken on a phone can carry hidden details, such as where the photo was taken and what camera took it. The portal takes those details out of every photo you upload before it is saved, so they never reach the public site. Photos are also resized in your browser before they upload.</p>

<h2>Signing in</h2>
<p>You can sign in with a link we email to you, or with your Google account. If you use Google, Google tells us your name and email address. We use those to find or start your account, and we keep nothing else from your Google account.</p>
<p>When you ask for a sign-in link, we note the internet address the request came from, to stop misuse. Used and expired sign-in links are deleted after a day, and ended sign-in sessions after a week.</p>
<p>The portal sets one cookie to keep you signed in, and a short-lived one while a Google sign-in is in progress. It uses no advertising or tracking cookies.</p>

<h2>Payments</h2>
<p>Listing payments are taken by Stripe on its own secure checkout page. Your card details go straight to Stripe. Puppy Connection never sees or stores your card number.</p>

<h2>Who helps us run Puppy Connection</h2>
<ul>
<li><b>Cloudflare</b> hosts the site, the portal, the database and the photos. Its Turnstile check on the sign-up form helps keep out automated sign-ups.</li>
<li><b>Stripe</b> takes listing payments.</li>
<li><b>Google</b> handles sign-in for breeders who choose to sign in with Google.</li>
<li><b>An email service</b> (Resend or Cloudflare) sends sign-in links and account notices.</li>
</ul>
<p>We do not sell your information, and we do not share it with anyone else except where the law requires it.</p>

<h2>Buyers</h2>
<p>Buyers contact breeders directly with the details on the breeder's page, so those conversations do not pass through Puppy Connection.</p>
<p>The public site counts how many times each puppy's page is opened, and how many times a visitor follows the breeder's website, phone or email link from it. It keeps only those two numbers for each puppy for each day, and shows them to that puppy's breeder. It sets no cookie and keeps nothing about the visitor.</p>

<h2>How long we keep things</h2>
<p>We keep your account, profile and listings while your account is open. A copy of the database is saved every night for recovery, and each nightly copy is deleted after 90 days.</p>
<p class="review-note"><b>For Amber to decide:</b> how long the activity record and payment records are kept after an account closes. Today the activity record is kept with the account and is not deleted on a schedule.</p>

<h2>Closing your account</h2>
<p>To close your account, use Ask to close my account on the Account screen of the portal, or write to ${CONTACT} from your sign-in email address. We take your listings and breeder page off the site and remove your profile. Records of past payments may be kept for accounting.</p>

<h2>Questions</h2>
<p>Write to ${CONTACT} with any question about this policy or the information we keep about you.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes, we update this page and the date at the top.</p>
</div>`;
}

export function termsPage(env, s) {
  return `<p class="draft-flag"><b>Draft, waiting on Amber's own words.</b> The listing terms breeders accept are written by Puppy Connection. They go on this page before launch.</p>
<div class="legal">
<h1>Listing terms</h1>
<p class="replace-block"><b>REPLACE THIS:</b> the listing terms, in Amber's own words (build spec section 14). Nothing has been written here on her behalf.</p>
<p class="muted small">Terms version on file: ${esc(s.termsVersion)}. A breeder accepts this version when they submit their profile for approval.</p>
<p>See also the <a href="/privacy">privacy policy</a>.</p>
</div>`;
}
