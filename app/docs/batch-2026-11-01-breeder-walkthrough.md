---
batch: breeder-walkthrough
date: 2026-11-01
objective: "A short animated walkthrough of the breeder journey, from sign-in to a paid listing, for Alex to review before it may play in the portal on a breeder's first sign-in."
source: "app/portal/public/walkthrough.js and walkthrough.css, the one player. app/docs/walkthrough/index.html is the review page that loads them"
artifact: "https://claude.ai/artifact/Y1AwRdwZc58bxnpVy7Pet4 (private, version 1, 2026-11-01)"
video: "app/docs/walkthrough/render.py writes breeder-walkthrough.mp4 (1920x1080, 30 fps, H.264) beside index.html, gitignored. --phone writes a 1080x1920 version"
running_time: "3:11 on a laptop and 3:15 on a phone after the slower pace and the welcome screen (2026-11-01), the sum of the scene timeline as the page computes it"
facts_from: app/docs/breeder-journey-storyboard.md
reference_screens: "Local portal on 127.0.0.1:8797 with setup.mjs --reset --demo, signed in as the made-up demo kennel Maple Brook Doodles. Nothing was run against the live portal."
sample_names:
  kennel: Maple Brook Doodles
  sign_in_email: casey@example.com
  mom: Hazel
  dad: Bramble
  puppies: [Clover, Juniper, Pepper]
  breed: Mini Bernedoodle
live_settings_used: "$14.99 per puppy, 15 photos, a new photo every four weeks (checked 2026-11-01)"
held_for_parallel_session:
  - "Google sign-in is shown only for an address already added to a kennel, and no Google account screen is drawn."
  - "Checkout is a plain card with the total and Pay, with no fine print."
  - "Parent photos are added with no photo check shown, so nothing claims either rule."
scenes:
  - { id: s0, chapter: none, what: "Welcome to Puppy Connection, the five steps listed and lit in turn (added 2026-11-01, with every scene slowed to 1.35 times)", status: built }
  - { id: s1, chapter: Sign in, what: "Sign-in card, Continue with Google highlighted, then email and password typed and Sign in pressed", status: built }
  - { id: s2, chapter: Moms and dads, what: "Overview, menu to Moms and dads, Add a mom, Fill from a document fills name, breed and health tests", status: built }
  - { id: s3, chapter: Moms and dads, what: "Mom photo added, Add mom pressed, dad saved the same way, both on the page", status: built }
  - { id: s4, chapter: Start a litter, what: "Add a litter, breed typed into the search, dates, weights, mom and dad picked, litter card appears", status: built }
  - { id: s5, chapter: Add the puppies, what: "Add several, 3 girls and 3 boys at one price, six puppy cards appear", status: built }
  - { id: s6, chapter: Add the puppies, what: "Open Girl 1, rename to Clover, Fill from a document, document rotated upright", status: built }
  - { id: s7, chapter: Add the puppies, what: "Add photos, Checking photo 1 of 3, one Sent back, first is Cover, Save puppy, ready to list box", status: built }
  - { id: s8, chapter: Pay to list, what: "Pay to list, Select all, total updates, Pay $44.97 for 3 listings, plain checkout card", status: built }
  - { id: s9, chapter: Pay to list, what: "Back on Litters and puppies, toast, pills change to Listed, four-week photo note, Replay", status: built }
portal_build:
  rule: "Opens by itself the first time a person is in an approved kennel, as its main contact or a manager, once per person per kennel (Alex, 2026-11-01). Help and the Overview's Your first listing card open it any time"
  table: "walkthrough_seen (email, breeder_id, seen_at), migrations/0087_walkthrough_seen.sql and schema.sql"
  worker: "/api/me gains walkthrough. POST /api/walkthrough/seen records it. An operator session never sees it and cannot record it. A missing table reads as seen, so the code can deploy before the migration"
  cleared_with: "demo reset, account closing (retention), removing a person from a kennel, and the daily backup list"
  portal: "portal.js opens a panel (Skip for now, then Get started at the end), Help has Watch the walkthrough, Escape closes. portal.css v36, portal.js v47"
  tests: "app/dev/walkthrough-test.mjs 17 passed. multikennel-test 85 passed, retention, restore and demo all passed (2026-11-01, local)"
  rehearsal: "0087 rehearsed on main's schema, then on the live export production-2026-11-01-pre0087.sql (4.4 MB, 51 tables), foreign keys on, run 1 added one empty table, run 2 changed nothing, 0 key violations (2026-11-01)"
  applied: "2026-11-01 to the live database puppyconnection (4556bf68, account 4f6e9dc2), the only one, since staging became production at launch. app/ops/d1-apply.mjs needs WRANGLER_JS set when run from a worktree"
open:
  - { id: w8, item: "Merge and deploy the slower pace and the welcome screen", blocked_on: Alex approval }
  - { id: w6, item: "Decide whether people who already signed in before the deploy should also see it once (as built they do)", blocked_on: Alex }
  - { id: w1, item: "Alex reviews the artifact and gives corrections", blocked_on: Alex }
  - { id: w2, item: "Decide whether and how it plays on a breeder's first sign-in", blocked_on: Alex }
  - { id: w4, item: "Alex approves the 1080p MP4 or asks for a phone-shaped one", blocked_on: Alex }
  - { id: w3, item: "Recheck the sign-in, checkout and parent photo scenes once the parallel session's changes land", blocked_on: parallel session }
closed:
  - { id: w7, item: "Merge and deploy the portal walkthrough", date: 2026-11-01, evidence: "PR 127 merged (b420d47) after resolving the cache-number clash with main, portal.css v38 and portal.js v47. Deployed from main with wrangler.production.jsonc, portal fb1ef157 and admin 25d65ead. Live portal serves portal.css?v=38, portal.js?v=47, walkthrough.js 200 (52 KB) and walkthrough.css 200 (28 KB). The signed-in panel was not checked on the live portal, because that needs a breeder sign-in" }
  - { id: w5, item: "Back up, rehearse and apply 0087", date: 2026-11-01, evidence: "Backup downloaded to the main checkout app/.state/production-2026-11-01-pre0087.sql. Rehearsal PASS twice. Applied in 1 batch. Read back: walkthrough_seen exists with 0 rows, breeders 43 and puppies 319 as in the backup" }
  - { id: w0, item: "Build and publish the first draft", date: 2026-11-01, evidence: "All nine scenes rendered with no console errors at desktop and phone widths in the local browser, and the artifact published as version 1" }
---

# Breeder walkthrough batch

The walkthrough follows Alex's five steps in his order, so the parents come before the litter
even though the portal's own Overview nudges the litter first. Every label, field and message is
copied from the storyboard and from the local portal screens, with sample names only.

The scenes are recreations drawn in HTML on the portal's own tokens and classes, copied from
`app/portal/public/portal.css` into the page so it stands alone. The photos are drawn puppies,
not photographs, so no real puppy appears.

Reduced motion shows each scene in its finished state with no cursor, typing or slide, and does
not start playing on its own.

## Where the recreation goes beyond what was seen

The Moms and dads list was only seen empty on the local portal, so its rows with a saved mom and
dad (photo, name, "Mom, Mini Bernedoodle. 4 health tests" and Edit) are drawn to match the puppy
rows rather than copied. The checkout card is a plain stand-in with the total and a Pay button.
Fill from a document was off locally because there is no AI binding there, so its box and messages
come from the markup and strings in `portal.js`.
