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
  - {id: t4-audit, status: open, item: "Full site audit of site.puppyconnection.workers.dev with the site-audit skill, verified findings, report for Alex"}
excluded: []
---

# Notes

Progress is recorded in the header as each task lands.
