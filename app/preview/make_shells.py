# Builds the two shell options for the portal and admin (build-out plan D1) from real listings.
# Run from the repo root:  python app/preview/make_shells.py
# Writes app/preview/shell-a.html, shell-b.html and shell-options.html. Preview only, never
# deployed, and deleted once Alex picks one.
import html, io, json

L = json.load(open('_harvest/data/listings.json', encoding='utf-8'))
L = [x for x in L if x.get('images')][:25]
STATE = ['Live', 'Live', 'Live', 'Expiring', 'Live', 'Draft', 'Live', 'On hold']
PILL = {'Live': 'ok', 'Expiring': 'warn', 'Draft': 'quiet', 'On hold': 'alert'}
BREEDERS = ['Peaceful Paws Puppies', 'Chain O Lakes Companions', 'Kingdom Family Companions', 'Responsible Dog Breeder', 'Maple Hollow Doodles']
e = html.escape


def thumb(u):
    base = u.split('/v1/')[0]
    return base + '/v1/fill/w_96,h_72,al_t,q_80,enc_auto/i.jpg'


def rows():
    out = []
    for i, x in enumerate(L):
        st = STATE[i % len(STATE)]
        out.append(
            f'<tr tabindex="0"><td><img class="thumb" src="{e(thumb(x["images"][0]))}" alt="" width="48" height="36" loading="lazy"></td>'
            f'<td><b>{e(x.get("puppy_name") or "")}</b><span class="sub">{e(x.get("breed") or "")}</span></td>'
            f'<td class="hide-sm">{e(BREEDERS[i % len(BREEDERS)])}</td>'
            f'<td class="num">${x.get("price") or 0:,.0f}</td>'
            f'<td><span class="pill pill-{PILL[st]}">{st}</span></td>'
            f'<td class="num muted hide-md">Dec {1 + i % 27}, 2026</td>'
            f'<td class="act hide-sm"><button class="btn btn-sm">Open</button></td></tr>')
    return '\n'.join(out)


NAV = [('Today', [('Overview', '', False), ('Approvals', '3', False)]),
       ('Directory', [('Breeders', '42', False), ('Listings', '274', True), ('Breeds', '', False)]),
       ('Money', [('Payments', '', False), ('Reports', '', False)]),
       ('Site', [('Publish', '', False), ('Settings', '', False), ('Activity', '', False)])]


def nav():
    out = []
    for g, items in NAV:
        out.append(f'<div class="nav-group">{g}</div>')
        for name, n, on in items:
            out.append(f'<a href="#"{" class=is-on aria-current=page" if on else ""}><span>{name}</span>{f"<span class=tally>{n}</span>" if n else ""}</a>')
    return '\n'.join(out)


BODY = """
<div class="app">
  <aside class="rail" aria-label="Main menu">
    <div class="rail-head"><img src="{logo}" alt="Puppy Connection" width="420" height="203"><span class="role">Operator</span></div>
    <nav class="nav">{nav}</nav>
    <div class="rail-foot"><span class="dot"></span><div><b>Site up to date</b><span>Published 2 minutes ago</span></div></div>
  </aside>
  <div class="main">
    <header class="topbar">
      <label class="finder"><span class="sr">Search breeders and puppies</span><input type="search" placeholder="Search breeders, puppies, emails"></label>
      <div class="who"><span>Amber</span><button class="btn btn-sm">Sign out</button></div>
    </header>
    <div class="work"><div class="view">
      <div class="page-head">
        <div><h1>Listings</h1><p class="lede">Every puppy on the site, with where it stands and when it runs out.</p></div>
        <div class="head-actions"><button class="btn">Download CSV</button></div>
      </div>
      <div class="stats">
        <div class="stat"><b>231</b><span>Live on the site</span></div>
        <div class="stat"><b>18</b><span>Expiring in 14 days</span></div>
        <div class="stat"><b>21</b><span>Drafts not yet paid</span></div>
        <div class="stat"><b>4</b><span>On hold</span></div>
      </div>
      <section class="panel">
        <div class="toolbar">
          <input type="search" placeholder="Puppy or breeder" aria-label="Filter by puppy or breeder">
          <select aria-label="Breed"><option>All breeds</option><option>Havanese</option><option>Cavapoo</option></select>
          <div class="seg" role="group" aria-label="State"><button class="on">All</button><button>Live</button><button>Expiring</button><button>Drafts</button><button>On hold</button></div>
          <span class="count muted">1 to 25 of 274</span>
        </div>
        <div class="table-wrap"><table class="list">
          <thead><tr><th></th><th>Puppy</th><th class="hide-sm">Breeder</th><th class="num">Price</th><th>State</th><th class="num hide-md">Runs until</th><th class="hide-sm"></th></tr></thead>
          <tbody>{rows}</tbody>
        </table></div>
        <div class="pager"><button class="btn btn-sm" disabled>Previous</button><span class="muted">Page 1 of 11</span><button class="btn btn-sm">Next</button></div>
      </section>
    </div></div>
  </div>
</div>"""

