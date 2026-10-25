# Puppy Connection breeder portal and operator screens

The working guts of the multi-breeder listing site, built to the implementation spec
(`hs-proposals/puppyconnection/puppyconnection-implementation-spec.md`, private) and
running locally as a simulation. A breeder can sign up, confirm the address by emailed link and choose a password,
complete a profile and submit it. Amber can then approve, decline or suspend them, the approved
breeder can add litters, puppies and photos and pay to list, and the paid listing appears
on a local copy of the public site.

Email, payment and deployment are stubbed so the whole journey runs on one machine with no
accounts. Each stub sits behind the same interface the real service will use, so bolting
one in changes a setting and a secret rather than the code around it.

## Running it

```bash
node app/dev/setup.mjs --reset      # local database, the seed, the .dev.vars files
node app/dev/setup.mjs --reset --demo   # the same, plus the three made-up demo breeders (plan P5.1)
```

Then start the three servers. They are in `C:\Git_Repos\.claude\launch.json` as
`pc-portal`, `pc-admin` and `pc-preview`, or by hand from `C:\Git_Repos`:

```bash
node teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js dev --config puppyconnection-website-repo/app/portal/wrangler.jsonc --persist-to puppyconnection-website-repo/app/.state --port 8787 --test-scheduled
```

```bash
node teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js dev --config puppyconnection-website-repo/app/admin/wrangler.jsonc --persist-to puppyconnection-website-repo/app/.state --port 8788
```

```bash
node puppyconnection-website-repo/app/dev/preview.mjs && python -m http.server 8789 --directory puppyconnection-website-repo/app/.preview
```

| Address | What it is |
|---|---|
| http://localhost:8787 | The breeder portal |
| http://localhost:8787/dev/mail | The local mailbox, where account confirmations, password links, invitations and every other email land |
| http://localhost:8788 | Amber's operator screens, signed in as `amber@puppyconnection.test` |
| http://localhost:8789 | The public site as it would look with what the database says is public |

Both Workers share one local database and one file store because they run with the same
`--persist-to` folder. Wrangler comes from Teapup's editor, because `npm install` does not
work from this account.

## The hosted test deployment

The same code, deployed to the Puppy Connection Cloudflare account, so the journey can be
tested from any browser. It moved there from Alex's main account on 2026-10-02, and
`docs/account-move.md` records how.

| Address | What it is |
|---|---|
| https://portal.puppyconnection.workers.dev | The breeder portal |
| https://portal.puppyconnection.workers.dev/dev/mail | The mailbox, showing your own sign-in links, while `EMAIL_MODE` is `log` |
| https://portal.puppyconnection.workers.dev/privacy | The privacy policy, a draft for Amber's review |
| https://portal.puppyconnection.workers.dev/terms | The listing terms, a placeholder until Amber writes them |
| https://admin.puppyconnection.workers.dev | Amber's operator screens |
| https://site.puppyconnection.workers.dev | The public site, the generated pages built by Workers Builds from the site repository on each publish (below) |

- **Staging looks like production** (plan P7.3). The portal and the admin run as
  `DEV_MODE=staging`, which shows no "test version" or "test copy" notices, keeps every page
  out of search engines (a robots meta and an `X-Robots-Tag` header), and has no operator
  stand-in. The mailbox and the practice checkout stay only while their own provider setting
  asks for them. The mailbox (`/dev/mail`, the link on the "check your email" screen, the
  admin's Mailbox menu item) exists while `EMAIL_MODE` is `log`, and the practice checkout
  while `PAYMENTS_MODE` is `sim`. Setting real email (D9) or Stripe test keys (F1) removes
  each one with no code change. `hosted-open` and `hosted-access` still work and still show
  the notices, for a copy that should say it is a test. `lib/util.js` lists every mode.
- **The portal has no test password in front of it**, so sign-up is tested the way a breeder
  meets it. The test mailbox shows each browser only the mail for addresses that browser signed up
  with or asked a password link for, and a practice checkout opens only for the breeder who
  started it. `dev/open-portal-check.mjs`
  proves both against the live copy, and `dev/legal-staging-test.mjs` proves them against a
  local portal started with `--var DEV_MODE:staging`.
- **The admin signs in with Cloudflare Access**, an emailed one-time code, through the
  "Puppy Connection admin" application in the account's Zero Trust (team
  `dry-snowflake-0e9c`). Access lets in only the addresses on the "Puppy Connection admin
  operators" policy, and the admin then checks the address against the `people` table, so an
  operator needs both. It runs as `DEV_MODE=hosted-access`, with no password gate and no
  stand-in identity. Every test email, including Amber's notifications, is in the admin's
  own mailbox at `/dev/mail`, linked from the menu while `EMAIL_MODE` is `log`.
- **The launch steps are in `docs/launch-checklist.md`**, meaning every key, account, DNS
  record and setting that changes between staging and launch.
- **The site has no password**, because it reads only the public views and serves only photos
  of listed puppies. Its footer links to the portal's privacy and terms pages, added to the
  copied pages by `dev/site-copy.mjs` (set `PORTAL_ORIGIN` for `build-site.mjs` at launch).
- **`dev/e2e.mjs` cannot drive the hosted admin**, because Access stands in front of it. It
  runs in full against the local copy, and on the hosted copy the approval step is done by
  hand in the admin. Remove any test breeders afterwards, or they show on the public site.
  `app/.state/remove-e2e.sql` deletes every `e2e-` address and its rows, and their photo
  files come out of `puppyconnection-files` as well.
- **The data is separate from everything else.** The database is `puppyconnection` (D1) and
  the photos are in `puppyconnection-files` (R2), both in the Puppy Connection account.
