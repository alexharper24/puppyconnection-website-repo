-- Alex's review of the launch checklist after his call with Amber and Luke (2026-10-24).
-- Items that do not block launch move to a new area, After launch, not blocking: Search Console,
-- Bing and the Business Profile, Search Console access, the walkthroughs, the training and the
-- 30-day check-in. Google sign-in stays on Alex's Google Cloud project, so only adding the real
-- portal address is left. Luke signs in with the address he and Amber share, so nobody is added.
-- Alex opens the Resend account himself and reads the DMARC reports. There is no timing to agree
-- for the nameserver change. Amber's content asks become one specific question each. The three
-- build items Alex added today (managing a breeder's account, invitations, password sign-in) are
-- added. Claude records these on Alex's instruction, so each audit row says so. Nothing is deleted:
-- replaced parts are archived. Back up D1 first and confirm the export printed "Downloaded".
-- Re-running changes nothing, because every write is guarded.

INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at)
  VALUES ('after-launch', 'After launch, not blocking', 9, '2026-10-24T22:30:00Z');

-- Not launch blockers, moved to After launch, not blocking.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area),
         json_object('area', 'after-launch', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-024' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET area = 'after-launch', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-024' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area),
         json_object('area', 'after-launch', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-081' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET area = 'after-launch', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-081' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area),
         json_object('area', 'after-launch', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-030' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET area = 'after-launch', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-030' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area),
         json_object('area', 'after-launch', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-031' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET area = 'after-launch', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-031' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area),
         json_object('area', 'after-launch', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-032' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET area = 'after-launch', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-032' AND updated_at < '2026-10-24T22:30:00Z';

-- Google sign-in stays on Alex's Google Cloud project for now.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('title', title, 'status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('title', 'Google sign-in on the real portal address', 'status', 'not_started', 'waiting_on', NULL, 'waiting_owner', NULL, 'owner', 'Alex', 'description', 'Google sign-in stays on Alex''s Google Cloud project for now, so moving it under a Puppy Connection Google account is not needed for launch (Alex, 2026-10-24). What is left is adding the real portal address and publishing the consent screen.', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-012' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET title = 'Google sign-in on the real portal address', status = 'not_started', waiting_on = NULL, waiting_owner = NULL, owner = 'Alex', description = 'Google sign-in stays on Alex''s Google Cloud project for now, so moving it under a Puppy Connection Google account is not needed for launch (Alex, 2026-10-24). What is left is adding the real portal address and publishing the consent screen.', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-012' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-012', NULL, json_object('part', 'cl-012-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-012-1' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-012-1' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-012', NULL, json_object('part', 'cl-012-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-012-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-012-2' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-012', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Add the real portal address to Google sign-in in Alex''s Google Cloud project and publish the consent screen', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-012-3' AND title != 'Add the real portal address to Google sign-in in Alex''s Google Cloud project and publish the consent screen';
UPDATE checklist_parts SET title = 'Add the real portal address to Google sign-in in Alex''s Google Cloud project and publish the consent screen' WHERE id = 'cl-012-3' AND title != 'Add the real portal address to Google sign-in in Alex''s Google Cloud project and publish the consent screen';

-- Luke signs in with the shared address.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('title', title),
         json_object('title', 'Admin sign-in on its real address', 'description', 'Luke signs in with the email address he and Amber share, so nobody new is added to the sign-in policy (Alex, 2026-10-24).', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-013' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET title = 'Admin sign-in on its real address', description = 'Luke signs in with the email address he and Amber share, so nobody new is added to the sign-in policy (Alex, 2026-10-24).', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-013' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-013', NULL, json_object('part', 'cl-013-1', 'done', 1, 'as', 'Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-013-1' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-24T22:30:00Z', done_by = 'Alex' WHERE id = 'cl-013-1' AND done_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-013', NULL, json_object('part', 'cl-013-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-013-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-013-2' AND archived_at IS NULL;

-- Alex opens Resend and reads the DMARC reports.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('owner', owner, 'status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('owner', 'Alex', 'status', 'not_started', 'waiting_on', NULL, 'waiting_owner', NULL, 'description', 'Alex opens the Resend account and sets it up (2026-10-24). Every breeder sign-in and invitation email goes through it, so it blocks launch.', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-074' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET owner = 'Alex', status = 'not_started', waiting_on = NULL, waiting_owner = NULL, description = 'Alex opens the Resend account and sets it up (2026-10-24). Every breeder sign-in and invitation email goes through it, so it blocks launch.', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-074' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-074', NULL, json_object('part', 'cl-074-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-074-1' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-074-1' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-074', NULL, json_object('part', 'cl-074-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-074-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-074-2' AND archived_at IS NULL;
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-074-4', 'cl-074', 0, 'Open the Resend account and choose the Pro plan', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-074', NULL, json_object('parts', 1, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-074' AND at = '2026-10-24T22:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('description', description),
         json_object('description', 'appended', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-075' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET description = (COALESCE(description || ' ', '') || 'The DMARC reports go to an address Alex reads (2026-10-24).'), updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-075' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-075', NULL, json_object('part', 'cl-075-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-075-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-075-2' AND archived_at IS NULL;

-- No timing to agree for the nameserver change.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('owner', owner, 'status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('owner', 'Alex', 'status', 'not_started', 'waiting_on', NULL, 'waiting_owner', NULL, 'description', 'Alex schedules the nameserver change. Amber''s Wix site and Google email keep working through it, because every record is copied to the new zone.', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-021' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET owner = 'Alex', status = 'not_started', waiting_on = NULL, waiting_owner = NULL, description = 'Alex schedules the nameserver change. Amber''s Wix site and Google email keep working through it, because every record is copied to the new zone.', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-021' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-021', NULL, json_object('part', 'cl-021-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-021-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-021-2' AND archived_at IS NULL;

-- Privacy policy, as three questions and one read-through.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('status', 'waiting', 'waiting_on', 'Amber''s answers on the privacy policy', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-017' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET status = 'waiting', waiting_on = 'Amber''s answers on the privacy policy', waiting_owner = 'Amber', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-017' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-017', NULL, json_object('part', 'cl-017-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-017-1' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-017-1' AND archived_at IS NULL;
UPDATE checklist_parts SET position = 10 WHERE id = 'cl-017-2' AND position != 10;
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-017-3', 'cl-017', 1, 'Choose how long the site keeps its activity record, payment records and daily page counts', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-017-4', 'cl-017', 2, 'Choose whether an unsubscribed email address is deleted after a set time, or kept only so it is never emailed again', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-017-5', 'cl-017', 3, 'Choose what closing a breeder account removes, such as the profile, the photos and the people on the account', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-017-6', 'cl-017', 4, 'Read the privacy policy and approve it, including the lines on breed search counts and listing reports', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-017', NULL, json_object('parts', 4, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-017' AND at = '2026-10-24T22:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'the privacy policy, under Content and wording', 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-008' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET waiting_on = 'the privacy policy, under Content and wording', waiting_owner = NULL, updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-008' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-008', NULL, json_object('part', 'cl-008-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-008-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-008-2' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'the privacy policy, under Content and wording, and real email', 'waiting_owner', NULL, 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-009' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET waiting_on = 'the privacy policy, under Content and wording, and real email', waiting_owner = NULL, updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-009' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-009', NULL, json_object('part', 'cl-009-2', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-009-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-009-2' AND archived_at IS NULL;

-- Contact details, About, Reviews, terms and the seller statement.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-006', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Confirm info@puppy-connection.com and (574) 221-0326 as the contact email and phone, and send the Facebook and Instagram links', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-006-1' AND title != 'Confirm info@puppy-connection.com and (574) 221-0326 as the contact email and phone, and send the Facebook and Instagram links';
UPDATE checklist_parts SET title = 'Confirm info@puppy-connection.com and (574) 221-0326 as the contact email and phone, and send the Facebook and Instagram links' WHERE id = 'cl-006-1' AND title != 'Confirm info@puppy-connection.com and (574) 221-0326 as the contact email and phone, and send the Facebook and Instagram links';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'Amber''s About words and the reviews', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-019' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET waiting_on = 'Amber''s About words and the reviews', waiting_owner = 'Amber', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-019' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-019', NULL, json_object('part', 'cl-019-1', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-019-1' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-24T22:30:00Z', archived_by = 'Claude' WHERE id = 'cl-019-1' AND archived_at IS NULL;
UPDATE checklist_parts SET position = 10 WHERE id = 'cl-019-2' AND position != 10;
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-019-3', 'cl-019', 1, 'Write a few sentences for the About page on why you started Puppy Connection and what you look for in a breeder', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-019-4', 'cl-019', 2, 'Say whether the three reviews on the Reviews page stay as they are, and send any newer ones', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-019', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-019' AND at = '2026-10-24T22:30:00Z');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-018-1', 'cl-018', 1, 'Send the listing terms breeders agree to before they list, in your own words', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-018-2', 'cl-018', 2, 'Publish them from the Terms screen', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-018', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-018' AND at = '2026-10-24T22:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'Amber''s approval of the seller statement', 'waiting_owner', 'Amber', 'description', 'Suggested wording for Amber to approve or change: "Puppy Connection does not sell puppies. This puppy is sold by its breeder, and the sale is agreed between you and the breeder."', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-005' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET waiting_on = 'Amber''s approval of the seller statement', waiting_owner = 'Amber', description = 'Suggested wording for Amber to approve or change: "Puppy Connection does not sell puppies. This puppy is sold by its breeder, and the sale is agreed between you and the breeder."', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-005' AND updated_at < '2026-10-24T22:30:00Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-005', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Approve or change the suggested seller statement', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-005-1' AND title != 'Approve or change the suggested seller statement';
UPDATE checklist_parts SET title = 'Approve or change the suggested seller statement' WHERE id = 'cl-005-1' AND title != 'Approve or change the suggested seller statement';

-- Inboxes, the mailing address, the unplaced listings and test data.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('description', description),
         json_object('description', 'appended', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-076' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET description = (description || ' System alerts, such as payment disputes and failed jobs, go to Alex (2026-10-24). Amber chooses where the rest go.'), updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-076' AND updated_at < '2026-10-24T22:30:00Z';
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-076-1', 'cl-076', 1, 'Choose the inbox for new breeder sign-ups and listing reports, and the reply-to address on emails to breeders and the mailing list', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-076-2', 'cl-076', 2, 'Send each notice once on production and check it arrives', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-076', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-076' AND at = '2026-10-24T22:30:00Z');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-011-4', 'cl-011', 0, 'Send the postal address printed at the bottom of mailing list emails, which can be a PO box', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-011', NULL, json_object('parts', 1, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-011' AND at = '2026-10-24T22:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('status', status, 'waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'Amber naming the breeder for each listing', 'waiting_owner', 'Amber', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
    FROM checklist_items WHERE id = 'cl-014' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_items SET waiting_on = 'Amber naming the breeder for each listing', waiting_owner = 'Amber', updated_at = '2026-10-24T22:30:00Z', version = version + 1
 WHERE id = 'cl-014' AND updated_at < '2026-10-24T22:30:00Z';
UPDATE checklist_parts SET position = 10 WHERE id = 'cl-014-2' AND position != 10;
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-014-3', 'cl-014', 3, 'Name the breeder for each of the 20 listings Alex sends', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-014', NULL, json_object('parts', 1, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-014' AND at = '2026-10-24T22:30:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-028', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Agree what counts as test data, after Alex walks through the test breeders and data', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-028-1' AND title != 'Agree what counts as test data, after Alex walks through the test breeders and data';
UPDATE checklist_parts SET title = 'Agree what counts as test data, after Alex walks through the test breeders and data' WHERE id = 'cl-028-1' AND title != 'Agree what counts as test data, after Alex walks through the test breeders and data';

-- Stripe is open and in verification, and Amber chose who signs the Health Guarantee on 2026-10-22.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.edit', 'checklist_item', 'cl-010', json_object('part', id, 'title', title), json_object('part', id, 'title', 'Finish the Stripe account verification: business address, service agreement, owners and account representative', 'as', 'Claude')
    FROM checklist_parts WHERE id = 'cl-010-2' AND title != 'Finish the Stripe account verification: business address, service agreement, owners and account representative';
UPDATE checklist_parts SET title = 'Finish the Stripe account verification: business address, service agreement, owners and account representative' WHERE id = 'cl-010-2' AND title != 'Finish the Stripe account verification: business address, service agreement, owners and account representative';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.tick', 'checklist_item', 'cl-067', NULL, json_object('part', 'cl-067-2', 'done', 1, 'as', 'Amber')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-067-2' AND done_at IS NULL);
UPDATE checklist_parts SET done_at = '2026-10-24T22:30:00Z', done_by = 'Amber' WHERE id = 'cl-067-2' AND done_at IS NULL;

-- The three build items Alex added on 2026-10-24.
INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, created_at, created_by, updated_at)
  SELECT 'cl-085', 'A24', 'launch', 'build', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Puppy Connection manages a breeder''s account', 'A breeder turns on Puppy Connection access in the portal, and Amber can then manage that kennel''s listings from the admin, with every change recorded under her name. The breeders Amber manages today are set up as they are, with no new consent asked.', 'Alex', 'in_progress', '2026-10-24T22:30:00Z', 'Claude', '2026-10-24T22:30:00Z'
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-085' OR ref = 'A24');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-085', NULL, json_object('title', 'Puppy Connection manages a breeder''s account', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.add' AND entity_id = 'cl-085');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-085-1', 'cl-085', 1, 'Confirm the breeders whose listings Puppy Connection manages today', 'Amber', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-085-2', 'cl-085', 2, 'Build and test managing a breeder''s account from the admin', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-085', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-085' AND at = '2026-10-24T22:30:00Z');
INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, created_at, created_by, updated_at)
  SELECT 'cl-086', 'A25', 'launch', 'build', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Invitations and who manages each kennel', 'The admin lists who manages each kennel, sends each person an invitation by email, and moves a kennel to a new main contact. Removing a person signs them out.', 'Alex', 'in_progress', '2026-10-24T22:30:00Z', 'Claude', '2026-10-24T22:30:00Z'
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-086' OR ref = 'A25');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-086', NULL, json_object('title', 'Invitations and who manages each kennel', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.add' AND entity_id = 'cl-086');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-086-1', 'cl-086', 1, 'Build and test invitations and the change of main contact', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-086-2', 'cl-086', 2, 'Send one real invitation once Resend is on', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-086', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-086' AND at = '2026-10-24T22:30:00Z');
INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, created_at, created_by, updated_at)
  SELECT 'cl-087', 'A26', 'launch', 'build', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Password sign-in with an optional authenticator app', 'Breeders sign in with a password or with Google. An authenticator app is recommended but not required. Emailed sign-in codes stop, and email carries only invitations and password resets.', 'Alex', 'in_progress', '2026-10-24T22:30:00Z', 'Claude', '2026-10-24T22:30:00Z'
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-087' OR ref = 'A26');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-087', NULL, json_object('title', 'Password sign-in with an optional authenticator app', 'as', 'Claude', 'why', 'Alex''s review of the launch list after his call with Amber and Luke, 2026-10-24')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.add' AND entity_id = 'cl-087');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-087-1', 'cl-087', 1, 'Build and test password sign-in, the authenticator and password reset', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-087-2', 'cl-087', 2, 'Check sign-in stays inside the hosting time limit on staging', 'Alex', '2026-10-24T22:30:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-24T22:30:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-087', NULL, json_object('parts', 2, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-087' AND at = '2026-10-24T22:30:00Z');
