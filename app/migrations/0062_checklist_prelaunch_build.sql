-- The launch checklist brought in step with what was done on 2026-10-24 and 25 (batch
-- 2026-10-26-prelaunch-build). The listing terms are published, Let's Chat and the About, Reviews
-- and Contact pages are on the staging site, the build parts of managing a breeder's account,
-- invitations and password sign-in are on staging, the Analytics property exists and its tag is on
-- the site, Workers Paid carries the database read limit, and puppy video is held by Alex. The real
-- invitation, the staging sign-in check and the notices on production stay open for their tests.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing, because
-- every write is guarded.

-- Parts finished.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-018', NULL, json_object('part', 'cl-018-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-018-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T20:00:00Z', done_by = 'Alex' WHERE id = 'cl-018-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-019', NULL, json_object('part', 'cl-019-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-019-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T20:00:00Z', done_by = 'Alex' WHERE id = 'cl-019-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-085', NULL, json_object('part', 'cl-085-2', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-085-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T20:00:00Z', done_by = 'Alex' WHERE id = 'cl-085-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-086', NULL, json_object('part', 'cl-086-1', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-086-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T20:00:00Z', done_by = 'Alex' WHERE id = 'cl-086-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-087', NULL, json_object('part', 'cl-087-1', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-087-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-25T20:00:00Z', done_by = 'Alex' WHERE id = 'cl-087-1' AND done_at IS NULL;

-- Items whose wait has moved.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'as', 'Claude', 'why', 'what was done on 2026-10-24 and 25, checked on staging')
    FROM checklist_items WHERE id = 'cl-078' AND updated_at < '2026-10-25T20:00:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE id = 'cl-078' AND updated_at < '2026-10-25T20:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'waiting', 'waiting_on', 'Alex, who is holding puppy video for now', 'waiting_owner', 'Alex', 'as', 'Claude', 'why', 'what was done on 2026-10-24 and 25, checked on staging')
    FROM checklist_items WHERE id = 'cl-080' AND updated_at < '2026-10-25T20:00:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Alex, who is holding puppy video for now', waiting_owner = 'Alex', updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE id = 'cl-080' AND updated_at < '2026-10-25T20:00:00Z';

-- Done.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at),
         json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-25T20:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'what was done on 2026-10-24 and 25, checked on staging')
    FROM checklist_items WHERE id = 'cl-018' AND updated_at < '2026-10-25T20:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-25T20:00:00Z', done_by = 'Claude', updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE id = 'cl-018' AND updated_at < '2026-10-25T20:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at),
         json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-25T20:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'what was done on 2026-10-24 and 25, checked on staging')
    FROM checklist_items WHERE id = 'cl-006' AND updated_at < '2026-10-25T20:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-25T20:00:00Z', done_by = 'Claude', updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE id = 'cl-006' AND updated_at < '2026-10-25T20:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at),
         json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-25T20:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'what was done on 2026-10-24 and 25, checked on staging')
    FROM checklist_items WHERE id = 'cl-019' AND updated_at < '2026-10-25T20:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-25T20:00:00Z', done_by = 'Claude', updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE id = 'cl-019' AND updated_at < '2026-10-25T20:00:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner, 'done_at', done_at),
         json_object('status', 'done', 'waiting_on', NULL, 'waiting_owner', NULL, 'done_at', '2026-10-25T20:00:00Z', 'done_by', 'Claude', 'as', 'Claude', 'why', 'what was done on 2026-10-24 and 25, checked on staging')
    FROM checklist_items WHERE id = 'cl-084' AND updated_at < '2026-10-25T20:00:00Z';
UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '2026-10-25T20:00:00Z', done_by = 'Claude', updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE id = 'cl-084' AND updated_at < '2026-10-25T20:00:00Z';

-- What closed each one, as a comment on the item.
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-018-cp1', id, 'Claude', 'claude', 'Published on staging as version 2026-10-25, and the portal terms page shows them with no draft flag.', '2026-10-25T20:00:00Z' FROM checklist_items WHERE id = 'cl-018';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-018', NULL, json_object('comment', 'cl-018-cp1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-018-cp1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-018' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-018-cp1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-006-cp1', id, 'Claude', 'claude', 'On the staging site: the Let''s Chat panel shows the email, phone, Facebook and Instagram, with no REPLACE THIS left.', '2026-10-25T20:00:00Z' FROM checklist_items WHERE id = 'cl-006';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-006', NULL, json_object('comment', 'cl-006-cp1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-006-cp1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-006' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-006-cp1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-019-cp1', id, 'Claude', 'claude', 'On the staging site: About carries Amber''s words, Contact her details and Reviews the Google reviews, with no REPLACE THIS left in the page source.', '2026-10-25T20:00:00Z' FROM checklist_items WHERE id = 'cl-019';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-019', NULL, json_object('comment', 'cl-019-cp1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-019-cp1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-019' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-019-cp1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-084-cp1', id, 'Claude', 'claude', 'Each photo now reads 4 rows instead of 853, and Workers Paid is on Puppy Connection''s account, so the daily read limit no longer applies. Caching photos at the edge was left for now by Alex.', '2026-10-25T20:00:00Z' FROM checklist_items WHERE id = 'cl-084';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-084', NULL, json_object('comment', 'cl-084-cp1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-084-cp1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-084' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-084-cp1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-078-cp1', id, 'Claude', 'claude', 'The property Puppy Connection exists in Alex''s Google Analytics account and the tag loads on the live domain only. The click events are next.', '2026-10-25T20:00:00Z' FROM checklist_items WHERE id = 'cl-078';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-078', NULL, json_object('comment', 'cl-078-cp1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-078-cp1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-078' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-078-cp1' || '%');
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at)
  SELECT 'cl-080-cp1', id, 'Claude', 'claude', 'Alex is holding puppy video for now (2026-10-25). The Stream subscription and key are in place.', '2026-10-25T20:00:00Z' FROM checklist_items WHERE id = 'cl-080';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-080', NULL, json_object('comment', 'cl-080-cp1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_comments WHERE id = 'cl-080-cp1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-080' AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || 'cl-080-cp1' || '%');
