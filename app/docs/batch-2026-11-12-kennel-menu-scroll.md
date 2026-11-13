---
batch: kennel-menu-scroll
date: 2026-11-12
asked_by: Alex, relaying a breeder report
scope: "Breeder portal Switch kennel list (app/portal). The admin shares portal.css but draws no kennel list"
branch: claude/nervous-kapitsa-b61364
local: "portal on 8797 from this worktree, setup.mjs --reset, one address made the main contact of 21 kennels"
widths: [375, 768, 1024, 1280]
cause: "The list hangs from the sticky top bar with no height limit, so with 21 kennels it ran to 1374px on an 800px screen. The page scroll moves the page under the bar and never reaches the foot of the list"
fix: "portal.css: .kennel-menu ul gets max-height calc(100dvh - 5rem), overflow-y auto and overscroll-behavior contain. Admin copy kept identical"
stage: built
tasks:
  - {id: repro, status: done, evidence: "1280x800 before the fix: list bottom 1374px, list not scrollable, page scrolled to its end left the last kennel off screen"}
  - {id: fix, status: done, evidence: "portal.css and admin/public/portal.css identical; portal.css ?v=49 in both index.html files and both worker-drawn pages (worker pages were still on 47)"}
  - {id: desktop, status: done, evidence: "1280x800: list 53px to 773px, mouse wheel scrolled it 1000 of 1047px with the page still at 0; Tab 21 times reached Add a kennel with the list following focus; Escape closed it and returned focus to Switch kennel. 1024x700: list ends at 673px and scrolls to its end"}
  - {id: phone, status: done, evidence: "375 and 768: the drop-down is not drawn below 860px; the phone menu opens and holds Switch kennel, which opens Choose a kennel. That page lists all 21 and scrolls by wheel (to 1000px) and keyboard (Tab to kennel 21, in view). No scroll lock on html or body"}
  - {id: touch, status: partly, note: "No real touch swipe could be sent from the browser pane. The portal has no touch or wheel handlers and no touch-action rules, so the list and the page use the browser's own touch scrolling. Check on a phone or tablet after deploy"}
  - {id: ship, status: open, blocked_on: Alex, item: "Merge the PR, then deploy the portal and admin from main with wrangler.production.jsonc once Alex approves"}
---

# Switch kennel list scrolls

The Switch kennel list sits in the top bar, which stays at the top of the screen as the page scrolls.
With many kennels the list ran past the foot of the screen and the page scroll could not reach it.
The list now stops 5rem short of the foot of the screen and scrolls on its own, and reaching its end
does not scroll the page behind it.

Below 860px the top bar is hidden, so phones and portrait tablets use the Switch kennel link in the
phone menu, which opens the Choose a kennel page. That page already scrolled, and this batch confirmed it.
