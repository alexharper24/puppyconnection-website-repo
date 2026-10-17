---
title: "Puppy Connection launch workplan"
created: 2026-10-17
read_first_by: "every session working toward launch. Read this file, then _claude-state.md, then the launch checklist (launch-checklist.md) for the step-by-step of any L item."
scope: "Everything that must be true before puppy-connection.com goes live on the new site: the work inside the build that is partly done, and the launch additions in the plan Amber is choosing from. Gate 1, 2 and 3 additions are out of scope until Amber picks them."
rules:
  - "Two code sessions at most, S1 and S1b, each in its own worktree with the file ownership noted on it. Only S1 writes migrations. Pull and rebase on main before every commit, keep commits small, and if both change generate.mjs, the later one resolves the merge."
  - "Update the status of an item in this header as it moves, with the commit or evidence. Never delete an item that is still open."
  - "Prices and hours never go in this repo. They live in hs-proposals/puppyconnection."
  - "Launch additions are built only once Amber has ticked the launch piece, unless Alex says to start on the defaults."
sessions:
  - {id: S1, name: "Data features build", kind: code, items: [A1, A2, A3, A4, A5, A8, A9, B6], parallel_with: [S1b, S2, S3, S4], note: "Owns migrations, portal, admin and the puppy-page data block in generate.mjs"}
  - {id: S1b, name: "Site and content build", kind: code, items: [A7, D3, G1, G2, G3, G4, G5, G6, G7, G8, A6], parallel_with: [S1, S2, S3, S4], note: "Owns site layout, CSS, info pages, guides and the footer. Coordinate generate.mjs changes with S1 by pulling before each commit"}
  - {id: S2, name: "Accounts and services go live", kind: dashboards, items: [B1, B2, B3, B4, B5, B6], parallel_with: [S1, S3, S4], note: "Alex in Chrome with Claude in Chrome. Card entry, terms and secrets are Alex's."}
  - {id: S3, name: "Wix data, photos and mailing list", kind: data, items: [C1, C2, C3, C4], parallel_with: [S1, S2, S4], note: "Runs scripts in app/ops and migrations against staging, so coordinate migration numbers with S1."}
  - {id: S4, name: "Content and legal text", kind: content, items: [D1, D2, D3, D4, D5, D6], parallel_with: [S1, S2, S3]}
  - {id: S5, name: "Domain cutover and search", kind: cutover, items: [E1, E2, E3, E4, E5], after: [S1, S2, S3, S4]}
  - {id: S6, name: "Launch checks and training", kind: closeout, items: [F1, F2, F3, F4, F5, F6], after: [S5]}
