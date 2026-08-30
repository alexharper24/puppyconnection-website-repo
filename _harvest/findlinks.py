# Finds the breeder's own page for each puppy, so a listing can link to the
# actual puppy rather than the breeder's homepage.
# Writes _harvest/data/breederlinks.json as {listing_slug: url}.
import json, io, re, urllib.request, concurrent.futures as cf

UA = {'User-Agent': 'Mozilla/5.0'}
L = json.load(open('_harvest/data/listings.json', encoding='utf-8'))

SITEMAPS = {
    'chainolakescompanions.com': ['product-sitemap.xml', 'page-sitemap.xml'],
    'responsibledogbreeder.com': ['post-sitemap1.xml', 'post-sitemap2.xml',
                                  'page-sitemap.xml', 'breeder-sitemap.xml'],
    'peacefulpawspuppies.com': ['sitemap.xml', 'wp-sitemap.xml',
                                'post-sitemap.xml', 'page-sitemap.xml',
                                'product-sitemap.xml'],
    'kingdomfamilycompanions.com': ['sitemap.xml'],
}


def fetch(u):
    try:
        return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25).read().decode('utf-8', 'replace')
    except Exception:
        return ''


def urls_for(domain):
    """Collect page URLs, following one level of sitemap index."""
    found, seen = [], set()
    # some hosts only answer on the www. host
    hosts = [domain, 'www.' + domain] if not domain.startswith('www.') else [domain]
    queue = ['https://%s/%s' % (h, s) for h in hosts for s in SITEMAPS.get(domain, ['sitemap.xml'])]
    depth = 0
    while queue and depth < 3:
        nxt = []
        for q in queue:
            if q in seen:
                continue
            seen.add(q)
            body = fetch(q)
            # some sitemaps wrap the URL in CDATA, which breaks a naive [^<]+
            locs = re.findall(r'<loc>\s*(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?\s*</loc>', body, re.S)
            for u in locs:
                if u.endswith('.xml'):
                    nxt.append(u)
                else:
                    found.append(u)
        queue = nxt
        depth += 1
    return found


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', (s or '').lower()).strip('-')


print('collecting breeder page URLs...')
pages = {}
domains = sorted({r['breeder_domain'] for r in L if r.get('breeder_domain')})
with cf.ThreadPoolExecutor(4) as ex:
    for d, u in zip(domains, ex.map(urls_for, domains)):
        pages[d] = u
        print('  %-32s %4d pages' % (d, len(u)))

out = {}
tiers = {}

def breed_slugs(name):
    """Candidate url slugs a breeder might use for a breed page."""
    n = (name or '').lower()
    base = slugify(n)
    cands = {base, base + 's', base.replace('miniature-', 'mini-'),
             base.replace('mini-', 'miniature-')}
    cands |= {c + 's' for c in list(cands)}
    return {c for c in cands if len(c) > 3}

for r in L:
    d = r.get('breeder_domain')
    if not d or not pages.get(d):
        continue
    want = slugify(r.get('puppy_name'))
    tail_of = lambda u: ([p for p in u.rstrip('/').split('/') if p] or [''])[-1]

    # tier 1: the puppy's own page
    hits = [u for u in pages[d]
            if want and len(want) > 2
            and (tail_of(u) == want or re.fullmatch(re.escape(want) + r'-\d+', tail_of(u)))]
    if hits:
        prod = [h for h in hits if '/product/' in h]
        out[r['slug']] = (prod or sorted(hits, key=len))[0]
        tiers[r['slug']] = 'puppy'
        continue

    # tier 2: the breeder's page for that breed
    bs = breed_slugs(r.get('breed'))
    hits = [u for u in pages[d] if tail_of(u) in bs and '/product/' not in u]
    if hits:
        out[r['slug']] = sorted(hits, key=len)[0]
        tiers[r['slug']] = 'breed'
        continue

    # tier 3: a general "available puppies" page
    hits = [u for u in pages[d]
            if re.search(r'available|puppies-for-sale|our-puppies|adopt', tail_of(u))
            and '/product/' not in u]
    if hits:
        out[r['slug']] = sorted(hits, key=len)[0]
        tiers[r['slug']] = 'available'

# keep the tier: the link label must not imply a puppy page when it is not one
io.open('_harvest/data/breederlinks.json', 'w', encoding='utf-8').write(
    json.dumps({k: {'url': v, 'tier': tiers[k]} for k, v in out.items()},
               ensure_ascii=False, indent=1))

import collections
print()
print('matched %d of %d listings' % (len(out), len(L)))
print()
print('  %-32s %-8s %s' % ('breeder', 'listings', 'link quality'))
for d in sorted({r['breeder_domain'] for r in L if r.get('breeder_domain')}):
    total = sum(1 for r in L if r.get('breeder_domain') == d)
    c = collections.Counter(tiers[r['slug']] for r in L
                            if r.get('breeder_domain') == d and r['slug'] in tiers)
    detail = ', '.join('%d %s' % (v, k) for k, v in c.most_common()) or 'homepage only'
    print('  %-32s %-8d %s' % (d, total, detail))
