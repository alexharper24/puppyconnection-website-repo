-- Alex's calls of 2026-10-19 on the launch checklist (workplan commit 728bc3a):
--   Furry Freight booking details stay as they are, so that item is done by Alex.
--   Announcements go to every contact who has not unsubscribed, so the invitation decision becomes
--     a build item, "Let a mailing list send go to all contacts", owned by Alex.
--   Puppy video moves to Gate 1 as its own item. The extra details are built, so the launch item
--     closes, and the Stream part moves to the new item.
--   Google Analytics 4 goes in Alex's own account, so it waits on him and Amber's access part is
--     archived (kept, never deleted).
--   The notice inboxes item names the three staff notices.
-- Claude records these, so each audit row says so. No prices go in the database.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing.

-- Furry Freight (D6).
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.tick', 'checklist_item', id, json_object('status', status),
         json_object('status', 'done', 'decided_by', 'Alex', 'as', 'Claude') FROM checklist_items WHERE id = 'cl-020' AND status != 'done';
UPDATE checklist_items SET status = 'done', done_at = '2026-10-19T12:00:00Z', done_by = 'Alex', waiting_on = NULL, waiting_owner = NULL,
       description = 'Alex kept the Furry Freight transportation page and booking link as they are.', updated_at = '2026-10-20T02:40:00Z', version = version + 1
 WHERE id = 'cl-020' AND status != 'done';

-- Mailing list to all contacts (C5).
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('title', title, 'owner', owner, 'status', status, 'waiting_on', waiting_on),
         json_object('title', 'Let a mailing list send go to all contacts', 'owner', 'Alex', 'status', 'not_started', 'waiting_on', NULL, 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-016' AND title != 'Let a mailing list send go to all contacts';
UPDATE checklist_items SET title = 'Let a mailing list send go to all contacts', owner = 'Alex', status = 'not_started', waiting_on = NULL, waiting_owner = NULL,
       description = 'Alex decided announcements such as the new site reach every imported contact who has not unsubscribed, not only subscribers. Each send gets a choice of subscribers or all contacts with the count shown first, the unsubscribe link stays and is honored for everyone, and unsubscribed addresses are left out of every send.',
       updated_at = '2026-10-20T02:40:00Z', version = version + 1
 WHERE id = 'cl-016' AND title != 'Let a mailing list send go to all contacts';

-- Puppy video to Gate 1 (A3).
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, created_at, created_by, updated_at, version) VALUES
  ('cl-080', NULL, 'gate1', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'), 'Puppy video',
   'Video upload on puppy pages is built and stays off until Cloudflare Stream is subscribed on the Puppy Connection account. Moved here from launch (Alex, 2026-10-19).',
   'Alex', 'not_started', '2026-10-20T02:40:00Z', 'Claude', '2026-10-20T02:40:00Z', 1);
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-080', NULL, json_object('title', 'Puppy video', 'owner', 'Alex', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'cl-080' AND action = 'checklist.add');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-007', NULL,
         json_object('part', 'cl-007-2', 'title', 'Decide whether to offer puppy videos', 'decided_by', 'Alex', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-007-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-19T12:00:00Z', done_by = 'Alex', title = 'Decide whether to offer puppy videos: moved to Gate 1'
 WHERE id = 'cl-007-2' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', 'cl-007', json_object('part', 'cl-007-3', 'item', 'cl-007'),
         json_object('part', 'cl-007-3', 'title', 'Subscribe to Stream and switch video on', 'moved_to', 'cl-080', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-007-3' AND item_id = 'cl-007');
UPDATE checklist_parts SET item_id = 'cl-080', position = 1 WHERE id = 'cl-007-3' AND item_id = 'cl-007';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.tick', 'checklist_item', id, json_object('status', status),
         json_object('status', 'done', 'as', 'Claude', 'why', 'the extra details are built and video moved to Gate 1') FROM checklist_items WHERE id = 'cl-007' AND status != 'done';
UPDATE checklist_items SET status = 'done', done_at = '2026-10-19T12:00:00Z', done_by = 'Alex', waiting_on = NULL, waiting_owner = NULL,
       title = 'More puppy details', description = 'Registration, markings, health and vaccination notes, deworming, disclosures and the breeder''s deposit link are built and on staging. Video moved to its own Gate 1 item.',
       updated_at = '2026-10-20T02:40:00Z', version = version + 1
 WHERE id = 'cl-007' AND status != 'done';

-- Google Analytics 4 in Alex's account (B11).
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-078', NULL,
         json_object('part', 'cl-078-1', 'title', 'Grant Alex access to the GA4 property', 'decided_by', 'Alex', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-078-1' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-20T02:40:00Z', archived_by = 'Alex' WHERE id = 'cl-078-1' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'Alex creating the GA4 property in his own Google Analytics account', 'waiting_owner', 'Alex', 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-078' AND waiting_owner = 'Amber';
UPDATE checklist_items SET waiting_on = 'Alex creating the GA4 property in his own Google Analytics account', waiting_owner = 'Alex',
       description = 'Alex chose Google Analytics 4, in his own Google Analytics account beside his other client properties. It goes in before cutover, so the first weeks after launch can be compared with Wix.',
       updated_at = '2026-10-20T02:40:00Z', version = version + 1
 WHERE id = 'cl-078' AND waiting_owner = 'Amber';

-- The notice inboxes (B9).
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T02:40:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('description', description),
         json_object('description', 'three staff notices named', 'as', 'Claude') FROM checklist_items WHERE id = 'cl-076' AND description NOT LIKE 'Three notices%';
UPDATE checklist_items SET description = 'Three notices go to Puppy Connection staff: a new breeder waiting for approval, a listing reported by a visitor, and system alerts for payment disputes and failures and failed jobs. Today they go to every owner in the admin. Amber decides which inbox gets each, and the reply-to address on emails to breeders and on list emails, so replies reach a person.',
       waiting_on = 'Amber choosing an inbox for each notice', updated_at = '2026-10-20T02:40:00Z', version = version + 1
 WHERE id = 'cl-076' AND description NOT LIKE 'Three notices%';
