"""Write migration 0081 from review.json: the Wix breed list (Alex, 2026-10-31) after merges, spelling fixes and the
mixes decision (one Mixed Breed choice plus Doodle Mix)."""
import json, re, sys, datetime
d = json.load(open('review.json', encoding='utf-8'))
KEEP_MIX = {'Mixed Breed', 'Doodle Mix'}
names = [n for n in d['new'] if n not in d['mixes'] or n in KEEP_MIX]
names = [n for n in names if n != 'Poodle Mix']  # Mini Poodle Mix folded here, and mixes stay off
t = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
slug = lambda n: re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', n.lower())).strip('-')
q = lambda s: "'" + s.replace("'", "''") + "'"
out = [f"""-- 0081. The Wix breed list (Alex, 2026-10-31), so a breeder can list any breed whether or not it has a page yet.
-- {len(names)} breeds from the Wix export of 335 rows, after app/docs/breed-list-review.html: two exact repeats and twelve
-- second names folded into one, Moyan, Mal-Shi and Poodle renamed, and the "Breed Mix" names left off except Mixed
-- Breed and Doodle Mix (Alex agreed, 2026-10-31). The Teddy Bear cross already on the site takes the Shichon spelling
-- and keeps its address. Every insert is OR IGNORE on the unique id, slug and name, so a second run changes nothing.
-- Generated {t} by the scratchpad script make_migration.py from review.json.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '{t}'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM breeds WHERE id = 'breed-teddy-bear-shihchon' AND name = 'Teddy Bear (Shihchon)');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{t}', 'system', 'claude', 'breed.rename', 'breed', id, json_object('name', name), json_object('name', 'Teddy Bear (Shichon)', 'why', 'spelling, Alex 2026-10-31')
    FROM breeds WHERE id = 'breed-teddy-bear-shihchon' AND name = 'Teddy Bear (Shihchon)';
UPDATE breeds SET name = 'Teddy Bear (Shichon)' WHERE id = 'breed-teddy-bear-shihchon' AND name = 'Teddy Bear (Shihchon)';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, after_json)
  SELECT '{t}', 'system', 'claude', 'breed.import', 'breed', 'wix-list', json_object('count', {len(names)}, 'why', 'Wix breed list, Alex 2026-10-31')
    WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'breed.import' AND entity_id = 'wix-list');"""]
for n in sorted(names):
    s = slug(n)
    out.append(f"INSERT OR IGNORE INTO breeds (id, slug, name) VALUES ({q('breed-' + s)}, {q(s)}, {q(n)});")
open(sys.argv[1], 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
print(len(names), 'breeds')
