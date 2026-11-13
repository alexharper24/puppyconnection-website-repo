"""Work out each imported puppy's mom and dad from the photo file names in its old Wix gallery (Alex, 2026-11-13,
docs/batch-2026-11-13-wix-parent-photos.md). Read-only. Decides only from file names, Wix media ids, litters,
breeders and the description text, never from what a photo shows.

  python -X utf8 app/ops/wix_parent_match.py <evidence folder> <production read folder>

The evidence folder holds galleries.json (each puppy's Wix gallery). The read folder holds the production reads
pups.json, litters.json, parents.json, photos.json, breeders.json and breeds.json (wrangler --json output).
Writes determined.json and undetermined.json to the evidence folder and prints a summary.

A parent is determined for a litter only when the file name states the role (dam, mom, mother, mama mean mom;
sire, dad, father, papa mean dad), the parent's name is in the file name or in the same media id elsewhere,
the same media id never carries two names or two roles, the puppies of the litter agree, every puppy using the
photo belongs to one breeder, and the description text does not contradict another litter of the same parent.
A litter with a conflict in either role is left out whole.
"""
import collections, json, os, re, sys

EV, RD = sys.argv[1], sys.argv[2]
load = lambda n: json.load(open(os.path.join(RD, n + '.json'), encoding='utf8'))[0]['results']
galleries = json.load(open(os.path.join(EV, 'galleries.json'), encoding='utf8'))
pups = {p['id']: p for p in load('pups')}
litters = {l['id']: l for l in load('litters')}
parents = load('parents')
photos = load('photos')
bname = {b['breeder_id']: b['business_name'] for b in load('breeders')}
breed_words = {b['id']: {w for w in re.findall(r'[a-z]+', (b['name'] or '').lower()) if len(w) > 3} for b in load('breeds')}

MOM = {'mom', 'mother', 'mama', 'momma', 'dam'}
DAD = {'dad', 'daddy', 'father', 'papa', 'sire'}
PARENT = re.compile(r'^parent\d*$')
GENERIC = {'img', 'dsc', 'image', 'photo', 'pic', 'picture', 'copy', 'final', 'edited', 'the', 'of', 'and', 'puppy',
           'pup', 'jpg', 'jpeg', 'png'}
GLUED = re.compile(r'^([a-z]{3,})(mom|dad|dam|sire|mama|papa)$')
WIX = 'https://static.wixstatic.com/media/'


def parse(title, own_breed=()):
    """(role, name, note) from a file name. role is female, male, unstated or None (not a parent photo).
    A word of the puppy's own breed, as in "dachshund mom", is not a name."""
    base = re.sub(r'\.[A-Za-z0-9]{2,4}$', '', title or '')
    toks = re.findall(r"[A-Za-z']+|\d+", base)
    low = [t.lower().strip("'") for t in toks]
    roles = {('female' if t in MOM else 'male') for t in low if t in MOM | DAD}
    unstated = any(PARENT.match(t) for t in low)
    glued = [t for t in low if GLUED.match(t)]
    if len(roles) > 1:
        return 'conflict', None, 'the file name says both mom and dad'
    if 'stud' in low and not roles:
        return 'unstated', None, 'the file name says stud, which does not say this is the puppy\'s dad'
    if not roles and not unstated and not glued:
        return None, None, None
    keep = [t for t, l in zip(toks, low) if l not in MOM | DAD | GENERIC | set(own_breed) and not PARENT.match(l) and not l.isdigit()
            and l not in {'s', 'stud', 'ad'} and len(l) > 1]
    if glued and not roles:
        return 'unstated', None, f'the name and the role run together in "{title}", so neither can be read for certain'
    name = ' '.join(t if any(c.isupper() for c in t) else t.capitalize() for t in keep) or None
    return (roles.pop() if roles else 'unstated'), name, None


norm = lambda s: re.sub(r"[^a-z]", '', (s or '').lower())

# Every labeled photo in every gallery.
labels = []  # dicts: puppy_id, media, title, role, name, note, index
for g in galleries:
    if g['id'] not in pups:
        continue
    for m in g['wix']:
        if m['type'] != 'PHOTO':
            continue
        role, name, note = parse(m['title'], breed_words.get(litters[pups[g['id']]['litter_id']]['breed_id'], ()))
        if role:
            labels.append({'puppy_id': g['id'], 'media': m['id'], 'title': m['title'], 'role': role, 'name': name,
                           'note': note, 'index': m['index'], 'on_new_site': m['on_new_site']})

# One media id, one role and one name, filled from its other galleries when this one does not say.
by_media = collections.defaultdict(list)
ext_of = {}
for l in labels:
    ext_of[l['media']] = (re.search(r'\.([A-Za-z0-9]{2,4})$', l['title'] or '') or [None, 'jpg'])[1].lower()
    by_media[l['media']].append(l)
