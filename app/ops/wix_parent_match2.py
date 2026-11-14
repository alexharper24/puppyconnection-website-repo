"""Second pass on the Wix parent photos, using the breeders' own records (Alex, 2026-11-14,
docs/batch-2026-11-14-breeder-parent-records.md). Read-only. Decides only from text: Wix file names and media ids,
the moms and dads each breeder names on their own site, the litters their site ties to a mom and dad, and the
new site's litters. Never from what a photo shows.

  python -X utf8 app/ops/wix_parent_match2.py <evidence folder> <breeder_parents.json> <production read folder>

The read folder holds pups.json, litters.json (with mom_id, dad_id, born_on), parents.json, breeders.json and
breeds.json from a fresh production read. Writes determined2.json and undetermined2.json to the evidence folder.

A litter's mom (or dad) is determined when every source that speaks agrees and at least one of these holds:
  a. a gallery photo of the litter names a dog the breeder's site lists as a mom (or dad), or
  b. the breeder's site ties this litter to a named mom (or dad): a litter there whose puppies match this
     litter's puppies by name (two or more, or one with the same birth date within three days), or whose stated
     birth date matches exactly one litter of this breeder.
A file name role word (dam, sire, mom, dad and the rest) also counts as a source and must agree. A name listed as
both a mom and a dad by one breeder, a photo carrying two names, a photo used by two breeders, or puppies of one
litter naming different parents leaves that role undetermined. A litter that already has the role set is left alone.
"""
import collections, json, os, re, sys
from datetime import date

EV, BP, RD = sys.argv[1], sys.argv[2], sys.argv[3]
load = lambda n: json.load(open(os.path.join(RD, n + '.json'), encoding='utf8'))[0]['results']
pups = {p['id']: p for p in load('pups')}
litters = {l['id']: l for l in load('litters')}
parents = load('parents')
photos = load('photos')
bname = {b['breeder_id']: b['business_name'] for b in load('breeders')}
bid = {v: k for k, v in bname.items()}
breed_words = {b['id']: {w for w in re.findall(r'[a-z]+', (b['name'] or '').lower()) if len(w) > 3} for b in load('breeds')}
galleries = json.load(open(os.path.join(EV, 'galleries.json'), encoding='utf8'))
records = json.load(open(BP, encoding='utf8'))
norm = lambda s: re.sub(r'[^a-z]', '', (s or '').lower())
MOM = {'mom', 'mother', 'mama', 'momma', 'dam'}
DAD = {'dad', 'daddy', 'father', 'papa', 'sire'}
GENERIC = {'img', 'dsc', 'image', 'photo', 'pic', 'picture', 'copy', 'final', 'edited', 'the', 'of', 'and', 'puppy', 'pup',
           'jpg', 'jpeg', 'png', 'webp', 'heic', 'parent', 'stud', 'ad', 'screen', 'shot', 'at', 'pm', 'am', 'dog', 'female', 'male'}

# The breeder's own moms and dads: name -> role, dropping a name listed with both roles.
roles_of = collections.defaultdict(lambda: collections.defaultdict(set))
for b, rec in records.items():
    for d in rec.get('dogs', []):
        if d.get('role') in ('female', 'male') and norm(d.get('name')):
            roles_of[b][norm(d['name'])].add(d['role'])
listed = {b: {n: rs.pop() for n, rs in m.items() if len(rs) == 1} for b, m in roles_of.items()}
display = {}
for b, rec in records.items():
    for d in rec.get('dogs', []):
        display[(b, norm(d.get('name')))] = d.get('name')


def parse_date(s):
    if not s: return None
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', s)
    if m: return date(*map(int, m.groups()))
    m = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', s)
    if m:
        y = int(m.group(3)); y += 2000 if y < 100 else 0
        try: return date(y, int(m.group(1)), int(m.group(2)))
        except ValueError: return None
    months = 'january february march april may june july august september october november december'.split()
    # "September 14, 2026" and "Sep 14, 2026" (the breeders' sites use both)
    m = re.search(r'(?i)\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})', s)
    if m: return date(int(m.group(3)), [x[:3] for x in months].index(m.group(1).lower()) + 1, int(m.group(2)))
    return None


