"""Stage, upload and read back the mom and dad photos for the Wix parent pass (Alex, 2026-11-13,
docs/batch-2026-11-13-wix-parent-photos.md).

  python -X utf8 app/ops/wix_parent_photos.py plan   <evidence folder> <state folder>
  python -X utf8 app/ops/wix_parent_photos.py stage  <state folder>
  python -X utf8 app/ops/wix_parent_photos.py upload <state folder>
  python -X utf8 app/ops/wix_parent_photos.py verify <state folder>

plan keeps only the parents and litters that both determined.json (ops/wix_parent_match.py) and the independent
second_pass.json reached, gives each new parent an id and its R2 key in the editors' layout
(parents/<breeder id>/<parent id>-<10 lowercase ulid chars>.webp, with a .card copy), and writes plan.json.
stage fetches each source photo (the puppy photo's R2 object, or the Wix original where the photo never came across
or only a 3:2 crop exists) and makes the two copies the editors' browser makes (portal.js shrink): the full photo at
1,600 px on its longest side and the card at 640 px, both WebP at quality 82, turned upright from the EXIF
orientation, converted to sRGB, with no metadata written. upload puts each object with wrangler, every key passed as
a subprocess argument from plan.json, never through a shell loop (2026-11-07 CR incident). verify gets each object
back and compares its size with the staged file.
"""
import io, json, os, random, subprocess, sys, time, urllib.request

WRANGLER = ['node', 'C:/Git_Repos/teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js']
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(APP, 'admin', 'wrangler.production.jsonc')
BUCKET = 'puppyconnection-files'
CROCK = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'


def ulid():
    t, out = int(time.time() * 1000), ''
    for _ in range(10):
        out = CROCK[t % 32] + out; t //= 32
    return out + ''.join(random.choice(CROCK) for _ in range(16))


def r2(*args, cwd=APP):
    r = subprocess.run(WRANGLER + ['r2', 'object', *args, '--remote', '--config', CONFIG], cwd=cwd,
                       capture_output=True, text=True, encoding='utf8')
    if r.returncode != 0:
        raise SystemExit(f'wrangler r2 {args[0]} failed: {r.stderr[-600:]}')
    return r.stdout


def plan(ev, state):
    det = json.load(open(os.path.join(ev, 'determined.json'), encoding='utf8'))
    sec = json.load(open(os.path.join(ev, 'second-pass', 'second_pass.json'), encoding='utf8'))
    agreed = {(o['breeder'], o['sex'], o['name'], l) for o in sec['determined'] for l in o['litter_ids']}
    out, held = [], []
    for o in det:
        links = [l for l in o['link_litters'] if (o['breeder'], o['sex'], o['name'], l) in agreed]
        if not links:
            held.append(o); continue
        if links != o['link_litters']:
            raise SystemExit(f"{o['name']}: the passes agree on some litters only, which this script does not handle")
        pid = o['existing_parent_id'] or ulid()
        out.append({**o, 'parent_id': pid, 'new': not o['existing_parent_id'],
                    'key': f"parents/{o['breeder_id']}/{pid}-{ulid()[-10:].lower()}.webp"})
        time.sleep(0.002)
    os.makedirs(state, exist_ok=True)
    json.dump({'parents': out, 'held_back': [{'breeder': h['breeder'], 'sex': h['sex'], 'name': h['name'],
               'litters': h['link_litters'], 'why': 'the independent second pass did not reach it'} for h in held]},
              open(os.path.join(state, 'plan.json'), 'w', encoding='utf8'), indent=1)
    print(f'plan: {len(out)} parents ({sum(1 for p in out if p["new"])} new), held back {[h["name"] for h in held]}')


def stage(state):
    from PIL import Image, ImageCms, ImageOps
    P = json.load(open(os.path.join(state, 'plan.json'), encoding='utf8'))
    src_dir = os.path.join(state, 'source'); os.makedirs(src_dir, exist_ok=True)
    out_dir = os.path.join(state, 'staged'); os.makedirs(out_dir, exist_ok=True)
    for p in P['parents']:
        s = p['photo_source']
        raw = os.path.join(src_dir, p['parent_id'] + '.src')
        if not os.path.exists(raw):
            if 'r2_key' in s:
                r2('get', f"{BUCKET}/{s['r2_key']}", '--file', raw)
            else:
                req = urllib.request.Request(s['wix_url'], headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=60) as r, open(raw, 'wb') as f:
                    f.write(r.read())
        im = Image.open(raw)
        im = ImageOps.exif_transpose(im)
        icc = im.info.get('icc_profile')
        if icc:
            try:
                im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), ImageCms.createProfile('sRGB'), outputMode='RGB')
            except Exception:
                pass
        im = im.convert('RGB')
        for edge, name in ((1600, 'full'), (640, 'card')):
            k = min(1, edge / max(im.size))
            c = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS) if k < 1 else im.copy()
            c.save(os.path.join(out_dir, f"{p['parent_id']}.{name}.webp"), 'WEBP', quality=82, method=6)
        src_size = Image.open(raw).size
        p['staged'] = {'source_size': list(src_size), 'source_bytes': os.path.getsize(raw)}
        print(f"  {p['breeder'][:20]:<20} {p['name']:<10} source {src_size[0]}x{src_size[1]} {os.path.getsize(raw):>8} B "
              f"-> full {os.path.getsize(os.path.join(out_dir, p['parent_id'] + '.full.webp')):>7} B")
    json.dump(P, open(os.path.join(state, 'plan.json'), 'w', encoding='utf8'), indent=1)


def upload(state):
    P = json.load(open(os.path.join(state, 'plan.json'), encoding='utf8'))
    d = os.path.join(state, 'staged')
    for p in P['parents']:
        for name, key in (('full', p['key']), ('card', p['key'] + '.card')):
            assert key.startswith('parents/') and key == key.strip() and '\r' not in key and '\n' not in key, repr(key)
            r2('put', f'{BUCKET}/{key}', '--file', os.path.join(d, f"{p['parent_id']}.{name}.webp"), '--content-type', 'image/webp')
            print('  put', key)


def verify(state):
    P = json.load(open(os.path.join(state, 'plan.json'), encoding='utf8'))
    d = os.path.join(state, 'staged'); back = os.path.join(state, 'readback'); os.makedirs(back, exist_ok=True)
    bad = 0
    for p in P['parents']:
        for name, key in (('full', p['key']), ('card', p['key'] + '.card')):
            got = os.path.join(back, f"{p['parent_id']}.{name}.webp")
            if os.path.exists(got): os.remove(got)
            r2('get', f'{BUCKET}/{key}', '--file', got)
            want = os.path.getsize(os.path.join(d, f"{p['parent_id']}.{name}.webp"))
            ok = os.path.getsize(got) == want and open(got, 'rb').read() == open(os.path.join(d, f"{p['parent_id']}.{name}.webp"), 'rb').read()
            bad += not ok
            print(f"  {'ok ' if ok else 'BAD'} {key} {os.path.getsize(got)} of {want} B")
    print('verify:', 'all match' if not bad else f'{bad} differ')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    cmd = sys.argv[1]
    {'plan': lambda: plan(sys.argv[2], sys.argv[3]), 'stage': lambda: stage(sys.argv[2]),
     'upload': lambda: upload(sys.argv[2]), 'verify': lambda: verify(sys.argv[2])}[cmd]()
