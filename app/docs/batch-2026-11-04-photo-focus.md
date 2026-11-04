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
    status: done
    closed: 2026-11-04
    evidence: "Live build generation 644: data.js phone crop positions Quest 71.4%, Quinn 58.6%, Qeleigh 60.7%, Apollo 41.4%, Brittany 56.4%, Cosette 39.3%, Sawyer 45.7%, Alexa, Harold and Junior 50%; 0 available listings without a phone crop position"
    progress: "Backup production-2026-11-04-pre0090.sql Downloaded; rehearse_migration PASS (run 1: photos 120 changed via 120 audit rows, run 2: 0 changes, 0 key violations); d1-apply 4 of 4 batches; site_state generation 644, marker cleared by the publish"
    item: "Apply one migration with d1-apply after a backup and two rehearsals, read it back, publish, and check the live cards"
  - id: f5-faces-at-edge
    status: done
    closed: 2026-11-04
    evidence: "Live build 645; Samuel's phone card at 375 px reads object-position 71.4% 50% with his face centred"
    asked: "Alex 2026-11-04: mobile still doesn't show right for at least Samuel"
    found: "Phone cards of all 154 drawn at full size from the live data.js (scratchpad phone_sheet.py). The first pass passed a face that touched the edge; this pass flags any face at or past the edge: Samuel, Apple Jacks, Atlas (Cocker Spaniel), Celestia, Charlie, Dixon, Emerald, Georgia, Gunner, Jillian, Josie, Jules, Lars, Leanna, Persephone, Sabrina Jane"
    progress: "0091 by app/ops/photo_focus_hand.py from points set on a grid over each photo and checked as before and after phone crops. Backup production-2026-11-04-pre0091.sql Downloaded, rehearse PASS (16 changed, second run 0), d1-apply 1 of 1, read back 22 photo.focus audit rows today (6 + 16), Samuel 0.6, site generation 645. Charlie's right ear touches the edge of the original photo, so his card cannot show it whole"
  - id: f6-prevent
    status: open
    blocked_on: alex
    item: "Prevent faces cut on the phone card: a tap-the-face step with a live card preview where the breeder sets the cover and in the admin, measuring any photo stored without a size or focus on the next run, and a face-aware automatic point. Alex decides; new build work goes to the quoting session"
---

# Photo focus, 2026-11-04

The focus point decides where each card crop sits (generate.mjs objectPosition). The detector rule in lib/focus.js puts
the point at the middle of the dog box across, which is the body rather than the face for a dog standing side on, as
Quest is. Points for f1 are set by hand on the face and marked as hand-set in the audit row.
