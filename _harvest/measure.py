# Measures the true aspect ratio of every listing photo and caches it.
# A "fit" rendition preserves the source shape, so the JPEG's own SOF header
# tells us whether the original is landscape or portrait. Wix serves every
# source URL as a 4:3 crop, so nothing in the URL itself reveals this.
# Writes _harvest/data/aspects.json as {image_base: ratio}.
import json, io, os, re, sys, urllib.request, concurrent.futures as cf

UA = {'User-Agent': 'Mozilla/5.0'}
CACHE = '_harvest/data/aspects.json'
L = json.load(open('_harvest/data/listings.json', encoding='utf-8'))


def aspect(base):
    try:
        u = base + '/v1/fit/w_320,h_320,q_60/i.jpg'
        d = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25).read()
        i = 2
        while i < len(d) - 9:
            if d[i] != 0xFF:
                i += 1
                continue
            m = d[i + 1]
            if m in (0xC0, 0xC1, 0xC2):
                h = int.from_bytes(d[i + 5:i + 7], 'big')
                w = int.from_bytes(d[i + 7:i + 9], 'big')
                return round(w / h, 3) if h else None
            i += 2 + int.from_bytes(d[i + 2:i + 4], 'big')
    except Exception:
        return None
    return None


have = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
bases = []
for r in L:
    for u in (r.get('images') or []):
        b = re.sub(r'/v1/.*$', '', u)
        if b not in have and b not in bases:
            bases.append(b)

print('%d photos total, %d already measured, %d to fetch' %
      (len(have) + len(bases), len(have), len(bases)))
done = 0
with cf.ThreadPoolExecutor(12) as ex:
    for b, r in zip(bases, ex.map(aspect, bases)):
        have[b] = r
        done += 1
        if done % 100 == 0:
            sys.stdout.write('  %d/%d\n' % (done, len(bases)))
            sys.stdout.flush()

io.open(CACHE, 'w', encoding='utf-8').write(json.dumps(have, indent=0))
ok = [v for v in have.values() if v]
land = sum(1 for v in ok if v >= 1.25)
print('measured %d, %d landscape (%.0f%%), %d unreadable'
      % (len(ok), land, 100.0 * land / max(len(ok), 1), len(have) - len(ok)))