- **Photos are shrunk in the breeder's browser before they upload.** The portal redraws each
  one at 1600 px for the puppy page and at 640 px as a card copy (`<key>.card` in R2, served at
  `/media/<id>/card`), as WebP where the browser can write it. Cards and thumbnails ask for the
  card copy, and a photo without one is served whole. The server still strips metadata and
  still accepts up to 15 MB, for a file the browser could not decode.
- **The site Worker caches for speed.** `data.js` is kept for 30 seconds per isolate and a
  minute in the browser, then revalidated by ETag, so a new listing can take about a minute and
  a half to show. Stylesheets and scripts linked with `?v=` are kept for a year, so bump the
  number with every change, and images are kept for a week. The Cache API does nothing on
  workers.dev, so edge caching waits for a custom domain.
- **Each Worker has its own config**, `wrangler.hosted.jsonc`, beside its local
  `wrangler.jsonc`, and each pins the account id so a deploy cannot land in another account.

To redeploy the portal and the admin after a change, run this from the `app` folder,
with `W` standing for `node ../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js`.

```bash
(cd portal && $W deploy --config wrangler.hosted.jsonc) && (cd admin && $W deploy --config wrangler.hosted.jsonc)
```

The site is not deployed from here. Workers Builds builds it from the site repository (below), so
a site change goes through `build/sync-site-repo.mjs` and a push there, and a data change reaches it
through the next publish. Do not run `wrangler deploy` with `site/wrangler.hosted.jsonc`, because
that config is the old live-read stand-in and would replace the generated pages (2026-10-19).

To take it down, delete the three Workers in the dashboard. The access tests
(`dev/access-tests.mjs`) run against the local copy only, because they write to the database
directly.

## Walking the journey

`docs/walkthrough-for-amber.md` is the same journey written for Amber, with the staging addresses.

1. At the portal, press **Create an account** and enter any `@breeders.test` address and a business name.
2. Open the local mailbox, press **Open the link**, choose a password and press **Save password and sign in**.
   Afterwards sign in with the email and password. A seed breeder has no password, so use
   **Forgot password** for one, the same way an existing breeder sets their first.
3. Fill in the profile, tick the terms, and submit.
4. In the operator screens, open **Approvals**, pick the breeder and approve.
5. Back in the portal, add a litter, add a puppy, and add at least one photo.
6. **Pay to list**, choose the puppies, and continue. The practice checkout offers a normal
   payment, a payment whose webhook is "lost" (the success page then publishes on its own),
   and a cancel.
7. Run `node app/dev/preview.mjs` and open the puppy on the preview site.

## Publishing and the site repository (decisions D10 and D11)

