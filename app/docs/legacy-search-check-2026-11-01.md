---
check: puppyconnection-legacy-search
run: 2026-11-01
site: https://www.puppy-connection.com (cutover 2026-11-01)
mode: read-only, no repo edits, no deploy
sources:
  ranking_pages: "hs-seo-data/puppyconnection/2026-10-10/keywords/baseline-puppy-connection.com.md (SE Ranking, 42 pages, traffic is an ESTIMATE)"
  search_queries: "hs-seo-data/puppyconnection/2026-10-12-wix-analytics/search-queries-365.txt and queries-aug-dec-2025.txt (Wix's Search Console report, MEASURED clicks)"
  search_pages: "hs-seo-data/puppyconnection/2026-10-12-wix-analytics/google-pages-compare.txt (Wix Search Console pages, MEASURED)"
  wix_urls: "hs-seo-data/puppyconnection/2026-10-10/technical/wix/*.xml (305 sitemap URLs) plus app/build/legacy-pages.tsv and Wix pages-365.txt"
scripts: [legacy_check.py, legacy_analyze.py]
raw: [legacy-results.json, legacy-rows.json, legacy-run.log, live-sitemap.xml]
---

# Did the new site keep what the Wix site was found for?

Mostly yes. Every old Wix sitemap address (305) and every SE Ranking page (42) now answers a 301 in one hop to a
200 page on www, with no chains and no 404s among them. The searches that carried real traffic were the brand name and
generic "puppies for sale" searches landing on the home page and the puppies list, and both of those survive. The losses
are a handful of breed information pages sent to the generic Breeds page, and local town searches the new copy never
mentions.

## What the old site was found for (measured, Wix Search Console, Oct 12, 2025 to Oct 11, 2026)

264,301 impressions and 6,846 clicks on named queries. The top terms by clicks were:

| Search | Clicks | Avg position | Where it lands now |
|---|---|---|---|
| puppy connection (+ indiana, reviews, the, connections) | 2,405 combined | 1 to 6 | Home page, 200, brand in title |
| puppies for sale near me | 875 | 35.1 | Home page and /puppies.html, both indexable |
| puppies for sale | 327 | 26.6 | Same |
| dog breeders near me | 186 | 57.5 | /breeders.html and the four "dog breeders in" state pages |
| dogs for sale | 83 | 45.9 | Home and /puppies.html |
| small puppies / small dogs for sale near me | 49 + 43 | 18 / 45 | Home and /puppies.html; "small" in copy, no small-breed page |
| puppies for sale mishawaka | 43 | 3.1 | **No page mentions Mishawaka** |
| puppies for sale lafayette indiana | 35 | 3.4 | **No page mentions Lafayette** |
| puppies for sale elkhart | 34 | 5.2 | **No page mentions Elkhart** |
| puppies for sale indiana | 28 | 26 | /puppies-for-sale-in-indiana.html (title matches) |

Aug to Dec 2025 alone also shows "tell me about miniature dachshunds" (13 clicks, position 2.7), "hypoallergenic
puppies for sale" (7 clicks, 550 impressions, position 15.7), "pugs for sale near me" (8 clicks) and town searches for
Valparaiso, Richmond and Plymouth, with 25 town and state rows totalling 203 clicks.

In that same window the home page took 2,460 of about 2,661 page clicks (92%), so the breed information pages brought
about 32 clicks on about 23,000 impressions (measured).

## Old ranking pages, where each lands now (measured on the live site 2026-11-01)

SE Ranking traffic is an estimate and runs well off Search Console in both directions (it gives the Miniature Dachshund
page 1.12K a month; Search Console measured 27 clicks for it in Aug to Dec 2025). GSC clicks are measured.

