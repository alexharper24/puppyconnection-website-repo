"""Crop the 4:3 and 5:4 photos to 3:2 and take the non-photos off their galleries (docs/batch-2026-11-02-post-launch.md,
n2-crop-preview). Alex approved the crops in the preview on 2026-11-01 and asked for the Bentley stud poster and the
Bred with H.E.A.R.T. badges to come off the seven puppy galleries they sit in.

Each crop keeps the full width and the same window the preview showed, a 3:2 band moved up or down around the
photo's stored focus point (ops/crop_preview.py). The original stays in R2 at its key as the record. The cropped
original goes beside it at <id>-crop32.<ext> with its .display, .card and .share copies (ops/photo_copies.py), and
the migration points the row at the new key with the new size, aspect and focus point. The seven non-photos are
removed from the photos table, as a breeder's Remove does, but their files stay in R2 and the audit log keeps each
whole row, so any one can be put back.

  python -I app/ops/crop_photos.py fetch  <backup.sql> <work folder>     originals not already local, from R2
  python -I app/ops/crop_photos.py make   <backup.sql> <work folder>     the cropped originals and their copies
  python -I app/ops/crop_photos.py upload <backup.sql> <work folder>     put them in R2, never over an existing key
  python -I app/ops/crop_photos.py sql    <backup.sql> <work folder> <out.sql>

The list is the crop preview's results.json (app/.state/crop-preview) less the seven. Every step skips what is done.
"""
import json, os, subprocess, sqlite3, sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from photo_copies import make  # noqa: E402
from PIL import Image  # noqa: E402

cmd, dump, work = sys.argv[1], sys.argv[2], sys.argv[3]
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE = os.environ.get('CROP_STATE') or os.path.join(APP, '.state')
WRANGLER = os.environ.get('WRANGLER_JS') or 'C:/Git_Repos/teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js'
BUCKET = 'puppyconnection-files'
os.environ.setdefault('CLOUDFLARE_ACCOUNT_ID', '4f6e9dc25ab751960763628b06e6c108')
LOCAL = [os.path.join(STATE, 'wix-photo-refresh', 'files'), os.path.join(STATE, 'wix-photo-copy', 'files')]
TYPES = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}

# Alex, 2026-11-01: not photos of the puppy. The Bentley stud poster on two Premier Paw Pals Yorkies and the AKC
# Bred with H.E.A.R.T. badge on three Perfect Match Poodles and two Chain O' Lakes Companions Havanese.
REMOVE = ['seed-p-0081-img7', 'seed-p-0250-img8', 'seed-p-0276-img9', 'seed-p-0295-img9',
          'seed-p-0280-img6', 'seed-p-0294-img8', 'seed-p-0297-img8']

os.makedirs(work, exist_ok=True)
db = sqlite3.connect(':memory:')
db.executescript(open(dump, encoding='utf8').read())
db.row_factory = sqlite3.Row
ids = [r['id'] for r in json.load(open(os.path.join(STATE, 'crop-preview', 'results.json'))) if r['id'] not in REMOVE]
rows = {r['id']: r for r in db.execute(f"SELECT * FROM photos WHERE id IN ({','.join('?' * len(ids))})", ids)}
assert len(rows) == len(ids), f'{len(ids) - len(rows)} photos in the list are no longer in the backup'


def ext(row):
    return row['r2_key'].rsplit('.', 1)[-1].lower()


def new_key(row):
    base, e = row['r2_key'].rsplit('.', 1)
    return f'{base}-crop32.{e}'


def wrangler(*args):
    return subprocess.run(['node', WRANGLER, *args], capture_output=True, text=True)


def original(pid):
    for d in LOCAL + [work]:
        p = os.path.join(d, f'{pid}.orig')
        if os.path.exists(p):
            return p
        p = os.path.join(d, f'{pid}.full')
        if d != work and os.path.exists(p):
            return p
    return None


def window(row):
    """The 3:2 band, as crop_preview.py draws it: full width, centred on focus_y and kept inside the photo."""
    w, h = row['width'], row['height']
    nh = round(w / 1.5)
    keep = nh / h
    centre = row['focus_y'] if row['focus_y'] is not None else 0.5
    top = min(max(centre - keep / 2, 0), 1 - keep)
    return w, nh, round(top * h)


if cmd == 'fetch':
    for pid in ids:
        if original(pid):
            continue
        out = os.path.join(work, f'{pid}.orig')
        r = wrangler('r2', 'object', 'get', f"{BUCKET}/{rows[pid]['r2_key']}", '--file', out, '--remote')
        print(pid, 'ok' if r.returncode == 0 and os.path.exists(out) else f'FAILED {r.stderr[-300:]}', flush=True)

