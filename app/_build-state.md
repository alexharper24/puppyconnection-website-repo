---
batch: puppyconnection-local-simulation
started: 2026-09-30
asked: "take what exists currently and build the guts leaving the email delivery, stripe, paid worker plan, etc. for bolting in when appropriate ... signing up for account, logging in, approval and then test ability to create / list breeds with a non functional payment processing button ... simulate the process fully end to end"
spec: hs-proposals/puppyconnection/puppyconnection-implementation-spec.md (private, local only)
exit_criteria:
  - "Sign up with an email, open the link from the local mailbox, sign in, complete the profile and submit"
  - "Amber approves from the admin screens (declines and suspends also work)"
  - "The approved breeder creates a litter and puppies with photos"
  - "Pay runs the real checkout path (holds, checkout rows, fulfillment batch) against a simulated Stripe page"
  - "The paid puppy appears in a local preview of the concept site"
  - "The ten acceptance tests run as a script and pass"
bolt_in_later:
  - "Resend (EMAIL_MODE=log shows mail at /dev/mail instead)"
  - "Stripe (PAYMENTS_MODE=sim uses a local checkout page; the Stripe client is written to the same interface)"
  - "Workers Paid, cron publish to GitHub, Access on admin (DEV_IDENTITY locally), custom hostnames"
tasks:
  - {id: b0, status: done, task: "Tooling proof: wrangler from teapup node_modules, two dev processes sharing one local D1, R2 and ratelimit in local"}
  - {id: b1, status: done, task: "schema.sql with views, seed from data/data.js (breeds, demo breeders as .test, listings comped)"}
  - {id: b2, status: done, task: "lib: util, owned, mail (log), payments (sim + fulfillCheckout)"}
  - {id: b3, status: done, task: "portal worker: auth, sessions, profile, submit, litters, puppies, photos, checkout, sim Stripe page, success/cancel"}
  - {id: b4, status: done, task: "portal UI"}
  - {id: b5, status: done, task: "admin worker + UI: approvals, breeders, listings, checkouts, audit, export"}
  - {id: b6, status: done, task: "preview export into a local copy of the concept site"}
  - {id: b7, status: done, task: "access tests (10) and e2e script"}
  - {id: b8, status: partial-screenshots-timed-out, task: "browser walk-through and screenshots"}
  - {id: b9, status: done, task: "README, state file, gitignore, commit locally (no push without Alex)"}
---

# Local simulation build

Working file for this build. Each task's status is updated as it lands.
