-- Premier Paw Pals, Marion Bontrager's kennel (Alex, 2026-10-25). Amber listed it among the breeders
-- Puppy Connection manages, but it had no account and none of its listings came across from Wix, so
-- it is added as an imported breeder with only the business and contact name she gave, and Puppy
-- Connection access on as the existing arrangement. No phone, town or breed is invented; Amber adds
-- them. The site is marked as changed so the next publish picks it up. Back up D1 first and confirm
-- the export printed "Downloaded". Re-running changes nothing.

INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at,
                                manage_access, manage_access_by, manage_access_at, manage_access_how)
  VALUES ('seed-premierpawpals', 'premierpawpals@breeders.test', 'approved', '2026-10-25T18:00:00Z', '2026-10-25T18:00:00Z', 'legacy-wix', '2026-10-25T18:00:00Z', '2026-10-25T18:00:00Z', 'migration 0061', 1, '2026-10-25T18:00:00Z', '2026-10-25T18:00:00Z',
          1, 'Amber, recorded by Alex', '2026-10-25T18:00:00Z', 'existing_arrangement');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, contact_name, updated_at)
  VALUES ('seed-premierpawpals', 'Premier Paw Pals', 'premier-paw-pals', 'Marion Bontrager', '2026-10-25T18:00:00Z');
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-25T18:00:00Z'), generation = generation + 1
 WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'breeder.import' AND entity_id = 'seed-premierpawpals');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T18:00:00Z', 'system', 'claude', 'breeder.import', 'breeder', 'seed-premierpawpals', NULL,
         json_object('business_name', 'Premier Paw Pals', 'contact_name', 'Marion Bontrager', 'manage_access', 1, 'why', 'Alex, 2026-10-25')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'breeder.import' AND entity_id = 'seed-premierpawpals');
