"""Bring each listed puppy's photos up to date with the Wix store (Alex, 2026-11-01, docs/batch-2026-11-01-wix-photo-refresh.md).

104 puppies still for sale had newer photos on the old Wix store than on Puppy Connection. For each one, Wix's
current photos, in Wix's order and up to 15, replace the photos we copied from Wix. A photo a breeder uploaded in
the portal (external_url NULL) is always kept, after the Wix photos in its own order. A Wix photo we already hold
keeps its row and its files. Every step writes into app/.state/wix-photo-refresh and never into R2 or D1. The R2
upload is wix-photo-refresh-r2.mjs, and the database change is the migration this script writes.

  python -I app/ops/wix_photo_refresh.py plan <classified.json> <raw folder> <backup.sql>
  node app/ops/wix-photo-refresh-r2.mjs fetch          download each new original (one Wix request at a time)
  python -I app/ops/wix_photo_refresh.py copies       1600 WebP, 640 WebP card and 1200 JPEG share (photo_copies.py)
  python -I app/ops/wix_photo_refresh.py focus [--detector http://localhost:8792/]
  python -I app/ops/wix_photo_refresh.py check        quality table, flags and contact sheets at the site's slot shapes
  node app/ops/wix-photo-refresh-r2.mjs upload         new keys only, never an existing one
  python -I app/ops/wix_photo_refresh.py migration <backup.sql> <out.sql>

The focus step uses the dog detector the same way as measure_photos.py, through the dev/photo-focus Worker run
locally with wrangler dev, and falls back to its border-color guess when no dog is found. Any focus set by hand
after looking at the contact sheets goes in overrides.json beside plan.json, and wins.
"""
import io, json, os, re, sqlite3, sys, urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
# WIX_REFRESH_STATE moves the working folder, for a run from a worktree that should leave its files in the main checkout.
STATE = os.environ.get('WIX_REFRESH_STATE') or os.path.join(APP, '.state', 'wix-photo-refresh')
FILES = os.path.join(STATE, 'files')
PLAN = os.path.join(STATE, 'plan.json')
CAP = 15
ACCOUNT = '8d80ac'
# A Wix media address: account_hash~mv2.ext for a photo. A video's poster frame has no ~mv2 and a longer name
# (8d80ac_<32 hex>f002.jpg), and a photo under another account belongs to someone else's Wix site.
MEDIA = re.compile(r'media/([0-9a-f]{6})_([0-9a-f]+)(~mv2)?((?:_d_\d+_\d+_s_\d+)?)\.(\w+)', re.I)
sys.path.insert(0, HERE)


def media(url):
    """(media id, account, is_video, bare original address) for a Wix address, or None."""
    m = MEDIA.search(url or '')
    if not m:
        return None
    acct, h, mv2, dsz, ext = m.groups()
    mid = f'{acct}_{h}{mv2 or ""}{dsz}'.lower()
    video = not mv2 or len(h) != 32
    return mid, acct.lower(), video, f'https://static.wixstatic.com/media/{acct}_{h}{mv2 or ""}{dsz}.{ext}'


def wix_images(html):
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            d = json.loads(m.group(1))
        except ValueError:
            continue
        if isinstance(d, dict) and d.get('@type') == 'Product':
            im = d.get('image') or []
            im = im if isinstance(im, list) else [im]
            out = []
            for x in im:
                u = x.get('contentUrl') if isinstance(x, dict) else x
                w = int(x['width']) if isinstance(x, dict) and str(x.get('width', '')).isdigit() else None
                h = int(x['height']) if isinstance(x, dict) and str(x.get('height', '')).isdigit() else None
                out.append((u, w, h))
            return out
    return None


def load_db(backup):
    db = sqlite3.connect(':memory:')
    db.executescript(open(backup, encoding='utf-8').read())
    db.row_factory = sqlite3.Row
    return db


def selected(classified):
    rows = json.load(open(classified, encoding='utf-8'))
    return [r for r in rows if r['kind'] == 'replaced' and r['availability'] != 'placed' and r['state'] == 'published']


