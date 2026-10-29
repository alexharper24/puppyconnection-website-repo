-- Premier Paw Pals' profile, built from its own website (Alex, 2026-10-29; premierpawpals.com: Home, About Us,
-- Contact Us and Our Puppies, read 2026-10-29). The kennel was added empty by migration 0061. This fills the public
-- phone and email, the town, the Facebook page, a short description in our own words, the breeds its story names and
-- its logo, already uploaded to R2 puppyconnection-files at brand/seed-premierpawpals/logo-2026102926.webp with a
-- .card copy. The street address on its Contact page is a home address and is not published. Each UPDATE only fills an
-- empty field, so a later edit by the kennel is left alone and a second run changes nothing. Back up D1 first and
-- confirm the export printed "Downloaded".
UPDATE breeder_profiles SET public_phone = '(260) 585-6876', updated_at = '2026-10-29T20:48:05Z', version = version + 1 WHERE breeder_id = 'seed-premierpawpals' AND (public_phone IS NULL OR trim(public_phone) = '');
UPDATE breeder_profiles SET public_email = 'adoptions@premierpawpals.com', updated_at = '2026-10-29T20:48:05Z', version = version + 1 WHERE breeder_id = 'seed-premierpawpals' AND (public_email IS NULL OR trim(public_email) = '');
UPDATE breeder_profiles SET city = 'LaGrange', state = 'IN', updated_at = '2026-10-29T20:48:05Z', version = version + 1 WHERE breeder_id = 'seed-premierpawpals' AND city IS NULL AND state IS NULL;
UPDATE breeder_profiles SET facebook_url = 'https://www.facebook.com/1368517346335995', updated_at = '2026-10-29T20:48:05Z', version = version + 1 WHERE breeder_id = 'seed-premierpawpals' AND facebook_url IS NULL;
UPDATE breeder_profiles SET description = 'Premier Paw Pals is Marion and Wilma Bontrager''s family program in LaGrange, Indiana, raising Pomeranian and Yorkshire Terrier puppies. They began in 2021 as a small hobby breeder on their two-acre homestead and keep to one or two litters at a time. Their three children help care for and socialize the puppies, so the first weeks are spent in the middle of family life. The Bontragers say they keep studying how to improve their breeding program, and AKC papers are available for their puppies.', updated_at = '2026-10-29T20:48:05Z', version = version + 1 WHERE breeder_id = 'seed-premierpawpals' AND (description IS NULL OR trim(description) = '');
UPDATE breeder_profiles SET logo_key = 'brand/seed-premierpawpals/logo-2026102926.webp', updated_at = '2026-10-29T20:48:05Z', version = version + 1 WHERE breeder_id = 'seed-premierpawpals' AND logo_key IS NULL;
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-premierpawpals', 'breed-pomeranian');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-premierpawpals', 'breed-yorkshire-terrier');
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-29T20:48:05Z'), generation = generation + 1
 WHERE id = 1 AND EXISTS (SELECT 1 FROM breeder_profiles WHERE breeder_id = 'seed-premierpawpals' AND logo_key = 'brand/seed-premierpawpals/logo-2026102926.webp' AND updated_at = '2026-10-29T20:48:05Z')
   AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'seed-premierpawpals' AND action = 'breeder.import' AND at = '2026-10-29T20:48:05Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-29T20:48:05Z', 'system', 'claude', 'breeder.import', 'breeder', 'seed-premierpawpals', NULL,
         json_object('why', 'Alex, 2026-10-29, profile built from premierpawpals.com', 'fields', 'phone, email, town, Facebook, description, breeds, logo')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'seed-premierpawpals' AND action = 'breeder.import' AND at = '2026-10-29T20:48:05Z')
     AND EXISTS (SELECT 1 FROM breeder_profiles WHERE breeder_id = 'seed-premierpawpals' AND updated_at = '2026-10-29T20:48:05Z');
