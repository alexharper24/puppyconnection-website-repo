---
doc: launch-checklist
written: 2026-10-05
plan_id: P7.7
asked: "A launch checklist naming exactly what flips: Stripe live keys and price, the Google app under the Puppy Connection account with brand verification, the domain and its email records, Access on the admin hostname, and noindex off"
status: "OPEN, updated 2026-10-06 with the publish, import and restore steps (plan P4.3 to P4.8). Nothing here has flipped. Staging runs on puppyconnection.workers.dev with DEV_MODE staging (plan P7.3)"
glossary:
  - {term: "portal", means: "the breeder portal Worker (app/portal)", not: ["breeder app", "dashboard"]}
  - {term: "admin", means: "the operator screens Worker (app/admin), behind Cloudflare Access", not: ["back office", "operator portal"]}
  - {term: "site", means: "the public Puppy Connection site Worker (app/site)", not: ["front end", "storefront"]}
  - {term: "staging", means: "the copy on puppyconnection.workers.dev in the Puppy Connection Cloudflare account", not: ["test copy", "hosted test"]}
  - {term: "real hostnames", means: "the portal, admin and site hostnames on puppy-connection.com, decided in L0", not: ["custom domain", "prod URL"]}
items:
  - {id: L0, status: open, blocked_on: "alex and amber", item: "Decide the real hostnames for the portal, admin and site. Suggested portal.puppy-connection.com, admin.puppy-connection.com, and the apex plus www for the site"}
  - {id: L1, status: open, blocked_on: "amber, then alex", item: "Stripe live. Amber's Stripe account verified, the $14.99 product and price and the webhook created in live mode, the live keys set as secrets, PAYMENTS_MODE stripe and STRIPE_MODE live"}
  - {id: L2, status: open, blocked_on: "alex and amber (D5)", item: "Google OAuth app moved to the Puppy Connection Google account, published, brand verified, with the redirect URI and origin for the real portal hostname"}
  - {id: L3, status: open, blocked_on: alex, item: "puppy-connection.com DNS moved to the Puppy Connection Cloudflare account with every existing record carried over before the nameserver change"}
  - {id: L4, status: open, blocked_on: "alex (D9)", item: "Email sending domain records (SPF, DKIM, DMARC) published and verified, EMAIL_MODE resend, EMAIL_FROM on the real domain"}
  - {id: L5, status: open, blocked_on: alex, item: "Access application on the admin's real hostname with the same operator policy and two-step check, and ACCESS_AUD updated"}
  - {id: L6, status: open, blocked_on: alex, item: "Turnstile widget hostnames include the real portal hostname, and TURNSTILE_HOSTNAME set to it"}
  - {id: L7, status: open, blocked_on: claude, item: "Production config for the portal and admin with DEV_MODE unset, so the mailbox, practice checkout and test notices are gone"}
  - {id: L8, status: open, blocked_on: "claude, then alex", item: "noindex off and robots.txt open on the public site only, sitemap on the real domain, Search Console verified. The generator does the first three with SITE_INDEXABLE=1 and SITE_URL (plan P4.3)"}
  - {id: L9, status: open, blocked_on: claude, item: "Every legacy Wix URL redirected with a 301 and a sample tested after cutover (site state g1-old-site, g3-redirects, g4-legacy-check). Product pages are done by the generator's _redirects from each puppy's legacy_slug (plan P4.3). Category, breed and breeder pages on Wix still need their own lines"}
  - {id: L10, status: open, blocked_on: alex, item: "Workers Paid ($5 a month). Measured 2026-10-06 (plan P4.4), a publish does not fit the free plan's 10 ms of CPU, so this is needed before the publish runs for real", evidence: "dev/publish-test.mjs on Node with SQLite time left out: the publish's own work for one change 12.9 to 18.3 ms with GitHub's answers canned, 21 to 50 ms with Node's fetch, the export alone 3 to 9 ms"}
  - {id: L11, status: open, blocked_on: alex, item: "The fine-grained GitHub token (F4) expiry date on a calendar, with a reminder two weeks before"}
  - {id: L12, status: open, blocked_on: amber, item: "Privacy policy approved and the listing terms written by Amber, the contact address placeholder replaced"}
  - {id: L13, status: open, blocked_on: "alex and amber", item: "Staging test data removed from the production database (e2e- breeders, demo breeders, the test mailbox)"}
  - {id: L14, status: open, blocked_on: "alex and amber", item: "One real $14.99 listing payment, then its refund, checked end to end in live mode"}
  - {id: L15, status: open, blocked_on: "claude and alex", item: "One restore from a nightly backup, done and checked, before launch is called done (plan P4.8). Rehearsed locally on 2026-10-06 with app/ops/restore-backup.mjs (dev/restore-test.mjs, every table matched). The staging rehearsal into a new D1 database is still to do"}
  - {id: L16, status: open, blocked_on: "alex (F4, D10), then claude", item: "Publishing switched on. The GitHub token as a portal secret, GITHUB_REPO and PUBLISH_DIR set, PUBLISH_MODE portal on the admin, the CI workflow running app/build/ci-build.sh and deploying the site Worker over its output, and the site Worker changed from reading the database live to serving the generated pages"}
  - {id: L17, status: open, blocked_on: "amber (d8), then claude and alex", item: "The Wix import. Amber's pairing file, app/ops/wix-import.mjs run on a copy and checked, then the copy's rows and photos moved to D1 and R2. Decide first where the imported photos are served from (D11)"}
