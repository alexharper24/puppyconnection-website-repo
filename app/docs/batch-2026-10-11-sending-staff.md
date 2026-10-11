---
batch: sending-and-staff
started: 2026-10-11
asked_by: Alex
ask: "go ahead and build the mailing list sending and staff sign-ins"
why: "Both moved into the build on the October 11 quote. Pricing stays in the private proposals repo"
tasks:
  - {id: s1, status: done, item: "Migration 0012: campaigns and campaign_sends tables"}
  - {id: s2, status: done, item: "Sending: owner composes an email in the admin, sends a test to themselves, then sends to everyone subscribed. Each email carries a one-click unsubscribe link, the List-Unsubscribe headers and the mailing address, and sending refuses until a mailing address is set. Sent in batches of 100 through the email service, four batches a run, the first run at once and the rest on the 15-minute schedule"}
  - {id: s3, status: done, item: "Staff role enforced in the admin router: staff can find and edit breeders, litters and puppies, manage photos, hold listings, add notes, publish and read the activity and email logs; only owners approve or change breeders' status, change a sign-in email, list for free, handle payments, refunds, disputes and reports, edit breeds, terms and settings, use the mailing list and manage people"}
  - {id: s4, status: done, item: "People screen for owners: add or remove an operator and set owner or staff, never removing the last owner, with a reminder that the address must also be added to the Cloudflare Access policy"}
  - {id: s5, status: done, item: "Photo screen in the admin puppy editor: add, remove and reorder a puppy's photos for the breeder, with the same resizing and card copy the portal makes"}
  - {id: s6, status: done, item: "Tests, staging migration with a backup first, deploy, and the state file"}
evidence: "admin-features-test 104 passed (sending: address required, test copy, count confirmation, each subscriber's own unsubscribe link, unsubscribed skipped, sent emails locked; staff: refused money, approvals, settings, breeds, terms, mailing list and sign-ins, allowed photo add, reorder and remove), portal-features-test 100, jobs-test and publish-test all passed; photo screen checked in the browser with all 10 imported photos loading; staging backed up to .state/staging-2026-10-11-pre0012.sql, migrated and deployed"
excluded:
  - "The photo app connection and moms and dads stay later add-ons"
---

# Notes
