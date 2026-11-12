"""Build the before-and-after report for the mobile review (2026-11-11).

    python app/dev/mobile-review/report.py <before-dir> <after-dir> <batch.md> <out.html>

Each dir is a run.mjs output (results.json and shots/). Screenshots are embedded as small JPEGs so
the page is one file. The 1440 screenshots are compared pixel by pixel to show the desktop held.
"""
import base64, io, json, re, sys, html
from PIL import Image, ImageChops

before_dir, after_dir, batch, out = sys.argv[1:5]
B = json.load(open(f'{before_dir}/results.json', encoding='utf-8'))
A = json.load(open(f'{after_dir}/results.json', encoding='utf-8'))
PHONES = [360, 390, 430]

NAMES = {
  'p-signin': 'Sign in', 'p-forgot': 'Set a password', 'p-signup': 'Sign up', 'p-set-password': 'Password link page', 'p-privacy': 'Privacy',
  'p-terms-page': 'Listing terms page', 'p-report': 'Report a listing', 'p-checkout-cancel': 'Checkout canceled', 'p-handoff-expired': 'Expired hand-over link',
  'p-overview': 'Overview', 'p-menu': 'Menu, open', 'p-profile': 'Profile', 'p-add-kennel': 'Add a kennel', 'p-litters': 'Litters and puppies',
  'p-litter-add': 'Add a litter drawer', 'p-litter-edit': 'Edit litter drawer', 'p-add-several': 'Add several puppies drawer', 'p-puppy': 'Puppy drawer',
  'p-puppy-photos': 'Puppy drawer, photos', 'p-puppy-savebar': 'Puppy drawer, scrolled (save bar)', 'p-face': 'Tap the face dialog', 'p-confirm': 'Remove puppy confirmation',
  'p-parents': 'Moms and dads', 'p-parent-add': 'Add a mom drawer', 'p-pay': 'Pay to list', 'p-payments': 'Payments', 'p-stats': 'Views and clicks',
  'p-account': 'Account', 'p-help': 'Help', 'p-tour': 'Walkthrough',
  'a-overview': 'Overview', 'a-menu': 'Menu, open', 'a-checklist': 'Launch checklist', 'a-checklist-add': 'Add a checklist item drawer', 'a-approvals': 'Approvals',
  'a-decide': 'Kennel approval, Decline', 'a-reported': 'Reported listings', 'a-photo-review': 'Photo review', 'a-breeders': 'Breeders', 'a-breeder': 'Breeder drawer',
  'a-photos': 'Photos drawer', 'a-edit-profile': 'Edit profile drawer', 'a-edit-litter': 'Edit litter drawer', 'a-edit-puppy': 'Edit puppy drawer',
  'a-add-breeder': 'Add a breeder drawer', 'a-listings': 'Listings', 'a-breeds': 'Breeds', 'a-breed-add': 'Add a breed drawer', 'a-payments': 'Payments',
  'a-reports-traffic': 'Reports, Views and clicks', 'a-reports-months': 'Reports, Listings and revenue', 'a-reports-breeds': 'Reports, Listings by breed',
  'a-reports-views': 'Reports, Most viewed', 'a-reports-searches': 'Reports, Breeds searched for', 'a-reports-new': 'Reports, New breeders',
  'a-reports-sales': 'Reports, Sales reported', 'a-reports-glance': 'Reports, At a glance', 'a-list': 'Mailing list', 'a-people': 'Sign-ins',
  'a-publish': 'Publish', 'a-terms': 'Terms', 'a-email': 'Email log', 'a-settings': 'Settings', 'a-activity': 'Activity', 'a-search': 'Search results',
}
REAL = {'overflow', 'escape', 'tap', 'overlap', 'row', 'clip'}   # 'fixed' is information, not a problem


def problems(r):
    return [f for f in r.get('findings', []) if f['check'] in REAL] if r and 'findings' in r else None


