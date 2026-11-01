-- Alex, 2026-11-01 (docs/batch-2026-11-02-post-launch.md, n4-multi-main). One address may be the main contact of
-- several kennels, for the Responsible Dog Breeder Network, whose administrator address is the main contact of every
-- member kennel. breeders.email loses its UNIQUE constraint and keeps a plain index, which needs a table rebuild:
-- the rows go to a plain copy, the table is dropped and made again under its own name, and the rows come back.
-- Putting the rows back after the drop is what lets the deferred foreign keys settle: SQLite counts each child row
-- the drop orphans and uncounts it when its parent row is inserted again, so a copy filled before the drop and then
-- renamed fails at the end (rehearsed 2026-11-01). The five public views that read breeders are dropped first and
-- made again after, with the definitions production held on 2026-11-01.
-- Then the 14 member kennels Amber listed on 2026-10-25 take the network address as their main contact in place of
-- their placeholder addresses, as Ibar Canine Companions already has. Nobody has signed in to them, so no session
-- or password changes; one invitation to the network address then opens all 15.
-- The rebuild is one "-- group", so app/ops/d1-apply.mjs sends it as one batch with foreign keys deferred. A second
-- run rebuilds the table again with the same rows, and the address changes are guarded on the placeholder address.
-- Generated 2026-11-01T14:30:09Z against production-2026-11-01-pre0084.sql, rehearsed again on production-2026-11-01-pre0085.sql.
PRAGMA defer_foreign_keys = true;
-- group
DROP VIEW IF EXISTS public_documents;
DROP VIEW IF EXISTS public_parents;
DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;
DROP VIEW IF EXISTS public_breeders;
DROP TABLE IF EXISTS breeders_copy;
CREATE TABLE breeders_copy AS SELECT id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, status_reason, stripe_customer_id, legacy, created_at, updated_at, version, first_signin_at, manage_access, manage_access_by, manage_access_at, manage_access_how, seller_confirmed_at FROM breeders;
DROP TABLE breeders;
CREATE TABLE breeders (
  id                   TEXT PRIMARY KEY,
  email                TEXT NOT NULL COLLATE NOCASE,
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','approved','declined','suspended')),
  email_verified_at    TEXT,
  profile_submitted_at TEXT,
  terms_version        TEXT,
  terms_accepted_at    TEXT,
  decided_at           TEXT,
  decided_by           TEXT,
  status_reason        TEXT,
  stripe_customer_id   TEXT UNIQUE,
  legacy               INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  version              INTEGER NOT NULL DEFAULT 1,
  first_signin_at      TEXT,
  manage_access        INTEGER NOT NULL DEFAULT 0,
  manage_access_by     TEXT,
  manage_access_at     TEXT,
  manage_access_how    TEXT,
  seller_confirmed_at  TEXT
);
INSERT INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, status_reason, stripe_customer_id, legacy, created_at, updated_at, version, first_signin_at, manage_access, manage_access_by, manage_access_at, manage_access_how, seller_confirmed_at)
  SELECT id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, status_reason, stripe_customer_id, legacy, created_at, updated_at, version, first_signin_at, manage_access, manage_access_by, manage_access_at, manage_access_how, seller_confirmed_at FROM breeders_copy;
DROP TABLE breeders_copy;
CREATE INDEX IF NOT EXISTS breeders_email ON breeders (email);
CREATE VIEW public_breeders AS
SELECT p.breeder_id, p.business_name, p.slug, p.public_phone, p.public_email,
       p.website_url, p.city, p.state, p.description, p.logo_key, p.kennel_key, p.facebook_url
FROM breeder_profiles p JOIN breeders b ON b.id = p.breeder_id
WHERE p.slug IS NOT NULL
  AND (b.status = 'approved'
       OR (b.status = 'suspended'
           AND (SELECT value FROM settings WHERE key = 'suspended_listings_visible') = '1'));
CREATE VIEW public_puppies AS
SELECT pu.id, pu.breeder_id, pu.litter_id, pu.slug, pu.name, pu.sex, pu.color,
       pu.price_cents, pu.deposit_cents, pu.description, pu.breeder_url, pu.includes_json,
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at,
       pu.legacy_slug, pu.coat,
       pu.registry, pu.markings, pu.health_notes, pu.vaccinations, pu.deworming, pu.disclosures, pu.deposit_url,
       pu.placed_at
FROM puppies pu JOIN public_breeders pb ON pb.breeder_id = pu.breeder_id
WHERE pu.publication_state = 'published'
  AND pu.payment_state IN ('paid','comped')
  AND pu.operator_hold = 0
  AND (pu.expires_at IS NULL OR pu.expires_at > strftime('%Y-%m-%dT%H:%M:%SZ','now'));
CREATE VIEW public_litters AS
SELECT l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom_weight_lb,
       l.dad_weight_lb, l.description, l.mom_id, l.dad_id
FROM litters l
WHERE l.archived_at IS NULL
  AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.litter_id = l.id);
CREATE VIEW public_parents AS
SELECT d.id, d.breeder_id, d.sex, d.name, d.breed, d.registry, d.registration, d.health_tests_json,
       d.health_other, d.pedigree, d.photo_key
FROM parent_dogs d
WHERE d.id IN (SELECT mom_id FROM public_litters UNION SELECT dad_id FROM public_litters);
CREATE VIEW public_documents AS
SELECT doc.id, doc.puppy_id, doc.parent_id, doc.kind, doc.title, doc.content_type, doc.r2_key
FROM documents doc
WHERE doc.visibility = 'public' AND doc.r2_key LIKE 'docs/%'
  AND (doc.puppy_id IN (SELECT id FROM public_puppies) OR doc.parent_id IN (SELECT id FROM public_parents));

-- The network address becomes the main contact of the 14 member kennels.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-doubleyypuppies', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-doubleyypuppies' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-doubleyypuppies' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-pineacrespuppies', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-pineacrespuppies' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-pineacrespuppies' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-sunsetpawbabies', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-sunsetpawbabies' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-sunsetpawbabies' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-rockytopbulldogs', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-rockytopbulldogs' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-rockytopbulldogs' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-goldpawcanine', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-goldpawcanine' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-goldpawcanine' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-pleasantviewpuppies', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-pleasantviewpuppies' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-pleasantviewpuppies' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-marlorhomesteadcompanions', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-marlorhomesteadcompanions' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-marlorhomesteadcompanions' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-familyaffairpuppies', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-familyaffairpuppies' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-familyaffairpuppies' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-kingsfamilycompanions', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-kingsfamilycompanions' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-kingsfamilycompanions' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-rollingacresfarmpuppies', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-rollingacresfarmpuppies' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-rollingacresfarmpuppies' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-preciouspawscompanions', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-preciouspawscompanions' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-preciouspawscompanions' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-windingstreamscompanions', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-windingstreamscompanions' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-windingstreamscompanions' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-cuddlyfamilycompanions', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-cuddlyfamilycompanions' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-cuddlyfamilycompanions' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:30:09Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-chainolakescompanions', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-chainolakescompanions' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T14:30:09Z', version = version + 1 WHERE id = 'seed-chainolakescompanions' AND email LIKE '%@breeders.test';
