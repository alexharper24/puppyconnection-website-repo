"""Compare each live Wix puppy's photos with the photos Puppy Connection holds for it (Alex, 2026-11-01).

Reads the Wix store sitemap and product pages from lablakeslee.wixsite.com/puppyconnection one at a time,
and the production backup for our side. A Wix photo is matched by its media id (8d80ac_...~mv2), which our
photos keep in external_url. Writes result.json beside this script.

  python check.py <backup.sql>
"""
import json, os, re, sqlite3, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://lablakeslee.wixsite.com/puppyconnection'
UA = {'User-Agent': 'Mozilla/5.0'}
MEDIA = re.compile(r'media/([0-9a-f]{6}_[0-9a-f]{32}~mv2(?:_d_\d+_\d+_s_\d+)?\.\w+)', re.I)


def get(url):
    cache = os.path.join(HERE, 'raw', re.sub(r'[^\w.-]', '_', url.rsplit('/', 1)[1]) + '.html')
    if os.path.exists(cache):
        return open(cache, encoding='utf-8').read()
    for wait in (0, 5, 15, 45, 90):
        time.sleep(wait or 0.7)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                body = r.read().decode('utf-8', 'replace')
                open(cache, 'w', encoding='utf-8').write(body)
                return body
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code != 429 and e.code < 500:
                raise
        except (urllib.error.URLError, TimeoutError):
            pass
    return None  # still failing after five tries; reported as unreadable


def media_id(url):
    m = MEDIA.search(url or '')
    return m.group(1).split('.')[0].lower() if m else None


def wix_images(html):
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            d = json.loads(m.group(1))
        except ValueError:
            continue
        if isinstance(d, dict) and d.get('@type') == 'Product':
            im = d.get('image') or []
            im = im if isinstance(im, list) else [im]
            return [media_id(x.get('contentUrl') if isinstance(x, dict) else x) for x in im], d.get('name')
    return None, None


def main():
    db = sqlite3.connect(':memory:')
    db.executescript(open(sys.argv[1], encoding='utf-8').read())
    ours = {}
    for pid, slug, legacy, name, breeder, state, avail in db.execute(
            'SELECT id, slug, legacy_slug, name, breeder_id, publication_state, availability FROM puppies'):
        photos = [r for r in db.execute('SELECT external_url, r2_key FROM photos WHERE puppy_id = ? ORDER BY position', (pid,))]
        rec = {'id': pid, 'slug': slug, 'name': name, 'breeder': breeder, 'state': state, 'availability': avail,
               'media': [media_id(u) for u, _ in photos if u], 'portal_only': sum(1 for u, _ in photos if not u)}
        for k in {slug, legacy} - {None}:
            ours[k.lower()] = rec
    sm = get(SITE + '/store-products-sitemap.xml') or ''
    slugs = sorted({u.rsplit('/', 1)[1].lower() for u in re.findall(r'<loc>([^<]*/product-page/[^<]+)</loc>', sm)})
    out = []
    for i, slug in enumerate(slugs):
        html = get(f'{SITE}/product-page/{slug}')
        wix, title = wix_images(html) if html else (None, None)
        rec = ours.get(slug)
        row = {'wix_slug': slug, 'wix_name': title, 'wix_photos': len(wix or []), 'ours': rec and {k: rec[k] for k in ('id', 'slug', 'name', 'breeder', 'state', 'availability', 'portal_only')}}
        if wix is None:
            row['status'] = 'wix page unreadable'
        elif not rec:
            row['status'] = 'not on Puppy Connection'
        else:
            have = set(rec['media'])
            missing = [m for m in wix if m and m not in have]
            row['missing'] = missing
            row['ours_photos'] = len(rec['media']) + rec['portal_only']
            row['status'] = 'missing photos' if missing else 'up to date'
        out.append(row)
        if i % 25 == 0:
            print(i, len(slugs), flush=True)
    json.dump({'checked': len(slugs), 'rows': out}, open(os.path.join(HERE, 'result.json'), 'w', encoding='utf-8'), indent=1)
    from collections import Counter
    print(Counter(r['status'] for r in out))


main()
