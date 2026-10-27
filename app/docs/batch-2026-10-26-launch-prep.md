---
batch: launch-prep
started: 2026-10-26
asked_by: Alex
ask: "publish google sign-in and update the admin checklist with only outstanding items for launch. process the email record check as well. we'll hold off on nightly backup restore."
rules:
  - "Back up D1 and confirm Downloaded before the checklist migration"
  - "DNS changes go only into the pending Cloudflare zone; the nameservers stay on Wix until Alex sets the date with Amber"
  - "No prices or hours in this repo"
tasks:
  - {id: t1-google, status: done, evidence: "Consent screen was already In production (External, basic scopes, no logo so no review). Added https://portal.puppy-connection.com/auth/google/callback to the client, which also authorized puppy-connection.com; reloaded and confirmed it saved", item: "Publish the Google sign-in consent screen in Alex's Google Cloud project"}
  - {id: t2-dns, status: done, evidence: "Alex said change it for me (2026-10-26): Wix _dmarc CNAME deleted and TXT _dmarc v=DMARC1; p=none; rua=mailto:info@puppy-connection.com added in the pending zone, confirmed in the record list. Earlier: Resend shows three records (TXT resend._domainkey, CNAME send and rsend to forge.rmta.net). All three are in the pending Cloudflare zone, DNS only, and the DKIM value matches the live Wix record character for character (218 of 218). Deleting the _dmarc CNAME to Wix was refused by the auto-mode classifier (DNS changes), so Alex replaces it: delete the CNAME, add TXT _dmarc v=DMARC1; p=none; rua=mailto:info@puppy-connection.com", item: "Compare the live Wix DNS with the pending Cloudflare zone, add any missing Resend records, and replace the Wix DMARC record with Puppy Connection's own"}
  - {id: t3-checklist, status: done, evidence: "Backup production-2026-10-26-pre0067.sql (3.78 MB, Downloaded). 0067 rehearsed twice on the backup with d1-apply --sqlite (second run added nothing), applied with --remote, re-applied once after adding the multi-kennel item. Drift: the workplan and the checklist agree; export 91 items, 0 drift. checklist-test 86 passed, 4 failed, the known baseline. Launch list now holds 18 open items; B3, F1, A23, F4, F5 and F6 moved to Gate 1", item: "Bring the admin launch checklist to only what is outstanding for launch, by a migration after a D1 backup"}
  - {id: t4a-invite, status: in_progress, kennel: "Puppy Connection Test (Amber's payment-test kennel, main email info@, approved by Luke 2026-10-27T00:12Z), so no real breeder's account changes", item: "Alex sends one invitation from the production admin to a fresh address of his, and opens it on his phone"}
  - {id: t4b-signin, status: in_progress, item: "Through that invitation: set a password, add an authenticator, sign out, sign in with password and code, then Forgot password with the code; portal log streamed to scratchpad portal-tail.jsonl for CPU time"}
  - {id: t4c-report, status: in_progress, item: "One report against Puppy Connection Test at /report?breeder=puppy-connection-test reaching info@, then dismissed in the admin"}
  - {id: t5-stripe-endive, status: in_progress, evidence: "Amber's first live Pay failed: API 2026-09-30.endive refuses payment_method_types (staging pins dahlia, so never seen there). PR 21 merged as cc3f693, LF endings restored in the next commit. Production deploy refused by the auto-mode classifier, so Alex deploys. Live Default payment configuration: Klarna disabled by Claude on Alex's say-so; Amazon Pay, Cash App Pay, MB WAY, Satispay, Bancontact, BLIK, EPS, Pay by Bank and Pix still enabled, the classifier refused the rest. ACH and every other delayed method already disabled, and Klarna confirms immediately", item: "Fix the live Checkout error and set live payment methods to cards"}
excluded:
  - "Proving a nightly backup restores, held by Alex 2026-10-26"
---

# Notes

Progress is recorded in the header as each task lands.