The public site is built and deployed from a second, private repository,
[alexharper24/puppyconnection-site](https://github.com/alexharper24/puppyconnection-site), by
Cloudflare Workers Builds for the `site` Worker. That repository holds code only. Alex chose this
on 2026-10-06 because it keeps build machinery out of this history, keeps the site private until
launch, and lets a bad site change be reverted on its own.

A publish does not write anything. The portal (`lib/publish.js`, `PUBLISH_MODE` hook, the
staging default) POSTs the site Worker's deploy hook, the secret `PUBLISH_HOOK_URL`, from its
*/15 schedule or from the admin's Publish now. The build then fetches the public data from the
portal's `/data/export.json`, which is exactly what `lib/shape.js` reads from the public views,
builds every page, checks them with site-checks and deploys. The hook call is one request, which
fits the free plan's 10 ms of CPU, where writing the data as a GitHub commit measured 13 to 50 ms.
The commit path (`PUBLISH_MODE` commit, `lib/github.js`) is kept for later, for example on
Workers Paid, and the build uses committed `data/*.json` instead of fetching when it finds them.

The generation read when the hook is called counts as published once the hook accepts, so one
period of changes starts one build. The cron also leaves a build alone for
`PUBLISH_HOOK_GAP_SECONDS` (180) after the last one. Until `PUBLISH_HOOK_URL` is set, a publish
does nothing and says so.

| In the site repository | Comes from here |
|---|---|
| `build/generate.mjs`, `build/fetch-data.mjs`, `build/ci-build.sh` | `app/build/` |
| `build/check_site.py` | `../site-checks`, used only when the public copy cannot be fetched |
| `templates/` | The concept at this repository's root: `index.html`, `puppies.html`, `list-with-us.html`, `css/`, `img/`, `js/main.js` |
| `worker/site.js` | `app/site/static-worker.js` |
| `lib/util.js`, `lib/stats.js`, `lib/media.js` | `app/lib/` |
| `wrangler.jsonc`, `README.md`, `.gitignore` | `app/site/repo/` |

Change any of these here and test them here (`publish-test.mjs` part 3 runs the generated site
and its Worker locally, over data fetched from the local portal), then copy them across on
purpose and push:

```bash
node puppyconnection-website-repo/app/build/sync-site-repo.mjs <clone of puppyconnection-site>
node puppyconnection-website-repo/app/build/sync-site-repo.mjs <clone> --check   # what would change, exit 1 if anything
```

The sync never touches `data/`, removes only files an earlier sync wrote, and records the commit
here and a hash of each file in `SYNCED.json`. To build the site locally from the local portal,
run `DATA_URL=http://localhost:8787/data/export.json bash build/ci-build.sh` in the clone.

No photo is ever committed (decision D11). Breeder uploads and imported Wix photos both live in
R2 under `uploads/<breeder id>/<photo id>.<ext>`, the data names them `media/<photo id>`, and the
site Worker serves them from R2 while their puppy is public (`lib/media.js`). A Wix photo not
imported yet keeps its Wix address.

The listing photos that were on Wix were copied into R2 on 2026-10-23 by
`app/ops/copy-wix-photos.mjs` (workplan C2), and each row keeps its Wix address in `external_url`
as the record of where it came from. The original, stripped of metadata, sits at the row's
`r2_key` and is not served. The site serves the copies beside it that `app/ops/photo_copies.py`
makes, at the portal's own sizes: `<key>.display`, 1600 px WebP, at `/media/<id>`;
`<key>.card`, 640 px WebP, at `/media/<id>/card`; and `<key>.share`, 1200 px JPEG, at
`/media/<id>/share` for og:image (Alex, 2026-10-23, after the 7.5 MB original of one photo took
7.2 seconds to load on its breed page). An original that asked to be rotated was stored as Wix's
own rotated full-size copy instead, because stripping removes the rotation. A breeder's own
upload has no display or share copy, because the portal already drew it at 1600 px.

## Tests

```bash
node app/dev/e2e.mjs            # the whole journey, 41 checks
node app/dev/access-tests.mjs   # the ten acceptance tests from build spec section 4
node app/dev/signin-test.mjs    # emailed codes stay off, 60-day sessions, the contact change notice
node app/dev/accounts-test.mjs  # launch workplan A24 to A26: passwords and their limits, the authenticator and recovery codes, password links, invitations, Make main contact, removing a person, Manage as this breeder and its hand-over
node app/dev/jobs-test.mjs      # the scheduled jobs
node app/dev/retention-test.mjs # launch workplan D1 on Node, no server: activity 2 years, payments 7 years, counts kept, unsubscribed tidied, closed accounts removed at 30 days, the caps and the job's cost
node app/dev/google-test.mjs    # Continue with Google, against a stand-in Google on 8799
node app/dev/legal-staging-test.mjs     # the privacy and terms pages and the staging mode
node app/dev/portal-features-test.mjs   # plan P2: standing, site links, extras, batches, views, account
node app/dev/admin-features-test.mjs    # plan P3: every admin route operator-only, edits, notes, breeds, terms, publish, refunds, reports
node app/dev/publish-test.mjs   # plan P4.3 and P4.4: the publish against a stand-in GitHub on 8798, the generator, the binding, the cron, CPU, and the generated site's Worker on 8795
node app/dev/wix-import-test.mjs        # plan P4.7: the Wix import into a copy, with a made-up pairing and a stand-in Wix on 8797
node app/dev/restore-test.mjs   # plan P4.8: the nightly backup restored into a fresh local database, table by table
node app/dev/demo-test.mjs      # plan P5.1: the demo breeders and Reset demo data, refused outside staging, seed untouched
node app/dev/launch-features-test.mjs   # docs/launch-workplan.md: details and video, report a listing, photo check, adoption dates, the photo-based schedule on a moved clock, approval by reference, take offline until new photos, listing review, reports, Visit site, Wix descriptions
node app/dev/focus-test.mjs     # the photo focus rule, from the dog detector's boxes
node app/dev/checklist-test.mjs # docs/launch-workplan.md A17: the launch checklist seed, every checklist route, and the areas with By area and Asks for Amber, in this process with no server
node app/dev/alerts-test.mjs    # launch workplan B10 and C5 on Node, no server: each failure alert forced, the hour's quiet window, and a send to subscribers or to all contacts
node app/dev/parents-docs-test.mjs   # launch workplan A19 to A21: the health test lists, saved moms and dads on a litter and a puppy page, public and private documents, the site Worker over a stand-in D1, and the listing quality prompts
node app/dev/photo-check/eval.mjs      # the photo check against Alex's 100-photo test set on real Workers AI, with the cost per photo (not part of the pre-commit run)
node app/dev/link-check.mjs <built site>   # G1: every internal link and #anchor on a built site resolves (--anchors=<file> lists the targets for the browser check)
```

Before a full run on a fresh `setup.mjs --reset`, compare each `.dev.vars` with its `.dev.vars.example`, because the reset keeps an existing file and new keys such as `STREAM_MODE` and `PHOTO_CHECK_MODE` go missing (2026-10-20). Start the local site on 8791 for the link checks, and fire the 15-minute schedule once (`curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"`) and the daily one (`cron=0+13+*+*+*`) before `jobs-test.mjs`, which expects every job to have run, the inactivity schedule included (2026-10-20). On a fresh reset `portal-features-test.mjs` fails one check, the breed colors and coats, because those come only from migrations/0009 and a reset applies no migrations.

`publish-test.mjs` starts its own stand-in GitHub and a second admin on 8794 with `PUBLISH_MODE`
portal, and needs the `GITHUB_*` lines from `portal/.dev.vars.example` in `portal/.dev.vars`.
Its part 3 builds the pages from the local database into `app/.preview/static-site` and starts the
generated site's Worker on 8795 with `app/site/wrangler.static.jsonc`.
It also needs the `pc-portal` (8787) and `pc-admin` (8788) previews running on current code. A
portal started before a code change answers the admin's publish through the binding with a 503,
so restart both before the run if the four portal-publish checks fail (2026-10-12).
The made-up token there works only against the stand-in, because `GITHUB_API` is honored only
while `DEV_MODE` is local.

`portal-features-test.mjs` also needs the public site Worker running locally on 8791, which it
uses for the view and click beacon. Build its pages and start it from `C:\Git_Repos`:

```bash
node puppyconnection-website-repo/app/dev/build-site.mjs
node teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js dev --config puppyconnection-website-repo/app/site/wrangler.jsonc --persist-to puppyconnection-website-repo/app/.state --port 8791
```

Both run against the servers above. The access tests call every portal route that takes an
id with another breeder's ids, and fail if a route exists that they do not attack. On
2026-09-30 the ownership rule was deliberately broken and tests 2 and 4 failed on exactly
the routes it guards, so the suite is known to catch the failure it exists for.

## What is real and what is simulated

| Piece | In the simulation | Bolting in the real one |
|---|---|---|
| Sign-in links, sessions, approval, ownership, photos, holds, fulfillment, the views | Real, and the production code path | Nothing to change |
| Email | `EMAIL_MODE=log` writes to the local mailbox | Set `EMAIL_MODE=resend`, the `RESEND_API_KEY` secret and `EMAIL_FROM`, after the domain's SPF and DKIM records are in |
| Payments | `PAYMENTS_MODE=sim` uses a practice checkout page served by the portal | Set `PAYMENTS_MODE=stripe`, `STRIPE_MODE`, `STRIPE_API_VERSION`, `STRIPE_PRICE_ID`, and the `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets. Staging runs `PAYMENTS_MODE=stripe` in test mode with sandbox keys, tested end to end by Alex on 2026-10-17. Live mode waits on Amber's Stripe account |
| Bot check on sign-up | Skipped on localhost when no key is set | Set `TURNSTILE_SITE_KEY` and the `TURNSTILE_SECRET` secret |
| Operator sign-in and roles | `DEV_IDENTITY`, on localhost only. Each operator in `people` is an owner or staff. Staff manage listings, photos, holds, notes and publishing, and only owners handle approvals, money, settings, breeds, terms, the mailing list, the email log (Alex, 2026-10-24) and people (`STAFF_ALLOWED` in `admin/worker.js`) | Create the Access application and set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Until then a deployed admin answers 403 everywhere, which is the safe state |
| Publishing | Real on staging since 2026-10-06. The staging portal and admin run `PUBLISH_MODE` hook with `PUBLISH_HOOK_URL` set, so a publish starts a Workers Builds build of the site repository and the staging site serves the generated pages | The same hook on the production site Worker (launch checklist L16) |
| Puppy videos (workplan A3) | `STREAM_MODE=sim` keeps each file in R2 under `videos/` and plays it from the portal at `/dev/stream` | Subscribe to Stream on the Puppy Connection account, set the `STREAM_API_TOKEN` secret (Stream Edit) on the portal and the admin, then `STREAM_MODE=stream` and `STREAM_CUSTOMER_CODE` in `wrangler.hosted.jsonc`. Until then staging shows no video upload |
| Scheduled jobs | Built (plan P4.2), with the publish on the */15 trigger since P4.4 | Nothing, beyond real email for their alerts |
| Failure alerts (workplan B10) | A failed job on either trigger, a failed publish, a site build that did not finish, a failed backup, and a refused or failed Stripe webhook or a dispute each email every owner and `OPS_EXTRA`, at most one of each kind an hour (`alertOnce` in `lib/mail.js`, table `alert_state`). The rest are held, counted and sent as one summary once the hour is up. `FAIL_TEST`, honored only on local and staging, forces each failure for a test | Real email (L4), and the production portal's `SITE` binding naming the production site Worker |

The local settings live in `app/portal/.dev.vars` and `app/admin/.dev.vars`, which are
gitignored and copied from the `.example` files by `setup.mjs`. Nothing in `wrangler.jsonc`
switches the simulation on, so a Worker deployed without them sends no mail and takes no
payments.

## The seed

`dev/seed.mjs` turns the concept's 204 harvested listings into comped, published puppies,
which is the first rehearsal of the Wix migration. Listings that name a breeder domain go
under that breeder, and the 23 that name none go under one "Unassigned Wix listings"
breeder, because the real pairing waits on Amber. One listing's breed, "Mini Poodle", is
mapped to Miniature Poodle. Every sign-in address is `<slug>@breeders.test`, so the
simulation cannot email a real breeder.

A breeder the concept names only by its website gets a name split from the domain, so
heartlandminischnauzers.com becomes Heartland Mini Schnauzers. The split uses a word list and is
kept only when the words cover the domain in exactly one way, otherwise the domain is the name.

`setup.mjs --reset` empties `app/.state` but keeps every `staging-*.sql` backup in it.

### Demo data and Reset demo data (plan P5.1)

`lib/demo.js` holds three made-up breeders, Buttercup Lane Puppies (signing up), Thistledown
Pups (waiting for approval) and Maple Brook Doodles (approved, two litters, three puppies listed
through one practice payment, one placed, one draft needing a photo, a week of views and clicks,
and a private operator note). Their addresses are `@breeders.test`, phones are 555-01xx, websites
end in `.example`, and the pictures are drawings made by `dev/make-demo-images.mjs` into
`lib/demo-images.js`. `setup.mjs --demo` loads them locally. The suites expect them absent, so
run the suites after a plain `--reset`.

The admin's Settings screen has Reset demo data, and only staging allows it (`DEV_MODE staging`,
checked on the server, so local and production answer 403). The operator types RESET DEMO, the
backup job runs first and the reset stops if it fails, and then one batch removes every breeder
whose id does not start with `seed-` with everything hanging off them, clears sign-ins, sessions,
the test mailbox and the view counts, and loads the demo breeders again. Seed listings, breeds,
settings, terms and operators are not touched. The audit log and email log are kept, as records.

## Deliberate choices, so nobody "fixes" them back

- The portal sends `frame-ancestors 'none'`, which also blocks framing from its own origin.
  Phone-width checks use a resized tab instead of the usual iframe (CLAUDE.md section 5).
- `lib/images.js` strips EXIF, XMP and IPTC from every upload, because phone photos carry
  GPS and every photo is served to anyone who opens the site.
- **Sign-in is a password, with an authenticator app recommended but not required, or Google**
  (launch workplan A26, Alex 2026-10-24, `lib/accounts.js`, migrations/0055). Emailed sign-in codes
  and links are off: `/auth/start` and `/auth/code` answer 410 and send nothing, and an old
  `/auth/verify` link shows a page saying so. Email carries only a new breeder's confirmation link
  (24 hours), password links from Forgot password (1 hour) and invitations (7 days), and each opens
  `/auth/set-password`, which asks for the authenticator code too when one is set up. The account is
  made only when that page is used, so nobody can claim an address they cannot read. An existing
  breeder with no password uses Forgot password to set their first, and the sign-in page says so.
- `GET /auth/set-password` changes nothing and shows the form. Only the `POST` spends the link,
  because mail scanners open every link first. A newer link of the same kind spends the older one.
- Passwords are PBKDF2-SHA256 through WebCrypto with a 16-byte salt each, stored as
  `pbkdf2-sha256$<iterations>$<salt>$<hash>`. Workers caps PBKDF2 at 100,000 iterations, which is
  the default. `PASSWORD_ITERATIONS` can set fewer (not below 10,000), and a sign-in with an older,
  lower count rehashes at the current one. One hash at 100,000 measured about 13 ms in Node and about
  50 to 122 ms in local workerd across four runs on 2026-10-24, so it does not fit Workers Free's 10 ms of CPU.
- Wrong passwords and wrong authenticator codes are counted in `signin_failures`. Ten for one
  address, or a hundred from one network address, in 15 minutes stop further tries until the
  window passes. An address with no account still costs one hash, so the answer takes as long.
- The authenticator is TOTP (RFC 6238, SHA-1, 6 digits, 30 seconds, one step of drift either
  way), and a code's step is recorded so it cannot be used twice. Set-up confirms one code, then
  shows ten recovery codes once, stored as SHA-256. The secret is sealed with AES-GCM under the
  `TOTP_KEY` Worker secret, and without that secret it is stored as `plain:` and sealed the next
  time it is used once the secret exists. The QR code is drawn by `portal/public/qrcode.js`
  (qrcode-generator 1.4.4, MIT, vendored), loaded only while setting up. The admin's Reset
  authenticator turns it off so the person sets it up again.
- **Puppy Connection access** (workplan A24). A breeder turns it on or off on the Account screen,
  and an owner records the arrangement that existed before launch with Record existing management
  arrangement (Alex, 2026-10-24, no new consent). `breeders.manage_access` with who, when and how.
  Manage as this breeder mints a two-minute, one-time hand-over in `auth_tokens` (SHA-256 only),
  bound to the operator Access identified and the breeder. The portal spends it at
  `/auth/handoff`, checks again that access is on and that the operator is in `people`, and opens
  an eight-hour session with `sessions.operator_email`, never renewed, which neither sets
  `first_signin_at` nor starts the inactivity clock. Every write in it is audited as
  "<operator> acting for <business>" with actor type operator, and the portal shows a banner with
  End. Passwords, the authenticator, access, people, sign out everywhere, terms and closing the
  account answer 403 in it. Turning access off revokes every operator session at once. Checkout is
  left as it is, because listing fees paid on a breeder's behalf are held for later.
- Breeder sessions run 60 days from their last renewal. Any use more than a day into the window
  renews it and refreshes the cookie, so only an idle breeder is signed out.
- A change to the public phone, public email or website, by the breeder or an operator, is
  emailed to the sign-in address and never to the new public one. A breeder filling in the
  profile before first submitting it gets no notice, because nothing is public yet.
- Schema changes to an existing table go in `migrations/`, run once on each database after a
  backup. `schema.sql` already carries them for a new database. Confirm the export printed
  "Downloaded" and the file exists before running the migration: on 2026-10-17 an export failed
  with an authentication error, the chained command went on to migrations 0021 and 0022, and the
  backup had to be taken afterwards.
  A migration that moves a puppy or litter between breeders needs `PRAGMA defer_foreign_keys = true`,
  and on the hosted database that only holds when the statements go in one `d1 execute --command`.
  `--file` uploads the SQL as an import, which ignores the pragma and rolls back on the first
  intermediate key failure (2026-10-12, migration 0015). It ran fine locally either way.
  A migration too long for one command line goes through `ops/d1-apply.mjs`, which sends it in
  batches of `--command`, each opening with the pragma, and keeps statements after a `-- group`
  line in one batch. Rehearse it with `--sqlite <copy>` first (migration 0023, 2026-10-18).
- `dev/preview.mjs` patches its own copy of the concept's `js/main.js` in several places, which
  are listed in the script. The live concept is never changed. The patches exist because
  the concept groups breeders by website domain and assumes every photo is on Wix.
- The admin and the portal share `portal/public/portal.css`. `setup.mjs` copies it into the
  admin, so edit the portal's copy.
- Views and clicks (plan P2.5) are counted by a beacon on the public site Worker
  (`POST /api/beacon`, `lib/stats.js`). It stores one row per puppy per UTC day with two
  numbers, and nothing about the visitor. It sets no cookie, drops visitors that announce
  themselves as bots, takes beacons only from the site's own pages, allows 30 a minute from one
  address, and counts a repeat view or click of the same puppy from one address once a minute.
  The address is only a key the rate limiter forgets within the minute.
- A breeder's logo and kennel photo (plan P2.3) are served at `/brand/<breeder id>/logo` and
  `/kennel` by the portal and the site, to anyone only while the breeder is public, and before
  that only to the breeder and to operators. Each address carries `?v=` from the file name, so
  a replaced logo is fetched fresh.
- A kennel can have up to five people (`breeder_members`, migration 0010). Each signs in with
  their own address and password or Google and has the same access as the first person. The
  breeder or an owner in the admin adds them with an invitation link, and the admin shows who is
  invited and who has joined. Removing someone ends their sessions at once and removes their
  password, authenticator and open links, and an address belongs to one kennel only. Make main
  contact hands the main email to a person, from the main contact's Account screen or the admin,
  and the old main address stays on as a person or comes off, which the operator chooses.
- Asking to close an account (plan P2.7) records a request in `account_requests` and tells the
  operators. Nothing is deleted then. The admin follows up and marks the account closed, and 30
  days later the daily retention job (`lib/retention.js`, migration 0060, launch workplan D1)
  removes the profile, breeds raised, photos, videos, documents, litters, puppies with their page
  counts, saved parents, people on the account, the reference and every session, with their R2
  files and Stream videos. It keeps the breeders row (suspended, with the reason), the payment
  records with each puppy's name in `checkout_items.puppy_name`, the activity record, operator
  notes, listing reports and the close request, which records `removed_at`. The breeder leaves the site at
  the next publish. At most two accounts and five Stream deletes a run, and the rest wait a day.
- The same job keeps the privacy policy's other periods. Activity, operator notes and listing
  reports older than 2 years (Alex, 2026-10-24, whoever they are about) and payment
  records older than 7 years (checkouts with their items, payments, disputes and Stripe events) are
  deleted in capped batches, each batch with its own audit row. Page and breed search counts are
  kept. An unsubscribed address keeps only its email, state, date and unsubscribe link, and loses
  its name, source, join date and import batch, its send rows for finished emails and its list
  emails in `email_log`. The unsubscribe link and the admin's Unsubscribe do this at once, and the
  job catches imports.
- `listing_days` 0 hides every end date and renewal in the portal (plan P2.1, D8). Setting it
  above 0 brings them back with no code change.
- An operator editing a breeder's profile, litter or puppy (plan P3.1) goes through the same
  `profileFields`, `litterFields` and `puppyFields` in `lib/store.js` that the portal uses, so the
  two can never accept different things. An edit may send only the fields that change. Every such
  edit is in the activity log under the operator's address.
- Operator notes (plan P3.2) are in `operator_notes`. Nothing the portal, the site export or a
  report reads touches that table, and the activity log records only that a note was added. The
  nightly backup does carry them, so they survive a restore.
- The listing terms (plan P3.4) live in `terms_versions`. The row `draft` is the working copy, each
  published version is its own row, and `settings.terms_version` names the current one, so the
  Settings screen no longer edits it. A breeder on an older version sees a banner and an accept
  button on every screen, and nothing is blocked while they have not accepted.
- Publish now (plan P3.5) calls `publishNow()` in `lib/publish.js`. `PUBLISH_MODE` unset (mark)
  only records the site as published, because staging reads the database live. P4.4 fills the
  `portal` publisher, which calls the portal through a `PORTAL` service binding.
- A refund (plan P3.8) always takes one path. The practice provider's `refund()` hands back the
  `charge.refunded` event Stripe would send, and `handleEvent()` runs `applyRefund()`, exactly as
  it will for Stripe's own webhook. A full refund takes the puppies it paid for off the site
  (`payment_state` refunded, back to a draft), audits it and emails the breeder. A partial refund
  and a dispute are recorded, shown and alerted, and leave the listing up. The admin's Refund
  and dispute buttons work only with the practice provider until P4.5 proves the Stripe one.
- The publish (plan P4.3) runs in the portal, from its */15 cron and from `/internal/publish`,
  which the admin reaches through the `PORTAL` service binding. Only the portal holds the GitHub
  token. `/internal/publish` answers 404 to anything that arrives with a `cf` object or a
  `CF-Connecting-IP` header, which every request from the internet has and a binding request
  does not, so a forged Host header does not get in.
- The publish calls a deploy hook and the build fetches `/data/export.json` (hook mode, above),
  rather than committing data, because the commit did not fit the free plan's CPU. The export is
  `lib/shape.js` from the public views only, so it shows nothing the site does not.
- The generator is `app/build/generate.mjs`, a Node script with no packages, run in the site
  repository by `build/ci-build.sh` after each publish. Pages are flat at the root
  (`puppy-<slug>.html`, `breed-<slug>.html`, `breeder-<slug>.html`), because site-checks reads
  only the root and every page should be checked. The concept's `?slug=` pages become pages
  that send the visitor on, and `_redirects` sends each Wix `/product-page/<slug>` to its puppy.
- The generated site turns off site-checks' em dash check (`.sitecheck.json`), because breeders
  write their own descriptions and their dashes are published as written. The site's own
  wording is still checked with it on, by a second build in `publish-test.mjs` with the
  breeders' dashes taken out.
- The Wix import (`app/ops/wix-import.mjs`) and the restore (`app/ops/restore-backup.mjs`) work
  on a copy or a new database, never the live one. The restore refuses a database that already
  has breeders.
- **Launch additions (docs/launch-workplan.md).** Puppy videos go from the breeder's browser
  straight to Cloudflare Stream (`lib/stream.js`), never through a Worker. Families report a
  listing on a form served by the portal at `/report`, linked from each puppy and breeder page, so
  Turnstile and the rate limiter run where sign-up already uses them (`lib/reports.js`). Each upload
  is judged by a vision model on Workers AI (`lib/photocheck.js`), and a photo that fails is sent
  back to the breeder with the reason, or held in Photo review when `photo_check_route` is review.
  A photo still waiting for the check counts toward a listing's minimum so a slow check never
  blocks a payment, and only checked photos reach the site.
- **Photo framing (Alex, 2026-10-18).** Every crop of a puppy photo (cards, thumbnails, breed
  photos) centers on the photo's focus point, which the dog detector on Workers AI
  (`@cf/facebook/detr-resnet-50`, `lib/focus.js`) sets from where the dog sits. The detector never
  judges which puppy or breed a photo shows. An upload stores its size, and the photo check finds
  its focus from the same card copy. Photos on Wix are measured by `ops/measure_photos.py`, which
  runs the same rule through `dev/photo-focus` under `wrangler dev`, and measures any photo stored
  as Wix's 4:3 copy on its original instead. A photo in R2 is cropped by the browser, so the
  generator gives it an `object-position` that puts the focus where the Wix crop would. The five
  hand-set points from migration 0007 are marked `"manual"` in `_harvest/data/framing.json` and
  never remeasured.
- **Adoption dates come from triggers.** `placed_at` is set and cleared by two SQLite triggers on
  `puppies` (migrations/0019), so no route can forget it. D1 counts a trigger's own changes in
  `meta.changes`, which is why `checkVersion()` treats any count of 1 or more as success.
- **The listing schedule runs on photos** (`lib/inactivity.js`, migration 0030, Amber's rule of
  2026-10-19). Only a new photo that passes the photo check, or a payment, restarts a listing's
  clock, so a price change or a breeder saying the puppy is still available does not. Emails go at
  weeks 4 and 5, the listing goes offline at week 6 and a new photo brings it back free, and at
  week 12 it is removed and relists through the normal checkout with every detail kept. The job
  moves a listing one step a run and each step waits its week, so no email is skipped. Every
  listing already on staging started its clock at migration 0030 rather than from its Wix photo
  dates, so nobody was told "offline in two weeks" on the day it shipped. Imported Wix breeders are
  left out until they first sign in. The old Still available link only opens a page that points to
  the portal, and an offline listing cannot be paid for because a photo brings it back free.
- **One reference per new breeder** (`breeder_references`, migration 0031). Submitting for approval
  needs a name, one of four roles and a phone or email, kept in its own table because the public
  views read `breeder_profiles`. Approved and imported breeders were asked for nothing, and a
  breeder who submitted before references can still be approved without one. Delete a test
  breeder's `breeder_references` row before its `breeders` row, because of the foreign key.
- **Take offline until new photos is a kind of operator hold** (`hold_kind` photos, migration
  0032). It shares `operator_hold`, so the public views already leave it out, and it lifts itself
  only for a photo uploaded after the hold that passes the check. A plain hold still needs Release.
- **Breed searches are counted per breed per day only**, by the same beacon as views and clicks,
  from the browse page's breed filter (`js/search-count.js`, written by the generator).
- **Wix form labels are split out of imported descriptions** by `lib/wixtext.js`, in the seed, in
  the Wix import and by migrations/0022 for staging. The breeder's prose is kept exactly as written,
  and the parents' colors, which have no field, become one line on the litter.
- **The launch checklist (workplan A17) is the source of truth for launch status.** It lives in
  `checklist_items`, `checklist_parts` and `checklist_comments` (migrations/0034), on the admin's
  Launch checklist screen and as a card on the overview. Owners are Alex and Amber only (Alex,
  2026-10-19, migrations/0035), and `checklist_signers` maps a sign-in address to the names it acts as, so the shared Amber and Luke
  address picks who is ticking. Nothing is deleted, only archived, and only Alex archives. Every write
  is in `audit_log` under entity `checklist_item`. `docs/launch-workplan.md` keeps the detail and
  evidence, and `ops/checklist.mjs` exports the status to `docs/launch-checklist-status.md`, lists
  drift and ticks an item as Claude. A new operator address needs a `checklist_signers` row.
- **Checklist items sit in areas, and By area is the default view** (Alex, 2026-10-20,
  migrations/0044). `checklist_areas` holds eight areas in a fixed order, from the one that unblocks
  the most (Domain and email) to the launch build work (Site and portal build), and each item has at
  most one, set in the item editor. An item with no area groups under its section, which is where
  most Gate items sit, because only Stripe Connect fits a launch area. Each area row's "Waiting on"
  line comes from `admin/public/checklist-areas.js`, which shortens a waiting line with no person to
  its subject, so "the domain moving to Cloudflare" reads "the domain". The Asks for Amber tab lists
  every open part she owns, plus each item waiting on her with no part of hers, and Copy as text
  gives the same list as plain text. The workplan carries each item's area after its status, and
  the drift check reports a difference, so move the workplan's area when an item moves in the admin.
- **A failed site build is found by its outcome** (workplan B10). Workers Builds never tells the
  portal how a build ended, so `build/fetch-data.mjs` writes `build.json` with the generation it
  fetched, `ci-build.sh` copies it into the pages, and the site Worker serves it at `/api/build`. The
  portal's */15 run reads it through the `SITE` service binding (a Worker cannot fetch another on
  the same workers.dev subdomain) and alerts once for a publish whose build has not shown up after
  `BUILD_DEADLINE_MINUTES` (20). This catches a failed deploy as well as a failed build, with no
  extra secret. A site built before `build.json` existed answers 404 and is not an alert.
- **A send to all contacts** (workplan C5, Alex 2026-10-19). Each send picks subscribers only, or
  every contact who has not unsubscribed, and the send button and its confirmation carry that
  audience's count, which the server checks again. A contact's email says they have been in touch
  rather than that they signed up, and carries the same one-click unsubscribe. Unsubscribed
  addresses are in neither audience and are skipped if they leave mid-send.
- **Saved moms and dads** (workplan A19, migrations/0050, `lib/parents.js`). A breeder saves each
  parent once in Moms and dads and picks them on a litter, and the generated puppy page shows both,
  with photo, registration, health testing, pedigree and public documents. The litter's own mom and
  dad weights stay. Health tests are picked from the parent's breed list in `lib/healthtests.js`,
  which is each breed's OFA CHIC program as published on 2026-10-21. A cross takes both parent
  breeds' tests, and a breed with no published list (Victorian Bulldog, or a breed added in the
  admin since) gets the six common OFA screenings and says so. `docs/health-test-sources.md`
  quotes every source. A test is stored by its key, so keys are never renamed or removed. Removing
  a parent only takes it off the litter picker, and a litter that names it keeps showing it.
- **Documents** (workplan A20). A PDF or a JPEG, PNG or WebP image up to 10 MB, checked by its first
  bytes, ten per puppy or parent. Images have their metadata stripped like photos. Each is public or
  private and starts private. A public file lives in R2 under `docs/` and a private one under
  `private/`, a change of visibility moves the file, and `public_documents` names only rows under
  `docs/`, so a private file is never where the site Worker reads. The site serves a public document
  of a public puppy or parent at `/media/doc/<id>`, the portal serves the breeder's own public ones
  before listing, and only the admin serves a private one, to a signed-in operator.
- **Listing quality prompts** (workplan A21). The puppy form lists what would make the listing
  stronger as the breeder types: a one-line description, no health details or health record, no
  mom or dad on the litter, fewer than three photos, and no birth date. The Pay to list screen
  repeats them. Nothing is blocked.
- Report CSVs (plan P3.7) are built on the server, and any text cell starting with `=`, `+`, `-`,
  `@`, a tab or a carriage return gets a leading apostrophe, so a puppy named like a formula
  cannot run in Amber's spreadsheet (`lib/csv.js`).

## Pending

- [ ] Password hashing and the Workers CPU limit (launch workplan A26). One PBKDF2 hash at the
      100,000 maximum measured about 13 ms in Node and 50 to 122 ms in local workerd across four runs (2026-10-24),
      against Workers Free's 10 ms of CPU a request. Alex decides between Workers Paid for the portal,
      or a lower `PASSWORD_ITERATIONS` until then, before password sign-in goes to staging
- [ ] The `TOTP_KEY` secret on the staging and production portal, a random value Alex generates,
      so authenticator secrets are sealed. Until it is set they are stored unsealed and marked plain
- [ ] Record existing management arrangement for each of the nine breeders Amber manages today
      (workplan A24). The data does not say which nine, so the migration turns none on

- [ ] Puppy Connection's own phone number, email address and social links for the Let's Chat
      button and the Contact page (workplan A15). Amber sent them on 2026-10-25 and they are in
      `CONTACT` at the end of `js/main.js` (`?v=41`) and in `build/info-pages.mjs`. Open until the
      site repository is synced and the staging site shows them

- [ ] Cloudflare Stream for puppy videos, on hold until Amber wants video and commits to its cost
      (Alex, 2026-10-17). It is $5 a month for 1,000 minutes stored on either plan, and the Starter
      Bundle also includes 5,000 minutes watched. Then subscribe on the Puppy Connection account, create an API
      token with Stream Edit, set it as `STREAM_API_TOKEN` on the portal and the admin, then set
      `STREAM_MODE` stream and `STREAM_CUSTOMER_CODE` in both `wrangler.hosted.jsonc` and redeploy.
      Until then staging offers no video upload
- [x] The photo check's accuracy: Alex accepted 8 of the 100 test photos disagreeing with his calls
      as the launch accuracy on 2026-10-17, and kept flagged photos going back to the breeder
      (`hs-seo-data/puppyconnection/2026-10-17-photo-sample/results-*.json`)
- [ ] Workers AI's free allocation covers about 350 photo checks a day. Past it a check fails and the
      photo passes unjudged until the next day or Workers Paid

- [ ] Press Reset demo data on staging once, signed in to the admin through Access, so staging
      holds the three demo breeders. It was built and deployed on 2026-10-06 but not run there,
      because nobody signed in to Access overnight
- [ ] The four seed breeders on staging named "Unassigned Wix listings" although their listings
      name a website (Heartland Mini Schnauzers, Cornerstone Cavaliers, Bless Your Paws Puppies,
      Winding Streams Companions). The seed is fixed, and staging takes the names when Alex
      approves a one-line update or the next reseed
- [ ] Look at every screen at full size. Screenshots timed out in the browser pane during
      the 2026-09-30 build, so the layouts are measured (no sideways overflow at 320 and 375 in the portal and at 320 in the admin)
      but have not been looked at
- [ ] Publishing Amber's listing terms (workplan D2). Her text of 2026-10-25 is the draft on the
      admin's Terms screen (migrations/0058, and `schema.sql` for a new database). Publish shows it
      on `/terms` and in the profile submit card, and asks every breeder who submitted a profile to
      accept it on their next visit, so Amber or Alex chooses when. Her agreement names a "Terms of
      Service" the site does not have yet
- [ ] `NOTICE_TO` (workplan B9) sends new sign-ups waiting for approval and listing reports to
      info@puppy-connection.com on staging (`wrangler.hosted.jsonc`). Failure alerts stay with the
      owners and `OPS_EXTRA`. Unset, sign-ups go to every operator in `people` and reports to the
      owners. Set it on the production portal too
- [ ] Amber's confirmation of the privacy policy at `/privacy` (`portal/legal.js`), written on
      2026-10-24 to Alex's retention decisions with info@puppy-connection.com as the contact
      address. When she confirms, remove the "Waiting for Amber's confirmation" banner and turn
      the legal-staging-test check to its absence (launch workplan D1)
- [ ] Publishing on the production site Worker (launch checklist L16). Staging has published
      through the deploy hook since 2026-10-06
- [ ] The imported Wix photos copied into R2 with `wix-import.mjs --upload-to` before the
      imported rows reach D1 (launch checklist L17), once Amber's pairing arrives
- [ ] Stripe, Resend, Turnstile and Access, each per the table above
- [ ] Amber's own breed list, and the real listing-to-breeder pairing for the migration
- [ ] Questions for Amber from the operator screens (plan P3): whether a dispute should take a
      listing down while it is open (today it is recorded and shown, and the listing stays up),
      whether a breeder who has not accepted new listing terms may still pay to list (today they
      may), and her own breed list and guide text on the Breeds screen
- [x] How long the daily view and click counts are kept. They are kept, because they hold nothing
      about a visitor (Alex, 2026-10-24, launch workplan D1). Only a closed account's own puppy
      counts go, with its puppies
