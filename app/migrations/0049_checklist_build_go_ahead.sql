-- Alex gave the go-ahead on 2026-10-21 for the three items Amber moved to launch on her plan notes:
-- saved moms and dads, document uploads and listing quality prompts. Each stops waiting on his
-- go-ahead and is in progress. He also kept Report a listing on at launch, so its item no longer
-- waits on him, only on the privacy policy line and real email. Claude records both on Alex's
-- instruction, so each audit row says so. No prices go in the database. Back up D1 first and
-- confirm the export printed "Downloaded". Re-running changes nothing.

-- The go-ahead on the three launch build items.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-21T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Alex gave the go-ahead, 2026-10-21')
    FROM checklist_items WHERE id IN ('cl-059', 'cl-060', 'cl-063') AND status = 'waiting';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL,
       updated_at = '2026-10-21T20:00:00Z', version = version + 1
 WHERE id IN ('cl-059', 'cl-060', 'cl-063') AND status = 'waiting';

-- Report a listing stays on at launch, so it waits only on the privacy policy line and real email.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-21T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'the privacy policy line and real email', 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Alex kept it on at launch, 2026-10-21')
    FROM checklist_items WHERE id = 'cl-009' AND waiting_owner = 'Alex';
UPDATE checklist_items SET waiting_on = 'the privacy policy line and real email. Alex kept it on at launch (2026-10-21)', waiting_owner = NULL,
       updated_at = '2026-10-21T20:00:00Z', version = version + 1
 WHERE id = 'cl-009' AND waiting_owner = 'Alex';
