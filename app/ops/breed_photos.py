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

# slug: (original file, focus x, focus y[, crop]). crop is (cx, cy, scale): the part of the original to keep, centered on
# (cx, cy) as fractions and scale times its width and height, for a photo whose dog sits off-center in a frame that already
# has the card's shape. The focus point is then read against the cropped photo.
PHOTOS = {
    'doberman-pinscher': ('20.jpg', .38, .55),
    'french-bulldog': ('1.jpg', .52, .55),
    'toy-poodle': ('2.jpg', .45, .55),
    'miniature-poodle': ('2_1.jpg', .50, .55),
    'yorkshire-terrier': ('Molly - Mom.jpg', .55, .55),
    'pomeranian': ('3.jpg', .45, .60),
    'basset-hound': ('IMG_4353.jpg', .45, .50),
    'cavalier-king-charles-spaniel': ('9.jpg', .50, .55),
    'pembroke-welsh-corgi': ('9_1.jpg', .60, .55),
    'miniature-dachshund': ('14.jpg', .55, .60),
    'great-dane': ('8 - Copy.jpg', .47, .50, (.41, .52, .88)),
    'shih-tzu': ('shih tzu1.jpeg', .55, .60),
    'cocker-spaniel': ('ChatGPT Image Oct 30, 2026, 05_06_49 PM-4.png', .55, .50),
    'english-bulldog': ('ChatGPT Image Oct 30, 2026, 05_06_48 PM-3.png', .53, .55),
    'bernese-mountain-dog': ('1_1.jpg', .52, .45),
    'boston-terrier': ('ChatGPT Image Oct 30, 2026, 05_06_47 PM-2.png', .55, .50),
    'golden-retriever': ('IMG_1830.jpg', .72, .55),
    'papillon': ('10.jpg', .55, .50, (.62, .47, .85)),
    'miniature-schnauzer': ('teapup-schnauzer.jpg', .50, .36),
    'saint-bernard': ('Benji1.jpg', .58, .45, (.56, .50, .88)),
    'labrador-retriever': ('spp-labrador.jpg', .55, .33),
    'havanese': ('4.jpg', .53, .55, (.55, .50, .92)),
}

# A breeder's own card and page photo (Alex, 2026-10-30): slug -> (original, focus x, focus y), written to
# img/breeders/<slug>-photo-800.webp and -1600.webp.
BREEDER_PHOTOS = {
    'teapup': ('teapup-schnauzer.jpg', .50, .36),
    'sweetpuppypaws': ('spp-lab-portrait.jpg', .50, .38),
}
OUT_B = os.path.join(REPO, 'img', 'breeders')


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
    for slug, (f, fx, fy, *crop) in PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f))).convert('RGB')
        if crop:
            cx, cy, k = crop[0]
            cw, ch = round(im.width * k), round(im.height * k)
            x = min(max(round(cx * im.width - cw / 2), 0), im.width - cw)
            y = min(max(round(cy * im.height - ch / 2), 0), im.height - ch)
            im = im.crop((x, y, x + cw, y + ch))
        for width in (800, 1600):
            c = im.copy()
            if c.width > width:
                c = c.resize((width, round(c.height * width / c.width)), Image.LANCZOS)
            c.save(os.path.join(OUT, f'{slug}-{width}.webp'), 'WEBP', quality=82, method=6)
            if width == 1600:
                table[slug] = {'file': f'img/breeds/{slug}', 'w': c.width, 'h': c.height, 'fx': fx, 'fy': fy}
    print(json.dumps(table, indent=1))
    btable = {}
    for slug, (f, fx, fy) in BREEDER_PHOTOS.items():
        im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f))).convert('RGB')
        for width in (800, 1600):
            c = im.copy()
            if c.width > width:
                c = c.resize((width, round(c.height * width / c.width)), Image.LANCZOS)
            c.save(os.path.join(OUT_B, f'{slug}-photo-{width}.webp'), 'WEBP', quality=82, method=6)
            if width == 1600:
                btable[slug] = {'w': c.width, 'h': c.height, 'fx': fx, 'fy': fy}
    print('---breeders---')
    print(json.dumps(btable, indent=1))
    if '--preview' in sys.argv:
        from PIL import ImageDraw
        d = os.environ['PREVIEW_DIR']
        names = list(PHOTOS)
        for n in range(0, len(names), 6):
            chunk = names[n:n + 6]
            sheet = Image.new('RGB', (2 * 720, 3 * 230), 'white')
            dr = ImageDraw.Draw(sheet)
            for i, slug in enumerate(chunk):
                im = Image.open(os.path.join(OUT, f'{slug}-1600.webp')).convert('RGB')
                t = table[slug]
                x0, y0 = (i % 2) * 720, (i // 2) * 230
                dr.text((x0 + 4, y0 + 2), slug, fill='black')
                x = x0 + 4
                for ratio, size in ((1.5, (300, 200)), (0.87, (174, 200)), (1.0, (200, 200))):
                    sheet.paste(window(im, ratio, t['fx'], t['fy']).resize(size, Image.LANCZOS), (x, y0 + 22)); x += size[0] + 6
            sheet.save(os.path.join(d, f'crops-{n // 6}.jpg'), quality=88)

main()
