"""Build the before-and-after report for the phone rows (2026-11-12, batch-2026-11-12-mobile-rows.md).

    python app/dev/mobile-review/rows-report.py <before-dir> <after-dir> <out.html>

Each dir is a run.mjs output. The after run carries rows.js results (photo against text height,
buttons on one line, labels cut, filters full width). Screenshots of the changed screens at 390
are embedded as small JPEGs so the page is one file, and the 1440 shots are compared pixel by pixel.
"""
import base64, io, json, sys, html
from PIL import Image, ImageChops

before_dir, after_dir, out = sys.argv[1:4]
B = json.load(open(f'{before_dir}/results.json', encoding='utf-8'))
A = json.load(open(f'{after_dir}/results.json', encoding='utf-8'))
PHONES = [360, 390, 430]

CHANGED = [
  ('a-listings', 'Admin, Listings'), ('a-breeders', 'Admin, Breeders'), ('a-approvals', 'Admin, Approvals'), ('a-breeder', 'Admin, breeder drawer'),
  ('a-payments', 'Admin, Payments'), ('a-breeds', 'Admin, Breeds'), ('a-email', 'Admin, Email log'), ('a-list', 'Admin, Mailing list'),
  ('a-people', 'Admin, Sign-ins'), ('a-publish', 'Admin, Publish'), ('a-activity', 'Admin, Activity'), ('a-search', 'Admin, Search'),
  ('p-litters', 'Portal, Litters and puppies'), ('p-parents', 'Portal, Moms and dads'), ('p-payments', 'Portal, Payments'), ('p-account', 'Portal, Account'),
]
NOTES = {
  'a-email': 'The before run had no email in the local log, and the after run has three test rows.',
  'a-list': 'The before run had nobody on the local list, and the after run has three test subscribers.',
  'p-parents': 'The before run had no moms or dads for the demo kennel, and the after run has two test parents.',
  'a-breeder': 'The drawer covers the screen, so its rows are the ones that count here.',
}


def jpg(path, h=1500, scale=0.75):
    im = Image.open(path).convert('RGB')
    im = im.crop((0, 0, im.size[0], min(im.size[1], h)))
    im = im.resize((int(im.size[0] * scale), int(im.size[1] * scale)))
    b = io.BytesIO(); im.save(b, 'JPEG', quality=78)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def desk_same(i):
    k = f'{i}@1440'
    if k not in B or k not in A or 'shot' not in B[k] or 'shot' not in A[k]: return None
    a = Image.open(f'{before_dir}/{B[k]["shot"]}').convert('RGB'); b = Image.open(f'{after_dir}/{A[k]["shot"]}').convert('RGB')
    if a.size != b.size: return False
    return ImageChops.difference(a, b).getbbox() is None


e = html.escape
rows_html, problems_total, phone_find_before, phone_find_after = [], 0, 0, 0
for k, v in A.items():
    if v.get('error') or v['w'] not in PHONES: continue
    phone_find_after += len(v['findings'])
    if k in B and not B[k].get('error'): phone_find_before += len(B[k]['findings'])
    problems_total += len([p for p in v.get('rows', {}).get('problems', [])])
desk_changed = [i for i in {v['id'] for v in A.values()} if desk_same(i) is False]

table = []
for i, name in CHANGED:
    cells = []
    for w in PHONES:
        v = A.get(f'{i}@{w}', {})
        r = v.get('rows', {})
        n = len(r.get('rows', [])); pr = r.get('problems', [])
        ph = [x for x in r.get('rows', []) if x.get('photo')]
        okph = sum(1 for x in ph if abs(x['photo']['h'] - x['text_h']) <= 1)
        cut = [f['el'] for f in v.get('findings', []) if f['check'] == 'clip']
        cells.append((n, len(pr), okph, len(ph), len(cut)))
    fb = sum(len(B.get(f'{i}@{w}', {}).get('findings', [])) for w in PHONES)
    fa = sum(len(A.get(f'{i}@{w}', {}).get('findings', [])) for w in PHONES)
    d = desk_same(i)
    table.append(f'<tr><td>{e(name)}</td>' + ''.join(f'<td class="n">{c[0]}</td><td class="n">{c[1]}</td>' for c in cells) +
                 f'<td class="n">{cells[1][2]} of {cells[1][3]}</td><td class="n">{fb} to {fa}</td><td class="n">{sum(c[4] for c in cells)}</td>'
                 f'<td>{"same" if d else "changed" if d is False else "not run"}</td></tr>')

