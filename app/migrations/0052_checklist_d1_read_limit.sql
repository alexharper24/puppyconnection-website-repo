-- The database read limit, a launch readiness item (workplan B13, Alex 2026-10-23). On 2026-10-23
-- staging D1 read 8,085,494 rows in 24 hours, over the free plan's 5 million, and Cloudflare
-- refused its queries, so every /media photo, the portal's data export and publishing failed until
-- the daily reset. Each photo request asks D1 whether its puppy is still public through the
-- public_puppies view, which reads hundreds of rows for one answer. Alex asked for it to be tracked
-- at the project level. Claude records it on his instruction, so the audit row says so. Back up D1
-- first and confirm the export printed "Downloaded". Re-running changes nothing.

INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version)
VALUES ('cl-084', 'B13', 'launch', 'readiness',
  (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'),
  'Keep the site inside the database''s daily read limit',
  'On October 23 the staging database passed the free plan''s 5 million rows read a day, and every puppy photo, the data export and publishing failed until the daily reset. Each photo a visitor loads asks the database whether its puppy is still public, and that question reads hundreds of rows. The fix is to measure the rows one photo request reads, make that check read a few rows, and cache photos at Cloudflare''s edge, with the $5 a month Workers Paid plan as a safety margin if Alex chooses it.',
  'Claude', 'waiting', 'Alex choosing the fix', 'Alex', '2026-10-23T17:00:00Z', 'Claude', '2026-10-23T17:00:00Z', 1);
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-23T17:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', id, NULL,
         json_object('title', title, 'section', 'launch', 'area', 'readiness', 'as', 'Claude', 'why', 'Alex asked for the read limit to be tracked at the project level, 2026-10-23')
    FROM checklist_items WHERE id = 'cl-084'
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = checklist_items.id AND a.action = 'checklist.add');
