-- Amber's answers to the launch asks (2026-10-25) and what the staging deploy that day finished.
-- Her contact details, About words, listing terms, inbox choice, managed breeders and the owners of
-- the unassigned listings are in; the listings are placed (migration 0057); real email runs through
-- Resend on staging; the Stream subscription is on; the Analytics tag is on the site. The mailing
-- list address waits on a PO box. Back up D1 first and confirm the export printed "Downloaded".
-- Re-running changes nothing, because every write is guarded.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-006', NULL, json_object('part', 'cl-006-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-006-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-006-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-080', NULL, json_object('part', 'cl-080-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-080-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-080-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-085', NULL, json_object('part', 'cl-085-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-085-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-085-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-078', NULL, json_object('part', 'cl-078-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-078-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-078-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-011', NULL, json_object('part', 'cl-011-1', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-011-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-011-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-011', NULL, json_object('part', 'cl-011-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-011-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-011-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-074', NULL, json_object('part', 'cl-074-4', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-074-4' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-074-4' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-074', NULL, json_object('part', 'cl-074-3', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-074-3' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-074-3' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-075', NULL, json_object('part', 'cl-075-1', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-075-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-075-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-076', NULL, json_object('part', 'cl-076-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-076-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-076-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-014', NULL, json_object('part', 'cl-014-3', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-014-3' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-014-3' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-014', NULL, json_object('part', 'cl-014-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-014-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-014-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-018', NULL, json_object('part', 'cl-018-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-018-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-018-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-019', NULL, json_object('part', 'cl-019-3', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-019-3' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Amber' WHERE id = 'cl-019-3' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-019', NULL, json_object('part', 'cl-019-5', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-019-5' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T15:00:00Z', done_by = 'Alex' WHERE id = 'cl-019-5' AND done_at IS NULL;

-- Items whose wait has moved.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-006' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-006' AND updated_at < '2026-10-25T15:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-019' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-019' AND updated_at < '2026-10-25T15:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-076' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-076' AND updated_at < '2026-10-25T15:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'waiting', 'waiting_on', 'Alex or Amber publishing the terms from the Terms screen', 'waiting_owner', 'Alex', 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-018' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Alex or Amber publishing the terms from the Terms screen', waiting_owner = 'Alex', updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-018' AND updated_at < '2026-10-25T15:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'waiting', 'waiting_on', 'Amber''s PO box for the bottom of mailing list emails', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-011' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Amber''s PO box for the bottom of mailing list emails', waiting_owner = 'Amber', updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-011' AND updated_at < '2026-10-25T15:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'waiting', 'waiting_on', 'Alex setting the Stream key on the portal', 'waiting_owner', 'Alex', 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-080' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Alex setting the Stream key on the portal', waiting_owner = 'Alex', updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-080' AND updated_at < '2026-10-25T15:00:00Z';

-- Done.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at),
         json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-25T15:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-014' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-25T15:00:00Z', done_by = 'Claude', updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-014' AND updated_at < '2026-10-25T15:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at),
         json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-25T15:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'Amber''s answers of 2026-10-25 and the staging deploy that day')
    FROM checklist_items WHERE id = 'cl-074' AND updated_at < '2026-10-25T15:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-25T15:00:00Z', done_by = 'Claude', updated_at = '2026-10-25T15:00:00Z', version = version + 1
 WHERE id = 'cl-074' AND updated_at < '2026-10-25T15:00:00Z';