BASE = """
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font: 15px/1.5 var(--sans); color: var(--ink); background: var(--ground); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
h1 { font: 600 1.6rem/1.2 var(--serif); margin: 0; text-wrap: balance; }
.muted { color: var(--muted); }
.app { display: grid; grid-template-columns: var(--rail) minmax(0, 1fr); min-height: 100dvh; }
.rail { position: sticky; top: 0; height: 100dvh; display: flex; flex-direction: column; }
.rail-head { padding: 1.2rem 1.2rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
.rail-head img { width: 9.5rem; height: auto; display: block; }
.rail-head .role { font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; }
.nav { flex: 1; overflow-y: auto; padding: .2rem .7rem 1rem; display: grid; gap: 2px; align-content: start; }
.nav-group { font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; padding: 1rem .7rem .35rem; }
.nav a { display: flex; justify-content: space-between; align-items: center; min-height: 40px; padding: .45rem .7rem; border-radius: 8px; text-decoration: none; font-weight: 550; }
.nav .tally { font-size: .75rem; font-variant-numeric: tabular-nums; padding: .05rem .5rem; border-radius: 999px; }
.rail-foot { display: flex; gap: .6rem; align-items: flex-start; padding: .9rem 1.2rem; font-size: .8rem; }
.rail-foot b { display: block; } .rail-foot span { display: block; }
.rail-foot .dot { width: 9px; height: 9px; border-radius: 50%; background: #4f9a63; margin-top: .35rem; flex: none; }
.main { min-width: 0; display: flex; flex-direction: column; }
.topbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 1rem; padding: .7rem clamp(1rem, 2.5vw, 2.25rem); }
.finder { flex: 1 1 0; max-width: 32rem; }
.finder input, .toolbar input, .toolbar select { width: 100%; min-height: 40px; padding: .45rem .7rem; border-radius: 8px; font: inherit; border: 1px solid var(--line-strong); background: #fff; color: var(--ink); }
.who { margin-left: auto; display: flex; align-items: center; gap: .7rem; font-size: .9rem; }
.work { flex: 1; padding: 1.6rem clamp(1rem, 2.5vw, 2.25rem) 4rem; }
.view { max-width: 92rem; margin-inline: auto; }
.page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.2rem; }
.lede { margin: .25rem 0 0; color: var(--muted); max-width: 60ch; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .8rem; margin-bottom: 1.2rem; }
.stat { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: .9rem 1.1rem; }
.stat b { display: block; font: 600 1.7rem/1.1 var(--serif); font-variant-numeric: tabular-nums; }
.stat span { font-size: .85rem; color: var(--muted); }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.toolbar { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; padding: .8rem 1rem; border-bottom: 1px solid var(--line); }
.toolbar input { flex: 1 1 14rem; width: auto; } .toolbar select { flex: 0 1 12rem; width: auto; }
.toolbar .count { margin-left: auto; font-size: .85rem; }
.seg { display: inline-flex; border: 1px solid var(--line-strong); border-radius: 8px; overflow: hidden; }
.seg button { border: 0; background: #fff; padding: .45rem .75rem; min-height: 40px; font: 500 .85rem var(--sans); cursor: pointer; color: var(--ink); }
.seg button + button { border-left: 1px solid var(--line-strong); }
.table-wrap { overflow-x: auto; }
table.list { width: 100%; border-collapse: collapse; font-size: .92rem; }
table.list th { text-align: left; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 600; padding: .65rem 1rem; border-bottom: 1px solid var(--line); white-space: nowrap; }
table.list td { padding: .55rem 1rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
table.list tbody tr { cursor: pointer; }
table.list tr:hover td, table.list tr:focus-visible td { background: var(--row-hover); }
table.list tr:focus-visible { outline: 3px solid #bc9b5d; outline-offset: -3px; }
table.list td b { display: block; font-weight: 600; } .sub { font-size: .82rem; color: var(--muted); }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.act { text-align: right; width: 1%; }
.thumb { width: 48px; height: 36px; object-fit: cover; border-radius: 6px; display: block; background: var(--line); }
.pill { display: inline-block; padding: .1rem .55rem; border-radius: 999px; font-size: .76rem; font-weight: 600; white-space: nowrap; }
.pill-ok { background: #e4efe7; color: #2f6140; } .pill-warn { background: #fbf0d3; color: #7d5f12; }
.pill-alert { background: #f6e3de; color: #92402f; } .pill-quiet { background: #eceae4; color: #55524b; }
.pager { display: flex; justify-content: flex-end; align-items: center; gap: .8rem; padding: .7rem 1rem; font-size: .88rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: .45rem 1rem; border-radius: 8px; border: 1px solid var(--line-strong); background: #fff; color: var(--ink); font: 500 .9rem var(--sans); cursor: pointer; }
.btn-sm { min-height: 34px; padding: .25rem .7rem; font-size: .84rem; }
.btn[disabled] { opacity: .45; }
@media (max-width: 860px) {
  .app { grid-template-columns: minmax(0, 1fr); }
  .rail { position: static; height: auto; }
  .rail-head { flex-direction: row; align-items: center; justify-content: space-between; padding: .8rem 1rem; }
  .rail-head img { width: 7.5rem; }
  .nav { display: flex; overflow-x: auto; padding: 0 .6rem .6rem; gap: .3rem; }
  .nav-group, .rail-foot { display: none; }
  .nav a { flex: none; gap: .5rem; }
  .finder { max-width: none; }
}
@media (max-width: 1100px) { .hide-md { display: none; } }
@media (max-width: 700px) {
  .hide-sm { display: none; }
  table.list td, table.list th { padding-inline: .4rem; }
  table.list td:first-child, table.list th:first-child { padding-left: .7rem; }
  .thumb { width: 40px; height: 30px; }
  table.list th { letter-spacing: .04em; }
  .pill { padding: .1rem .45rem; }
  .toolbar .seg { order: 3; overflow-x: auto; max-width: 100%; }
  .toolbar .count { margin-left: 0; }
  .page-head .head-actions { width: 100%; }
}
"""

