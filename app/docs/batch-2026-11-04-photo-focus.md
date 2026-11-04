---
batch: 2026-11-04-photo-focus
asked_by: "Alex 2026-11-04: fix the seven focus points and republish, and review the new puppies as well"
read_first: [app/docs/batch-2026-11-02-post-launch.md, app/lib/focus.js, app/ops/measure_photos.py]
tasks:
  - id: f1-seven-covers
    status: done
    closed: 2026-11-04
    evidence: "0090 read back: Quest 0.60, Quinn 0.54, Qeleigh 0.55, Apollo 0.46, Brittany 0.53, Sawyer 0.48 (each guarded on its old value), Cosette 0.45 with its first measurement. Checked as phone crops before and after (scratchpad phone-before-after.jpg). The covers are 3:2, so the desktop card shows them whole; the ear tips touching the top on Brittany, Cosette and Sawyer are in the original photos and no focus point changes them"
    item: "Move the focus point of the cover photo of Quest, Quinn, Qeleigh (Miniature Schnauzers), Brittany (Great Dane), Cosette (Papillon), Sawyer (French Bulldog) and Apollo (Havanese) onto the dog's face, so the 3:2 desktop card and the 4:5 phone card keep the head in frame"
    found: "Crop review of all 154 available puppies on 2026-11-04, cards drawn from the live data.js with the live main.js rules. Quest, Quinn and Qeleigh lose the head at the right edge on the phone card; the other four clip an ear or the top of the head"
  - id: f2-unmeasured
    status: done
    closed: 2026-11-04
    evidence: "0090 read back: 0 photos of available puppies without a width, 120 audit rows (114 measured, 6 hand-set). Sizes from /media/<id>, points from the dev/photo-focus detector with the lib/focus.js rule; Alexa, Harold and Junior covers keep 0.5 across because the detector point moved the face off centre on the phone card. Two gallery photos had no dog found (Apollo 7th, Brittany 3rd) and keep no focus"
    item: "Measure and set a focus point for photos of available puppies that have no width, height or focus. Without them a card crops from the top centre and a portrait photo is not shown whole"
    found: "2026-11-04 read: 18 available puppies imported 2026-10-02 and 2026-10-18 have portal-stored photos with no width, height or focus (about 130 photos). Their photos were not in the Wix photo refresh check, which covered photos brought from Wix only"
  - id: f3-new-puppies-review
    status: done
    closed: 2026-11-04
    evidence: "175 photos checked (size under 500 px, contrast, dog found, card crops): Samuel and Shawn pass with the whole dog in both card crops; no photo of the 18 imported puppies is small or flat; only the two gallery photos above had no dog found"
    item: "Review the puppies added since the Wix photo refresh (Samuel and Shawn, Sweet Puppy Paws, 2026-10-31) and the f2 puppies with the same checks as the refresh: size, contrast, dog found, and the card crops"
  - id: f4-publish
    status: in_progress
    progress: "Backup production-2026-11-04-pre0090.sql Downloaded; rehearse_migration PASS (run 1: photos 120 changed via 120 audit rows, run 2: 0 changes, 0 key violations); d1-apply 4 of 4 batches; site_state generation 644, marker cleared by the publish"
    item: "Apply one migration with d1-apply after a backup and two rehearsals, read it back, publish, and check the live cards"
---

# Photo focus, 2026-11-04

The focus point decides where each card crop sits (generate.mjs objectPosition). The detector rule in lib/focus.js puts
the point at the middle of the dog box across, which is the body rather than the face for a dog standing side on, as
Quest is. Points for f1 are set by hand on the face and marked as hand-set in the audit row.
