"""Build the crop preview for docs/batch-2026-11-02-post-launch.md (n2-crop-preview). Nothing is cropped.

Every photo of a listed puppy whose shape is near 4:3 or 5:4 is shown as it is now beside a 3:2 crop of it. The
crop keeps the full width and moves its window up or down around the photo's stored focus point (photos.focus_y),
which is how a crop would be made. The dog detector (dev/photo-focus, the same one that set the focus points)
gives the box around each dog, and a photo is flagged when the 3:2 window would cut the top of that box (the head
side) or the bottom (the feet side) by more than 2% of the photo's height. The flag is geometry from the
detector, not a judgment of the photo, and the box is drawn on each photo so the reader can check it.

  python app/ops/crop_preview.py <production export or sqlite copy> <out folder> [--detector http://localhost:8892/]

Photos and detector answers are cached in the out folder, so a rerun fetches only what is missing.
"""
import html, io, json, os, sqlite3, sys, urllib.request
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
DETECTOR = sys.argv[sys.argv.index('--detector') + 1] if '--detector' in sys.argv else 'http://localhost:8892/'
SITE = 'https://www.puppy-connection.com'
TOL = 0.02
os.makedirs(os.path.join(out, 'img'), exist_ok=True)

if src.endswith('.sql'):
    db = sqlite3.connect(':memory:')
    db.executescript(open(src, encoding='utf8').read())
else:
    db = sqlite3.connect(src)


def band(w, h):
    r = w / h
    if 1.29 <= r < 1.43:
        return '4:3'
    if 1.17 <= r < 1.29:
        return '5:4'
    return None


rows = db.execute(
    """SELECT ph.id, ph.width, ph.height, ph.focus_x, ph.focus_y, ph.r2_key, ph.external_url, ph.position,
              p.name, p.slug, COALESCE(bp.business_name, p.breeder_id)
         FROM photos ph JOIN public_puppies v ON v.id = ph.puppy_id JOIN puppies p ON p.id = ph.puppy_id
         LEFT JOIN breeder_profiles bp ON bp.breeder_id = p.breeder_id
        WHERE p.availability != 'placed' AND ph.width > 0 AND ph.height > 0
        ORDER BY p.name, ph.position""").fetchall()
items = [r for r in rows if band(r[1], r[2])]
cache_f = os.path.join(out, 'boxes.json')
cache = json.load(open(cache_f)) if os.path.exists(cache_f) else {}


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60) as r:
        return r.read()


results = []
for pid, w, h, fx, fy, key, ext, pos, name, slug, breeder in items:
    jpg = os.path.join(out, 'img', f'{pid}.jpg')
    if not os.path.exists(jpg):
        data = fetch(f'{SITE}/media/{pid}' if key else ext)
        im = Image.open(io.BytesIO(data)).convert('RGB')
        im.thumbnail((640, 640))
        im.save(jpg, quality=82)
    if pid not in cache:
        data = open(jpg, 'rb').read()
        req = urllib.request.Request(DETECTOR, data=data, method='POST', headers={'content-type': 'image/jpeg'})
        with urllib.request.urlopen(req, timeout=120) as r:
            cache[pid] = json.loads(r.read())
        json.dump(cache, open(cache_f, 'w'))
    im = Image.open(jpg)
    iw, ih = im.size
    boxes = [b for b in (cache[pid].get('boxes') or []) if b.get('label') == 'dog' and b.get('score', 0) >= 0.7]
    keep = (w / 1.5) / h                       # the share of the height a 3:2 crop keeps
    centre = fy if fy is not None else 0.5
    top = min(max(centre - keep / 2, 0), 1 - keep)
    bottom = top + keep
    dog = None
    flags = []
    if boxes:
        x0 = min(b['box']['xmin'] for b in boxes) / iw
        y0 = min(b['box']['ymin'] for b in boxes) / ih
        x1 = max(b['box']['xmax'] for b in boxes) / iw
        y1 = max(b['box']['ymax'] for b in boxes) / ih
        dog = (x0, y0, x1, y1)
        if y0 < top - TOL:
            flags.append(f'cuts the top of the dog by {round((top - y0) * 100)}% of the height')
        if y1 > bottom + TOL:
            flags.append(f'cuts the bottom of the dog by {round((y1 - bottom) * 100)}% of the height')
    else:
        flags.append('no dog found by the detector, check by eye')
    results.append(dict(id=pid, name=name, slug=slug, breeder=breeder, band=band(w, h), w=w, h=h, pos=pos,
                        fy=fy, top=top, bottom=bottom, dog=dog, flags=flags))

json.dump(results, open(os.path.join(out, 'results.json'), 'w'), indent=1)
cut = [r for r in results if r['dog'] and r['flags']]
nodog = [r for r in results if not r['dog']]
clean = [r for r in results if r['dog'] and not r['flags']]
pct = lambda v: f'{v * 100:.1f}%'


