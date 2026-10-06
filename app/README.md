# Puppy Connection breeder portal and operator screens

The working guts of the multi-breeder listing site, built to the implementation spec
(`hs-proposals/puppyconnection/puppyconnection-implementation-spec.md`, private) and
running locally as a simulation. A breeder can sign up, sign in by emailed link, complete
a profile and submit it. Amber can then approve, decline or suspend them, the approved
breeder can add litters, puppies and photos and pay to list, and the paid listing appears
on a local copy of the public site.

Email, payment and deployment are stubbed so the whole journey runs on one machine with no
accounts. Each stub sits behind the same interface the real service will use, so bolting
one in changes a setting and a secret rather than the code around it.

## Running it

```bash
node app/dev/setup.mjs --reset      # local database, the seed, the .dev.vars files
```

Then start the three servers. They are in `C:\Git_Repos\.claude\launch.json` as
`pc-portal`, `pc-admin` and `pc-preview`, or by hand from `C:\Git_Repos`:

```bash
node teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js dev --config puppyconnection-website-repo/app/portal/wrangler.jsonc --persist-to puppyconnection-website-repo/app/.state --port 8787
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
| http://localhost:8787/dev/mail | The local mailbox, where sign-in links and every other email land |
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
| https://site.puppyconnection.workers.dev | The public site, built live from the database on every page load |

- **Staging looks like production** (plan P7.3). The portal and the admin run as
  `DEV_MODE=staging`, which shows no "test version" or "test copy" notices, keeps every page
  out of search engines (a robots meta and an `X-Robots-Tag` header), and has no operator
  stand-in. The mailbox and the practice checkout stay only while their own provider setting
  asks for them. The mailbox (`/dev/mail`, the link on the "check your email" screen, the
  admin's Mailbox menu item) exists while `EMAIL_MODE` is `log`, and the practice checkout
  while `PAYMENTS_MODE` is `sim`. Setting real email (D9) or Stripe test keys (F1) removes
  each one with no code change. `hosted-open` and `hosted-access` still work and still show
  the notices, for a copy that should say it is a test. `lib/util.js` lists every mode.
- **The portal has no password**, so sign-up is tested the way a breeder meets it. The test
  mailbox shows each browser only the mail for addresses that browser signed up with, and a
  practice checkout opens only for the breeder who started it. `dev/open-portal-check.mjs`
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

To redeploy after a change, run this from the `app` folder,
with `W` standing for `node ../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js`.

```bash
(cd portal && $W deploy --config wrangler.hosted.jsonc) && (cd admin && $W deploy --config wrangler.hosted.jsonc) && node dev/build-site.mjs && (cd site && $W deploy --config wrangler.hosted.jsonc)
```

To take it down, delete the three Workers in the dashboard. The access tests
(`dev/access-tests.mjs`) run against the local copy only, because they write to the database
directly.

## Walking the journey

1. At the portal, enter any `@breeders.test` address and a business name.
2. Open the local mailbox and type the six-digit code into the portal tab, or press **Open the link**, then **Sign in**.
3. Fill in the profile, tick the terms, and submit.
4. In the operator screens, open **Approvals**, pick the breeder and approve.
5. Back in the portal, add a litter, add a puppy, and add at least one photo.
6. **Pay to list**, choose the puppies, and continue. The practice checkout offers a normal
   payment, a payment whose webhook is "lost" (the success page then publishes on its own),
   and a cancel.
7. Run `node app/dev/preview.mjs` and open the puppy on the preview site.

## Tests

```bash
node app/dev/e2e.mjs            # the whole journey, 41 checks
node app/dev/access-tests.mjs   # the ten acceptance tests from build spec section 4
node app/dev/signin-test.mjs    # the sign-in code, 60-day sessions, the contact change notice
node app/dev/jobs-test.mjs      # the scheduled jobs
node app/dev/google-test.mjs    # Continue with Google, against a stand-in Google on 8799
node app/dev/legal-staging-test.mjs     # the privacy and terms pages and the staging mode
node app/dev/portal-features-test.mjs   # plan P2: standing, site links, extras, batches, views, account
```

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
| Payments | `PAYMENTS_MODE=sim` uses a practice checkout page served by the portal | Set `PAYMENTS_MODE=stripe`, `STRIPE_MODE`, `STRIPE_API_VERSION`, `STRIPE_PRICE_ID`, and the `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets. The Stripe provider in `lib/payments.js` is written to the spec but has not run against Stripe, so its first test-mode run is milestone M5 |
| Bot check on sign-up | Skipped on localhost when no key is set | Set `TURNSTILE_SITE_KEY` and the `TURNSTILE_SECRET` secret |
| Operator sign-in | `DEV_IDENTITY`, on localhost only | Create the Access application and set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Until then a deployed admin answers 403 everywhere, which is the safe state |
| Publishing | `dev/preview.mjs` copies the concept site and writes its `data/data.js` from the export | The cron publish and GitHub commit (spec section 9) and the real generator. Needs Workers Paid |
| Scheduled jobs | Not built. The views already hide expired listings | Expiry warnings, reconciliation, backups and housekeeping (spec section 10) |

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

