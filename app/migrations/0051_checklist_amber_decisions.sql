-- Amber's four decisions on the launch plan update (2026-10-22). Puppy video goes on at launch, so
-- the Gate 1 video item moves to Launch with the steps to switch Stream on. Family accounts come
-- soon after launch on a low monthly subscription, with saved favorites, availability messages and free
-- downloads. There are no public reviews, only the post-sale follow-up. The family signs the
-- Breeder's Health Guarantee. Claude records these on Alex's instruction, so each audit row says
-- so. Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing.

-- Puppy video at launch.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-22T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('section', section, 'status', status),
         json_object('section', 'launch', 'area', 'build', 'status', 'waiting', 'as', 'Claude', 'why', 'Amber chose video at launch, 2026-10-22')
    FROM checklist_items WHERE id = 'cl-080' AND section = 'gate1';
UPDATE checklist_items SET section = 'launch', area = 'build', status = 'waiting', ref = COALESCE(ref, 'A23'),
       description = 'Video is built. Switching it on needs a Cloudflare Stream subscription on Puppy Connection''s Cloudflare account, then the Stream key on the portal and one test upload. Amber chose it for launch on 2026-10-22.',
       waiting_on = 'The Stream subscription on Puppy Connection''s Cloudflare account', waiting_owner = 'Alex',
       position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'),
       updated_at = '2026-10-22T15:00:00Z', version = version + 1
 WHERE id = 'cl-080' AND section = 'gate1';
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-080-1', 'cl-080', 1, 'Subscribe to Cloudflare Stream on Puppy Connection''s Cloudflare account', 'Alex', '2026-10-22T15:00:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-080-2', 'cl-080', 2, 'Set the Stream key on the portal and switch video on', 'Alex', '2026-10-22T15:00:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-080-3', 'cl-080', 3, 'Upload one test video and check the puppy page plays it', 'Alex', '2026-10-22T15:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-22T15:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-080', NULL, json_object('parts', 3, 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'checklist.part.add' AND entity_id = 'cl-080');

-- Family accounts, soon after launch.
UPDATE checklist_items SET title = 'Family accounts with a subscription, soon after launch',
       description = 'Families still browse free with no account. A low monthly subscription to start gives saved favorite puppies with messages when their availability changes, and free downloads of puppy, breed and training information. Amber plans to raise the price as features are added. Chosen by Amber on 2026-10-22.',
       updated_at = '2026-10-22T15:00:00Z', version = version + 1
 WHERE id = 'cl-058' AND title = 'Family accounts with a subscription';

-- No public reviews.
UPDATE checklist_items SET description = 'An email asking the breeder to confirm a sale, which the thank-you cards need. No public reviews (Amber, 2026-10-22).',
       updated_at = '2026-10-22T15:00:00Z', version = version + 1
 WHERE id = 'cl-069' AND COALESCE(description, '') NOT LIKE '%No public reviews%';

-- The family signs the Health Guarantee.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-22T15:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('status', status, 'waiting_on', waiting_on), json_object('status', 'not_started', 'waiting_on', NULL, 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-067' AND status = 'waiting';
UPDATE checklist_items SET status = 'not_started', waiting_on = NULL, waiting_owner = NULL, owner = 'Alex',
       description = 'The family signs the Breeder''s Health Guarantee online, and the signed copy is stored with the puppy and the breeder''s account (Amber, 2026-10-22).',
       updated_at = '2026-10-22T15:00:00Z', version = version + 1
 WHERE id = 'cl-067' AND status = 'waiting';

-- The older Stream part from migration 0039 is replaced by the three parts above, so it is archived
-- (kept, never deleted).
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-22T15:00:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-080', NULL, json_object('part', 'cl-007-3', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-007-3' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-22T15:00:00Z', archived_by = 'Claude' WHERE id = 'cl-007-3' AND archived_at IS NULL;
