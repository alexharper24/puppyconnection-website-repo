-- 2026-10-18. Breeder pairing, second round, written by dev/make-breeder-pairing-migration.mjs from the
-- Wix re-inventory in hs-seo-data/puppyconnection/2026-10-18-wix-reinventory (review.html). Alex, 2026-10-18:
-- "show kennels in rdbn show each with its own breeder page. if those listings without a breeder are not on the
-- current live site remove them. for toast if it links to that kennel then it should get its own ... if peaceful
-- paws puppies are no more remove them. elowin, malcolm, and smurf are ambers other website kingdom family
-- companion. and then proceed with the rest."
-- Each puppy goes to the kennel whose address its live listing prints, checked against the phone on the
-- kennel's own site or network page. Smurf is held, because its only contact is Bless Your Paws' number.
-- Run once on staging after a backup, with ops/d1-apply.mjs, because the moves need PRAGMA defer_foreign_keys,
-- which hosted D1 honors only inside one d1 execute --command (README), and a "-- group" line starts statements
-- that must go in the same command. Every insert is OR IGNORE and every update names its row, so a second
-- run changes nothing it has not already changed.

-- New breeders. Each Responsible Dog Breeder Network member kennel gets its own page, and so do Teapup, Sweet Puppy Paws and County Line Kennel. Sign-in addresses are <slug>@breeders.test, like the other imported breeders, until each kennel signs up.
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-pleasantviewpuppies', 'pleasantviewpuppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-pleasantviewpuppies', 'Pleasant View Puppies', 'pleasantviewpuppies', '517-816-9079', 'adoptions@pleasantviewpuppies.com', 'https://pleasantviewpuppies.com', 'Osseo', 'MI', 'https://www.facebook.com/profile.php?id=61591127427446', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-rollingacresfarmpuppies', 'rollingacresfarmpuppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-rollingacresfarmpuppies', 'Rolling Acres Farm Puppies', 'rollingacresfarmpuppies', '217-262-9510', 'adoptions@rollingacresfarmpuppies.com', 'https://rollingacresfarmpuppies.com', 'Humboldt', 'IL', 'https://www.facebook.com/profile.php?id=61579813569860', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-cuddlyfamilycompanions', 'cuddlyfamilycompanions@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-cuddlyfamilycompanions', 'Cuddly Family Companions', 'cuddlyfamilycompanions', '765-542-5688', 'adoptions@cuddlyfamilycompanions.com', 'https://cuddlyfamilycompanions.com', 'Greens Fork', 'IN', 'https://www.facebook.com/profile.php?id=61591061730496', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-teapup', 'teapup@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-teapup', 'Teapup', 'teapup', '574-457-8231', 'pups@teapup.com', 'https://teapup.com', 'Syracuse', 'IN', 'https://www.facebook.com/Teapup/', '2026-10-18T20:00:00Z'); -- from its own website
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-marlorhomesteadcompanions', 'marlorhomesteadcompanions@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-marlorhomesteadcompanions', 'Marlor Homestead Companions', 'marlorhomesteadcompanions', '989-584-1447', 'adoptions@marlorhomesteadcompanions.com', 'https://marlorhomesteadcompanions.com', 'Carson City', 'MI', 'https://www.facebook.com/profile.php?id=61582534291719', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-tmcountrysidek9', 'tmcountrysidek9@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-tmcountrysidek9', 'TM Countryside K9', 'tmcountrysidek9', '574-538-4690', 'adoptions@tmcountrysidek9.com', 'https://tmcountrysidek9.com', 'Goshen', 'IN', 'https://www.facebook.com/1149685134905736', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-preciouspawscompanions', 'preciouspawscompanions@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-preciouspawscompanions', 'Precious Paws Companions', 'preciouspawscompanions', '330-275-4160', 'theyoders1@gmail.com', 'https://preciouspawscompanions.com', 'Millersburg', 'OH', 'https://www.facebook.com/profile.php?id=61582853704737', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-doubleyypuppies', 'doubleyypuppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-doubleyypuppies', 'Double YY Puppies', 'doubleyypuppies', '217-472-2230', 'adoptions@doubleyypuppies.com', 'https://doubleyypuppies.com', 'Arthur', 'IL', 'https://www.facebook.com/profile.php?id=61590729146855', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-kingsfamilycompanions', 'kingsfamilycompanions@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-kingsfamilycompanions', 'King''s Family Companions', 'kingsfamilycompanions', '717-455-3405', 'adoptions@kingsfamilycompanions.com', 'https://kingsfamilycompanions.com', 'Ronks', 'PA', 'https://www.facebook.com/1244737748727177', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-goldpawcanine', 'goldpawcanine@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-goldpawcanine', 'Gold Paw Canine', 'goldpawcanine', '717-640-3490', 'adoptions@goldpawcanine.com', 'https://goldpawcanine.com', 'Kinzers', 'PA', 'https://www.facebook.com/profile.php?id=61580036757045', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-pineacrespuppies', 'pineacrespuppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-pineacrespuppies', 'Pine Acres Puppies', 'pineacrespuppies', '717-844-6902', 'puppysales@pineacrespuppies.com', 'https://pineacrespuppies.com', 'Kinzers', 'PA', 'https://www.facebook.com/profile.php?id=61578855457563', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-sweetpuppypaws', 'sweetpuppypaws@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-sweetpuppypaws', 'Sweet Puppy Paws', 'sweetpuppypaws', '574-275-3531', 'sweetlittlepuppypaws@gmail.com', 'https://sweetpuppypaws.net', 'Syracuse', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its own website
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-familyaffairpuppies', 'familyaffairpuppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-familyaffairpuppies', 'Family Affair Puppies', 'familyaffairpuppies', '260-350-4840', 'familyaffairpuppies@gmail.com', 'https://familyaffairpuppies.com', 'Topeka', 'IN', 'https://www.facebook.com/people/Family-Affair-Puppies/61554681451725/', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-sunsetpawbabies', 'sunsetpawbabies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-sunsetpawbabies', 'Sunset Paw Babies', 'sunsetpawbabies', '217-292-1439', 'adoptions@sunsetpawbabies.com', 'https://sunsetpawbabies.com', 'Sullivan', 'IL', 'https://www.facebook.com/people/Sunset-Paw-Babies/61583949925217/', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-ibarcaninecompanions', 'ibarcaninecompanions@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-ibarcaninecompanions', 'Ibar Canine Companions', 'ibarcaninecompanions', '717-844-9963', 'puppysales@ibarcaninecompanions.com', 'https://ibarcaninecompanions.com', 'Honey Brook', 'PA', 'https://www.facebook.com/profile.php?id=61579914243108', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-rockytopbulldogs', 'rockytopbulldogs@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-rockytopbulldogs', 'Rocky Top Bulldogs', 'rockytopbulldogs', '260-535-0146', 'adoptions@rockytopbulldogs.com', 'https://rockytopbulldogs.com', 'Shipshewana', 'IN', 'https://www.facebook.com/1395469953643443', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-perfectmatchpoodles', 'perfectmatchpoodles@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-perfectmatchpoodles', 'Perfect Match Poodles', 'perfectmatchpoodles', '574-622-2774', NULL, 'https://perfectmatchpoodles.com', 'Nappanee', 'IN', 'https://www.facebook.com/1268881432973763', '2026-10-18T20:00:00Z'); -- from its own website and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-pawprintacres', 'pawprintacres@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-pawprintacres', 'Paw Print Acres', 'pawprintacres', '574-900-2968', NULL, 'https://pawprintacres.com', 'Wakarusa', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-maplelanepets', 'maplelanepets@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-maplelanepets', 'Maple Lane Pets', 'maplelanepets', '260-383-0995', NULL, 'https://thehomeofmaplelanepets.com', 'Topeka', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-willowlanebulldogs', 'willowlanebulldogs@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-willowlanebulldogs', 'Willow Lane Bulldogs', 'willowlanebulldogs', '574-330-3335', NULL, 'https://willowlanebulldogs.com', 'Millersburg', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-johnny-miller', 'johnny-miller@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-johnny-miller', 'Johnny Miller', 'johnny-miller', '574-500-2181', NULL, 'https://responsibledogbreeder.com/johnny-miller/', 'Goshen', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-duane-borkholder', 'duane-borkholder@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-duane-borkholder', 'Duane Borkholder', 'duane-borkholder', '574-601-3564', NULL, 'https://responsibledogbreeder.com/duane-borkholder/', 'Milford', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-countryview-pets', 'countryview-pets@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-countryview-pets', 'Countryview Pets', 'countryview-pets', '260-308-2372', NULL, 'https://responsibledogbreeder.com/countryview-pets/', 'Ligonier', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-riverdale-paw-pals', 'riverdale-paw-pals@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-riverdale-paw-pals', 'Riverdale Paw Pals', 'riverdale-paw-pals', '574-635-9383', NULL, 'https://responsibledogbreeder.com/riverdale-paw-pals/', 'Rochester', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-little-paws-canine', 'little-paws-canine@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-little-paws-canine', 'Little Paws Canine', 'little-paws-canine', '260-383-4010', NULL, 'https://responsibledogbreeder.com/little-paws-canine/', 'Topeka', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-wagging-tail-puppies', 'wagging-tail-puppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-wagging-tail-puppies', 'Wagging Tail Puppies', 'wagging-tail-puppies', '574-500-2586', NULL, 'https://responsibledogbreeder.com/wagging-tail-puppies/', 'Goshen', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-signature-puppies', 'signature-puppies@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-signature-puppies', 'Signature Puppies', 'signature-puppies', '260-977-3012', NULL, 'https://responsibledogbreeder.com/signature-puppies/', 'LaGrange', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-cozy-pine-canine', 'cozy-pine-canine@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-cozy-pine-canine', 'Cozy Pine Canine', 'cozy-pine-canine', '260-383-4734', NULL, 'https://responsibledogbreeder.com/gerald-bontrager/', 'Topeka', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-tyler-eileen-martin', 'tyler-eileen-martin@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-tyler-eileen-martin', 'Tyler & Eileen Martin', 'tyler-eileen-martin', '574-538-4761', NULL, 'https://responsibledogbreeder.com/tyler-eileen-martin/', 'Goshen', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-pine-creek-bulldogs', 'pine-creek-bulldogs@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-pine-creek-bulldogs', 'Pine Creek Bulldogs', 'pine-creek-bulldogs', '574-505-4703', NULL, 'https://responsibledogbreeder.com/pine-creek-bulldogs/', 'Milford', 'IN', NULL, '2026-10-18T20:00:00Z'); -- from its Responsible Dog Breeder Network member page and the network Our Breeders page
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-county-line-kennel', 'county-line-kennel@breeders.test', 'approved', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'legacy-wix', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 'migration 0023', 1, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, public_phone, public_email, website_url, city, state, facebook_url, updated_at)
  VALUES ('seed-county-line-kennel', 'County Line Kennel', 'county-line-kennel', NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z'); -- from Amber's Wix breeder page breeder-countylinekennel, the only source that names it

-- Moves. 166 puppies go to the kennel their live Wix listing names. A litter whose puppies all go to one kennel moves whole; otherwise the moving puppies get a copy of their litter under their kennel.
PRAGMA defer_foreign_keys = true;
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres', 'seed-pawprintacres', 'breed-cocker-spaniel', '2026-06-10', '2026-08-05', NULL, NULL, NULL, NULL, 'responsibledogbreeder-com-june-10-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres', breeder_url = 'https://responsibledogbreeder.com/paw-print-acres/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0001' AND breeder_id <> 'seed-pawprintacres'; -- alexa-cocker-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0001';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0001';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0001';
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres', breeder_url = 'https://responsibledogbreeder.com/paw-print-acres/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0006' AND breeder_id <> 'seed-pawprintacres'; -- anna-cocker-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0006';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0006';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0006';
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0014' AND breeder_id <> 'seed-pawprintacres'; -- ash-cocker-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0014';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0014';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0014';
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0017' AND breeder_id <> 'seed-pawprintacres'; -- atlas-cocker-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0017';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0017';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0017';
-- group
UPDATE litters SET breeder_id = 'seed-teapup', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-amore-cavapoo' AND breeder_id <> 'seed-teapup';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-solo-amore-cavapoo', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0003' AND breeder_id <> 'seed-teapup'; -- amore-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0003';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0003';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0003';
-- group
UPDATE litters SET breeder_id = 'seed-teapup', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-7-2026' AND breeder_id <> 'seed-teapup';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-7-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0005' AND breeder_id <> 'seed-teapup'; -- andre-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0005';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0005';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0005';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-7-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0098' AND breeder_id <> 'seed-teapup'; -- flash-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0098';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0098';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0098';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-7-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0101' AND breeder_id <> 'seed-teapup'; -- fox-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0101';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0101';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0101';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9', 'seed-tmcountrysidek9', 'breed-miniature-dachshund', '2026-05-23', '2026-07-18', NULL, NULL, NULL, NULL, 'responsibledogbreeder-com-may-23-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9', breeder_url = 'https://www.tmcountrysidek9.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0008' AND breeder_id <> 'seed-tmcountrysidek9'; -- annie-miniature-dachshund: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0008';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0008';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0008';
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9', breeder_url = 'https://www.tmcountrysidek9.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0012' AND breeder_id <> 'seed-tmcountrysidek9'; -- ari-miniature-dachshund: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0012';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0012';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0012';
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0015' AND breeder_id <> 'seed-tmcountrysidek9'; -- asher-miniature-dachshund: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0015';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0015';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0015';
-- group
UPDATE litters SET breeder_id = 'seed-riverdale-paw-pals', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-apple-jacks-pembroke-welsh-corgi' AND breeder_id <> 'seed-riverdale-paw-pals';
UPDATE puppies SET breeder_id = 'seed-riverdale-paw-pals', litter_id = 'seed-l-solo-apple-jacks-pembroke-welsh-corgi', breeder_url = 'https://responsibledogbreeder.com/riverdale-paw-pals/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0010' AND breeder_id <> 'seed-riverdale-paw-pals'; -- apple-jacks-pembroke-welsh-corgi: printed address
UPDATE photos SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0010';
UPDATE puppy_videos SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0010';
UPDATE listing_reports SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0010';
-- group
UPDATE litters SET breeder_id = 'seed-pleasantviewpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-21-2026' AND breeder_id <> 'seed-pleasantviewpuppies';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0011' AND breeder_id <> 'seed-pleasantviewpuppies'; -- apple-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0011';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0011';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0011';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0022' AND breeder_id <> 'seed-pleasantviewpuppies'; -- barley-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0022';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0022';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0022';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0042' AND breeder_id <> 'seed-pleasantviewpuppies'; -- boone-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0042';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0042';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0042';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0072' AND breeder_id <> 'seed-pleasantviewpuppies'; -- colt-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0072';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0072';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0072';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0076' AND breeder_id <> 'seed-pleasantviewpuppies'; -- cornell-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0076';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0076';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0076';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0120' AND breeder_id <> 'seed-pleasantviewpuppies'; -- harvest-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0120';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0120';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0120';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0123' AND breeder_id <> 'seed-pleasantviewpuppies'; -- huck-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0123';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0123';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0123';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-21-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0182' AND breeder_id <> 'seed-pleasantviewpuppies'; -- maple-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0182';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0182';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0182';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-peacefulpawspuppies-com-august-19-2026--marlorhomesteadcompanions', 'seed-marlorhomesteadcompanions', 'breed-cavalier-king-charles-spaniel', '2026-08-19', '2026-10-14', 20, 20, 'Dad''s color: Blenheim.', NULL, 'peacefulpawspuppies-com-august-19-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-19-2026--marlorhomesteadcompanions', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0020' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- autumn-cavalier-king-charles-spaniel-1: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0020';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0020';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0020';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-19-2026--marlorhomesteadcompanions', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0078' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- cuddles-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0078';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0078';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0078';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-19-2026--marlorhomesteadcompanions', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0223' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- pleasant-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0223';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0223';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0223';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-19-2026--marlorhomesteadcompanions', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0262' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- trooper-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0262';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0262';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0262';
-- group
UPDATE litters SET breeder_id = 'seed-pleasantviewpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-29-2026' AND breeder_id <> 'seed-pleasantviewpuppies';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-29-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0021' AND breeder_id <> 'seed-pleasantviewpuppies'; -- avery-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0021';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0021';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0021';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-29-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0025' AND breeder_id <> 'seed-pleasantviewpuppies'; -- bella-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0025';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0025';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0025';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-29-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0036' AND breeder_id <> 'seed-pleasantviewpuppies'; -- blaise-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0036';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0036';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0036';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-29-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0075' AND breeder_id <> 'seed-pleasantviewpuppies'; -- copy-of-bella-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0075';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0075';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0075';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-29-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0160' AND breeder_id <> 'seed-pleasantviewpuppies'; -- larry-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0160';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0160';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0160';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9', 'seed-tmcountrysidek9', 'breed-great-dane', '2026-07-19', '2026-09-14', NULL, NULL, NULL, NULL, 'responsibledogbreeder-com-july-19-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0023' AND breeder_id <> 'seed-tmcountrysidek9'; -- beatrice-great-dane-1: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0023';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0023';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0023';
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0037' AND breeder_id <> 'seed-tmcountrysidek9'; -- blake-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0037';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0037';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0037';
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0049' AND breeder_id <> 'seed-tmcountrysidek9'; -- brittany-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0049';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0049';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0049';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', 'seed-johnny-miller', 'breed-french-bulldog', '2026-08-05', '2026-09-30', 20, 25, 'Mom''s color: Fawn. Dad''s color: Blue tri.', NULL, 'responsibledogbreeder-com-august-5-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0026' AND breeder_id <> 'seed-johnny-miller'; -- bella-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0026';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0026';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0026';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0057' AND breeder_id <> 'seed-johnny-miller'; -- casey-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0057';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0057';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0057';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0097' AND breeder_id <> 'seed-johnny-miller'; -- finn-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0097';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0097';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0097';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0117' AND breeder_id <> 'seed-johnny-miller'; -- gunner-french-bulldog-1: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0117';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0117';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0117';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0168' AND breeder_id <> 'seed-johnny-miller'; -- lexa-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0168';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0168';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0168';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0191' AND breeder_id <> 'seed-johnny-miller'; -- mia-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0191';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0191';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0191';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--johnny-miller', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0242' AND breeder_id <> 'seed-johnny-miller'; -- sawyer-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0242';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0242';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0242';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-august-5-2026--pine-creek-bulldogs', 'seed-pine-creek-bulldogs', 'breed-french-bulldog', '2026-08-05', '2026-09-30', 20, 25, 'Mom''s color: Fawn. Dad''s color: Blue tri.', NULL, 'responsibledogbreeder-com-august-5-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-pine-creek-bulldogs', litter_id = 'seed-l-responsibledogbreeder-com-august-5-2026--pine-creek-bulldogs', breeder_url = 'https://responsibledogbreeder.com/pine-creek-bulldogs/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0256' AND breeder_id <> 'seed-pine-creek-bulldogs'; -- tina-english-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-pine-creek-bulldogs' WHERE puppy_id = 'seed-p-0256';
UPDATE puppy_videos SET breeder_id = 'seed-pine-creek-bulldogs' WHERE puppy_id = 'seed-p-0256';
UPDATE listing_reports SET breeder_id = 'seed-pine-creek-bulldogs' WHERE puppy_id = 'seed-p-0256';
-- group
UPDATE litters SET breeder_id = 'seed-pineacrespuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-september-3-2026' AND breeder_id <> 'seed-pineacrespuppies';
UPDATE puppies SET breeder_id = 'seed-pineacrespuppies', litter_id = 'seed-l-peacefulpawspuppies-com-september-3-2026', breeder_url = 'https://www.pineacrespuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0027' AND breeder_id <> 'seed-pineacrespuppies'; -- ben-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0027';
UPDATE puppy_videos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0027';
UPDATE listing_reports SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0027';
UPDATE puppies SET breeder_id = 'seed-pineacrespuppies', litter_id = 'seed-l-peacefulpawspuppies-com-september-3-2026', breeder_url = 'https://www.pineacrespuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0030' AND breeder_id <> 'seed-pineacrespuppies'; -- betty-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0030';
UPDATE puppy_videos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0030';
UPDATE listing_reports SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0030';
UPDATE puppies SET breeder_id = 'seed-pineacrespuppies', litter_id = 'seed-l-peacefulpawspuppies-com-september-3-2026', breeder_url = 'https://www.pineacrespuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0041' AND breeder_id <> 'seed-pineacrespuppies'; -- bonnie-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0041';
UPDATE puppy_videos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0041';
UPDATE listing_reports SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0041';
UPDATE puppies SET breeder_id = 'seed-pineacrespuppies', litter_id = 'seed-l-peacefulpawspuppies-com-september-3-2026', breeder_url = 'https://www.pineacrespuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0047' AND breeder_id <> 'seed-pineacrespuppies'; -- brian-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0047';
UPDATE puppy_videos SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0047';
UPDATE listing_reports SET breeder_id = 'seed-pineacrespuppies' WHERE puppy_id = 'seed-p-0047';
-- group
UPDATE litters SET breeder_id = 'seed-pawprintacres', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-19-2026' AND breeder_id <> 'seed-pawprintacres';
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-responsibledogbreeder-com-may-19-2026', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0032' AND breeder_id <> 'seed-pawprintacres'; -- billy-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0032';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0032';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0032';
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-responsibledogbreeder-com-may-19-2026', breeder_url = 'https://responsibledogbreeder.com/paw-print-acres/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0039' AND breeder_id <> 'seed-pawprintacres'; -- blossom-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0039';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0039';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0039';
-- group
UPDATE litters SET breeder_id = 'seed-signature-puppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-13-2026' AND breeder_id <> 'seed-signature-puppies';
UPDATE puppies SET breeder_id = 'seed-signature-puppies', litter_id = 'seed-l-responsibledogbreeder-com-may-13-2026', breeder_url = 'https://responsibledogbreeder.com/signature-puppies/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0033' AND breeder_id <> 'seed-signature-puppies'; -- bingo-pomeranian: printed address
UPDATE photos SET breeder_id = 'seed-signature-puppies' WHERE puppy_id = 'seed-p-0033';
UPDATE puppy_videos SET breeder_id = 'seed-signature-puppies' WHERE puppy_id = 'seed-p-0033';
UPDATE listing_reports SET breeder_id = 'seed-signature-puppies' WHERE puppy_id = 'seed-p-0033';
UPDATE puppies SET breeder_id = 'seed-signature-puppies', litter_id = 'seed-l-responsibledogbreeder-com-may-13-2026', breeder_url = 'https://responsibledogbreeder.com/signature-puppies/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0040' AND breeder_id <> 'seed-signature-puppies'; -- bluey-pomeranian: printed address
UPDATE photos SET breeder_id = 'seed-signature-puppies' WHERE puppy_id = 'seed-p-0040';
UPDATE puppy_videos SET breeder_id = 'seed-signature-puppies' WHERE puppy_id = 'seed-p-0040';
UPDATE listing_reports SET breeder_id = 'seed-signature-puppies' WHERE puppy_id = 'seed-p-0040';
-- group
UPDATE litters SET breeder_id = 'seed-preciouspawscompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-21-2026' AND breeder_id <> 'seed-preciouspawscompanions';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0035' AND breeder_id <> 'seed-preciouspawscompanions'; -- biscuit-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0035';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0035';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0035';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0044' AND breeder_id <> 'seed-preciouspawscompanions'; -- bramble-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0044';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0044';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0044';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0090' AND breeder_id <> 'seed-preciouspawscompanions'; -- eclair-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0090';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0090';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0090';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0099' AND breeder_id <> 'seed-preciouspawscompanions'; -- flora-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0099';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0099';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0099';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0129' AND breeder_id <> 'seed-preciouspawscompanions'; -- jasmine-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0129';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0129';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0129';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0178' AND breeder_id <> 'seed-preciouspawscompanions'; -- macaron-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0178';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0178';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0178';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0204' AND breeder_id <> 'seed-preciouspawscompanions'; -- orchid-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0204';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0204';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0204';
UPDATE puppies SET breeder_id = 'seed-preciouspawscompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-21-2026', breeder_url = 'https://www.preciouspawscompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0260' AND breeder_id <> 'seed-preciouspawscompanions'; -- trifle-mini-aussiedoodle: printed address
UPDATE photos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0260';
UPDATE puppy_videos SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0260';
UPDATE listing_reports SET breeder_id = 'seed-preciouspawscompanions' WHERE puppy_id = 'seed-p-0260';
-- group
UPDATE litters SET breeder_id = 'seed-marlorhomesteadcompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-25-2026' AND breeder_id <> 'seed-marlorhomesteadcompanions';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-25-2026', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0051' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- bubbles-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0051';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0051';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0051';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-25-2026', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0243' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- scott-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0243';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0243';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0243';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-25-2026', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0248' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- spencer-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0248';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0248';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0248';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-25-2026', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0264' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- vanilla-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0264';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0264';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0264';
-- group
UPDATE litters SET breeder_id = 'seed-doubleyypuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-19-2026' AND breeder_id <> 'seed-doubleyypuppies';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-19-2026', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0058' AND breeder_id <> 'seed-doubleyypuppies'; -- casey-teddy-bear-shihchon: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0058';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0058';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0058';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-19-2026', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0061' AND breeder_id <> 'seed-doubleyypuppies'; -- chad-teddy-bear-shihchon: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0061';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0061';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0061';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-19-2026', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0069' AND breeder_id <> 'seed-doubleyypuppies'; -- cindy-teddy-bear-shihchon: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0069';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0069';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0069';
-- group
UPDATE litters SET breeder_id = 'seed-kingsfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-1-2026' AND breeder_id <> 'seed-kingsfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-kingsfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-1-2026', breeder_url = 'https://www.kingsfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0059' AND breeder_id <> 'seed-kingsfamilycompanions'; -- cassie-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0059';
UPDATE puppy_videos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0059';
UPDATE listing_reports SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0059';
UPDATE puppies SET breeder_id = 'seed-kingsfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-1-2026', breeder_url = 'https://www.kingsfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0063' AND breeder_id <> 'seed-kingsfamilycompanions'; -- charlie-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0063';
UPDATE puppy_videos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0063';
UPDATE listing_reports SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0063';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9', 'seed-tmcountrysidek9', 'breed-great-dane', '2026-07-29', '2026-09-24', NULL, NULL, NULL, NULL, 'responsibledogbreeder-com-july-29-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0060' AND breeder_id <> 'seed-tmcountrysidek9'; -- celestia-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0060';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0060';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0060';
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', litter_id = 'seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0065' AND breeder_id <> 'seed-tmcountrysidek9'; -- cherish-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0065';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0065';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0065';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-peacefulpawspuppies-com-july-18-2026--sunsetpawbabies', 'seed-sunsetpawbabies', 'breed-cavalier-king-charles-spaniel', '2026-07-18', '2026-09-27', NULL, NULL, NULL, NULL, 'peacefulpawspuppies-com-july-18-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-sunsetpawbabies', litter_id = 'seed-l-peacefulpawspuppies-com-july-18-2026--sunsetpawbabies', breeder_url = 'https://www.sunsetpawbabies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0139' AND breeder_id <> 'seed-sunsetpawbabies'; -- joshua-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-sunsetpawbabies' WHERE puppy_id = 'seed-p-0139';
UPDATE puppy_videos SET breeder_id = 'seed-sunsetpawbabies' WHERE puppy_id = 'seed-p-0139';
UPDATE listing_reports SET breeder_id = 'seed-sunsetpawbabies' WHERE puppy_id = 'seed-p-0139';
-- group
UPDATE litters SET breeder_id = 'seed-sweetpuppypaws', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-coco-labrador-retriever' AND breeder_id <> 'seed-sweetpuppypaws';
UPDATE puppies SET breeder_id = 'seed-sweetpuppypaws', litter_id = 'seed-l-solo-coco-labrador-retriever', breeder_url = 'https://www.sweetpuppypaws.net', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0070' AND breeder_id <> 'seed-sweetpuppypaws'; -- coco-labrador-retriever: printed address
UPDATE photos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0070';
UPDATE puppy_videos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0070';
UPDATE listing_reports SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0070';
-- group
UPDATE litters SET breeder_id = 'seed-kingsfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-cocoa-boston-terrier' AND breeder_id <> 'seed-kingsfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-kingsfamilycompanions', litter_id = 'seed-l-solo-cocoa-boston-terrier', breeder_url = 'https://www.kingsfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0071' AND breeder_id <> 'seed-kingsfamilycompanions'; -- cocoa-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0071';
UPDATE puppy_videos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0071';
UPDATE listing_reports SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0071';
-- group
UPDATE litters SET breeder_id = 'seed-little-paws-canine', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-august-24-2026' AND breeder_id <> 'seed-little-paws-canine';
UPDATE puppies SET breeder_id = 'seed-little-paws-canine', litter_id = 'seed-l-responsibledogbreeder-com-august-24-2026', breeder_url = 'https://responsibledogbreeder.com/little-paws-canine/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0077' AND breeder_id <> 'seed-little-paws-canine'; -- cosette-papillon: printed address
UPDATE photos SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0077';
UPDATE puppy_videos SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0077';
UPDATE listing_reports SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0077';
UPDATE puppies SET breeder_id = 'seed-little-paws-canine', litter_id = 'seed-l-responsibledogbreeder-com-august-24-2026', breeder_url = 'https://responsibledogbreeder.com/little-paws-canine/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0166' AND breeder_id <> 'seed-little-paws-canine'; -- leon-papillon-1: printed address
UPDATE photos SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0166';
UPDATE puppy_videos SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0166';
UPDATE listing_reports SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0166';
UPDATE puppies SET breeder_id = 'seed-little-paws-canine', litter_id = 'seed-l-responsibledogbreeder-com-august-24-2026', breeder_url = 'https://responsibledogbreeder.com/little-paws-canine/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0237' AND breeder_id <> 'seed-little-paws-canine'; -- romeo-papillon: printed address
UPDATE photos SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0237';
UPDATE puppy_videos SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0237';
UPDATE listing_reports SET breeder_id = 'seed-little-paws-canine' WHERE puppy_id = 'seed-p-0237';
-- group
UPDATE litters SET breeder_id = 'seed-duane-borkholder', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-18-2026' AND breeder_id <> 'seed-duane-borkholder';
UPDATE puppies SET breeder_id = 'seed-duane-borkholder', litter_id = 'seed-l-responsibledogbreeder-com-july-18-2026', breeder_url = 'https://responsibledogbreeder.com/duane-borkholder/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0079' AND breeder_id <> 'seed-duane-borkholder'; -- curly-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0079';
UPDATE puppy_videos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0079';
UPDATE listing_reports SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0079';
UPDATE puppies SET breeder_id = 'seed-duane-borkholder', litter_id = 'seed-l-responsibledogbreeder-com-july-18-2026', breeder_url = 'https://responsibledogbreeder.com/duane-borkholder/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0195' AND breeder_id <> 'seed-duane-borkholder'; -- moe-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0195';
UPDATE puppy_videos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0195';
UPDATE listing_reports SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0195';
UPDATE puppies SET breeder_id = 'seed-duane-borkholder', litter_id = 'seed-l-responsibledogbreeder-com-july-18-2026', breeder_url = 'https://responsibledogbreeder.com/duane-borkholder/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0233' AND breeder_id <> 'seed-duane-borkholder'; -- ricky-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0233';
UPDATE puppy_videos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0233';
UPDATE listing_reports SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0233';
UPDATE puppies SET breeder_id = 'seed-duane-borkholder', litter_id = 'seed-l-responsibledogbreeder-com-july-18-2026', breeder_url = 'https://responsibledogbreeder.com/duane-borkholder/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0235' AND breeder_id <> 'seed-duane-borkholder'; -- riley-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0235';
UPDATE puppy_videos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0235';
UPDATE listing_reports SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id = 'seed-p-0235';
-- group
UPDATE litters SET breeder_id = 'seed-doubleyypuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-1-2026' AND breeder_id <> 'seed-doubleyypuppies';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-peacefulpawspuppies-com-may-1-2026', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0082' AND breeder_id <> 'seed-doubleyypuppies'; -- dandy-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0082';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0082';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0082';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-peacefulpawspuppies-com-may-1-2026', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0240' AND breeder_id <> 'seed-doubleyypuppies'; -- rusty-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0240';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0240';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0240';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-peacefulpawspuppies-com-may-1-2026', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0263' AND breeder_id <> 'seed-doubleyypuppies'; -- tulip-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0263';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0263';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0263';
-- group
UPDATE litters SET breeder_id = 'seed-willowlanebulldogs', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-june-17-2026' AND breeder_id <> 'seed-willowlanebulldogs';
UPDATE puppies SET breeder_id = 'seed-willowlanebulldogs', litter_id = 'seed-l-responsibledogbreeder-com-june-17-2026', breeder_url = 'https://responsibledogbreeder.com/willow-lane-bulldogs/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0085' AND breeder_id <> 'seed-willowlanebulldogs'; -- delsie-victorian-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0085';
UPDATE puppy_videos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0085';
UPDATE listing_reports SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0085';
UPDATE puppies SET breeder_id = 'seed-willowlanebulldogs', litter_id = 'seed-l-responsibledogbreeder-com-june-17-2026', breeder_url = 'https://responsibledogbreeder.com/willow-lane-bulldogs/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0088' AND breeder_id <> 'seed-willowlanebulldogs'; -- dream-victorian-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0088';
UPDATE puppy_videos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0088';
UPDATE listing_reports SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0088';
UPDATE puppies SET breeder_id = 'seed-willowlanebulldogs', litter_id = 'seed-l-responsibledogbreeder-com-june-17-2026', breeder_url = 'https://responsibledogbreeder.com/willow-lane-bulldogs/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0089' AND breeder_id <> 'seed-willowlanebulldogs'; -- duke-victorian-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0089';
UPDATE puppy_videos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0089';
UPDATE listing_reports SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0089';
-- group
UPDATE litters SET breeder_id = 'seed-rollingacresfarmpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-dixon-toy-poodle' AND breeder_id <> 'seed-rollingacresfarmpuppies';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-solo-dixon-toy-poodle', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0086' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- dixon-toy-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0086';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0086';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0086';
-- group
UPDATE litters SET breeder_id = 'seed-kingdomfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-elowen-doberman-pinscher' AND breeder_id <> 'seed-kingdomfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-kingdomfamilycompanions', litter_id = 'seed-l-solo-elowen-doberman-pinscher', breeder_url = 'https://www.kingdomfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0093' AND breeder_id <> 'seed-kingdomfamilycompanions'; -- elowen-doberman-pinscher: Alex's answer, and the listing's printed address
UPDATE photos SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0093';
UPDATE puppy_videos SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0093';
UPDATE listing_reports SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0093';
-- group
UPDATE litters SET breeder_id = 'seed-teapup', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-emerald-cavapoo' AND breeder_id <> 'seed-teapup';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-solo-emerald-cavapoo', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0094' AND breeder_id <> 'seed-teapup'; -- emerald-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0094';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0094';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0094';
-- group
UPDATE litters SET breeder_id = 'seed-pleasantviewpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-13-2026' AND breeder_id <> 'seed-pleasantviewpuppies';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-13-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0095' AND breeder_id <> 'seed-pleasantviewpuppies'; -- everest-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0095';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0095';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0095';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-13-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0234' AND breeder_id <> 'seed-pleasantviewpuppies'; -- ridge-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0234';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0234';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0234';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-august-13-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0251' AND breeder_id <> 'seed-pleasantviewpuppies'; -- summit-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0251';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0251';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0251';
-- group
UPDATE litters SET breeder_id = 'seed-riverdale-paw-pals', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-garrett-miniature-dachshund' AND breeder_id <> 'seed-riverdale-paw-pals';
UPDATE puppies SET breeder_id = 'seed-riverdale-paw-pals', litter_id = 'seed-l-solo-garrett-miniature-dachshund', breeder_url = 'https://responsibledogbreeder.com/riverdale-paw-pals/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0104' AND breeder_id <> 'seed-riverdale-paw-pals'; -- garrett-miniature-dachshund: printed address
UPDATE photos SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0104';
UPDATE puppy_videos SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0104';
UPDATE listing_reports SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0104';
-- group
UPDATE litters SET breeder_id = 'seed-rollingacresfarmpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-23-2025' AND breeder_id <> 'seed-rollingacresfarmpuppies';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-february-23-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0106' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- gavin-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0106';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0106';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0106';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-february-23-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0107' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- gaylord-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0107';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0107';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0107';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-february-23-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0111' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- gilman-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0111';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0111';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0111';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-february-23-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0115' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- graham-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0115';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0115';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0115';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-february-23-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0116' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- granite-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0116';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0116';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0116';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies', 'seed-wagging-tail-puppies', 'breed-cavalier-king-charles-spaniel', '2026-05-24', '2026-07-19', NULL, NULL, NULL, NULL, 'responsibledogbreeder-com-may-24-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-wagging-tail-puppies', litter_id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies', breeder_url = 'https://responsibledogbreeder.com/wagging-tail-puppies/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0114' AND breeder_id <> 'seed-wagging-tail-puppies'; -- grady-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0114';
UPDATE puppy_videos SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0114';
UPDATE listing_reports SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0114';
UPDATE puppies SET breeder_id = 'seed-wagging-tail-puppies', litter_id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies', breeder_url = 'https://responsibledogbreeder.com/wagging-tail-puppies/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0173' AND breeder_id <> 'seed-wagging-tail-puppies'; -- lincoln-cavalier-king-charles: printed address
UPDATE photos SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0173';
UPDATE puppy_videos SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0173';
UPDATE listing_reports SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0173';
UPDATE puppies SET breeder_id = 'seed-wagging-tail-puppies', litter_id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies', breeder_url = 'https://responsibledogbreeder.com/wagging-tail-puppies/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0174' AND breeder_id <> 'seed-wagging-tail-puppies'; -- loki-cavalier-king-charles: printed address
UPDATE photos SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0174';
UPDATE puppy_videos SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0174';
UPDATE listing_reports SET breeder_id = 'seed-wagging-tail-puppies' WHERE puppy_id = 'seed-p-0174';
-- group
UPDATE litters SET breeder_id = 'seed-cozy-pine-canine', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-herbie-cavapoo' AND breeder_id <> 'seed-cozy-pine-canine';
UPDATE puppies SET breeder_id = 'seed-cozy-pine-canine', litter_id = 'seed-l-solo-herbie-cavapoo', breeder_url = 'https://responsibledogbreeder.com/gerald-bontrager/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0122' AND breeder_id <> 'seed-cozy-pine-canine'; -- herbie-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-cozy-pine-canine' WHERE puppy_id = 'seed-p-0122';
UPDATE puppy_videos SET breeder_id = 'seed-cozy-pine-canine' WHERE puppy_id = 'seed-p-0122';
UPDATE listing_reports SET breeder_id = 'seed-cozy-pine-canine' WHERE puppy_id = 'seed-p-0122';
-- group
UPDATE litters SET breeder_id = 'seed-rollingacresfarmpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-6-2026' AND breeder_id <> 'seed-rollingacresfarmpuppies';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-6-2026', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0124' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- ian-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0124';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0124';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0124';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-6-2026', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0127' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- isaac-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0127';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0127';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0127';
-- group
UPDATE litters SET breeder_id = 'seed-teapup', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-21-2026' AND breeder_id <> 'seed-teapup';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-21-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0125' AND breeder_id <> 'seed-teapup'; -- illius-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0125';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0125';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0125';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-21-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0151' AND breeder_id <> 'seed-teapup'; -- kelsie-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0151';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0151';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0151';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-21-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0184' AND breeder_id <> 'seed-teapup'; -- matilda-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0184';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0184';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0184';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-21-2026', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0200' AND breeder_id <> 'seed-teapup'; -- noelle-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0200';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0200';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0200';
-- group
UPDATE litters SET breeder_id = 'seed-rollingacresfarmpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-8-2026' AND breeder_id <> 'seed-rollingacresfarmpuppies';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-8-2026', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0128' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- jamie-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0128';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0128';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0128';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-8-2026', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0134' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- jewel-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0134';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0134';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0134';
-- group
UPDATE litters SET breeder_id = 'seed-teapup', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-jasper-miniature-schnauzer' AND breeder_id <> 'seed-teapup';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-solo-jasper-miniature-schnauzer', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0130' AND breeder_id <> 'seed-teapup'; -- jasper-miniature-schnauzer: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0130';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0130';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0130';
-- group
UPDATE litters SET breeder_id = 'seed-kingsfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-8-2026' AND breeder_id <> 'seed-kingsfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-kingsfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-8-2026', breeder_url = 'https://www.kingsfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0136' AND breeder_id <> 'seed-kingsfamilycompanions'; -- jillian-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0136';
UPDATE puppy_videos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0136';
UPDATE listing_reports SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0136';
UPDATE puppies SET breeder_id = 'seed-kingsfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-august-8-2026', breeder_url = 'https://www.kingsfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0143' AND breeder_id <> 'seed-kingsfamilycompanions'; -- jules-boston-terrier: printed address
UPDATE photos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0143';
UPDATE puppy_videos SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0143';
UPDATE listing_reports SET breeder_id = 'seed-kingsfamilycompanions' WHERE puppy_id = 'seed-p-0143';
-- group
UPDATE litters SET breeder_id = 'seed-tyler-eileen-martin', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-josie-pembroke-welsh-corgi' AND breeder_id <> 'seed-tyler-eileen-martin';
UPDATE puppies SET breeder_id = 'seed-tyler-eileen-martin', litter_id = 'seed-l-solo-josie-pembroke-welsh-corgi', breeder_url = 'https://responsibledogbreeder.com/tyler-eileen-martin/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0141' AND breeder_id <> 'seed-tyler-eileen-martin'; -- josie-pembroke-welsh-corgi: printed address
UPDATE photos SET breeder_id = 'seed-tyler-eileen-martin' WHERE puppy_id = 'seed-p-0141';
UPDATE puppy_videos SET breeder_id = 'seed-tyler-eileen-martin' WHERE puppy_id = 'seed-p-0141';
UPDATE listing_reports SET breeder_id = 'seed-tyler-eileen-martin' WHERE puppy_id = 'seed-p-0141';
-- group
UPDATE litters SET breeder_id = 'seed-johnny-miller', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-juliet-french-bulldog' AND breeder_id <> 'seed-johnny-miller';
UPDATE puppies SET breeder_id = 'seed-johnny-miller', litter_id = 'seed-l-solo-juliet-french-bulldog', breeder_url = 'https://responsibledogbreeder.com/johnny-miller/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0144' AND breeder_id <> 'seed-johnny-miller'; -- juliet-french-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0144';
UPDATE puppy_videos SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0144';
UPDATE listing_reports SET breeder_id = 'seed-johnny-miller' WHERE puppy_id = 'seed-p-0144';
-- group
UPDATE litters SET breeder_id = 'seed-countryview-pets', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-march-8-2026' AND breeder_id <> 'seed-countryview-pets';
UPDATE puppies SET breeder_id = 'seed-countryview-pets', litter_id = 'seed-l-responsibledogbreeder-com-march-8-2026', breeder_url = 'https://responsibledogbreeder.com/countryview-pets/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0145' AND breeder_id <> 'seed-countryview-pets'; -- junior-yorkshire-terrier: printed address
UPDATE photos SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0145';
UPDATE puppy_videos SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0145';
UPDATE listing_reports SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0145';
UPDATE puppies SET breeder_id = 'seed-countryview-pets', litter_id = 'seed-l-responsibledogbreeder-com-march-8-2026', breeder_url = 'https://responsibledogbreeder.com/countryview-pets/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0176' AND breeder_id <> 'seed-countryview-pets'; -- lucy-yorkshire-terrier: printed address
UPDATE photos SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0176';
UPDATE puppy_videos SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0176';
UPDATE listing_reports SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0176';
UPDATE puppies SET breeder_id = 'seed-countryview-pets', litter_id = 'seed-l-responsibledogbreeder-com-march-8-2026', breeder_url = 'https://responsibledogbreeder.com/countryview-pets/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0255' AND breeder_id <> 'seed-countryview-pets'; -- teddy-yorkshire-terrier: printed address
UPDATE photos SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0255';
UPDATE puppy_videos SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0255';
UPDATE listing_reports SET breeder_id = 'seed-countryview-pets' WHERE puppy_id = 'seed-p-0255';
-- group
UPDATE litters SET breeder_id = 'seed-rollingacresfarmpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-16-2025' AND breeder_id <> 'seed-rollingacresfarmpuppies';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-16-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0146' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- kade-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0146';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0146';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0146';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-16-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0148' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- kase-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0148';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0148';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0148';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-16-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0149' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- kaylin-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0149';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0149';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0149';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-16-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0155' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- kolton-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0155';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0155';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0155';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-16-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0156' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- krystal-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0156';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0156';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0156';
UPDATE puppies SET breeder_id = 'seed-rollingacresfarmpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-16-2025', breeder_url = 'https://www.rollingacresfarmpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0157' AND breeder_id <> 'seed-rollingacresfarmpuppies'; -- kyla-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0157';
UPDATE puppy_videos SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0157';
UPDATE listing_reports SET breeder_id = 'seed-rollingacresfarmpuppies' WHERE puppy_id = 'seed-p-0157';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-peacefulpawspuppies-com-february-8-2026--teapup', 'seed-teapup', 'breed-cavalier-king-charles-spaniel', '2026-02-08', '2026-04-08', NULL, NULL, NULL, NULL, 'peacefulpawspuppies-com-february-8-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-8-2026--teapup', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0150' AND breeder_id <> 'seed-teapup'; -- keanu-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0150';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0150';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0150';
UPDATE puppies SET breeder_id = 'seed-teapup', litter_id = 'seed-l-peacefulpawspuppies-com-february-8-2026--teapup', breeder_url = 'https://www.teapup.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0153' AND breeder_id <> 'seed-teapup'; -- khalil-cavalier-king-charles-spaniel: printed address
UPDATE photos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0153';
UPDATE puppy_videos SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0153';
UPDATE listing_reports SET breeder_id = 'seed-teapup' WHERE puppy_id = 'seed-p-0153';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions', 'seed-cuddlyfamilycompanions', 'breed-miniature-schnauzer', '2026-05-17', '2026-07-12', NULL, NULL, NULL, NULL, 'peacefulpawspuppies-com-may-17-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0152' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- kenneth-miniature-schnauzer: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0152';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0152';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0152';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0209' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- parker-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0209';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0209';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0209';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0210' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- patches-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0210';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0210';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0210';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0211' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- patience-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0211';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0211';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0211';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0214' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- pearl-great-dane: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0214';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0214';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0214';
-- group
UPDATE litters SET breeder_id = 'seed-cuddlyfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-27-2026' AND breeder_id <> 'seed-cuddlyfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-27-2026', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0158' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- lamar-miniature-schnauzer: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0158';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0158';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0158';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-27-2026', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0163' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- leanna-miniature-schnauzer: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0163';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0163';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0163';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-27-2026', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0171' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- lilac-miniature-schnauzer: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0171';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0171';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0171';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-may-27-2026', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0172' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- lily-miniature-schnauzer: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0172';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0172';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0172';
-- group
UPDATE litters SET breeder_id = 'seed-maplelanepets', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-leon-papillon' AND breeder_id <> 'seed-maplelanepets';
UPDATE puppies SET breeder_id = 'seed-maplelanepets', litter_id = 'seed-l-solo-leon-papillon', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0165' AND breeder_id <> 'seed-maplelanepets'; -- leon-papillon: printed address
UPDATE photos SET breeder_id = 'seed-maplelanepets' WHERE puppy_id = 'seed-p-0165';
UPDATE puppy_videos SET breeder_id = 'seed-maplelanepets' WHERE puppy_id = 'seed-p-0165';
UPDATE listing_reports SET breeder_id = 'seed-maplelanepets' WHERE puppy_id = 'seed-p-0165';
-- group
UPDATE litters SET breeder_id = 'seed-sunsetpawbabies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-lexi-f1b-mini-goldendoodle' AND breeder_id <> 'seed-sunsetpawbabies';
UPDATE puppies SET breeder_id = 'seed-sunsetpawbabies', litter_id = 'seed-l-solo-lexi-f1b-mini-goldendoodle', breeder_url = 'https://www.sunsetpawbabies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0169' AND breeder_id <> 'seed-sunsetpawbabies'; -- lexi-f1b-mini-goldendoodle: printed address
UPDATE photos SET breeder_id = 'seed-sunsetpawbabies' WHERE puppy_id = 'seed-p-0169';
UPDATE puppy_videos SET breeder_id = 'seed-sunsetpawbabies' WHERE puppy_id = 'seed-p-0169';
UPDATE listing_reports SET breeder_id = 'seed-sunsetpawbabies' WHERE puppy_id = 'seed-p-0169';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions', 'seed-cuddlyfamilycompanions', 'breed-cavalier-king-charles-spaniel', '2026-06-04', '2026-07-30', NULL, NULL, NULL, NULL, 'peacefulpawspuppies-com-june-4-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0227' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- queenie-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0227';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0227';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0227';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0229' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- quigly-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0229';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0229';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0229';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0230' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- quincy-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0230';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0230';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0230';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0232' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- quinton-shih-tzu: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0232';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0232';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0232';
-- group
UPDATE litters SET breeder_id = 'seed-familyaffairpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-madonna-cavapoo' AND breeder_id <> 'seed-familyaffairpuppies';
UPDATE puppies SET breeder_id = 'seed-familyaffairpuppies', litter_id = 'seed-l-solo-madonna-cavapoo', breeder_url = 'https://www.familyaffairpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0179' AND breeder_id <> 'seed-familyaffairpuppies'; -- madonna-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0179';
UPDATE puppy_videos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0179';
UPDATE listing_reports SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0179';
-- group
UPDATE litters SET breeder_id = 'seed-kingdomfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-malcolm-doberman-pinscher' AND breeder_id <> 'seed-kingdomfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-kingdomfamilycompanions', litter_id = 'seed-l-solo-malcolm-doberman-pinscher', breeder_url = 'https://www.kingdomfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0181' AND breeder_id <> 'seed-kingdomfamilycompanions'; -- malcolm-doberman-pinscher: Alex's answer, and the listing's printed address
UPDATE photos SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0181';
UPDATE puppy_videos SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0181';
UPDATE listing_reports SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0181';
-- group
UPDATE litters SET breeder_id = 'seed-goldpawcanine', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-september-2-2026' AND breeder_id <> 'seed-goldpawcanine';
UPDATE puppies SET breeder_id = 'seed-goldpawcanine', litter_id = 'seed-l-peacefulpawspuppies-com-september-2-2026', breeder_url = 'https://www.goldpawcanine.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0183' AND breeder_id <> 'seed-goldpawcanine'; -- marine-rue-english-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0183';
UPDATE puppy_videos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0183';
UPDATE listing_reports SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0183';
UPDATE puppies SET breeder_id = 'seed-goldpawcanine', litter_id = 'seed-l-peacefulpawspuppies-com-september-2-2026', breeder_url = 'https://www.goldpawcanine.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0186' AND breeder_id <> 'seed-goldpawcanine'; -- matilda-rose-english-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0186';
UPDATE puppy_videos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0186';
UPDATE listing_reports SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0186';
UPDATE puppies SET breeder_id = 'seed-goldpawcanine', litter_id = 'seed-l-peacefulpawspuppies-com-september-2-2026', breeder_url = 'https://www.goldpawcanine.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0222' AND breeder_id <> 'seed-goldpawcanine'; -- piper-lou-english-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0222';
UPDATE puppy_videos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0222';
UPDATE listing_reports SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0222';
UPDATE puppies SET breeder_id = 'seed-goldpawcanine', litter_id = 'seed-l-peacefulpawspuppies-com-september-2-2026', breeder_url = 'https://www.goldpawcanine.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0241' AND breeder_id <> 'seed-goldpawcanine'; -- sabrina-jane-english-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0241';
UPDATE puppy_videos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0241';
UPDATE listing_reports SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0241';
UPDATE puppies SET breeder_id = 'seed-goldpawcanine', litter_id = 'seed-l-peacefulpawspuppies-com-september-2-2026', breeder_url = 'https://www.goldpawcanine.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0273' AND breeder_id <> 'seed-goldpawcanine'; -- winnie-mae-english-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0273';
UPDATE puppy_videos SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0273';
UPDATE listing_reports SET breeder_id = 'seed-goldpawcanine' WHERE puppy_id = 'seed-p-0273';
-- group
UPDATE litters SET breeder_id = 'seed-pleasantviewpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-8-2026' AND breeder_id <> 'seed-pleasantviewpuppies';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-8-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0187' AND breeder_id <> 'seed-pleasantviewpuppies'; -- maya-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0187';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0187';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0187';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-8-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0189' AND breeder_id <> 'seed-pleasantviewpuppies'; -- mercedes-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0189';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0189';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0189';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-8-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0193' AND breeder_id <> 'seed-pleasantviewpuppies'; -- mingo-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0193';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0193';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0193';
UPDATE puppies SET breeder_id = 'seed-pleasantviewpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-june-8-2026', breeder_url = 'https://www.pleasantviewpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0196' AND breeder_id <> 'seed-pleasantviewpuppies'; -- mooney-mini-bernedoodle: printed address
UPDATE photos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0196';
UPDATE puppy_videos SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0196';
UPDATE listing_reports SET breeder_id = 'seed-pleasantviewpuppies' WHERE puppy_id = 'seed-p-0196';
-- group
UPDATE litters SET breeder_id = 'seed-familyaffairpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-mercy-cavapoo' AND breeder_id <> 'seed-familyaffairpuppies';
UPDATE puppies SET breeder_id = 'seed-familyaffairpuppies', litter_id = 'seed-l-solo-mercy-cavapoo', breeder_url = 'https://www.familyaffairpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0190' AND breeder_id <> 'seed-familyaffairpuppies'; -- mercy-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0190';
UPDATE puppy_videos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0190';
UPDATE listing_reports SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0190';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-responsibledogbreeder-com-september-6-2025--riverdale-paw-pals', 'seed-riverdale-paw-pals', 'breed-pembroke-welsh-corgi', '2025-09-06', '2025-11-01', NULL, NULL, NULL, NULL, 'responsibledogbreeder-com-september-6-2025', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-riverdale-paw-pals', litter_id = 'seed-l-responsibledogbreeder-com-september-6-2025--riverdale-paw-pals', breeder_url = 'https://responsibledogbreeder.com/riverdale-paw-pals/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0192' AND breeder_id <> 'seed-riverdale-paw-pals'; -- mila-pembroke-welsh-corgi: printed address
UPDATE photos SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0192';
UPDATE puppy_videos SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0192';
UPDATE listing_reports SET breeder_id = 'seed-riverdale-paw-pals' WHERE puppy_id = 'seed-p-0192';
-- group
UPDATE litters SET breeder_id = 'seed-familyaffairpuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-10-2026' AND breeder_id <> 'seed-familyaffairpuppies';
UPDATE puppies SET breeder_id = 'seed-familyaffairpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-10-2026', breeder_url = 'https://www.familyaffairpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0197' AND breeder_id <> 'seed-familyaffairpuppies'; -- nattie-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0197';
UPDATE puppy_videos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0197';
UPDATE listing_reports SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0197';
UPDATE puppies SET breeder_id = 'seed-familyaffairpuppies', litter_id = 'seed-l-peacefulpawspuppies-com-july-10-2026', breeder_url = 'https://www.familyaffairpuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0199' AND breeder_id <> 'seed-familyaffairpuppies'; -- nitro-cavapoo: printed address
UPDATE photos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0199';
UPDATE puppy_videos SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0199';
UPDATE listing_reports SET breeder_id = 'seed-familyaffairpuppies' WHERE puppy_id = 'seed-p-0199';
-- group
UPDATE litters SET breeder_id = 'seed-cuddlyfamilycompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-nicole-yorkshire-terrier' AND breeder_id <> 'seed-cuddlyfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-cuddlyfamilycompanions', litter_id = 'seed-l-solo-nicole-yorkshire-terrier', breeder_url = 'https://www.cuddlyfamilycompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0198' AND breeder_id <> 'seed-cuddlyfamilycompanions'; -- nicole-yorkshire-terrier: printed address
UPDATE photos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0198';
UPDATE puppy_videos SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0198';
UPDATE listing_reports SET breeder_id = 'seed-cuddlyfamilycompanions' WHERE puppy_id = 'seed-p-0198';
-- group
UPDATE litters SET breeder_id = 'seed-ibarcaninecompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-peanut-miniature-dachshund' AND breeder_id <> 'seed-ibarcaninecompanions';
UPDATE puppies SET breeder_id = 'seed-ibarcaninecompanions', litter_id = 'seed-l-solo-peanut-miniature-dachshund', breeder_url = 'https://www.ibarcaninecompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0213' AND breeder_id <> 'seed-ibarcaninecompanions'; -- peanut-miniature-dachshund: printed address
UPDATE photos SET breeder_id = 'seed-ibarcaninecompanions' WHERE puppy_id = 'seed-p-0213';
UPDATE puppy_videos SET breeder_id = 'seed-ibarcaninecompanions' WHERE puppy_id = 'seed-p-0213';
UPDATE listing_reports SET breeder_id = 'seed-ibarcaninecompanions' WHERE puppy_id = 'seed-p-0213';
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, archived_at, legacy_id, created_at, updated_at, version)
  VALUES ('seed-l-peacefulpawspuppies-com-april-1-2026--sweetpuppypaws', 'seed-sweetpuppypaws', 'breed-labrador-retriever', '2026-04-01', '2026-05-25', NULL, NULL, NULL, NULL, 'peacefulpawspuppies-com-april-1-2026', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z', 1);
UPDATE puppies SET breeder_id = 'seed-sweetpuppypaws', litter_id = 'seed-l-peacefulpawspuppies-com-april-1-2026--sweetpuppypaws', breeder_url = 'https://www.sweetpuppypaws.net', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0221' AND breeder_id <> 'seed-sweetpuppypaws'; -- phineas-labrador-retriever: printed address
UPDATE photos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0221';
UPDATE puppy_videos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0221';
UPDATE listing_reports SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0221';
UPDATE puppies SET breeder_id = 'seed-sweetpuppypaws', litter_id = 'seed-l-peacefulpawspuppies-com-april-1-2026--sweetpuppypaws', breeder_url = 'https://www.sweetpuppypaws.net', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0265' AND breeder_id <> 'seed-sweetpuppypaws'; -- wanda-labrador-retriever: printed address
UPDATE photos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0265';
UPDATE puppy_videos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0265';
UPDATE listing_reports SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0265';
UPDATE puppies SET breeder_id = 'seed-sweetpuppypaws', litter_id = 'seed-l-peacefulpawspuppies-com-april-1-2026--sweetpuppypaws', breeder_url = 'https://www.sweetpuppypaws.net', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0269' AND breeder_id <> 'seed-sweetpuppypaws'; -- whitney-labrador-retriever: printed address
UPDATE photos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0269';
UPDATE puppy_videos SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0269';
UPDATE listing_reports SET breeder_id = 'seed-sweetpuppypaws' WHERE puppy_id = 'seed-p-0269';
-- group
UPDATE litters SET breeder_id = 'seed-willowlanebulldogs', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-splendor-victorian-bulldog' AND breeder_id <> 'seed-willowlanebulldogs';
UPDATE puppies SET breeder_id = 'seed-willowlanebulldogs', litter_id = 'seed-l-solo-splendor-victorian-bulldog', breeder_url = 'https://responsibledogbreeder.com/willow-lane-bulldogs/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0249' AND breeder_id <> 'seed-willowlanebulldogs'; -- splendor-victorian-bulldog: printed address
UPDATE photos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0249';
UPDATE puppy_videos SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0249';
UPDATE listing_reports SET breeder_id = 'seed-willowlanebulldogs' WHERE puppy_id = 'seed-p-0249';
-- group
UPDATE litters SET breeder_id = 'seed-marlorhomesteadcompanions', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-cornerstone-sunny' AND breeder_id <> 'seed-marlorhomesteadcompanions';
UPDATE puppies SET breeder_id = 'seed-marlorhomesteadcompanions', litter_id = 'seed-l-cornerstone-sunny', breeder_url = 'https://www.marlorhomesteadcompanions.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0252' AND breeder_id <> 'seed-marlorhomesteadcompanions'; -- sunny-cavalier-king-charles-spaniel-1: printed address
UPDATE photos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0252';
UPDATE puppy_videos SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0252';
UPDATE listing_reports SET breeder_id = 'seed-marlorhomesteadcompanions' WHERE puppy_id = 'seed-p-0252';
-- group
UPDATE litters SET breeder_id = 'seed-doubleyypuppies', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-tank-teddy-bear-shihchon' AND breeder_id <> 'seed-doubleyypuppies';
UPDATE puppies SET breeder_id = 'seed-doubleyypuppies', litter_id = 'seed-l-solo-tank-teddy-bear-shihchon', breeder_url = 'https://www.doubleyypuppies.com', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0253' AND breeder_id <> 'seed-doubleyypuppies'; -- tank-teddy-bear-shihchon: printed address
UPDATE photos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0253';
UPDATE puppy_videos SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0253';
UPDATE listing_reports SET breeder_id = 'seed-doubleyypuppies' WHERE puppy_id = 'seed-p-0253';
-- group
UPDATE litters SET breeder_id = 'seed-county-line-kennel', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-toast-mini-poodle' AND breeder_id <> 'seed-county-line-kennel';
UPDATE puppies SET breeder_id = 'seed-county-line-kennel', litter_id = 'seed-l-solo-toast-mini-poodle', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0258' AND breeder_id <> 'seed-county-line-kennel'; -- toast-mini-poodle: Amber's View breeder profile link
UPDATE photos SET breeder_id = 'seed-county-line-kennel' WHERE puppy_id = 'seed-p-0258';
UPDATE puppy_videos SET breeder_id = 'seed-county-line-kennel' WHERE puppy_id = 'seed-p-0258';
UPDATE listing_reports SET breeder_id = 'seed-county-line-kennel' WHERE puppy_id = 'seed-p-0258';
-- group
UPDATE litters SET breeder_id = 'seed-perfectmatchpoodles', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-14-2026' AND breeder_id <> 'seed-perfectmatchpoodles';
UPDATE puppies SET breeder_id = 'seed-perfectmatchpoodles', litter_id = 'seed-l-responsibledogbreeder-com-july-14-2026', breeder_url = 'https://responsibledogbreeder.com/perfect-match-poodles/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0266' AND breeder_id <> 'seed-perfectmatchpoodles'; -- watson-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0266';
UPDATE puppy_videos SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0266';
UPDATE listing_reports SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0266';
UPDATE puppies SET breeder_id = 'seed-perfectmatchpoodles', litter_id = 'seed-l-responsibledogbreeder-com-july-14-2026', breeder_url = 'https://responsibledogbreeder.com/perfect-match-poodles/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0270' AND breeder_id <> 'seed-perfectmatchpoodles'; -- whitney-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0270';
UPDATE puppy_videos SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0270';
UPDATE listing_reports SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0270';
UPDATE puppies SET breeder_id = 'seed-perfectmatchpoodles', litter_id = 'seed-l-responsibledogbreeder-com-july-14-2026', breeder_url = 'https://responsibledogbreeder.com/perfect-match-poodles/', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0271' AND breeder_id <> 'seed-perfectmatchpoodles'; -- wiley-miniature-poodle: printed address
UPDATE photos SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0271';
UPDATE puppy_videos SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0271';
UPDATE listing_reports SET breeder_id = 'seed-perfectmatchpoodles' WHERE puppy_id = 'seed-p-0271';
-- group
UPDATE litters SET breeder_id = 'seed-pawprintacres', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-l-solo-wendeline-saint-bernard' AND breeder_id <> 'seed-pawprintacres';
UPDATE puppies SET breeder_id = 'seed-pawprintacres', litter_id = 'seed-l-solo-wendeline-saint-bernard', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0268' AND breeder_id <> 'seed-pawprintacres'; -- wendeline-saint-bernard: printed address
UPDATE photos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0268';
UPDATE puppy_videos SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0268';
UPDATE listing_reports SET breeder_id = 'seed-pawprintacres' WHERE puppy_id = 'seed-p-0268';

-- Status and price from the live Wix listing. The placed_at triggers (migration 0019) stamp each puppy marked placed.
UPDATE puppies SET price_cents = 200000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0011' AND price_cents IS NOT 200000; -- apple-mini-bernedoodle, was 250000
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0022' AND price_cents IS NOT 250000; -- barley-mini-bernedoodle, was 300000
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0025' AND availability <> 'placed'; -- bella-cavapoo
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0042' AND availability <> 'placed'; -- boone-mini-bernedoodle
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0047' AND availability <> 'placed'; -- brian-cavalier-king-charles-spaniel
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0059' AND availability <> 'placed'; -- cassie-boston-terrier
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0065' AND availability <> 'placed'; -- cherish-great-dane
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0072' AND price_cents IS NOT 250000; -- colt-mini-bernedoodle, was 300000
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0076' AND price_cents IS NOT 250000; -- cornell-mini-bernedoodle, was 300000
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0095' AND price_cents IS NOT 250000; -- everest-mini-bernedoodle, was 300000
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0120' AND price_cents IS NOT 250000; -- harvest-mini-bernedoodle, was 300000
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0123' AND price_cents IS NOT 250000; -- huck-mini-bernedoodle, was 300000
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0151' AND availability <> 'placed'; -- kelsie-cavapoo
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0152' AND availability <> 'placed'; -- kenneth-miniature-schnauzer
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0158' AND availability <> 'placed'; -- lamar-miniature-schnauzer
UPDATE puppies SET price_cents = 250000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0182' AND price_cents IS NOT 250000; -- maple-mini-bernedoodle, was 300000
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0183' AND availability <> 'placed'; -- marine-rue-english-bulldog
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0190' AND availability <> 'placed'; -- mercy-cavapoo
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0229' AND availability <> 'placed'; -- quigly-shih-tzu
UPDATE puppies SET price_cents = 200000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0234' AND price_cents IS NOT 200000; -- ridge-mini-bernedoodle, was 250000
UPDATE puppies SET price_cents = 200000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0251' AND price_cents IS NOT 200000; -- summit-mini-bernedoodle, was 250000
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0016' AND availability <> 'placed'; -- athena-havanese
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0038' AND availability <> 'placed'; -- blitz-havanese
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0043' AND availability <> 'placed'; -- brady-bernese-mountain-dog
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0056' AND availability <> 'placed'; -- carrie-havanese
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0093' AND availability <> 'placed'; -- elowen-doberman-pinscher
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0096' AND availability <> 'placed'; -- fernando-havanese
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0097' AND availability <> 'placed'; -- finn-french-bulldog
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0105' AND availability <> 'placed'; -- gatsby-havanese
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0112' AND availability <> 'placed'; -- gnome-munchkin-bernedoodle
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0118' AND availability <> 'placed'; -- guther-toy-poodle
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0122' AND availability <> 'placed'; -- herbie-cavapoo
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0159' AND availability <> 'placed'; -- lanie-golden-retriever
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0216' AND availability <> 'placed'; -- penny-havanese
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0226' AND availability <> 'placed'; -- quartz-miniature-schnauzer
UPDATE puppies SET price_cents = 130000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0004' AND price_cents IS NOT 130000; -- amy-golden-retriever, was 150000
UPDATE puppies SET price_cents = 205000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0029' AND price_cents IS NOT 205000; -- berlioz-pomeranian, was 250000
UPDATE puppies SET price_cents = 130000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0137' AND price_cents IS NOT 130000; -- jo-golden-retriever, was 150000
UPDATE puppies SET price_cents = 205000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0154' AND price_cents IS NOT 205000; -- kibbles-pomeranian, was 250000
UPDATE puppies SET availability = 'pending', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0162' AND availability <> 'pending'; -- lawrence-golden-retriever
UPDATE puppies SET price_cents = 130000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0162' AND price_cents IS NOT 130000; -- lawrence-golden-retriever, was 150000
UPDATE puppies SET price_cents = 130000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0188' AND price_cents IS NOT 130000; -- meg-golden-retriever, was 150000
UPDATE puppies SET availability = 'pending', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0247' AND availability <> 'pending'; -- smurf-munchkin-bernedoodle
UPDATE puppies SET price_cents = 205000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0259' AND price_cents IS NOT 205000; -- toulouse-pomeranian, was 250000
UPDATE puppies SET price_cents = 125000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0001' AND price_cents IS NOT 125000; -- alexa-cocker-spaniel, was 150000
UPDATE puppies SET price_cents = 125000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0014' AND price_cents IS NOT 125000; -- ash-cocker-spaniel, was 150000
UPDATE puppies SET price_cents = 125000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0017' AND price_cents IS NOT 125000; -- atlas-cocker-spaniel, was 150000
UPDATE puppies SET price_cents = 100000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0032' AND price_cents IS NOT 100000; -- billy-boston-terrier, was 125000
UPDATE puppies SET price_cents = 120000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0176' AND price_cents IS NOT 120000; -- lucy-yorkshire-terrier, was 150000
UPDATE puppies SET price_cents = 100000, updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0268' AND price_cents IS NOT 100000; -- wendeline-saint-bernard, was 125000
UPDATE puppies SET availability = 'available', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0272' AND availability <> 'available'; -- winnie-havanese-1

-- Archives. 38 puppies are no longer in the live Wix store: still available or reserved here, under Peaceful Paws or the unassigned breeder, or adopted under the network with no text naming a kennel.
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0002' AND publication_state <> 'archived'; -- amelia-english-bulldog: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0028' AND publication_state <> 'archived'; -- benson-great-dane: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0031' AND publication_state <> 'archived'; -- beulah-great-dane: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0045' AND publication_state <> 'archived'; -- braxton-great-dane: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0048' AND publication_state <> 'archived'; -- brielle-great-dane: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0050' AND publication_state <> 'archived'; -- bryce-great-dane: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0052' AND publication_state <> 'archived'; -- buddy-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0053' AND publication_state <> 'archived'; -- buttons-munchkin-bernedoodle: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0055' AND publication_state <> 'archived'; -- cap-n-crunch-pembroke-welsh-corgi: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0064' AND publication_state <> 'archived'; -- cheerio-pembroke-welsh-corgi: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0067' AND publication_state <> 'archived'; -- chocolate-english-bulldog: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0068' AND publication_state <> 'archived'; -- christopher-cavalier-king-charles-spaniel: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0073' AND publication_state <> 'archived'; -- colton-great-dane: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0087' AND publication_state <> 'archived'; -- dottie-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0103' AND publication_state <> 'archived'; -- freddy-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0132' AND publication_state <> 'archived'; -- jericho-munchkin-bernedoodle: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0133' AND publication_state <> 'archived'; -- jerry-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0135' AND publication_state <> 'archived'; -- jewel-pembroke-welsh-corgi: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0142' AND publication_state <> 'archived'; -- joy-great-dane: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0147' AND publication_state <> 'archived'; -- kaiden-cavalier-king-charles-spaniel: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0164' AND publication_state <> 'archived'; -- leo-cavalier-king-charles-spaniel: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0167' AND publication_state <> 'archived'; -- leroy-cavalier-king-charles: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0175' AND publication_state <> 'archived'; -- loyal-cavalier-king-charles-spaniel: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0177' AND publication_state <> 'archived'; -- luna-cavalier-king-charles: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0194' AND publication_state <> 'archived'; -- miriam-pembroke-welsh-corgi: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0202' AND publication_state <> 'archived'; -- oakley-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0203' AND publication_state <> 'archived'; -- ollie-cavalier-king-charles-spaniel: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0207' AND publication_state <> 'archived'; -- pam-great-dane: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0208' AND publication_state <> 'archived'; -- pansy-great-dane: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0217' AND publication_state <> 'archived'; -- percival-labrador-retriever: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0218' AND publication_state <> 'archived'; -- percy-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0220' AND publication_state <> 'archived'; -- philip-great-dane: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0224' AND publication_state <> 'archived'; -- princess-cavalier-king-charles-spaniel: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0236' AND publication_state <> 'archived'; -- ripley-pembroke-welsh-corgi: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0239' AND publication_state <> 'archived'; -- rover-pembroke-welsh-corgi: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0246' AND publication_state <> 'archived'; -- skye-great-dane: gone from the live Wix store, and no text names its kennel
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0254' AND publication_state <> 'archived'; -- tanner-cavalier-king-charles-spaniel: gone from the live Wix store
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-p-0261' AND publication_state <> 'archived'; -- trix-pembroke-welsh-corgi: gone from the live Wix store

-- New listings. 30 live Wix listings staging did not have, added like the seeded puppies: comped, published, photos served from Wix until the photo move.
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-adel-cavapoo', 'seed-familyaffairpuppies', 'breed-cavapoo', '2026-08-11', '2026-10-06', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0274', 'seed-familyaffairpuppies', 'seed-l-solo-adel-cavapoo', 'adel-cavapoo', 'Adel', NULL, 300000, 60000,
  'Price - $3000Deposit - $600Birthdate- August 11, 2026Ready to go - October 6, 2026 Mom''s information weight: 19 pounds color: Dad''s information weight: 7 pounds color: Puppy''s color - apricot Raised with early enrichment and gentle handling, Adel is a apricot female Cavapoo puppy growing into a confident, well-adjusted companion. He receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. Our goal simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins her forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.familyaffairpuppies.comCall or Text: 260-350-4840', 'https://www.familyaffairpuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'adel-cavapoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0274-img0', 'seed-familyaffairpuppies', 'seed-p-0274', 'https://static.wixstatic.com/media/8d80ac_31a2c4cda46e4386a659d03278c9fbea~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0274-img1', 'seed-familyaffairpuppies', 'seed-p-0274', 'https://static.wixstatic.com/media/8d80ac_ff6477d4f645440e9404aadea6205de9~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0274-img2', 'seed-familyaffairpuppies', 'seed-p-0274', 'https://static.wixstatic.com/media/8d80ac_950b06c658a4407b83ee49d4936a3c61~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0274-img3', 'seed-familyaffairpuppies', 'seed-p-0274', 'https://static.wixstatic.com/media/8d80ac_670187360b5b4d3fade623cfa67016ef~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0274-img4', 'seed-familyaffairpuppies', 'seed-p-0274', 'https://static.wixstatic.com/media/8d80ac_c3817c9131094ef89f17851fbc97a206~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0274-img5', 'seed-familyaffairpuppies', 'seed-p-0274', 'https://static.wixstatic.com/media/8d80ac_84e7e0846955476b95b48fcf3f9b1db2~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-barnaby-mini-dachshund', 'seed-unassigned', 'breed-miniature-dachshund', '2026-09-05', '2026-10-31', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0275', 'seed-unassigned', 'seed-l-solo-barnaby-mini-dachshund', 'barnaby-mini-dachshund', 'Barnaby', NULL, 220000, 50000,
  'Price - $2200Deposit - $500Birthdate- September 5, 2026Ready to go - October 31, 2026 Dad''s weight- 14 poundsDad''s color- silver dapple Mom''s Weight- 12 poundsMom''s color- Chocolate and tan Puppy color- Chocolate and tan (long haired) We think Barnaby is so adorable! Don''t you agree!? He will make the perfect little companion and friend to his new family! He can''t wait to learn tricks and to show off his smarts to all your friends! Don''t miss out on adding this sweetheart to your family! Feel free to give us a call or text at 574-221-0326 anytime for more information about this cutie. We would love to hear from you! What I come home with: vaccination record Vet check small bag of food AKC Registration', NULL, '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'barnaby-mini-dachshund', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- no breeder named, so unassigned
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img0', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_9c8120e97f124fa9839b091def1a9861~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img1', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_66f3dd94bd2d49c59101a4f37cace496~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img2', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_a28bc2d5e41d4e02a700e4cfb9ae40c9~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img3', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_24477ea6030140ac904c452cc562053d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img4', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_1c411e3737d64b6bbc1cb8c14b90e122~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img5', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_c1990163855742daa0c47ad22c11998a~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img6', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_43da3d346cdc4ff9b528de0e3b234608~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0275-img7', 'seed-unassigned', 'seed-p-0275', 'https://static.wixstatic.com/media/8d80ac_fde30ce5c9384451a49dc6f706f5696d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-biscuit-havanese', 'seed-chainolakescompanions', 'breed-havanese', '2026-09-27', '2026-11-22', 12, 14, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0276', 'seed-chainolakescompanions', 'seed-l-solo-biscuit-havanese', 'biscuit-havanese', 'Biscuit', NULL, 240000, 60000,
  'Price - $2400Deposit - $600Birthdate- September 27, 2026Ready to go - November 22, 2026 Mom''s weight- 12lbscolor- chocolate Dad''s weight- 14lbscolor- black and white Oh Biscuit...what a darling boy! He makes it hard to not play favorites. We love everything about him, from his hilarious little grunts while stretching to those irresistibly gentle eyes. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before he joins his forever family. Please give us a call or check out our website for more information or to set up a time to meet him! ***This breed is hypoallergenic. Puppy''s color may change as it matures. What I come home with: Vaccination/Health Record AKC registration Examination by our vet Dew claws are removed Small bag of food Microchipped Breeding rights $500 Call/Text: 260-214-2113Email: adoptions@chainolakescompanions.comWebsite: www.chainolakescompanions.com', 'https://www.chainolakescompanions.com', '[]', 1,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'biscuit-havanese', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img0', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_dcf36c0e10a042919b0964886a8b4172~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img1', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_c0732356ca0c4482b06096706c0c6efa~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img2', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_2ebfc45a69ab4ed388232dde01904a55~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img3', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_4d243088e569439db16db8723d197fb4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img4', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_7df31a3bf72a49dbae3b6f43ef00ae91~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img5', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_4ba30160fa594478987a57c39da15375~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img6', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_f86dbbc6def9449bac65b1f70f836493~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img7', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_7eddc123cb92460a9fcb455563b67338~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img8', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/d5ac96_4010b880beda479ca7342c16bd1a2c19~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0276-img9', 'seed-chainolakescompanions', 'seed-p-0276', 'https://static.wixstatic.com/media/8d80ac_a48f613b52054ef48cf995e597e0e315~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-carmen-great-dane', 'seed-unassigned', 'breed-great-dane', '2026-07-29', '2026-09-23', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0277', 'seed-unassigned', 'seed-l-solo-carmen-great-dane', 'carmen-great-dane', 'Carmen', NULL, 107000, 50000,
  'Price - $1070Deposit - $500Birthdate- July 29, 2026Ready to go - September 23, 2026 Dad''s informationweight: 140 pounds height: 35 inches Color: Black MantleHealth: DNA tested as well as Genetically clear, he is OFA clear for hips and elbows. Mom''s information Weight: 130 pounds Color: Harlequin Health: OFA clear for hips Puppy''s color: harlequin Carmen is one beautiful girl with a matching personality! She enjoys lounging in the sun, going on walks with with her favorite people and getting lots of loving on! Carmen is being raised with daily interaction and intentional care to help her grow into a confident well socialized puppy! We''d love to hear from you if you are interested in bringing this sweetheart into your family! You can CALL Carmen''s breeder at 574-831-5857 for more information about her or if you''d like to set up time to come meet her! ***Carmen has a cloudy eye and a small umbilical hernia. What I come home with: one year health/genetic guarantee vaccination record check up and report from veterinarian AKC registration dew claws clipped microchipped small bag of food, blanket, and favorite toy.', NULL, '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'carmen-great-dane', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- no breeder named, so unassigned
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img0', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_8e82b31a4a984e718020e3bb68cfaa3e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img1', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_11c348b2b9534e66bcd952637a2b08c7~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img2', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_58a855192b9f4c0786dd17bcb9b22c0b~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img3', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_41793cce28ff482dac5b84bbfa21877bf002.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img4', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_161b7ac2947144009ec9a1a155215a98~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img5', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_440219c66c114672816679af5ebacee8~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img6', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_07f2ae86849c490eb92c9e4c38008313~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img7', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/8d80ac_9d5adc5c87194749b35558dbd8bf3307~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0277-img8', 'seed-unassigned', 'seed-p-0277', 'https://static.wixstatic.com/media/d5ac96_6979183ad44f4069aed4481ed8870bb3~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-echo-toy-poodle', 'seed-familyaffairpuppies', 'breed-toy-poodle', '2025-11-29', '2026-10-08', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0278', 'seed-familyaffairpuppies', 'seed-l-solo-echo-toy-poodle', 'echo-toy-poodle', 'Echo', NULL, 350000, 60000,
  'Price - $3500Deposit - $600Birthdate- November 29, 2025Ready to go - October 8, 2026 Mom''s information weight: 7 pounds color: apricot Dad''s information weight: 5 pounds color: red Puppy''s color - red Echo is a beautiful red boy with a happy, outgoing personality. He loves everyone he meets and has a naturally sweet, affectionate disposition. His mother is also a very loving dog, and Echo seems to have inherited that same people-loving nature. He’s a special little guy with both a beautiful color and a wonderful temperament.Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.familyaffairpuppies.comCall or Text: 260-350-4840', 'https://www.familyaffairpuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'echo-toy-poodle', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0278-img0', 'seed-familyaffairpuppies', 'seed-p-0278', 'https://static.wixstatic.com/media/8d80ac_95af5560d12949639db5eca205d366e3~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0278-img1', 'seed-familyaffairpuppies', 'seed-p-0278', 'https://static.wixstatic.com/media/8d80ac_fb19166f68454ed0859484a20506e389~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0278-img2', 'seed-familyaffairpuppies', 'seed-p-0278', 'https://static.wixstatic.com/media/8d80ac_0b1d069171654d1797870007b15f833c~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0278-img3', 'seed-familyaffairpuppies', 'seed-p-0278', 'https://static.wixstatic.com/media/8d80ac_084d713c6f9b4c289d769eae1dcafdb5~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0278-img4', 'seed-familyaffairpuppies', 'seed-p-0278', 'https://static.wixstatic.com/media/8d80ac_86e50a2f250f46a487e831038e7395c6~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0278-img5', 'seed-familyaffairpuppies', 'seed-p-0278', 'https://static.wixstatic.com/media/8d80ac_66e84c790694466b9a24c2256e4b7ece~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeds (id, slug, name) VALUES ('breed-shih-poo', 'shih-poo', 'Shih-poo');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-harold-shihpoo', 'seed-maplelanepets', 'breed-shih-poo', '2026-09-14', '2026-11-09', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0279', 'seed-maplelanepets', 'seed-l-solo-harold-shihpoo', 'harold-shihpoo', 'Harold', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- September 14, 2026Ready to go - November 9, 2026 Mom''s information weight: 8 pounds (Mini Poodle) color: apricot Dad''s information weight: 4 1/2 pounds (Imperial Shih Tzu) color: cream Puppy''s color - gold Meet Harold, an apricot male ShihPoo puppy raised with intentional care, early socialization, and daily interaction to support confidence and companionship. He receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. What I come home with: One year genetic health guarantee Vaccination/Health Record AKC registration (full registration/breeding rights are additional) Examination by our vet Microchipped Small bag of food Breeder''s website - https://responsibledogbreeder.com/lonnie-miller/Call or Text: 260-383-0995', 'https://responsibledogbreeder.com/lonnie-miller/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'harold-shihpoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img0', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_47f0ce2abed24eaf888c3801276833f6~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img1', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_0af5968e9e9d46d7a9e7be31208ceab5~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img2', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_69cd0b6c6e8d4e50ac4d5710ce20a02d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img3', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_b22d690f2f9345f8962ae85382665462~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img4', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_e4a39b899e9d4ce28aee50303a1b7262~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img5', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_b0b07f1bdecc48f3a203ba69df697dff~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img6', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_ebbfb76939424b88be62cfb13bd395a7~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img7', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_bf30ed8d857142d2844003c95acd3d07~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img8', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_2f00f313d5194a5089f343facdb9fde4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0279-img9', 'seed-maplelanepets', 'seed-p-0279', 'https://static.wixstatic.com/media/8d80ac_925b0e194f4b43abb880e83a7ab4f500~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-harriet-miniature-poodle', 'seed-perfectmatchpoodles', 'breed-miniature-poodle', NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0280', 'seed-perfectmatchpoodles', 'seed-l-solo-harriet-miniature-poodle', 'harriet-miniature-poodle', 'Harriet', NULL, 90000, 40000,
  'Price - $900Deposit - $400 Harriet is a beautiful 5 year old miniature poodle that is looking for her forever home! She is a very laid back girl who loves her routine. She is 12 pounds, is spayed and very nearly house and potty trained as well as fully leash and crate trained! Harriet will do the best in a calm and quiet environment where she can be pampered and loved on. She is used to being with other dogs and is gentle with children. She is located in Nappanee Indiana. We would love to have you come meet her! VIEW BREEDER PROFILEBreeder''s website- https://perfectmatchpoodles.com/Call or Text- 574-622-2774', 'https://perfectmatchpoodles.com/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'harriet-miniature-poodle', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img0', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_368c983722d543b496cea1e80017f5af~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img1', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_db671e115e3a4fb3ab7a7fa76b5153c8~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img2', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_3b2f15bd99bc464da8a3d2b3a020390d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img3', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_620063b68bd4433bbb5e429166f855d1~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img4', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_3262a70bcc804fc088504976d275c4e9~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img5', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_69d360ef2d824722ba0c8d6f5e751468~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img6', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_94e2b67bfb724971ae16e63d70ff8465~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0280-img7', 'seed-perfectmatchpoodles', 'seed-p-0280', 'https://static.wixstatic.com/media/8d80ac_1e0db67e8f2c40f5bff28b43fb6e6004~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-inez-cavapoo', 'seed-familyaffairpuppies', 'breed-cavapoo', '2026-08-11', '2026-10-06', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0281', 'seed-familyaffairpuppies', 'seed-l-solo-inez-cavapoo', 'inez-cavapoo', 'Inez', NULL, 300000, 60000,
  'Price - $3000Deposit - $600Birthdate- August 11, 2026Ready to go - October 6, 2026 Mom''s information weight: 19 pounds color: Dad''s information weight: 7 pounds color: Puppy''s color - apricot Raised with early enrichment and gentle handling, Inez is a apricot female Cavapoo puppy growing into a confident, well-adjusted companion. He receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. Our goal simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins her forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.familyaffairpuppies.comCall or Text: 260-350-4840', 'https://www.familyaffairpuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'inez-cavapoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0281-img0', 'seed-familyaffairpuppies', 'seed-p-0281', 'https://static.wixstatic.com/media/8d80ac_67f333b8db74406fb31781d4780bd4b0~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0281-img1', 'seed-familyaffairpuppies', 'seed-p-0281', 'https://static.wixstatic.com/media/8d80ac_74c0c9d4924148c29ba57f03d92e6e1a~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0281-img2', 'seed-familyaffairpuppies', 'seed-p-0281', 'https://static.wixstatic.com/media/8d80ac_2597f44d914e4ea8924f61f7c1b5e907~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0281-img3', 'seed-familyaffairpuppies', 'seed-p-0281', 'https://static.wixstatic.com/media/8d80ac_c3817c9131094ef89f17851fbc97a206~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0281-img4', 'seed-familyaffairpuppies', 'seed-p-0281', 'https://static.wixstatic.com/media/8d80ac_84e7e0846955476b95b48fcf3f9b1db2~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO breeds (id, slug, name) VALUES ('breed-maltese', 'maltese', 'Maltese');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-lacie-maltese', 'seed-pineacrespuppies', 'breed-maltese', '2026-09-15', '2026-11-24', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0282', 'seed-pineacrespuppies', 'seed-l-solo-lacie-maltese', 'lacie-maltese', 'Lacie', NULL, 220000, 60000,
  'Price - $2200Deposit - $600Birthdate- September 15, 2026Ready to go - November 24, 2026 Mom''s information weight: 9 pounds color: white Dad''s information weight: 6 pounds color: white Puppy''s color - white Lacie is a darling Maltese puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. She receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.pineacrespuppies.comCall or Text: 717-844-6902', 'https://www.pineacrespuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'lacie-maltese', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0282-img0', 'seed-pineacrespuppies', 'seed-p-0282', 'https://static.wixstatic.com/media/8d80ac_df24e3165f6144dfbffa2427390627c6~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0282-img1', 'seed-pineacrespuppies', 'seed-p-0282', 'https://static.wixstatic.com/media/8d80ac_3148800d013b447d98c77ff0714387be~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0282-img2', 'seed-pineacrespuppies', 'seed-p-0282', 'https://static.wixstatic.com/media/8d80ac_55c3b8732f2f4e99908165606bdbe3aa~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0282-img3', 'seed-pineacrespuppies', 'seed-p-0282', 'https://static.wixstatic.com/media/8d80ac_8be679cc92b045d4afdb6b7d761b2d8b~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-lavern-miniature-schnauzer', 'seed-cuddlyfamilycompanions', 'breed-miniature-schnauzer', '2026-05-27', '2026-07-22', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0283', 'seed-cuddlyfamilycompanions', 'seed-l-solo-lavern-miniature-schnauzer', 'lavern-miniature-schnauzer', 'Lavern', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- May 27, 2026Ready to go - July 22, 2026 Mom''s information weight: 18 pounds color: Dad''s information weight: 19 pounds color: Puppy''s color - salt and pepper Lavern is a male salt and pepper Miniature Schnauzer puppy raised in a hands-on family environment with thoughtful early development and daily interaction. He receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.cuddlyfamilycompanions.comCall or Text: 765-542-5688', 'https://www.cuddlyfamilycompanions.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'lavern-miniature-schnauzer', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img0', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_3f93edbd2c7e4dd0a177b397ffe26ce0~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img1', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_9a95e001524640e99481cf6d46d729c3~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img2', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_bd3da7637ad74fc1835a726cb2b927b9~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img3', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_cd0badd0216f4520aae7d377ab8012ed~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img4', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_3fec4e9cc2e34139a7b8ac413be7fce4~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img5', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_d958c0e3ee6f4af5a5f0df38a8817781~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img6', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_5b917de08deb4573be86eea6b5d8a665f002.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img7', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_967bc9edc3914130a498b4f41acfec8f~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0283-img8', 'seed-cuddlyfamilycompanions', 'seed-p-0283', 'https://static.wixstatic.com/media/8d80ac_be66c89dc31e4987afda786056d2926e~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-leo-maltese', 'seed-pineacrespuppies', 'breed-maltese', '2026-09-15', '2026-11-24', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0284', 'seed-pineacrespuppies', 'seed-l-solo-leo-maltese', 'leo-maltese', 'Leo', NULL, 195000, 60000,
  'Price - $1950Deposit - $600Birthdate- September 15, 2026Ready to go - November 24, 2026 Mom''s information weight: 9 pounds color: white Dad''s information weight: 6 pounds color: white Puppy''s color - white Leo is a darling Maltese puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. She receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.pineacrespuppies.comCall or Text: 717-844-6902', 'https://www.pineacrespuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'leo-maltese', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0284-img0', 'seed-pineacrespuppies', 'seed-p-0284', 'https://static.wixstatic.com/media/8d80ac_19975d327ca549c3b12bc3204d39d2b5~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0284-img1', 'seed-pineacrespuppies', 'seed-p-0284', 'https://static.wixstatic.com/media/8d80ac_5e36b091d3634b01bf2401df4aceb876~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0284-img2', 'seed-pineacrespuppies', 'seed-p-0284', 'https://static.wixstatic.com/media/8d80ac_90bd2a0c14014457a194c17ffa911742~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0284-img3', 'seed-pineacrespuppies', 'seed-p-0284', 'https://static.wixstatic.com/media/8d80ac_e32c1cf8cf8344fe880c60df3c476a6a~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-macgyver-mini-dachshund', 'seed-unassigned', 'breed-miniature-dachshund', '2026-09-07', '2026-11-02', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0285', 'seed-unassigned', 'seed-l-solo-macgyver-mini-dachshund', 'macgyver-mini-dachshund', 'MacGyver', NULL, 220000, 50000,
  'Price - $2200Deposit - $500Birthdate- September 7, 2026Ready to go - November 2, 2026 Dad''s weight- 14 poundsDad''s color- silver dapple Mom''s Weight- 11 poundsMom''s color- red Puppy color- Chocolate dapple (long haired) I know! This boy is so handsome!! With his amazing looks and precious personality MacGyver is sure to be your best friend and the favorite in any crowd! Don''t miss out on adding this sweetheart to your family! Feel free to give us a call or text at 574-221-0326 anytime for more information about this cutie. We would love to hear from you! What I come home with: vaccination record Vet check small bag of food AKC Registration', NULL, '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'macgyver-mini-dachshund', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- no breeder named, so unassigned
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img0', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_cd92ee31e4e34f39928e97bc26a51bd1~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img1', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_61bb6319cfd34dd497efde3697352a4e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img2', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_8b638088642248ee9e65e4115caddad5~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img3', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_3f6ea11bea324833b7be5a5df5c5a8bc~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img4', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_c434001930bc47e7846bd139bcfd954e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img5', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_b757275ca1d24567aae7d6bed7e3ba93~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img6', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_076954b0096548cf95de82eda8e46157~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img7', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_7232ce1fc8114f8fbbe353872eddf89a~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img8', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_491bba2092b44159a20b9c79847837d1~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0285-img9', 'seed-unassigned', 'seed-p-0285', 'https://static.wixstatic.com/media/8d80ac_1cea45feca37432a8b1a95cb2ee66d3d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-macintosh-mini-dachshund', 'seed-unassigned', 'breed-miniature-dachshund', '2026-09-07', '2026-11-02', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0286', 'seed-unassigned', 'seed-l-solo-macintosh-mini-dachshund', 'macintosh-mini-dachshund', 'Macintosh', NULL, 220000, 50000,
  'Price - $2200Deposit - $500Birthdate- September 7, 2026Ready to go - November 2, 2026 Dad''s weight- 14 poundsDad''s color- silver dapple Mom''s Weight- 11 poundsMom''s color- red Puppy color- Chocolate dapple (long haired) Meet our cute boy, Macintosh! This boy doesn''t miss a chance to be loved on and spoiled! He comes pre-spoiled with lots of love to give to his new family! Don''t miss out on adding this sweetheart to your family! Feel free to give us a call or text at 574-221-0326 anytime for more information about this cutie. We would love to hear from you! What I come home with: vaccination record Vet check small bag of food AKC Registration', NULL, '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'macintosh-mini-dachshund', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- no breeder named, so unassigned
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img0', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_9b3347cd9bc948a2b5976c2182342df2~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img1', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_34a9d1b315d048758e7bdecde4b3cb7e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img2', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_2e57915c7bd343f1b244b01ffa7eff40~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img3', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_b3736a29fcc642f2980102ce3c5a6a43~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img4', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_ea0effe048934c8ba67183e410686583~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img5', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_54b7cee68d5a4f9aadf0eeea9da3e72e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img6', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_39ee06cbf5924568a7105332d27da8a3~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img7', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_e3c215af79df4524b014aa7e717f0ee1~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0286-img8', 'seed-unassigned', 'seed-p-0286', 'https://static.wixstatic.com/media/8d80ac_491bba2092b44159a20b9c79847837d1~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-mandy-cavalier-king-charles-spaniel', 'seed-marlorhomesteadcompanions', 'breed-cavalier-king-charles-spaniel', '2026-09-08', '2026-11-08', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0287', 'seed-marlorhomesteadcompanions', 'seed-l-solo-mandy-cavalier-king-charles-spaniel', 'mandy-cavalier-king-charles-spaniel', 'Mandy', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- September 8, 2026Ready to go - November 8, 2026 Mom''s information weight: 10 pounds color: Dad''s information weight: 20 pounds color: Blenheim Puppy''s color - Blenheim Mandy is a female blenheim Cavalier King Charles Spaniel puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. She receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins her forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.marlorhomesteadcompanions.comCall or Text: 989-584-1447', 'https://www.marlorhomesteadcompanions.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'mandy-cavalier-king-charles-spaniel', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img0', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_ad7c9f6964bb4b9e926aea29cff8e08b~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img1', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_d2a88975f0eb4e0780701e8cb02981c8~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img2', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_74c09fcd5dad44eb94441d25754f948e~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img3', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_1026882a71444eb3bc763a148a04ac09~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img4', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_6ea20c8495884468a8d4d4bda5669c7a~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img5', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_fa014a04ec9045fda345b3112dd917b5~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img6', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_7c3555b74deb4093bf48f629f5d603b4~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img7', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_887be644c2db45cb99a37b0001b9dce6~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img8', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_b94b7b5491134d4ab1d791d32d629267~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0287-img9', 'seed-marlorhomesteadcompanions', 'seed-p-0287', 'https://static.wixstatic.com/media/8d80ac_bec2b878471245398109accdb3188425~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-marco-cavalier-king-charles-spaniel', 'seed-marlorhomesteadcompanions', 'breed-cavalier-king-charles-spaniel', '2026-09-08', '2026-11-08', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0288', 'seed-marlorhomesteadcompanions', 'seed-l-solo-marco-cavalier-king-charles-spaniel', 'marco-cavalier-king-charles-spaniel', 'Marco', NULL, 180000, 60000,
  'Price - $1800Deposit - $600Birthdate- September 8, 2026Ready to go - November 8, 2026 Mom''s information weight: 10 pounds color: Dad''s information weight: 20 pounds color: Blenheim Puppy''s color - Blenheim Marco is a male blenheim Cavalier King Charles Spaniel puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. He receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before he joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.marlorhomesteadcompanions.comCall or Text: 989-584-1447', 'https://www.marlorhomesteadcompanions.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'marco-cavalier-king-charles-spaniel', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img0', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_86181eb97b7b46198e8f05161f7187f4~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img1', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_60f23a5292244805877f19e65de40908~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img2', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_f0a6c35e6ad24886a152c11c9728a092~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img3', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_185ae3b84b5f4b1e8c871db45e497856~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img4', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_59443d5f38f6468cbfb05632d4bd504e~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img5', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_072f5204928b455e9fd7c6b2f906c073~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img6', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_d87dbc15280f4740b06d2b7cec7eb1a3~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img7', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_bec2b878471245398109accdb3188425~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0288-img8', 'seed-marlorhomesteadcompanions', 'seed-p-0288', 'https://static.wixstatic.com/media/8d80ac_fd33deb6ae8044e9bcd80a6c34c9f460~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-marian-shihpoo', 'seed-maplelanepets', 'breed-shih-poo', '2026-09-14', '2026-11-09', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0289', 'seed-maplelanepets', 'seed-l-solo-marian-shihpoo', 'marian-shihpoo', 'Marian', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- September 14, 2026Ready to go - November 9, 2026 Mom''s information weight: 8 pounds (Mini Poodle) color: apricot Dad''s information weight: 4 1/2 pounds (Imperial Shih Tzu) color: cream Puppy''s color - gold Meet Marian, an apricot and white female ShihPoo puppy raised with intentional care, early socialization, and daily interaction to support confidence and companionship. She receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. What I come home with: One year genetic health guarantee Vaccination/Health Record AKC registration (full registration/breeding rights are additional) Examination by our vet Microchipped Small bag of food Breeder''s website - https://responsibledogbreeder.com/lonnie-miller/Call or Text: 260-383-0995', 'https://responsibledogbreeder.com/lonnie-miller/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'marian-shihpoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img0', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_ac24f8ed47fb486799a9bb66fd874379~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img1', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_a7ce313e641d48cbb189ecc361a653de~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img2', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_cdb53d84b2b74b08bf56fcf998683cb8~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img3', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_d0058dc882e04784a199b4ccf631363a~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img4', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_e8da30a4cd894c92b3239d7361d9f948~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img5', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_2f00f313d5194a5089f343facdb9fde4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0289-img6', 'seed-maplelanepets', 'seed-p-0289', 'https://static.wixstatic.com/media/8d80ac_925b0e194f4b43abb880e83a7ab4f500~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-mary-cavalier-king-charles-spaniel-1', 'seed-marlorhomesteadcompanions', 'breed-cavalier-king-charles-spaniel', '2026-09-08', '2026-11-08', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0290', 'seed-marlorhomesteadcompanions', 'seed-l-solo-mary-cavalier-king-charles-spaniel-1', 'mary-cavalier-king-charles-spaniel-1', 'Mary', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- September 8, 2026Ready to go - November 8, 2026 Mom''s information weight: 10 pounds color: Dad''s information weight: 20 pounds color: Blenheim Puppy''s color - Blenheim Mary is a female blenheim Cavalier King Charles Spaniel puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. She receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins her forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.marlorhomesteadcompanions.comCall or Text: 989-584-1447', 'https://www.marlorhomesteadcompanions.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'mary-cavalier-king-charles-spaniel-1', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img0', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_66869433cde44800ba426bbdda9b8fe8~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img1', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_769246eca4914dd99a2ddcb50d221bd5~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img2', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_c3872f3f7520490c94e7eba9f968cd0f~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img3', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_6c8db13735e649ca96ced50466adc0a7~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img4', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_f784a507bcf749bf8be5aadc168aabc5~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img5', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_9383384fed75425092c01683f94082a2~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img6', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_6882bb9c0b654a60b5a49e913fc755cb~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img7', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_f977063c00ac4831ba7dd4a7706ac1cb~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img8', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_bec2b878471245398109accdb3188425~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0290-img9', 'seed-marlorhomesteadcompanions', 'seed-p-0290', 'https://static.wixstatic.com/media/8d80ac_fd33deb6ae8044e9bcd80a6c34c9f460~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-maverick-cavalier-king-charles-spaniel', 'seed-marlorhomesteadcompanions', 'breed-cavalier-king-charles-spaniel', '2026-09-08', '2026-11-08', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0291', 'seed-marlorhomesteadcompanions', 'seed-l-solo-maverick-cavalier-king-charles-spaniel', 'maverick-cavalier-king-charles-spaniel', 'Maverick', NULL, 180000, 60000,
  'Price - $1800Deposit - $600Birthdate- September 8, 2026Ready to go - November 8, 2026 Mom''s information weight: 10 pounds color: Dad''s information weight: 20 pounds color: Blenheim Puppy''s color - Blenheim Maverick is a male blenheim Cavalier King Charles Spaniel puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. He receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before he joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.marlorhomesteadcompanions.comCall or Text: 989-584-1447', 'https://www.marlorhomesteadcompanions.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'maverick-cavalier-king-charles-spaniel', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img0', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_e79258cc89bd4c528f54b6d49f805043~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img1', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_a334d749385f4516ad6931e9a749d1b2~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img2', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_2d132ed9b8a8485fb2f1f4c1d55bd16c~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img3', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_1ec198ff77284e738f457105b515b514~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img4', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_07296cd077e44b869975d53f768a0150~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img5', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_bec2b878471245398109accdb3188425~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0291-img6', 'seed-marlorhomesteadcompanions', 'seed-p-0291', 'https://static.wixstatic.com/media/8d80ac_fd33deb6ae8044e9bcd80a6c34c9f460~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-pearl-maltese', 'seed-pineacrespuppies', 'breed-maltese', '2026-09-15', '2026-11-24', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0292', 'seed-pineacrespuppies', 'seed-l-solo-pearl-maltese', 'pearl-maltese', 'Pearl', NULL, 220000, 60000,
  'Price - $2200Deposit - $600Birthdate- September 15, 2026Ready to go - November 24, 2026 Mom''s information weight: 9 pounds color: white Dad''s information weight: 6 pounds color: white Puppy''s color - white Pearl is a darling Maltese puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. She receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.pineacrespuppies.comCall or Text: 717-844-6902', 'https://www.pineacrespuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'pearl-maltese', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0292-img0', 'seed-pineacrespuppies', 'seed-p-0292', 'https://static.wixstatic.com/media/8d80ac_52306c1fadb04446964498483b7438f3~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0292-img1', 'seed-pineacrespuppies', 'seed-p-0292', 'https://static.wixstatic.com/media/8d80ac_b0762a0826d642dca95f0dd06ffdeb85~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0292-img2', 'seed-pineacrespuppies', 'seed-p-0292', 'https://static.wixstatic.com/media/8d80ac_16d1471f7b9f4c20af6a81e11ad37580~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0292-img3', 'seed-pineacrespuppies', 'seed-p-0292', 'https://static.wixstatic.com/media/8d80ac_316214ed32654f7f9520773c16739763~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-puck-maltese', 'seed-pineacrespuppies', 'breed-maltese', '2026-09-15', '2026-11-24', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0293', 'seed-pineacrespuppies', 'seed-l-solo-puck-maltese', 'puck-maltese', 'Puck', NULL, 195000, 60000,
  'Price - $1950Deposit - $600Birthdate- September 15, 2026Ready to go - November 24, 2026 Mom''s information weight: 9 pounds color: white Dad''s information weight: 6 pounds color: white Puppy''s color - white Puck is a darling Maltese puppy raised with thoughtful care, early socialization, and gentle handling to support healthy development. She receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.pineacrespuppies.comCall or Text: 717-844-6902', 'https://www.pineacrespuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'puck-maltese', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0293-img0', 'seed-pineacrespuppies', 'seed-p-0293', 'https://static.wixstatic.com/media/8d80ac_5490b1ec98194d2ba82f4aadbf413b9e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0293-img1', 'seed-pineacrespuppies', 'seed-p-0293', 'https://static.wixstatic.com/media/8d80ac_b6760fb7f29f4d70984f87d7bfb50413~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0293-img2', 'seed-pineacrespuppies', 'seed-p-0293', 'https://static.wixstatic.com/media/8d80ac_b7b4b35b89e2426e9b4cf16158312e5e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0293-img3', 'seed-pineacrespuppies', 'seed-p-0293', 'https://static.wixstatic.com/media/8d80ac_31385cafbaed4972ad959354968b9c54~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-saber-miniature-poodle', 'seed-perfectmatchpoodles', 'breed-miniature-poodle', '2026-09-15', '2026-11-10', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0294', 'seed-perfectmatchpoodles', 'seed-l-solo-saber-miniature-poodle', 'saber-miniature-poodle', 'Saber', NULL, 277500, 60000,
  'Price - $2775Deposit - $600Birthdate - September 15, 2026Ready to go - November 10, 2026 Mom''s informationColor: Red abstractWeight: 9 poundsHealth: Genetic tested OFA certified for Eyes and Patella Dad''s informationColor: Red Weight: 13 poundsHealth: Genetic tested clearOFA certified for eyes, heart, hips, patella, legg-calve-perthes Saber is a red male Miniature Poodle puppy raised in a hands-on family environment with thoughtful early development and daily interactionSaber receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation: physically, emotionally, and socially before he joins his forever family.Check out the breeders website below to reserve this cutie! *Full breeding rights are based on Private Treaty. What I come home with: AKC registration 1 year genetic health guarantee Vaccination/Health Record Vet exam and report Small bag of food Toy Collar Blanket VIEW BREEDER PROFILEBreeder''s website- https://perfectmatchpoodles.com/Call or Text- 574-622-2774', 'https://perfectmatchpoodles.com/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'saber-miniature-poodle', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img0', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_7b9772401bc3416b801f3f91fcead802~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img1', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_2d269fc6f972466c854772c073d66d84~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img2', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_0443b9ea5eb742618f615fa3bfdc4021~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img3', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_f8cfeebfd7294239a276e8890b5ba297~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img4', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_c05e7f48386f48e58508dbc628c4c69d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img5', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_125a7906dc764635b46da2cfa2b7a8d7~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img6', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_4f8ec22cd5a24a06976183a6247e5dad~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img7', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/d5ac96_7290d37b241a486abf35aa4cdbb93047~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img8', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_94e2b67bfb724971ae16e63d70ff8465~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0294-img9', 'seed-perfectmatchpoodles', 'seed-p-0294', 'https://static.wixstatic.com/media/8d80ac_1e0db67e8f2c40f5bff28b43fb6e6004~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-sage-havanese', 'seed-chainolakescompanions', 'breed-havanese', '2026-09-27', '2026-11-22', 12, 14, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0295', 'seed-chainolakescompanions', 'seed-l-solo-sage-havanese', 'sage-havanese', 'Sage', NULL, 260000, 60000,
  'Price - $2600Deposit - $600Birthdate- September 27, 2026Ready to go - November 22, 2026 Mom''s weight- 12lbscolor- chocolate Dad''s weight- 14lbscolor- black and white Sage has us wrapped around every one of her itty bitty toes. We think the blend of golden hues in her coat is absolutely gorgeous. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before he joins his forever family. Please give us a call or check out our website for more information or to set up a time to meet him! ***This breed is hypoallergenic. Puppy''s color may change as it matures. What I come home with: Vaccination/Health Record AKC registration Examination by our vet Dew claws are removed Small bag of food Microchipped Breeding rights $500 Call/Text: 260-214-2113Email: adoptions@chainolakescompanions.comWebsite: www.chainolakescompanions.com', 'https://www.chainolakescompanions.com', '[]', 1,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'sage-havanese', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img0', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_bf8215bbec4c4754b95a7e8046ce5441~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img1', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_ea6ac978d8de4afead679ed6288ab310~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img2', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_d36049c595de421199f317ce37ae3307~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img3', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_3f4e625e6a2c42c9bb8296831f589859~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img4', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_3363a2128aeb4b9ba445f662b54c35ed~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img5', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_1409134b7c5e401e8dd95ce45c0b7df5~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img6', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_f86dbbc6def9449bac65b1f70f836493~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img7', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_7eddc123cb92460a9fcb455563b67338~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img8', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/d5ac96_4010b880beda479ca7342c16bd1a2c19~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0295-img9', 'seed-chainolakescompanions', 'seed-p-0295', 'https://static.wixstatic.com/media/8d80ac_a48f613b52054ef48cf995e597e0e315~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-sage-miniature-poodle', 'seed-perfectmatchpoodles', 'breed-miniature-poodle', '2026-09-15', '2026-11-10', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0296', 'seed-perfectmatchpoodles', 'seed-l-solo-sage-miniature-poodle', 'sage-miniature-poodle', 'Sage', NULL, 277500, 60000,
  'Price - $2775Deposit - $600Birthdate - September 15, 2026Ready to go - November 10, 2026 Mom''s informationColor: Red abstractWeight: 9 poundsHealth: Genetic tested OFA certified for Eyes and Patella Dad''s informationColor: Red Weight: 13 poundsHealth: Genetic tested clearOFA certified for eyes, heart, hips, patella, legg-calve-perthes Meet Sage , a red female Miniature Poodle puppy raised with intentional care, early socialization, and daily interaction to support confidence and companionship.Sage receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation: physically, emotionally, and socially before she joins her forever family.Check out the breeders website to reserve this cutie! *Full breeding rights are based on Private Treaty. What I come home with: AKC registration 1 year genetic health guarantee Vaccination/Health Record Vet exam and report Small bag of food Toy Collar Blanket VIEW BREEDER PROFILEBreeder''s website- https://perfectmatchpoodles.com/Call or Text- 574-622-2774', 'https://perfectmatchpoodles.com/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'sage-miniature-poodle', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img0', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_33fe6f676dc5419eae23724e0f6acc54~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img1', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_7639eeb662a64b0896df6a249f9d3ddc~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img2', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_46115ce815c642d4a00e92aa74420131~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img3', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_ce650531ae814f5b9ff4615d6db0b205~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img4', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_3504be8308de4ad5b71d8d2b41247cfe~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img5', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_72877d3612154193a23ba9c26982138a~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img6', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_54686f40d83548a4a28b6c57dd67bb00~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img7', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_4f8ec22cd5a24a06976183a6247e5dad~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img8', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/d5ac96_7290d37b241a486abf35aa4cdbb93047~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0296-img9', 'seed-perfectmatchpoodles', 'seed-p-0296', 'https://static.wixstatic.com/media/8d80ac_94e2b67bfb724971ae16e63d70ff8465~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-sawyer-miniature-poodle', 'seed-perfectmatchpoodles', 'breed-miniature-poodle', '2026-09-15', '2026-11-10', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0297', 'seed-perfectmatchpoodles', 'seed-l-solo-sawyer-miniature-poodle', 'sawyer-miniature-poodle', 'Sawyer', NULL, 277500, 60000,
  'Price - $2775Deposit - $600Birthdate - September 15, 2026Ready to go - November 10, 2026 Mom''s informationColor: Red abstractWeight: 9 poundsHealth: Genetic tested OFA certified for Eyes and Patella Dad''s informationColor: Red Weight: 13 poundsHealth: Genetic tested clearOFA certified for eyes, heart, hips, patella, legg-calve-perthes Raised with early enrichment and gentle handling, Sawyer is a red male Miniature Poodle puppy growing into a confident, well-adjusted companion.Sawyer receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation: physically, emotionally, and socially before he joins his forever family.Check out the breeders website below to reserve this cutie! *Full breeding rights are based on Private Treaty. What I come home with: AKC registration 1 year genetic health guarantee Vaccination/Health Record Vet exam and report Small bag of food Toy Collar Blanket VIEW BREEDER PROFILEBreeder''s website- https://perfectmatchpoodles.com/Call or Text- 574-622-2774', 'https://perfectmatchpoodles.com/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'sawyer-miniature-poodle', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img0', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_10fabf3276944bc8b78460adee3af28d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img1', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_d682c7b490ea42789f51aff241a8cd3d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img2', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_b56dd37510474bff9ef3334553d5988f~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img3', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_ee7fb8674b14461aa9a8f1cd9970ac63~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img4', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_db9d7c6eed3c4e28beefbee585708979~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img5', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_6adb758fdcdc4d909a9ad690c776ce02~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img6', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_4f8ec22cd5a24a06976183a6247e5dad~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img7', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/d5ac96_7290d37b241a486abf35aa4cdbb93047~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img8', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_94e2b67bfb724971ae16e63d70ff8465~mv2.png/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0297-img9', 'seed-perfectmatchpoodles', 'seed-p-0297', 'https://static.wixstatic.com/media/8d80ac_1e0db67e8f2c40f5bff28b43fb6e6004~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-theo-cavapoo', 'seed-familyaffairpuppies', 'breed-cavapoo', '2026-08-11', '2026-10-06', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0298', 'seed-familyaffairpuppies', 'seed-l-solo-theo-cavapoo', 'theo-cavapoo', 'Theo', NULL, 300000, 60000,
  'Price - $3000Deposit - $600Birthdate- August 11, 2026Ready to go - October 6, 2026 Mom''s information weight: 19 pounds color: Dad''s information weight: 7 pounds color: Puppy''s color - apricot Raised with early enrichment and gentle handling, Theo is a apricot male Cavapoo puppy growing into a confident, well-adjusted companion. He receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. Our goal simple: to give each puppy a strong foundation—physically, emotionally, and socially—before he joins his forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.familyaffairpuppies.comCall or Text: 260-350-4840', 'https://www.familyaffairpuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'theo-cavapoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img0', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_7b7dbabfd79e4f278a8999c89761b11b~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img1', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_01392962a6de45f084e93299f6f28ee5~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img2', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_b559a6f68e3d41a1b9090986a72ffc30~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img3', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_eb44325ee8f34d5cb6140e5d76d75b19~mv2.jpeg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img4', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_f07a950f1b8f40708f50a96bf0474cd3f002.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img5', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_c3817c9131094ef89f17851fbc97a206~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0298-img6', 'seed-familyaffairpuppies', 'seed-p-0298', 'https://static.wixstatic.com/media/8d80ac_84e7e0846955476b95b48fcf3f9b1db2~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-tommy-shihpoo', 'seed-maplelanepets', 'breed-shih-poo', '2026-09-14', '2026-11-09', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0299', 'seed-maplelanepets', 'seed-l-solo-tommy-shihpoo', 'tommy-shihpoo', 'Tommy', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- September 14, 2026Ready to go - November 9, 2026 Mom''s information weight: 8 pounds (Mini Poodle) color: apricot Dad''s information weight: 4 1/2 pounds (Imperial Shih Tzu) color: cream Puppy''s color - gold Meet Tommy, a gold male ShihPoo puppy raised with intentional care, early socialization, and daily interaction to support confidence and companionship. He receives daily interaction and thoughtful development to help him grow into a confident, well-adjusted companion. What I come home with: One year genetic health guarantee Vaccination/Health Record AKC registration (full registration/breeding rights are additional) Examination by our vet Microchipped Small bag of food Breeder''s website - https://responsibledogbreeder.com/lonnie-miller/Call or Text: 260-383-0995', 'https://responsibledogbreeder.com/lonnie-miller/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'tommy-shihpoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img0', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_8816580cda4b473388114d1d697918ca~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img1', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_57a422a9ee894e65b4a3548bca884bd5~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img2', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_acad7787a982475b9006013859d3e25d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img3', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_9c4f0fa06cc8405cbf3d21ae4328e0d4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img4', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_e6223c9522c448f29a590fd7de35d7d6~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img5', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_65579580876548608d6c5b16cc36f32c~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img6', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_180f87ebddae48ccb85c53c695e19c0b~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img7', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_2f00f313d5194a5089f343facdb9fde4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0299-img8', 'seed-maplelanepets', 'seed-p-0299', 'https://static.wixstatic.com/media/8d80ac_925b0e194f4b43abb880e83a7ab4f500~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-walter-english-bulldog', 'seed-rockytopbulldogs', 'breed-english-bulldog', '2026-09-19', '2026-11-18', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0300', 'seed-rockytopbulldogs', 'seed-l-solo-walter-english-bulldog', 'walter-english-bulldog', 'Walter', NULL, 400000, 60000,
  'Price - $4000Deposit - $600Birthdate- September 19, 2026Ready to go - November 18, 2026 Mom''s information:Weight- 55 poundsColor- Dad''s information:Weight- 55 poundsColor- Puppy''s Color - red and white Walter is a such a handsome, good natured red and white Bulldog! He is raised with care and intention in a family environment. Feel free to give us a call or text anytime for more information about this puppy. We would love to hear from you! What I come home with: Two year health guarantee Vaccination record Check up and report from veterinarian AKC registration Small bag of food Microchipped Breeder''s website - www.rockytopbulldogs.comCall or text - (260) 535-0146', 'https://www.rockytopbulldogs.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'walter-english-bulldog', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img0', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_ccc2aa9cda904741b16f238c8f9f9d20~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img1', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_9c304b09581642e0b63dc85e01ef958c~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img2', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_0bca25c3c3fc4a2b845e17202a8a6aeb~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img3', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_074a639552ed4920bf5e565c7d59d0d0~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img4', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_c7d4777d898f49998473d3dea55d2195~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img5', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_21c2607477d3424aa3878750ddb52f78~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img6', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_8aa405ae59ed4271958946d2c9b1368d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0300-img7', 'seed-rockytopbulldogs', 'seed-p-0300', 'https://static.wixstatic.com/media/8d80ac_8f53d56a2fff4394a9a6acab7d07ac42~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-willow-mini-bernedoodle', 'seed-pleasantviewpuppies', 'breed-mini-bernedoodle', '2026-08-13', '2026-10-08', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0301', 'seed-pleasantviewpuppies', 'seed-l-solo-willow-mini-bernedoodle', 'willow-mini-bernedoodle', 'Willow', NULL, 250000, 60000,
  'Price - $2500Deposit - $600Birthdate- August 13, 2026Ready to go - October 8, 2026 Mom''s information weight: 30 pounds color: Dad''s information weight: 12 pounds color: Puppy''s color - merle Meet Willow, a merle female Bernedoodle puppy raised with intentional care, early socialization, and daily interaction to support confidence and companionship. She receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. Our goal is simple: to give each puppy a strong foundation—physically, emotionally, and socially—before she joins her forever family. Visit the breeder''s website to learn more and reserve your puppy! What I come home with: Two year genetic health guarantee Vaccination/Health Record Examination by our vet Microchipped Small bag of food Breeder''s website - www.pleasantviewpuppies.comCall or Text: 517-816-9079', 'https://www.pleasantviewpuppies.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'willow-mini-bernedoodle', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img0', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_4638e6556e8e4eff93d9f3cb90dc469a~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img1', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_15975d3cd19945ebb4b1e5aed24ac10b~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img2', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_809909a518164fa29162f3f2b6cb7d20~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img3', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_322fadf20cf641b6bc58c7531fd469e0~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img4', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_3cceec046f5f474cb88cfa7dd36cb6d1~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img5', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_1cb585ec395640648696b7b09f7db7d7f002.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0301-img6', 'seed-pleasantviewpuppies', 'seed-p-0301', 'https://static.wixstatic.com/media/8d80ac_9dd2c53c73ac42dab6f08e787ba29f19~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-winnie-english-bulldog', 'seed-rockytopbulldogs', 'breed-english-bulldog', '2026-09-19', '2026-11-18', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0302', 'seed-rockytopbulldogs', 'seed-l-solo-winnie-english-bulldog', 'winnie-english-bulldog', 'Winnie', NULL, 400000, 60000,
  'Price - $4000Deposit - $600Birthdate- September 19, 2026Ready to go - November 18, 2026 Mom''s information:Weight- 55 poundsColor- Dad''s information:Weight- 55 poundsColor- Puppy''s Color - red Winnie is a gorgeous little red Bulldog! She is raised with care and intention in a family environment. Feel free to give us a call or text anytime for more information about this puppy. We would love to hear from you! What I come home with: Two year health guarantee Vaccination record Check up and report from veterinarian AKC registration Small bag of food Microchipped Breeder''s website - www.rockytopbulldogs.comCall or text - (260) 535-0146', 'https://www.rockytopbulldogs.com', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'winnie-english-bulldog', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img0', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_6fe064722420401ea29ec2d890c5e518~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img1', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_298b707e70ac4df18ca4c9b9d5b67a2b~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img2', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_236fad5b21e148698a2c4a48112fb194~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img3', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_de829f0a4dbb4f3783d093958f546a2f~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img4', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_fdb50f24505544c29d84316801b94dd2~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img5', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_310bae2d13694cb3a5edf773afdee00e~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img6', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_946269f7d63e452bbba6acce4b572100~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img7', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_705506b38c9c47c3b1dc048ac95e84c3~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 7, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img8', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_8aa405ae59ed4271958946d2c9b1368d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 8, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0302-img9', 'seed-rockytopbulldogs', 'seed-p-0302', 'https://static.wixstatic.com/media/8d80ac_8f53d56a2fff4394a9a6acab7d07ac42~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 9, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
-- group
INSERT OR IGNORE INTO litters (id, breeder_id, breed_id, born_on, ready_on, mom_weight_lb, dad_weight_lb, description, legacy_id, created_at, updated_at)
  VALUES ('seed-l-solo-zaneeta-shihpoo', 'seed-maplelanepets', 'breed-shih-poo', '2026-09-14', '2026-11-09', NULL, NULL, NULL, NULL, '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO puppies (id, breeder_id, litter_id, slug, name, color, price_cents, deposit_cents, description, breeder_url, includes_json, hypoallergenic,
  payment_state, publication_state, availability, published_at, expires_at, legacy_slug, created_at, updated_at)
  VALUES ('seed-p-0303', 'seed-maplelanepets', 'seed-l-solo-zaneeta-shihpoo', 'zaneeta-shihpoo', 'Zaneeta', NULL, 200000, 60000,
  'Price - $2000Deposit - $600Birthdate- September 14, 2026Ready to go - November 9, 2026 Mom''s information weight: 8 pounds (Mini Poodle) color: apricot Dad''s information weight: 4 1/2 pounds (Imperial Shih Tzu) color: cream Puppy''s color - gold Meet Zaneeta, an apricot and white female ShihPoo puppy raised with intentional care, early socialization, and daily interaction to support confidence and companionship. She receives daily interaction and thoughtful development to help her grow into a confident, well-adjusted companion. What I come home with: One year genetic health guarantee Vaccination/Health Record AKC registration (full registration/breeding rights are additional) Examination by our vet Microchipped Small bag of food Breeder''s website - https://responsibledogbreeder.com/lonnie-miller/Call or Text: 260-383-0995', 'https://responsibledogbreeder.com/lonnie-miller/', '[]', 0,
  'comped', 'published', 'available', '2026-10-18T20:00:00Z', NULL, 'zaneeta-shihpoo', '2026-10-18T20:00:00Z', '2026-10-18T20:00:00Z'); -- printed address
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img0', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_2bcfc0057fd44600a66a84d445956511~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 0, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img1', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_309affe0f263411ba51c66d7c13965e4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 1, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img2', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_729a856f428f4ec1ba96853ee92e24b6~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 2, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img3', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_e1bc81918f1b4e838e4069b415918e4d~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 3, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img4', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_46eda388ebbb4bbfa446330f848c7633~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 4, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img5', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_2f00f313d5194a5089f343facdb9fde4~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 5, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');
INSERT OR IGNORE INTO photos (id, breeder_id, puppy_id, external_url, position, aspect, width, height, created_at)
  VALUES ('seed-p-0303-img6', 'seed-maplelanepets', 'seed-p-0303', 'https://static.wixstatic.com/media/8d80ac_925b0e194f4b43abb880e83a7ab4f500~mv2.jpg/v1/fill/w_1400,h_1050,al_c,q_88,usm_0.66_1.00_0.01/file.jpg', 6, 1.333, 1400, 1050, '2026-10-18T20:00:00Z');

-- Breeds each breeder raises, from the puppies it now holds.
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-blessyourpawspuppies', 'breed-munchkin-bernedoodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-chainolakescompanions', 'breed-havanese');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cornerstonecavaliers', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-countryview-pets', 'breed-yorkshire-terrier');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-county-line-kennel', 'breed-miniature-poodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cozy-pine-canine', 'breed-cavapoo');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cuddlyfamilycompanions', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cuddlyfamilycompanions', 'breed-miniature-schnauzer');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-cuddlyfamilycompanions', 'breed-yorkshire-terrier');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-doubleyypuppies', 'breed-shih-tzu');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-doubleyypuppies', 'breed-teddy-bear-shihchon');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-duane-borkholder', 'breed-miniature-poodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-familyaffairpuppies', 'breed-cavapoo');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-familyaffairpuppies', 'breed-toy-poodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-goldpawcanine', 'breed-english-bulldog');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-heartlandminischnauzers', 'breed-miniature-schnauzer');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-heartlandminischnauzers', 'breed-yorkshire-terrier');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-ibarcaninecompanions', 'breed-miniature-dachshund');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-johnny-miller', 'breed-french-bulldog');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-kingdomfamilycompanions', 'breed-doberman-pinscher');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-kingdomfamilycompanions', 'breed-golden-retriever');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-kingsfamilycompanions', 'breed-boston-terrier');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-little-paws-canine', 'breed-papillon');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-maplelanepets', 'breed-papillon');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-maplelanepets', 'breed-shih-poo');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-marlorhomesteadcompanions', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-marlorhomesteadcompanions', 'breed-cavapoo');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pawprintacres', 'breed-boston-terrier');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pawprintacres', 'breed-cocker-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pawprintacres', 'breed-saint-bernard');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-perfectmatchpoodles', 'breed-miniature-poodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pine-creek-bulldogs', 'breed-french-bulldog');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pineacrespuppies', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pineacrespuppies', 'breed-maltese');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pleasantviewpuppies', 'breed-cavapoo');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-pleasantviewpuppies', 'breed-mini-bernedoodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-preciouspawscompanions', 'breed-mini-aussiedoodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-riverdale-paw-pals', 'breed-miniature-dachshund');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-riverdale-paw-pals', 'breed-pembroke-welsh-corgi');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-rockytopbulldogs', 'breed-english-bulldog');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-rollingacresfarmpuppies', 'breed-boston-terrier');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-rollingacresfarmpuppies', 'breed-miniature-poodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-rollingacresfarmpuppies', 'breed-toy-poodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-signature-puppies', 'breed-pomeranian');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-sunsetpawbabies', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-sunsetpawbabies', 'breed-f1b-mini-goldendoodle');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-sweetpuppypaws', 'breed-labrador-retriever');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-teapup', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-teapup', 'breed-cavapoo');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-teapup', 'breed-miniature-schnauzer');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-teapup', 'breed-shih-tzu');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-tmcountrysidek9', 'breed-great-dane');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-tmcountrysidek9', 'breed-miniature-dachshund');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-tyler-eileen-martin', 'breed-pembroke-welsh-corgi');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-wagging-tail-puppies', 'breed-cavalier-king-charles-spaniel');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-willowlanebulldogs', 'breed-victorian-bulldog');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-windingstreamscompanions', 'breed-toy-poodle');

-- Peaceful Paws Puppies. No live listing names it (Alex, 2026-10-18: "if peaceful paws puppies are no more remove them"), so it is suspended, which takes it off the public site, and its phone is corrected from 574-457-8231, the number on teapup.com, to the one on its own site.
UPDATE breeder_profiles SET public_phone = '517-320-4080', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE breeder_id = 'seed-peacefulpawspuppies' AND public_phone IS NOT '517-320-4080';
UPDATE breeders SET status = 'suspended', status_reason = 'No live Wix listing names it, so it is off the public site (Alex, 2026-10-18)', decided_at = '2026-10-18T20:00:00Z', decided_by = 'migration 0023', updated_at = '2026-10-18T20:00:00Z', version = version + 1 WHERE id = 'seed-peacefulpawspuppies' AND status <> 'suspended';

-- Mark the site changed, so the next scheduled publish rebuilds it (as migration 0022 does).
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
