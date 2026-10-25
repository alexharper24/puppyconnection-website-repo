---
batch: prelaunch-build
started: 2026-10-25
asked_by: Alex
ask: "Pre-launch build work in a fresh session: the checklist in step, the seller statement, real-world tests on staging and the Google Analytics click events"
branch: feature/prelaunch-build-2026-10-26
rules:
  - "Back up staging D1 and confirm Downloaded before every hosted migration"
  - "Merge and deploy the portal and admin to staging only from main, after Alex approves the merge in chat"
  - "Every test that sends mail is confirmed with Alex first"
  - "No prices or hours in this repo"
tasks:
  - {id: t1-checklist, status: built, evidence: "migrations/0062_checklist_prelaunch_build.sql closes Listing terms, Let's Chat, About Reviews and Contact, and the read limit, ticks the build parts of managing accounts, invitations and password sign-in, moves Analytics off waiting and notes video held. checklist-test 86 passed with the same 4 known failures. Workplan D2, A15, D4 and B13 closed; staging drift shows exactly those four until 0062 runs", item: "Bring the admin launch checklist in step with 2026-10-24 and 25 by a checklist migration wired into checklist-test, keeping its four known failures and adding none"}
  - {id: t2-seller, status: built, migration: 0063, evidence: "breeders.seller_confirmed_at; the box sits beside the terms box at submit and in the terms drawer, and termsNeedAccept asks any breeder with no date through the same banner (it reads Please confirm you are the seller when the terms are already accepted). The admin breeder drawer shows Confirmed seller. generate.mjs puts the approved statement in the Raised by box; all 295 locally generated puppy pages carry it and check_site.py reports 0 errors. admin-features 122 of 122 with seven new A6 checks; access 69, e2e 42, accounts 79 (one rate-limit failure when run straight after other suites, 79 of 79 alone), signin 26, parents-docs 57, demo 67, restore 55, email-html 255, retention 28, alerts 49 all pass; launch-features 155 of 157 and portal-features 30 of 33, the misses being the site address on the remapped local port 8819 and the known fresh-reset breed colors. publish-test and legal-staging-test not run because they need ports 8788 and 8793. Measured with no sideways scroll at 1440 and 375 on a puppy page, the submit form and the terms drawer", item: "Seller statement on every generated puppy page and a one-time breeder confirmation folded into the terms acceptance, with the date stored"}
  - {id: t3a-invite, status: pending, blocked_on: alex, item: "One real invitation from the admin to an address Alex chooses"}
  - {id: t3b-signin, status: pending, blocked_on: alex, item: "One password plus authenticator sign-in and one password reset on staging, with Alex on his phone"}
  - {id: t3c-report, status: pending, blocked_on: alex, item: "One listing report reaching info@"}
  - {id: t4-ga-events, status: in_progress, item: "GA4 events for clicks to a breeder's website, phone and email from puppy and breeder pages, sent only on puppy-connection.com"}
  - {id: t5-remaining, status: pending, item: "List what remains before launch"}
baseline:
  checklist_test: "86 passed, 4 failed before any change (A19, A20, A21, B13 and C2 drift against the seed, and the two area drift checks that follow from it)"
excluded:
  - "Proving a nightly backup restores (F1), left out by Alex"
  - "Amber's open items: Stripe verification, PO box, privacy read-through, breeder details, emails for the RDB breeders, photos"
  - "The test data walkthrough, cutover, and puppy video, which stays held"
---

# Notes

Progress is recorded in the header as each task lands.