A = """
:root { color-scheme: light only; --sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; --serif: Georgia, 'Times New Roman', serif;
  --ink: #262626; --muted: #6b665c; --ground: #f5f2ea; --surface: #fff; --line: #e4dfd3; --line-strong: #cfc8b7; --row-hover: #fbf9f3;
  --rail: 15.5rem; --rail-bg: #262626; --rail-ink: #f3efe4; --rail-soft: #b9b2a2; --gold: #f7d57f; }
.rail { background: var(--rail-bg); color: var(--rail-ink); }
.rail-head .role { color: var(--gold); }
.nav-group { color: var(--rail-soft); }
.nav a { color: var(--rail-soft); }
.nav a:hover { background: rgba(255,255,255,.07); color: #fff; }
.nav a.is-on { background: rgba(247,213,127,.14); color: #fff; box-shadow: inset 3px 0 0 var(--gold); }
.nav .tally { background: rgba(255,255,255,.1); color: var(--rail-ink); }
.nav a.is-on .tally { background: var(--gold); color: #262626; }
.rail-foot { border-top: 1px solid rgba(255,255,255,.1); color: var(--rail-soft); } .rail-foot b { color: #fff; }
.topbar { background: rgba(245,242,234,.92); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); }
.seg button.on { background: #262626; color: #fff; }
"""