---

# Launch checklist

This lists what changes when Puppy Connection moves from staging to launch. Staging already
runs the production code. Launch changes accounts, keys, DNS records and settings, and no
feature is built at launch. Each item in the header has an id, a status and who it waits
on. Close an item only with evidence, such as a command output, a dashboard value or a test
result.

Run every step in order inside each section. Sections L1 to L6 can run in any order after
L0 and L3. L13 to L15 run last.

## L0 Hostnames

- [ ] Agree the real hostnames with Amber.
- [ ] Record them in this file's glossary.

## L1 Stripe live

WARNING: A live key takes real money. Set live keys only on the production portal, never on staging.

- [ ] Confirm Amber's Stripe account shows as verified and able to take payments.
- [ ] Create the listing product in live mode.
- [ ] Create one price of $14.99, one-time, on that product.
- [ ] Create a webhook endpoint at `https://<portal hostname>/stripe/webhook`.
- [ ] Select these events on the endpoint.
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
  - `charge.refunded`
  - `charge.dispute.created`
  - `charge.dispute.closed`
- [ ] Pin the endpoint API version to the value in `STRIPE_API_VERSION`.
- [ ] Set the secret `STRIPE_SECRET_KEY` to the live secret key with `wrangler secret put`.
- [ ] Set the secret `STRIPE_WEBHOOK_SECRET` to the endpoint signing secret.
- [ ] Set `PAYMENTS_MODE` to `stripe` in the production portal config.
- [ ] Set `STRIPE_MODE` to `live`.
- [ ] Set `STRIPE_PRICE_ID` to the live price id.
- [ ] Set `PAYMENTS_MODE` to `stripe` in the production admin config.
- [ ] Send a test event from the Stripe dashboard and confirm the portal answers 200.

## L2 Google sign-in

CAUTION: A wrong redirect URI stops Google sign-in. The emailed link still works, so breeders can sign in.

- [ ] Create the Cloud project in the Puppy Connection Google account (D5).
- [ ] Add Alex as a second owner of the project.
- [ ] Configure the consent screen with the name Puppy Connection and the logo.
- [ ] Set the home page to the site's real home page.
- [ ] Set the privacy policy link to `https://<portal hostname>/privacy`.
- [ ] Set the terms link to `https://<portal hostname>/terms`.
- [ ] Add `puppy-connection.com` as an authorized domain.
- [ ] Request only the scopes `openid`, `email` and `profile`.
- [ ] Create a web OAuth client.
- [ ] Add the redirect URI `https://<portal hostname>/auth/google/callback`.
- [ ] Add the JavaScript origin `https://<portal hostname>` for One Tap.
- [ ] Add the Access redirect URI `https://dry-snowflake-0e9c.cloudflareaccess.com/cdn-cgi/access/callback`.
- [ ] Publish the app to In production.
- [ ] Submit the brand for verification and wait for approval.
- [ ] Set `GOOGLE_CLIENT_ID` in the production portal config.
- [ ] Set the secret `GOOGLE_CLIENT_SECRET` on the production portal.
- [ ] Update the Google login method in Access with the new client id and secret.
- [ ] Sign in with a Google account that is not on the project and confirm no warning shows.

## L3 DNS move

WARNING: A record left behind stops what it serves. A missing MX record stops all mail to the domain.

- [ ] Export every record for puppy-connection.com from the current DNS host.
- [ ] Take a screenshot of the record list as a second copy.
- [ ] Add puppy-connection.com to the Puppy Connection Cloudflare account.
- [ ] Compare the imported records with the export, one line at a time.
- [ ] Add each record the import missed.
- [ ] Set the Wix site records to DNS only, so Wix keeps serving until cutover.
- [ ] Confirm MX, SPF and every verification TXT record is present.
- [ ] Change the nameservers at the registrar to the two Cloudflare names.
- [ ] Confirm the zone shows as active in Cloudflare.
- [ ] Check mail delivery to the domain with one test message.
- [ ] Check the Wix site still loads on the domain.

