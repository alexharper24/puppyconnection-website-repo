---
batch: breeder-walkthrough
date: 2026-11-01
objective: "A short animated walkthrough of the breeder journey, from sign-in to a paid listing, for Alex to review before it may play in the portal on a breeder's first sign-in."
source: app/docs/walkthrough/index.html
artifact: "https://claude.ai/artifact/Y1AwRdwZc58bxnpVy7Pet4 (private, version 1, 2026-11-01)"
video: "app/docs/walkthrough/render.py writes breeder-walkthrough.mp4 (1920x1080, 30 fps, H.264) beside index.html, gitignored. --phone writes a 1080x1920 version"
running_time: "2:08, the sum of the scene timeline as the page computes it"
facts_from: app/docs/breeder-journey-storyboard.md
reference_screens: "Local portal on 127.0.0.1:8797 with setup.mjs --reset --demo, signed in as the made-up demo kennel Maple Brook Doodles. Nothing was run against the live portal."
sample_names:
  kennel: Maple Brook Doodles
  sign_in_email: casey@example.com
  mom: Hazel
  dad: Bramble
  puppies: [Clover, Juniper, Pepper]
  breed: Mini Bernedoodle
live_settings_used: "$14.99 per puppy, 15 photos, a new photo every four weeks (checked 2026-11-01)"
held_for_parallel_session:
  - "Google sign-in is shown only for an address already added to a kennel, and no Google account screen is drawn."
  - "Checkout is a plain card with the total and Pay, with no fine print."
  - "Parent photos are added with no photo check shown, so nothing claims either rule."
scenes:
  - { id: s1, chapter: Sign in, what: "Sign-in card, Continue with Google highlighted, then email and password typed and Sign in pressed", status: built }
  - { id: s2, chapter: Moms and dads, what: "Overview, menu to Moms and dads, Add a mom, Fill from a document fills name, breed and health tests", status: built }
  - { id: s3, chapter: Moms and dads, what: "Mom photo added, Add mom pressed, dad saved the same way, both on the page", status: built }
  - { id: s4, chapter: Start a litter, what: "Add a litter, breed typed into the search, dates, weights, mom and dad picked, litter card appears", status: built }
  - { id: s5, chapter: Add the puppies, what: "Add several, 3 girls and 3 boys at one price, six puppy cards appear", status: built }
  - { id: s6, chapter: Add the puppies, what: "Open Girl 1, rename to Clover, Fill from a document, document rotated upright", status: built }
  - { id: s7, chapter: Add the puppies, what: "Add photos, Checking photo 1 of 3, one Sent back, first is Cover, Save puppy, ready to list box", status: built }
  - { id: s8, chapter: Pay to list, what: "Pay to list, Select all, total updates, Pay $44.97 for 3 listings, plain checkout card", status: built }
  - { id: s9, chapter: Pay to list, what: "Back on Litters and puppies, toast, pills change to Listed, four-week photo note, Replay", status: built }
open:
  - { id: w1, item: "Alex reviews the artifact and gives corrections", blocked_on: Alex }
  - { id: w2, item: "Decide whether and how it plays on a breeder's first sign-in", blocked_on: Alex }
  - { id: w4, item: "Alex approves the 1080p MP4 or asks for a phone-shaped one", blocked_on: Alex }
  - { id: w3, item: "Recheck the sign-in, checkout and parent photo scenes once the parallel session's changes land", blocked_on: parallel session }
closed:
  - { id: w0, item: "Build and publish the first draft", date: 2026-11-01, evidence: "All nine scenes rendered with no console errors at desktop and phone widths in the local browser, and the artifact published as version 1" }
---

# Breeder walkthrough batch

The walkthrough follows Alex's five steps in his order, so the parents come before the litter
even though the portal's own Overview nudges the litter first. Every label, field and message is
copied from the storyboard and from the local portal screens, with sample names only.

The scenes are recreations drawn in HTML on the portal's own tokens and classes, copied from
`app/portal/public/portal.css` into the page so it stands alone. The photos are drawn puppies,
not photographs, so no real puppy appears.

Reduced motion shows each scene in its finished state with no cursor, typing or slide, and does
not start playing on its own.

## Where the recreation goes beyond what was seen

The Moms and dads list was only seen empty on the local portal, so its rows with a saved mom and
dad (photo, name, "Mom, Mini Bernedoodle. 4 health tests" and Edit) are drawn to match the puppy
rows rather than copied. The checkout card is a plain stand-in with the total and a Pay button.
Fill from a document was off locally because there is no AI binding there, so its box and messages
come from the markup and strings in `portal.js`.
