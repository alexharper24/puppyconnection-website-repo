# Composes the concept-build pages from index.html's head/header/footer plus
# the bodies in pages.py. One-time scaffold; output is plain static HTML.
# Change index.html first, then re-run this.
import io
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pages  # noqa: E402

CSS_V, JS_V, DATA_V = 23, 26, 9

src = io.open('index.html', encoding='utf-8').read()
head = src.split('<title>')[0]
# the header runs to the home page's <main>, so the skip link travels with it
hdr = src[src.index('<div class="demo-flag">'):src.index('<main id="home">')]
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


# The review copy lives here until cutover. Change this one line at launch and every
# canonical, social tag, breadcrumb and sitemap entry follows.
BASE = 'https://alexharper24.github.io/puppyconnection-website-repo/'
OG_IMAGE = BASE + 'img/brand/og-card.jpg'

# Static pages get a canonical and a breadcrumb. The three query-string templates do not,
# because one canonical on puppy.html would tell Google every puppy is the same page.
CRUMB = {
    'puppies.html': 'Available puppies',
    'breeders.html': 'Breeders',
    'breeds.html': 'Breeds',
    'list-with-us.html': 'List your puppies',
}
MAIN_ID = {'puppies.html': 'browse', 'list-with-us.html': 'list-page'}
SITEMAP = ['index.html'] + list(CRUMB)


def social(title, desc, url):
    tags = ['<meta property="og:type" content="website">',
            '<meta property="og:site_name" content="Puppy Connection">',
            '<meta property="og:title" content="%s">' % title,
            '<meta property="og:description" content="%s">' % desc,
            '<meta property="og:image" content="%s">' % OG_IMAGE,
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">',
            '<meta name="twitter:card" content="summary_large_image">']
    if url:
        tags.insert(0, '<link rel="canonical" href="%s">' % url)
        tags.insert(4, '<meta property="og:url" content="%s">' % url)
    return '\n'.join(tags) + '\n'


def breadcrumb(fn):
    import json
    return ('<script type="application/ld+json">%s</script>\n' % json.dumps({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': CRUMB[fn], 'item': BASE + fn},
        ]}, separators=(',', ':')))


def with_main(fn, body):
    """Every page gets a <main> and, just inside it, the skip link's target."""
    if '<main' not in body:
        body = '<main id="%s">\n%s\n</main>' % (MAIN_ID[fn], body.strip('\n'))
    i = body.index('<main')
    j = body.index('>', i) + 1
    return body[:j] + '\n<span id="content" tabindex="-1"></span>' + body[j:]


def page(fn, title, desc, body, current=None):
    body = with_main(fn, body)
    url = BASE + fn if fn in CRUMB else None
    h = hdr
    if current:
        h = h.replace('href="%s"' % current, 'href="%s" aria-current="page"' % current, 1)
    out = (head + '<title>' + title + '</title>\n'
           + '<meta name="description" content="' + desc + '">\n'
           + social(title, desc, url)
           + (breadcrumb(fn) if fn in CRUMB else '')
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
     'List your litter where families are already searching. $14.99 per puppy, and every inquiry goes to you.',
     pages.LIST, 'list-with-us.html')

# keep index.html's own asset versions in step
idx = io.open('index.html', encoding='utf-8').read()
idx = re.sub(r'css/style\.css\?v=\d+', 'css/style.css?v=%d' % CSS_V, idx)
idx = re.sub(r'js/main\.js\?v=\d+', 'js/main.js?v=%d' % JS_V, idx)
idx = re.sub(r'data/data\.js\?v=\d+', 'data/data.js?v=%d' % DATA_V, idx)
import json as _json
HOME_LD = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Organization', '@id': BASE + '#org', 'name': 'Puppy Connection', 'url': BASE,
     'logo': BASE + 'img/brand/logo-charcoal-trim.png',
     'slogan': 'Connecting responsible breeders with loving families'},
    {'@type': 'WebSite', '@id': BASE + '#site', 'name': 'Puppy Connection', 'url': BASE,
     'publisher': {'@id': BASE + '#org'}}]}
home_title = re.search(r'<title>(.*?)</title>', idx).group(1)
home_desc = re.search(r'<meta name="description" content="([^"]*)">', idx).group(1)
block = ('<!-- seo:start, written by genpages.py -->\n'
         + social(home_title, home_desc, BASE)
         + '<script type="application/ld+json">%s</script>\n' % _json.dumps(HOME_LD, separators=(',', ':'))
         + '<!-- seo:end -->\n')
if '<!-- seo:start' in idx:
    idx = re.sub(r'<!-- seo:start.*?<!-- seo:end -->\n', lambda m: block, idx, flags=re.S)
else:
    anchor = '<meta name="description" content="%s">\n' % home_desc
    idx = idx.replace(anchor, anchor + block, 1)
io.open('index.html', 'w', encoding='utf-8').write(idx)
print('  index.html asset versions and seo block synced')

# the sitemap lists the static pages only, for the same reason as the canonicals
urls = ''.join('  <url><loc>%s</loc></url>\n' % (BASE if f == 'index.html' else BASE + f) for f in SITEMAP)
io.open('sitemap.xml', 'w', encoding='utf-8').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n')
print('  sitemap.xml  %d urls' % len(SITEMAP))
