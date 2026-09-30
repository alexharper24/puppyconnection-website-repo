---
name: puppyconnection-website-repo
description: Project state for Puppy Connection, read first every session
kind: other                 # listing directory, not a breeder. See pc-strategy-row
updated: 2026-09-30
gate: G1                    # concept is built and in review, but discovery was skipped and every later gate depends on it
review_url: "https://alexharper24.github.io/puppyconnection-website-repo/"
live_url: "https://www.puppy-connection.com/"
open:
  # G1 Discovery
  - {id: g1-inputs, gate: G1, blocked_on: alex, item: "Business name, owner, services, phone, email, service area, logo and photos gathered. Anything missing becomes a visible REPLACE THIS placeholder"}
  - {id: g1-old-site, gate: G1, blocked_on: claude, item: "Every legacy Wix URL inventoried for the 301 map, any Search Console export, and every hot-linked image recorded. The 2026-08-30 harvest captured listings and images but not a URL inventory"}
  - {id: g1-context, gate: G1, blocked_on: claude, item: "Client context block written in this file, the conversion that counts (a breeder paying to list, and a buyer clicking through to a breeder), and national or regional reach, each fact marked confirmed or published"}
  - {id: g1-data, gate: G1, blocked_on: alex, item: "Keyword source recorded (Semrush trial via Chrome, pulls cached in hs-seo-data). Search Console for the live domain still to record, and the trial ends within days"}
  - {id: g1-sales-by-entity, gate: G1, blocked_on: client, item: "Which breeds list and place fastest through Puppy Connection, recorded with the date. The order of work stays provisional until this is in"}
  - {id: g1-competitors, gate: G1, blocked_on: claude, item: "Competitor set confirmed on four results pages 2026-09-28 as the national marketplaces (AKC Marketplace, Adopt a Pet, Good Dog, puppies.com, Lancaster Puppies, PuppySpot). puppiesofindiana.com, fourth for puppies for sale in indiana, turned out to be a single poodle breeder ranking from its home page title (hs-seo-data competitors file). The marketplaces themselves are not yet profiled"}
  - {id: g1-design, gate: G1, blocked_on: claude, item: "Character statement written to the README and layout archetype chosen, after checking the built-sites ledger"}
  # G2 Build
  - {id: g2-pages, gate: G2, blocked_on: claude, item: "One real static page per breed, per breeder and per puppy. Today all three are single templates filled from a query string by JavaScript, so none is a rankable URL. See pc-static-pages"}
  - {id: g2-onpage, gate: G2, blocked_on: claude, item: "Headings fixed 2026-09-28, one H1 per page and no skips per audit.py. Titles are still over 60 characters on some pages and descriptions are not yet checked against 155"}
  - {id: g2-schema, gate: G2, blocked_on: claude, item: "Organization and WebSite on the homepage and BreadcrumbList on the four static index pages, all parseable (2026-09-28). ItemList on breed pages waits for the static breed pages"}
  - {id: g2-images, gate: G2, blocked_on: claude, item: "Brand images now WebP with srcset (2026-09-28). The 1,675 Wix listing photo references still need localizing before the Wix plan is canceled"}
  - {id: g2-forms, gate: G2, blocked_on: alex, item: "Every form wired to a real endpoint, or its placeholder tracked in the README"}
  - {id: g2-house, gate: G2, blocked_on: alex, item: "Light-mode lock, ?v= cache-busting, sitemap.xml and robots.txt in place (2026-09-28). No favicon set and no 404 page yet, and the favicon mark is a brand choice for Alex"}
  # G3 Review
  - {id: g3-previews, gate: G3, blocked_on: claude, item: "Single-file OnePage preview and anything under concepts/ out of the repo or noindex"}
  - {id: g3-redirects, gate: G3, blocked_on: claude, item: "Every legacy Wix URL redirected and tested"}
  - {id: g3-client-review, gate: G3, blocked_on: client, item: "Client has reviewed the site and every open copy question is answered"}
  # G4 Launch (site-launch skill)
  - {id: g4-noindex-off, gate: G4, blocked_on: claude, item: "noindex removed from every page and robots.txt open"}
  - {id: g4-dns-https, gate: G4, blocked_on: alex, item: "Apex and www both load over HTTPS without a certificate error, one redirecting to the other"}
  - {id: g4-search-consoles, gate: G4, blocked_on: alex, item: "Google Search Console and Bing Webmaster Tools verified with the sitemap submitted"}
  - {id: g4-legacy-check, gate: G4, blocked_on: claude, item: "A sample of legacy URLs fetched after cutover and each lands on the right page"}
  - {id: g4-analytics, gate: G4, blocked_on: alex, item: "Cookieless visit count running, plus outbound clicks to breeder sites, so the owner can show a breeder what a listing produced"}
  # G5 Grow
  - {id: g5-gbp, gate: G5, blocked_on: alex, item: "Google Business Profile complete if the business keeps one, its website field pointing at the site, and linked in sameAs"}
  - {id: g5-reviews, gate: G5, blocked_on: client, item: "Review requests part of the client's routine and every review answered"}
  - {id: g5-monthly, gate: G5, blocked_on: alex, item: "Monthly Search Console check running, and one content cluster in progress"}
  # Directory-specific, found 2026-09-28
  - {id: pc-static-pages, gate: G2, blocked_on: alex, item: "Stack chosen 2026-09-28, so the generator shape is settled as the Teapup one. Breed, breeder and puppy pages become real files when the build goes ahead, with the page map drafted in hs-seo-data (see pc-guides)"}
  - {id: pc-strategy-row, gate: G1, blocked_on: claude, item: "Directory row written into seo-lifecycle.md 2026-09-28 from the four results pages. Keyword-method still needs a directory column for its template table"}
  - {id: pc-guides, gate: G2, blocked_on: alex, item: "Guide drafts written 2026-09-28 for all 25 breeds plus a Bernedoodle sizes guide and a low-shedding guide, with the page map, the source ledger and a review list, all in hs-seo-data/puppyconnection/2026-09-28/content. Nothing published. Alex reviews first, then three questions go to Amber (review.md r1 to r3)"}
  - {id: pc-sim, gate: G2, blocked_on: alex, item: "Local simulation of the breeder portal and operator screens built 2026-09-30 in app/, with email, Stripe and publishing stubbed behind the interfaces the real services use. Review it by walking the journey in app/README.md, then decide whether to push it"}
