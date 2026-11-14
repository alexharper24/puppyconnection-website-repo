"""Write the migration that saves the moms and dads found in the old Wix galleries and links them to their litters
(Alex, 2026-11-13, docs/batch-2026-11-13-wix-parent-photos.md).

  python -X utf8 app/ops/wix_parent_migration.py <state folder>/plan.json <production read folder> <out.sql>

plan.json comes from ops/wix_parent_photos.py (plan, stage, then ops/wix_parent_photos_check.mjs for the size and
focus point). The read folder holds photos.json and pups.json from the production read. For each parent: an
audit row and the parent_dogs row, as the editors' createParent and storeParentPhoto make them, skipped when the id
or a live parent of that breeder, sex and name already exists. For each litter: the link, only where mom_id or dad_id
is still empty. For each labeled gallery photo of a linked puppy that is not its cover: the photos row removed with
a photo.remove audit row, only once the litter holds the parent and the parent holds its photo. The R2 objects of
the removed rows are left in place. Every write is guarded, so a second run changes nothing, and the publish marker
goes first, guarded on the first new parent not existing yet.
"""
import json, os, re, sys
from datetime import datetime, timezone

plan_path, rd, out = sys.argv[1], sys.argv[2], sys.argv[3]
P = json.load(open(plan_path, encoding='utf8'))['parents']
load = lambda n: json.load(open(os.path.join(rd, n + '.json'), encoding='utf8'))[0]['results']
photos = {p['id']: p for p in load('photos')}
pups = {p['id']: p for p in load('pups')}
T = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def q(v):
    if v is None: return 'NULL'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


ROUND2 = os.environ.get('ROUND') == '2'  # 2026-11-14: the breeders' own records as well as the file names
WHY = ("Wix gallery photo or the breeder's own records (Alex, 2026-11-14)" if ROUND2 else
       'Wix gallery photo named for this parent (Alex, 2026-11-13)')
first = next(p for p in P if p['new'])
L = [(f"-- Alex, 2026-11-14 (docs/batch-2026-11-14-breeder-parent-records.md). Written by app/ops/wix_parent_migration.py, generated {T}."
      if ROUND2 else f"-- Alex, 2026-11-13 (docs/batch-2026-11-13-wix-parent-photos.md). Written by app/ops/wix_parent_migration.py, generated {T}."),
     ("-- Moms and dads from the Wix photo file names and the breeders' own sites and records, agreed by two passes. Each is"
      if ROUND2 else "-- Moms and dads named in the photo file names of the old Wix galleries, agreed by two independent passes. Each is"),
     "-- saved as a parent of its breeder, linked to its litters where the litter has none, and its photo leaves the",
     "-- puppies' galleries (never a cover). Every write is guarded, so a second run changes nothing.",
     "UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, " + q(T) + "), generation = generation + 1",
     f"  WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM parent_dogs WHERE id = {q(first['parent_id'])});", '']
n = {'parents': 0, 'links': 0, 'removed': 0}
for p in P:
    pid, b, key = p['parent_id'], p['breeder_id'], p['key']
    c = p.get('checked') or {'full': {'w': None, 'h': None}, 'focus': None}  # a parent with no photo
    f = c['focus'] or {}
    dup = (f"NOT EXISTS (SELECT 1 FROM parent_dogs WHERE id = {q(pid)}) AND NOT EXISTS (SELECT 1 FROM parent_dogs "
           f"WHERE breeder_id = {q(b)} AND sex = {q(p['sex'])} AND lower(name) = lower({q(p['name'])}) AND archived_at IS NULL)")
    files = sorted({e.get('title') or "the breeder's own records" for e in p['evidence']})
    L += [f"-- {p['breeder']}: {'mom' if p['sex'] == 'female' else 'dad'} {p['name']}, from {', '.join(files)}"]
    if p['new']:
        n['parents'] += 1
        L += ["INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)",
              f"  SELECT {q(T)}, 'system', 'claude', 'parent.create', 'parent', {q(pid)}, NULL, json_object('name', {q(p['name'])}, "
              f"'sex', {q(p['sex'])}, 'photo_key', {q(key)}, 'photo_width', {q(c['full']['w'])}, 'photo_height', {q(c['full']['h'])}, "
              f"'focus_x', {q(f.get('fx'))}, 'focus_y', {q(f.get('fy'))}, 'wix_media', {q(p['photo_media'])}, 'why', {q(WHY)})",
              f"  WHERE {dup};",
              "INSERT INTO parent_dogs (id, breeder_id, sex, name, health_tests_json, photo_key, photo_width, photo_height, focus_x, focus_y, created_at, updated_at)",
              f"  SELECT {q(pid)}, {q(b)}, {q(p['sex'])}, {q(p['name'])}, '[]', {q(key)}, {q(c['full']['w'])}, {q(c['full']['h'])}, "
              f"{q(f.get('fx'))}, {q(f.get('fy'))}, {q(T)}, {q(T)}",
              f"  WHERE {dup};"]
    col = 'mom_id' if p['sex'] == 'female' else 'dad_id'
    has = f"EXISTS (SELECT 1 FROM parent_dogs WHERE id = {q(pid)} AND breeder_id = {q(b)})"
    for lit in p['link_litters']:
        n['links'] += 1
        g = f"id = {q(lit)} AND breeder_id = {q(b)} AND {col} IS NULL AND {has}"
        L += ["INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)",
              f"  SELECT {q(T)}, 'system', 'claude', 'litter.update', 'litter', id, json_object('{col}', NULL), "
              f"json_object('{col}', {q(pid)}, 'why', {q(WHY)}) FROM litters WHERE {g};",
              f"UPDATE litters SET {col} = {q(pid)}, updated_at = {q(T)}, version = version + 1 WHERE {g};"]
    for phid in p['remove_photo_ids']:
        ph = photos[phid]
        n['removed'] += 1
        g = (f"id = {q(phid)} AND puppy_id = {q(ph['puppy_id'])} AND r2_key = {q(ph['r2_key'])} AND position <> 0 "
             f"AND EXISTS (SELECT 1 FROM litters WHERE id = {q(pups[ph['puppy_id']]['litter_id'])} AND {col} = {q(pid)}) "
             f"AND EXISTS (SELECT 1 FROM parent_dogs WHERE id = {q(pid)} AND photo_key IS NOT NULL)")
        L += ["INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)",
              f"  SELECT {q(T)}, 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('photo', id, 'r2_key', r2_key, "
              f"'position', position, 'now_parent', {q(pid)}, 'why', {q(WHY)}), NULL FROM photos WHERE {g};",
              f"DELETE FROM photos WHERE {g};"]
    L.append('')
open(out, 'w', encoding='utf8', newline='\n').write('\n'.join(L) + '\n')
print(f"{out}: {n['parents']} parents, {n['links']} litter links, {n['removed']} gallery photos removed")
