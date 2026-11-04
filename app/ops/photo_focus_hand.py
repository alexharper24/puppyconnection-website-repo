"""Write a migration that sets photo focus points by hand, for crops the detector point gets wrong.

  python app/ops/photo_focus_hand.py <points.json> <out.sql> "<why>"

points.json is a list of {"id", "name", "old", "new"}: the photo id, the puppy name for the comment, the focus_x the
photo holds now and the focus_x to set. Only the point across is set, because a 3:2 or square photo is cropped only
across on the 4:5 phone card and not at all on the 3:2 desktop card. Each write is guarded on the old value, so a
second run changes nothing, and each gets an audit row. The publish marker goes first.
"""
import json, sys
from datetime import datetime, timezone

points, out, why = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
T = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
q = lambda v: f"'{v}'" if isinstance(v, str) else repr(v)
first = f"id = {q(points[0]['id'])} AND focus_x = {points[0]['old']!r}"
lines = [f"-- {why}. Written by app/ops/photo_focus_hand.py, generated {T}.",
         "-- Focus points set by hand on the dog's face for the 4:5 phone card. Every write is guarded on the old value.",
         f"UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, {q(T)}), generation = generation + 1",
         f"  WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE {first});", '']
for p in points:
    guard = f"id = {q(p['id'])} AND focus_x = {p['old']!r}"
    lines += [f"-- {p['name']}",
              "INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)",
              f"  SELECT {q(T)}, 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), "
              f"json_object('id', id, 'focus_x', {p['new']!r}, 'by', 'hand, on the face', 'why', {q(why)})",
              f"    FROM photos WHERE {guard};",
              f"UPDATE photos SET focus_x = {p['new']!r} WHERE {guard};"]
open(out, 'w', encoding='utf8', newline='\n').write('\n'.join(lines) + '\n')
print(f'{out}: {len(points)} photos')
