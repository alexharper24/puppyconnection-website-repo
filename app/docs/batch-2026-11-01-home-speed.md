---
batch: 2026-11-01-home-speed
asked_by: Alex, 2026-11-01 ("yes, approve all five, go ahead"), after a PageSpeed mobile run of 72 on https://puppy-connection.com/
branch: perf/home-speed (worktree C:/Git_Repos/pc-perf), merged to main before any deploy
baseline_measured: "Lighthouse 12 local, mobile: www 98 (LCP 2.2 s, CLS 0.037); apex 81 and 86 (LCP 3.7 and 3.6 s, redirect about 830 ms). PageSpeed itself read 72, LCP 6.2 s, CLS 0.127"
after_measured: "Lighthouse 12 local, mobile, after PRs 118 and 119 went live: www 97, 90, 95 (LCP 2.5, 3.5, 2.7 s; CLS 0.002, 0.001, 0.001; FCP 1.6 s); apex 84 and 78 (LCP 3.9 and 4.1 s). Layout shift fixed. LCP not improved: the six self-hosted fonts (about 175 KB) now share the site's connection with the hero photo in the slow-4G simulation, and run-to-run spread is about 1 s"
open_after: "Puppy card copies in R2 are 640 px and up to 119 KB; a smaller phone copy needs a batch over every photo plus a portal change for new uploads, waiting on Alex"
prs: [118, 119]
tasks:
  - {id: p1-one-redirect, status: done, evidence: "Bare domain rule now matches http.host for both schemes; curl http://puppy-connection.com/ 301 straight to https://www",  item: "http://puppy-connection.com goes http to https to www (two hops) since Always Use HTTPS. Make the apex rule send http and https apex straight to https://www in one 301"}
  - {id: p2-fonts, status: done, item: "Serve Barlow, Barlow Condensed and Playfair Display (latin, woff2) from fonts/ with @font-face in style.css, preload the two used above the fold, and drop the Google Fonts links from every page"}
  - {id: p3-layout-shift, status: done, item: "The home puppy and breed grids arrive empty and are filled by main.js, and the Show more button appears after, so content shifts. Put placeholder cards of the same shape in the HTML and keep the reveal row's height reserved"}
  - {id: p4-images, status: done, item: "Phone-sized copies: 400 px breed and Amber photos with srcset, and stop home cards below the hero loading at high priority. Puppy card copies in R2 are 640 px; a smaller copy is a separate R2 job, reported to Alex with its size"}
  - {id: p5-analytics, status: done, item: "Load gtag.js after the page has loaded, keeping the events and the internal-traffic flag"}
---

# Home page speed, 2026-11-01

Figures after deploy are in the header. Font preloads were tried in #118 and removed in #119, because they queued ahead of the hero photo and raised its load delay from about 150 ms to 900 ms.
