---
batch: 2026-11-01-breeder-journey-fixes
started: 2026-11-01
asked_by: Alex, 2026-11-01, from the open questions and first-time traps in app/docs/breeder-journey-storyboard.md
branch: fix/breeder-journey-six
read_first: [_claude-state.md, app/docs/batch-2026-10-31-launch-eve.md, app/docs/breeder-journey-storyboard.md]
rules:
  - "Never test against the live portal. Tests run on the local harness (app/dev) only"
  - "Database writes follow the d1-migration skill. This batch needs none"
  - "Leave app/docs/walkthrough/ alone, a parallel session owns it"
  - "Merge and deploy own PRs (Alex allows this for Puppy Connection)"
tasks:
  - id: j1-google-2fa
    status: done
    closed: 2026-11-01
    decision: "Alex 2026-11-01: Google sign-in does not ask for the authenticator code. Two-factor is optional and for password sign-in only"
    evidence: "No code change. googleCallback and oneTapSignIn go straight to signInPerson, which is the decided behavior"
    item: "Google sign-in and the authenticator code"
  - id: j2-google-unknown
    status: in_progress
    decision: "Alex 2026-11-01: a Google address no kennel has added (main contact or extra person, by invitation or by Puppy Connection) cannot sign in or create an account"
    progress: "verifiedKennels takes allowNew. Google passes false, so an unknown address gets 403 GOOGLE_NO_ACCOUNT. The redirect flow lands on /?google=unknown and the sign-in page shows the same words with Create an account as a link. An address with an invitation waiting lands on /?google=invited. One Tap answers the same message as JSON"
    item: "Refuse unknown Google addresses with a message saying how to get access"
  - id: j3-checkout-wording
    status: in_progress
    progress: "lib/payments.js listingNote now says a puppy stays listed for as long as it gets a new photo at least every four weeks (or names the days when listing_days is set). Portal help 'How do I keep a listing on the site?' no longer says the listing ends when the puppy goes home. Checked and left: lib/mail.js reminder emails (placing stops reminders, which is true), portal/legal.js (says nothing about how long a listing lasts), the listing terms in the database (Amber's words, they make no such claim)"
    item: "Correct the 'stays listed until you remove it or mark it placed' wording everywhere"
  - id: j4-parent-photos
    status: in_progress
    measured: "Production read 2026-11-01: 2 saved parents, both with a photo, both on public litters (Sparkle and Grizzly, Sweet Puppy Paws). Neither would fail: 1,600 by 1,280 and 1,226 by 1,031 px, and the Workers AI check passed each in three runs (dev/photo-check worker, full-size photo as the new check sends it). Nothing removed"
    progress: "lib/photocheck.js checkParentPhoto: the 1,000 px floor and the same Workers AI check, run at upload. A parent has one photo and no review queue, so a failing photo is never stored and the breeder sees the reasons (said about a dog, not a puppy). The portal runs the same browser floor and dark check first. Existing photos are left alone. Privacy policy updated in the same commit"
    item: "Mom and dad photos through the same size and quality check, with a count of current parent photos that would fail"
  - id: j5-dashboard-order
    status: in_progress
    progress: "Overview shows Your first listing until a puppy is on the site: add the mom and dad, start a litter, add the puppies, pay to list, each ticked from saved data with a button on the first step not done. The empty Litters screen points to Moms and dads when none are saved. Help leads with the mom and dad"
    item: "First-run prompts lead with the mom and dad, then the litter, the puppies and paying to list"
  - id: j6-price-required
    status: in_progress
    measured: "Production read 2026-11-01: 1 puppy of 319 has no price (Shiloh, Bless Your Paws, published and marked placed). No drafts exist"
    progress: "puppyFields (portal and admin) refuses a save with no price unless the puppy is marked placed, because a placed puppy is no longer offered. Add several puppies needs a price for each. The form's price boxes are marked required"
    item: "Price required wherever a puppy is saved for listing, with the count of existing puppies without one"
excluded:
  - "app/docs/walkthrough/, owned by the parallel walkthrough session"
---

# Breeder journey fixes, 2026-11-01

Six items Alex decided on 2026-11-01 from the storyboard's open questions. Status moves in the header
as each lands.
