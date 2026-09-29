"""WebP derivatives for the local brand images, plus the social share card.

Listing photos are served by the Wix CDN with enc_auto, so they already arrive as AVIF or
WebP at the size each slot asks for. These are the only images the concept serves itself.

    python _harvest/brand_images.py
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'img', 'brand')
OUT = os.path.join(SRC, 'r')
os.makedirs(OUT, exist_ok=True)

INK = (38, 38, 38)   # --ink in css/style.css


def webp(src, widths, quality):
    im = Image.open(os.path.join(SRC, src))
    stem = os.path.splitext(src)[0]
    made = []
    for w in widths:
        if w > im.width:
            continue
        h = round(im.height * w / im.width)
        dst = os.path.join(OUT, '%s-%d.webp' % (stem, w))
        im.resize((w, h), Image.LANCZOS).save(dst, 'WEBP', quality=quality, method=6)
        made.append((os.path.basename(dst), os.path.getsize(dst)))
    return made


def og_card():
    """1200x630, the white wordmark centred on the brand charcoal."""
    card = Image.new('RGB', (1200, 630), INK)
    logo = Image.open(os.path.join(SRC, 'logo-white.png')).convert('RGBA')
    w = 760
    logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    card.paste(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2), logo)
    dst = os.path.join(SRC, 'og-card.jpg')
    card.save(dst, 'JPEG', quality=86, optimize=True, progressive=True)
    return os.path.basename(dst), os.path.getsize(dst)


if __name__ == '__main__':
    rows = []
    rows += webp('hero-home.jpg', (800, 1400, 2000, 2400), 78)
    # displayed at most 208px wide, so 420 covers a 2x screen and 900 covers 4x
    rows += webp('logo-white.png', (420, 900), 88)
    rows.append(og_card())
    for name, size in rows:
        print('  %-28s %6.1f KB' % (name, size / 1024))