def plan(classified, raw, backup):
    os.makedirs(FILES, exist_ok=True)
    db = load_db(backup)
    taken = {r[0] for r in db.execute('SELECT id FROM photos')}
    keys = {r[0] for r in db.execute('SELECT r2_key FROM photos WHERE r2_key IS NOT NULL')}
    puppies, log = [], []
    # Media left out after the contact sheets, by media id with the reason (overrides.json "leave_out"). These are
    # not photographs of the puppy: a badge, or a health certificate that prints a person's name and street address.
    # Keyed by the first 12 hex digits of the media hash, as in the new photo ids.
    leave_out = jload('overrides.json', {}).get('leave_out', {})
    for s in selected(classified):
        pup = db.execute('SELECT * FROM puppies WHERE lower(slug) = ? OR lower(legacy_slug) = ?', (s['slug'], s['slug'])).fetchone()
        if not pup:
            log.append({'slug': s['slug'], 'skip': 'puppy not found in the backup'})
            continue
        # A breeder or operator who has already changed this puppy's photos by hand has the last word. On 2026-11-01 an
        # operator replaced every photo of two of the 104 in the admin before this ran, and this would have put the
        # Wix photos back beside them. The migration checks again at the moment it runs (HUMAN_SQL).
        hand = db.execute("SELECT COUNT(*), MAX(at) FROM audit_log WHERE entity = 'puppy' AND entity_id = ? AND action LIKE 'photo.%' "
                          "AND actor_type IN ('breeder','operator')", (pup['id'],)).fetchone()
        if hand[0]:
            log.append({'slug': s['slug'], 'skip': f'{hand[0]} photo changes by a breeder or operator, the last at {hand[1]}, so left as they are'})
            continue
        html = open(os.path.join(raw, s['slug'] + '.html'), encoding='utf-8').read()
        wix = wix_images(html)
        if wix is None:
            log.append({'slug': s['slug'], 'skip': 'no Product image list on the cached Wix page'})
            continue
        ours = [dict(r) for r in db.execute('SELECT * FROM photos WHERE puppy_id = ? ORDER BY position, id', (pup['id'],))]
        held = {}
        for r in ours:
            m = media(r['external_url'])
            if m and m[0] not in held:
                held[m[0]] = r
        final, seen = [], set()
        for u, w, h in wix:
            m = media(u)
            if not m:
                log.append({'slug': s['slug'], 'skip_media': u, 'why': 'not a Wix media address'})
                continue
            mid, acct, video, src = m
            if mid in seen:
                log.append({'slug': s['slug'], 'skip_media': mid, 'why': 'listed twice on Wix'})
                continue
            if mid not in held and acct != ACCOUNT:
                log.append({'slug': s['slug'], 'skip_media': mid, 'why': f'under Wix account {acct}, not {ACCOUNT}'})
                continue
            if mid not in held and video:
                log.append({'slug': s['slug'], 'skip_media': mid, 'why': 'a video poster frame, not a photo'})
                continue
            if mid.split('_')[1][:12] in leave_out:
                log.append({'slug': s['slug'], 'skip_media': mid, 'why': leave_out[mid.split('_')[1][:12]]})
                continue
            if len(final) >= CAP:
                log.append({'slug': s['slug'], 'skip_media': mid, 'why': f'past the first {CAP}'})
                continue
            seen.add(mid)
            final.append({'mid': mid, 'src': src, 'wix_w': w, 'wix_h': h, 'held': held.get(mid, {}).get('id')})
        keep_ids = {f['held'] for f in final if f['held']}
        drop = [r for r in ours if r['external_url'] and r['id'] not in keep_ids]
        portal = [r for r in ours if not r['external_url']]
        order = []
        for f in final:
            if f['held']:
                order.append({'id': f['held'], 'kind': 'kept', 'mid': f['mid']})
            else:
                pid = f"{pup['id']}-wx-{f['mid'].split('_')[1][:12]}"
                assert pid not in taken, pid
                taken.add(pid)
                order.append({'id': pid, 'kind': 'new', 'mid': f['mid'], 'src': f['src'], 'wix_w': f['wix_w'], 'wix_h': f['wix_h']})
        order += [{'id': r['id'], 'kind': 'portal'} for r in portal]
        for i, o in enumerate(order):
            o['position'] = i
        puppies.append({'puppy_id': pup['id'], 'slug': pup['slug'], 'name': pup['name'], 'breeder_id': pup['breeder_id'],
                        'availability': pup['availability'], 'state': pup['publication_state'],
                        'wix_listed': len(wix), 'order': order,
                        'drop': [{'id': r['id'], 'r2_key': r['r2_key'], 'external_url': r['external_url'], 'position': r['position']} for r in drop],
                        'before': [{'id': r['id'], 'position': r['position'], 'mid': (media(r['external_url']) or [None])[0]} for r in ours]})
    json.dump(sorted(keys), open(os.path.join(STATE, 'taken-keys.json'), 'w', encoding='utf-8'))
    # When the backup was written, which is the moment the plan's view of the database dates from. The migration's
    # hand-change guard counts from here, not from when the plan ran, so a change made in between is still seen.
    # Five minutes are taken off, because the export is written a little after D1 makes it, and a change counted
    # twice only leaves that puppy alone.
    taken = datetime.fromtimestamp(os.path.getmtime(backup) - 300, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    json.dump({'made_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'backup': os.path.basename(backup), 'backup_at': taken,
               'puppies': puppies, 'log': log}, open(PLAN, 'w', encoding='utf-8'), indent=1)
    new = sum(o['kind'] == 'new' for p in puppies for o in p['order'])
    kept = sum(o['kind'] == 'kept' for p in puppies for o in p['order'])
    port = sum(o['kind'] == 'portal' for p in puppies for o in p['order'])
    dropped = sum(len(p['drop']) for p in puppies)
    print(f'{len(puppies)} puppies: {new} new Wix photos, {kept} Wix photos kept, {port} portal uploads kept, {dropped} rows dropped')
    print(f'skipped media: {sum(1 for l in log if "skip_media" in l)}, skipped puppies: {sum(1 for l in log if "skip" in l)}')
    for l in log:
        print('  ', l)


def plan_rows():
    return json.load(open(PLAN, encoding='utf-8'))


def new_photos(p=None):
    p = p or plan_rows()
    return [(pup, o) for pup in p['puppies'] for o in pup['order'] if o['kind'] == 'new']


def meta(pid):
    return json.load(open(os.path.join(FILES, f'{pid}.json'), encoding='utf-8'))


def jload(name, default):
    f = os.path.join(STATE, name)
    return json.load(open(f, encoding='utf-8')) if os.path.exists(f) else default


def jsave(name, obj):
    json.dump(obj, open(os.path.join(STATE, name), 'w', encoding='utf-8'), indent=1)


def copies():
    """The three served copies of each new photo, made by photo_copies.py exactly as for the first Wix copy."""
    import photo_copies
    out, bad = jload('copies.json', {}), 0
    for _, o in new_photos():
        if not os.path.exists(os.path.join(FILES, f"{o['id']}.full")):
            bad += 1
            print('  no original yet:', o['id'])
            continue
        try:
            out[o['id']] = photo_copies.make(FILES, o['id'])
        except Exception as e:  # noqa: BLE001, listed and counted
            bad += 1
            print('  failed:', o['id'], e)
    jsave('copies.json', out)
    print(f'copies: {len(out)} photos with all three copies, {bad} not made')


def focus(detector):
    """Where the dog sits, by the detector on Workers AI (measure_photos.py and lib/focus.js), from a 640 px JPEG."""
    from PIL import Image
    import measure_photos as mp
    out, done, none = jload('focus.json', {}), 0, 0
    for _, o in new_photos():
        pid = o['id']
        if pid in out or not os.path.exists(os.path.join(FILES, f'{pid}.share.jpg')):
            continue
        img = Image.open(os.path.join(FILES, f'{pid}.share.jpg')).convert('RGB')
        img.thumbnail((640, 640))
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=85)
        m = meta(pid)
        res = json.loads(mp.get(detector, data=buf.getvalue(), ctype='image/jpeg'))
        if res.get('error'):
            raise RuntimeError(f"detector: {res['error']}")
        boxes = res.get('boxes') or []
        point = mp.dog_focus(boxes, img.width, img.height, m['w'], m['h'])
        if point:
            by = 'detr'
        else:
            none += 1
            by = 'border'
            point = mp.border_focus(img.resize((200, round(200 * img.height / img.width)) if img.width >= img.height else (round(200 * img.width / img.height), 200)))
        dogs = [b for b in boxes if b.get('label') == 'dog' and b.get('score', 0) >= 0.7]
        out[pid] = {'fx': point[0], 'fy': point[1], 'by': by, 'iw': img.width, 'ih': img.height,
                    'dogs': [[round(b['box'][k] / (img.width if k[0] == 'x' else img.height), 4) for k in ('xmin', 'ymin', 'xmax', 'ymax')] + [round(b['score'], 3)] for b in dogs]}
        done += 1
        if done % 50 == 0:
            jsave('focus.json', out)
            print(f'  focus {done}', flush=True)
    jsave('focus.json', out)
    print(f'focus: {done} measured this run, {none} with no dog found (border guess), {len(out)} in all')