| Old page | SE Ranking est/mo, kw | GSC Aug–Dec 2025 | Lands now | Verdict |
|---|---|---|---|---|
| /miniature-dachshund-breed-inform | 1.12K est, 163 kw | 3,427 imp, 27 clicks | /breed-miniature-dachshund.html | Right page, indexable. Breed facts are four short lines; the old page was a full information article, so "tell me about" searches get thinner content |
| / | 416 est, 1.4K kw | 30,012 imp, 2,460 clicks | / (200) | Kept |
| /pomsky-breed-information | 67 est, 84 kw | 3,805 imp, 4 clicks | /breeds.html | **Weaker.** Pomsky is not mentioned anywhere on the target |
| /puppies-for-sale (and ?page=N) | 19 est, 34 kw | 1,653 imp, 61 clicks | /puppies.html, canonical drops ?page | Kept; title is "Available puppies", not "Puppies for sale" |
| /miniature-pinscher-breed-information | 12 est, 45 kw | 2,926 imp, 0 clicks | /breeds.html | **Weaker.** Named on the hub only |
| /cocker-spaniel-breed-information | 7 est, 45 kw | 2,282 imp, 1 click | /breed-cocker-spaniel.html | Kept |
| /basset-hound-breed-info | 5 est, 19 kw | 1,185 imp, 0 clicks | /breeds.html | **Weaker.** legacy-pages.tsv says breed-basset-hound.html, but no such page is built so the generator fell back to the hub, which never says Basset |
| /cavalier-king-charles-spaniel-breed-info | 4 est, 7 kw | n/a | /breed-cavalier-king-charles-spaniel.html | Kept |
| /about-puppy-connection, /about-us | 3 est | 1,985 imp, 6 clicks | /about.html | Kept |
| /manly-puppies-for-sale | 3 est | n/a | /puppies.html | Generic, acceptable |
| /upcoming-litters, /waiting-list | 2 est | 1,324 imp, 11 clicks | /puppies.html | Generic; "litter" not on target |
| /breed-info | 2 est | 1,523 imp, 1 click | /breeds.html | Kept |
| /breeder-countylinekennel | 2 est | n/a | /breeder-county-line-kennel.html | Kept |
| /reviews | 1 est, 9 kw | 2,437 imp, 53 clicks | /reviews.html | Kept |
| /cava-poo-breed-info | 1 est, 26 kw | 3,944 imp, 0 clicks | /breed-cavapoo.html | Kept |
| /post/the-charm-of-small-breeds-shih-tzu-vs-pomeranian | 1 est | n/a | /breed-shih-tzu.html | Partial; target never says Pomeranian |
| /tips-on-buying-a-puppy | 1 est, 10 kw | 820 imp, 0 clicks | /tips-on-buying-a-puppy.html | Kept |
| /great-dane-breed-inform | 1 est, 27 kw | 829 imp, 0 clicks | /breed-great-dane.html | Kept |
| /the-puppy-connection-process, /our-process | 0 est | 2,049 imp, 7 clicks | /how-it-works.html | Kept |
| /pug-breed-information | 0 est | n/a | /breeds.html | **Weaker**, Pug not on target |
| /miniature-poodle-breed-information | 0 est, 45 kw | 2,481 imp, 0 clicks | /breed-miniature-poodle.html | Kept |
| /miniature-schnauzer-breed-information | n/a | 554 imp, 0 clicks | /breed-miniature-schnauzer.html | Kept |
| /hypoallergenic-puppies-for-sale | 0 est, 11 kw | 1,275 imp, 11 clicks | /breeds.html | **Weaker.** Neither "hypoallergenic" nor "low shedding" is on the target |
| /portuguese-water-dog-breed-information | 0 est | n/a | /breeds.html | Weaker, not on target |
| /transportation | 0 est | 572 imp, 0 clicks | /transportation.html | Kept |
| /contact | 0 est | 1,148 imp, 8 clicks | /contact.html | Kept |
| /breeder-perfectmatchpoodles, /breeder-philip, /breeder-tmcountrysidek9 | 0 est | 463 / 418 imp (2024) | Own breeder pages | Kept |
| /product-page/* (5 ranked) | 0 est | 2024 Victorian Bulldog pages, none in 2025 | Own puppy page or breed page | Kept; adopted puppies are noindex by design |

## Every old address, counted (measured)

- Wix sitemaps, 305 addresses: 1 answers 200 directly (home), 303 answer 301 to a 200 page in one hop, 1 goes to the
  portal privacy page, and 0 return 404.
- Of the 249 puppy addresses, 233 land on the puppy's own page and 16 on its breed page. 36 of the 233 are adopted
  puppies carrying `noindex, follow`, which generate.mjs does on purpose.
- Of the 56 other addresses, about 30 land on a page for the same thing and 26 land on a hub (puppies, breeds, breeders,
  tips or home). The hub group is the 10 blog posts, the five breed pages above, five unnamed breeder pages,
  hypoallergenic, upcoming litters, waiting list and the like.
- All 333 addresses checked (sitemaps plus SE Ranking, GSC and Wix page lists): 0 redirect chains, 0 non-www
  canonicals, no noindex on any non-puppy target.
- 4 addresses return 404: /cart-page, /checkout, /thank-you-page and /search. These are Wix store and search pages with
  no search value, though /search had 2,227 sessions and /cart-page 547 in the last year.
- /privacy-policy redirects to portal.puppy-connection.com/privacy, which answers 404 to a HEAD request and 200 to GET.
  Google uses GET, so this is cosmetic, but link checkers will report it broken.

## Site-wide checks (measured)

- robots.txt is `Allow: /` with `Sitemap: https://www.puppy-connection.com/sitemap.xml`.
- sitemap.xml returns 200 with 344 URLs, all on https://www.
- Every page checked carries an absolute canonical on https://www. `?page=N` addresses canonicalize to /puppies.html.
- https://puppy-connection.com 301s to www and keeps the query string.
- **http:// on both apex and www answers 200 with no redirect to https.** The canonical points at https www, so Google
  will consolidate, but it is a duplicate copy of the whole site and old http links skip the www step.

## Gaps, ranked by what they cost (estimates labeled)

1. **Town searches.** Mishawaka, Lafayette and Elkhart ranked on page one and drew 112 clicks in a year (measured). No
   page on the new site names any of those towns, so these are the most likely clicks to drop (est). Why the Wix site
   ranked for them is not known from the cache; it may have been the Google Business Profile rather than page copy.
2. **Breed pages sent to the hub.** Pomsky (3,805 impressions), Miniature Pinscher (2,926), Basset Hound (1,185),
   Pug and Portuguese Water Dog now land on /breeds.html, which does not mention Pomsky, Pug, Basset or Portuguese Water
   Dog. Their clicks were near zero, so the traffic at risk is small (measured), but the impressions will go.
3. **Hypoallergenic.** 1,275 impressions and 11 clicks (measured) now land on the Breeds hub with no low-shedding
   content. The low-shedding guide was drafted in hs-seo-data 2026-09-28 and is not published.
4. **Miniature Dachshund information intent.** The page is the right one, but it now reads as a sale page with four
   facts. Informational searches like "tell me about miniature dachshunds" (position 2.7) may slip (est).
5. **Blog posts.** All 10 go to hubs. None drew measured clicks, so the cost is near zero.

## Recommended fixes

1. Turn on Always Use HTTPS (or an http-to-https www redirect rule) in the Cloudflare zone.
2. Add the towns the Wix site ranked for to the Indiana page or breeder pages where a breeder is really near them, and
   confirm the Google Business Profile points at https://www.puppy-connection.com/.
3. Publish the low-shedding guide and repoint /hypoallergenic-puppies-for-sale to it (P2 already says to).
4. Either build breed pages for Pomsky, Basset Hound, Miniature Pinscher and Pug, or add a short line for each on
   /breeds.html so the redirected searches find the word. Fix the Basset row so legacy-pages.tsv matches what is built.
5. Add a Miniature Dachshund size and care guide, as the site already has for Pomeranian and others, linked from the
   breed page.
6. Redirect /search and /cart-page to /puppies.html, and have the portal answer HEAD on /privacy.
7. Submit the sitemap in Search Console (if not done), add the old puppy-connection.com property's top pages to a
   watch list, and compare clicks for the brand and "puppies for sale" queries at two and six weeks.
