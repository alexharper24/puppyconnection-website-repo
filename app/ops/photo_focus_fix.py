"""Write migrations/0090_photo_focus.sql for docs/batch-2026-11-04-photo-focus.md.

Two kinds of change, both to photos of available puppies:
- Photos stored with no width, height or focus (imported 2026-10-02 and 2026-10-18) get the size of the copy the site
  serves and the lib/focus.js detector point, so their cards crop around the dog rather than from the top centre.
- Seven cover photos get a focus point set by hand on the dog's face (Alex, 2026-11-04), because the detector puts
  the point in the middle of the dog box, which is the body for a dog standing side on.

  python app/ops/photo_focus_fix.py <measured.json> app/migrations/0090_photo_focus.sql

measured.json comes from a run of the scratch measure script over the target photos (size from /media/<id>, dog
boxes from the dev/photo-focus Worker on /media/<id>/card). Every write is guarded on the value it replaces, so a
second run changes nothing.
"""
import json, sys
from datetime import datetime, timezone

measured, out = sys.argv[1], sys.argv[2]
T = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
WHY = 'photo focus, Alex 2026-11-04'

# Cover photos whose point is set by hand on the face. The phone card shows 53% of a 3:2 photo's width, so only the
# point across matters for them. Alexa, Harold and Junior keep the centre, where the detector point moved the face
# off centre in the before and after check.
HAND = {
    'seed-p-0228-img0': 0.60,                 # Quest
    'seed-p-0231-wx-bd94e3f53ed6': 0.54,      # Quinn
    'seed-p-0225-wx-c05eca0034ae': 0.55,      # Qeleigh
    'seed-p-0009-wx-e64e9b194369': 0.46,      # Apollo
    'seed-p-0049-wx-247104c2a429': 0.53,      # Brittany
    'seed-p-0242-wx-27a5eed6ae0f': 0.48,      # Sawyer (French Bulldog)
}
COVER_SLUGS_HAND_NEW = {'cosette-papillon': 0.45, 'alexa-cocker-spaniel': 0.5, 'harold-shihpoo': 0.5, 'junior-yorkshire-terrier': 0.5}

rows = json.load(open(measured))
covers = {}
for r in rows:
    c = covers.get(r['puppy_id'])
    if c is None or r['position'] < c['position']:
        covers[r['puppy_id']] = r

q = lambda v: 'NULL' if v is None else (f"'{v}'" if isinstance(v, str) else repr(v))
stmts, first = [], None
for r in sorted(rows, key=lambda r: (r['name'], r['position'])):
    pid, cover = r['id'], covers[r['puppy_id']]['id'] == r['id']
    det = r.get('det_focus')
    if r['width'] is None:
        fx, fy = (det['fx'], det['fy']) if det else (None, None)
        if cover and r['slug'] in COVER_SLUGS_HAND_NEW:
            fx = COVER_SLUGS_HAND_NEW[r['slug']]
        w, h = r['mw'], r['mh']
        guard = f"id = {q(pid)} AND width IS NULL"
        stmts.append(
            "INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
            f"  SELECT {q(T)}, 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), "
            f"json_object('id', id, 'width', {w}, 'height', {h}, 'focus_x', {q(fx)}, 'focus_y', {q(fy)}, 'why', {q(WHY)})\n"
            f"    FROM photos WHERE {guard};")
        stmts.append(f"UPDATE photos SET width = {w}, height = {h}, aspect = COALESCE(aspect, {round(w / h, 4)}), focus_x = {q(fx)}, focus_y = {q(fy)} WHERE {guard};")
        first = first or guard
    elif pid in HAND:
        fx = HAND[pid]
        guard = f"id = {q(pid)} AND focus_x = {r['focus_x']!r}"
        stmts.append(
            "INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)\n"
            f"  SELECT {q(T)}, 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), "
            f"json_object('id', id, 'focus_x', {fx}, 'by', 'hand, on the face', 'why', {q(WHY)})\n"
            f"    FROM photos WHERE {guard};")
        stmts.append(f"UPDATE photos SET focus_x = {fx} WHERE {guard};")
        first = first or guard

head = f"""-- Alex, 2026-11-04 (docs/batch-2026-11-04-photo-focus.md). Written by app/ops/photo_focus_fix.py, generated {T}.
-- Photos of available puppies stored with no size or focus get the size of the copy the site serves and the
-- lib/focus.js detector point, and seven cover photos get a point set by hand on the dog's face for the phone card.
-- Every write is guarded on the value it replaces, so a second run changes nothing.
-- The publish marker goes first, guarded on the first photo still holding its old value.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '{T}'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE {first});
"""
open(out, 'w', encoding='utf8', newline='\n').write(head + '\n' + '\n'.join(stmts) + '\n')
print(f'{out}: {len(stmts) // 2} photos')