def focus_of(pid, f=None, ov=None):
    f = f if f is not None else jload('focus.json', {})
    ov = ov if ov is not None else jload('overrides.json', {})
    if pid in ov and 'fx' in ov[pid]:
        return ov[pid]['fx'], ov[pid]['fy'], 'hand'
    if pid in f:
        return f[pid]['fx'], f[pid]['fy'], f[pid]['by']
    return 0.5, 0.42, 'default'


def window(w, h, fx, fy, t):
    """The part of a w x h photo a box of ratio t shows, as the site's objectPosition() places it: (x0, y0, x1, y1) in 0..1."""
    a = w / h
    if a > t:
        v = t / a
        x0 = min(max(fx - v / 2, 0), 1 - v)
        return x0, 0.0, x0 + v, 1.0
    v = a / t
    y0 = min(max(fy - v / 2, 0), 1 - v)
    return 0.0, y0, 1.0, y0 + v


SLOTS = (('3:2 card', 1.5), ('4:5 phone card', 0.8), ('1:1 thumb', 1.0))


def check():
    """The quality table, the automatic flags and the contact sheets for every new photo."""
    import numpy as np
    from PIL import Image, ImageCms, ImageDraw, ImageFont
    p = plan_rows()
    f, ov, cp = jload('focus.json', {}), jload('overrides.json', {}), jload('copies.json', {})
    rows = []
    for pup, o in new_photos(p):
        pid = o['id']
        m = meta(pid)
        raw = Image.open(os.path.join(FILES, f'{pid}.raw'))
        exif_o = raw.getexif().get(274, 1) if hasattr(raw, 'getexif') else 1
        icc = raw.info.get('icc_profile')
        prof = None
        if icc:
            try:
                prof = ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(io.BytesIO(icc))).strip()
            except Exception:  # noqa: BLE001
                prof = 'unreadable'
        full = Image.open(os.path.join(FILES, f'{pid}.full'))
        w, h = full.size
        fx, fy, by = focus_of(pid, f, ov)
        disp = Image.open(os.path.join(FILES, f'{pid}.display.webp')).convert('RGB')
        a = np.asarray(disp.resize((max(1, disp.width // 4), max(1, disp.height // 4))), dtype=np.float32)
        lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
        flags = []
        if max(w, h) < 1000:
            flags.append(f'small original, {w}x{h}')
        # Bars: a band of near-uniform rows or columns at both edges, as a letterboxed or framed photo has.
        def band(arr):
            n = 0
            for line in arr:
                if line.std() < 4.0 and abs(line.mean() - arr[0].mean()) < 6:
                    n += 1
                else:
                    break
            return n / len(arr)
        t, b, l, r = band(lum), band(lum[::-1]), band(lum.T), band(lum.T[::-1])
        if min(t, b) > 0.03:
            flags.append(f'bars top and bottom ({t:.0%}, {b:.0%})')
        if min(l, r) > 0.03:
            flags.append(f'bars left and right ({l:.0%}, {r:.0%})')
        if max(t, b, l, r) > 0.10 and not (min(t, b) > 0.03 or min(l, r) > 0.03):
            flags.append(f'flat band on one edge ({max(t, b, l, r):.0%})')
        lo, hi = np.percentile(lum, [2, 98])
        if hi - lo < 110:
            flags.append(f'low contrast (2-98% luminance range {hi - lo:.0f})')
        if lum.mean() > 200 and (a.max(-1) - a.min(-1)).mean() < 25:
            flags.append('very light and gray, may look washed out')
        if w / h > 2.2 or w / h < 0.45:
            flags.append(f'unusual shape {w / h:.2f}')
        if m['wix_w'] and m['wix_h'] and (m['wix_w'] > m['wix_h']) != (w > h) and m['wix_w'] != m['wix_h']:
            flags.append(f"shape differs from Wix's record {m['wix_w']}x{m['wix_h']}")
        if m['method'] == 'original' and exif_o not in (0, 1):
            flags.append(f'original asks for EXIF orientation {exif_o} but was stored as it is')
        if m['method'] != 'original':
            # Wix's rotated copy must be the original turned the way its EXIF asks, at the original's full size.
            from PIL import ImageOps
            turned = ImageOps.exif_transpose(raw).convert('L').resize((48, 48))
            mine = full.convert('L').resize((48, 48))
            ta = np.asarray(turned, dtype=np.float32).ravel(); ma = np.asarray(mine, dtype=np.float32).ravel()
            corr = float(np.corrcoef(ta, ma)[0, 1])
            if corr < 0.9:
                flags.append(f"Wix's copy does not match the original turned by its EXIF (r={corr:.2f})")
            if sorted(full.size) != sorted(raw.size):
                flags.append(f"Wix's copy is {w}x{h}, the original {raw.size[0]}x{raw.size[1]}")
        dogs = f.get(pid, {}).get('dogs', [])
        if by == 'border':
            flags.append('no dog found by the detector, focus is a guess')
        # How much of the dog box each slot keeps, and whether the top of the box (the head) is cut.
        cuts = {}
        if dogs:
            x0 = min(d[0] for d in dogs); y0 = min(d[1] for d in dogs); x1 = max(d[2] for d in dogs); y1 = max(d[3] for d in dogs)
            for name, ratio in SLOTS:
                if name == '3:2 card' and o['position'] == 0 and w / h < 1.2:
                    continue  # a tall lead photo is shown whole on the desktop card (.card-media.is-whole)
                wx0, wy0, wx1, wy1 = window(w, h, fx, fy, ratio)
                kept = max(0, min(x1, wx1) - max(x0, wx0)) * max(0, min(y1, wy1) - max(y0, wy0)) / max((x1 - x0) * (y1 - y0), 1e-6)
                top_cut = max(0, wy0 - y0) / max(y1 - y0, 1e-6)
                cuts[name] = (round(kept, 2), round(top_cut, 2))
                if top_cut > 0.12 and (o['position'] == 0 or name == '1:1 thumb'):
                    flags.append(f'{name} cuts {top_cut:.0%} off the top of the dog')
                elif kept < 0.6 and (o['position'] == 0 or name == '1:1 thumb'):
                    flags.append(f'{name} keeps {kept:.0%} of the dog')
        c = cp.get(pid, {})
        rows.append({'id': pid, 'slug': pup['slug'], 'puppy_id': pup['puppy_id'], 'position': o['position'], 'method': m['method'],
                     'why': m['why'], 'exif_orientation': exif_o, 'raw_size': list(raw.size), 'stored': [w, h], 'type': m['type'],
                     'icc': prof, 'srgb_converted': bool(prof and prof != 'unreadable' and not prof.lower().startswith('srgb')),
                     'focus': [fx, fy], 'focus_by': by, 'dogs': len(dogs), 'cuts': cuts,
                     'bytes': {'raw': m['raw_bytes'], 'stored': m['bytes'], 'display': (c.get('display') or [0, 0, 0])[2],
                               'card': (c.get('card') or [0, 0, 0])[2], 'share': (c.get('share') or [0, 0, 0])[2]},
                     'flags': flags})
    jsave('check.json', rows)
    sheets(rows)
    table(rows)
    from collections import Counter
    print(f"check: {len(rows)} photos, methods {dict(Counter(r['method'] for r in rows))}, "
          f"sRGB converted {sum(r['srgb_converted'] for r in rows)}, flagged {sum(1 for r in rows if r['flags'])}")
    print(Counter(re.sub(r'[\d.%x(),-]+', '#', fl) for r in rows for fl in r['flags']).most_common())


def sheets(rows, per=20):
    """Contact sheets: each photo whole with its focus point and dog boxes, then the 3:2 card, the 4:5 phone card and the
    1:1 thumbnail as the site crops them (generate.mjs objectPosition), 2 columns of 10 photos a sheet."""
    from PIL import Image, ImageDraw, ImageFont
    out = os.path.join(STATE, 'sheets')
    os.makedirs(out, exist_ok=True)
    for old in os.listdir(out):
        os.remove(os.path.join(out, old))
    f = jload('focus.json', {})
    H = 170
    try:
        font = ImageFont.truetype('arial.ttf', 15)
        bold = ImageFont.truetype('arialbd.ttf', 16)
    except OSError:
        font = bold = ImageFont.load_default()
    cell_w = 1000
    for n in range(0, len(rows), per):
        chunk = rows[n:n + per]
        sheet = Image.new('RGB', (cell_w * 2 + 30, 30 + (H + 60) * ((len(chunk) + 1) // 2)), (250, 248, 244))
        d = ImageDraw.Draw(sheet)
        for i, r in enumerate(chunk):
            cx, cy = 15 + (i % 2) * (cell_w + 0), 20 + (i // 2) * (H + 60)
            img = Image.open(os.path.join(FILES, f"{r['id']}.display.webp")).convert('RGB')
            w, h = img.size
            fx, fy = r['focus']
            # Whole photo with the focus point and the dog boxes.
            k = H / h
            whole = img.resize((max(1, round(w * k)), H))
            if whole.width > 300:
                whole = img.resize((300, max(1, round(h * 300 / w))))
            wd = ImageDraw.Draw(whole)
            for b in f.get(r['id'], {}).get('dogs', []):
                wd.rectangle([b[0] * whole.width, b[1] * whole.height, b[2] * whole.width, b[3] * whole.height], outline=(0, 160, 255), width=2)
            px, py = fx * whole.width, fy * whole.height
            wd.ellipse([px - 6, py - 6, px + 6, py + 6], outline=(255, 0, 0), width=3)
            sheet.paste(whole, (cx, cy + 20))
            x = cx + 310
            for name, ratio in SLOTS:
                bw, bh = (round(H * ratio), H)
                if name == '3:2 card' and r['position'] == 0 and w / h < 1.2:
                    tile = Image.new('RGB', (bw, bh), (235, 228, 214))
                    t = img.copy(); t.thumbnail((bw, bh)); tile.paste(t, ((bw - t.width) // 2, (bh - t.height) // 2))
                    label = '3:2 card, shown whole'
                else:
                    x0, y0, x1, y1 = window(w, h, fx, fy, ratio)
                    tile = img.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h))).resize((bw, bh))
                    label = name
                sheet.paste(tile, (x, cy + 20))
                d.text((x, cy + 20 + H + 2), label, fill=(90, 90, 90), font=font)
                x += bw + 10
            lead = ' LEAD' if r['position'] == 0 else ''
            d.text((cx, cy), f"{n + i + 1}. {r['slug']}  #{r['position'] + 1}{lead}  {r['stored'][0]}x{r['stored'][1]}  {r['method']}",
                   fill=(180, 0, 0) if r['flags'] else (20, 20, 20), font=bold)
            if r['flags']:
                d.text((cx, cy + 20 + H + 20), '; '.join(r['flags'])[:150], fill=(180, 0, 0), font=font)
            d.text((cx + 310 + 255 + 10 + 136 + 10 + 170 + 8, cy + 24), r['id'].split('-wx-')[1], fill=(120, 120, 120), font=font)
        sheet.save(os.path.join(out, f'sheet-{n // per + 1:02d}.jpg'), quality=82)
    print(f'sheets: {(len(rows) + per - 1) // per} in {out}')


def table(rows):
    """check.html, the table Alex reads: one row per new photo."""
    def kb(n):
        return f'{n / 1024:.0f}'
    trs = []
    for i, r in enumerate(rows):
        b = r['bytes']
        trs.append('<tr{}><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}</td><td>{}x{}</td><td>{}</td><td>{}</td><td>{:.2f}, {:.2f} ({})</td>'
                   '<td>{} / {} / {} / {} / {}</td><td>{}</td><td>sheet-{:02d}</td></tr>'.format(
                       ' class="flag"' if r['flags'] else '', i + 1, r['id'], r['slug'], r['position'] + 1,
                       'original' if r['method'] == 'original' else "Wix's rotated copy", r['stored'][0], r['stored'][1],
                       'EXIF {} applied by Wix'.format(r['exif_orientation']) if r['exif_orientation'] not in (0, 1) else 'none needed',
                       ('converted from ' + r['icc']) if r['srgb_converted'] else (r['icc'] or 'no profile, taken as sRGB'),
                       r['focus'][0], r['focus'][1], r['focus_by'],
                       kb(b['raw']), kb(b['stored']), kb(b['display']), kb(b['card']), kb(b['share']),
                       '; '.join(r['flags']), i // 20 + 1))
    html = ('<!doctype html><meta charset="utf-8"><title>Wix photo refresh check</title><style>body{font:13px/1.4 system-ui;margin:16px}'
            'table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:3px 6px;text-align:left;vertical-align:top}'
            'tr.flag td{background:#fff1ef}</style><h1>Wix photo refresh, every new photo</h1>'
            '<p>Sizes in KB: raw original from Wix / stored record / 1600 WebP / 640 card / 1200 share.</p><table><tr><th>#</th><th>Photo id</th>'
            '<th>Puppy</th><th>Pos</th><th>Method</th><th>Stored</th><th>Orientation</th><th>Color profile</th><th>Focus</th><th>KB</th>'
            '<th>Flags</th><th>Sheet</th></tr>' + ''.join(trs) + '</table>')
    open(os.path.join(STATE, 'check.html'), 'w', encoding='utf-8').write(html)


def q(v):
    if v is None:
        return 'NULL'
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def migration(backup, out):
    """The migration that swaps the photo rows. Every statement for one puppy runs only while nobody has changed that
    puppy's photos by hand since the plan (HUMAN), and only while the rows it reads are as the plan found them, so a
    second run, or a run after a breeder's own change, leaves that puppy alone."""
    p = plan_rows()
    f, ov, skip = jload('focus.json', {}), jload('overrides.json', {}), jload('excluded.json', {})
    db = load_db(backup)
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    since = p.get('backup_at') or p['made_at']
    if os.path.basename(backup) != p['backup']:
        raise SystemExit(f"the plan was made on {p['backup']}, so make the plan again on {os.path.basename(backup)} first")
    lines = [f"""-- Alex, 2026-11-01 (docs/batch-2026-11-01-wix-photo-refresh.md). Puppies still for sale whose photos on the old Wix
-- store are newer than ours get Wix's current photos, in Wix's order and up to 15, in place of the photos we copied from
-- Wix. A photo the breeder uploaded in the portal (external_url NULL) is kept, after the Wix photos. A Wix photo we
-- already hold keeps its row and files and only moves. Written by app/ops/wix_photo_refresh.py migration from the plan
-- made {since} on {p['backup']}, generated {now}.
-- The new photos' originals and served copies (.display, .card, .share) are in R2 under new keys before this runs
-- (app/ops/wix-photo-refresh-r2.mjs upload). Nothing is deleted from R2.
-- Each puppy's statements check that no breeder or operator has changed its photos since the plan, so a change made by
-- hand in the meantime wins. Rows are inserted only when missing, deleted only while they still hold the Wix address
-- the plan found, and moved only while they are not yet where they belong, so a second run changes nothing.
-- Each puppy's statements are one "-- group", so app/ops/d1-apply.mjs sends them in one batch and a puppy is never
-- left half changed. Apply with app/ops/d1-apply.mjs after a backup that printed "Downloaded"."""]
    pups = [pup for pup in p['puppies'] if pup['puppy_id'] not in skip]
    first_new = next(o['id'] for pup in pups for o in pup['order'] if o['kind'] == 'new')
    lines.append(f"UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, {q(now)}), generation = generation + 1\n"
                 f"  WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM photos WHERE id = {q(first_new)});")
    added = removed = moved = 0
    for pup in pups:
        pid, bid = pup['puppy_id'], pup['breeder_id']
        cur = db.execute('SELECT breeder_id FROM puppies WHERE id = ?', (pid,)).fetchone()
        if not cur or cur[0] != bid:
            raise SystemExit(f'{pid} has moved breeder since the plan ({bid} -> {cur and cur[0]}), so make the plan again')
        human = (f"NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = {q(pid)} AND action LIKE 'photo.%' "
                 f"AND actor_type IN ('breeder','operator') AND at >= {q(since)})")
        news = [o for o in pup['order'] if o['kind'] == 'new']
        mark = news[0]['id']
        lines.append(f"\n-- {pup['slug']} ({pid}): {len(news)} new, {sum(o['kind'] == 'kept' for o in pup['order'])} kept from Wix, "
                     f"{sum(o['kind'] == 'portal' for o in pup['order'])} portal uploads kept, {len(pup['drop'])} dropped\n-- group")
        lines.append("INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
                     f"  SELECT {q(now)}, 'system', 'claude', 'photos.refresh_from_wix', 'puppy', {q(pid)}, "
                     f"{q(json.dumps([b['id'] for b in pup['before']]))}, "
                     f"json_object('photos', json({q(json.dumps([o['id'] for o in pup['order']]))}), 'dropped', {len(pup['drop'])}, 'added', {len(news)}, "
                     f"'why', 'Alex, 2026-11-01, Wix had newer photos')\n"
                     f"   WHERE NOT EXISTS (SELECT 1 FROM photos WHERE id = {q(mark)}) AND {human};")
        for d in pup['drop']:
            lines.append(f"DELETE FROM photos WHERE id = {q(d['id'])} AND puppy_id = {q(pid)} AND external_url = {q(d['external_url'])} AND {human};")
            removed += 1
        for o in pup['order']:
            if o['kind'] == 'new':
                m = meta(o['id'])
                fx, fy, _ = focus_of(o['id'], f, ov)
                lines.append("INSERT INTO photos (id, breeder_id, puppy_id, r2_key, external_url, content_type, bytes, position, aspect, created_at, width, height, focus_x, focus_y)\n"
                             f"  SELECT {q(o['id'])}, {q(bid)}, {q(pid)}, {q(m['key'])}, {q(m['src'])}, {q(m['type'])}, {m['bytes']}, {o['position']}, "
                             f"{round(m['w'] / m['h'], 3)}, {q(now)}, {m['w']}, {m['h']}, {round(fx, 3)}, {round(fy, 3)}\n"
                             f"   WHERE NOT EXISTS (SELECT 1 FROM photos WHERE id = {q(o['id'])}) AND {human};")
                added += 1
            else:
                lines.append(f"UPDATE photos SET position = {o['position']} WHERE id = {q(o['id'])} AND puppy_id = {q(pid)} AND position IS NOT {o['position']} AND {human};")
                moved += 1
    open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print(f'{out}: {len(pups)} puppies, {added} rows added, {removed} rows removed, {moved} kept rows placed')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'plan':
        plan(*sys.argv[2:5])
    elif cmd == 'copies':
        copies()
    elif cmd == 'focus':
        focus(sys.argv[sys.argv.index('--detector') + 1] if '--detector' in sys.argv else 'http://localhost:8792/')
    elif cmd == 'check':
        check()
    elif cmd == 'migration':
        migration(*sys.argv[2:4])
    else:
        sys.exit(__doc__)
