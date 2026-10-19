-- 2026-10-19. Logos for the four listed breeders with a website of their own that still had none, and the
-- whole Bless Your Paws litter of July 22, 2026 on the site (Alex, 2026-10-19: "you're missing the logo for
-- Bless Your Paws ... I want to include all the puppies in the litter, and there are eight puppies").
-- Logos: Bless Your Paws from the header of blessyourpawspuppies.com, and Cornerstone Cavaliers, Heartland Mini
-- Schnauzers and Winding Streams Companions from the header of their own sites, already uploaded to R2
-- puppyconnection-files at brand/<breeder id>/logo-2026101926.webp (Winding Streams has no .card copy, as its
-- file is smaller than a card).
-- The litter: blessyourpawspuppies.com lists eight, and Jericho and Shiloh show there as adopted. Jericho was
-- archived by migration 0023 when it left the Wix store, and comes back as adopted. Shiloh was never imported,
-- and is added from its page there, with its eleven photos measured by the dog detector (ops/measure_photos.py
-- rule). No price is set, because the page shows none for an adopted puppy. Tirzah sat alone in a litter made
-- when it moved breeders, so it joins its littermates and that litter is archived.
-- Every statement checks the state it changes, so a second run changes nothing. Run once on staging after a
-- backup, with ops/d1-apply.mjs.

-- Logos
UPDATE breeder_profiles SET logo_key = 'brand/seed-blessyourpawspuppies/logo-2026101926.webp', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE breeder_id = 'seed-blessyourpawspuppies' AND logo_key IS NULL;
UPDATE breeder_profiles SET logo_key = 'brand/seed-cornerstonecavaliers/logo-2026101926.webp', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE breeder_id = 'seed-cornerstonecavaliers' AND logo_key IS NULL;
UPDATE breeder_profiles SET logo_key = 'brand/seed-heartlandminischnauzers/logo-2026101926.webp', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE breeder_id = 'seed-heartlandminischnauzers' AND logo_key IS NULL;
UPDATE breeder_profiles SET logo_key = 'brand/seed-windingstreamscompanions/logo-2026101926.webp', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE breeder_id = 'seed-windingstreamscompanions' AND logo_key IS NULL;

-- Jericho, adopted (placed_at is set by the migrations/0019 trigger)
UPDATE puppies SET publication_state = 'published', availability = 'placed', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0132' AND breeder_id = 'seed-blessyourpawspuppies' AND publication_state = 'archived';

-- Tirzah joins its littermates
-- group
UPDATE puppies SET litter_id = 'seed-l-blessyourpawspuppies-com-july-22-2026', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0257' AND breeder_id = 'seed-blessyourpawspuppies' AND litter_id = 'seed-l-solo-tirzah-munchkin-bernedoodle';
UPDATE litters SET archived_at = '2026-10-19T14:00:00Z', updated_at = '2026-10-19T14:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-tirzah-munchkin-bernedoodle' AND archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM puppies WHERE litter_id = 'seed-l-solo-tirzah-munchkin-bernedoodle');

-- Shiloh, adopted, from https://blessyourpawspuppies.com/puppy-shiloh
-- group
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, sex, color, description, breeder_url, includes_json, payment_state, publication_state, availability, published_at, created_at, updated_at, last_update_at)
  VALUES ('seed-p-byp-shiloh', 'seed-blessyourpawspuppies', 'seed-l-blessyourpawspuppies-com-july-22-2026', 'shiloh-munchkin-bernedoodle', 'Shiloh', 'male', 'blue merle phantom', 'Shiloh is a blue merle phantom boy growing up in the house, handled every day, around nieces and nephews and other dogs, with early neurological stimulation from the first weeks.', 'https://blessyourpawspuppies.com/puppy-shiloh', '["Vaccination and health record", "Examination by our vet", "Microchipped", "Signed health guarantee", "Small bag of the food they know", "Collar and leash", "A blanket", "Toys"]', 'comped', 'published', 'placed', '2026-10-19T14:00:00Z', '2026-10-19T14:00:00Z', '2026-10-19T14:00:00Z', '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img0', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-10.jpg?v=0a90ad48', 0, 1.5, 1080, 720, 0.455, 0.548, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img1', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-11.jpg?v=d08444ee', 1, 1.5, 1080, 720, 0.472, 0.439, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img2', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-12.jpg?v=8efc9021', 2, 1.5, 1080, 720, 0.505, 0.489, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img3', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-13.jpg?v=4c89d153', 3, 1.5, 1080, 720, 0.39, 0.486, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img4', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-14.jpg?v=b45a6774', 4, 1.5, 1080, 720, 0.405, 0.515, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img5', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-15.jpg?v=95f43079', 5, 1.5, 1080, 720, 0.355, 0.582, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img6', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-16.jpg?v=5abf194c', 6, 1.5, 1080, 720, 0.499, 0.482, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img7', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-17.jpg?v=c8e740a8', 7, 1.5, 1080, 720, 0.463, 0.413, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img8', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-18.jpg?v=29fdb897', 8, 1.5, 1080, 720, 0.412, 0.566, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img9', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-19.jpg?v=70d0bac4', 9, 1.5, 1080, 720, 0.371, 0.5, '2026-10-19T14:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, focus_x, focus_y, created_at) VALUES ('seed-p-byp-shiloh-img10', 'seed-blessyourpawspuppies', 'seed-p-byp-shiloh', 'https://blessyourpawspuppies.com/img/puppies/shiloh-20.jpg?v=e9b5ce78', 10, 1.5, 1080, 720, 0.415, 0.519, '2026-10-19T14:00:00Z');

-- Mark the site for the next publish.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
