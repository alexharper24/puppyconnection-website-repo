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
  - {id: t2-dns, status: blocked, blocked_on: alex, evidence: "Resend shows three records (TXT resend._domainkey, CNAME send and rsend to forge.rmta.net). All three are in the pending Cloudflare zone, DNS only, and the DKIM value matches the live Wix record character for character (218 of 218). Deleting the _dmarc CNAME to Wix was refused by the auto-mode classifier (DNS changes), so Alex replaces it: delete the CNAME, add TXT _dmarc v=DMARC1; p=none; rua=mailto:info@puppy-connection.com", item: "Compare the live Wix DNS with the pending Cloudflare zone, add any missing Resend records, and replace the Wix DMARC record with Puppy Connection's own"}
  - {id: t3-checklist, status: done, evidence: "Backup production-2026-10-26-pre0067.sql (3.78 MB, Downloaded). 0067 rehearsed twice on the backup with d1-apply --sqlite (second run added nothing), applied with --remote, re-applied once after adding the multi-kennel item. Drift: the workplan and the checklist agree; export 91 items, 0 drift. checklist-test 86 passed, 4 failed, the known baseline. Launch list now holds 19 open items; B3, F1, A23, F4, F5 and F6 moved to Gate 1", item: "Bring the admin launch checklist to only what is outstanding for launch, by a migration after a D1 backup"}
excluded:
  - "Proving a nightly backup restores, held by Alex 2026-10-26"
---

# Notes

Progress is recorded in the header as each task lands.
