-- The Search Console item waits on the Search Console access item (migration 0044), not on Amber
-- herself, so it no longer names her as the person it waits on. Otherwise Asks for Amber lists it
-- beside her own access part and asks her twice for the same thing (Alex, 2026-10-20). Claude
-- records it, so the audit row says so. Back up D1 first and confirm the export printed
-- "Downloaded". Re-running changes nothing.

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T17:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('waiting_owner', waiting_owner),
         json_object('waiting_owner', NULL, 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-024' AND waiting_owner = 'Amber' AND waiting_on = 'Search Console access for Alex, under Access to grant';
UPDATE checklist_items SET waiting_owner = NULL, updated_at = '2026-10-20T17:00:00Z', version = version + 1
 WHERE id = 'cl-024' AND waiting_owner = 'Amber' AND waiting_on = 'Search Console access for Alex, under Access to grant';
