-- Alex answered several of the draft asks for Amber himself (2026-10-24). He approved the
-- suggested seller statement. The privacy policy takes Claude's recommendations and Amber confirms
-- the finished policy. Reviews come from Puppy Connection's Google Business Profile, gathered by
-- Alex. The notices go to info@puppy-connection.com unless Amber says otherwise. Stripe is not
-- asked again while Amber works on it. Back up D1 first and confirm the export printed
-- "Downloaded". Re-running changes nothing, because every write is guarded.

-- The seller statement wording is approved.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'not_started', 'waiting_on', NULL, 'waiting_owner', NULL, 'description', 'Approved wording (Alex, 2026-10-24): "Puppy Connection does not sell puppies. This puppy is sold by its breeder, and the sale is agreed between you and the breeder."', 'as', 'Claude', 'why', 'Alex''s answers to the draft asks for Amber, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-005' AND updated_at < '2026-10-24T23:30:00Z';
UPDATE checklist_items SET status = 'not_started', waiting_on = NULL, waiting_owner = NULL, description = 'Approved wording (Alex, 2026-10-24): "Puppy Connection does not sell puppies. This puppy is sold by its breeder, and the sale is agreed between you and the breeder."', updated_at = '2026-10-24T23:30:00Z', version = version + 1
 WHERE id = 'cl-005' AND updated_at < '2026-10-24T23:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-005', NULL, json_object('part', 'cl-005-1', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-005-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-24T23:30:00Z', done_by = 'Alex' WHERE id = 'cl-005-1' AND done_at IS NULL;

-- The privacy policy takes the recommendations, and Amber confirms it.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'in_progress', 'waiting_on', NULL, 'waiting_owner', NULL, 'description', 'Claude''s recommendations go in, with Alex''s approval (2026-10-24): the activity record kept 2 years, payment records 7 years, and daily page counts kept, as they hold nothing about a visitor. An unsubscribed address is kept only so it is never emailed again. Closing an account removes the profile, photos, videos, documents, listings, saved parents and the people on the account within 30 days, and keeps payment records and the activity record for their periods. Amber confirms the finished policy.', 'as', 'Claude', 'why', 'Alex''s answers to the draft asks for Amber, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-017' AND updated_at < '2026-10-24T23:30:00Z';
UPDATE checklist_items SET status = 'in_progress', waiting_on = NULL, waiting_owner = NULL, description = 'Claude''s recommendations go in, with Alex''s approval (2026-10-24): the activity record kept 2 years, payment records 7 years, and daily page counts kept, as they hold nothing about a visitor. An unsubscribed address is kept only so it is never emailed again. Closing an account removes the profile, photos, videos, documents, listings, saved parents and the people on the account within 30 days, and keeps payment records and the activity record for their periods. Amber confirms the finished policy.', updated_at = '2026-10-24T23:30:00Z', version = version + 1
 WHERE id = 'cl-017' AND updated_at < '2026-10-24T23:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-3', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-3' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T23:30:00Z', archived_by = 'Claude' WHERE id = 'cl-017-3' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-4', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-4' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T23:30:00Z', archived_by = 'Claude' WHERE id = 'cl-017-4' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-5', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-5' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T23:30:00Z', archived_by = 'Claude' WHERE id = 'cl-017-5' AND archived_at IS NULL;
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-017-7', 'cl-017', 1, 'Write the recommended retention and account-closing rules into the policy, and make the daily job delete on that schedule', 'Alex', '2026-10-24T23:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-017', NULL, json_object('parts', 1, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-017' AND at = '2026-10-24T23:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-017', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Read the finished privacy policy and confirm it', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-017-6' AND title != 'Read the finished privacy policy and confirm it';
UPDATE checklist_parts SET title = 'Read the finished privacy policy and confirm it' WHERE id = 'cl-017-6' AND title != 'Read the finished privacy policy and confirm it';

-- Reviews come from the Google Business Profile.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'Amber''s About words', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'Alex''s answers to the draft asks for Amber, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-019' AND updated_at < '2026-10-24T23:30:00Z';
UPDATE checklist_items SET waiting_on = 'Amber''s About words', waiting_owner = 'Amber', updated_at = '2026-10-24T23:30:00Z', version = version + 1
 WHERE id = 'cl-019' AND updated_at < '2026-10-24T23:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-019', NULL, json_object('part', 'cl-019-4', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-019-4' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T23:30:00Z', archived_by = 'Claude' WHERE id = 'cl-019-4' AND archived_at IS NULL;
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-019-5', 'cl-019', 3, 'Gather the reviews for the Reviews page from Puppy Connection''s Google Business Profile', 'Alex', '2026-10-24T23:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-019', NULL, json_object('parts', 1, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-019' AND at = '2026-10-24T23:30:00Z');

-- The notices go to info@ unless Amber says otherwise.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-076', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Confirm info@puppy-connection.com for new breeder sign-ups, listing reports and replies to emails from Puppy Connection', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-076-1' AND title != 'Confirm info@puppy-connection.com for new breeder sign-ups, listing reports and replies to emails from Puppy Connection';
UPDATE checklist_parts SET title = 'Confirm info@puppy-connection.com for new breeder sign-ups, listing reports and replies to emails from Puppy Connection' WHERE id = 'cl-076-1' AND title != 'Confirm info@puppy-connection.com for new breeder sign-ups, listing reports and replies to emails from Puppy Connection';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-011', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Send the postal address shown at the bottom of mailing list emails, which can be a PO box', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-011-4' AND title != 'Send the postal address shown at the bottom of mailing list emails, which can be a PO box';
UPDATE checklist_parts SET title = 'Send the postal address shown at the bottom of mailing list emails, which can be a PO box' WHERE id = 'cl-011-4' AND title != 'Send the postal address shown at the bottom of mailing list emails, which can be a PO box';

-- Stripe is not asked again while Amber works on it.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T23:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-010', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Finish the Stripe account verification', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-010-2' AND title != 'Finish the Stripe account verification';
UPDATE checklist_parts SET title = 'Finish the Stripe account verification' WHERE id = 'cl-010-2' AND title != 'Finish the Stripe account verification';
