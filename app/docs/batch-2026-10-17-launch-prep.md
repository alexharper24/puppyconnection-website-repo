---
batch: "2026-10-17 launch prep, from Alex's list"
tasks:
  - {id: t1, task: "Email provider decision", status: pending, note: "Cloudflare Email Service is transactional only and does not permit marketing or bulk list sends, so it cannot carry the mailing list. Recommend Resend for all email (already coded in lib/mail.js), pending Alex's OK"}
  - {id: t2, task: "Prepare the puppy-connection.com zone in the Puppy Connection Cloudflare account, with every current record copied", status: pending}
  - {id: t3, task: "Turn off DNSSEC and the transfer lock for puppy-connection.com in Wix (Alex's Chrome)", status: pending}
  - {id: t4, task: "Spawn the build sessions", status: pending}
  - {id: t5, task: "Export the Wix subscriber list in Chrome and import it into the staging mailing list", status: pending, note: "Subscriber data is personal data: kept in the session scratchpad, never committed, deleted after import"}
  - {id: t6, task: "Stripe sandbox testing complete (Alex, 2026-10-17)", status: done}
  - {id: t7, task: "Add luke.blakeslee@gmail.com, the address Amber and Luke share, as an admin owner and on the Cloudflare Access policy", status: pending}
  - {id: t8, task: "Real addresses confirmed: portal.puppy-connection.com and admin.puppy-connection.com (Alex, 2026-10-17)", status: done}
  - {id: t9, task: "Breed guide pages confirmed (Alex, 2026-10-17), to publish in the site session", status: done}
  - {id: t10, task: "Listing review settled: breeder approval at sign-up and profile setup (built), the photo quality check guards photos, approved breeders add litters and puppies without approval, flagged photos go to the breeder to re-upload or to Amber. Update the workplan, plan data and Amber's documents", status: pending}
  - {id: t11, task: "Inactivity schedule built on the defaults", status: pending, note: "goes to the data build session"}
---
