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

## Walking the journey

1. At the portal, enter any `@breeders.test` address and a business name.
2. Open the local mailbox, press **Open the link**, then **Sign in**.
3. Fill in the profile, tick the terms, and submit.
4. In the operator screens, open **Approvals**, pick the breeder and approve.
5. Back in the portal, add a litter, add a puppy, and add at least one photo.
6. **Pay to list**, choose the puppies, and continue. The practice checkout offers a normal
   payment, a payment whose webhook is "lost" (the success page then publishes on its own),
   and a cancel.
7. Run `node app/dev/preview.mjs` and open the puppy on the preview site.

## Tests

```bash
node app/dev/e2e.mjs            # the whole journey, 37 checks
node app/dev/access-tests.mjs   # the ten acceptance tests from build spec section 4
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
- `dev/preview.mjs` patches its own copy of the concept's `js/main.js` in four places, which
  are listed in the script. The live concept is never changed. The patches exist because
  the concept groups breeders by website domain and assumes every photo is on Wix.
- The admin and the portal share `portal/public/portal.css`. `setup.mjs` copies it into the
  admin, so edit the portal's copy.

## Pending

- [ ] Look at every screen at full size. Screenshots timed out in the browser pane during
      the 2026-09-30 build, so the layouts are measured (no sideways overflow at 320 and 375 in the portal and at 320 in the admin)
      but have not been looked at
- [ ] Listing terms text from Amber, which replaces the REPLACE THIS on the profile screen
- [ ] The scheduled jobs (spec section 10) and the publish commit (spec section 9)
- [ ] Stripe, Resend, Turnstile and Access, each per the table above
- [ ] Amber's own breed list, and the real listing-to-breeder pairing for the migration
