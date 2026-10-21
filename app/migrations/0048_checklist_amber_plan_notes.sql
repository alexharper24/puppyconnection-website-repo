-- Amber's handwritten notes on the launch plan (2026-10-21). She moved three Gate 1 items to launch:
-- saved moms and dads, document uploads and listing quality prompts. Each moves to the Launch section
-- under Site and portal build, waiting on Alex's go-ahead once he sets launch pricing. She marked
-- Report a listing "later, possibly not needed", so its item now waits on Alex deciding whether it
-- stays on at launch. She marked more filters and sorting and site pages she can edit as later, and
-- search by distance and PayPal for the listing fee as "helpful, but can be later", so those two
-- come back as later Gate 1 items after their removal on 2026-10-19. Claude records these on Alex's
-- instruction, so each audit row says so. No prices go in the database. Back up D1 first and
-- confirm the export printed "Downloaded". Re-running changes nothing.

-- The three moved to launch.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-21T18:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('section', section, 'status', status),
         json_object('section', 'launch', 'area', 'build', 'status', 'waiting', 'as', 'Claude', 'why', 'Amber moved it to launch on her plan notes, 2026-10-21')
    FROM checklist_items WHERE id IN ('cl-059', 'cl-060', 'cl-063') AND section = 'gate1';
UPDATE checklist_items SET section = 'launch', area = 'build', status = 'waiting',
       waiting_on = 'Alex''s go-ahead once he sets launch pricing', waiting_owner = 'Alex',
       position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'),
       updated_at = '2026-10-21T18:00:00Z', version = version + 1
 WHERE id = 'cl-059' AND section = 'gate1';
UPDATE checklist_items SET ref = 'A19' WHERE id = 'cl-059' AND ref IS NULL;
UPDATE checklist_items SET description = 'Breeders save each mom and dad once with registration, health testing and pedigree, then pick them for each litter, and families see the parents on every puppy. Health tests are picked from a list for each breed, with an Other box. Amber moved it to launch on 2026-10-21.'
 WHERE id = 'cl-059';
UPDATE checklist_items SET section = 'launch', area = 'build', status = 'waiting',
       waiting_on = 'Alex''s go-ahead once he sets launch pricing', waiting_owner = 'Alex',
       position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'),
       updated_at = '2026-10-21T18:00:00Z', version = version + 1
 WHERE id = 'cl-060' AND section = 'gate1';
UPDATE checklist_items SET ref = 'A20' WHERE id = 'cl-060' AND ref IS NULL;
UPDATE checklist_items SET section = 'launch', area = 'build', status = 'waiting',
       waiting_on = 'Alex''s go-ahead once he sets launch pricing', waiting_owner = 'Alex',
       position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'),
       updated_at = '2026-10-21T18:00:00Z', version = version + 1
 WHERE id = 'cl-063' AND section = 'gate1';
UPDATE checklist_items SET ref = 'A21' WHERE id = 'cl-063' AND ref IS NULL;

-- Report a listing waits on Alex's call.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-21T18:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id,
         json_object('waiting_on', waiting_on, 'waiting_owner', waiting_owner),
         json_object('waiting_on', 'Alex deciding whether it stays on at launch', 'waiting_owner', 'Alex', 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-009' AND COALESCE(waiting_owner, '') <> 'Alex';
UPDATE checklist_items SET waiting_on = 'Alex deciding whether it stays on at launch. Amber marked it later, possibly not needed (2026-10-21)', waiting_owner = 'Alex',
       updated_at = '2026-10-21T18:00:00Z', version = version + 1
 WHERE id = 'cl-009' AND COALESCE(waiting_owner, '') <> 'Alex';

-- Later, at Amber's request.
UPDATE checklist_items SET title = 'Later: More filters and sorting', updated_at = '2026-10-21T18:00:00Z', version = version + 1
 WHERE id = 'cl-062' AND title = 'More filters and sorting';
UPDATE checklist_items SET title = 'Later: Site pages Amber can edit', updated_at = '2026-10-21T18:00:00Z', version = version + 1
 WHERE id = 'cl-064' AND title = 'Site pages Amber can edit';
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, created_at, created_by, updated_at, version) VALUES
  ('cl-082', NULL, 'gate1', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'), 'Later: Search by distance',
   'Families enter a ZIP code and see puppies within a distance they choose. Amber: helpful, but can be later (2026-10-21).',
   'Alex', 'not_started', '2026-10-21T18:00:00Z', 'Claude', '2026-10-21T18:00:00Z', 1);
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, created_at, created_by, updated_at, version) VALUES
  ('cl-083', NULL, 'gate1', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'), 'Later: PayPal for the listing fee',
   'Breeders could pay the listing fee by PayPal as well as by card. Amber: helpful, but can be later (2026-10-21).',
   'Alex', 'not_started', '2026-10-21T18:00:00Z', 'Claude', '2026-10-21T18:00:00Z', 1);
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-21T18:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', id, NULL,
         json_object('title', title, 'section', 'gate1', 'as', 'Claude')
    FROM checklist_items WHERE id IN ('cl-082', 'cl-083')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = checklist_items.id AND a.action = 'checklist.add');