shots = []
for i, name in CHANGED:
    kb, ka = f'{i}@390', f'{i}@390'
    if 'shot' not in B.get(kb, {}) or 'shot' not in A.get(ka, {}): continue
    shots.append(f'<section class="pair-sec"><h3>{e(name)}</h3>' + (f'<p class="muted">{e(NOTES[i])}</p>' if i in NOTES else '') +
                 f'<div class="pair"><figure><figcaption>Before</figcaption><img loading="lazy" src="{jpg(f"{before_dir}/{B[kb]["shot"]}")}" alt="{e(name)} before"></figure>'
                 f'<figure><figcaption>After</figcaption><img loading="lazy" src="{jpg(f"{after_dir}/{A[ka]["shot"]}")}" alt="{e(name)} after"></figure></div></section>')

cut_list = sorted({f'{A[k]["id"]}: {f["el"][:70]}' for k in A if A[k].get('w') in PHONES for f in A[k].get('findings', []) if f['check'] == 'clip'})
other = sorted({f'{A[k]["id"]}@{A[k]["w"]} {f["check"]}: {f["el"][:60]}' for k in A if A[k].get('w') in PHONES for f in A[k].get('findings', []) if f['check'] != 'clip'})

page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Phone rows report</title><style>
:root{{--ink:#262626;--muted:#6b6355;--bg:#f4efe4;--card:#fff;--line:#d9cfba;--ok:#2f6b3a}}
@media (prefers-color-scheme:dark){{:root:not([data-theme=light]){{--ink:#eee;--muted:#b8ae9c;--bg:#1d1b18;--card:#2a2723;--line:#4a443b;--ok:#8fc79a}}}}
:root[data-theme=dark]{{--ink:#eee;--muted:#b8ae9c;--bg:#1d1b18;--card:#2a2723;--line:#4a443b;--ok:#8fc79a}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}}main{{max-width:1100px;margin:0 auto;padding:24px 16px 60px}}
h1{{font-size:1.6rem;margin:0 0 .4rem}}h2{{margin:2.2rem 0 .5rem}}h3{{margin:1.6rem 0 .3rem}}p,li{{max-width:75ch}}.muted{{color:var(--muted)}}
.figs{{display:flex;flex-wrap:wrap;gap:12px;margin:1rem 0}}.fig{{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:10px 14px;min-width:150px}}
.fig b{{display:block;font-size:1.5rem}}.wrap{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;background:var(--card);font-size:.88rem}}
th,td{{border:1px solid var(--line);padding:5px 7px;text-align:left;vertical-align:top}}td.n{{text-align:right;font-variant-numeric:tabular-nums}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}figure{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:8px}}
figcaption{{font-weight:600;margin-bottom:4px}}figure img{{width:100%;height:auto;display:block}}
@media (max-width:640px){{.pair{{grid-template-columns:1fr}}}}
@media print{{.pair-sec{{break-inside:avoid}}}}</style></head><body><main>
<h1>Phone rows in the portal and admin</h1>
<p>Every list in both apps now uses the row you approved on November 12 wherever it fits. The photo is the height of the three lines beside it, the name has the price and state at its right, and the buttons stay on one line. Filters and selects run the full width. Every screen was measured against local Workers at 360, 390 and 430px and at 1440px.</p>
<div class="figs"><div class="fig"><b>{problems_total}</b>row problems at phone widths</div>
<div class="fig"><b>{phone_find_before} to {phone_find_after}</b>layout findings at phone widths, before and after (most after are cut lines ending in an ellipsis)</div>
<div class="fig"><b>{len(desk_changed)}</b>screens that look different at 1440</div></div>
<p class="muted">Row problems are a photo not matching its text, buttons wrapping or uneven, a cut button label, a tap target under 44px, or a filter narrower than its bar.</p>
<h2>Screens that changed</h2>
<div class="wrap"><table><thead><tr><th rowspan="2">Screen</th><th colspan="2">360</th><th colspan="2">390</th><th colspan="2">430</th><th rowspan="2">Photos matching text, 390</th><th rowspan="2">Findings before to after, phones</th><th rowspan="2">Cut lines</th><th rowspan="2">1440</th></tr>
<tr><th>Rows</th><th>Problems</th><th>Rows</th><th>Problems</th><th>Rows</th><th>Problems</th></tr></thead><tbody>{"".join(table)}</tbody></table></div>
<h2>Lines cut with an ellipsis</h2><p>These end in an ellipsis on purpose so the row keeps its height. Hold a finger on the line to see all of it.</p>
<ul>{"".join(f"<li>{e(x)}</li>" for x in cut_list) or "<li>None</li>"}</ul>
<h2>Other findings at phone widths</h2><ul>{"".join(f"<li>{e(x)}</li>" for x in other) or "<li>None</li>"}</ul>
<h2>Screens at 1440 that look different</h2><ul>{"".join(f"<li>{e(x)}</li>" for x in sorted(desk_changed)) or "<li>None</li>"}</ul>
<h2>Before and after at 390px</h2>{"".join(shots)}
</main></body></html>'''
open(out, 'w', encoding='utf-8').write(page)
print('wrote', out, len(page) // 1024, 'KB', 'problems', problems_total, 'desk changed', desk_changed)
