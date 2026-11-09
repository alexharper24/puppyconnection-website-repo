---
batch: 2026-11-09-breeder-wording-and-add
asked_by: "Alex 2026-11-09: Part 1 change kennel to breeder on the admin and portal; Part 2 let an operator in the breeder portal add a kennel that Puppy Connection approves before it shows on the site"
branch: claude/laughing-bassi-6e28ee
base: c001199
read_first: [_claude-state.md, app/docs/batch-2026-11-05-admin-add-breeder.md, app/portal/worker.js, app/admin/worker.js, app/lib/store.js, app/lib/mail.js]
scope_changes:
  - date: 2026-11-09
    source: "Relayed by Alex's session 'Website - KFC & Pup Connect' (local_b049801b): 'Let's just keep it kennel for now', covering everything including the new button"
    effect: "Part 1 dropped. Part 2 keeps the word kennel, so the portal button reads Add a kennel"
findings:
  - "Approval notices go to NOTICE_TO through noticeTo() in lib/mail.js. Production sets NOTICE_TO to info@puppy-connection.com in both wrangler.production.jsonc files (Amber 2026-10-25). The sign-up notice is mail template profile_submitted, sent by submitProfile in portal/worker.js with a link to ADMIN_ORIGIN/#/approvals/<id>"
  - "Approve and decline are decide() in admin/worker.js. Approve needs profile_submitted_at, sets a slug and marks the site dirty, and mails the kennel's main contact (template approved). Decline needs a private reason and mails the main contact (template declined, which reads as a reply to an application)"
  - "Public views: export.js reads public_breeders, which shows status approved (and a suspended grace case) only"
  - "Pay to list: portal/worker.js sets pay_block to 'Account not approved.' for any kennel that is not approved"
  - "Every litter, puppy and parent write in portal/worker.js calls requireApproved (lib/store.js), so today a pending kennel cannot prepare litters or puppies at all. The brief's 'prepare litters and puppies while it waits' needs that rule relaxed, which is a question for Alex"
  - "listWithoutPayment (lib/listing.js, the parallel session's work) does not check the kennel's status. The public view still hides a pending kennel's puppies, but a listing-without-payment on a pending kennel would start its listing clock early. To check when building"
decisions:
  - {date: 2026-11-09, by: alex, decision: "Every main contact gets Add a kennel. Read as: the person signed in is main contact of at least one approved kennel, and it is their own session, not a Puppy Connection Manage as session"}
  - {date: 2026-11-09, by: alex, decision: "A kennel added from the portal can hold litters, puppies and parents as drafts while pending. Paying, listing and the site stay blocked until approval"}
  - {date: 2026-11-09, by: alex, decision: "The notice goes to NOTICE_TO (info@puppy-connection.com), the same as a sign-up waiting for approval"}
tasks:
  # Part 1
  - {id: w1-inventory, status: dropped, reason: "Alex 2026-11-09, relayed: keep kennel everywhere. 320 lines in app/ source (outside dev, docs, migrations) match the word, list kept in the session scratchpad only"}
  - {id: w2-word-list, status: dropped, reason: "As w1"}
  - {id: w3-apply, status: dropped, reason: "As w1"}
  - {id: w4-public-site, status: dropped, reason: "As w1. list-with-us.html says 'your kennel name' and stays"}
  # Part 2
  - {id: b1-route, status: done, evidence: "POST /api/kennels (portal/worker.js addKennel): main contact of an approved kennel only, own session only, at most 10 waiting; profileFields, profileMissing, extrasFields; pending and submitted with terms and seller recorded; session moves to it. add-kennel-test 43 of 43 locally"}
  - {id: b1b-drafts, status: done, evidence: "requireDrafting in lib/store.js on every litter, puppy, parent, photo, video and document route; startCheckout keeps requireApproved; drafts_ok from loadBreeder (pending, and the same address runs an approved kennel). add-kennel-test drafts a litter, puppy and mom, checkout 403"}
  - {id: b1c-comp-guard, status: done, evidence: "lib/listing.js listWithoutPayment refuses a puppy whose kennel is not approved, so the listing clock cannot start early. add-kennel-test: admin comp before approval 400, after approval 200"}
  - {id: b2-ui, status: done, evidence: "portal.js v55: Add a kennel button (one kennel) or last row of Switch kennel (several), #/add-kennel form with profile, about, logo, kennel photo, breeds, Facebook, terms and seller; pending drafts nav and overview notice. portal.css v44 (both copies), admin.js v63"}
  - {id: b3-notice, status: done, evidence: "profile_submitted template takes addedBy and runs; sent to noticeTo (NOTICE_TO, else people); admin drawer shows Added in the breeder portal in place of the reference card (breederDetail.added from the breeder.add audit row)"}
  - {id: b4-decide, status: done, evidence: "decide() passes added (drafts_ok) so approved and declined mails read for an added kennel; approve sets the slug and marks the site dirty as before; drafts stay unpaid drafts until paid or listed without payment"}
  - {id: b5-audit, status: done, evidence: "breeder.add, profile.submit and session.kennel_switch under the person; approve and decline under the operator, as before"}
  - {id: b6-tests, status: done, evidence: "On a fresh local reset: add-kennel-test 43/43 (twice), access-tests 90/90 with section 12, add-breeder 42/42, multikennel 85/85, admin-features 163/163, email-html 298/298, walkthrough 17/17, signin 26/26, accounts 80/80. Browser pane: terms error, add, waiting overview, drafts menu, Switch kennel lists both and Add a kennel"}
  - {id: b7-ship, status: done, closed: 2026-11-09, evidence: "PR 167 squashed to 2919ca3 and deployed from a detached origin/main after the history showed the PR 165 versions (portal 8e6852aa, admin a52f3d1c) as the latest. The first portal deploy (82b0ac30) showed 100% in the deployment list but both hostnames still served v=54 for seven minutes. A second identical deploy (portal de084d80, admin bbe03aea) went live within a minute. portal.puppy-connection.com serves portal.js?v=55 and POST /api/kennels answers 401 without a session. The admin redirects to Access, so its read-back is the version id. No kennel was created in production and no email was sent"}
---

# Breeder wording and Add a kennel, 2026-11-09

Part 1 is dropped on Alex's word, relayed from his other session, so no wording changes anywhere.

No schema change and so no migration, because the kennel, its main contact and its pending status
fit the existing tables. Who added a kennel comes from the breeder.add audit row, and whether a
pending kennel may draft comes from whether its main contact already runs an approved kennel.

Edge noted for Alex: a pending kennel whose main contact also runs an approved kennel can draft
whichever way it was created. Today that only happens through Add a kennel, because a sign-up with an
address already on Puppy Connection signs in to the existing kennels instead of making a new one.
