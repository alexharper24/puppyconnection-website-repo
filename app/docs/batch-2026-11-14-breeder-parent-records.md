---
batch: 2026-11-14-breeder-parent-records
asked_by: "Alex 2026-11-14: I want to try to identify accurately as many of those as possible and get those updated so that I'm not sending Amber a long list if I don't have to. If you need to review the live websites for the breeders to cross compare the puppies and the parents you should be able to do that too."
follows: app/docs/batch-2026-11-13-wix-parent-photos.md (same approval, same rules, absorbed and not billed)
database: "D1 puppyconnection, app/admin/wrangler.production.jsonc, Puppy Connection Cloudflare account"
evidence_folders: ["C:/Git_Repos/hs-seo-data/puppyconnection/2026-11-14-breeder-parents", "C:/Git_Repos/hs-seo-data/puppyconnection/2026-11-13-wix-parent-photos"]
found:
  amber: "Amber saw few parents moved. Most Wix parent photos are named only with the dog's name (Ocean.jpg, Kallie.webp) or a number, so the file-name rule could not tell mom from dad"
  breeder_records: "A subagent read 32 breeders: 29 live sites (all but Kingdom on the Responsible Dog Breeder WordPress template, whose puppy pages carry a Meet the parents box with Sire and Dam), and the Teapup, Sweet Puppy Paws and Bless Your Paws repos. 8 sites name no dogs. breeder_parents.json holds each named mom and dad and each litter the site ties to them"
  confirms_first_pass: "The breeders' records name the same parents for every litter linked on 2026-11-13 (Teapup, Marlor's Charlie, Gold Paw's Hershey) and list John Doe as a real Teapup sire"
rules:
  - "A litter's mom or dad is determined from a file name matching a dog the breeder lists with one role, a breeder-site litter matched by puppy names (two or more, or one with the birth date within three days), or a file name role word with a name. Every source must agree"
  - "A color word is a name only when the breeder's site ties that litter to the dog"
  - "A conflict in either role leaves the whole litter out: different names, one photo with two names or two breeders, a puppy of the litter listed under another parent, or Wix weights that disagree"
  - "Apply only what an independent second pass also reaches"
tasks:
  - {id: b1-records, status: done, closed: 2026-11-14, evidence: "breeder_parents.json, 32 breeders, no fetch failed", item: "Read each breeder's own site and records for named moms, dads and litters"}
  - {id: b2-match, status: done, closed: 2026-11-14, evidence: "ops/wix_parent_match2.py, after fixing two of its own gaps the second pass exposed (abbreviated month dates such as Sep 14, 2026, and possessive names such as Bentley's): 69 parents (one existing, Charlie) for 114 links not yet set, 26 with a photo, 80 gallery photos to move, 0 covers. Sweet Puppy Paws April 1 litter (Trixie or Winnie, Cody or Oliver) and Chain O' Lakes July 25 litter (mom weights 12 and 9) left out whole", item: "Match by script"}
  - {id: b3-second-pass, status: done, closed: 2026-11-14, evidence: "second-pass2/second_pass2.json, 136 links of which 114 on litters not yet set, identical to mine (114 both, 0 only one side). It also reconfirmed every 2026-11-13 link and John Doe. Bentley is linked as Premier Paw Pals' dad with no photo, because his only photo is a stud advertisement, which stays in the galleries", item: "Independent subagent pass from the raw inputs and rules; apply the intersection"}
  - {id: b4-photos, status: done, closed: 2026-11-14, evidence: "PLAN=plan2.json: 25 photos staged, cleanImage unchanged on all 50 copies, detector point on 22, 50 objects put and read back byte for byte", item: "Stage, check, upload and read back the photos as on 2026-11-13 (PLAN=plan2.json)"}
  - {id: b5-migration, status: done, closed: 2026-11-14, evidence: "migrations/0100_breeder_parent_records.sql. Backup production-2026-11-14-pre0100.sql Downloaded. Rehearsal PASS: parent_dogs 28 to 96, photos 3,062 to 2,982, audit_log +262; run 2 no change; 0 key violations. d1-apply 15 of 15. Read back 96 parents, 262 audit rows, 2,982 photos, 73 imported litters with a parent, 142 live puppy pages showing parents", item: "Migration 0100, backup, two rehearsals, apply, read back"}
  - {id: b6-publish, status: done, closed: 2026-11-14, evidence: "Live: Apple Molly and Pete, Darcy Flower Moon and Gunner, George Gracie and Knight, Leon Creekside's Nala and Maple Lane Tanner, Biscuit (Havanese) Goldie and Oscar, Harold Kimber and Banks, Walter Chocolate and The Bloodcaster; card photos 200 image/webp", item: "Publish and check live pages"}
  - {id: b7-amber, status: done, closed: 2026-11-14, evidence: "amber_update2.py: parents-update-for-amber-2026-11-14.html and .csv, 48 questions (2 litter conflicts, 2 labeled photos, 44 shared photos whose litter still lacks a parent), down from 112", item: "Rebuild Amber's list with only what is still unknown"}
---

# Breeder parent records, 2026-11-14

Decisions are recorded here as they are made.