def card(r):
    dog = ''
    if r['dog']:
        x0, y0, x1, y1 = r['dog']
        dog = f'<span class="box" style="left:{pct(x0)};top:{pct(y0)};width:{pct(x1 - x0)};height:{pct(y1 - y0)}"></span>'
    shade = (f'<span class="shade" style="top:0;height:{pct(r["top"])}"></span>'
             f'<span class="shade" style="top:{pct(r["bottom"])};height:{pct(1 - r["bottom"])}"></span>')
    keep = r['bottom'] - r['top']
    posy = 0 if keep >= 1 else r['top'] / (1 - keep)
    note = ''.join(f'<li>{html.escape(f)}</li>' for f in r['flags']) or '<li>keeps the whole dog box</li>'
    return f'''<article class="row{' flag' if r['flags'] else ''}">
  <header><b>{html.escape(r['name'])}</b> <span>{html.escape(r['breeder'])}, photo {r['pos'] + 1}, {r['band']} ({r['w']}×{r['h']})</span>
  <a href="{SITE}/puppy-{html.escape(r['slug'])}.html">puppy page</a></header>
  <div class="pair">
    <figure><div class="now" style="aspect-ratio:{r['w']}/{r['h']}"><img src="img/{r['id']}.jpg" alt="">{shade}{dog}</div><figcaption>Now, with the part a crop removes shaded and the dog box outlined</figcaption></figure>
    <figure><div class="crop"><img src="img/{r['id']}.jpg" alt="" style="object-position:50% {posy * 100:.1f}%"></div><figcaption>Cropped to 3:2</figcaption></figure>
  </div>
  <ul>{note}</ul>
</article>'''


page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crop Preview – Puppy Connection</title>
<style>
:root{{--bg:#fbfaf7;--ink:#1f2a24;--mute:#5b665f;--line:#d9d6cc;--flag:#a3401f;--box:#2e7d4f}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}}
main{{width:min(94%,1200px);margin:24px auto}}
h1{{font-size:24px;margin:0 0 8px}} h2{{font-size:19px;margin:32px 0 8px}} p{{max-width:75ch}}
.row{{border-top:1px solid var(--line);padding:16px 0}} .row header span{{color:var(--mute)}} .row header a{{margin-left:8px}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px}}
figure{{margin:0}} figcaption{{color:var(--mute);font-size:13px}}
.now,.crop{{position:relative;width:100%;overflow:hidden;background:#000}}
.now img{{width:100%;height:100%;display:block}}
.crop{{aspect-ratio:3/2}} .crop img{{width:100%;height:100%;object-fit:cover;display:block}}
.shade{{position:absolute;left:0;right:0;background:rgba(160,40,20,.45)}}
.box{{position:absolute;outline:2px solid #4fd17f;outline-offset:-2px}}
.flag ul{{color:var(--flag);font-weight:600}} ul{{margin:8px 0 0;padding-left:20px}}
@media (max-width:640px){{.pair{{grid-template-columns:1fr}}}}
</style></head><body><main>
<h1>Crop preview for the 4:3 and 5:4 photos</h1>
<p>Nothing has been cropped. Each photo of a listed puppy that is near 4:3 or 5:4 is shown as it is now beside how it would look cropped to 3:2,
keeping the full width and moving the window around the photo's stored focus point. A photo is flagged when the crop would cut the top or the bottom
of the box the dog detector draws around the dog by more than 2% of the photo's height. The box is outlined in green so each flag can be checked by eye,
and the detector marks the whole dog, so a cut top is usually the head or ears and a cut bottom is usually the feet.</p>
<p><b>{len(results)}</b> photos ({sum(r['band'] == '4:3' for r in results)} near 4:3, {sum(r['band'] == '5:4' for r in results)} near 5:4) from the production database of November 1, 2026.
<b>{len(cut)}</b> would cut the dog box, <b>{len(nodog)}</b> have no dog the detector could find, and <b>{len(clean)}</b> keep the whole dog box.</p>
<h2>Would cut the dog ({len(cut)})</h2>
{''.join(card(r) for r in sorted(cut, key=lambda r: -max((r['dog'][3] - r['bottom']), (r['top'] - r['dog'][1]))))}
<h2>No dog found, check by eye ({len(nodog)})</h2>
{''.join(card(r) for r in nodog)}
<h2>Keep the whole dog box ({len(clean)})</h2>
{''.join(card(r) for r in clean)}
</main></body></html>'''
open(os.path.join(out, 'index.html'), 'w', encoding='utf8', newline='\n').write(page)
print(f'{len(results)} photos: {len(cut)} cut the dog box, {len(nodog)} no dog found, {len(clean)} keep it')
