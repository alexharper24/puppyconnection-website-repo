-- The staging database becomes the production one once the test data is cleared (Alex,
-- 2026-10-19; workplan B12). On the checklist this ticks Alex's decision part as done by him, puts
-- the item in progress, and adds a comment that it follows clearing the test data. Writing and
-- rehearsing the steps stays open. Claude records it, so the audit rows say so.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing.

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:20:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-079', NULL,
         json_object('part', 'cl-079-1', 'title', 'Decide whether staging becomes production', 'decided_by', 'Alex', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-079-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-19T12:00:00Z', done_by = 'Alex' WHERE id = 'cl-079-1' AND done_at IS NULL;

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:20:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-079',
         json_object('status', status), json_object('status', 'in_progress', 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-079' AND status = 'not_started';
UPDATE checklist_items SET status = 'in_progress', updated_at = '2026-10-20T02:20:00Z', version = version + 1
 WHERE id = 'cl-079' AND status = 'not_started';

INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at) VALUES
  ('cl-079-c1', 'cl-079', 'Claude', 'claude',
   'Alex decided on October 19, 2026 that the staging database becomes the production one. This follows "Clear the test breeders and test data", so the steps are written and rehearsed once the test data is gone.',
   '2026-10-20T02:20:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:20:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-079', NULL, json_object('comment', 'cl-079-c1', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'cl-079' AND action = 'checklist.comment' AND after_json LIKE '%cl-079-c1%');