closed:
  - {id: pc-architecture, closed: 2026-09-28, evidence: "Alex chose the Teapup stack on 2026-09-28 (Worker, D1, R2, static Python generator). Breeders sign up themselves with a one-time emailed link, pending breeders can finish their profile but not list, and Cloudflare Access stays on the operator screens. Build spec rewritten around it in the private proposals repo, keeping every acceptance test from the external review"}
  - {id: g2-checks, closed: 2026-09-28, evidence: "commit 5b2d27b, check_site.py 0 errors and 1 deliberate warning (hero breed picker never submits), audit.py clean"}
  - {id: g1-money-searches, closed: 2026-09-28, evidence: "Keyword method run in full with a directory config, 623 of 623 template searches returned and 0 missing, competition measured on puppies.com for all 25 breeds, four results pages read. hs-seo-data/puppyconnection/2026-09-28/keyword-plan.md"}
  - {id: g3-noindex, closed: 2026-09-28, evidence: "site-audit run 2026-09-28, 8 of 8 pages carry noindex and robots.txt disallows all"}
decisions:
  - {date: 2026-09-30, decision: "Hosted test deployment on Alex's Cloudflare account: puppyconnection-portal, -admin and -site on alexharper.workers.dev, a new D1 and R2 of their own, all behind one test password (TEST_GATE). See app/README.md"}
  - {date: 2026-09-30, decision: "The portal and operator screens are built first as a local simulation in app/, so sign-up, approval, listing and a simulated payment run end to end before any account, Stripe or paid plan exists"}
  - {date: 2026-09-30, decision: "Implementation spec written in the private proposals repo covering sign-up, approval, Stripe checkout and fulfillment, publishing, jobs and tests. Fulfillment is keyed on the Checkout Session, card is the only payment method, sign-in links are redeemed by POST so mail scanners cannot spend them, and photo metadata is stripped at upload because published photos land in this public repo"}
  - {date: 2026-09-28, decision: "Build on the Teapup stack. Breeders sign in with a one-time emailed link and no password, pending breeders can sign in to finish their profile but cannot list, pay or appear publicly until Amber approves them"}
  - {date: 2026-09-28, decision: "Each breed guide lives on its breed page under the listings, answering the price, full grown size and shedding searches there, instead of on separate guide pages, because 25 breeds would otherwise spread 75 thin pages across one directory"}
  - {date: 2026-09-28, decision: "Guide text is repo content and every listing figure in it (price range, deposit, parent weights, what is included) is a token the generator fills from the database, so no owner or breeder fact is typed into copy"}
  - {date: 2026-09-28, decision: "Concept brought in line with the live puppy sites on accessibility, images, schema, social tags and phone layout. Static generation of breed, breeder and puppy pages deliberately left for the stack decision"}
  - {date: 2026-09-28, decision: "Project enters at G1 even though a concept exists, because the money pages were never chosen from keyword evidence and every later gate depends on that choice"}
---

# Puppy Connection

**Objective.** A breed-search listing directory where breeders pay per puppy to list and buyers click through to the breeder. Done means the directory ranks on breed buying searches and a breeder can see what a listing produced.

**Status.** The concept has been live for review since 2026-08-30. Keyword discovery ran on 2026-09-28 and the concept now matches the live puppy sites on the house standards, but its breed, breeder and puppy pages are still query-string templates that cannot rank.

## Open questions

- Whether the guide drafts read right, and the three questions for Amber in their review list. Blocked on Alex.
- Which breeds actually list and place fastest. Blocked on the client, and deliberately not asked yet.

## Next

Alex reviews the guide drafts and the page map. The static breed pages come with the build itself, starting with Havanese and Great Dane, where opportunity and inventory overlap.

## Where things landed

- Review copy, https://alexharper24.github.io/puppyconnection-website-repo/
- Harvest scripts and cached listing data, `_harvest/`
- Keyword data shared with Teapup and Sweet Puppy Paws, `C:\Git_Repos\hs-seo-data\`
- Breed guide drafts, page map, source ledger and review list, `hs-seo-data\puppyconnection\2026-09-28\content\`
