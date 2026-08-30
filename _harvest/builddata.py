# Builds data/data.js from the harvest. Re-runnable.
import json, io, re, glob, os, collections

L = json.load(open('_harvest/data/listings.json', encoding='utf-8'))
try:
    BREED_PHOTOS = json.load(open('_harvest/data/breedphotos.json', encoding='utf-8'))
except FileNotFoundError:
    BREED_PHOTOS = {}
try:
    BREEDER_LINKS = json.load(open('_harvest/data/breederlinks.json', encoding='utf-8'))
except FileNotFoundError:
    BREEDER_LINKS = {}
try:
    # True aspect ratio of every photo, measured by measure.py.
    ASPECTS = json.load(open('_harvest/data/aspects.json', encoding='utf-8'))
except FileNotFoundError:
    ASPECTS = {}
B = json.load(open('_harvest/data/breeds.json', encoding='utf-8'))

canon = {b['name'].lower(): b['name'] for b in B}
alias = {
    'cavalier king charles': 'Cavalier King Charles Spaniel',
    'miniature  poodle': 'Miniature Poodle',
    'teddy bear shihchon': 'Teddy Bear (Shihchon)',
    'saint bernard': 'Saint Bernard',
    'st. bernard': 'Saint Bernard',
    'yorkie': 'Yorkshire Terrier',
}


def fixbreed(n):
    if not n:
        return None
    k = re.sub(r'\s+', ' ', n).strip()
    return alias.get(k.lower(), canon.get(k.lower(), k))


def is_prose(s):
    return len(s) > 60 or s.rstrip().endswith(('.', '!', '?', '”', '"')) or s.count(' ') > 6


# The four breeder sites the live catalog actually references. Listings name
# the breeder from this map, so the name on the page always agrees with the
# contact links beside it.
BREEDER_NAMES = {
    'peacefulpawspuppies.com': 'Peaceful Paws Puppies',
    'responsibledogbreeder.com': 'Responsible Dog Breeder',
    'chainolakescompanions.com': "Chain O' Lakes Companions",
    'kingdomfamilycompanions.com': 'Kingdom Family Companions',
}


# Derived from the live corpus: the phrases breeders actually reuse in the
# "what I come home with" list. Longest first so partials do not win.
INCLUDE_PHRASES = [
    'Two year genetic health guarantee',
    'One year genetic health guarantee',
    'Six month genetic health guarantee',
    'Examination and report by our vet',
    'Vaccination/Health Record',
    'Parents are health tested',
    'Breeding rights are $500',
    'Examination by our vet',
    'Dew claws are removed',
    'Breeding rights $500',
    'Vet exam and report',
    'Small bag of food',
    'AKC registration',
    'Collar and leash',
    'AKC registered',
    'Tail is docked',
    'Microchipped',
    'Tail docked',
    'Blanket',
    'Collar',
    'Toy',
]


# ---- breeder profiles ----
breeders = []
files = sorted(glob.glob('_harvest/copy/breeder-*.txt')) + sorted(glob.glob('_harvest/copy/copy-of-breeder-*.txt'))
for f in files:
    lines = [l.strip() for l in io.open(f, encoding='utf-8').read().split('\n') if l.strip()]
    if not lines:
        continue
    name = re.sub(r'^\s*Breeder\s*-?\s*', '', lines[0])
    name = re.sub(r'\s*\|\s*Puppy Connection\s*$', '', name).strip()
    rest = lines[1:]
    people = rest[0] if rest and not is_prose(rest[0]) else None
    i = 1 if people else 0
    kennel = None
    if len(rest) > i and not is_prose(rest[i]):
        kennel = rest[i]
        i += 1
    body = [l for l in rest[i:]
            if l != 'View Health Guarantee'
            and len(l) > 50
            and not re.search(r'©|\bSitemap\b|\bPrivacy Policy\b|All Rights Reserved', l, re.I)]
    if not body:
        continue
    breeders.append({
        'slug': re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
        'name': name, 'people': people, 'kennel': kennel or name, 'body': body,
    })

# ---- litters, normalisation, demo pairing ----
lit = {}
for r in L:
    d, b = r.get('breeder_domain'), r.get('birthdate')
    if d and b:
        lit.setdefault(re.sub(r'[^a-z0-9]+', '-', (d + '-' + b).lower()).strip('-'), []).append(r['slug'])

