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
  - {id: t2-seller, status: in_progress, item: "Seller statement on every generated puppy page and a one-time breeder confirmation folded into the terms acceptance, with the date stored"}
  - {id: t3a-invite, status: pending, blocked_on: alex, item: "One real invitation from the admin to an address Alex chooses"}
  - {id: t3b-signin, status: pending, blocked_on: alex, item: "One password plus authenticator sign-in and one password reset on staging, with Alex on his phone"}
  - {id: t3c-report, status: pending, blocked_on: alex, item: "One listing report reaching info@"}
  - {id: t4-ga-events, status: pending, item: "GA4 events for clicks to a breeder's website, phone and email from puppy and breeder pages, sent only on puppy-connection.com"}
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