# Litters the breeder's site ties to a mom and dad, matched to new-site litters.
site_pairs = collections.defaultdict(list)  # litter_id -> [{'mom','dad','evidence','page'}]
site_touch = collections.defaultdict(list)
by_breeder_lits = collections.defaultdict(list)
for l in litters.values():
    by_breeder_lits[l['breeder_id']].append(l)
for b, rec in records.items():
    if b not in bid: continue
    B = bid[b]
    for r in rec.get('litters', []):
        born = parse_date(r.get('born') or r.get('litter_label'))
        names = {norm(n) for n in r.get('puppies') or [] if norm(n)}
        hits = collections.Counter()
        for p in pups.values():
            if p['breeder_id'] == B and norm(p['name']) in names:
                hits[p['litter_id']] += 1
        cands = []
        for lid, n in hits.items():
            lb = parse_date(litters[lid]['born_on'])
            if n >= 2 or (born and lb and abs((born - lb).days) <= 3):
                cands.append(lid)
        if not cands and born and not names:
            same = [l['id'] for l in by_breeder_lits[B] if parse_date(l['born_on']) == born]
            if len(same) == 1: cands = same
        for lid in cands:
            site_pairs[lid].append({'mom': r.get('mom'), 'dad': r.get('dad'), 'evidence': r.get('evidence'), 'page': r.get('page')})
        # Any single puppy-name match is a weaker touch. A touch naming another parent than the litter's strong
        # match means the new-site litter may hold two real litters, so that role stays open.
        for lid in hits:
            if lid not in cands:
                site_touch[lid].append({'mom': r.get('mom'), 'dad': r.get('dad'), 'evidence': r.get('evidence')})


def file_names(title, own_breed, puppy_names):
    """(role word role or None, candidate name strings) from a file name."""
    base = re.sub(r'\.[A-Za-z0-9]{2,4}$', '', title or '')
    toks = re.findall(r"[A-Za-z']+", base)
    low = [re.sub(r"'s$", '', t.lower()).strip("'") for t in toks]  # "Bentley's" is Bentley
    rw = {('female' if t in MOM else 'male') for t in low if t in MOM | DAD}
    keep = [t for t in low if t not in MOM | DAD | GENERIC | own_breed and len(t) > 1]
    keep = [t for t in keep if norm(t) not in puppy_names]
    cands = {norm(' '.join(keep[i:j])) for i in range(len(keep)) for j in range(i + 1, min(len(keep), i + 3) + 1)}
    return (rw.pop() if len(rw) == 1 else ('conflict' if rw else None)), {c for c in cands if c}


use_by_media = collections.defaultdict(set)
for g in galleries:
    for m in g['wix']:
        if m['type'] == 'PHOTO' and g['id'] in pups: use_by_media[m['id']].add(g['id'])

# Evidence per (litter, role): names from photos and from the site's litter pairs.
ev = collections.defaultdict(lambda: collections.defaultdict(list))  # (lit, role) -> name -> [evidence]
photo_name = collections.defaultdict(set)
for g in galleries:
    if g['id'] not in pups: continue
    p = pups[g['id']]; b = bname.get(p['breeder_id'], ''); lid = p['litter_id']
    own = breed_words.get(litters[lid]['breed_id'], set())
    sib = {norm(x['name']) for x in pups.values() if x['id'] in use_by_media.get('', set())}
    for m in g['wix']:
        if m['type'] != 'PHOTO': continue
        users = use_by_media[m['id']]
        pnames = {norm(pups[u]['name']) for u in users}
        rw, cands = file_names(m['title'], own, pnames)
        hit = [(c, listed.get(b, {}).get(c)) for c in cands if listed.get(b, {}).get(c)]
        if len({c for c, _ in hit}) > 1:
            hit = [max(hit, key=lambda h: len(h[0]))]  # "rosie" inside "rosie mae": the longer listed name wins
        if not hit and rw in ('female', 'male') and cands:
            # A role word with a name the breeder's site does not list, as in "Trixie(dam).jpg": still a source.
            c = max(cands, key=len)
            ev[(lid, rw)][c].append({'kind': 'photo', 'puppy': p['name'], 'title': m['title'], 'media': m['id']})
            photo_name[m['id']].add((c, rw))
        for c, role in hit:
            if rw == 'conflict' or (rw and rw != role):
                ev[(lid, role)]['__conflict__'].append(f'file "{m["title"]}" says one role and {b}\'s site the other')
                continue
            ev[(lid, role)][c].append({'kind': 'photo', 'puppy': p['name'], 'title': m['title'], 'media': m['id']})
            photo_name[m['id']].add((c, role))
