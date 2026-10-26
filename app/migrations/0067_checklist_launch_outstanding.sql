-- The launch checklist cut to what is still outstanding for launch (Alex, 2026-10-26, batch
-- 2026-10-26-launch-prep). Done items are ticked with their evidence as a comment, the work that
-- follows launch moves to the Gate 1 list with its area, and two cutover items are added: turning
-- off the remaining Wix automations, and the launch invitations. Back up D1 first and confirm the
-- export printed "Downloaded". Re-running changes nothing, because every write is guarded.

-- Parts finished.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-005', NULL, json_object('part', 'cl-005-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-005-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-005-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-7', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-7' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-017-7' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-6', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-6' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Amber' WHERE id = 'cl-017-6' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-017-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-012', NULL, json_object('part', 'cl-012-3', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-012-3' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-012-3' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-028', NULL, json_object('part', 'cl-028-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-028-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Amber' WHERE id = 'cl-028-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-028', NULL, json_object('part', 'cl-028-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-028-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-028-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-010', NULL, json_object('part', 'cl-010-2', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-010-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Amber' WHERE id = 'cl-010-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-010', NULL, json_object('part', 'cl-010-3', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-010-3' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-010-3' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-078', NULL, json_object('part', 'cl-078-3', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-078-3' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-078-3' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-088', NULL, json_object('part', 'cl-088-1', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-088-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Amber' WHERE id = 'cl-088-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-088', NULL, json_object('part', 'cl-088-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-088-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-26T22:00:00Z', done_by = 'Alex' WHERE id = 'cl-088-2' AND done_at IS NULL;

-- A part that belongs to client reporting rather than launch.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-078', NULL, json_object('part', 'cl-078-4', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-078-4' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-26T22:00:00Z', archived_by = 'Claude' WHERE id = 'cl-078-4' AND archived_at IS NULL;

-- Parts added.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-010', NULL, json_object('part', 'cl-010-4', 'title', 'Add her bank account in Stripe so payouts can reach her', 'owner', 'Amber', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-010-4');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-010-4', 'cl-010', 4, 'Add her bank account in Stripe so payouts can reach her', 'Amber', '2026-10-26T22:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-013', NULL, json_object('part', 'cl-013-4', 'title', 'Remove the test operator amber@puppyconnection.test from the admin people list', 'owner', 'Alex', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-013-4');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-013-4', 'cl-013', 4, 'Remove the test operator amber@puppyconnection.test from the admin people list', 'Alex', '2026-10-26T22:00:00Z', 'Claude');

-- Items finished.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-005', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-005' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-005' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-008', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-008' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-008' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-017', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-017' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-017' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-012', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-012' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-012' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-028', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-028' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-028' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-085', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-085' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-085' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-088', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at), json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-26T22:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-088' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-26T22:00:00Z', done_by = 'Claude', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-088' AND updated_at < '2026-10-26T22:00:00Z';

-- Items whose wait has moved.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-009', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner), json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-009' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-009' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-010', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner), json_object('status', 'waiting', 'waiting_on', 'Amber adding her bank account in Stripe', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-010' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Amber adding her bank account in Stripe', waiting_owner = 'Amber', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-010' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-075', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner), json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-075' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-075' AND updated_at < '2026-10-26T22:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-029', json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner), json_object('status', 'waiting', 'waiting_on', 'Amber making the test payment', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-029' AND updated_at < '2026-10-26T22:00:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Amber making the test payment', waiting_owner = 'Amber', updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-029' AND updated_at < '2026-10-26T22:00:00Z';

-- Work that follows launch moves to the Gate 1 list.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.move', 'checklist_item', 'cl-011', json_object('section', section, 'area', area, 'position', position), json_object('section', 'gate1', 'area', 'after-launch', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-011' AND section = 'launch';
UPDATE checklist_items SET section = 'gate1', area = 'after-launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'),
       updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-011' AND section = 'launch';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.move', 'checklist_item', 'cl-027', json_object('section', section, 'area', area, 'position', position), json_object('section', 'gate1', 'area', 'after-launch', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-027' AND section = 'launch';
UPDATE checklist_items SET section = 'gate1', area = 'after-launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'),
       updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-027' AND section = 'launch';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.move', 'checklist_item', 'cl-080', json_object('section', section, 'area', area, 'position', position), json_object('section', 'gate1', 'area', 'after-launch', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-080' AND section = 'launch';
UPDATE checklist_items SET section = 'gate1', area = 'after-launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'),
       updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-080' AND section = 'launch';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.move', 'checklist_item', 'cl-030', json_object('section', section, 'area', area, 'position', position), json_object('section', 'gate1', 'area', 'after-launch', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-030' AND section = 'launch';
UPDATE checklist_items SET section = 'gate1', area = 'after-launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'),
       updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-030' AND section = 'launch';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.move', 'checklist_item', 'cl-031', json_object('section', section, 'area', area, 'position', position), json_object('section', 'gate1', 'area', 'after-launch', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-031' AND section = 'launch';
UPDATE checklist_items SET section = 'gate1', area = 'after-launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'),
       updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-031' AND section = 'launch';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.move', 'checklist_item', 'cl-032', json_object('section', section, 'area', area, 'position', position), json_object('section', 'gate1', 'area', 'after-launch', 'as', 'Claude', 'why', 'launch checklist cut to what is outstanding for launch, 2026-10-26')
    FROM checklist_items WHERE id = 'cl-032' AND section = 'launch';
UPDATE checklist_items SET section = 'gate1', area = 'after-launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'),
       updated_at = '2026-10-26T22:00:00Z', version = version + 1
 WHERE id = 'cl-032' AND section = 'launch';