## L4 Email sending

CAUTION: A domain can have one SPF record only. Merge a new include into the existing record.

- [ ] Choose Resend or Cloudflare Email Sending (D9).
- [ ] Add the sending domain in that service.
- [ ] Publish the DKIM records it gives.
- [ ] Merge its SPF include into the existing SPF record.
- [ ] Publish a DMARC record, starting at `p=none` with a report address.
- [ ] Wait for the service to show the domain as verified.
- [ ] Set `EMAIL_MODE` to `resend` on the production portal and admin.
- [ ] Set `EMAIL_FROM` to the sending address on the real domain.
- [ ] Set the secret `RESEND_API_KEY` on the production portal and admin.
- [ ] Remove `EMAIL_ALLOWLIST`, so mail goes to every breeder.
- [ ] Set `OPS_EXTRA` to the addresses that get job alerts.
- [ ] Ask for a sign-in link and confirm it arrives outside the spam folder.

## L5 Access on the admin

WARNING: An admin hostname with no Access application is open to anyone. Create the application before the route.

- [ ] Create a self-hosted Access application on the admin's real hostname.
- [ ] Attach the "Puppy Connection admin operators" policy.
- [ ] Turn on the same login methods, one-time PIN and Google.
- [ ] Confirm the account-wide two-step check still applies to the application.
- [ ] Set `ACCESS_AUD` to the new application's audience tag.
- [ ] Add the admin's real hostname as a custom domain on the admin Worker.
- [ ] Set `workers_dev` to false on the production admin.
- [ ] Open the admin in a private window and confirm Access asks for sign-in.
- [ ] Confirm an address outside the policy is refused.

## L6 Turnstile

- [ ] Add the real portal hostname to the widget "Puppy Connection breeder portal".
- [ ] Set `TURNSTILE_HOSTNAME` to the real portal hostname.
- [ ] Sign up once from a normal browser and confirm the check passes.

## L7 Production config

CAUTION: Staging must keep `DEV_MODE` staging until real email and Stripe work there, or sign-in stops.

- [ ] Make `wrangler.production.jsonc` for the portal and admin from the hosted configs.
- [ ] Remove `DEV_MODE` from both.
- [ ] Set `PORTAL_ORIGIN` and `ADMIN_ORIGIN` to the real hostnames.
- [ ] Deploy the portal and the admin.
- [ ] Confirm `/dev/mail` answers 404 on both.
- [ ] Confirm `/sim/checkout/x` answers 404 on the portal.
- [ ] Confirm `/api/config` reports `notices` false and `mailbox` false.

## L8 Search engines

The portal and admin stay out of search engines after launch. Each sends `X-Robots-Tag: noindex` from `lib/util.js`. Only the public site opens. The generator (`app/build/generate.mjs`) writes noindex, `robots.txt` and `sitemap.xml` on every build, so the switch is two CI settings.

- [ ] Set `SITE_URL` to the site's real address in the CI build.
- [ ] Set `SITE_INDEXABLE` to `1` in the CI build.
- [ ] Publish once and confirm no site page carries `noindex`.
- [ ] Confirm `robots.txt` allows crawling and names the sitemap on the real domain.
- [ ] Verify the domain in Search Console.
- [ ] Submit the sitemap.

## L9 Wix URL redirects

The generator writes `_redirects` with a 301 from each imported puppy's `/product-page/<slug>` to its new page.

- [ ] Inventory every live Wix URL, from the sitemap and Search Console.
- [ ] Map each URL that is not a product page to its new page.
- [ ] Add those lines to the generator's `_redirects`.
- [ ] Test every mapped URL on staging.
- [ ] Fetch a sample of old URLs after cutover and confirm each lands on the right page.

## L10 Workers plan

The free plan allows 10 ms of CPU and 50 outside requests per run. A publish measured on 2026-10-06 needs more CPU than that, so it needs Workers Paid. The publish keeps to 40 new files per run (`PUBLISH_MAX_FILES`), so the request limit holds either way.

- [ ] Move the Puppy Connection account to Workers Paid.
- [ ] Publish once and read the CPU time of that run in the portal's Workers logs.

## L11 GitHub token

- [ ] Note the expiry date of the fine-grained token (F4).
- [ ] Put a calendar reminder two weeks before that date.
- [ ] Write the rotation steps beside the reminder.

## L12 Legal pages