B = """
:root { color-scheme: light only; --sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; --serif: Georgia, 'Times New Roman', serif;
  --ink: #262626; --muted: #6b665c; --ground: #fcfbf7; --surface: #fff; --line: #e8e2d4; --line-strong: #d3cbb8; --row-hover: #fbf7ec;
  --rail: 15.5rem; --cream: #f5f0e2; --olive: #6e5e36; --gold: #f7d57f; --bronze: #bc9b5d; }
.rail { background: var(--cream); border-right: 1px solid var(--line); }
.rail-head .role { color: var(--olive); }
.nav-group { color: var(--olive); opacity: .8; }
.nav a { color: #3b3933; }
.nav a:hover { background: rgba(188,155,93,.14); }
.nav a.is-on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(60,50,20,.08), inset 3px 0 0 var(--bronze); }
.nav .tally { background: rgba(110,94,54,.12); color: var(--olive); }
.nav a.is-on .tally { background: var(--gold); color: #262626; }
.rail-foot { border-top: 1px solid var(--line); color: var(--muted); } .rail-foot b { color: var(--ink); }
.topbar { background: rgba(252,251,247,.94); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); }
.seg button.on { background: var(--gold); color: #262626; font-weight: 600; }
"""


def page(title, css, logo):
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>{title} | Puppy Connection shell preview</title><style>{css}{BASE}</style></head>
<body>{BODY.format(logo=logo, nav=nav(), rows=rows())}</body></html>"""


io.open('app/preview/shell-a.html', 'w', encoding='utf-8').write(page('Option A, dark menu', A, '../../img/brand/r/logo-white-420.webp'))
io.open('app/preview/shell-b.html', 'w', encoding='utf-8').write(page('Option B, cream menu', B, '../../img/brand/logo-charcoal-trim.png'))
io.open('app/preview/shell-options.html', 'w', encoding='utf-8').write("""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Shell options | Puppy Connection</title>
<style>body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#eeeae0;color:#262626}header{padding:1rem 1.5rem}h1{font:600 1.3rem Georgia,serif;margin:0 0 .2rem}
p{margin:0;color:#5f5a50;max-width:80ch}.row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:0 1.5rem 1.5rem}figure{margin:0}
figcaption{font-weight:600;margin:.4rem 0}figcaption a{font-weight:400;margin-left:.5rem}.frame{height:720px;overflow:hidden;border:1px solid #cfc8b7;border-radius:10px;background:#fff}
iframe{width:1440px;height:1440px;border:0;transform:scale(.5);transform-origin:0 0}.phones{display:flex;gap:1.5rem;padding:0 1.5rem 2rem;flex-wrap:wrap}
.phones iframe{width:390px;height:780px;transform:none;border:1px solid #cfc8b7;border-radius:18px;background:#fff}</style></head><body>
<header><h1>Two looks for the breeder portal and the admin</h1><p>Both show the admin Listings screen with real listings, at 1440 px wide scaled to half, and below at phone width.
The layout fixes are the same in both, meaning centered content, the logo, a grouped menu, search, filters and paging. Only the menu and accents differ.</p></header>
<div class="row"><figure><figcaption>Option A, dark menu like the Teapup editor<a href="shell-a.html">open full size</a></figcaption><div class="frame"><iframe src="shell-a.html" title="Option A"></iframe></div></figure>
<figure><figcaption>Option B, cream menu in the site's colors<a href="shell-b.html">open full size</a></figcaption><div class="frame"><iframe src="shell-b.html" title="Option B"></iframe></div></figure></div>
<div class="phones"><iframe src="shell-a.html" title="Option A at phone width"></iframe><iframe src="shell-b.html" title="Option B at phone width"></iframe></div>
</body></html>""")
print('wrote shell-a.html, shell-b.html, shell-options.html')
