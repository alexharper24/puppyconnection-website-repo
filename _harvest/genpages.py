# Composes the concept-build pages from index.html's head/header/footer plus
# the bodies in pages.py. One-time scaffold; output is plain static HTML.
# Change index.html first, then re-run this.
import io
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pages  # noqa: E402

CSS_V, JS_V, DATA_V = 18, 20, 7

src = io.open('index.html', encoding='utf-8').read()
head = src.split('<title>')[0]
hdr = src[src.index('<div class="demo-flag">'):src.index('<section class="hero">')]
ftr = src[src.index('<footer class="site-footer">'):src.index('</footer>') + len('</footer>')]

FONTS = (
    # every puppy photo is on this origin; open the connection before we need it
    '<link rel="preconnect" href="https://static.wixstatic.com" crossorigin>\n'
    '<link rel="dns-prefetch" href="https://static.wixstatic.com">\n'
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600'
    '&family=Barlow:wght@400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,500'
    '&display=swap" rel="stylesheet">\n'
    '<link rel="stylesheet" href="css/style.css?v=%d">\n' % CSS_V
)


def page(fn, title, desc, body, current=None):
    h = hdr
    if current:
        h = h.replace('href="%s"' % current, 'href="%s" aria-current="page"' % current, 1)
    out = (head + '<title>' + title + '</title>\n'
           + '<meta name="description" content="' + desc + '">\n'
           + FONTS + '</head>\n<body>\n\n'
           + h + body + '\n\n' + ftr
           + '\n<script src="data/data.js?v=%d"></script>\n' % DATA_V
           + '<script src="js/main.js?v=%d"></script>\n</body>\n</html>\n' % JS_V)
    io.open(fn, 'w', encoding='utf-8').write(out)
    print('  %-22s %6d bytes' % (fn, len(out)))


page('puppies.html', 'Available puppies | Puppy Connection',
     'Browse puppies listed by small family breeders. Filter by breed and price, then contact the breeder directly.',
     pages.PUPPIES, 'puppies.html')
page('puppy.html', 'Puppy | Puppy Connection',
     'Puppy listing detail.', pages.PUPPY)
page('breeders.html', 'Breeders | Puppy Connection',
     'The small family breeders who raise and sell the puppies listed on Puppy Connection.',
     pages.BREEDERS_INDEX, 'breeders.html')
page('breeder.html', 'Breeder | Puppy Connection',
     'Breeder profile and their current listings.', pages.BREEDER)
page('breeds.html', 'Breeds | Puppy Connection',
     'Every breed currently listed on Puppy Connection, with guides and what is available now.',
     pages.BREEDS_INDEX, 'breeds.html')
page('breed.html', 'Breed | Puppy Connection',
     'Breed guide and available puppies.', pages.BREED)
page('list-with-us.html', 'List your puppies | Puppy Connection',
     'List your litter where families are already searching. $14.99 per puppy, and every enquiry goes to you.',
     pages.LIST, 'list-with-us.html')

# keep index.html's own asset versions in step
idx = io.open('index.html', encoding='utf-8').read()
idx = re.sub(r'css/style\.css\?v=\d+', 'css/style.css?v=%d' % CSS_V, idx)
idx = re.sub(r'js/main\.js\?v=\d+', 'js/main.js?v=%d' % JS_V, idx)
idx = re.sub(r'data/data\.js\?v=\d+', 'data/data.js?v=%d' % DATA_V, idx)
io.open('index.html', 'w', encoding='utf-8').write(idx)
print('  index.html asset versions synced')
