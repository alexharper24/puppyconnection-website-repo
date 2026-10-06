---
doc: build-out-plan
written: 2026-10-02
asked: "build out all of the functionality in the config that doesn't require me to actually spend money ... so that I can ultimately test and even potentially show Amber the process ... make sure the aesthetics of the back end, both the breeder portal and also the admin panel ... looks clean, it's organized, it's aligned ... do a full assessment review ... are we missing anything ... make sure we have a good plan to then execute"
status: "IN PROGRESS 2026-10-05. P1, P4.1, P4.2, D8, Google sign-in (P6.1, P6.4, P6.8), the sign-in code, 60-day sessions and the contact change notice (P6.2, P6.3, P6.6) on staging. Next is P7, the production-like staging, then P2 and P3"
scope:
  in: "Everything the portal, admin, site and their jobs need that costs nothing, built and tested on the Puppy Connection staging copy"
  out:
    - "Workers Paid ($5 a month), unless staging measures a publish that cannot fit the free plan. Then it is the one cost, and it waits for Alex"
    - "Live Stripe in Amber's name, real email from puppy-connection.com, and the domain move. These are launch steps"
    - "The Wix import itself, which needs Amber's pairing of each listing to its breeder. The import script is in, run against a copy"
assessment_2026_10_02:
  method: "Both tools run locally with a signed-in test breeder and the 204 seed listings, measured at 1600 px in the Browser pane, and read against the Teapup editor and the implementation spec"
  layout:
    - "Every screen in both tools caps content at 1100 px and anchors it to the menu. At 1600 px wide that leaves 35 px on the left and 233 px empty on the right"
    - "The admin Listings screen renders all 204 listings at once, 14,255 px tall, with no search, filter or paging"
    - "Overview stat cards wrap six then two, and the public site card is a large box with two lines in it"
    - "Activity shows a table with headings and no rows, and no line saying there is nothing yet"
    - "A pending breeder's menu offers Litters, Pay to list and Payments, none of which work until approval"
    - "Neither tool carries the Puppy Connection logo, only the name in type"
    - "The phone layout is untested. The portal refuses to be framed, which is correct, so the iframe method cannot be used and it gets checked at real widths instead"
  working_well:
    - "The getting-listed checklist on the breeder overview"
    - "The puppy editor panel, with status, what comes with the puppy, and photos"
    - "The pay screen explaining what each puppy still needs before it can be paid for"
decisions:
  - {id: D1, status: "closed 2026-10-02", answer: "Option A, the dark menu (Alex)", preview: "app/preview/shell-options.html, deleted 2026-10-02 once P1 landed", item: "The look of both tools. Recommend building a preview page with two shells side by side, one following the Teapup editor (dark grouped menu, centered work area up to 92rem, page header and panels) and one lighter variant in the site's cream and gold, then deleting the preview after the pick"}
  - {id: D2, status: "closed 2026-10-02", answer: "Alex sets up Stripe himself (F1)", item: "Whose Stripe test account staging uses. Recommend a free Stripe account Alex opens now in test mode, swapped for Amber's at launch, because hers takes one to two weeks to verify and the test runs do not depend on it"}
  - {id: D3, status: "closed 2026-10-02", answer: "Logo, kennel photo, breeds and a Facebook page, all optional (Alex)", item: "Which optional profile fields a breeder gets. Recommend logo, one kennel photo, the breeds they raise and a Facebook page, all optional, and nothing that asks for information breeders may not have"}
  - {id: D4, status: "closed 2026-10-02", answer: "Refresh from the live Puppy Connection site, or Alex signs in to Wix if that fails. The public product pages answered, so no Wix sign-in or API key is needed (Alex)", item: "Demo data for showing Amber. Recommend keeping the 204 seed listings plus three made-up breeders at different stages, with a reset that puts staging back to that state"}
  - {id: D8, status: "closed 2026-10-04", answer: "Listings do not expire, the fee is a one-time payment (Alex). listing_days 0 means no end date; setting a number turns expiry and renewals back on without a rebuild", item: "How long a paid listing lasts"}
  - {id: D9, status: open, blocked_on: alex, item: "Where staging sends email from before puppy-connection.com is on Cloudflare. Resend's free plan delivers only to the account owner until a sending domain is verified, and workers.dev cannot be one. Options are a subdomain of a domain Alex controls, verified in Resend for staging only, or moving puppy-connection.com's DNS to the Puppy Connection Cloudflare account early (the site can stay on Wix) and sending from it with Resend or Cloudflare Email Sending. Recommend the second, because launch needs it anyway"}
  - {id: D5, status: open, blocked_on: "alex and amber", item: "Who owns the Puppy Connection Google account that holds the OAuth client for P6.1 and P6.4. Recommend Amber's business Google account, or a new account for the platform on a puppy-connection.com address, with Alex added as a second owner of the Cloud project"}
  - {id: D6, status: open, blocked_on: amber, item: "What staff can do. Recommend staff approve breeders and hold listings, and only the owner changes settings and handles refunds"}
  - {id: D7, status: open, blocked_on: amber, item: "Whether a kennel can have more than one person signing in. Today each breeder account has one sign-in"}