def img(path, width=240, max_h=1500):
    try:
        im = Image.open(path).convert('RGB')
    except FileNotFoundError:
        return ''
    scale = width / im.width
    im = im.resize((width, int(im.height * scale)), Image.LANCZOS)
    if im.height > max_h:
        im = im.crop((0, 0, width, max_h))
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=72)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def desk_diff(id_):
    try:
        a = Image.open(f'{before_dir}/shots/{id_}-1440.png').convert('RGB')
        b = Image.open(f'{after_dir}/shots/{id_}-1440.png').convert('RGB')
    except FileNotFoundError:
        return None
    if a.size != b.size:
        h = min(a.height, b.height); a = a.crop((0, 0, 1440, h)); b = b.crop((0, 0, 1440, h))
    d = ImageChops.difference(a, b).convert('L').point(lambda v: 255 if v > 24 else 0)
    changed = sum(d.histogram()[255:])
    bbox = d.getbbox()
    return changed / (a.width * a.height) * 100, bbox


ids = []
for k in list(B) + list(A):
    i = k.split('@')[0]
    if i not in ids: ids.append(i)

def count(R, i, w):
    p = problems(R.get(f'{i}@{w}'))
    return None if p is None else len(p)

tot_b = sum(count(B, i, w) or 0 for i in ids for w in PHONES)
tot_a = sum(count(A, i, w) or 0 for i in ids for w in PHONES)
combos = sum(1 for i in ids for w in PHONES if f'{i}@{w}' in A)
clean_a = sum(1 for i in ids for w in PHONES if count(A, i, w) == 0)
by_kind_b, by_kind_a = {}, {}
for R, tgt in ((B, by_kind_b), (A, by_kind_a)):
    for k, v in R.items():
        if v['w'] in PHONES:
            for f in problems(v) or []: tgt[f['check']] = tgt.get(f['check'], 0) + 1

diffs = {i: desk_diff(i) for i in ids}
desk = [d for d in diffs.values() if d]
desk_same = sum(1 for d in desk if d[0] < 0.5)

# batch findings table
y = open(batch, encoding='utf-8').read()
rows = re.findall(r'- \{id: (f-[\w-]+), status: (\w+), found: "([^"]+)"(?:, (?:fix|note): "([^"]+)")?', y)

