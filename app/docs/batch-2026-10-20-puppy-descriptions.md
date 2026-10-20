---
batch: puppy-description-cleanup
started: 2026-10-19
asked_by: Alex
ask: "for all the puppy descriptions... those need to be reviewed and cleaned up moving information into the boxes where appropriate."
scope:
  puppies: "267 published and draft puppies with a description, all breeders except the Maple Brook Doodles demo, which the demo reset owns"
  data_home: "D1 owns puppies and litters, so the change is migration 0042, applied to staging after a backup"
  sources: "hs-seo-data/puppyconnection/2026-10-20-puppy-descriptions (RULES.md, final.json, review.html, verify_pages.py)"
tasks:
  - {id: p1, status: done, item: "Draft each puppy's cleanup under one rule set, five batches in parallel, every value traceable to the breeder's words"}
  - {id: p2, status: done, item: "Check the drafts against the originals and send the review page", evidence: "check.py: no new wording, no overwritten field, every removed Wix header figure matches the stored price, deposit and dates, parent weights agree in all 27 litters"}
  - {id: p3, status: done, closed: 2026-10-20, item: "Alex approves", evidence: "Alex: Approved, apply the puppy description cleanup to staging."}
  - {id: p4, status: done, item: "Migration 0042 rehearsed and applied", evidence: "backup app/.state/staging-2026-10-20-pre0042.sql; rehearsal and staging both 264 puppies and 27 litters changed, a repeat run changes nothing; all 267 descriptions on staging match final.json"}
  - {id: p5, status: done, item: "Pages checked after the publish", evidence: "verify_pages.py: 267 of 267 pages show the description with no phone or link in About, and every moved fact and goes-home item in its box"}
open_from_review:
  - {id: q1, blocked_on: alex, item: "Eight Cuddly Family Companions puppies are recorded under the wrong breed: Parker, Patches, Patience and Pearl read as Great Danes but are listed as Miniature Schnauzers, and Queenie, Quigley, Quincy and Quinton read as Shih Tzus but are listed as Cavaliers"}
  - {id: q2, blocked_on: alex, item: "Five descriptions name another puppy: Isaac (Ian), Pleasant (Autumn), Vanilla (Bubbles), Mia (Bella), Murphy (Smurf)"}
  - {id: q3, blocked_on: alex, item: "Toast and Harriet are adult dogs listed as puppies"}
---

# Notes

The first staging apply stopped partway with no error printed, leaving 250 of 264 puppies, no litter
weights and no publish flag. A second run of the same migration, which is safe to repeat, finished all
18 batches and staging then matched the rehearsal exactly. Run the apply with its output written to a
log, and check the counts against the rehearsal afterwards.
