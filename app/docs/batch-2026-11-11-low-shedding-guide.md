---
batch: 2026-11-11-low-shedding-guide
approved_by: Alex, 2026-11-11
target: www.puppy-connection.com, new page guide-low-shedding-puppies.html, and the 301 from /hypoallergenic-puppies-for-sale
branch: claude/brave-turing-cc05e9
data: portal export generation 1011, fetched 2026-11-11
tasks:
  - {id: t1, status: done, item: "Read _claude-state.md and the guide generator (build/guides.mjs, generate.mjs guide pages and guides.html)"}
  - {id: t2, status: done, item: "Verify every fact at its primary source and keep the ledger below"}
  - {id: t3, status: done, item: "Layout proposal to Alex and his choice", evidence: "Alex chose option A (a row per breed, up to 4 cards, 3 at 1024, 2 on a phone, a line and breed link when none are listed), the text band like the other guides, and Cavapoo included, 2026-11-11"}
  - {id: t4, status: done, item: "Build the cross-breed guide page in the generator, add it to guides.html and the sitemap", evidence: "guide-low-shedding-puppies.html built from app/content/topics/low-shedding-puppies.md by loadTopics() in build/guides.mjs, listed on guides.html under Across breeds and in sitemap.xml"}
  - {id: t5, status: done, item: "Repoint /hypoallergenic-puppies-for-sale in build/legacy-pages.tsv", evidence: "the built _redirects carries /hypoallergenic-puppies-for-sale /guide-low-shedding-puppies.html 301"}
  - {id: t6, status: done, item: "Local build from live data, dev/link-check.mjs, check_site.py", evidence: "generation 1011, 392 pages. link-check found 4 broken links, all media/doc links on two Standard Poodle puppy pages that the site Worker serves, so not from this change. check_site.py on the build 0 errors, 393 honeypot warnings. On the repo root it reports puppies.html linking guides.html, which was there before this change"}
  - {id: t7, status: done, item: "Browser check at 1440, 1024 and 390 px, one screenshot to Alex", evidence: "1440 has 14 rows with up to 4 cards and every photo loaded. 1024 shows 3 per row. 390 shows 2 per row at 4:5 with the focus crop. No sideways scroll at any width, and a group link lands below the sticky header. Phone screenshot sent"}
  - {id: t8, status: done, item: "PR merged from main, sync-site-repo, push puppyconnection-site, live check incl. one 301", evidence: "PR 174 merged as ee1f5e3, synced from a clean origin/main checkout, puppyconnection-site 3011dfb pushed. Live 2026-11-11: the guide answers 200 with 14 breed rows and style.css?v=94, it is in sitemap.xml and on guides.html, and /hypoallergenic-puppies-for-sale answers one 301 to /guide-low-shedding-puppies.html"}
excluded:
  - "The puppy page's Coat: Hypoallergenic row for breeder-tagged listings stays as it is; raised with Alex, not changed here"
---

# Low-shedding guide batch

## Live counts, generation 1011 (2026-11-11)

Puppies on the site (available, pending, adopted still shown), from `data/puppies.json` through `loadData()`:

| Breed | Available | Pending | Adopted shown |
|---|---|---|---|
| Toy Poodle | 3 | 0 | 1 |
| Miniature Poodle | 13 | 1 | 5 |
| Standard Poodle | 2 | 0 | 0 |
| Shih Tzu | 3 | 0 | 4 |
| Havanese | 8 | 0 | 12 |
| Maltese | 2 | 0 | 0 |
| Yorkshire Terrier | 5 | 0 | 1 |
| Miniature Schnauzer | 13 | 0 | 3 |
| Shih-poo | 2 | 1 | 0 |
| Teddy Bear (Shichon) | 2 | 0 | 2 |
| Cavapoo | 11 | 0 | 5 |
| Mini Bernedoodle | 4 | 0 | 3 |
| Munchkin Bernedoodle | 4 | 0 | 5 |
| F1b Mini Goldendoodle | 0 | 0 | 0 |

All 20 Havanese shown carry the breeder's hypoallergenic tag. The page does not repeat the tag.

## Source ledger

Verified 2026-11-11 at the primary source. AKC scores read from the trait JSON on each breed page.

| Claim on the page | Source | Verdict |
|---|---|---|
| No dog is hypoallergenic, all dogs make allergens | ACAAI, acaai.org/allergies/allergic-conditions/pet-allergies/ | Supported |
| The proteins come from saliva, dander and urine, fur carries them, and coat length does not change it | ACAAI Ask the Allergist, acaai.org/resources/connect/ask-allergist/hypoallergenic-dogs | Supported. ACAAI's main page also says allergens are "found in dog hair", so the page does not say "rather than hair" |
| 2012 study: "hypoallergenic" breeds carried as much coat allergen or more, and homes had no less in the air | Vredegoor et al., J Allergy Clin Immunol 2012;130(4):904-909, PMID 22728082 | Supported. The draft's "no difference in homes" was overstated, because floor dust was lower in Labradoodle homes |
| AKC shedding scale runs 1 "No Shedding" to 5 "Hair Everywhere", grooming 1 "Monthly" to 5 "Daily" | AKC breed pages | Supported |
| Shedding/grooming: Toy, Miniature and Standard Poodle 1/4, Shih Tzu 1/4, Maltese 1/4, Yorkshire Terrier 1/5, Bichon Frise 1/5, Havanese 2/3, Miniature Schnauzer 3/4, Cavalier 2/2, Pomeranian 2/3, Dachshund 2/2, Boston Terrier 2/2, Bernese 5/3, Golden 4/2 | akc.org/dog-breeds/<breed>/ | Supported. Dachshund is one AKC page, so the page says Dachshund, not Miniature Dachshund |
| AKC's hypoallergenic list includes the three Poodles, Maltese, Yorkshire Terrier, Miniature Schnauzer and Bichon Frise, not Shih Tzu or Havanese, and says no dog is 100% hypoallergenic | akc.org/dog-breeds/hypoallergenic-dogs/ | Supported |
| Furnishings study: about 1,500 dogs of 124 breeds, minimal-shedding breeds carry the furnishings (RSPO2) variant | Hayward et al., Nature Communications 2016, PMID 26795439 | Supported at breed level. The draft's "thousands of dogs ... shed less" was overstated |
| "Improper coat" | Parker et al., J Heredity 2010, PMID 20562213, in Portuguese Water Dogs | The page says "what breeders call an improper coat" |
