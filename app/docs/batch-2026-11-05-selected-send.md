---
batch: 2026-11-05-selected-send
asked_by: "Alex 2026-11-05: build a send to selected people option and add it to production. Address is PO Box 55 Milford, IN 46542"
read_first: [app/lib/campaigns.js, app/migrations/0092_campaign_picks.sql]
tasks:
  - id: s1-address
    status: done
    closed: 2026-11-05
    evidence: "0092 on production after production-2026-11-05-pre0092.sql (Downloaded) and rehearse PASS (settings +1, audit +1, second run 0). Read back: mailing_address PO Box 55, Milford, IN 46542, one audit row"
    item: "Set the mailing address shown at the foot of every list email to PO Box 55, Milford, IN 46542 (Amber via Alex), which a send needs before it can start"
  - id: s2-selected
    status: done
    closed: 2026-11-05
    evidence: "admin-features: ticking three people with one unsubscribed counts two, the draft lists its picks, a wrong count is refused, unticking works, the send starts for the ticked person only, the campaign records selected, a sent email refuses ticks. Delivery: the selected campaign from the first local run went out to the ticked person only (dev_mailbox). The test's 10-second wait for delivery fails locally the same way as the existing send checks on main"
    item: "A send to selected people: tick people on the Mailing list page for the draft, then send to only them. Never reaches anyone who unsubscribed"
  - id: s3-ship
    status: done
    closed: 2026-11-05
    evidence: "PR 148 (d83be2f) from main: portal 2b02f79f, admin cbd3c297 with wrangler.production.jsonc"
    item: "Migration 0092 with backup and two rehearsals, local tests, merge, deploy portal and admin from main, read back"
  - id: s4-transport-link
    status: done
    closed: 2026-11-05
    evidence: "site repo a77664b; live transportation.html See delivery rates opens the 1600 px map, 200 image/jpeg 267,785 bytes"
    asked: "Amber via Alex 2026-11-05: the transportation page link goes to Furry Freight's rate map instead of the booking section"
    item: "Furry Freight has no page or anchor for the map, so the button opens the map image itself (Wix resized copy, 268 KB) as See delivery rates. The puppy page delivery band still says Get a quote to the booking page"
---

# Send to selected people, 2026-11-05

The draft keeps its ticked people in campaign_picks, saved as each box is ticked, so a reload keeps them. The send
button and its confirmation count only ticked people who are on the list or never subscribed, and the send is refused
if that count changed after the operator saw it, as for the other two audiences. The portal's 15-minute job sends a
selected campaign the same way, so the portal is deployed with the admin.
