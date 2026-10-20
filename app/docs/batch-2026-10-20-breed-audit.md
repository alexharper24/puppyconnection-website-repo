---
batch: breed-audit
started: 2026-10-20
asked_by: Alex
target: staging D1 `puppyconnection`, every puppy published or not (311)
stage: waiting-on-alex-approval
evidence_folder: hs-seo-data/puppyconnection/2026-10-20-breed-audit
review_page: hs-seo-data/puppyconnection/2026-10-20-breed-audit/review.html
tasks:
  - {id: t1, status: done, item: "Gather breed evidence for every puppy from text only: Wix title and category (2026-10-18 re-inventory, else the first harvest), the listing address, the description, the breeder's own site, litter mates", evidence: "evidence.py, evidence.json"}
  - {id: t2, status: done, item: "Sort into agree (290), different (16), unclear (5)", evidence: evidence.json}
  - {id: t3, status: done, item: "Review page sent to Alex", evidence: review.html}
  - {id: t4, status: open, blocked_on: alex, item: "Row approvals, or approve all clear ones"}
  - {id: t5, status: pending, item: "D1 export backup to app/.state/, numbered migration, fix the litter grouping in _harvest/builddata.py and a guard in app/dev/seed.mjs, apply to staging, publish, check breed and breeder pages, record in the launch workplan"}
findings:
  - "Cause: _harvest/builddata.py keyed a litter on breeder domain plus birth date, with no breed. Most listings printed peacefulpawspuppies.com, so different breeds born the same day shared a litter and app/dev/seed.mjs gave the litter the first puppy's breed. The 2026-10-18 pairing generator (app/dev/make-breeder-pairing-migration.mjs, single use) copied the source litter's breed onto each split-off litter."
  - "16 puppies, 6 litters, 4 breeders: Cuddly Family Companions 8 (4 Great Danes as Miniature Schnauzer, 4 Shih Tzus as Cavalier), Peaceful Paws 3 Great Danes as Miniature Schnauzer, Responsible Dog Breeder Network 4 Cavaliers (3 as Miniature Dachshund, 1 as Cocker Spaniel), Pine Creek Bulldogs 1 English Bulldog as French Bulldog."
  - "Every evidence breed is already in the breeds table."
  - "The Pine Creek litter also carries French Bulldog parent weights and colors from the Johnny Miller litter it was split from."
  - "Unclear: the 5 Maple Brook Doodles demo puppies, which have no Wix record and no breed in their text. No change proposed."
---

# Breed audit, 2026-10-20

Alex saw Great Danes under Cuddly Family Companions listed as Miniature Schnauzers. The breeder pairing
was trued up on 2026-10-18 but the breeds were never checked, so this batch checks every puppy.

24 puppies show a second breed in their text, but in each the Wix title, category and address agree with
the current breed and the second breed is a parent (a Bichon mom on a Teddy Bear), a coat color ("blue
boston mantle" on a Great Dane) or a listing filed under two Wix categories. They are counted as agreeing.
Mercy's address reads mercy-cavapoo while every other source says Toy Poodle, so her breed stays.
