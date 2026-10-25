-- 2026-10-25. Amber's listing terms (launch workplan D2), saved as the working draft on the admin's
-- Terms screen and NOT published. Publishing is a separate step for Amber or Alex, because it makes a
-- new terms version and asks every breeder who accepted the old one to accept it on their next visit.
--
-- The text is hs-proposals/puppyconnection/2026-10-25-amber-listing-terms.md word for word, with two
-- changes that the pull request lists for Amber. "PC" in "because PC connects buyers and breeders"
-- reads "Puppy Connection", and her photo standard of 2026-10-19 (migration 0032, workplan A14) stays
-- in the draft as its own paragraph before the Breeder Listing Agreement, as it was in the draft.
--
-- The draft is replaced only while it still holds the REPLACE THIS placeholder, so a draft someone
-- has already written on the Terms screen is left alone, and a second run changes nothing. The
-- published versions and settings.terms_version are not touched. Back up D1 first and confirm the
-- export printed "Downloaded".

-- A database with no draft row gets the placeholder first, so the update below has a row to fill.
INSERT OR IGNORE INTO terms_versions (version, body, updated_at, updated_by) VALUES
  ('draft', 'REPLACE THIS: the listing terms, in Amber''s own words (build spec section 14). Nothing has been written here on her behalf.',
   '2026-10-25T18:00:00Z', 'migration 0058');

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T18:00:00Z', 'system', 'claude', 'terms.draft', 'terms', 'draft',
         json_object('chars', length(body)), json_object('chars', 4575, 'source', 'Amber, 2026-10-25', 'as', 'Claude', 'migration', '0058')
    FROM terms_versions
   WHERE version = 'draft' AND instr(body, 'REPLACE THIS: the listing terms') > 0 AND instr(body, '1. Essential breeder listing terms') = 0;

UPDATE terms_versions SET body =
    '1. Essential breeder listing terms' || char(10) ||
    '1. Accurate and honest listings' || char(10) ||
    'Breeders agree to provide accurate information about each puppy, including breed, date of birth, sex, price, availability, parent information, and any health information they choose or are required to disclose. Photos and descriptions should fairly represent the puppy being advertised.' || char(10) ||
    '2. Puppy care and well-being' || char(10) ||
    'Breeders agree to provide appropriate food, housing, veterinary care, socialization, and humane treatment for their dogs and puppies, in accordance with applicable laws and regulations.' || char(10) ||
    '3. Health information and documentation' || char(10) ||
    'Breeders agree to disclose known health concerns and provide accurate information about veterinary care, vaccinations, health testing, and health guarantees as applicable. They must not misrepresent certifications, registrations, test results, or veterinary records.' || char(10) ||
    '4. Communication with prospective buyers' || char(10) ||
    'Breeders agree to communicate respectfully, answer reasonable questions, and provide prospective families with the information they need to make an informed decision. Buyers and breeders are encouraged to discuss expectations before making arrangements.' || char(10) ||
    '5. Keeping listings current' || char(10) ||
    'Breeders agree to update listings when prices or availability change and promptly mark puppies as pending or sold when appropriate. Puppy Connection may remove or deactivate outdated listings.' || char(10) ||
    '6. Legal and ethical compliance' || char(10) ||
    'Breeders are responsible for complying with applicable animal welfare, licensing, sales, consumer protection, and other relevant laws. They must have the authority and any required permissions to advertise the puppies they list.' || char(10) ||
    '2. Protecting Puppy Connection' || char(10) ||
    'These terms are especially important because Puppy Connection connects buyers and breeders but does not sell or own the puppies.' || char(10) ||
    '' || char(10) ||
    '* Independent breeders: Each breeder operates independently and is responsible for their puppies, representations, contracts, pricing, health guarantees, and sales.' || char(10) ||
    '* No guarantee of a transaction: A listing on Puppy Connection does not guarantee a puppy''s health, temperament, availability, or suitability for a particular family.' || char(10) ||
    '* Direct buyer-breeder transactions: Buyers and breeders arrange purchase terms and payments directly with each other. Puppy Connection is not a party to their puppy sale agreement.' || char(10) ||
    '* Listing review and removal: Puppy Connection may review listings and suspend or remove listings or accounts that violate its terms, contain misleading information, or raise legitimate concerns.' || char(10) ||
    '* Listing fees: Breeders agree to the published listing fees and payment terms. Fees for advertising services are separate from payments for puppies, and any refund policy should be clearly disclosed.' || char(10) ||
    '* Privacy and permission: Breeders confirm they have permission to share submitted photos, videos, and other content and agree to the site''s privacy policy and applicable data practices.' || char(10) ||
    '* No circumvention of buyer protections: Breeders agree not to mislead buyers about payment arrangements, contractual terms, or the identity of the person or business selling the puppy.' || char(10) ||
    '' || char(10) ||
    'Photo standard. Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.' || char(10) ||
    '' || char(10) ||
    'Puppy Connection Breeder Listing Agreement' || char(10) ||
    'By submitting a puppy listing to Puppy Connection, I confirm that:' || char(10) ||
    '' || char(10) ||
    '* The information and materials I provide are accurate to the best of my knowledge, and I have permission to use the photos and other content submitted.' || char(10) ||
    '* I will provide appropriate care for my dogs and puppies and communicate honestly about their health, background, and availability.' || char(10) ||
    '* I will keep my listings current and communicate respectfully with prospective buyers.' || char(10) ||
    '* I am responsible for complying with applicable laws and for the puppies I advertise, including my pricing, sales agreements, health disclosures, and any health guarantees I provide.' || char(10) ||
    '* I understand that Puppy Connection is an advertising and connection platform, not the seller or owner of the puppies. Puppy sales, payments, and agreements are arranged directly between buyers and breeders.' || char(10) ||
    '* I understand that Puppy Connection may review, decline, deactivate, or remove listings that do not comply with its published terms and policies.' || char(10) ||
    '* I agree to the Puppy Connection Terms of Service, Privacy Policy, and applicable listing fees.' || char(10) ||
    '' || char(10) ||
    'I understand that these guidelines help Puppy Connection provide a useful, welcoming place for breeders and families to connect.',
       updated_at = '2026-10-25T18:00:00Z', updated_by = 'migration 0058'
 WHERE version = 'draft' AND instr(body, 'REPLACE THIS: the listing terms') > 0 AND instr(body, '1. Essential breeder listing terms') = 0;