free_accounts_alex_opens:
  - {id: F1, item: "Stripe account in test mode (free, no card)", unblocks: "real Checkout, the webhook, refunds and disputes on staging"}
  - {id: F2, item: "Resend account (free tier, 100 a day)", unblocks: "real sign-in and notice emails to an allowed list of Alex's addresses, sent from Resend's shared address until the domain is verified"}
  - {id: F3, status: "done 2026-10-02", evidence: "widget created by Claude with Alex approval, TURNSTILE_SECRET set by Alex", item: "Turnstile widget in the Puppy Connection account (free)", unblocks: "bot protection on sign-up"}
  - {id: F4, item: "Fine-grained GitHub token, Contents read and write on the site repo only (free)", unblocks: "publishing generated pages through CI"}
phases:
  - id: P1
    name: "Layout and polish, both tools"
    tasks:
      - {id: P1.1, status: "done 2026-10-02", evidence: "shell-a and shell-b from real listings; no page overflow at 360 to 1920, table fits from 390 up and scrolls 21 px at 360", task: "Shell preview with the two options for D1"}
      - {id: P1.2, status: "done 2026-10-02", evidence: "both tools on the Option A shell (portal.css v2, admin.js v4, portal.js v5); every screen centered with equal side gaps, measured at 360, 390, 768, 1024, 1280, 1600 and 1920", task: "Centered work area using the full width up to a cap, page header with a one-line purpose on every screen, logo in the menu, menu grouped by job"}
      - {id: P1.3, status: "done 2026-10-02", evidence: "admin Breeders, Listings, Approvals, Payments and Activity search, filter and page 25 at a time; a top-bar search across breeders and listings; Listings 14,255 px tall before, 2,048 px after. Sortable columns not done, moved to P3", task: "Search, filters and paging on admin Breeders and Listings, and sortable columns"}
      - {id: P1.4, status: "done 2026-10-02", evidence: "empty states on every list, four even stat cards, confirm before Hold, List free, removing a litter or a puppy", task: "Empty states on every list, consistent stat cards, confirmation on anything that cannot be undone"}
      - {id: P1.5, status: "done 2026-10-02", evidence: "a pending breeder sees Overview and Profile with a note on what opens after approval, and litters, pay and payments send them to the overview", task: "A pending breeder sees only what they can use, with the rest explained"}
      - {id: P1.6, status: "done 2026-10-02", evidence: "no page overflow and no table scroll at any of the seven widths in either tool, no tap target under 34 px, menu wraps to two lines on a phone; e2e 41 of 41, access tests 10 of 10; staging portal 3b0f6f44, admin 818360a8", task: "Phone and tablet pass at 360, 390, 768 and 1024, plus 1280, 1440 and 1920, measured and screenshotted"}
  - id: P2
    name: "Breeder portal, what a breeder expects"
    tasks:
      - {id: P2.1, status: open, task: "Each puppy shows where it stands, meaning listed, placed, paused, or what it still needs before it can be paid for. Dates and a renew button appear only if expiry is turned back on (D8)"}
      - {id: P2.2, status: open, task: "View on the site links for the breeder page and each live puppy"}
      - {id: P2.3, status: open, task: "Optional profile extras per D3, with uploads through the same in-browser resize as puppy photos"}
      - {id: P2.4, status: open, task: "Add a whole litter's puppies in one step, duplicate a puppy, and mark placed from the list"}
      - {id: P2.5, status: open, task: "Views and clicks through to the breeder for each puppy, so a breeder can see what a listing produced"}
      - {id: P2.6, status: "done 2026-10-04 as a setting", evidence: "D8 made listings permanent; listing_days 0 on staging and as the default, paid listings get no end date, a listed puppy cannot be paid for twice, the expiry job reports itself off; renewal still works if listing_days is set above 0 (jobs-test 20 of 20 runs with it at 60); e2e 41 of 41, access 10 of 10; staging backed up to app/.state/staging-before-no-expiry-2026-10-04.sql first", task: "Renewal of expired listings through the same checkout"}
      - {id: P2.7, status: "open, POST /auth/signout-all built 2026-10-05 (P6.3), screen still to do", task: "Account screen to change the sign-in email, sign out everywhere, and ask to close the account"}
      - {id: P2.8, status: open, task: "Short help page answering how listing, payment, expiry and approval work"}
  - id: P3
    name: "Admin, what Amber needs to run it"
    tasks:
      - {id: P3.1, status: "open, server side of the profile edit in 2026-10-05 (PUT /api/breeders/:id/profile, P6.6)", task: "Edit a breeder's profile and puppies on their behalf, recorded in the audit as done by the operator"}
      - {id: P3.2, status: open, task: "Private operator notes on each breeder"}
      - {id: P3.3, status: open, task: "Breeds screen to add a breed and edit its guide text"}
      - {id: P3.4, status: open, task: "Terms screen to edit the listing terms, with a new version asking breeders to accept again"}
      - {id: P3.5, status: open, task: "Publish screen showing when the site last updated, anything waiting, the last error, and a Publish now button"}
      - {id: P3.6, status: open, task: "Email log, showing what was sent to whom and whether it failed"}
      - {id: P3.7, status: open, task: "Reports for listings and revenue by month, listings by breed, and what expires in the next two weeks, with a CSV download"}
      - {id: P3.8, status: open, task: "Refund and dispute handling against Stripe test mode, with the listing taken down on a refund"}
      - {id: P3.9, status: open, task: "Needs-attention list for anything a job flagged, such as a payment with no listing or a failed publish"}
  - id: P4
    name: "Behind the scenes, at no cost"
    tasks:
      - {id: P4.1, status: "done 2026-10-02 except the human pass test", evidence: "staging refuses sign-up with no token and with a forged token (400); a real sign-up in Alex's own browser still to confirm the pass side; server check and sign-in widget already in the portal; staging runs hosted-open, which allows sign-up without a secret, so it switches on when TURNSTILE_SITE_KEY and TURNSTILE_SECRET are set from F3", task: "Turnstile on sign-up, with Cloudflare's test keys locally"}
      - {id: P4.2, status: "done 2026-10-02", evidence: "lib/jobs.js with expiry, housekeeping, reconcile and backup on two cron triggers (*/15 and 0 13 UTC), job_runs table, admin Settings shows each job with Run now; dev/jobs-test.mjs 19 of 19, both crons fired locally through __scheduled, e2e 41 of 41, access 10 of 10; staging portal 8fd3b849 with both schedules registered, admin 906d1a21. Publish is not one of the jobs yet, it waits for P4.3", task: "Scheduled jobs for publish, reconciliation, expiry warnings and expiry, nightly backup to R2 and housekeeping, folded into the free plan's five cron slots"}
      - {id: P4.3, status: open, task: "Static breed, breeder and puppy pages generated from the database, the publish commit, and the CI build of the site"}
      - {id: P4.4, status: open, task: "Admin Publish now through a service binding to the portal"}
      - {id: P4.5, status: open, task: "Real Stripe provider proven against test mode, through the whole test list in the spec"}
      - {id: P4.6, status: open, task: "Resend provider proven against the allowed list"}
      - {id: P4.7, status: open, task: "Wix import script, run against a copy of the database"}
      - {id: P4.8, status: open, task: "Restore from a nightly backup, rehearsed once on staging"}
  - id: P6
    name: "Sign-in and account security, added 2026-10-03"
    tasks:
      - {id: P6.1, status: "built 2026-10-04, waiting on Alex's live sign-in", evidence: "lib/google.js (authorization code, PKCE S256, state, nonce, RS256 check against Google keys, issuer, audience, expiry, verified email) and one find-or-create shared with the emailed link; dev/google-test.mjs 18 of 18 incl. a full local sign-in against a stand-in Google, and it fails when the nonce and audience checks are removed; e2e 41, access 10, jobs 20; staging portal 8bf32be1 starts the real Google flow", task: "Continue with Google on the breeder portal, verifying Google's answer on the server, linking to an existing account only on a verified email, applying the same approval and suspension rules, with the emailed link kept as the fallback"}
      - {id: P6.2, status: "done 2026-10-05", evidence: "signin_link email shows a six-digit code above the link; the Check your email screen has a code box (one-time-code autofill); POST /auth/code; login_tokens keeps only SHA-256 of the browser cookie plus the code (code_hash), browser_hash and code_tries, added by migrations/0001_signin_code.sql on local and on staging after backup app/.state/staging-before-signin-code-2026-10-05.sql; /auth/start sets a 15-minute HttpOnly SameSite=Lax pc_signin cookie the code is bound to; five wrong codes spend the row (code and link), 20 wrong codes in a day stop codes for that address while its links still work; code and link share used_at and expires_at; GET /auth/verify still changes nothing; dev/signin-test.mjs 48 of 48 (success, spaces, wrong, malformed, too many, daily cap, expired, reuse, browser that never asked, browser that asked for another address, link unchanged); checked in the Browser pane at 360 px with no overflow and a real code sign-in; staging portal 381a42d0", task: "Six-digit code in the sign-in email beside the link, so a breeder on a phone stays in the same tab"}
      - {id: P6.3, status: "done 2026-10-05", evidence: "SESSION_DAYS 60; a session used more than a day into its window moves expires_at to 60 days from now and the router refreshes the cookie (Max-Age 5184000) unless the handler set the session cookie or the response is publicly cached; revoked and expired sessions are refused and never renewed; POST /auth/signout-all revokes every session and is audited as breeder.signout_all (P2.7 still owes the screen); signin-test covers a new session at 60 days, no renewal inside the first day, renewal at day 10, renewal at 59.5 days idle, sign-out at 60 days idle, revocation, sign out everywhere and single sign-out", task: "Breeder sessions last 60 days and renew with use, replacing the fixed 30 days"}
      - {id: P6.4, status: "set up 2026-10-04, waiting on Alex's live sign-in", evidence: "Google login method in Access with the shared client and PKCE, secret entered by Alex", task: "Google as a sign-in method on the admin's Access application, using the same OAuth client as P6.1"}
      - {id: P6.5, status: "set up 2026-10-03, waiting on Alex to enroll", evidence: "Access settings allow biometrics, security key and authenticator app, global MFA enforcement on for every Access application, App Launcher opened to the operator policy so operators can enroll at dry-snowflake-0e9c.cloudflareaccess.com", task: "Access two-step check (authenticator app or security key) required for operators"}
      - {id: P6.6, status: "done 2026-10-05", evidence: "contact_changed template in lib/mail.js naming each change as was and now and asking them to contact Puppy Connection if they did not make it; sent to the sign-in email, never the new public one, from the portal profile save and from a new admin PUT /api/breeders/:id/profile (server side of P3.1, no screen yet); profile.update audit rows now carry the before values; a breeder who has never submitted the profile gets no notice, because nothing is public yet and every sign-up would get one; signin-test checks portal and operator changes, old and new values, no mail to the new public address, no notice when contact details are unchanged, the operator audit row and a 409 on a stale operator edit; staging admin 5b0ad0f0", task: "Email the breeder whenever their public phone, email or website changes, so a stranger's edit is noticed by the real owner"}
      - {id: P6.7, status: open, task: "Staff permissions per D6"}
      - {id: P6.8, status: "built 2026-10-05, waiting on Alex's live sign-in", evidence: "Google Identity Services One Tap and Google's own button on the portal sign-in page, nonce held in an HttpOnly cookie, token checked exactly as the redirect flow; portal CSP and Referrer-Policy opened to accounts.google.com/gsi only, admin unchanged; google-test 25 of 25, e2e 41, access 10, jobs 20; staging portal c41a7457 renders the button", task: "One Tap and Google's in-page button, so a breeder signs in without leaving the portal"}
  - id: P7
    name: "Staging that looks and behaves like production, added 2026-10-05"
    why: "Alex, 2026-10-05: show a live environment, not on the domain, with breeder accounts, approval, listing and sandbox Stripe payment end to end, so launch only flips accounts like Stripe to live"
    tasks:
      - {id: P7.1, status: "done 2026-10-05 as drafts, waiting on Amber", blocked_on: amber, evidence: "portal/legal.js served at /privacy and /terms through page(), both noindex; privacy draft written from the code (sign-in email, published profile fields, photo location and camera details stripped, Google name and email only, Stripe holds card details, Cloudflare and Turnstile, Resend or Cloudflare email, sign-in links a day and sessions a week, backups 90 days, closing an account), contact address left as REPLACE THIS; the activity log is NOT pruned at 90 days today, so the draft says so and asks Amber to decide; terms page is the marked placeholder with the version on file; links from the sign-in footer, every plain page, the portal shell and the profile submit card; public site footer links added through dev/site-copy.mjs patch 4; dev/legal-staging-test.mjs 18 of 18 local; staging portal 4d51c2b8 and site 79f4c5d9 serve them", task: "Privacy policy and terms pages on the portal. The privacy policy is drafted by Claude and marked for Amber's review; the terms wait on Amber's own words (build spec section 14) and show as a clearly marked draft until then"}
      - {id: P7.2, status: open, blocked_on: "claude, then alex", task: "Google app moved from Testing to In production: home page, privacy and terms links, authorized domain puppyconnection.workers.dev. Asking only for name and email needs no Google review, so any Google account can sign in and the unverified warning goes. The logo waits for brand verification at launch"}
      - {id: P7.3, status: "done 2026-10-05 for everything but email and payments", blocked_on: "alex (D9, F1) for the last two surfaces", evidence: "DEV_MODE staging in lib/util.js shows no test notices, keeps noindex (robots meta plus X-Robots-Tag on portal and admin), has no operator stand-in, and keeps hosted-open access rules; the mailbox follows EMAIL_MODE log and the practice checkout PAYMENTS_MODE sim, so D9 and F1 remove them with no code change; EMAIL_MODE and PAYMENTS_MODE left as log and sim on staging. e2e 41 of 41 against a local portal run with --var DEV_MODE:staging, legal-staging-test 23 of 23 incl. per-browser mailbox scoping; the normal local suites e2e 41, access 10 of 10, google 25, jobs 20. Staging portal 4d51c2b8 and admin c15472e6 on DEV_MODE staging, curl shows notices false, mailbox true, /dev/mail 200 scoped, /sim/checkout 404 for a stranger, admin 302 to Access. open-portal-check 5 of 6 on staging, the sign-up step refused by Turnstile as it has been since P4.1, so the hosted sign-up and payment pass is a human click-through. Also fixed the Google button rendering 400 px wide and clipping the sign-in card at 360 px", task: "A staging mode that drops every simulation surface: the test-version banners, the test mailbox, the practice checkout and the operator stand-in. Search engines still kept out"}
      - {id: P7.4, status: open, blocked_on: "alex (F1)", task: "Stripe sandbox: the $14.99 product and price and the webhook endpoint created in test mode, the keys set as secrets, and the spec's Stripe test list run on staging (paid, declined, lost webhook, refund, dispute)"}
      - {id: P7.5, status: open, blocked_on: "alex (D9)", task: "Real email from staging per D9, so sign-in links, approvals and notices arrive in real inboxes"}
      - {id: P7.6, status: open, blocked_on: "claude, then alex (F4)", task: "P4.3 publishing, so the public site is generated pages built on each change rather than the live-read stand-in"}
      - {id: P7.7, status: "done 2026-10-05", evidence: "docs/launch-checklist.md, items L0 to L15 each open with who it waits on, STE checklist with WARNING and CAUTION before the risky steps; notes that a refund leaves the listing up today (P3.8)", task: "A launch checklist naming exactly what flips: Stripe live keys and price, the Google app under the Puppy Connection account with brand verification, the domain and its email records, Access on the admin hostname, and noindex off"}
  - id: P5
    name: "Ready to show Amber"
    tasks:
      - {id: P5.1, status: "partly done 2026-10-02", evidence: "_harvest/refresh.py took 273 of 274 live products (willow-mini-bernedoodle is in the sitemap with no product); prices from the stated Price line, 77 placed; local and staging reseeded through seed- ids only, staging backed up first to app/.state/staging-before-refresh-2026-10-02.sql; commit be5491e. Left: the three made-up breeders at different stages, and a reset button", task: "Demo data and a reset per D4"}
      - {id: P5.2, status: open, task: "A walk-through script for both sides, written for Amber"}
      - {id: P5.3, status: open, task: "Every automated test green on staging, plus a click-through of the script by Claude before Alex shows it"}
order: "P1.1 first so D1 can be decided while P4.1, P4.2 and P4.3 go ahead, since those need no decision. Then P1, P2 and P3 together, then P4.5 and P4.6 as F1 and F2 arrive, then P5"
---

# Puppy Connection build-out plan

This turns the working test copy into a staging copy with every free connection made
real, and brings the portal and the admin up to the standard of the Teapup editor. The
measurements behind the layout items are in the header. Each task's status changes there
as it lands, and the order line says what can start before the decisions come back.
