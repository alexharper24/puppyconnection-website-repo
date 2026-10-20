-- Visitor analytics is Google Analytics 4 (Alex, 2026-10-19; workplan B11). The checklist item no
-- longer waits on Alex's choice. It waits on Amber giving Alex access to a GA4 property, and carries
-- a part for each step. Back up D1 first and confirm the export printed "Downloaded".
-- Re-running changes nothing.

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', i.id,
         json_object('title', i.title, 'waiting_on', i.waiting_on, 'waiting_owner', i.waiting_owner),
         json_object('title', 'Google Analytics 4 on the new site',
                     'waiting_on', 'Amber adding Alex to a GA4 property, or letting him create one under the Puppy Connection Google account',
                     'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'Alex chose Google Analytics 4')
    FROM checklist_items i
   WHERE i.id = 'cl-078' AND i.title != 'Google Analytics 4 on the new site';

UPDATE checklist_items
   SET title = 'Google Analytics 4 on the new site',
       description = 'Alex chose Google Analytics 4 because it fits the client reporting dashboard. It goes in before cutover, so the first weeks after launch can be compared with Wix.',
       status = 'waiting',
       waiting_on = 'Amber adding Alex to a GA4 property, or letting him create one under the Puppy Connection Google account',
       waiting_owner = 'Amber',
       updated_at = '2026-10-20T02:00:00Z', version = version + 1
 WHERE id = 'cl-078' AND title != 'Google Analytics 4 on the new site';

INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES
  ('cl-078-1', 'cl-078', 1, 'Grant Alex access to the GA4 property', 'Amber', '2026-10-20T02:00:00Z', 'Claude'),
  ('cl-078-2', 'cl-078', 2, 'Add the measurement tag to every page and the portal sign-up', 'Alex', '2026-10-20T02:00:00Z', 'Claude'),
  ('cl-078-3', 'cl-078', 3, 'Set up events for clicks to a breeder''s website, phone and email', 'Alex', '2026-10-20T02:00:00Z', 'Claude'),
  ('cl-078-4', 'cl-078', 4, 'Add the property to the client reporting dashboard', 'Alex', '2026-10-20T02:00:00Z', 'Claude'),
  ('cl-078-5', 'cl-078', 5, 'Confirm visits show in Realtime on launch day', 'Alex', '2026-10-20T02:00:00Z', 'Claude');