KIND = {'tap': 'Controls under 44px', 'row': 'Button rows out of line', 'overlap': 'Controls overlapping', 'clip': 'Text or content cut off', 'escape': 'Outside its box', 'overflow': 'Runs off the screen'}
e = html.escape
parts = []
parts.append(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>Mobile review — portal and admin</title><style>
:root {{ color-scheme: light only; --ink:#262626; --muted:#6b665c; --line:#ddd5c3; --ground:#f3efe6; --ok:#2f6140; --alert:#92402f; --serif: Georgia, serif; --sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }}
* {{ box-sizing: border-box; }} body {{ margin:0; background:var(--ground); color:var(--ink); font:15px/1.55 var(--sans); }}
.page {{ width:min(1400px, 94%); margin:0 auto; padding:2rem 0 4rem; }}
h1 {{ font:600 1.9rem var(--serif); margin:0 0 .4rem; }} h2 {{ font:600 1.3rem var(--serif); margin:2.2rem 0 .6rem; }}
p {{ max-width:75ch; }} .muted {{ color:var(--muted); }}
.figs {{ display:flex; flex-wrap:wrap; gap:2.5rem; margin:1.4rem 0; }} .figs b {{ display:block; font:600 2rem var(--serif); }} .figs span {{ font-size:.88rem; color:var(--muted); }}
table {{ border-collapse:collapse; background:#fff; font-size:.9rem; width:100%; }} td, th {{ border-bottom:1px solid var(--line); padding:.5rem .7rem; text-align:left; vertical-align:top; }}
th {{ font-size:.74rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }} .num {{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }}
.screen {{ display:grid; grid-template-columns: 15rem 240px 240px minmax(0,1fr); gap:1rem; align-items:start; padding:1rem 0; border-top:1px solid var(--line); }}
.screen img {{ width:240px; border:1px solid var(--line); background:#fff; display:block; }}
.screen h3 {{ font:600 1rem var(--sans); margin:0 0 .3rem; }} .cap {{ font-size:.75rem; color:var(--muted); margin:.2rem 0 0; }}
.counts td {{ padding:.25rem .5rem; }} .zero {{ color:var(--ok); font-weight:600; }} .left {{ color:var(--alert); }}
@media (max-width: 900px) {{ .screen {{ grid-template-columns: 1fr 1fr; }} .screen > div:first-child, .screen > div:last-child {{ grid-column: 1 / -1; }} .screen img {{ width:100%; }} }}
</style></head><body><div class="page">
<h1>Mobile review of the breeder portal and admin</h1>
<p>Every screen, drawer and dialog in both apps measured at 360, 390 and 430px before and after the fix, with menu A, button rows 1 and drawer actions 1 applied through the shared stylesheet. Desktop was measured at 1440px both times and compared screenshot to screenshot.</p>
<div class="figs"><div><b>{tot_b} to {tot_a}</b><span>layout problems across {combos} screen and width combinations</span></div>
<div><b>{clean_a} of {combos}</b><span>combinations with no problem left</span></div>
<div><b>{desk_same} of {len(desk)}</b><span>desktop screens with under 0.5% of pixels changed</span></div></div>
<h2>Problems by kind, phone widths</h2><table><tr><th>Kind</th><th class="num">Before</th><th class="num">After</th></tr>''')
for k in ['tap', 'row', 'overlap', 'clip', 'escape', 'overflow']:
    parts.append(f'<tr><td>{KIND[k]}</td><td class="num">{by_kind_b.get(k, 0)}</td><td class="num">{by_kind_a.get(k, 0)}</td></tr>')
parts.append('</table><h2>What was found and what changed</h2><table><tr><th>Found</th><th>Change</th><th>Status</th></tr>')
for _id, st, found, fix in rows:
    parts.append(f'<tr><td>{e(found)}</td><td>{e(fix)}</td><td>{e(st)}</td></tr>')
parts.append('</table>')

for app, label in (('p', 'Breeder portal'), ('a', 'Admin')):
    parts.append(f'<h2>{label}, screen by screen at 390px</h2>')
    for i in [x for x in ids if x.startswith(app + '-')]:
        cb = [count(B, i, w) for w in PHONES]; ca = [count(A, i, w) for w in PHONES]
        left = [f for w in PHONES for f in (problems(A.get(f'{i}@{w}')) or [])]
        left_txt = sorted({f"{f['check']}: {re.sub(r'#[\\w-]*\\d[\\w-]*', '', f['el'])[:70]} ({f.get('h', f.get('px', ''))})" for f in left})
        d = diffs.get(i)
        desk_txt = '' if not d else (f'Desktop 1440: {d[0]:.2f}% of pixels changed' + (f', inside {d[1][2]-d[1][0]}x{d[1][3]-d[1][1]}px from x {d[1][0]}, y {d[1][1]}' if d[0] >= 0.01 and d[1] else ''))
        parts.append('<div class="screen"><div><h3>' + e(NAMES.get(i, i)) + '</h3><table class="counts"><tr><th></th>' + ''.join(f'<th class="num">{w}</th>' for w in PHONES) + '</tr>' +
                     '<tr><td>Before</td>' + ''.join(f'<td class="num">{"" if c is None else c}</td>' for c in cb) + '</tr>' +
                     '<tr><td>After</td>' + ''.join(f'<td class="num {"zero" if c == 0 else "left"}">{"" if c is None else c}</td>' for c in ca) + '</tr></table>' +
                     f'<p class="cap">{e(desk_txt)}</p></div>' +
                     f'<div><img src="{img(f"{before_dir}/shots/{i}-390.png")}" alt="Before"><p class="cap">Before</p></div>' +
                     f'<div><img src="{img(f"{after_dir}/shots/{i}-390.png")}" alt="After"><p class="cap">After</p></div>' +
                     '<div>' + ('<p class="cap"><b>Left after the fix</b></p><ul class="cap">' + ''.join(f'<li>{e(t)}</li>' for t in left_txt[:8]) + '</ul>' if left_txt else '<p class="cap">Nothing left at any phone width.</p>') + '</div></div>')
parts.append('<h2>How this was measured</h2><p class="muted">A script drove headless Chrome against the local portal and admin, with the seed and the demo kennels, and the portal opened through Manage as this breeder on Maple Brook Doodles. On each screen it counted controls under 44px, button rows whose heights or tops differ or that wrap leaving one button alone, controls overlapping, text cut off, anything outside its box and anything past the screen edge, counting only what is visible. The scripts are in app/dev/mobile-review. Screenshots of long drawers are cut at about 2,500px.</p></div></body></html>')
open(out, 'w', encoding='utf-8').write(''.join(parts))
print('wrote', out, tot_b, tot_a, combos, clean_a, desk_same, len(desk))
