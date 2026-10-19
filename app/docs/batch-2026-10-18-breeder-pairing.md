---
batch: breeder-pairing-from-wix-reinventory
started: 2026-10-18
asked_by: Alex
evidence: hs-seo-data/puppyconnection/2026-10-18-wix-reinventory (review.html, listings.json, compare.json)
decisions:
  - {date: 2026-10-18, by: Alex, decision: "Each Responsible Dog Breeder Network member kennel gets its own breeder page", quote: "show kennels in rdbn show each with its own breeder page"}
  - {date: 2026-10-18, by: Alex, decision: "Listings with no breeder that are not on the live site are removed", quote: "if those listings without a breeder are not on the current live site remove them"}
  - {date: 2026-10-18, by: Alex, decision: "Toast gets County Line Kennel as its own breeder", quote: "for toast if it links to that kennel then it should get its own"}
  - {date: 2026-10-18, by: Alex, decision: "Peaceful Paws Puppies is removed once no puppy names it", quote: "if peaceful paws puppies are no more remove them"}
  - {date: 2026-10-18, by: Alex, decision: "Elowen, Malcolm and Smurf belong to Kingdom Family Companions, Amber's other website", quote: "elowin, malcolm, and smurf are ambers other website kingdom family companion"}
  - {date: 2026-10-18, by: Alex, decision: "The rest as proposed on the review page: sold on Wix marked placed, gone listings archived, prices and statuses from Wix, Teapup and Sweet Puppy Paws get breeder records, the 30 new Wix listings added", quote: "and then proceed with the rest"}
tasks:
  - {id: p1, status: done, evidence: "assign.json, 273 staging puppies", item: "Assign every staging puppy its kennel from the live listing, or from the stored Wix text when the listing is gone"}
  - {id: p2, status: done, evidence: "kennels.json from kennel_pages.json and the network Our Breeders page, town and state only", item: "Read each new kennel's own website or network page for name, phone, email, town and Facebook"}
  - {id: p3, status: done, evidence: "new_listings.json, 30 of 30", item: "Fetch the 30 new Wix listings in full, with photos"}
  - {id: p4, status: done, evidence: "app/.state/backup-2026-10-18-before-0023.sql, Downloaded, 280 puppies and 2,359 photos as on staging", item: "D1 export backup to app/.state/ and confirm it"}
  - {id: p5, status: done, evidence: "rehearsed on a copy of the backup (0 foreign key failures, a second run changes nothing, batched and single-transaction results identical), applied in 17 batches with ops/d1-apply.mjs, staging export afterwards identical to the rehearsal", item: "Migration 0023: new breeders, moves, statuses, prices, archives, new listings; apply to staging"}
  - {id: p6, status: done, evidence: "published at generation 37; 38 breeder pages and 254 changed or added puppy pages checked against the database with 0 failures (kennel named, Wix price shown, sold shown adopted, archived out of the sitemap)", item: "Republish and check the pages on staging"}
  - {id: p7, status: done, item: "Update launch-workplan C1 and the README, commit"}
held:
  - "Smurf: Alex named Kingdom Family Companions, but the listing's only contact is 574-377-8023, Bless Your Paws' number, and neither site lists a Smurf. Held for Alex."
---

# Notes

The 16 adopted network puppies that are gone from Wix were archived rather than kept, because the
August harvest cut each stored description before its breeder line, so no text names a kennel
for them, and the network itself now holds no puppies.

Precious Paws Companions: its listings print 762-240-5071, while its own site prints 330-275-4160,
which the profile carries.

Profiles carry no description yet. Each kennel's own site or network page has an About text to
draw one from, as the 2026-10-11 batch did for the first eight breeders.
