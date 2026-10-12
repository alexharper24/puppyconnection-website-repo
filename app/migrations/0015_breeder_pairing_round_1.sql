-- 2026-10-12. Breeder pairing, first round (Alex, 2026-10-12: "move them, hide maple brook. show rdb
-- puppies under them instead of breeders for now"). Each moved puppy was found on the new breeder's own
-- website (hs-seo-data/puppyconnection/2026-10-11/breeders). Elowen and Malcolm wait for Amber, since
-- their match rests on the name alone. Run once on each database after a backup.
PRAGMA defer_foreign_keys = true;

-- Litters that move whole, with their puppies.
UPDATE litters SET breeder_id = 'seed-blessyourpawspuppies', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-tirzah-munchkin-bernedoodle';
UPDATE litters SET breeder_id = 'seed-cornerstonecavaliers', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-lars-cavalier-king-charles-spaniel';
UPDATE litters SET breeder_id = 'seed-cornerstonecavaliers', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-11-2026';
UPDATE litters SET breeder_id = 'seed-heartlandminischnauzers', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-qeleigh-miniature-schnauzer';
UPDATE litters SET breeder_id = 'seed-heartlandminischnauzers', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-quartz-miniature-schnauzer';
UPDATE litters SET breeder_id = 'seed-heartlandminischnauzers', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-quinn-miniature-schnauzer';
UPDATE litters SET breeder_id = 'seed-windingstreamscompanions', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-16-2026';

-- Sunny shares a Peaceful Paws litter with five puppies that stay, so Sunny gets a litter of its own.
INSERT INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  SELECT 'seed-l-cornerstone-sunny', 'seed-cornerstonecavaliers', breed_id, born_on, ready_on, NULL, NULL, NULL, archived_at, NULL, '2026-10-12T01:00:00Z', '2026-10-12T01:00:00Z', 1
  FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-19-2026';
UPDATE puppies SET litter_id = 'seed-l-cornerstone-sunny' WHERE id = 'seed-p-0252';

-- The moved puppies, each linked to its own page on its breeder's site.
UPDATE puppies SET breeder_id = 'seed-blessyourpawspuppies', breeder_url = 'https://blessyourpawspuppies.com/puppy-tirzah', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0257';
UPDATE photos SET breeder_id = 'seed-blessyourpawspuppies' WHERE puppy_id = 'seed-p-0257';
UPDATE puppies SET breeder_id = 'seed-cornerstonecavaliers', breeder_url = 'https://cornerstonecavaliers.com/product/lars/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0161';
UPDATE photos SET breeder_id = 'seed-cornerstonecavaliers' WHERE puppy_id = 'seed-p-0161';
UPDATE puppies SET breeder_id = 'seed-cornerstonecavaliers', breeder_url = 'https://cornerstonecavaliers.com/product/leo/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0164';
UPDATE photos SET breeder_id = 'seed-cornerstonecavaliers' WHERE puppy_id = 'seed-p-0164';
UPDATE puppies SET breeder_id = 'seed-cornerstonecavaliers', breeder_url = 'https://cornerstonecavaliers.com/product/dahlia/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0080';
UPDATE photos SET breeder_id = 'seed-cornerstonecavaliers' WHERE puppy_id = 'seed-p-0080';
UPDATE puppies SET breeder_id = 'seed-cornerstonecavaliers', breeder_url = 'https://cornerstonecavaliers.com/product/sunny/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0252';
UPDATE photos SET breeder_id = 'seed-cornerstonecavaliers' WHERE puppy_id = 'seed-p-0252';
UPDATE puppies SET breeder_id = 'seed-heartlandminischnauzers', breeder_url = 'https://heartlandminischnauzers.com/product/qeleigh/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0225';
UPDATE photos SET breeder_id = 'seed-heartlandminischnauzers' WHERE puppy_id = 'seed-p-0225';
UPDATE puppies SET breeder_id = 'seed-heartlandminischnauzers', breeder_url = 'https://heartlandminischnauzers.com/product/quartz/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0226';
UPDATE photos SET breeder_id = 'seed-heartlandminischnauzers' WHERE puppy_id = 'seed-p-0226';
UPDATE puppies SET breeder_id = 'seed-heartlandminischnauzers', breeder_url = 'https://heartlandminischnauzers.com/product/quinn/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0231';
UPDATE photos SET breeder_id = 'seed-heartlandminischnauzers' WHERE puppy_id = 'seed-p-0231';
UPDATE puppies SET breeder_id = 'seed-windingstreamscompanions', breeder_url = 'https://windingstreamscompanions.com/product/guy/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0119';
UPDATE photos SET breeder_id = 'seed-windingstreamscompanions' WHERE puppy_id = 'seed-p-0119';
UPDATE puppies SET breeder_id = 'seed-windingstreamscompanions', breeder_url = 'https://windingstreamscompanions.com/product/gertie/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0110';
UPDATE photos SET breeder_id = 'seed-windingstreamscompanions' WHERE puppy_id = 'seed-p-0110';

-- Responsible Dog Breeder is a network of member kennels, shown under its own name for now.
UPDATE breeder_profiles SET business_name = 'Responsible Dog Breeder Network', description = 'The Responsible Dog Breeder Network is a national network of dog breeders based in Lancaster, Pennsylvania. It is not a single kennel, and every puppy it lists comes from an approved member breeder. Members commit to written standards and take part in ongoing review to keep their approval. Those standards call for health and genetic testing of parent dogs, limited and planned litters, early socialization, and honest information for families about each puppy. Member breeders are in Pennsylvania, Illinois, Ohio, New York, Indiana and Michigan, and they offer many breeds from Great Danes to Cavaliers and Miniature Schnauzers.', public_phone = '717-844-9021', public_email = 'admin@responsibledogbreeder.com', city = 'Lancaster', state = 'PA', facebook_url = 'https://facebook.com/profile.php?id=61579702450078', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/ash/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0014' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/asher/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0015' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/atlas-2/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0017' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/beatrice/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0023' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/billy/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0032' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/blake/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0037' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/brittany/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0049' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/celestia/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0060' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/cherish/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0065' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/laddie/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0165' AND breeder_id = 'seed-responsibledogbreeder';
UPDATE puppies SET breeder_url = 'https://responsibledogbreeder.com/puppies/wendeline/', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'seed-p-0268' AND breeder_id = 'seed-responsibledogbreeder';

-- Maple Brook Doodles is a test breeder, hidden from the public site.
UPDATE breeders SET status = 'suspended', status_reason = 'Test breeder, hidden from the public site (Alex, 2026-10-12)', decided_at = '2026-10-12T01:00:00Z', decided_by = 'migration 0015', updated_at = '2026-10-12T01:00:00Z', version = version + 1 WHERE id = 'demo-maplebrook';
