-- 2026-10-19. Bless Your Paws Puppies had a state and no town, so its breeder page showed a bare "IN"
-- under the name (Alex, 2026-10-19). Its own site names Warsaw, Indiana as its service area
-- (areaServed on blessyourpawspuppies.com, confirmed by Alex on 2026-08-22 in blessyourpaws-website-repo),
-- which is a town and never a home address. Fills only an empty town, so a second run changes nothing.
UPDATE breeder_profiles SET city = 'Warsaw', updated_at = '2026-10-19T16:00:00Z', version = version + 1 WHERE breeder_id = 'seed-blessyourpawspuppies' AND (city IS NULL OR city = '');

-- Mark the site for the next publish.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
