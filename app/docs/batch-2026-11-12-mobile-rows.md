---
batch: mobile-rows
date: 2026-11-12
asked_by: Alex
follows: app/docs/batch-2026-11-11-mobile-review.md
scope: "Breeder portal (app/portal) and admin (app/admin) on phones: full-width filters and one row pattern for every list and card. Public site out of scope"
widths: [360, 390, 430, 1440]
branch: claude/hopeful-hamilton-280ea1
local: "portal 8787, admin 8788, from this worktree (.claude/launch.json rows-portal, rows-admin, not committed), setup.mjs --reset --demo"
tools: "app/dev/mobile-review (run.mjs, measure.js, show.mjs, report.py), with a rows probe added for this batch"
pattern:
  filters: "Search, selects and segment tabs each run full width, stacked, on phones"
  row: "Photo on the left at the full height of the text beside it (4:5 for puppies and litters, square for the rest), placed on the photo's focus point. Row 1 name with price and status chip at the right, row 2 breed or second line, row 3 the actions side by side on one line at one height"
  keep: "4px square buttons, 44px tap targets, the November 11 menu"
  phone_from: "700px and below, where the tables already hide their side columns (hide-sm)"
stage: done
tasks:
  - {id: read, status: done, item: "Read the November 11 batch file and the phone rules in portal.css and navmenu.js"}
  - {id: before, status: done, evidence: "57 items, 228 screen and width runs, no errors; results kept in the session scratchpad for the report", item: "Measure every inventory item at 360, 390, 430 and 1440 before the change"}
  - {id: preview, status: done, evidence: "a-listings and p-litters at 360, 390 and 430: every photo 96px against 96px of text, no button row wrapped, no label cut, filters full width; 1440 findings unchanged (41 and 28). Preview page app/docs/preview-2026-11-12-mobile-rows.html sent 2026-11-12, deleted once Alex chooses", item: "Build the pattern on admin Listings and portal Litters and puppies, measure, show Alex"}
  - {id: alex-ok, status: done, closed: 2026-11-12, evidence: "Alex: Yes, apply it", item: "Alex approves the two preview screens"}
  - {id: apply, status: done, evidence: "Admin: listings, breeders, approvals, search, breeder drawer puppies and moms and dads, payments, breeds, email log, mailing list, sign-ins, publish jobs, campaigns, activity. Portal: litters and puppies, moms and dads, payments, account people. Screens that do not fit are listed under screens", item: "Apply the pattern to every list and card in both apps"}
  - {id: after, status: done, evidence: "228 runs, 0 errors. rows.js: 0 row problems at 360, 390 and 430 (photo matches text, buttons on one line at one height, no label cut, filters full width). Phone findings 61 before to 91 after, the added ones all lines cut with an ellipsis on purpose. 1440: new findings only where the local test data added rows (parents, subscribers, email log, activity) and a class name added to the desktop Mark placed button", item: "Re-measure every item at all four widths"}
  - {id: report, status: done, evidence: "Sent to Alex 2026-11-12, built by app/dev/mobile-review/rows-report.py, kept out of the repo for its size (1.7 MB)", item: "HTML before-and-after report sent with SendUserFile"}
  - {id: ship, status: done, evidence: "PR 180 merged (8502c71); portal and admin deployed from main with wrangler.production.jsonc on 2026-11-12; live portal serves portal.css?v=48 (with the row rules), facepick.js?v=3 and portal.js?v=58 (200); admin deploy confirmed by wrangler only, as Access blocks an unsigned check", note: "?v= portal.css 48, facepick.js 3, portal.js 58, admin.js 67. admin-features-test 170 passed; portal-features-test needs the site Worker on 8791 and was not completed, and it failed one breed colors check that this change does not touch", item: "Merge from main, bump ?v=, deploy portal and admin with wrangler.production.jsonc"}
  - {id: stop, status: done, evidence: "rows-portal and rows-admin stopped, ports 8787 and 8788 free, temporary main worktree removed", item: "Stop the local Workers"}