-- Cutover items not on the checklist yet.
INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version)
  SELECT 'cl-089', 'A28', 'launch', 'search', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Turn off the remaining Wix automations', 'Four Wix automations still run and turn off at cutover: Greet new visitors with a chat message, Subscription on Puppies Page, Email visitors to recover abandoned carts, and Ask customers for feedback via email. Email new site members after 14 days was turned off on 2026-10-26.', 'Alex', 'waiting', 'cutover day', 'Alex', '2026-10-26T22:00:00Z', 'Claude', '2026-10-26T22:00:00Z', 1
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-089');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-089', NULL, json_object('title', 'Turn off the remaining Wix automations', 'owner', 'Alex', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-089')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-089' AND a.action = 'checklist.add');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-089-1', 'cl-089', 1, 'Turn off the four automations in Wix', 'Alex', '2026-10-26T22:00:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version)
  SELECT 'cl-090', 'A29', 'launch', 'listings', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Send the launch invitations', 'Teapup is invited at pups@teapup.com at launch. The Responsible Dog Breeder Network is invited at administrator@responsibledogbreeder.com for its 14 kennels, once its breeders move to their own accounts after October 30.', 'Alex', 'waiting', 'cutover day', 'Alex', '2026-10-26T22:00:00Z', 'Claude', '2026-10-26T22:00:00Z', 1
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-090');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-090', NULL, json_object('title', 'Send the launch invitations', 'owner', 'Alex', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-090')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-090' AND a.action = 'checklist.add');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-090-1', 'cl-090', 1, 'Invite Teapup at pups@teapup.com', 'Alex', '2026-10-26T22:00:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-090-2', 'cl-090', 2, 'Invite the Responsible Dog Breeder Network for its 14 kennels after October 30', 'Alex', '2026-10-26T22:00:00Z', 'Claude');

