# Measures every listing photo still on Wix, so the generated site can choose and crop it well.
#
# For each photo it records the original width and height (read from the JPEG header of a large
# "fit" rendition, which Wix never enlarges) and a focus point, the part of the frame that holds
# the puppy. The focus comes from a small thumbnail: the border of a photo is nearly always
# background, so the pixels least like the border colors are the subject. focus_y leans toward
# the top of the subject, where the face usually is.
#
# Results are cached in _harvest/data/framing.json by photo address, so a rerun and the seed
# reuse them. The script writes an SQL file of UPDATE statements and never writes to a database
# itself. Apply the file with wrangler after a backup (migrations/0005 must already be applied).
#
#   python app/ops/measure_photos.py <photos.json> <out.sql>
#
# photos.json is the output of: wrangler d1 execute <db> --json --command
#   "SELECT id, external_url FROM photos WHERE external_url IS NOT NULL"
import io, json, os, sys, time, urllib.request, concurrent.futures as cf

import numpy as np
from PIL import Image

UA = {'User-Agent': 'Mozilla/5.0'}
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, '_harvest', 'data', 'framing.json')


def get(url, rng=None):
    headers = dict(UA)
    if rng:
        headers['Range'] = rng
    for attempt in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504):
                time.sleep(2 ** attempt)
                continue
            raise
        except Exception:
            time.sleep(2 ** attempt)
    raise RuntimeError(f'gave up on {url}')


def jpeg_size(d):
    i = 2
    while i < len(d) - 9:
        if d[i] != 0xFF:
            i += 1
            continue
        m = d[i + 1]
        if m in (0xC0, 0xC1, 0xC2):
            return int.from_bytes(d[i + 7:i + 9], 'big'), int.from_bytes(d[i + 5:i + 7], 'big')
        i += 2 + int.from_bytes(d[i + 2:i + 4], 'big')
    return None


def focus(img):
    """Return (fx, fy) in 0..1 for the subject of a small RGB image."""
    a = np.asarray(img.convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    b = max(2, int(min(h, w) * 0.06))
    border = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    # A few border colors, by a short k-means, so a wall above and a floor below both count.
    rng = np.random.default_rng(0)
    centers = border[rng.choice(len(border), size=min(6, len(border)), replace=False)]
    for _ in range(8):
        lab = np.argmin(((border[:, None, :] - centers[None]) ** 2).sum(-1), axis=1)
        centers = np.array([border[lab == k].mean(0) if (lab == k).any() else centers[k] for k in range(len(centers))])
    dist = np.sqrt(((a[:, :, None, :] - centers[None, None]) ** 2).sum(-1)).min(-1)
    mask = dist > 45
    share = mask.mean()
    if share < 0.02 or share > 0.85:
        return 0.5, 0.38
    weight = np.where(mask, dist, 0)
    rows, cols = weight.sum(1), weight.sum(0)
    def span(p):
        c = np.cumsum(p) / p.sum()
        return int(np.searchsorted(c, 0.08)), int(np.searchsorted(c, 0.92))
    top, bottom = span(rows)
    left, right = span(cols)
    fy = (top + 0.32 * (bottom - top)) / h
    fx = (left + right) / 2 / w
    return round(float(fx), 3), round(float(fy), 3)


def measure(url):
    head = get(f'{url}/v1/fit/w_6000,h_6000,q_90/i.jpg', 'bytes=0-8191')
    size = jpeg_size(head)
    if not size:
        size = Image.open(io.BytesIO(get(f'{url}/v1/fit/w_6000,h_6000,q_90/i.jpg'))).size
    thumb = Image.open(io.BytesIO(get(f'{url}/v1/fit/w_200,h_200,q_70/i.jpg')))
    fx, fy = focus(thumb)
    w, h = size
    return {'w': w, 'h': h, 'fx': fx, 'fy': fy}


def main():
    rows = json.load(open(sys.argv[1], encoding='utf-8'))
    if isinstance(rows, list) and rows and 'results' in rows[0]:
        rows = rows[0]['results']
    cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
    todo = sorted({r['external_url'] for r in rows if 'wixstatic.com' in (r['external_url'] or '') and r['external_url'] not in cache})
    print(f'{len(rows)} photos, {len(todo)} to measure', flush=True)
    failed = []
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(measure, u): u for u in todo}
        for n, f in enumerate(cf.as_completed(futs), 1):
            u = futs[f]
            try:
                cache[u] = f.result()
            except Exception as e:
                failed.append((u, str(e)))
            if n % 100 == 0:
                print(f'  {n}/{len(todo)}', flush=True)
                json.dump(cache, open(CACHE, 'w', encoding='utf-8'), indent=0)
    json.dump(cache, open(CACHE, 'w', encoding='utf-8'), indent=0)
    out = []
    for r in rows:
        m = cache.get(r['external_url'])
        if not m:
            continue
        out.append(f"UPDATE photos SET width = {m['w']}, height = {m['h']}, aspect = {round(m['w'] / m['h'], 3)}, "
                   f"focus_x = {m['fx']}, focus_y = {m['fy']} WHERE id = '{r['id'].replace(chr(39), chr(39) * 2)}';")
    open(sys.argv[2], 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(f'wrote {len(out)} updates to {sys.argv[2]}, {len(failed)} failed')
    for u, e in failed[:10]:
        print('  failed', u, e)


if __name__ == '__main__':
    main()
