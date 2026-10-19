---
batch: breeder-descriptions-round-2
started: 2026-10-18
asked_by: Alex
ask: "Write a breeder description for each of the 31 breeders migration 0023 added, only from the kennel's own website or its Responsible Dog Breeder Network member page, with the source page for each fact." Added mid-task (Alex, 2026-10-18): "use information and logos from their websites if they have one."
scope:
  breeders: "the 31 seed- breeders with decided_by 'migration 0023'"
  data_home: "D1 owns breeder_profiles.description and logo_key, and R2 holds the logo files under brand/<breeder id>/, so changes land as a migration and R2 uploads on staging after a backup"
  sources: "hs-seo-data/puppyconnection/2026-10-18-descriptions (drafts.json, pages/, logos/, review.html)"
tasks:
  - {id: d1, status: done, item: "Read each kennel's own home and About pages, its network member page, or Amber's Wix page for County Line Kennel"}
  - {id: d2, status: done, item: "Draft 31 descriptions with a source page per fact, no street address, no invented facts"}
  - {id: d3, status: done, item: "Logos from the 20 kennels with their own website, trimmed and saved as webp with a card copy"}
  - {id: d4, status: done, closed: 2026-10-19, evidence: "Alex: Approved, apply the descriptions and logos to staging.", item: "Alex approves the drafts and logos on review.html"}
  - {id: d5, status: done, evidence: "app/.state/staging-2026-10-19-pre0026.sql, 2,018,901 bytes, Downloaded printed, 46 breeder_profiles rows", item: "D1 export backup to app/.state/, confirmed downloaded"}
  - {id: d6, status: done, evidence: "brand/<id>/logo-2026101926.webp and .card for 20 kennels (Ibar has no card copy), 39 objects each read back at the source byte size", item: "Upload the 20 logos to R2 puppyconnection-files under brand/<breeder id>/"}
  - {id: d7, status: done, evidence: "migrations/0026 rehearsed on a copy of the backup (31 descriptions, 20 logos, a repeat run left every version unchanged), applied to staging 2026-10-19, staging shows 31 of 31 descriptions, 20 logos, site dirty at generation 40", item: "Migration 0026 (0024 and 0025 were taken by other sessions) with descriptions and logo_key, rehearsed with --sqlite, applied with ops/d1-apply.mjs --remote, site marked changed"}
  - {id: d8, status: done, closed: 2026-10-19, evidence: "hs-seo-data verify_pages.py after the publish: 31 of 31 breeder pages answer 200 with the approved description, 20 show their logo served as image/webp, 11 show none; King's Family Companions looked at in the browser at 1280px", item: "Every new breeder page on site.puppyconnection.workers.dev shows its approved description, and its logo where it has one"}
excluded:
  - "The 11 breeders without a website of their own get no logo, because their network page shows only the network's mark"
---

# Notes

Where a kennel's own site and its network page disagree (Willow Lane Bulldogs' breeds, the length of
the genetic guarantee), the description follows the kennel's own site or leaves the fact out. Family
Affair Puppies prints its street address and Double YY Puppies describes its house from the road, and
both are left out.

## Second round (2026-10-19, migration 0027)

Alex: "you're missing the logo for Bless Your Paws ... allow the right column to come up and top
align with the breeder name ... there are eight puppies, so please review that site and add the
missing items." Bless Your Paws, Cornerstone Cavaliers, Heartland Mini Schnauzers and Winding
Streams Companions get the logo from their own site header. blessyourpawspuppies.com lists eight
puppies in the July 22, 2026 litter, and staging showed six. Jericho had been archived by 0023 when
it left the Wix store, and returns as adopted. Shiloh was never imported, and is added from its page
there with eleven photos measured by the dog detector, without a price because the page shows none
for an adopted puppy. Tirzah moves from the litter it was given when it changed breeders into the
litter it shares with its littermates. On a breeder page with a logo, the name, buttons and story sit in a wider left column
beside the logo and contact column, both starting at the top, and a breeder without a logo keeps
the full-width heading. Backup app/.state/staging-2026-10-19-pre0027.sql, site repository 953333f.