## Deliberate choices, so nobody "fixes" them back

- The portal sends `frame-ancestors 'none'`, which also blocks framing from its own origin.
  Phone-width checks use a resized tab instead of the usual iframe (CLAUDE.md section 5).
- `lib/images.js` strips EXIF, XMP and IPTC from every upload, because phone photos carry
  GPS and published photos land in this public repository.
- `GET /auth/verify` changes nothing and shows a button. Only the `POST` spends the link,
  because mail scanners open every link first.
- The six-digit sign-in code works only in the browser that asked for it. `/auth/start` sets a
  15-minute HttpOnly cookie, and the stored hash covers that cookie and the code together, so a
  code read over someone's shoulder is no use elsewhere. Five wrong codes spend that sign-in,
  link included, and an address takes no codes for a day after 20 wrong ones (its links still
  work). The link works in any browser, as it always has.
- Breeder sessions run 60 days from their last renewal. Any use more than a day into the window
  renews it and refreshes the cookie, so only an idle breeder is signed out.
- A change to the public phone, public email or website, by the breeder or an operator, is
  emailed to the sign-in address and never to the new public one. A breeder filling in the
  profile before first submitting it gets no notice, because nothing is public yet.
- Schema changes to an existing table go in `migrations/`, run once on each database after a
  backup. `schema.sql` already carries them for a new database.
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
- Asking to close an account (plan P2.7) records a request in `account_requests` and tells the
  operators. Nothing is deleted, and the admin marks the request handled after following up.
- `listing_days` 0 hides every end date and renewal in the portal (plan P2.1, D8). Setting it
  above 0 brings them back with no code change.

## Pending

- [ ] Look at every screen at full size. Screenshots timed out in the browser pane during
      the 2026-09-30 build, so the layouts are measured (no sideways overflow at 320 and 375 in the portal and at 320 in the admin)
      but have not been looked at
- [ ] Listing terms text from Amber, which replaces the REPLACE THIS on the profile screen
      and on the portal's `/terms` page (`portal/legal.js`)
- [ ] Amber's review of the draft privacy policy at `/privacy` (`portal/legal.js`), and the
      Puppy Connection contact email address, which replaces the REPLACE THIS in it twice.
      She also decides how long the activity record and payment records are kept after an
      account closes
- [ ] The scheduled jobs (spec section 10) and the publish commit (spec section 9)
- [ ] Stripe, Resend, Turnstile and Access, each per the table above
- [ ] Amber's own breed list, and the real listing-to-breeder pairing for the migration
- [ ] The kennel photo, breeds and Facebook page are in the site export but the concept pages
      have no place for them, so only the logo shows on the site today. They wait for the
      generated pages (plan P4.3)
- [ ] How long the daily view and click counts are kept. Nothing prunes `puppy_stats` today,
      and it is small (one row per listed puppy per day it is viewed). A question for Amber
      with the other retention questions