for i, r in enumerate(L):
    d, b = r.get('breeder_domain'), r.get('birthdate')
    k = re.sub(r'[^a-z0-9]+', '-', (d + '-' + b).lower()).strip('-') if d and b else None
    r['litter'] = k if k and len(lit.get(k, [])) > 1 else None
    r['breed'] = fixbreed(r.get('breed'))
    r['deposit'] = int(str(r['deposit']).replace(',', '')) if r.get('deposit') else None
    r['demo_breeder'] = breeders[i % len(breeders)]['slug'] if breeders else None

    # Status currently lives inside the product NAME on the live site,
    # e.g. "*ADOPTED* Loyal - Cavalier King Charles Spaniel".
    # Lift it into a real field and clean the display name.
    nm = r.get('puppy_name') or ''
    status = 'available'
    if re.search(r'pending', nm, re.I):
        status = 'pending'
    elif re.search(r'adopted|sold', nm, re.I):
        status = 'adopted'
    nm = re.sub(r'\*[^*]*\*', ' ', nm)
    nm = re.sub(r'\b(ADOPTED|SOLD|PENDING ADOPTION|PENDING)\b', ' ', nm, flags=re.I)
    r['status'] = status
    r['puppy_name'] = re.sub(r'\s+', ' ', nm).strip(' -–')

    desc = r.get('description') or ''

    # "What I come home with" arrives as a flattened run of list items.
    # Match against the phrase set the breeders actually reuse, longest first.
    blk = re.search(r'What (?:I|they) come home with\s*:?(.*?)'
                    r'(?:Call/?\s*Text|Call:|Email|Website|Breeder|$)', desc, re.I | re.S)
    found = []
    if blk:
        text = blk.group(1)
        for phrase in INCLUDE_PHRASES:
            m = re.search(re.escape(phrase), text, re.I)
            if m:
                found.append((m.start(), phrase))
        found.sort()
    r['includes'] = [p for _, p in found]

    # Contact details, re-parsed. The source runs fields together with no
    # separator ("...@x.comWebsite: www.x.com"), so stop at the TLD.
    m = re.search(r'([\w.+-]+@[\w-]+\.(?:com|net|org))', desc, re.I)
    r['breeder_email'] = m.group(1) if m else None
    m = re.search(r'(?:Call/?\s*Text|Call|Phone)\s*[-:]?\s*(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})', desc, re.I)
    r['breeder_phone'] = m.group(1).strip() if m else None

    # The description duplicates every structured field, then the includes list,
    # then the contact block. Keep only the breeder's own prose.
    body = desc
    body = re.split(r'What (?:I|they) come home with', body, flags=re.I)[0]
    body = re.split(r'Call/?\s*Text\s*[-:]|(?<![\w])Call\s*:|Email\s*:|Website\s*:', body, flags=re.I)[0]
    # Everything before the narrative is a dump of fields already shown in the
    # facts table, in half a dozen inconsistent formats. Rather than strip each
    # variant, cut to where the prose starts: the breeder opens with the puppy's
    # own name ("Darcy is a gorgeous little guy...").
    nm_clean = re.sub(r'\s+', ' ', nm).strip(' -–')
    cut = None
    if nm_clean:
        m = re.search(r'\b' + re.escape(nm_clean) + r'\b\s+(?:is|was|has|loves|comes|will)\b', body)
        if not m:
            m = re.search(r'\b' + re.escape(nm_clean) + r'\b', body)
        if m:
            cut = m.start()
    if cut is None:
        for pat, flags in (
            (r'Price\s*[-:]\s*\$?[\d,]+', re.I),
            (r'Deposit\s*[-:]\s*\$?[\d,]+', re.I),
            (r'Birth\s*date\s*[-:]?\s*[A-Z][a-z]+ \d{1,2},? \d{4}', re.I),
            (r'Ready to go\s*[-:]?\s*[A-Z][a-z]+ \d{1,2},? \d{4}', re.I),
            (r"(?:Mom|Dad)'?s weight\s*[-:]?\s*[\w. ]{1,14}lbs", re.I),
        ):
            body = re.sub(pat, ' ', body, flags=flags)
    else:
        body = body[cut:]
    note = None
    m = re.search(r'\*{2,}\s*(.*?)\s*$', body)
    if m:
        note = re.sub(r'\s+', ' ', m.group(1)).strip()
        body = body[:m.start()]
    r['note'] = note
    body = re.sub(r'\s+', ' ', body).strip(' -–*')
    # Known typos in the source content, fixed only where unambiguous.
    body = body.replace('Hereceives', 'He receives').replace('Shereceives', 'She receives')
    r['description'] = body

    # Who actually raised it, taken from the domain rather than a staged pairing.
    r['breeder_name'] = BREEDER_NAMES.get(r.get('breeder_domain'))

    # Deepest link we could find on the breeder's own site. tier is 'puppy',
    # 'breed' or 'available'; the label on the page depends on it.
    link = BREEDER_LINKS.get(r['slug'])
    r['breeder_url'] = link['url'] if link else None
    r['breeder_url_tier'] = link['tier'] if link else None

    # Store bare Wix media URLs. The page appends the transform it needs, so a
    # 76px thumbnail stops downloading a 1400px file.
    ims = [re.sub(r'/v1/.*$', '', u) for u in (r.get('images') or [])]

    # Card slots are 3:2, so a portrait photo cropped to fit loses the dog.
    # Lead with a landscape shot where the breeder uploaded one, keeping the
    # rest in their original order. ASPECTS is measured, not guessed: every
    # source URL arrives as a 4:3 crop and hides the true shape.
    wide = [u for u in ims if (ASPECTS.get(u) or 0) >= 1.25]
    r['images'] = wide + [u for u in ims if u not in wide]
    r['lead_aspect'] = ASPECTS.get(r['images'][0]) if r['images'] else None