items:
  # S1 Launch additions build (code). Defaults are in hs-proposals/puppyconnection/scope.py.
  - {id: A1, status: open, blocked_on: none, item: "Listing review as settled by Alex (2026-10-17): breeders are approved once, at sign-up and profile setup, which is built; approved breeders then add litters and puppies with no further approval, which is how the portal works today; the photo quality check (A9) guards every photo. What is left here is confirming nothing in the portal or admin implies per-listing approval, and that the admin can put a breeder back under review after a report (A5).", done_when: "a test shows an approved breeder's paid puppy publishing with no approval step, and the admin can suspend and reinstate a breeder after a report"}
  - {id: A2, status: open, blocked_on: none, depends_on: [], item: "Week-by-week inactivity schedule on the defaults (Alex, 2026-10-17): reminders at weeks 2 and 3 with a signed one-click Still available link, offline at week 4, removed at week 6 with the record kept, free reactivation within six weeks, wording kept in code, removed puppy pages redirect to their breed page, imported Wix listings skipped until their breeder signs in. Replaces the 60-day expiry.", done_when: "a moved-clock test walks one listing through every week, and the generator writes the breed-page redirect for a removed puppy"}
  - {id: A3, status: "built 2026-10-17, video on staging waits on Stream", blocked_on: "alex (subscribe to Stream on the Puppy Connection account and set the STREAM_API_TOKEN secret, then STREAM_MODE stream)", evidence: "commit 67307e1, migration 0016 on staging (backup .state/staging-2026-10-17-pre0016.sql), portal 4de722f2 and admin 44062d7e deployed, site repo 047e870; launch-features-test details 24, publish-test 129, access-tests 55, admin-features 104, restore 39; the editor checked at 375 px with each field and a video through the stand-in Stream", item: "More puppy details and video: registration (registry list from her Wix Add Puppy form, AKC, AKC Canine Partners, APRI, ACA, CKC, UKC), markings, health and vaccination notes, deworming, disclosures, the breeder's deposit link, and video files breeders upload to the puppy page through Cloudflare Stream. All fields optional.", done_when: "a breeder adds each field and a video in the portal on a phone width, and the generated puppy page shows them"}
  - {id: A4, status: open, blocked_on: none, depends_on: [A1, A2], item: "More reports: pending, inactive and new-breeder counts on the reports screen, a daily count of breed searches on the browse page (no visitor details), breeder-reported sales kept apart, and a privacy policy line for the search counting.", done_when: "the reports screen shows each count against staging data"}
  - {id: A5, status: open, blocked_on: none, item: "Report a listing: a short form on puppy and breeder pages with Turnstile and the rate limiter, a reports table and admin list, and an email to Amber.", done_when: "a report from the site lands in the admin list and the email log"}
  - {id: A6, status: open, blocked_on: "amber (the statement wording, content ask)", item: "Seller statement on every puppy page, and a box the breeder ticks once with the listing terms acknowledging the breeder is the seller.", done_when: "the statement shows on generated puppy pages and the acknowledgment date is stored"}
  - {id: A7, status: closed, closed: 2026-10-17, evidence: "App commit 4e67399, site repo 4948030. transportation.html builds with the Furry Freight logo, Get a delivery quote, phone and email; on staging /transportation answers 301 to /transportation.html, and puppy-bluey-pomeranian.html carries the Not local? line (196 of 273 local puppy pages, every one not yet adopted). Checked at 1280 and 375px. Furry Freight details still wait on Amber under D6", item: "Transportation page featuring Furry Freight, as on blessyourpaws-website-repo process.html#delivery: the Furry Freight logo (copy img/brand/furry-freight-logo.png from that repo), a Get a delivery quote button to https://www.furryfreightdelivery.com/schedule-a-delivery, a Not local? line on puppy pages, families book and pay Furry Freight directly. Do not name Bless Your Paws on the Puppy Connection site. Point the /transportation row in build/legacy-pages.tsv at the new page.", done_when: "the page builds, /transportation answers 301 to it, and puppy pages carry the line"}
  - {id: A8, status: open, blocked_on: none, item: "Adopted puppies out of Google after 30 days (default): a placed_at date set when a breeder marks a puppy adopted (imported adopted puppies dated at import), and the generator drops them from the sitemap and sets noindex after 30 days.", done_when: "a test shows an adopted puppy leaving the sitemap after the window"}
  - {id: A9, status: open, blocked_on: none, depends_on: [], item: "Photo quality check on every upload: size floor near 1,000 pixels and a darkness prompt in the browser; a Workers AI vision call that sends back photos where the puppy cannot be seen (hidden head, too small or far, turned away, motion blur) and photos with a person filling the frame, a puppy from behind or face down, small phone photos or heavy watermarks (the Puppy Connection logo is allowed). Default (Alex, 2026-10-17): the breeder is told what is wrong and re-uploads, rather than waiting on Amber; a setting switches flagged photos to Amber's review queue instead. Whether a dog is grown is not checked. Test set: hs-seo-data/puppyconnection/2026-10-17-photo-sample (100 photos with Alex's calls).", done_when: "the test set scores with no more than a few disagreements against Alex's calls, the cost per photo is measured, and the setting switches the route"}
  # S1b Site fixes (Alex, 2026-10-17)
  - {id: G1, status: closed, closed: 2026-10-17, evidence: "App commit 4e67399. scroll-padding-top on html uses the header height main.js measures. app/dev/link-check.mjs found 0 broken of 10,222 internal links across 353 pages built from the staging export, and a browser walk of 64 anchor targets (every non-repeating one plus samples of #dBreeder and #content) put each at or below the header bottom at 1280, 1024, 375 and 320px, where before the fix all 62 non-skip targets sat under the header", item: "Every link that points to a section of a page (an anchor) lands at the right scroll position, below the sticky header, on every page and at phone width; every link that points to another page lands on it.", done_when: "a script walks every internal link on the built site and each anchor target exists and sits below the header after the jump"}
  - {id: G2, status: closed, closed: 2026-10-17, evidence: "App commit 4e67399. The For breeders band on the home page sits on the brand cream #e7e2d2 (body text #262626 at 11.7:1, eyebrow #5c4f2f at 6.2:1) above the #262626 footer, and the footer logo is 132 by 64px instead of 190 by 92. Checked on staging and at 1280 and 375px", item: "The For breeders band above the footer and the footer are the same charcoal, so they read as one block. Give them different grounds within the brand, and use the smaller logo in the footer so it takes less height on the left.", done_when: "the band and footer are visibly separate on desktop and phone, and the footer column is shorter"}
  - {id: G3, status: closed, closed: 2026-10-17, evidence: "App commit 4e67399. A sweep of the visible text of every built page found three fixed claims, the since 2020 lines on the home page and list-with-us and more than 20 years on About, and all three are gone. Every other count and price on the built site comes from listing data at build time, and $14.99 stays on the For breeders band, list-with-us, How it works and Contact", item: "Remove non-durable figures and prices across the site, meaning counts that change often (puppies, breeders, years since a date) and prices other than the $14.99 listing fee where it is the product, such as the For breeders band.", done_when: "a grep of the built site finds no hard-coded counts or dated claims, and any count still shown comes from live data"}
  - {id: G4, status: closed, closed: 2026-10-17, evidence: "App commit 4e67399, site repo 4948030. The highlights on breed pages are plain heading and sentence blocks on the page ground, and the guides panel has no box or left rule (computed border 0 and transparent background on staging). Checked at 1280 and 375px", item: "Breed page highlights and the guides panel lose their thin gold top border, outline and left accent rule (Alex, 2026-10-17: they do not match the clean look of the rest of the site and look AI)", done_when: "no border or tinted box on either, at desktop and phone"}
  - {id: G5, status: closed, closed: 2026-10-17, evidence: "App commit 91c39a1, site repo f881491. On staging the home page price box carries price-card-gold (gold #f7d57f, no outline, charcoal label at 10.7:1), the list-with-us closing band is band-cream, and every page footer reads Site by Harper Studio. A sweep of all built pages finds none whose last section is charcoal. Checked at 1280 and 375px", item: "The $14.99 box in the home For breeders band in brand gold with charcoal text and no outline; the list-with-us closing band separated from the footer like the home page; the Harper Studio credit on the footer copyright line (Alex, 2026-10-17)", done_when: "all three on staging at desktop and phone"}
  - {id: G6, status: open, blocked_on: none, item: "Breed and puppy pages: the two columns start at the same height and end without a large gap beside the shorter one (Alex, 2026-10-17: align vertically better the sections and content)", done_when: "column tops align and neither column leaves a large gap at 1280, 1440 and 375px"}
  - {id: G7, status: open, blocked_on: none, item: "Breed page highlights get a thin even border on all four sides in the neutral line color, like the puppy facts grid, with no gold rule, fill or accent (Alex, 2026-10-17)", done_when: "the four blocks are bordered on staging at desktop and phone"}
  - {id: G8, status: open, blocked_on: none, item: "Puppy page gallery autoplays with a crossfade as on Bless Your Paws (0.7s fade, 4s dwell, pauses on hover, focus, hidden tab and out of view, off under reduced motion, thumbnails and arrows restart the timer); the same on the breed page photo if it reads well", done_when: "the gallery rotates on staging and every pause condition is checked"}
  # S2 Accounts and services go live
  - {id: B1, status: closed, closed: 2026-10-17, evidence: "Alex confirmed portal.puppy-connection.com and admin.puppy-connection.com", ref: L0, item: "Real hostnames"}
  - {id: B2, status: open, blocked_on: "amber (her Stripe account and verification)", ref: [L1, P4.5], item: "Sandbox testing complete (Alex, 2026-10-17). Left: Amber's own Stripe account with the live $14.99 product and price, the live webhook on portal.puppy-connection.com, live keys as secrets, STRIPE_MODE live.", done_when: "one real payment and refund in live mode (F3)"}
  - {id: B3, status: open, blocked_on: "the domain going live on Cloudflare (E1)", ref: [L4, D9, P4.6, P7.5], item: "Real email through Resend for everything, transactional and the mailing list (Alex, 2026-10-17; Cloudflare Email Service does not allow list sends). SPF, DKIM and DMARC on puppy-connection.com alongside the Google Workspace records, EMAIL_FROM, EMAIL_MODE resend, and the mailing address the list emails require.", done_when: "a sign-in code, an approval email and a list test email arrive in real inboxes"}
  - {id: B4, status: open, blocked_on: "alex and amber (which Google account owns it)", ref: [L2, D5], item: "Google sign-in moved off Alex's staging Cloud project: a project under the Puppy Connection Google account, consent screen published and brand-verified (needs the live privacy policy and a verified domain), redirect URIs for the real portal hostname.", done_when: "Google sign-in works on the real portal hostname for an account outside the test-user list"}
  - {id: B5, status: open, blocked_on: "alex", ref: [L5, L6, L7], item: "Cloudflare Access application on the admin's real hostname with the operator policy and two-step check, Luke added as an owner, Turnstile hostnames for the real portal, and production config with DEV_MODE unset.", done_when: "the admin answers only to the policy on its real hostname and the mailbox and practice checkout are gone"}
  - {id: B6, status: closed, closed: 2026-10-17, evidence: "build-out-plan D6, D7 and P6.7 closed and publishing marked wired; README publishing, roles, kennel members and Stripe rows match staging (portal secrets list PUBLISH_HOOK_URL, site sitemap 200)", item: "Bring app/docs/build-out-plan.md and the app README up to date: D6 and D7 are built (staff roles, kennel members) and publishing is wired on staging (PUBLISH_HOOK_URL set), but both files still list them as open.", done_when: "both files match the code and staging"}
  # S3 Wix data, photos and mailing list
  - {id: C1, status: open, blocked_on: "amber (pairing answers)", ref: [L17, g1-old-site], item: "Finish the breeder pairing: Peaceful Paws and its 120 puppies (and whether its breeder details show), the Responsible Dog Breeder Network's member kennels, and the remaining unassigned listings. Migrations that move puppies between breeders need PRAGMA defer_foreign_keys through d1 execute --command on the hosted database.", done_when: "no listing sits under an unassigned breeder"}
  - {id: C2, status: open, blocked_on: "C1", ref: [L17, g2-images], item: "Copy the 2,115 Wix listing photos into R2 with app/ops/wix-import.mjs --upload-to and point every listing at /media, before the Wix plan ends.", done_when: "no generated page references static.wixstatic.com"}
  - {id: C3, status: open, blocked_on: "amber (Export Contacts permission for Alex's Wix role, in the next asks)", ref: [pc-mailing-list], item: "Import the Wix subscriber list (761 subscribed contacts on 2026-10-17) through the admin CSV import once Alex's role can export.", done_when: "subscriber count matches the export, with unsubscribed addresses kept unsubscribed"}
  - {id: C4, status: open, blocked_on: "cutover day", ref: [g1-old-site], item: "Re-inventory the live Wix puppy addresses on cutover day so every /product-page address has its 301.", done_when: "the re-inventory finds no live Wix puppy address without a redirect"}
  # S4 Content and legal text
  - {id: D1, status: open, blocked_on: "amber (four privacy decisions and the contact email)", ref: [L12, P5], item: "Privacy policy: put in Amber's decisions and contact address in portal/legal.js, add lines for the launch additions (search counting, reports, photo check, video), and take the draft banner off.", done_when: "legal-staging-test passes with no REPLACE THIS and no draft flag"}
  - {id: D2, status: open, blocked_on: "amber (her listing terms)", ref: [L12], item: "Listing terms in Amber's words published from the admin Terms screen.", done_when: "/terms shows a published version with no placeholder"}
  - {id: D3, status: closed, closed: 2026-10-17, evidence: "App commit c00d69f, site repo 4948030. The 26 draft files (27 searches) were already in app/content/guides from commit ffeb8ff on 2026-10-11, byte for byte the same as hs-seo-data apart from status; 24 build as published and the Cocker Spaniel size and Miniature Schnauzer weight guides stay draft, as Alex unpublished them for low volume in 47e387b. Breed pages render no breeds.guide text now (no More about the breed block, no draft intro), and on staging breed-havanese.html carries the highlights and no old draft. publish-test 129 of 129", ref: [g1-guide-fold, pc-guides], item: "Breed guides confirmed by Alex (2026-10-17): copy the 27 drafts in hs-seo-data/puppyconnection/2026-10-11/guides to app/content/guides, set status published, and fold the rest into the breed pages.", done_when: "the guides build and the old guide drafts are off the breed pages"}
  - {id: D4, status: open, blocked_on: "amber (About words, reviews confirmation, contact email and phone)", item: "Site pages: fill the REPLACE THIS markers in app/build/info-pages.mjs (About, Reviews, Contact).", done_when: "grep finds no REPLACE THIS in info-pages.mjs"}
  - {id: D5, status: open, blocked_on: "amber", item: "Seller statement wording for A6.", done_when: "wording received and in A6"}
  - {id: D6, status: open, blocked_on: "amber", item: "Furry Freight booking details confirmed for A7 (the link and logo from the Bless Your Paws build are the default).", done_when: "Amber confirms or sends her own"}
  # S5 Domain cutover and search
  - {id: E1, status: open, blocked_on: "amber (Alex coordinates the timing of the nameserver change with her, 2026-10-17)", ref: [L3], item: "Zone prepared 2026-10-17 in the Puppy Connection Cloudflare account with all 18 Wix records copied as DNS only (Wix site, Google Workspace email, Wix email signing). Wix allows custom nameservers on this domain, so no transfer is needed. Left: once Amber agrees the timing, in Wix choose Use custom nameservers with clint.ns.cloudflare.com and teresa.ns.cloudflare.com, then confirm the zone goes active and the Wix site, www and Google email still work. DNSSEC is already off.", done_when: "the zone is active and the Wix site, www and email answer as before"}
  - {id: E2, status: open, blocked_on: "E1, B1", item: "Custom domains on the site, portal and admin Workers, and the portal origin and SITE_URL updated in the build.", done_when: "all three answer on puppy-connection.com"}
  - {id: E3, status: open, blocked_on: "E2", ref: [L8], item: "Build with SITE_INDEXABLE=1 and SITE_URL, robots open, sitemap on the real domain.", done_when: "noindex is gone from the site and only the site"}
  - {id: E4, status: open, blocked_on: "amber (Search Console and Business Profile access)", ref: [P10, g4-search-consoles], item: "Search Console and Bing verified with the sitemap submitted, and the Business Profile pointed at the new site.", done_when: "the sitemap is accepted in both"}
  - {id: E5, status: open, blocked_on: "E3", ref: [L9, g4-legacy-check], item: "After cutover, fetch a sample of old Wix addresses and confirm each lands on the right page.", done_when: "every sampled address answers 301 to a 200"}
  # S6 Launch checks and training
  - {id: F1, status: open, blocked_on: claude, ref: [L15], item: "Restore a nightly backup into a new D1 database on staging and check every table.", done_when: "restore-test passes against the staging copy"}
  - {id: F2, status: open, blocked_on: "alex and amber", ref: [L13], item: "Clear the test breeders and data (e2e-, demo breeders, the test mailbox) from the production database.", done_when: "no test rows remain"}
  - {id: F3, status: open, blocked_on: "alex and amber", ref: [L14], item: "One real $14.99 listing payment and its refund, checked end to end in live mode.", done_when: "both show in Stripe and the admin"}
  - {id: F4, status: open, blocked_on: claude, item: "Record the admin walkthrough and the breeder walkthrough, and write the one-page quick guide, once the site is final.", done_when: "the three are delivered to Amber"}
  - {id: F5, status: open, blocked_on: "alex and amber", item: "Live training with Amber and Luke.", done_when: "held"}
  - {id: F6, status: open, blocked_on: "alex and amber", item: "Check-in about 30 days after launch, which also opens the Gate 1 review.", done_when: "held, with the Gate 1 measures read"}