- [ ] Send the draft privacy policy at `/privacy` to Amber.
- [ ] Apply her changes.
- [ ] Replace the contact address placeholder.
- [ ] Put Amber's listing terms on `/terms` and in the profile submit card.
- [ ] Set a new `terms_version` in the admin settings.

## L13 Test data

WARNING: Deleting rows cannot be undone. Export a backup to `app/.state/` first.

- [ ] Export the production database.
- [ ] Delete every `e2e-` and `staging-` breeder and its rows.
- [ ] Delete the demo breeders.
- [ ] Empty `dev_mailbox` and `dev_mailbox_owners`.
- [ ] Delete their photo files from R2.

## L14 First real payment

- [ ] List one puppy with a real card for $14.99.
- [ ] Confirm the puppy shows on the site.
- [ ] Confirm the payment shows in the admin Payments screen.
- [ ] Refund the payment in Stripe.
- [ ] Confirm the refund shows in the admin and the operators get the refund alert.
- [ ] Make sure the refunded puppy is off the site and shows as a draft in the portal. A full refund takes its listings down through `charge.refunded` (plan P3.8).

## L15 Restore from a nightly backup

Use this procedure for the launch rehearsal and for a real recovery. For a mistake less than 30 days old, D1 Time Travel (`wrangler d1 time-travel restore`) is the first choice, and the nightly backup is the second copy. Run the commands from `app/`, with `W` for the wrangler command in the README.

The backup holds every table except sign-in links, sessions and the test mailbox (`login_tokens`, `sessions`, `dev_mailbox`, `dev_mailbox_owners`, `sim_sessions`). After a restore every breeder signs in again.

WARNING: A restore into the live database would overwrite current data. Always restore into a new, empty database. The script refuses a database that already has breeders.

- [ ] Download the backup: `$W r2 object get puppyconnection-files/backups/<YYYY-MM-DD>.json.gz --file backup.json.gz --remote --config portal/wrangler.hosted.jsonc`.
- [ ] Write the SQL without running it: `node ops/restore-backup.mjs --backup backup.json.gz --sql-only restore.sql`.
- [ ] Read the start and the end of `restore.sql`.
- [ ] Create a new database: `$W d1 create puppyconnection-restore-<YYYY-MM-DD>`.
- [ ] Copy `portal/wrangler.hosted.jsonc` to a scratch config and set its `database_name` and `database_id` to the new database.
- [ ] Restore: `node ops/restore-backup.mjs --backup backup.json.gz --remote --database puppyconnection-restore-<YYYY-MM-DD> --config <scratch config>`.
- [ ] Make sure every line reads `ok` and the last line reads `every table matches`.
- [ ] Record the time the restore took.

For a real recovery, continue.

CAUTION: The Workers write to whichever database their config names. Change all three configs in the same sitting.

- [ ] Set `database_id` in the portal, admin and site configs to the new database.
- [ ] Deploy the portal, the admin and the site.
- [ ] Open the admin and press Publish now, so the site matches the restored data.
- [ ] Tell the breeders to sign in again.

The local rehearsal is `node dev/restore-test.mjs`. It runs the backup job, takes the file out of the local R2, restores it into a fresh local database, and compares every table by count and seven tables row by row.

## L16 Publishing

WARNING: A publish writes to the repository on every change. Point `GITHUB_REPO` and `PUBLISH_DIR` at the agreed place (D10) before the token is set.

- [ ] Create the fine-grained token with Contents read and write on the site repository only (F4).
- [ ] Set it on the portal with `$W secret put GITHUB_TOKEN`.
- [ ] Set `GITHUB_REPO`, and `PUBLISH_DIR` if it is not `site`, in the portal config.
- [ ] Add the CI workflow that runs `bash app/build/ci-build.sh` and deploys the site Worker over its output.
- [ ] Add the Cloudflare API token for that deploy to the CI secrets.
- [ ] Set `PUBLISH_MODE` to `portal` in the admin config.
- [ ] Press Publish now and confirm one commit lands and the CI build passes.
- [ ] Change the site Worker to serve the generated pages, with the beacon route kept.

## L17 Wix import

WARNING: The import changes the database copy only. Moving it to D1 and R2 replaces the seed rows. Export a backup first.

- [ ] Get Amber's pairing of each listing to its breeder (d8), in the shape of `dev/fixtures/pairing-made-up.json`.
- [ ] Refresh the harvest with `_harvest/refresh.py`.
- [ ] Do a dry run: `node ops/wix-import.mjs --pairing <file> --drop-seed --dry-run`.
- [ ] Run it: `node ops/wix-import.mjs --pairing <file> --drop-seed`.
- [ ] Make sure every check line reads `ok`.
- [ ] Move the copy's rows and photos to D1 and R2, as decided in D11.