elif cmd == 'make':
    made = {}
    for pid in ids:
        row = rows[pid]
        src = original(pid)
        img = Image.open(src)
        assert img.size == (row['width'], row['height']), f"{pid}: file {img.size} against row {row['width']}x{row['height']}"
        w, nh, top = window(row)
        assert 0 <= top and top + nh <= row['height'] and nh < row['height']
        crop = img.crop((0, top, w, top + nh))
        e = ext(row)
        full = os.path.join(work, f'{pid}.full')  # photo_copies.make reads <id>.full and writes the copies beside it
        if not os.path.exists(full):
            fmt = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'webp': 'WEBP'}[e]
            kw = {'quality': 92, 'optimize': True} if fmt == 'JPEG' else {'quality': 92} if fmt == 'WEBP' else {}
            if fmt == 'JPEG' and crop.mode not in ('RGB', 'L'):
                crop = crop.convert('RGB')
            icc = img.info.get('icc_profile')
            if icc:
                kw['icc_profile'] = icc
            crop.save(full + '.tmp', fmt, **kw)
            os.replace(full + '.tmp', full)
        made[pid] = {'top': top, 'w': w, 'h': nh, **make(work, pid)}
    json.dump(made, open(os.path.join(work, 'made.json'), 'w'), indent=1)
    print(len(made), 'made')

elif cmd == 'upload':
    done_f = os.path.join(work, 'uploaded.json')
    done = set(json.load(open(done_f))) if os.path.exists(done_f) else set()
    taken = {r[0] for r in db.execute('SELECT r2_key FROM photos WHERE r2_key IS NOT NULL')}
    for pid in ids:
        k = new_key(rows[pid])
        assert k not in taken, f'{k} is already a photo row key'
        for suffix, f, t in (('', f'{pid}.full', TYPES[ext(rows[pid])]), ('.display', f'{pid}.display.webp', 'image/webp'),
                             ('.card', f'{pid}.card.webp', 'image/webp'), ('.share', f'{pid}.share.jpg', 'image/jpeg')):
            key = k + suffix
            if key in done:
                continue
            r = wrangler('r2', 'object', 'put', f'{BUCKET}/{key}', '--file', os.path.join(work, f), '--content-type', t, '--remote')
            if r.returncode != 0:
                sys.exit(f'{key}: {r.stderr[-300:]}')
            done.add(key)
            json.dump(sorted(done), open(done_f, 'w'))
        print(pid, 'up', flush=True)

elif cmd == 'sql':
    out = sys.argv[4]
    made = json.load(open(os.path.join(work, 'made.json')))
    stamp = datetime.now(timezone.utc).replace(microsecond=0).strftime('%Y-%m-%dT%H:%M:%SZ')
    q = lambda s: 'NULL' if s is None else "'" + str(s).replace("'", "''") + "'"
    first = rows[ids[0]]
    lines = [
        "-- Alex, 2026-11-01 (docs/batch-2026-11-02-post-launch.md, n2-crop-preview). The 4:3 and 5:4 photos of listed puppies",
        "-- he approved in the crop preview move to their 3:2 crops, and the seven non-photos (the Bentley stud poster and the",
        "-- Bred with H.E.A.R.T. badges) come off their galleries. Written by app/ops/crop_photos.py from",
        f"-- {os.path.basename(dump)}, generated {stamp}. The cropped files are already in R2 beside the originals, which stay.",
        "-- Each removed row is kept whole in the audit log, and its files stay in R2, so it can be put back.",
        "-- Every write is guarded on the value it replaces, so a second run changes nothing.",
        "-- The publish marker goes first, guarded on the first photo still holding its old key.",
        f"UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, {q(stamp)}), generation = generation + 1\n"
        f"  WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE id = {q(first['id'])} AND r2_key = {q(first['r2_key'])});",
        '',
    ]
    cols = [c[1] for c in db.execute('PRAGMA table_info(photos)')]
    for pid in REMOVE:
        whole = 'json_object(' + ', '.join(f"'{c}', {c}" for c in cols) + ')'
        lines.append(f"INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
                     f"  SELECT {q(stamp)}, 'system', 'claude', 'photo.remove', 'puppy', puppy_id, {whole}, json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')\n"
                     f"    FROM photos WHERE id = {q(pid)};")
        lines.append(f"DELETE FROM photos WHERE id = {q(pid)};")
    lines.append('')
    for pid in ids:
        r, m = rows[pid], made[pid]
        fy = None if r['focus_y'] is None else round(min(max((r['focus_y'] * r['height'] - m['top']) / m['h'], 0), 1), 4)
        k = new_key(r)
        size = os.path.getsize(os.path.join(work, f'{pid}.full'))
        lines.append(f"INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
                     f"  SELECT {q(stamp)}, 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,\n"
                     f"    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),\n"
                     f"    json_object('photo', id, 'r2_key', {q(k)}, 'width', {m['w']}, 'height', {m['h']}, 'focus_y', {fy if fy is not None else 'NULL'}, 'top_px', {m['top']})\n"
                     f"    FROM photos WHERE id = {q(pid)} AND r2_key = {q(r['r2_key'])};")
        lines.append(f"UPDATE photos SET r2_key = {q(k)}, width = {m['w']}, height = {m['h']}, aspect = {round(m['w'] / m['h'], 4)}, "
                     f"focus_y = {fy if fy is not None else 'NULL'}, bytes = {size}\n  WHERE id = {q(pid)} AND r2_key = {q(r['r2_key'])};")
    open(out, 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
    print(f'{len(ids)} crops, {len(REMOVE)} removed ->', out)