---

# How to use this file

Each session above has its own kickoff prompt below. Start a session from the repo root,
paste its prompt, and the session works only its own items, updating each item's status in
the header as it lands.

The order that keeps sessions out of each other's way:

1. Send Amber the launch plan and its question email, and start the staged asks for access
   and content (see "What Alex does first").
2. Run S1 for the items that wait on nothing (A3, A5, A7), then the rest as Amber's answers
   arrive. S2, S3 and S4 run beside it as their blockers clear.
3. Run S5 once S1 to S4 are done, then S6.

# What Alex does first

These unblock the most items, in the order they matter:

- Send Amber the launch plan and the question email.
- Ask Amber for her Stripe account (B2), because its verification takes the longest.
- Ask Amber which Google account should own sign-in (B4) and for registrar access to
  puppy-connection.com (E1, B3).
- Ask Amber for the Wix subscriber export, or the Export Contacts permission (C3).
- Ask Amber for the remaining breeder pairing answers (C1).
- Ask Amber for the privacy decisions, contact email, listing terms and site-page wording
  (D1, D2, D4, D5).
- Choose the email provider (B3) and confirm the guide list (D3).
- Grant Luke's Access and owner row when B5 runs.

# Session kickoff prompts

**S1, launch additions build.** "Read app/docs/launch-workplan.md, then _claude-state.md.
Work the S1 items in the order A3, A5, A7, A8, A1, A2, A9, A4, A6, building each to the
default in hs-proposals/puppyconnection/scope.py unless the item's blocker has been
answered. Before each migration, check the highest number in app/migrations. Run
app/dev/publish-test.mjs and python ../site-checks/check_site.py before each commit, update
the item's status with the commit, and deploy to staging only when Alex says."

**S2, accounts and services go live.** "Read app/docs/launch-workplan.md and
app/docs/launch-checklist.md. Work the S2 items with me in Chrome. Card entry, terms
acceptance and secret values are mine, so stop and hand those to me. Update each item's
status in the workplan header as it lands."

**S3, Wix data, photos and mailing list.** "Read app/docs/launch-workplan.md and the
pairing notes in app/docs/batch-2026-10-11-breeders.md. Work the S3 items against staging,
backing up D1 first. Check app/migrations for the highest number before writing one,
because S1 may be adding migrations at the same time."

**S4, content and legal text.** "Read app/docs/launch-workplan.md. Work the S4 items from
the content Amber has sent, which I will paste or attach. Change only portal/legal.js,
app/build/info-pages.mjs, app/content/guides and the Terms screen, and run
app/dev/legal-staging-test.mjs after the privacy changes."

**S5, domain cutover and search.** "Read app/docs/launch-workplan.md, the site-launch
skill and the cloudflare-account-move-traps memory. Confirm every S1 to S4 item is closed
before starting, then work S5 with me."

**S6, launch checks and training.** "Read app/docs/launch-workplan.md and work the S6
items."