media_fact = {}
for mid, ls in by_media.items():
    roles = {l['role'] for l in ls if l['role'] in ('female', 'male')}
    names = {norm(l['name']) for l in ls if l['name']}
    breeders = {pups[l['puppy_id']]['breeder_id'] for l in ls}
    why = None
    if any(l['role'] == 'conflict' for l in ls) or len(roles) > 1:
        why = 'this photo is labeled mom in one listing and dad in another'
    elif len(names) > 1:
        why = 'this photo carries different dog names in different listings'
    elif len(breeders) > 1:
        why = 'this photo is used by puppies of more than one breeder'
    elif not roles:
        why = next((l['note'] for l in ls if l['note']), None) or 'the file name does not say whether this is the mom or the dad'
    elif not names:
        why = f"this photo is labeled {'mom' if 'female' in roles else 'dad'} but has no name"
    name = next((l['name'] for l in ls if l['name']), None)
    media_fact[mid] = {'role': roles.pop() if len(roles) == 1 else None, 'name': name, 'why': why}

# Per litter and role, the parents its puppies name.
per_litter = collections.defaultdict(lambda: collections.defaultdict(set))
lit_conflict = {}
for l in labels:
    f = media_fact[l['media']]
    lit = pups[l['puppy_id']]['litter_id']
    if f['why'] is None:
        per_litter[lit][f['role']].add(norm(f['name']))
for lit, roles in per_litter.items():
    for role, names in roles.items():
        if len(names) > 1:
            lit_conflict[lit] = (f"puppies in this litter name different {'moms' if role == 'female' else 'dads'} "
                                 f"({', '.join(sorted(n.capitalize() for n in names))})")

# Description facts per puppy: Mom's or Dad's color and weight.
def desc_facts(d):
    out = {}
    for who, role in (('mom', 'female'), ('dad', 'male')):
        for what in ('color', 'weight'):
            m = re.search(rf"(?i)\b{who}'?s?\s+(?:information\s*:?\s*)?{what}\s*[:\-]?\s*([^\n.;,]{{1,40}})", d or '')
            if m:
                out[(role, what)] = m.group(1).strip().lower()
    return out


# Assemble each determined parent: breeder, sex, name.
parent_key = lambda b, sex, name: (b, sex, norm(name))
determined = {}
for l in labels:
    f = media_fact[l['media']]
    p = pups[l['puppy_id']]
    lit = p['litter_id']
    if f['why'] or lit in lit_conflict or bname.get(p['breeder_id'], '').startswith('Unassigned'):
        continue
    k = parent_key(p['breeder_id'], f['role'], f['name'])
    d = determined.setdefault(k, {'breeder_id': p['breeder_id'], 'breeder': bname.get(p['breeder_id']), 'sex': f['role'],
                                  'name': f['name'], 'media': collections.Counter(), 'litters': {}, 'evidence': []})
    d['media'][l['media']] += 1
    d['litters'].setdefault(lit, set()).add(l['puppy_id'])
    d['evidence'].append({'puppy': p['name'], 'puppy_id': p['id'], 'title': l['title'], 'media': l['media']})

# Description contradictions for one parent across its litters.
desc_conflict = {}
for k, d in determined.items():
    seen = collections.defaultdict(set)
    for lit in d['litters']:
        for pid in [x['id'] for x in pups.values() if x['litter_id'] == lit]:
            for (role, what), v in desc_facts(pups[pid]['description']).items():
                if role == d['sex']:
                    seen[what].add(re.sub(r'[^a-z0-9]', '', v))
        w = litters[lit]['mom_weight_lb' if d['sex'] == 'female' else 'dad_weight_lb']
        if w is not None:
            seen['weight_lb'].add(float(w))
    d['description'] = {k2: sorted(map(str, v)) for k2, v in seen.items()}
    if len(seen.get('color', ())) > 1:
        desc_conflict[k] = f"the listings give this {'mom' if d['sex'] == 'female' else 'dad'} different colors ({', '.join(sorted(seen['color']))})"
    ws = seen.get('weight_lb', set())
    if ws and max(ws) - min(ws) > 3:
        desc_conflict[k] = f"the listings give this {'mom' if d['sex'] == 'female' else 'dad'} weights from {min(ws):g} to {max(ws):g} lb"

# Existing rows, matched by breeder, sex and name.
existing = {parent_key(r['breeder_id'], r['sex'], r['name']): r for r in parents if not r['archived_at']}
photos_by_media = collections.defaultdict(list)
for ph in photos:
    for mid in re.findall(r'[0-9a-f]{6}_[0-9a-f]{32}', ph['external_url'] or ''):
        photos_by_media[mid].append(ph)

