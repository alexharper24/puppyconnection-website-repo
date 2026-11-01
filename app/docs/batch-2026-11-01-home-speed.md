---
batch: 2026-11-01-home-speed
asked_by: Alex, 2026-11-01 ("yes, approve all five, go ahead"), after a PageSpeed mobile run of 72 on https://puppy-connection.com/
branch: perf/home-speed (worktree C:/Git_Repos/pc-perf), merged to main before any deploy
baseline_measured: "Lighthouse 12 local, mobile: www 98 (LCP 2.2 s, CLS 0.037); apex 81 and 86 (LCP 3.7 and 3.6 s, redirect about 830 ms). PageSpeed itself read 72, LCP 6.2 s, CLS 0.127"
tasks:
  - {id: p1-one-redirect, status: done, evidence: "Bare domain rule now matches http.host for both schemes; curl http://puppy-connection.com/ 301 straight to https://www",  item: "http://puppy-connection.com goes http to https to www (two hops) since Always Use HTTPS. Make the apex rule send http and https apex straight to https://www in one 301"}
  - {id: p2-fonts, status: built, item: "Serve Barlow, Barlow Condensed and Playfair Display (latin, woff2) from fonts/ with @font-face in style.css, preload the two used above the fold, and drop the Google Fonts links from every page"}
  - {id: p3-layout-shift, status: built, item: "The home puppy and breed grids arrive empty and are filled by main.js, and the Show more button appears after, so content shifts. Put placeholder cards of the same shape in the HTML and keep the reveal row's height reserved"}
  - {id: p4-images, status: built, item: "Phone-sized copies: 400 px breed and Amber photos with srcset, and stop home cards below the hero loading at high priority. Puppy card copies in R2 are 640 px; a smaller copy is a separate R2 job, reported to Alex with its size"}
  - {id: p5-analytics, status: built, item: "Load gtag.js after the page has loaded, keeping the events and the internal-traffic flag"}
---

# Home page speed, 2026-11-01

Rerun Lighthouse on www and the apex after deploy and record the figures here.
