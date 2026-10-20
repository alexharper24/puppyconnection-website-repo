-- 2026-10-20. Breed corrections from the breed audit of every staging puppy (Alex, 2026-10-20: puppies
-- under Cuddly Family Companions listed as Miniature Schnauzers that plainly are not; approved 2026-10-20
-- on the review page in hs-seo-data/puppyconnection/2026-10-20-breed-audit). Every breed below is named
-- by the puppy's Wix title, its Wix category or address, and its description, never by a photo.
-- The cause: the first harvest grouped a litter by breeder website and birth date with no breed, so
-- different breeds born the same day shared a litter and took the first puppy's breed, and the
-- 2026-10-18 pairing (migration 0023) copied that breed onto each litter it split off. The harvest and
-- the seed are fixed in the same change (_harvest/builddata.py, dev/seed.mjs).
-- Every update names the current wrong breed, so a breeder's own edit is left alone and a second run
-- changes nothing. Run once on staging after a backup, with ops/d1-apply.mjs.

-- group
-- Cuddly Family Companions, born May 17, 2026. Kenneth stays a Miniature Schnauzer; Parker, Patches,
-- Patience and Pearl move to their own Great Dane litter with the same dates.
PRAGMA defer_foreign_keys = true;
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  SELECT 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions--great-dane', breeder_id, 'breed-great-dane', born_on, ready_on, NULL, NULL, NULL, NULL, legacy_id, '2026-10-20T20:00:00Z', '2026-10-20T20:00:00Z', 1
  FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions';
UPDATE puppies SET litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions--great-dane', updated_at = '2026-10-20T20:00:00Z', version = version + 1
  WHERE id IN ('seed-p-0209', 'seed-p-0210', 'seed-p-0211', 'seed-p-0214') AND litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions'; -- parker, patches, patience, pearl

-- Peaceful Paws Puppies, born May 17, 2026: Pam, Pansy and Philip, all Great Danes.
UPDATE litters SET breed_id = 'breed-great-dane', updated_at = '2026-10-20T20:00:00Z', version = version + 1
  WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026' AND breed_id = 'breed-miniature-schnauzer';

-- Cuddly Family Companions, born June 4, 2026: Queenie, Quigley, Quincy and Quinton, all Shih Tzus.
UPDATE litters SET breed_id = 'breed-shih-tzu', updated_at = '2026-10-20T20:00:00Z', version = version + 1
  WHERE id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions' AND breed_id = 'breed-cavalier-king-charles-spaniel';

-- Responsible Dog Breeder Network, born May 23, 2026: Buddy, Jerry and Princess, all Cavaliers. The
-- Miniature Dachshunds left this litter for TM Countryside K9 in migration 0023.
UPDATE litters SET breed_id = 'breed-cavalier-king-charles-spaniel', updated_at = '2026-10-20T20:00:00Z', version = version + 1
  WHERE id = 'seed-l-responsibledogbreeder-com-may-23-2026' AND breed_id = 'breed-miniature-dachshund';

-- Responsible Dog Breeder Network, born June 10, 2026: Freddy, a Cavalier. The Cocker Spaniels left
-- this litter for Paw Print Acres in migration 0023.
UPDATE litters SET breed_id = 'breed-cavalier-king-charles-spaniel', updated_at = '2026-10-20T20:00:00Z', version = version + 1
  WHERE id = 'seed-l-responsibledogbreeder-com-june-10-2026' AND breed_id = 'breed-cocker-spaniel';

-- Pine Creek Bulldogs, born August 5, 2026: Tina, an English Bulldog. The parent weights and colors
-- came from the Johnny Miller French Bulldog litter it was split from; her own listing gives mom 56 lb
-- and dad 52 lb and leaves both colors blank.
UPDATE litters SET breed_id = 'breed-english-bulldog', mom_weight_lb = 56, dad_weight_lb = 52, description = NULL, updated_at = '2026-10-20T20:00:00Z', version = version + 1
  WHERE id = 'seed-l-responsibledogbreeder-com-august-5-2026--pine-creek-bulldogs' AND breed_id = 'breed-french-bulldog';

-- The breeds each breeder's page shows. Cuddly Family Companions has no Cavalier and its own site
-- lists Great Dane, Schnauzer, Shih Tzu and Yorkie. Pine Creek Bulldogs raises English Bulldogs.
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cuddlyfamilycompanions', 'breed-great-dane');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cuddlyfamilycompanions', 'breed-shih-tzu');
DELETE FROM breeder_breeds WHERE breeder_id = 'seed-cuddlyfamilycompanions' AND breed_id = 'breed-cavalier-king-charles-spaniel'
  AND NOT EXISTS (SELECT 1 FROM litters WHERE breeder_id = 'seed-cuddlyfamilycompanions' AND breed_id = 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pine-creek-bulldogs', 'breed-english-bulldog');
DELETE FROM breeder_breeds WHERE breeder_id = 'seed-pine-creek-bulldogs' AND breed_id = 'breed-french-bulldog'
  AND NOT EXISTS (SELECT 1 FROM litters WHERE breeder_id = 'seed-pine-creek-bulldogs' AND breed_id = 'breed-french-bulldog');

UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
