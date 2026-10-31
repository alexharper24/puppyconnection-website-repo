---
batch: launch-eve
started: 2026-10-31
asked_by: Alex
ask: "review what puppies have sold and been added on the live site since the last update, as we go live with the new site tomorrow, then perform a site audit after all the changes we've made"
rules:
  - "Back up D1 and confirm Downloaded before any production write, rehearse twice on a copy with foreign keys on"
  - "The Wix site is read only. Nothing is changed there"
  - "No prices or hours in this repository"
tasks:
  - {id: t1-wix-inventory, status: done, evidence: "275 Wix products read 2026-10-31 (sold ones carry *ADOPTED* in the name; the stock flag is always InStock)", item: "List every puppy on the Wix store with its in-stock state, from the store sitemap and each product page"}
  - {id: t2-compare, status: done, evidence: "27 adopted on Wix but available here, 13 new on Wix since 2026-10-22, none the other way", item: "Compare with production: added on Wix since the import, sold on Wix but still available here, gone from Wix but still available here"}
  - {id: t3-apply, status: done, evidence: "0077 (27 adopted to placed) and 0078 (13 new puppies, 97 photos in R2, 4 litters) applied after backups and FK-on rehearsals; the four Mini Dachshunds sit under Unassigned until Amber names the breeder", item: "Bring production in line, sold first, then new listings with their photos, by migration after a backup"}
  - {id: t4-audit, status: done, evidence: "audit.py on a build from live data (396 pages): 0 broken links, 0 missing images, 0 placeholders, 0 em dashes in copy, skip link and main on every page. Verified and fixed: tagline contrast 4.18 to 5.5, 34 puppy pages skipping h1 to h3, FAQPage on List with us, 43 descriptions over 155. Dropped after checking: 2,306 alt-empty gallery thumbnails inside labelled buttons, seamless inside a quoted review, about:Thing on guides. Lighthouse found full-size card photos on the 13 new puppies; 97 card copies uploaded. 332 Wix addresses requested from the new site: all 200, 268 of 275 puppies to their own page; /breeder-tmcountrysidek9 now to TM Countryside K9 per Amber 2026-10-25", item: "Full site audit of site.puppyconnection.workers.dev with the site-audit skill, verified findings, report for Alex"}
  - {id: t4b-lighthouse, status: done, evidence: "Lighthouse after the fixes, phone: accessibility 100 on home, puppies, breed and puppy pages; breed page performance 68 to 90 and LCP 7.8 to 3.0 s; puppies CLS 0.196 to 0.031; home weight 2,973 to 1,541 KB. Report in hs-seo-data/puppyconnection/2026-10-31-launch-audit/report.html", item: "Re-test speed and accessibility on the live site after the fixes"}
  - {id: t5-amber, status: open, blocked_on: amber, item: "Name the breeder of Joy, Jasper, Johnny and Jaxon (Mini Dachshunds under Unassigned), and the seven old breeder pages: Marvin Ramer, Mervin Yutzy, Philip, Marcus and Elaine, Edward and Malinda, Tyler and Eileen, Perry"}
  - {id: t6-multi-kennel-invite, status: done, closed: 2026-10-31, deployed: "PR 72 (88e14eb), portal version 37230ec9, admin version 85cf2f92; portal serves portal.css?v=24 with the picker styles", asked: "Alex 2026-10-31: set one admin for several breeders and send one invitation, and when a later breeder is added for the same admin, give access and send a notice", evidence: "Branch feature/multi-kennel-one-invite. Admin Add a person takes more kennels in one step and sends one email; an operator add opens at once; a person with a password gets the kennel_access notice with no link; a person with no password is never held back. multikennel-test 82 of 82 (12 new), accounts-test 80, signin-test 26, access-tests 10 of 10, email-html 276, admin-features 122. portal-features 112 of 122 with the known breed colors check and the site-Worker checks (8791 not running). Picker checked in the local admin: 46 kennels listed, filter works, submit sent one 3-kennel invitation", item: "One invitation for several kennels, and an instant notice for a person who already has a password; portal and admin need a production deploy"}
  - {id: t7-rdbn-invite, status: open, blocked_on: alex, item: "After the deploy, add administrator@responsibledogbreeder.com once from any member kennel's Who signs in, ticking the other member kennels and Ibar Canine Companions, so the network gets one invitation"}
excluded: []
---

# Notes

Progress is recorded in the header as each task lands.
