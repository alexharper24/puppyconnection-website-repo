import csv, json, sys
rows = [r[0].strip() for r in list(csv.reader(open(sys.argv[1], encoding='utf-8-sig')))[1:]]
db = ["Basset Hound","Bernese Mountain Dog","Boston Terrier","Cavalier King Charles Spaniel","Cavapoo","Cocker Spaniel","Doberman Pinscher","English Bulldog","F1b Mini Goldendoodle","French Bulldog","Golden Retriever","Great Dane","Havanese","Labrador Retriever","Maltese","Mini Aussiedoodle","Mini Bernedoodle","Miniature Dachshund","Miniature Poodle","Miniature Schnauzer","Munchkin Bernedoodle","Papillon","Pembroke Welsh Corgi","Pomeranian","Saint Bernard","Shih Tzu","Shih-poo","Teddy Bear (Shihchon)","Toy Poodle","Victorian Bulldog","Yorkshire Terrier"]
# Wix name -> (action, target, why)
SAME = {  # same dog under two names: fold into the target
 'Golden Doodle': ('Goldendoodle', 'one spelling'),
 'Yorkipoo': ('Yorkiepoo', 'two spellings of one cross'),
 'Mixed Breed Dog': ('Mixed Breed', 'duplicate'),
 'Designer Doodle Mix': ('Doodle Mix', 'duplicate'),
 'Shepherd Doodle': ('Shepadoodle', 'both are German Shepherd and Poodle'),
 'Springerpoo': ('Springerdoodle', 'both are Springer Spaniel and Poodle'),
 'Bichpoo': ('Poochon', 'both are Bichon Frise and Poodle'),
 'Zuchon': ('Teddy Bear (Shichon)', 'Zuchon, Shichon and Teddy Bear are one cross, Shih Tzu and Bichon'),
 'Teddy Bear Dog': ('Teddy Bear (Shichon)', 'same cross, already listed on the site'),
 'Shihpoo': ('Shih-poo', 'already listed on the site as Shih-poo'),
 'Bulldog': ('English Bulldog', 'already listed on the site as English Bulldog, which buyers search'),
 'Aussiepoo': ('Mini Aussiedoodle', 'another name for the small Aussiedoodle'),
}
RENAME = {
 'Moyan': ('Moyen Poodle', 'spelling, and the word Poodle so it is found'),
 'Mal-Shi': ('Malshi', 'usual spelling'),
 'Poodle': ('Standard Poodle', 'the site already lists Miniature and Toy Poodle separately'),
 'Mini Poodle Mix': ('Poodle Mix', 'fold into Poodle Mix'),
}
FIX_DB = {'Teddy Bear (Shihchon)': 'Teddy Bear (Shichon)'}
dupes = sorted({r for r in rows if rows.count(r) > 1})
mixes = sorted({r for r in rows if r.endswith(' Mix') or r.startswith('Mixed Breed')} - set(SAME))
out = {'wix_rows': len(rows), 'distinct': len(set(rows)), 'exact_dupes': dupes, 'same': SAME, 'rename': RENAME, 'fix_db': FIX_DB, 'mixes': mixes}
final = set()
for r in set(rows):
    if r in SAME: final.add(SAME[r][0])
    elif r in RENAME: final.add(RENAME[r][0])
    else: final.add(r)
final = {FIX_DB.get(x, x) for x in final}
dbn = {FIX_DB.get(x, x) for x in db}
out['already_on_site'] = sorted(final & dbn)
out['site_only'] = sorted(dbn - final)
out['new'] = sorted(final - dbn)
out['new_pure'] = sorted(x for x in out['new'] if x not in mixes)
out['final_count'] = len(final | dbn)
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), indent=1)
print({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in out.items()})
print('site only:', out['site_only'])
print('mixes:', mixes)
