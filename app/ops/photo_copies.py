# The served copies of an imported photo (workplan C2, Alex 2026-10-23), made from the stripped
# original that ops/copy-wix-photos.mjs keeps in app/.state/wix-photo-copy/files/<id>.full.
#
# The original stays in R2 as the record, at the row's r2_key. The site serves these instead, the
# same sizes the portal draws for a breeder's own upload (portal.js FULL_EDGE and CARD_EDGE):
#   <id>.display.webp  at most 1600 px on its longest edge, WebP quality 82, for the puppy page
#                      and every slot wider than 640 px (/media/<id>)
#   <id>.card.webp     at most 640 px, WebP quality 82, for cards and thumbnails (/media/<id>/card)
#   <id>.share.jpg     at most 1200 px, JPEG quality 82, for og:image, because not every site that
#                      reads a shared link takes WebP (/media/<id>/share)
# Nothing is ever enlarged, and the shape is kept, so a photo's focus point frames it the same way.
# A copy already made is not made again.
#
#   python -I app/ops/photo_copies.py <files folder> <photo id> [<photo id> ...]
#
# Prints one JSON line per photo: {"id", "display": [w, h, bytes], "card": [...], "share": [...]}.
import json, os, sys

from PIL import Image

SIZES = (('display', 1600, 'WEBP', 'webp'), ('card', 640, 'WEBP', 'webp'), ('share', 1200, 'JPEG', 'jpg'))


def make(folder, pid):
    out = {'id': pid}
    src = os.path.join(folder, f'{pid}.full')
    img = None
    for name, edge, fmt, ext in SIZES:
        dst = os.path.join(folder, f'{pid}.{name}.{ext}')
        if not os.path.exists(dst):
            if img is None:
                img = Image.open(src)
                img.load()
            k = min(1.0, edge / max(img.size))
            im = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS) if k < 1 else img.copy()
            if fmt == 'JPEG' or im.mode not in ('RGB', 'RGBA'):
                if im.mode in ('RGBA', 'LA', 'P'):
                    im = im.convert('RGBA')
                    flat = Image.new('RGB', im.size, (255, 255, 255))
                    flat.paste(im, mask=im.split()[3])
                    im = flat if fmt == 'JPEG' else im
                else:
                    im = im.convert('RGB')
            tmp = dst + '.tmp'
            if fmt == 'WEBP':
                im.save(tmp, 'WEBP', quality=82, method=6)
            else:
                im.save(tmp, 'JPEG', quality=82, optimize=True, progressive=True)
            os.replace(tmp, dst)
        with Image.open(dst) as d:
            out[name] = [d.width, d.height, os.path.getsize(dst)]
    return out


if __name__ == '__main__':
    folder = sys.argv[1]
    for pid in sys.argv[2:]:
        try:
            print(json.dumps(make(folder, pid)), flush=True)
        except Exception as e:
            print(json.dumps({'id': pid, 'error': str(e)}), flush=True)
