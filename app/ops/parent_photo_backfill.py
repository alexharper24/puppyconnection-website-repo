"""Write the migration that gives existing mom and dad photos a size and a focus point (Alex, 2026-11-10).

  python app/ops/parent_photo_backfill.py <measured.json> <hand.json> <out.sql>

measured.json is a list of {"id", "name", "photo_key", "w", "h", "focus"}: each parent photo's size, read from
the photo the site serves, and the dog detector's point on its card copy with the lib/focus.js rule (null where no
dog was found). hand.json maps a parent id to {"fx", "fy"} set by hand on the face, checked as before and after
4:3 parent card crops. Each write is guarded on the photo it was measured from and on no size being stored yet,
so a second run, or a photo replaced since, changes nothing. Each gets an audit row, and the publish marker goes first.
"""
import json, sys
from datetime import datetime, timezone

measured, hand, out = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
T = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
q = lambda v: 'NULL' if v is None else f"'{v}'" if isinstance(v, str) else repr(v)
guard = lambda r: f"id = {q(r['id'])} AND photo_key = {q(r['photo_key'])} AND photo_width IS NULL"
lines = [f"-- Alex, 2026-11-10 (docs/batch-2026-11-10-parent-photos.md). Written by app/ops/parent_photo_backfill.py, generated {T}.",
         "-- The size and focus point of each mom and dad photo saved before migrations/0095, so its 4:3 card on a puppy",
         "-- page is cut around the dog. Points come from the dog detector, or by hand on the face where it found no dog.",
         "-- Every write is guarded on the photo it was measured from and on no size stored yet.",
         f"UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, {q(T)}), generation = generation + 1",
         f"  WHERE id = 1 AND EXISTS (SELECT 1 FROM parent_dogs WHERE {guard(measured[0])});", '']
for r in measured:
    f, by = (hand[r['id']], 'hand, on the face') if r['id'] in hand else (r['focus'], 'detector') if r['focus'] else (None, 'none')
    fx, fy = (f['fx'], f['fy']) if f else (None, None)
    lines += [f"-- {r['name']}, {r['w']} by {r['h']}, point by {by}",
              "INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)",
              f"  SELECT {q(T)}, 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, "
              f"json_object('photo_width', {r['w']}, 'photo_height', {r['h']}, 'focus_x', {q(fx)}, 'focus_y', {q(fy)}, 'by', {q(by)})",
              f"    FROM parent_dogs WHERE {guard(r)};",
              f"UPDATE parent_dogs SET photo_width = {r['w']}, photo_height = {r['h']}, focus_x = {q(fx)}, focus_y = {q(fy)} WHERE {guard(r)};"]
open(out, 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
print(f'{out}: {len(measured)} parent photos, {sum(1 for r in measured if r["id"] in hand)} set by hand')
