"""Make the breed photos Alex chose (2026-10-30) into img/breeds/<slug>-800.webp and -1600.webp.

Reads the originals from _harvest/webedits (gitignored), writes the web copies and prints the
BREED_PHOTO table that app/build/generate.mjs carries (slug, file, w, h, focus point). The focus
point is where the subject sits, as a fraction of the saved photo, so every slot crops around it.

  python app/ops/breed_photos.py            write the WebP files and print the table
  python app/ops/breed_photos.py --preview  also write a contact sheet of every slot to the folder given by PREVIEW_DIR
"""
import os, sys, json
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(REPO, '_harvest', 'webedits')
OUT = os.path.join(REPO, 'img', 'breeds')

# slug: (original file, focus x, focus y)
PHOTOS = {
    'doberman-pinscher': ('20.jpg', .50, .55),
    'french-bulldog': ('1.jpg', .52, .55),
    'toy-poodle': ('2.jpg', .45, .55),
    'miniature-poodle': ('2_1.jpg', .65, .55),
    'yorkshire-terrier': ('Molly - Mom.jpg', .55, .55),
    'pomeranian': ('3.jpg', .45, .60),
    'basset-hound': ('IMG_4353.jpg', .45, .50),
    'cavalier-king-charles-spaniel': ('9.jpg', .50, .55),
    'pembroke-welsh-corgi': ('9_1.jpg', .60, .55),
    'miniature-dachshund': ('14.jpg', .55, .60),
    'great-dane': ('8 - Copy.jpg', .55, .50),
    'shih-tzu': ('shih tzu1.jpeg', .55, .60),
    'cocker-spaniel': ('cocker spaniel2.jpg', .50, .33),
    'english-bulldog': ('bulldog.jpg', .45, .38),
    'bernese-mountain-dog': ('1_1.jpg', .50, .45),
    'boston-terrier': ('boston terrier.jpg', .50, .36),
    'golden-retriever': ('IMG_1830.jpg', .72, .55),
    'papillon': ('10.jpg', .50, .50),
    'miniature-schnauzer': ('1_2.jpg', .50, .37),
    'saint-bernard': ('Benji1.jpg', .60, .45),
    'labrador-retriever': ('Jo Jo 3.jpg', .50, .36),
    'havanese': ('4.jpg', .50, .55),
}

def window(img, ratio, fx, fy):
    w, h = img.size
    if w / h > ratio:
        cw, ch = round(h * ratio), h
    else:
        cw, ch = w, round(w / ratio)
    x = min(max(round(fx * w - cw / 2), 0), w - cw)
    y = min(max(round(fy * h - ch / 2), 0), h - ch)
    return img.crop((x, y, x + cw, y + ch))

def main():
    table = {}
    for slug, (f, fx, fy) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f))).convert('RGB')
        for width in (800, 1600):
            c = im.copy()
            if c.width > width:
                c = c.resize((width, round(c.height * width / c.width)), Image.LANCZOS)
            c.save(os.path.join(OUT, f'{slug}-{width}.webp'), 'WEBP', quality=82, method=6)
            if width == 1600:
                table[slug] = {'file': f'img/breeds/{slug}', 'w': c.width, 'h': c.height, 'fx': fx, 'fy': fy}
    print(json.dumps(table, indent=1))
    if '--preview' in sys.argv:
        d = os.environ['PREVIEW_DIR']
        names = list(PHOTOS)
        for n, chunk in enumerate([names[:11], names[11:]]):
            W, H = 4 * 300, 3 * 4 * 0 + 0
            sheet = Image.new('RGB', (4 * 330, 11 * 0 + 3 * 560 // 1 + 0), 'white')
            sheet = Image.new('RGB', (4 * 330, 3 * 300), 'white')
            for i, slug in enumerate(chunk):
                im = Image.open(os.path.join(OUT, f'{slug}-1600.webp')).convert('RGB')
                t = table[slug]
                row = []
                for ratio, size in ((1.5, (150, 100)), (0.8, (80, 100)), (1.0, (100, 100)), (4 / 3, (133, 100))):
                    row.append(window(im, ratio, t['fx'], t['fy']).resize(size, Image.LANCZOS))
                x0, y0 = (i % 4) * 330, (i // 4) * 300
                x = x0 + 4
                for r in row:
                    sheet.paste(r, (x, y0 + 20)); x += r.width + 4
                # larger 3:2 below
                big = window(im, 1.5, t['fx'], t['fy']).resize((300, 200), Image.LANCZOS)
                sheet.paste(big, (x0 + 4, y0 + 125))
                from PIL import ImageDraw
                ImageDraw.Draw(sheet).text((x0 + 4, y0 + 4), slug, fill='black')
            sheet.save(os.path.join(d, f'breed-crops-{n}.jpg'), quality=88)

main()
