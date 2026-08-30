# Chooses a landscape hero photo per breed by measuring candidates.
# Writes _harvest/data/breedphotos.json so builddata.py stays fast.
import json, io, re, urllib.request, concurrent.futures as cf

UA = {'User-Agent': 'Mozilla/5.0'}
L = json.load(open('_harvest/data/listings.json', encoding='utf-8'))
B = json.load(open('_harvest/data/breeds.json', encoding='utf-8'))


def aspect(base):
    """Ask for a small 'fit' rendition: it preserves the source aspect."""
    try:
        u = base + '/v1/fit/w_400,h_400,q_60/i.jpg'
        d = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20).read()
        i = 2
        while i < len(d) - 9:
            if d[i] != 0xFF:
                i += 1
                continue
            m = d[i + 1]
            if m in (0xC0, 0xC1, 0xC2):
                h = int.from_bytes(d[i + 5:i + 7], 'big')
                w = int.from_bytes(d[i + 7:i + 9], 'big')
                return w / h if h else None
            i += 2 + int.from_bytes(d[i + 2:i + 4], 'big')
    except Exception:
        return None
    return None


def canon(n):
    return re.sub(r'\s+', ' ', (n or '')).strip().lower()


out = {}
for b in B:
    name = b['name']
    cands = []
    for r in L:
        if canon(r.get('breed')) != canon(name):
            continue
        for u in (r.get('images') or [])[:2]:
            base = re.sub(r'/v1/.*$', '', u)
            if base not in cands:
                cands.append(base)
        if len(cands) >= 8:
            break
    if not cands:
        continue
    with cf.ThreadPoolExecutor(8) as ex:
        ratios = list(ex.map(aspect, cands))
    best = None
    for base, r in zip(cands, ratios):
        if r and 1.3 <= r <= 2.1:          # comfortably landscape
            best = (base, r)
            break
    if not best:
        for base, r in zip(cands, ratios):
            if r:
                best = (base, r)
                break
    if best:
        out[name] = {'photo': best[0], 'aspect': round(best[1], 2)}
        print('  %-32s %.2f  %s' % (name, best[1], 'landscape' if best[1] >= 1.3 else 'no landscape available'))

io.open('_harvest/data/breedphotos.json', 'w', encoding='utf-8').write(
    json.dumps(out, ensure_ascii=False, indent=1))
print('\nchosen for', len(out), 'breeds')
