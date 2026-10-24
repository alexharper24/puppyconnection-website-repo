-- Amber's personal touch for the site (Alex, 2026-10-24). She may send photos and videos of people
-- caring for and playing with the puppies, so the site reads as Puppy Connection's own and not only
-- as a directory. Added under Content and wording with her part and Alex's. Claude records it on
-- Alex's instruction. Back up D1 first and confirm the export printed "Downloaded". Re-running
-- changes nothing.

INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at)
  SELECT 'cl-088', 'D7', 'launch', 'content', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'),
         'Personal photos and videos for the site',
         'Amber wants the site to feel functional and professional and still personal to Puppy Connection, with photos or videos of people caring for and playing with the puppies (Alex, 2026-10-24).',
         'Amber', 'waiting', 'Amber sending the photos and videos', 'Amber', '2026-10-24T23:50:00Z', 'Claude', '2026-10-24T23:50:00Z'
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-088' OR ref = 'D7');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:50:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-088', NULL,
         json_object('title', 'Personal photos and videos for the site', 'as', 'Claude', 'why', 'Alex, 2026-10-24')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.add' AND entity_id = 'cl-088');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES
  ('cl-088-1', 'cl-088', 1, 'Send photos or videos of people caring for and playing with the puppies, and anything else that shows the people behind Puppy Connection', 'Amber', '2026-10-24T23:50:00Z', 'Claude'),
  ('cl-088-2', 'cl-088', 2, 'Place them on the home, About and list-with-us pages', 'Alex', '2026-10-24T23:50:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:50:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-088', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-088');
