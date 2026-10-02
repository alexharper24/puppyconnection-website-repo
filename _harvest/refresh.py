# Re-harvest the live Wix catalog into data/listings.json, in the shape the rest of the
# pipeline reads. Run from the repo root:  python _harvest/refresh.py
# Reads only public product pages (their schema.org Product block), the same source as the
# first harvest in August 2026. Only a run with no failures replaces data/listings.json, and
# the previous file is kept as data/listings.prev.json.
import json, io, os, re, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.dirname(__file__))
from harvest import parse

UA = {'User-Agent': 'Mozilla/5.0'}
SITE = 'https://www.puppy-connection.com'
RAW = '_harvest/raw'


def get(url):
    # Wix answers 429 when pages are fetched in parallel, so this goes one at a time and
    # backs off when told to.
    for wait in (0, 5, 15, 45, 90):
        time.sleep(wait or 0.6)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise RuntimeError('still rate limited')


def split_name(name):
    # "Brady - Bernese Mountain Dog", also "Leroy- Cavalier" and "Juliet-French Bulldog"
    m = re.match(r'\s*(.+?)\s*-\s*(.+?)\s*$', name or '')
    return (m.group(1), m.group(2)) if m else (name, None)


def one(slug):
    path = os.path.join(RAW, slug + '.html')
    try:
        open(path, 'wb').write(get(f'{SITE}/product-page/{slug}'))
        rec = parse(path, slug)
    except Exception as e:
        return slug, None, str(e)
    finally:
        if os.path.exists(path):
            os.remove(path)
    if not rec:
        return slug, None, 'no Product block'
    return slug, tidy(rec), None


def tidy(rec):
    # The live store marks a placed puppy by renaming it "*ADOPTED*Blossom - Boston Terrier".
    name = rec.get('name') or ''
    rec['placed'] = bool(re.search(r'\*\s*adopted\s*\*', name, re.I))
    rec['name'] = re.sub(r'\*\s*adopted\s*\*\s*', '', name, flags=re.I).strip()
    rec['puppy_name'], rec['breed'] = split_name(rec['name'])
    # Since September 2026 the Wix checkout price carries about 3.5% on top of the price the
    # breeder states ("Price - $1500" shows as 1552.5), likely a card fee. The directory shows
    # the stated price and keeps the store's figure beside it.
    stated = re.search(r'Price\s*-\s*\$\s?([\d,]+)', rec.get('description') or '')
    if stated:
        rec['store_price'] = rec.get('price')
        rec['price'] = int(stated.group(1).replace(',', ''))
    elif rec.get('price') is not None and float(rec['price']).is_integer():
        rec['price'] = int(rec['price'])
    return rec


def main():
    os.makedirs(RAW, exist_ok=True)
    xml = get(f'{SITE}/store-products-sitemap.xml').decode('utf-8')
    slugs = sorted(set(re.findall(r'/product-page/([^<]+)</loc>', xml)))
    with ThreadPoolExecutor(1) as ex:
        results = list(ex.map(one, slugs))
    recs = [r for _, r, _ in results if r]
    fails = [(s, e) for s, r, e in results if not r]
    # Only a complete harvest replaces the live file, so a failed run can never shrink it.
    io.open('_harvest/data/listings.new.json', 'w', encoding='utf-8').write(json.dumps(recs, ensure_ascii=False, indent=1))
    if not fails:
        if os.path.exists('_harvest/data/listings.json'):
            os.replace('_harvest/data/listings.json', '_harvest/data/listings.prev.json')
        os.replace('_harvest/data/listings.new.json', '_harvest/data/listings.json')
    print(f'{len(slugs)} in the sitemap, {len(recs)} harvested, {sum(1 for r in recs if r.get("in_stock"))} in stock, {len(fails)} failed')
    for s, e in fails[:20]:
        print('  failed', s, e)


def retidy(path):
    # Re-apply tidy() to a finished harvest without fetching again.
    recs = json.load(open(path, encoding='utf-8'))
    for r in recs:
        if r.get('store_price') is not None:
            r['price'] = r.pop('store_price')
        tidy(r)
    io.open(path, 'w', encoding='utf-8').write(json.dumps(recs, ensure_ascii=False, indent=1))
    print(f'retidied {len(recs)}: {sum(1 for r in recs if r.get("store_price") is not None)} stated prices, {sum(1 for r in recs if r["placed"])} placed')


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--retidy':
        retidy(sys.argv[2])
    else:
        main()
