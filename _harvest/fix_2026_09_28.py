"""One-off fixes from the 2026-09-28 pass, brought in line with the live puppy sites.

Edits index.html (whose header and footer genpages.py copies into every page),
pages.py (the inner page bodies) and css/style.css. Each replacement asserts its anchor,
so a second run fails loudly instead of doubling anything.
"""
import io, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
done = []


def edit(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        assert s.count(old) == 1, 'anchor not unique or missing in %s: %r' % (path, old[:60])
        s = s.replace(old, new, 1)
        done.append((os.path.basename(path), old.strip()[:50]))
    io.open(path, 'w', encoding='utf-8').write(s)


LOGO = ('<picture><source type="image/webp" srcset="img/brand/r/logo-white-420.webp 420w, '
        'img/brand/r/logo-white-900.webp 900w" sizes="{sizes}">'
        '<img src="img/brand/logo-white.png" alt="Puppy Connection" width="{w}" height="{h}"></picture>')

# ---------------------------------------------------------------- index.html
edit(P('index.html'), [
    # skip link, first focusable thing on the page (the demo flag is not focusable)
    ('<div class="demo-flag">Concept build for review · not a live site</div>\n',
     '<div class="demo-flag">Concept build for review · not a live site</div>\n'
     '<a class="skip-link" href="#content">Skip to content</a>\n'),
    # header logo, displayed 150 to 208px wide
    ('<img src="img/brand/logo-white.png" alt="Puppy Connection" width="208" height="101">',
     LOGO.format(sizes='208px', w=208, h=101)),
    # the home page had no <main>; genpages now cuts the header at this tag
    ('<section class="hero">\n  <img class="hero-img" src="img/brand/hero-home.jpg" alt="A baby resting beside a puppy" width="2400" height="1014">',
     '<main id="home">\n<span id="content" tabindex="-1"></span>\n'
     '<section class="hero">\n  <picture><source type="image/webp" srcset="img/brand/r/hero-home-800.webp 800w, '
     'img/brand/r/hero-home-1400.webp 1400w, img/brand/r/hero-home-2000.webp 2000w, '
     'img/brand/r/hero-home-2400.webp 2400w" sizes="100vw">'
     '<img class="hero-img" src="img/brand/hero-home.jpg" alt="A baby resting beside a puppy" '
     'width="2400" height="1014" fetchpriority="high"></picture>'),
    ('</section>\n\n<footer class="site-footer">',
     '</section>\n</main>\n\n<footer class="site-footer">'),
    # footer logo, displayed at 190px
    ('<img src="img/brand/logo-white.png" alt="Puppy Connection" width="190" height="92">',
     LOGO.format(sizes='190px', w=190, h=92)),
    # footer headings jumped h2 to h4 on every page
    ('<h4>Browse</h4>', '<h2 class="foot-h">Browse</h2>'),
    ('<h4>Breeders</h4>', '<h2 class="foot-h">Breeders</h2>'),
])

# ---------------------------------------------------------------- pages.py
edit(P('_harvest', 'pages.py'), [
    # the browse filters jumped h1 to h3
    ('<h3>Breed</h3>', '<h2>Breed</h2>'),
    ('<h3>Price up to</h3>', '<h2>Price up to</h2>'),
    ('<h3>Availability</h3>', '<h2>Availability</h2>'),
    # list-with-us had no h1 at all
    ('<h2 style="font-size:clamp(2rem,4.4vw,3.2rem)">Helping responsible breeders connect with the right families</h2>',
     '<h1 style="font-size:clamp(2rem,4.4vw,3.2rem)">Helping responsible breeders connect with the right families</h1>'),
    # contradicted the settled workflow: the breeder is approved once, then paid listings publish
    ('$14.99 per puppy, paid for the litter in one checkout. Listings go live once reviewed.',
     '$14.99 per puppy, paid for the litter in one checkout. Once you are approved, a paid listing goes live as soon as the payment clears.'),
])

# ---------------------------------------------------------------- style.css
edit(P('css', 'style.css'), [
    ('.card:hover .card-media img{transform:scale(1.02);transition:transform .4s ease}',
     '/* hover only where there is a real pointer, or the zoom sticks after a tap on iOS */\n'
     '@media (hover:hover){.card:hover .card-media img{transform:scale(1.02);transition:transform .4s ease}}'),
    ('.rail h3{', '.rail h2{'),
    ('.rail h3:first-of-type{', '.rail h2:first-of-type{'),
    ('.site-footer h4{', '.site-footer .foot-h{'),
])
css = io.open(P('css', 'style.css'), encoding='utf-8').read()
css += '''
/* ---------- skip link, matching kingdomfamilycompanions ---------- */
.skip-link{position:absolute;left:-9999px;top:0;z-index:100;
  background:var(--ink);color:#fff;font-weight:600;font-size:15px;
  padding:12px 20px;border-radius:0 0 10px 0;text-decoration:none}
.skip-link:focus{left:0}
#content{display:block;height:0;outline:none}

/* the picture wrapper must not change how the logo and hero images size */
.brand picture,.site-footer picture,.hero picture{display:contents}

/* ---------- print ---------- */
@media print{
  .demo-flag,.skip-link,.site-header .nav,.burger,.rail,.rail-trigger,.rail-backdrop,
  .thumb-nav,.more-row,.site-footer nav{display:none!important}
  body{background:#fff;color:#000}
  a{color:#000;text-decoration:underline}
  .card,.breeder-box{break-inside:avoid}
}
'''
io.open(P('css', 'style.css'), 'w', encoding='utf-8').write(css)
done.append(('style.css', 'skip link, picture wrapper, print block appended'))

for f, what in done:
    print('  %-12s %s' % (f, what))
