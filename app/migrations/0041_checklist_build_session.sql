-- The build session's work of 2026-10-20 on the launch checklist (workplan commit 8e383cd on
-- claude/relaxed-hopper-9265f6). Failure alerts, the production database plan and a send to all
-- contacts are done, with their evidence as a comment. The Let's Chat button is built and still waits
-- on Amber's contact details. Clearing the test data has its next step named. The work was done by
-- Claude, so done_by and the audit rows say so, and the owners stay Alex and Amber.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing.

-- Done items, each with one audit row and one evidence comment.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T03:30:00Z', 'system', 'claude', 'checklist.tick', 'checklist_item', id, json_object('status', status), json_object('status', 'done', 'as', 'Claude')
    FROM checklist_items WHERE id IN ('cl-077', 'cl-079', 'cl-016') AND status != 'done';
UPDATE checklist_items SET status = 'done', done_at = '2026-10-20T03:30:00Z', done_by = 'Claude', waiting_on = NULL, waiting_owner = NULL,
       updated_at = '2026-10-20T03:30:00Z', version = version + 1
 WHERE id IN ('cl-077', 'cl-079', 'cl-016') AND status != 'done';
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at) VALUES
  ('cl-077-c1', 'cl-077', 'Claude', 'claude', 'Built and on staging. A failed job, publish, site build, nightly backup or Stripe webhook now emails the owners, at most once an hour for each kind. Each failure was forced on staging and its alert read back from the email log.', '2026-10-20T03:30:00Z'),
  ('cl-079-c2', 'cl-079', 'Claude', 'claude', 'The six steps are written in the launch checklist document and each was rehearsed on a copy of the staging database.', '2026-10-20T03:30:00Z'),
  ('cl-016-c1', 'cl-016', 'Claude', 'claude', 'Built and on staging. Each send chooses subscribers only or every contact who has not unsubscribed, with that count shown before sending.', '2026-10-20T03:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T03:30:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', c.item_id, NULL, json_object('comment', c.id, 'as', 'Claude')
    FROM checklist_comments c
   WHERE c.id IN ('cl-077-c1', 'cl-079-c2', 'cl-016-c1')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = c.item_id AND a.action = 'checklist.comment' AND a.after_json LIKE '%' || c.id || '%');

-- Parts that are now done: writing and rehearsing the database steps, and building the Let's Chat button.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T03:30:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', item_id, NULL, json_object('part', id, 'title', title, 'as', 'Claude')
    FROM checklist_parts WHERE id IN ('cl-079-2', 'cl-006-2') AND done_at IS NULL;
UPDATE checklist_parts SET done_at = '2026-10-20T03:30:00Z', done_by = 'Claude' WHERE id IN ('cl-079-2', 'cl-006-2') AND done_at IS NULL;

-- Let's Chat stays waiting on Amber, now for the details that show as placeholders.
UPDATE checklist_items SET waiting_on = 'Amber sending Puppy Connection''s phone, email and social links, which show as placeholders until then', waiting_owner = 'Amber',
       status = 'waiting', updated_at = '2026-10-20T03:30:00Z', version = version + 1
 WHERE id = 'cl-006' AND waiting_on NOT LIKE 'Amber sending Puppy Connection''s phone%';

-- Clearing the test data: its next step, as a comment.
INSERT OR IGNORE INTO checklist_comments (id, item_id, author, author_email, body, created_at) VALUES
  ('cl-028-c1', 'cl-028', 'Claude', 'claude', 'Next step: a list of the test rows for Amber to approve. The rehearsal list named the three demo breeders, one test sign-up, two unfinished sign-ups from real Gmail addresses for Amber to confirm, and the simulation operator address to replace with her real one.', '2026-10-20T03:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T03:30:00Z', 'system', 'claude', 'checklist.comment', 'checklist_item', 'cl-028', NULL, json_object('comment', 'cl-028-c1', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'cl-028' AND action = 'checklist.comment' AND after_json LIKE '%cl-028-c1%');
