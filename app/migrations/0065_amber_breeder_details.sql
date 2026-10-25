-- Breeder details from Amber (2026-10-25, pasted by Alex). Premier Paw Pals now has a website.
-- Mervin Fry raises Miniature Dachshunds in Topeka, Indiana, and Puppy Connection takes his calls
-- for now, so his public phone is Puppy Connection's. Daniel Ramsey is in Pierceton, Indiana. The
-- descriptions are Amber's own words. The site is marked as changed so the next publish shows them.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing.

UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-25T20:00:00Z'), generation = generation + 1
 WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'profile.update' AND actor = 'claude' AND at = '2026-10-25T20:00:00Z');

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'profile.update', 'breeder', breeder_id, json_object('website_url', website_url), json_object('website_url', 'https://www.premierpawpals.com', 'why', 'Amber, 2026-10-25')
    FROM breeder_profiles WHERE breeder_id = 'seed-premierpawpals' AND website_url IS NULL;
UPDATE breeder_profiles SET website_url = 'https://www.premierpawpals.com', updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE breeder_id = 'seed-premierpawpals' AND website_url IS NULL;

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'profile.update', 'breeder', breeder_id, json_object('city', city), json_object('city', 'Topeka', 'state', 'IN', 'public_phone', '574-221-0326', 'why', 'Amber, 2026-10-25')
    FROM breeder_profiles WHERE breeder_id = 'seed-mervin-fry' AND description IS NULL;
UPDATE breeder_profiles SET city = 'Topeka', state = 'IN', public_phone = '574-221-0326',
       description = 'Mervin Fry enjoys the quiet country life in Topeka, Indiana, where he raises a few litters of Dachshund puppies each year and loves sharing these little companions with families looking for a new furry friend.',
       updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE breeder_id = 'seed-mervin-fry' AND description IS NULL;

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T20:00:00Z', 'system', 'claude', 'profile.update', 'breeder', breeder_id, json_object('city', city), json_object('city', 'Pierceton', 'state', 'IN', 'public_phone', '574-835-1082', 'why', 'Amber, 2026-10-25')
    FROM breeder_profiles WHERE breeder_id = 'seed-daniel-ramsey' AND description IS NULL;
UPDATE breeder_profiles SET city = 'Pierceton', state = 'IN', public_phone = '574-835-1082',
       description = 'Daniel Ramsey lives in Pierceton, Indiana, where he enjoys raising puppies for his children to grow up alongside, caring for his sheep, tackling building projects, and making the most of quality time with his family. He is also the owner and operator of Furry Freight pet transportation.',
       updated_at = '2026-10-25T20:00:00Z', version = version + 1
 WHERE breeder_id = 'seed-daniel-ramsey' AND description IS NULL;
