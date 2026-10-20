-- 2026-10-20. Cavalier King Charles Spaniel back on Cuddly Family Companions' breed list (Alex,
-- 2026-10-20: "yes, put Cavalier back"). Migration 0046 removed it on the claim that the kennel's own site
-- lists no Cavalier, but that came from the site title alone. Its about page says the program expanded "to
-- include Shih Tzus, Mini Schnauzers, Cavaliers, and Great Danes". A second run changes nothing.

INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cuddlyfamilycompanions', 'breed-cavalier-king-charles-spaniel');

UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
