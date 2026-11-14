---
batch: 2026-11-14-wix-parent-weights
asked_by: "Alex 2026-11-14: Yes, fix weights (the mom and dad weights in the Wix descriptions that did not reach the litters)"
billing: absorbed with the 2026-11-13 parent photo work, not billed
database: "D1 puppyconnection, app/admin/wrangler.production.jsonc, Puppy Connection Cloudflare account"
evidence_folder: "C:/Git_Repos/hs-seo-data/puppyconnection/2026-11-14-wix-parent-weights"
read_first: [app/docs/batch-2026-11-13-wix-parent-photos.md, app/ops/wix-import.mjs]
found:
  gap: "Only 62 of 165 imported litters carry a mom or dad weight. Sabrina Jane's Wix description gives mom 65 and dad 70 pounds and her litter has neither"
  cause: "wix-import.mjs reads mom_weight and dad_weight from the litter rows of the August harvest, not from each puppy's description, so litters added by later true-ups came in without weights"
  colors: "The import put parent colors into litters.description. Colors have no column of their own and are left out of this batch"
rules:
  - "Fill a litter's mom_weight_lb or dad_weight_lb only where it is empty. Never overwrite a weight already set; record any that differ from Wix"
  - "Take the weight only where every puppy of the litter that gives one agrees. A litter whose puppies give different weights is left out and recorded"
  - "A weight must be a number of pounds read from the Mom's or Dad's information line"
tasks:
  - {id: v1-fetch, status: done, closed: 2026-11-14, evidence: "fetch_descriptions.py, then retry_failed.py for 18 timeouts: 316 pages, 274 answered and 42 are gone from Wix (404)", item: "Fetch each imported puppy's Wix product description and parse the Mom's and Dad's weights"}
  - {id: v2-plan, status: done, closed: 2026-11-14, evidence: "ops/wix_parent_weights.py, weights-plan.json: 139 weights on 73 litters (69 mom, 70 dad), 65 of those litters with a public puppy. 0 differ from a weight already set. 1 skipped (Chain O' Lakes July 25, 2026 litter, mom given as 12 by six puppies and 9 by four). 9 litters give a color or a number with no unit and stay empty. The two Great Dane litters at TM Countryside K9 read 160 and 150 pounds, which the Wix text says", item: "Per litter, the weight to fill, skipped litters and differences, by script"}
  - {id: v3-migration, status: done, closed: 2026-11-14, evidence: "migrations/0099_wix_parent_weights.sql. Backup production-2026-11-14-pre0099.sql Downloaded (main checkout app/.state). Rehearsal PASS: run 1 audit_log +139, litters and site_state changed; run 2 no change; 0 key violations. d1-apply 5 of 5. Read back: 139 audit rows, imported litters with a mom weight 62 to 131 and with a dad weight 62 to 132", item: "Migration 0099, guarded, audit rows, marker first. Backup, two rehearsals, apply with d1-apply.mjs, read back"}
  - {id: v4-publish, status: done, closed: 2026-11-14, evidence: "Publish ran 2026-11-14T14:13:40Z, generation 1484. Live Sabrina Jane page shows Mother 65 lbs adult weight and Hershey's card Adult weight 70 lbs", item: "Publish and check live puppy pages show Mother and Father weights"}
---

# Wix parent weights, 2026-11-14

Decisions are recorded here as they are made.
