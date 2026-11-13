-- Checklist cleanup (Checklist cleanup asked for by Alex 2026-11-12). Generated 2026-11-13T00:50:41Z by app/dev/checklist-cleanup/gen_0097.py.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing,
-- because every write is guarded on the state it changes. Nothing is deleted.

-- 1. Items Alex says are done
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', i.id, json_object('status', i.status), json_object('status', 'done', 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items i WHERE i.id IN ('cl-073', 'cl-009', 'cl-013', 'cl-075', 'cl-076', 'cl-086', 'cl-087', 'cl-011', 'cl-027', 'cl-030', 'cl-031') AND i.status != 'done';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-11-13T00:50:41Z', done_by = 'Alex', updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id IN ('cl-073', 'cl-009', 'cl-013', 'cl-075', 'cl-076', 'cl-086', 'cl-087', 'cl-011', 'cl-027', 'cl-030', 'cl-031') AND status != 'done';

-- 2. Open parts on those items, and on done items that still showed open parts
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', p.item_id, NULL, json_object('part', p.id, 'title', p.title, 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_parts p WHERE p.item_id IN ('cl-073', 'cl-009', 'cl-013', 'cl-075', 'cl-076', 'cl-086', 'cl-087', 'cl-011', 'cl-027', 'cl-030', 'cl-031', 'cl-021', 'cl-029', 'cl-059', 'cl-078', 'cl-089', 'cl-090', 'cl-092') AND p.done_at IS NULL AND p.archived_at IS NULL;
UPDATE checklist_parts SET done_at = '2026-11-13T00:50:41Z', done_by = 'Alex'
  WHERE item_id IN ('cl-073', 'cl-009', 'cl-013', 'cl-075', 'cl-076', 'cl-086', 'cl-087', 'cl-011', 'cl-027', 'cl-030', 'cl-031', 'cl-021', 'cl-029', 'cl-059', 'cl-078', 'cl-089', 'cl-090', 'cl-092') AND done_at IS NULL AND archived_at IS NULL;

-- 3. Finished after-launch items move from Gate 1 to the launch list
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'position', position), json_object('section', 'launch', 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-011' AND section = 'gate1';
UPDATE checklist_items SET section = 'launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id = 'cl-011' AND section = 'gate1';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'position', position), json_object('section', 'launch', 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-027' AND section = 'gate1';
UPDATE checklist_items SET section = 'launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id = 'cl-027' AND section = 'gate1';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'position', position), json_object('section', 'launch', 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-030' AND section = 'gate1';
UPDATE checklist_items SET section = 'launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id = 'cl-030' AND section = 'gate1';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'position', position), json_object('section', 'launch', 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-031' AND section = 'gate1';
UPDATE checklist_items SET section = 'launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id = 'cl-031' AND section = 'gate1';

-- 4. Stripe Connect and puppy video move to Gate 1
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'area', area, 'title', title), json_object('section', 'gate1', 'area', NULL, 'title', 'Stripe Connect for breeders', 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-071' AND section = 'gate3';
UPDATE checklist_items SET section = 'gate1', area = NULL, position = 1, title = 'Stripe Connect for breeders', updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id = 'cl-071' AND section = 'gate3';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area, 'status', status, 'waiting_on', waiting_on), json_object('area', NULL, 'status', 'not_started', 'waiting_on', NULL, 'reason', 'Checklist cleanup asked for by Alex 2026-11-12', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-080' AND area = 'after-launch';
UPDATE checklist_items SET area = NULL, position = 2, status = 'not_started', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id = 'cl-080' AND area = 'after-launch';

-- 5. Items that belong to monthly care, and Search Console
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.archive', 'checklist_item', id, NULL, json_object('reason', 'Part of monthly care, not a launch item (Alex 2026-11-12)', 'as', 'Alex')
    FROM checklist_items WHERE id IN ('cl-032', 'cl-093', 'cl-024') AND archived_at IS NULL;
UPDATE checklist_items SET archived_at = '2026-11-13T00:50:41Z', archived_by = 'Alex', updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id IN ('cl-032', 'cl-093', 'cl-024') AND archived_at IS NULL;

-- 5. Gate items cleared for Amber to choose from the menu
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-13T00:50:41Z', 'system', 'claude', 'checklist.archive', 'checklist_item', id, NULL, json_object('reason', 'Gates cleared so Amber chooses from the menu (Alex 2026-11-12)', 'as', 'Alex')
    FROM checklist_items WHERE id IN ('cl-058', 'cl-061', 'cl-062', 'cl-064', 'cl-082', 'cl-083', 'cl-065', 'cl-066', 'cl-067', 'cl-068', 'cl-069', 'cl-070', 'cl-072') AND archived_at IS NULL;
UPDATE checklist_items SET archived_at = '2026-11-13T00:50:41Z', archived_by = 'Alex', updated_at = '2026-11-13T00:50:41Z', version = version + 1
  WHERE id IN ('cl-058', 'cl-061', 'cl-062', 'cl-064', 'cl-082', 'cl-083', 'cl-065', 'cl-066', 'cl-067', 'cl-068', 'cl-069', 'cl-070', 'cl-072') AND archived_at IS NULL;