for lid, prs in site_pairs.items():
    b = bname.get(litters[lid]['breeder_id'], '')
    for pr in prs:
        for role, key in (('female', 'mom'), ('male', 'dad')):
            if pr.get(key):
                ev[(lid, role)][norm(pr[key])].append({'kind': 'site', 'evidence': pr['evidence'], 'page': pr['page']})

for lid, ts in site_touch.items():
    for t in ts:
        for role, key in (('female', 'mom'), ('male', 'dad')):
            if t.get(key) and (lid, role) in ev and norm(t[key]) not in ev[(lid, role)]:
                ev[(lid, role)]['__conflict__'].append(f"a puppy of this litter is listed on the breeder's site under another {key}, {t[key]}")
# Puppies of one litter giving different weights for a parent in their Wix descriptions (weights-plan.json skipped).
WP = os.path.join(os.path.dirname(EV), '2026-11-14-wix-parent-weights', 'weights-plan.json')
for s in json.load(open(WP, encoding='utf8'))['skipped']:
    role = 'female' if s['who'] == 'mom' else 'male'
    ev[(s['litter_id'], role)]['__conflict__'].append(f"puppies of this litter give different {s['who']} weights on Wix")
bad_media = {m for m, s in photo_name.items() if len(s) > 1}
bad_media |= {m for m, users in use_by_media.items() if len({pups[u]['breeder_id'] for u in users}) > 1}

photos_by_media = collections.defaultdict(list)
for ph in photos:
    for mid in re.findall(r'[0-9a-f]{6}_[0-9a-f]{32}', ph['external_url'] or ''):
        photos_by_media[mid].append(ph)

COLORS = {'chocolate', 'cream', 'red', 'black', 'white', 'merle', 'sable', 'blue', 'apricot', 'fawn', 'brindle', 'tan',
          'golden', 'gold', 'silver', 'brown', 'tricolor', 'tri', 'parti', 'phantom', 'champagne', 'caramel', 'ginger', 'honey'}
# A color word is a name only where the breeder's site ties the litter to that dog, because "chocolate.jpg" may
# be a chocolate puppy.
for key, names in ev.items():
    for n in [n for n in names if n in COLORS]:
        if not any(e['kind'] == 'site' for e in names[n]):
            del names[n]
# A conflict in either role leaves the whole litter out, because it suggests the new-site litter holds two real litters.
conflicted = {lid for (lid, role), names in ev.items() if '__conflict__' in names or len([n for n in names if n != '__conflict__']) > 1}
for (lid, role), names in list(ev.items()):
    if lid in conflicted and '__conflict__' not in names and len(names) <= 1:
        names['__conflict__'] = ["the litter's other parent is in conflict, so the whole litter is left out"]
