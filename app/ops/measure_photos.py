# Measures every listing photo still on Wix, so the generated site can choose and crop it well.
#
# For each photo it records the original width and height (read from the JPEG header of a large
# "fit" rendition, which Wix never enlarges) and a focus point, the part of the frame that holds
# the puppy.
#
# The focus point comes from the dog detector on Workers AI (@cf/facebook/detr-resnet-50, the same
# rule as lib/focus.js), run through the dev/photo-focus Worker. The detector reports only where a
# dog is, never which puppy or breed it is. The point is the middle of the dog box across, and in
# the upper part of the box down, because the face sits there. A photo with no dog found falls back
# to the older guess, which treats the pixels least like the border colors as the subject. On a
# 100-photo sample (2026-10-18) the detector point kept more of the dog in frame on 40 of 98 phone
# crops and less on none, at about 0.68 neurons and 400 ms a photo.
#
# Some photos were imported as Wix's own 4:3 copy (".../v1/fill/w_1400,h_1050,al_c,.../file.jpg"),
# which crops a portrait photo before the site crops it again. Those are measured on the original
# and the output points external_url back at it.
#
# Results are cached in _harvest/data/framing.json by photo address, so a rerun and the seed
# reuse them. An entry with "manual": true was set by hand (migrations/0007) and is never
# remeasured. An entry measured before the detector has no "by" and is remeasured. The script
# writes an SQL file of UPDATE statements and never writes to a database itself. Apply the file
# with wrangler after a backup.
#
#   (in app/dev/photo-focus)  node <wrangler.js> dev --port 8792
#   python app/ops/measure_photos.py <photos.json> <out.sql> [--detector http://localhost:8792/]
#
# photos.json is the output of: wrangler d1 execute <db> --json --command
#   "SELECT id, external_url FROM photos WHERE external_url IS NOT NULL"
import io, json, os, sys, time, urllib.request, concurrent.futures as cf

import numpy as np
from PIL import Image

UA = {'User-Agent': 'Mozilla/5.0'}
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, '_harvest', 'data', 'framing.json')
DETECTOR = sys.argv[sys.argv.index('--detector') + 1] if '--detector' in sys.argv else 'http://localhost:8792/'


def get(url, rng=None, data=None, ctype=None):
    headers = dict(UA)
    if rng:
        headers['Range'] = rng
    if ctype:
        headers['Content-Type'] = ctype
    for attempt in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=60).read()
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


def bare(url):
    """The original photo behind a Wix rendition address."""
    return url.split('/v1/')[0] if 'wixstatic.com' in url and '/v1/' in url else url


def dog_focus(boxes, iw, ih, W, H):
    """(fx, fy) from the detector's boxes, or None when it found no dog. Same rule as lib/focus.js."""
    dogs = [b for b in boxes if b.get('label') == 'dog' and b.get('score', 0) >= 0.7]
    if not dogs:
        return None
    area = lambda b: (b['box']['xmax'] - b['box']['xmin']) * (b['box']['ymax'] - b['box']['ymin'])
    big = max(area(b) for b in dogs)
    # Every dog at least 30% the size of the biggest, so two puppies side by side stay in frame.
    keep = [b for b in dogs if area(b) >= 0.3 * big]
    x0 = max(0, min(b['box']['xmin'] for b in keep)) / iw
    y0 = max(0, min(b['box']['ymin'] for b in keep)) / ih
    x1 = min(iw, max(b['box']['xmax'] for b in keep)) / iw
    y1 = min(ih, max(b['box']['ymax'] for b in keep)) / ih
    r = ((y1 - y0) * H) / max((x1 - x0) * W, 1)
    # A tall box (sitting or standing) leans furthest up toward the face, a wide one (lying down) less.
    lean = 0.45 - 0.13 * min(max((r - 0.9) / 0.5, 0), 1)
    return round((x0 + x1) / 2, 3), round(y0 + lean * (y1 - y0), 3)


def border_focus(img):
    """The older guess: (fx, fy) in 0..1 for the pixels least like the border colors."""
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
    src = bare(url)
    head = get(f'{src}/v1/fit/w_6000,h_6000,q_90/i.jpg', 'bytes=0-8191')
    size = jpeg_size(head)
    if not size:
        size = Image.open(io.BytesIO(get(f'{src}/v1/fit/w_6000,h_6000,q_90/i.jpg'))).size
    w, h = size
    # No enc_auto, so an AVIF original still reaches the detector as a JPEG it can read.
    card = get(f'{src}/v1/fit/w_640,h_640,q_85/i.jpg')
    img = Image.open(io.BytesIO(card))
    res = json.loads(get(DETECTOR, data=card, ctype='image/jpeg'))
    if res.get('error'):
        raise RuntimeError(f"detector: {res['error']}")
    point = dog_focus(res.get('boxes') or [], img.width, img.height, w, h)
    by = 'detr' if point else 'border'
    fx, fy = point or border_focus(img.resize((200, round(200 * img.height / img.width)) if img.width >= img.height else (round(200 * img.width / img.height), 200)))
    out = {'w': w, 'h': h, 'fx': fx, 'fy': fy, 'by': by}
    if src != url:
        out['src'] = src
    return out


def main():
    rows = json.load(open(sys.argv[1], encoding='utf-8'))
    if isinstance(rows, list) and rows and 'results' in rows[0]:
        rows = rows[0]['results']
    cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
    todo = sorted({r['external_url'] for r in rows if 'wixstatic.com' in (r['external_url'] or '')
                   and not (cache.get(r['external_url'], {}).get('by') or cache.get(r['external_url'], {}).get('manual'))})
    print(f'{len(rows)} photos, {len(todo)} to measure', flush=True)
    failed = []
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
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
        moved = f"external_url = '{m['src']}', " if m.get('src') else ''
        out.append(f"UPDATE photos SET {moved}width = {m['w']}, height = {m['h']}, aspect = {round(m['w'] / m['h'], 3)}, "
                   f"focus_x = {m['fx']}, focus_y = {m['fy']} WHERE id = '{r['id'].replace(chr(39), chr(39) * 2)}';")
    open(sys.argv[2], 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(f'wrote {len(out)} updates to {sys.argv[2]}, {len(failed)} failed')
    for u, e in failed[:10]:
        print('  failed', u, e)


if __name__ == '__main__':
    main()