-- The multi-kennel sign-in, built and live since 2026-10-25, was never on the checklist.
INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, done_at, done_by, created_at, created_by, updated_at, version)
  SELECT 'cl-091', 'A27', 'launch', 'build', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'One sign-in for several kennels', 'One person can manage several kennels with one sign-in and switch between them, so the Responsible Dog Breeder Network can manage each kennel it lists for.', 'Alex', 'done', '2026-10-26T22:00:00Z', 'Claude', '2026-10-26T22:00:00Z', 'Claude', '2026-10-26T22:00:00Z', 1
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-091');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-091', NULL, json_object('title', 'One sign-in for several kennels', 'status', 'done', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-091')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-091' AND a.action = 'checklist.add');

-- Comments with the evidence.
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-091-c67-1', id, 'Claude', 'claude', 'Built and live since October 25 (PR 17, migration 0066).', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-091';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-091', NULL, json_object('comment', 'cl-091-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-091-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-091' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-091-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-005-c67-1', id, 'Claude', 'claude', 'Live since October 25: the statement shows on every puppy page, and each breeder confirms once that they are the seller.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-005';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-005', NULL, json_object('comment', 'cl-005-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-005-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-005' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-005-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-008-c67-1', id, 'Claude', 'claude', 'The reports and the search count are built, and Amber confirmed the privacy policy on October 25.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-008';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-008', NULL, json_object('comment', 'cl-008-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-008-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-008' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-008-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-017-c67-1', id, 'Claude', 'claude', 'Amber confirmed the privacy policy on October 25. The retention and account-closing rules are in it, the daily job deletes on that schedule, and the portal shows it with no draft banner.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-017';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-017', NULL, json_object('comment', 'cl-017-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-017-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-017' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-017-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-012-c67-1', id, 'Claude', 'claude', 'Google sign-in is published (In production) in Alex''s Google Cloud project, and portal.puppy-connection.com is on it as a sign-in address ahead of cutover.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-012';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-012', NULL, json_object('comment', 'cl-012-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-012-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-012' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-012-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-028-c67-1', id, 'Claude', 'claude', 'Cleared on October 26 after a backup, with Alex''s approval of each test breeder: 6 test breeders, their photos, the test mailbox and the test payments. 43 breeders and 304 puppies remain.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-028';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-028', NULL, json_object('comment', 'cl-028-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-028-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-028' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-028-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-085-c67-1', id, 'Claude', 'claude', 'Built and live. Amber can manage any kennel that has turned on Puppy Connection access.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-085';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-085', NULL, json_object('comment', 'cl-085-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-085-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-085' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-085-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-088-c67-1', id, 'Claude', 'claude', 'Amber''s photos were placed on the home, About, Contact, List with us and Tips pages on October 25.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-088';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-088', NULL, json_object('comment', 'cl-088-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-088-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-088' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-088-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-010-c67-1', id, 'Claude', 'claude', 'Live on October 26: Amber''s Stripe account is verified, and the live listing fee, webhook and keys are on the portal. Payouts wait on her bank account.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-010';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-010', NULL, json_object('comment', 'cl-010-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-010-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-010' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-010-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-075-c67-1', id, 'Claude', 'claude', 'Resend''s three records are in the new Cloudflare zone and match the ones Resend verified. The DMARC record is what is left.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-075';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-075', NULL, json_object('comment', 'cl-075-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-075-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-075' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-075-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-011-c67-1', id, 'Claude', 'claude', 'Moved after launch: email for sign-in, notices and invitations is live through Resend. The postal address only blocks mailing-list emails, such as the launch announcement.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-011';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-011', NULL, json_object('comment', 'cl-011-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-011-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-011' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-011-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-027-c67-1', id, 'Claude', 'claude', 'Held by Alex on October 26 until after launch.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-027';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-027', NULL, json_object('comment', 'cl-027-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-027-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-027' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-027-c67-1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-080-c67-1', id, 'Claude', 'claude', 'Held by Alex until after launch.', '2026-10-26T22:00:00Z' FROM checklist_items WHERE id = 'cl-080';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-26T22:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-080', NULL, json_object('comment', 'cl-080-c67-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-080-c67-1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-080' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-080-c67-1' || '%');
