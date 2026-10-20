-- Six day-one items for the launch checklist (workplan B7 to B12, Alex 2026-10-19: what else must
-- work on day one). Owners are Alex and Amber only, so work Claude does is Alex's, and an item two
-- people share has one owner with a part for each. No prices go in the database. Each item gets one
-- checklist.add audit row. Back up D1 first and confirm the export printed "Downloaded".
-- Re-running adds nothing.

INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-074', 'B7', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Resend account for Puppy Connection',
   'The account that sends every email, opened under a Puppy Connection address Amber controls, with Alex invited as a team member, the puppy-connection.com sending domain added, and the Pro plan, because the free plan stops at 100 emails a day.',
   'Amber', 'waiting', 'Alex and Amber deciding who opens the account', NULL, '2026-10-20T01:40:00Z', 'Claude', '2026-10-20T01:40:00Z', 1);
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-075', 'B8', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Email records on the new domain zone',
   'Resend''s signing and sending records go in beside the Google Workspace records, Puppy Connection''s own DMARC record replaces the one that points at Wix, and Google Workspace mail keeps working throughout.',
   'Alex', 'waiting', 'the Resend account being open', NULL, '2026-10-20T01:40:00Z', 'Claude', '2026-10-20T01:40:00Z', 1);
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-076', 'B9', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Inboxes the system writes to',
   'Where report-a-listing alerts, new breeder sign-ups, payment problems and job failures go, and the reply-to address on list and breeder emails, so replies reach a person. Today they point at staging addresses.',
   'Amber', 'waiting', 'Amber choosing the inboxes', 'Amber', '2026-10-20T01:40:00Z', 'Claude', '2026-10-20T01:40:00Z', 1);
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-077', 'B10', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Failure alerts by email',
   'A failed scheduled job, a failed publish, a failed nightly backup or a Stripe webhook failure each emails Alex, rather than leaving only a log line.',
   'Alex', 'not_started', NULL, NULL, '2026-10-20T01:40:00Z', 'Claude', '2026-10-20T01:40:00Z', 1);
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-078', 'B11', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Visitor analytics on the new site',
   'Wix measured traffic and the new site does not yet. Cloudflare Web Analytics or Google Analytics 4 goes in before cutover, so the first weeks after launch can be compared with Wix.',
   'Alex', 'waiting', 'Alex choosing Cloudflare Web Analytics or Google Analytics 4', 'Alex', '2026-10-20T01:40:00Z', 'Claude', '2026-10-20T01:40:00Z', 1);
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-079', 'B12', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Production database plan',
   'Whether the staging database becomes the production one after the test data is cleared, or a new database is made and loaded, with the steps written for the photo storage, the scheduled jobs and every secret on the production Workers, and rehearsed once.',
   'Alex', 'not_started', NULL, NULL, '2026-10-20T01:40:00Z', 'Claude', '2026-10-20T01:40:00Z', 1);

INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES
  ('cl-074-1', 'cl-074', 1, 'Open the account under a Puppy Connection address and choose the Pro plan', 'Amber', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-074-2', 'cl-074', 2, 'Invite Alex as a team member', 'Amber', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-074-3', 'cl-074', 3, 'Add the sending domain and set the key on the portal and admin', 'Alex', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-075-1', 'cl-075', 1, 'Add Resend''s signing and sending records', 'Alex', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-075-2', 'cl-075', 2, 'Choose the address that reads the DMARC reports', 'Amber', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-075-3', 'cl-075', 3, 'Replace the Wix DMARC record and check Google Workspace mail', 'Alex', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-079-1', 'cl-079', 1, 'Decide whether staging becomes production', 'Alex', '2026-10-20T01:40:00Z', 'Claude'),
  ('cl-079-2', 'cl-079', 2, 'Write the steps and rehearse them once', 'Alex', '2026-10-20T01:40:00Z', 'Claude');

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T01:40:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', i.id, NULL,
         json_object('title', i.title, 'owner', i.owner, 'as', 'Claude', 'from', 'the launch workplan, day-one items')
    FROM checklist_items i
   WHERE i.id IN ('cl-074', 'cl-075', 'cl-076', 'cl-077', 'cl-078', 'cl-079')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity = 'checklist_item' AND a.entity_id = i.id AND a.action = 'checklist.add');
