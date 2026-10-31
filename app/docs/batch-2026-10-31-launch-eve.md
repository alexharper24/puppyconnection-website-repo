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
excluded: []
---

# Notes

Progress is recorded in the header as each task lands.
