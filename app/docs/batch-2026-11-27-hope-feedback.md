---
batch: 2026-11-27-hope-feedback
asked_by: Alex, from Hope's feedback (Hope is staff and works through Manage as this breeder in the portal)
branch: claude/hope-batch-1127
tasks:
  - id: H1
    item: Staff acting for a breeder in the portal can use a photo the check sent back
    finding: Hope never uses the admin photo drawer. Every one of her uploads is an operator session in the portal (the audit actor reads "<staff address> acting for <kennel>"), and the portal had no override, so the override shipped on 2026-11-25 was out of her reach
    status: built
    evidence: dev/hope-batch-test.mjs, 27 of 27 local
  - id: H2
    item: Review what the photo check sends back on production and whether it is too strict
    finding: 70 of about 1,200 uploads sent back from 2026-10-31 to 2026-11-27. All 23 still held were judged good listing photos on review (20 person, 2 hidden, 1 blurry, 1 watermark)
    status: built, confirm step added to lib/photocheck.js
    note: tuning run against the 23 and the labeled October sample, results in docs/photo-check-tuning-2026-11-27.md
  - id: H3
    item: Sign-in persistence on the Puppy Connection admin and portal, and a look (no changes) at Teapup and Sweet Puppy Paws
    finding: kept out of the repo, in app/.state/notes/signin-persistence-2026-11-27.md. The staff session in the portal was 8 hours with no renewal. The Cloudflare Access app session is 24 hours on both accounts, with the emailed code and Google both offered and Instant authentication off
    status: code built (staff session 30 days, renewed on use). Access settings wait on Alex
    blocked_on: alex
  - id: H4
    item: Several documents at once are each classified and named from what they say, and listed
    finding: A kennel she manages, 2026-11-24 01:45 UTC. One dad's cardiac went up public, the next three went up private in one choice, because the Who can see it radio sat under the upload button and reset to staff only after every upload. Only public documents show on the site, so only the cardiac showed. All eight were made public on 2026-11-25
    status: built
    note: Read each file and choose for me is the default and names each file from what it says
  - id: H5
    item: Who can see it stays on the choice made, and each document's own control reads as a choice
    finding: The mom in the same litter, 2026-11-24 01:46 UTC. Four documents uploaded public, then each flipped to private one by one with the Make private button within the same minute
    status: built
  - id: H6
    item: A socialization section for each puppy, in the portal, the admin and on the puppy page
    status: built
    note: migration 0103 must run on production before the deploy
  - id: H7
    item: The listing strength prompts say only what Puppy Connection has asked for
    status: blocked
    blocked_on: alex
    note: Alex is getting the list of what Puppy Connection expects
  - id: H8
    item: Puppy video on, with a video added from the puppy form before the puppy is first saved
    note: Amber turned on Stream on 2026-11-26. STREAM_API_TOKEN confirmed set on portal and admin
    status: built
  - id: H9
    item: What each reporting measure means, in plain words for breeders and staff
    status: researched
---

# Hope's feedback, November 27, 2026

Evidence for H1, H4 and H5 is the production audit log, read 2026-11-27.