determined, undetermined = {}, []
for (lid, role), names in ev.items():
    if not [n for n in names if n != '__conflict__'] and '__conflict__' not in names:
        continue
    L = litters[lid]; b = bname.get(L['breeder_id'], '')
    col = 'mom_id' if role == 'female' else 'dad_id'
    real = {n: e for n, e in names.items() if n != '__conflict__'}
    why = None
    if '__conflict__' in names: why = names['__conflict__'][0]
    elif len(real) > 1: why = f"the sources name different {'moms' if role == 'female' else 'dads'} ({', '.join(sorted(real))})"
    elif b.startswith('Unassigned'): why = 'no breeder on the new site'
    elif L[col]: why = 'the litter already has this parent set'
    if not why:
        n, es = next(iter(real.items()))
        if any(e['kind'] == 'photo' and e['media'] in bad_media for e in es):
            why = 'a photo of this parent carries another name or is used by another breeder'
    if why:
        undetermined.append({'litter_id': lid, 'breeder': b, 'role': role, 'names': sorted(real), 'why': why})
        continue
    k = (L['breeder_id'], role, n)
    d = determined.setdefault(k, {'breeder_id': L['breeder_id'], 'breeder': b, 'sex': role,
                                  'name': display.get((b, n)) or next((pr.get('mom' if role == 'female' else 'dad') for pr in site_pairs.get(lid, []) if norm(pr.get('mom' if role == 'female' else 'dad')) == n), n.capitalize()),
                                  'media': collections.Counter(), 'link_litters': [], 'evidence': []})
    d['link_litters'].append(lid)
    for e in es:
        d['evidence'].append({**e, 'litter_id': lid})
        if e['kind'] == 'photo': d['media'][e['media']] += 1

existing = {(r['breeder_id'], r['sex'], norm(r['name'])): r for r in parents if not r['archived_at']}
out = []
for k, d in sorted(determined.items(), key=lambda kv: (kv[1]['breeder'], kv[1]['sex'], kv[1]['name'])):
    ex = existing.get(k)
    linked = {x['id'] for x in pups.values() if x['litter_id'] in d['link_litters']}
    chosen = sorted(d['media'], key=lambda m: (-d['media'][m], m))[0] if d['media'] else None
    remove, cover = [], []
    if not (ex and ex['photo_key']):
        for mid in d['media']:
            for ph in photos_by_media[mid]:
                if ph['puppy_id'] in linked:
                    (cover if ph['position'] == 0 else remove).append(ph['id'])
    src = None
    if chosen and not (ex and ex['photo_key']):
        c = sorted((ph for ph in photos_by_media[chosen] if ph['r2_key'] and '-crop32' not in ph['r2_key']),
                   key=lambda ph: (-(ph['bytes'] or 0), ph['id']))
        src = ({'photo_id': c[0]['id'], 'r2_key': c[0]['r2_key']} if c else
               {'wix_url': f"https://static.wixstatic.com/media/{chosen}" + ('' if '~mv2' in chosen else '~mv2.jpg')})
    out.append({**{k2: v for k2, v in d.items() if k2 != 'media'}, 'media_ids': dict(d['media']), 'photo_media': chosen,
                'photo_source': src, 'existing_parent_id': ex['id'] if ex else None, 'existing_has_photo': bool(ex and ex['photo_key']),
                'litters_already_set': [], 'remove_photo_ids': sorted(remove), 'cover_photo_ids_kept': sorted(cover)})

json.dump(out, open(os.path.join(EV, 'determined2.json'), 'w', encoding='utf8'), indent=1)
json.dump(undetermined, open(os.path.join(EV, 'undetermined2.json'), 'w', encoding='utf8'), indent=1)
print(f"site litter pairs matched {len(site_pairs)} litters; determined parents {len(out)} "
      f"(existing {sum(1 for o in out if o['existing_parent_id'])}), links {sum(len(o['link_litters']) for o in out)}, "
      f"with photo {sum(1 for o in out if o['photo_source'])}, photos removed {sum(len(o['remove_photo_ids']) for o in out)}, "
      f"covers kept {sum(len(o['cover_photo_ids_kept']) for o in out)}; undetermined roles {len(undetermined)}")
for o in out:
    kinds = collections.Counter(e['kind'] for e in o['evidence'])
    print(f"  {o['breeder'][:24]:<24} {'mom' if o['sex']=='female' else 'dad'} {o['name']:<14} litters {len(o['link_litters'])} "
          f"photo {'yes' if o['photo_source'] else 'no '} evidence {dict(kinds)}")
for u in undetermined:
    print(f"  ? {u['breeder'][:24]:<24} {u['role']:<6} {u['names']} {u['why']}")
