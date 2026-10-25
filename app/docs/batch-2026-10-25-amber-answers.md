---
batch: amber-answers-and-staging-deploy
started: 2026-10-25
asked_by: Alex
ask: "amber turned on workers paid and resend pro, deploy it" and work through Amber's answers to the launch asks while Alex is out
source: "Amber's answers pasted by Alex on 2026-10-25, recorded in hs-proposals/puppyconnection/2026-10-25-amber-answers-launch-asks.md"
rules:
  - "Back up D1 and confirm Downloaded before every hosted migration"
  - "Deploy portal and admin only from main"
  - "Never pair a listing with a breeder on a phone number alone; match by name, and report anything ambiguous"
  - "Listings Amber says to delete are archived and unpublished, never hard-deleted"
  - "No em dashes joining clauses in site copy; Amber's words otherwise kept as written"
tasks:
  - {id: t1-deploy, status: open, item: "Confirm Workers Paid, back up staging, apply 0055 and 0060, deploy portal and admin from main, smoke test password sign-in, a real email, an invitation and Run now retention"}
  - {id: t2-contact, status: built, branch: amber-answers-site-content, evidence: "CONTACT in js/main.js filled and main.js ?v=41 on the eight root pages; Contact page in build/info-pages.mjs has the email, phone, Facebook and Instagram. Built locally: the Let's Chat panel shows all four with no REPLACE THIS, and About, Contact and the home page have no sideways scroll at 1440 and 375 (measured in sized iframes). Open until merged and the site repository is synced", item: "Contact details on the site: info@puppy-connection.com, (574) 221-0326, Facebook https://www.facebook.com/puppyconnectionUSA, Instagram https://www.instagram.com/puppy_connection_in/ (Let's Chat button and Contact page)"}
  - {id: t3-about, status: built, branch: amber-answers-site-content, evidence: "Amber's two paragraphs open the About page, the dash a full stop and the double space one. The older experience paragraph now reads 'is based in northern Indiana' so it does not repeat 'started'. publish-test check rewritten to assert her text and no REPLACE THIS; the same check passed on a local build of 375 pages, which check_site.py passed with 0 errors", item: "About page with Amber's two paragraphs (founded 2013)"}
  - {id: t4-terms, status: built, branch: amber-answers-site-content, migration: 0058, evidence: "migrations/0058_amber_listing_terms_draft.sql and schema.sql make her terms the draft, PC spelled out as Puppy Connection and her photo standard kept, guarded on the REPLACE THIS placeholder with one audit row. Renderer draws headings and lists in legal.js, portal.js and admin.js. legal-staging-test part 1b proves the migration on node:sqlite (idempotent, publishes nothing, leaves an edited draft alone) and the three renderers. Not published", item: "Amber's listing terms saved as the terms draft for Amber or Alex to publish from the admin Terms screen, with the renderer handling her headings and bullets"}
  - {id: t5-notices, status: built, branch: amber-answers-site-content, evidence: "NOTICE_TO in both wrangler.hosted.jsonc; noticeTo in lib/mail.js used by the sign-up notice (portal/worker.js) and listing reports (lib/reports.js); alertOps unchanged. alerts-test notices part and launch-features-test notices part against a second local portal with NOTICE_TO pass. Open until the portal and admin are deployed", item: "New breeder sign-ups and listing reports go to info@puppy-connection.com, replies to info@ (already set)"}
  - {id: t6-managed, status: open, item: "Mark the 17 breeders Amber manages as the existing arrangement (A24), matched by name"}
  - {id: t7-listings, status: open, item: "The 20 unassigned listings: archive Brady, Brian, Lanie, Jelly, Peanut Butter and Remy; Amy, Jo, Lawrence, Meg, Kibbles, Berlioz, Toulouse, Artemis, Daphne, Persephone to Daniel Ramsey; Carmen to Melva Burkholder (TM Countryside K9); Barnaby, MacGyver, Macintosh to Mervin Fry"}
  - {id: t8-checklist, status: open, item: "Tick what Amber answered on the admin checklist and update the workplan"}
waiting:
  - "Mailing list postal address: Amber and Luke may set up a PO box; list emails cannot send until one is set"
  - "The RDB breeders move to managing their own accounts after October 30"
excluded:
  - "Seller statement and acknowledgment box build (A6): not in Amber's answers, left for a later session"
---

# Notes

Progress is recorded in the header as each task lands.