screens:
  admin-listings: {fits: true, note: "Long breed plus two extras ends in an ellipsis at 360 and 390, full text in the title"}
  admin-breeders-approvals-search: {fits: true, note: "Logo square (contained, not cut), name across row 1, state chip and live count on row 2, no buttons (the row opens the drawer). The state moved to row 2 because long kennel names were cut by it"}
  admin-breeder-drawer-puppies: {fits: partly, note: "Edit, Photos and Hold beside the photo; List free and Offline until new photos in a ruled row under it, as five buttons do not fit at 360"}
  admin-breeder-drawer-parents: {fits: true, note: "Square photo on its face point, Mom or Dad chip, registry and tests, Replace photo and Face; documents and the error line under the row"}
  admin-breeder-drawer-who-signs-in: {fits: false, note: "Up to four buttons (Send invitation again, Make main contact, Reset authenticator, Remove) cannot share one line; kept as the November 11 filled button rows"}
  admin-payments: {fits: true, note: "Breeder, amount and state; date and puppies; Refund and dispute buttons in the practice checkout only"}
  admin-breeds: {fits: true, note: "Name with live count and guide chip; slug and counts. The longest breed name is cut by 15px at 360"}
  admin-email-log: {fits: true}
  admin-mailing-list: {fits: true, note: "While people are being ticked for an email the table stays, as the tick boxes need it"}
  admin-sign-ins: {fits: true, note: "Role select and Remove on one line"}
  admin-publish-jobs: {fits: true}
  admin-campaigns: {fits: true}
  admin-activity: {fits: true, note: "The actor's address is cut with an ellipsis at 360 and 390"}
  admin-reports-tables: {fits: false, note: "Tables of figures by month or breed; they read as a name with numbers at the right already and stay tables"}
  admin-traffic-top-pages: {fits: false, note: "Same, a page name with views and clicks"}
  admin-photo-review: {fits: false, note: "The photo itself is what is reviewed, so it stays a full-width card with Keep and Send back on one line"}
  admin-reported: {fits: false, note: "A report is a message with a note field, not a list row"}
  admin-checklist: {fits: false, note: "Checklist items are tasks with long text, left as they are"}
  portal-litters: {fits: partly, note: "States on row 2 (too long for row 1); Edit and Mark placed beside the photo; Duplicate and View on site in the ruled row under the card. A litter's Add a puppy, Edit litter and Add several on one line"}
  portal-moms-and-dads: {fits: true, note: "Square photo on its face point, Mom or Dad chip, breed and registry, Edit; tests, documents and litters on a line under"}
  portal-payments: {fits: true}
  portal-account-people: {fits: true, note: "Make main and Remove on one line"}
  portal-views-and-clicks: {fits: false, note: "A table of figures with a total row, kept as a table"}
  portal-pay: {fits: false, note: "Tick boxes to choose puppies to pay for, kept as they are"}
shortened_labels:
  - {screen: "admin Listings", from: "Offline until new photos", to: "New photos", aria_label: "Offline until new photos", status: "approved with the preview 2026-11-12"}
  - {screen: "portal Account, who signs in", from: "Make main contact", to: "Make main", aria_label: "Make main contact", status: "approved by Alex 2026-11-12"}
sibling: "Teapup and Sweet Puppy Paws rows (teapup-website-repo, claude/quizzical-hermann-32864a) use a 104px photo that stretches to the row, a 900px breakpoint and a More button; the Puppy Connection sizes were sent to that session on 2026-11-12"
local_test_data: "Two parents for demo-maplebrook, three subscribers and three email log rows added to the local database only, so those rows could be measured"
---

# Phone rows for the portal and admin, 2026-11-12

Alex sent a phone screenshot of the admin Listings screen and asked for it to be more organized
and visibly clean, with the same approach across both editors. The pattern is in the header. This
file records each screen, whether the pattern fits it, and the measurements before and after.