out, undetermined = [], []
for k, d in sorted(determined.items(), key=lambda kv: (kv[1]['breeder'] or '', kv[1]['sex'], kv[1]['name'])):
    if k in desc_conflict:
        for e in d['evidence']:
            undetermined.append({**e, 'why': desc_conflict[k]})
        continue
    chosen = sorted(d['media'], key=lambda m: (-d['media'][m], m))[0]
    lit_links, lit_skipped = [], []
    col = 'mom_id' if d['sex'] == 'female' else 'dad_id'
    for lit in sorted(d['litters']):
        (lit_skipped if litters[lit][col] else lit_links).append(lit)
    linked_pups = {x['id'] for x in pups.values() if x['litter_id'] in lit_links}
    remove, cover = [], []
    for mid in d['media']:
        for ph in photos_by_media[mid]:
            if ph['puppy_id'] in linked_pups:
                (cover if ph['position'] == 0 else remove).append(ph['id'])
    src = sorted((ph for ph in photos_by_media[chosen] if ph['r2_key'] and '-crop32' not in ph['r2_key']),
                 key=lambda ph: (-(ph['bytes'] or 0), ph['id']))
    ex = existing.get(k)
    out.append({
        'breeder_id': d['breeder_id'], 'breeder': d['breeder'], 'sex': d['sex'], 'name': d['name'],
        'existing_parent_id': ex['id'] if ex else None, 'existing_has_photo': bool(ex and ex['photo_key']),
        'media_ids': dict(d['media']), 'photo_media': chosen,
        'photo_source': {'photo_id': src[0]['id'], 'r2_key': src[0]['r2_key'], 'bytes': src[0]['bytes'],
                         'content_type': src[0]['content_type']} if src else
                        {'wix_url': f'{WIX}{chosen}~mv2.{ext_of[chosen]}'},
        'link_litters': lit_links, 'litters_already_set': lit_skipped,
        'remove_photo_ids': sorted(remove), 'cover_photo_ids_kept': sorted(cover),
        'description': d['description'], 'evidence': d['evidence'],
    })

for l in labels:
    f = media_fact[l['media']]
    p = pups[l['puppy_id']]
    why = f['why'] or lit_conflict.get(p['litter_id'])
    if not why and bname.get(p['breeder_id'], '').startswith('Unassigned'):
        why = 'this listing has no breeder on the new site, so there is nowhere to save the parent'
    if why:
        undetermined.append({'puppy': p['name'], 'puppy_id': p['id'], 'title': l['title'], 'media': l['media'], 'why': why})
for u in undetermined:
    p = pups[u['puppy_id']]
    u.update({'breeder': bname.get(p['breeder_id'], p['breeder_id']), 'availability': p['availability'],
              'litter_id': p['litter_id'], 'photo_url': f"{WIX}{u['media']}~mv2.jpg",
              'wix_page': f"https://lablakeslee.wixsite.com/puppyconnection/product-page/{p['legacy_slug']}",
              'new_page': f"https://www.puppy-connection.com/puppies/{p['slug']}/"})
undetermined.sort(key=lambda u: (u['breeder'], u['puppy'], u['title']))

json.dump(out, open(os.path.join(EV, 'determined.json'), 'w', encoding='utf8'), indent=1)
json.dump(undetermined, open(os.path.join(EV, 'undetermined.json'), 'w', encoding='utf8'), indent=1)
print(f"labeled photos {len(labels)}; determined parents {len(out)} "
      f"(matched {sum(1 for o in out if o['existing_parent_id'])}, new {sum(1 for o in out if not o['existing_parent_id'])}); "
      f"litter links {sum(len(o['link_litters']) for o in out)}; photos removed {sum(len(o['remove_photo_ids']) for o in out)}, "
      f"covers kept {sum(len(o['cover_photo_ids_kept']) for o in out)}; from Wix {sum(1 for o in out if 'wix_url' in o['photo_source'])}; "
      f"undetermined rows {len(undetermined)}")
for o in out:
    print(f"  {o['breeder']:<28} {'mom' if o['sex']=='female' else 'dad'} {o['name']:<12} litters {len(o['link_litters'])} "
          f"remove {len(o['remove_photo_ids'])} cover {len(o['cover_photo_ids_kept'])} {'wix' if 'wix_url' in o['photo_source'] else 'r2'} "
          f"{'EXISTING '+o['existing_parent_id'] if o['existing_parent_id'] else ''} desc={o['description']}")
for u in undetermined:
    print(f"  ? {u['breeder'][:26]:<26} {u['puppy']:<14} {u['title']:<22} {u['why']}")