# ---- breed guides, harvested from her existing breed information pages ----
BOILER = ('Puppy Application', 'View more puppies', 'Search by Breed', 'Category',
          'Quick View', 'PRICE', 'All Products', 'Contact us', 'Submit')
guides = {}
for f in glob.glob('_harvest/copy/breeds/*.txt'):
    stem = os.path.basename(f)[:-4]
    key = re.sub(r'-breed-info\w*$', '', stem).replace('-', ' ').strip()
    lines = [l.strip() for l in io.open(f, encoding='utf-8').read().split('\n') if l.strip()]
    paras = [l for l in lines
             if len(l) > 70
             and not any(b.lower() in l.lower() for b in BOILER)
             and not re.search(r'©|Sitemap|Privacy Policy|precious paws and puppy breath', l, re.I)]
    if paras:
        guides[key.lower()] = paras[:6]

counts = collections.Counter(r['breed'] for r in L if r['breed'])
known = {b['name'] for b in B}
breeds = [dict(b, demo_count=counts[b['name']]) for b in B if counts.get(b['name'])]
for name, c in counts.items():
    if name not in known and c >= 2:
        breeds.append({'name': name, 'slug': re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
                       'live_count': c, 'demo_count': c})
breeds.sort(key=lambda b: -b['demo_count'])

# attach a guide and a representative photo to each breed
# breed name -> guide-page key (the guide pages are named inconsistently)
GUIDE_ALIAS = {'cavapoo': 'cava poo', 'pembroke welsh corgi': 'corgi',
               'yorkshire terrier': 'yorkie', 'saint bernard': 'st bernard'}
for b in breeds:
    key = b['name'].lower()
    g = guides.get(key) or guides.get(GUIDE_ALIAS.get(key, ''), None)
    if not g:
        for gk, gv in guides.items():
            if gk and (gk in key or key in gk):
                g = gv
                break
    b['guide'] = g or []
    # Prefer a landscape photo, chosen by _harvest/pickphotos.py, so the 3:2
    # slot crops by almost nothing. Falls back to the first image available.
    pick = BREED_PHOTOS.get(b['name'])
    if pick:
        b['photo'] = pick['photo']
        b['photo_aspect'] = pick['aspect']
    else:
        shot = next((r for r in L if r['breed'] == b['name'] and r.get('images')), None)
        b['photo'] = shot['images'][0] if shot else None
print('guides matched:', sum(1 for b in breeds if b['guide']), 'of', len(breeds))

io.open('data/data.js', 'w', encoding='utf-8').write(
    '// Generated by _harvest/builddata.py from the live Puppy Connection catalog.\n'
    '// Listing-to-breeder pairing is STAGED for the demo; the live data does not link them.\n'
    'window.PC_LISTINGS=' + json.dumps(L, ensure_ascii=False, separators=(',', ':')) + ';\n'
    'window.PC_BREEDS=' + json.dumps(breeds, ensure_ascii=False, separators=(',', ':')) + ';\n'
    'window.PC_BREEDERS=' + json.dumps(breeders, ensure_ascii=False, separators=(',', ':')) + ';\n')

print('listings :', len(L))
print('in litters:', sum(1 for r in L if r['litter']), 'across', len({r['litter'] for r in L if r['litter']}), 'litters')
print('breeds   :', len(breeds))
print('breeders :', len(breeders))
print('data.js  :', round(os.path.getsize('data/data.js') / 1024), 'KB')
