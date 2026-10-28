-- Basset Hound becomes a breed a breeder can choose (Amber, 2026-10-28: one breeder has Bassets
-- fairly regularly). The AKC standard accepts any recognized hound color, so the suggested color
-- list stays open. Back up D1 first and confirm the export printed "Downloaded". Re-running
-- changes nothing.
INSERT OR IGNORE INTO breeds (id, slug, name) VALUES ('breed-basset-hound', 'basset-hound', 'Basset Hound');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-28T22:30:00Z', 'system', 'claude', 'breed.add', 'breed', 'breed-basset-hound', NULL, json_object('name', 'Basset Hound', 'slug', 'basset-hound', 'why', 'Amber 2026-10-28, a breeder lists Bassets fairly regularly')
   WHERE EXISTS (SELECT 1 FROM breeds WHERE id = 'breed-basset-hound')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'breed-basset-hound' AND action = 'breed.add');
