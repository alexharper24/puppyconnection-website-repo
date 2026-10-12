---
batch: breeder-profiles-and-puppy-links
started: 2026-10-11
asked_by: Alex
ask: "go out to the various websites for the breeders and generate that description based on their own information on their website ... provide contact information for each of the breeders, phone number, email address, and then the website ... on each of the puppy pages ... set the individual puppy URL page as a button ... the goal is to ensure that when visitors visit the site, they navigate to the breeders, they click on the puppies, and they can directly go to each of the puppies and have access to contact information, clearly and easily."
scope:
  breeders: [Peaceful Paws Puppies, Responsible Dog Breeder, "Chain O' Lakes Companions", Heartland Mini Schnauzers, Bless Your Paws Puppies, Kingdom Family Companions, Winding Streams Companions, Cornerstone Cavaliers]
  data_home: "D1 owns breeder_profiles and puppies.breeder_url, so changes land as a migration run on staging after a backup, never as file edits"
tasks:
  - {id: b0, status: done, item: "Highlights follow-ups: Victorian questions kept, French Bulldog sheds minimally, Cocker guide text names the club's tests (migration 0013, applied to staging)"}
  - {id: b1, status: done, item: "Read each breeder's own site: about text, phone, email, town and state, Facebook, with the source page for each fact"}
  - {id: b2, status: done-six-of-eight, item: "Draft each breeder description only from what their site says"}
  - {id: b3, status: done-six-of-eight, item: "Match each puppy to its own page on the breeder's site and record the evidence. Unmatched puppies keep their current link"}
  - {id: b4, status: done, item: "Puppy page: a clear button to the puppy's own page on the breeder's site, with phone, email and website as tappable buttons"}
  - {id: b5, status: done, item: "Breeder page: the description and the same contact buttons"}
  - {id: b6, status: done-six-of-eight, item: "Migration with profiles and links, backup, apply to staging and local, tests, sync, push, verify"}
excluded:
  - "Unassigned Wix listings (no breeder) and the two test breeders Maple Brook Doodles and Thistledown Pups"
---

# Notes

Matching puppies to the breeder's own pages also tests the Wix import's breeder guesses, which is
why breed pages do not name breeders yet. A puppy found on a different breeder's site is reported,
not moved.

## Held for the breeder pairing (2026-10-12)

Peaceful Paws Puppies: none of the 123 puppies we hold appear on its site, which shows no single
puppies, lists four breeds where ours hold about a dozen, and prints a 517 phone number where ours
holds a 574 one. Responsible Dog Breeder: the site is a network of 34 member kennels, and every puppy
matched belongs to a member kennel. Puppies found on breeders already in the directory: Qeleigh,
Quartz and Quinn (Heartland), Lars, Leo, Dahlia and Sunny (Cornerstone), Guy and Gertie (Winding
Streams), Tirzah (Bless Your Paws), Elowen and Malcolm (Kingdom Family, by name only). Heartland's
Damon and Stephan (Yorkshire Terriers) are not on Heartland's site. Source notes are in
hs-seo-data/puppyconnection/2026-10-11/breeders.

## Pairing, first round (2026-10-12, migration 0015)

Alex approved: "move them, hide maple brook. show rdb puppies under them instead of breeders for now."
Ten puppies moved to the breeder whose site lists them. Elowen and Malcolm stayed unassigned, since
their match rests on the name alone. Responsible Dog Breeder now shows as Responsible Dog Breeder
Network with its own contact details, and 11 of its puppies link to their own page on its site. Maple
Brook Doodles is suspended, so it is off the public site. Peaceful Paws Puppies is unchanged and still
waits on Amber.
