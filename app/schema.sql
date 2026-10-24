-- Puppy Connection database. The design is in the implementation spec, section 4.
-- Every table uses IF NOT EXISTS, so running this again does nothing to a database that
-- already has them. Anything that changes an existing table goes in migrations/.
-- Timestamps are UTC ISO 8601 to the second, YYYY-MM-DDTHH:MM:SSZ, written by now() in
-- lib/util.js, because the views compare them as text against strftime().

CREATE TABLE IF NOT EXISTS breeders (
  id                   TEXT PRIMARY KEY,
  email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
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
  -- The first sign-in, which starts the inactivity clock for an imported breeder (migrations/0020).
  first_signin_at      TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  version              INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS breeder_profiles (
  breeder_id    TEXT PRIMARY KEY REFERENCES breeders(id),
  business_name TEXT NOT NULL,
  slug          TEXT UNIQUE,
  contact_name  TEXT,
  public_phone  TEXT,
  public_email  TEXT,
  website_url   TEXT,
  city          TEXT,
  state         TEXT,
  description   TEXT,
  logo_key      TEXT,
  updated_at    TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  -- Plan P2.3, the optional profile extras (migrations/0002_portal_features.sql). logo_key and
  -- kennel_key are R2 keys under brand/<breeder id>/, each with a ".card" copy beside it.
  kennel_key    TEXT,
  facebook_url  TEXT
);

-- Workplan A13 (migrations/0031). The one reference a new breeder names before submitting for
-- approval, shown to operators beside Approve. Never public, so it is not on breeder_profiles.
CREATE TABLE IF NOT EXISTS breeder_references (
  breeder_id  TEXT PRIMARY KEY REFERENCES breeders(id),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('akc','welfare','breeder','vet')),
  contact     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Plan P2.3. The breeds a breeder raises, picked from the breeds table. Optional.
CREATE TABLE IF NOT EXISTS breeder_breeds (
  breeder_id TEXT NOT NULL REFERENCES breeders(id),
  breed_id   TEXT NOT NULL REFERENCES breeds(id),
  PRIMARY KEY (breeder_id, breed_id)
);

-- Plan P2.5. Views of a puppy page and clicks through to its breeder, counted per puppy per
-- UTC day by the public site's beacon. Nothing about the visitor is stored.
CREATE TABLE IF NOT EXISTS puppy_stats (
  puppy_id TEXT NOT NULL REFERENCES puppies(id),
  day      TEXT NOT NULL,
  views    INTEGER NOT NULL DEFAULT 0,
  clicks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (puppy_id, day)
);

-- Plan P2.7. A breeder asking Puppy Connection to close their account. An operator sees the
-- request and marks it closed (resolved_at). Thirty days later the daily retention job removes the
-- account's information (lib/retention.js, migrations/0060) and records the day in removed_at.
CREATE TABLE IF NOT EXISTS account_requests (
  id          TEXT PRIMARY KEY,
  breeder_id  TEXT NOT NULL REFERENCES breeders(id),
  kind        TEXT NOT NULL CHECK (kind IN ('close')),
  reason      TEXT,
  created_at  TEXT NOT NULL,
  withdrawn_at TEXT,
  resolved_at TEXT,
  resolved_by TEXT,
  removed_at  TEXT
);
CREATE INDEX IF NOT EXISTS account_requests_breeder ON account_requests(breeder_id, created_at);

CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash  TEXT PRIMARY KEY,
  email       TEXT NOT NULL COLLATE NOCASE,
  breeder_id  TEXT REFERENCES breeders(id),
  purpose     TEXT NOT NULL CHECK (purpose IN ('signup','signin')),
  signup_name TEXT,
  ip          TEXT,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  -- Plan P6.2, the six-digit code sent beside the link (migrations/0001_signin_code.sql).
  -- code_hash is SHA-256 of the browser's sign-in cookie and the code, so the code is only
  -- good in the browser that asked. browser_hash finds that browser's rows, and code_tries
  -- counts wrong codes until the row is spent.
  code_hash    TEXT,
  browser_hash TEXT,
  code_tries   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS login_tokens_email_created ON login_tokens(email, created_at);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,
  breeder_id   TEXT NOT NULL REFERENCES breeders(id),
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at   TEXT,
  -- The address this session signed in with (migrations/0010_kennel_members.sql). NULL on
  -- older sessions, which count as the breeder's own address.
  email        TEXT COLLATE NOCASE
);
CREATE INDEX IF NOT EXISTS sessions_breeder ON sessions(breeder_id);

-- More than one person per kennel (migrations/0010_kennel_members.sql). Each extra person signs
-- in with their own address and has the same access as the breeder's own address.
CREATE TABLE IF NOT EXISTS breeder_members (
  id          TEXT PRIMARY KEY,
  breeder_id  TEXT NOT NULL REFERENCES breeders(id),
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT,
  added_by    TEXT NOT NULL,
  added_at    TEXT NOT NULL,
  joined_at   TEXT
);
CREATE INDEX IF NOT EXISTS breeder_members_breeder ON breeder_members(breeder_id);

CREATE TABLE IF NOT EXISTS people (
  email    TEXT PRIMARY KEY COLLATE NOCASE,
  name     TEXT NOT NULL,
  role     TEXT NOT NULL CHECK (role IN ('owner','staff')),
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS breeds (
  id   TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  -- Plan P3.3 (migrations/0003_admin_features.sql). The breed guide text an operator writes in
  -- the admin, plain paragraphs, for the site's breed pages (P4.3).
  guide            TEXT,
  guide_updated_at TEXT,
  -- Suggested colors and coat types for the puppy form, comma-separated (migrations/0009).
  colors           TEXT,
  coats            TEXT,
  -- The photo the breed page and breed cards show, chosen by Alex from the professional-looking
  -- listing photos (migrations/0043). NULL, or a photo no longer public, lets the site choose.
  photo_id         TEXT
);

-- Plan P3.2. Private notes operators keep on a breeder. Never shown to the breeder, and never
-- in the site export or a report. The nightly backup carries them, for recovery only.
CREATE TABLE IF NOT EXISTS operator_notes (
  id         TEXT PRIMARY KEY,
  breeder_id TEXT NOT NULL REFERENCES breeders(id),
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS operator_notes_breeder ON operator_notes(breeder_id, created_at);
-- The retention job deletes notes older than 2 years by this (migrations/0060).
CREATE INDEX IF NOT EXISTS operator_notes_created ON operator_notes(created_at);

-- Plan P3.4. The listing terms text, one row per published version plus the working draft
-- (version 'draft', never published). settings.terms_version names the current version, and a
-- breeder whose breeders.terms_version differs is asked to accept it.
CREATE TABLE IF NOT EXISTS terms_versions (
  version      TEXT PRIMARY KEY,
  body         TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  updated_by   TEXT NOT NULL,
  published_at TEXT,
  published_by TEXT
);

-- Plan P3.8. Disputes on a listing payment, written from the payment provider's dispute
-- events (lib/payments.js handleEvent). The id is the provider's dispute id.
CREATE TABLE IF NOT EXISTS disputes (
  id             TEXT PRIMARY KEY,
  payment_intent TEXT NOT NULL,
  checkout_id    TEXT,
  status         TEXT NOT NULL,
  reason         TEXT,
  amount_cents   INTEGER,
  opened_at      TEXT NOT NULL,
  closed_at      TEXT,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS disputes_payment ON disputes(payment_intent);

-- Saved moms and dads (migrations/0050, workplan A19). breed is a slug from lib/healthtests.js,
-- which also names the health tests in health_tests_json. Archived ones leave the litter picker only.
CREATE TABLE IF NOT EXISTS parent_dogs (
  id                TEXT PRIMARY KEY,
  breeder_id        TEXT NOT NULL REFERENCES breeders(id),
  sex               TEXT NOT NULL CHECK (sex IN ('female','male')),
  name              TEXT NOT NULL,
  breed             TEXT,
  registry          TEXT,
  registration      TEXT,
  health_tests_json TEXT NOT NULL DEFAULT '[]',
  health_other      TEXT,
  pedigree          TEXT,
  photo_key         TEXT,
  archived_at       TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  UNIQUE (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS parent_dogs_breeder ON parent_dogs(breeder_id);

CREATE TABLE IF NOT EXISTS litters (
  id            TEXT PRIMARY KEY,
  breeder_id    TEXT NOT NULL REFERENCES breeders(id),
  breed_id      TEXT NOT NULL REFERENCES breeds(id),
  born_on       TEXT,
  ready_on      TEXT,
  mom_weight_lb REAL,
  dad_weight_lb REAL,
  description   TEXT,
  archived_at   TEXT,
  legacy_id     TEXT,
  -- The saved mom and dad picked for this litter (migrations/0050). The weights above stay.
  mom_id        TEXT REFERENCES parent_dogs(id),
  dad_id        TEXT REFERENCES parent_dogs(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  UNIQUE (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS litters_breeder ON litters(breeder_id);

CREATE TABLE IF NOT EXISTS puppies (
  id                TEXT PRIMARY KEY,
  breeder_id        TEXT NOT NULL,
  litter_id         TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  sex               TEXT CHECK (sex IN ('male','female')),
  color             TEXT,
  price_cents       INTEGER CHECK (price_cents >= 0),
  deposit_cents     INTEGER CHECK (deposit_cents >= 0),
  description       TEXT,
  breeder_url       TEXT,
  includes_json     TEXT NOT NULL DEFAULT '[]',
  hypoallergenic    INTEGER NOT NULL DEFAULT 0,
  payment_state     TEXT NOT NULL DEFAULT 'unpaid'
                    CHECK (payment_state IN ('unpaid','paid','comped','refunded','disputed')),
  publication_state TEXT NOT NULL DEFAULT 'draft'
                    CHECK (publication_state IN ('draft','published','expired','archived')),
  availability      TEXT NOT NULL DEFAULT 'available'
                    CHECK (availability IN ('available','pending','placed')),
  operator_hold     INTEGER NOT NULL DEFAULT 0 CHECK (operator_hold IN (0,1)),
  published_at      TEXT,
  expires_at        TEXT,
  expiry_warned_at  TEXT,
  legacy_slug       TEXT,
  legacy_url        TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  -- The coat type, from the breed's coats list where it has one (migrations/0009).
  coat              TEXT,
  -- More puppy details, all optional (migrations/0016). registry is one name from the
  -- registries setting; deposit_url is the breeder's own deposit page.
  registry          TEXT,
  markings          TEXT,
  health_notes      TEXT,
  vaccinations      TEXT,
  deworming         TEXT,
  disclosures       TEXT,
  deposit_url       TEXT,
  -- When the puppy was marked adopted, kept by the triggers below (migrations/0019). The
  -- generator unlists an adopted puppy adopted_index_days after it.
  placed_at         TEXT,
  -- The inactivity schedule (migrations/0020, lib/inactivity.js).
  last_update_at    TEXT,
  inactive_stage    TEXT CHECK (inactive_stage IN ('reminded_1','reminded_2','offline','removed')),
  stage_at          TEXT,
  inactive_at       TEXT,
  still_token_hash  TEXT,
  -- The photo-based schedule (migrations/0030, lib/inactivity.js). The newest photo that passed the
  -- check, or the payment that listed the puppy. last_update_at and still_token_hash are unused.
  last_photo_at     TEXT,
  -- Workplan A14 (migrations/0032). The kind of operator hold: NULL is the plain hold, photos is
  -- take offline until new photos, which a passing photo after hold_at lifts.
  hold_kind         TEXT CHECK (hold_kind IN ('photos')),
  hold_reason       TEXT,
  hold_at           TEXT,
  UNIQUE (id, breeder_id),
  FOREIGN KEY (litter_id, breeder_id) REFERENCES litters (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS puppies_breeder ON puppies(breeder_id);
CREATE INDEX IF NOT EXISTS puppies_litter ON puppies(litter_id);
CREATE INDEX IF NOT EXISTS puppies_inactive ON puppies(inactive_stage, last_update_at);
CREATE UNIQUE INDEX IF NOT EXISTS puppies_still_token ON puppies(still_token_hash) WHERE still_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS puppies_photo_clock ON puppies(inactive_stage, last_photo_at);
CREATE TRIGGER IF NOT EXISTS puppies_placed_at_update AFTER UPDATE OF availability ON puppies
WHEN NEW.availability IS NOT OLD.availability
BEGIN
  UPDATE puppies SET placed_at = CASE WHEN NEW.availability = 'placed' THEN strftime('%Y-%m-%dT%H:%M:%SZ','now') ELSE NULL END
   WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS puppies_placed_at_insert AFTER INSERT ON puppies
WHEN NEW.availability = 'placed' AND NEW.placed_at IS NULL
BEGIN
  UPDATE puppies SET placed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;


-- A photo is either uploaded (r2_key) or an imported Wix link kept until the photos are
-- localized (external_url). Never both missing.
CREATE TABLE IF NOT EXISTS photos (
  id           TEXT PRIMARY KEY,
  breeder_id   TEXT NOT NULL,
  puppy_id     TEXT NOT NULL,
  r2_key       TEXT UNIQUE,
  external_url TEXT,
  content_type TEXT,
  bytes        INTEGER,
  position     INTEGER NOT NULL,
  aspect       REAL,
  width        INTEGER,
  height       INTEGER,
  focus_x      REAL,
  focus_y      REAL,
  committed_at TEXT,
  created_at   TEXT NOT NULL,
  -- The photo quality check (migrations/0018, lib/photocheck.js). NULL is never checked
  -- (imported, demo or operator photos); only NULL and pass publish or are served, and pending also counts toward the minimum.
  quality            TEXT CHECK (quality IN ('pending','pass','sent_back','review')),
  quality_reasons    TEXT,
  quality_checked_at TEXT,
  quality_note       TEXT,
  CHECK (r2_key IS NOT NULL OR external_url IS NOT NULL),
  FOREIGN KEY (puppy_id, breeder_id) REFERENCES puppies (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS photos_puppy ON photos(puppy_id, position);
CREATE INDEX IF NOT EXISTS photos_quality ON photos(quality) WHERE quality IS NOT NULL;

-- Videos stored and played by Cloudflare Stream (migrations/0016, lib/stream.js). Only ready
-- videos of public puppies reach the site.
CREATE TABLE IF NOT EXISTS puppy_videos (
  id           TEXT PRIMARY KEY,
  breeder_id   TEXT NOT NULL,
  puppy_id     TEXT NOT NULL,
  stream_uid   TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','processing','ready','error')),
  duration_s   REAL,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  ready_at     TEXT,
  FOREIGN KEY (puppy_id, breeder_id) REFERENCES puppies (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS puppy_videos_puppy ON puppy_videos(puppy_id, position);

-- Health records, guarantees and pedigrees for a puppy or a parent (migrations/0050, workplan A20).
-- A public file is under docs/ in R2 and a private one under private/, and only public_documents
-- reaches the site.
CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  breeder_id   TEXT NOT NULL REFERENCES breeders(id),
  puppy_id     TEXT,
  parent_id    TEXT,
  kind         TEXT NOT NULL CHECK (kind IN ('health','guarantee','pedigree','other')),
  title        TEXT NOT NULL,
  visibility   TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  r2_key       TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  bytes        INTEGER NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  CHECK ((puppy_id IS NULL) <> (parent_id IS NULL)),
  FOREIGN KEY (puppy_id, breeder_id) REFERENCES puppies (id, breeder_id),
  FOREIGN KEY (parent_id, breeder_id) REFERENCES parent_dogs (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS documents_puppy ON documents(puppy_id);
CREATE INDEX IF NOT EXISTS documents_parent ON documents(parent_id);

-- Breed searches on the browse page, per breed per day, nothing about the visitor (migrations/0021).
CREATE TABLE IF NOT EXISTS breed_searches (
  breed_id  TEXT NOT NULL REFERENCES breeds(id),
  day       TEXT NOT NULL,
  searches  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (breed_id, day)
);

-- Report a listing (migrations/0017, lib/reports.js). The reporter's email is optional and only for a reply.
CREATE TABLE IF NOT EXISTS listing_reports (
  id              TEXT PRIMARY KEY,
  breeder_id      TEXT NOT NULL REFERENCES breeders(id),
  puppy_id        TEXT,
  reason          TEXT NOT NULL CHECK (reason IN ('misleading','not_available','scam','welfare','photos','other')),
  details         TEXT NOT NULL,
  reporter_email  TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','handled','dismissed')),
  created_at      TEXT NOT NULL,
  closed_by       TEXT,
  closed_at       TEXT,
  note            TEXT
);
CREATE INDEX IF NOT EXISTS listing_reports_status ON listing_reports(status, created_at);
CREATE INDEX IF NOT EXISTS listing_reports_breeder ON listing_reports(breeder_id);
-- The retention job deletes reports older than 2 years by this (migrations/0060).
CREATE INDEX IF NOT EXISTS listing_reports_created ON listing_reports(created_at);

CREATE TABLE IF NOT EXISTS checkouts (
  id                       TEXT PRIMARY KEY,
  breeder_id               TEXT NOT NULL REFERENCES breeders(id),
  status                   TEXT NOT NULL
                           CHECK (status IN ('creating','open','paid','expired','failed','needs_review')),
  stripe_session_id        TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  price_id                 TEXT NOT NULL,
  quantity                 INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  unit_amount_cents        INTEGER NOT NULL,
  amount_total_cents       INTEGER NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'usd',
  created_at               TEXT NOT NULL,
  expires_at               TEXT,
  paid_at                  TEXT,
  fulfilled_at             TEXT,
  review_reason            TEXT,
  UNIQUE (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS checkouts_breeder ON checkouts(breeder_id, created_at);
CREATE INDEX IF NOT EXISTS checkouts_created ON checkouts(created_at);

-- A payment record outlives the listing it paid for (migrations/0060), so there is no reference to
-- puppies, and puppy_name keeps which puppy it was once a closed account's puppies are removed.
CREATE TABLE IF NOT EXISTS checkout_items (
  checkout_id TEXT NOT NULL,
  puppy_id    TEXT NOT NULL,
  breeder_id  TEXT NOT NULL,
  puppy_name  TEXT,
  PRIMARY KEY (checkout_id, puppy_id),
  FOREIGN KEY (checkout_id, breeder_id) REFERENCES checkouts (id, breeder_id)
);

CREATE TABLE IF NOT EXISTS puppy_holds (
  puppy_id    TEXT PRIMARY KEY REFERENCES puppies(id),
  checkout_id TEXT NOT NULL REFERENCES checkouts(id),
  expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  stripe_payment_intent_id TEXT PRIMARY KEY,
  checkout_id              TEXT NOT NULL REFERENCES checkouts(id),
  stripe_charge_id         TEXT,
  amount_cents             INTEGER NOT NULL,
  status                   TEXT NOT NULL
                           CHECK (status IN ('succeeded','refunded','partially_refunded',
                                             'disputed','dispute_won','dispute_lost')),
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id     TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  livemode     INTEGER NOT NULL,
  received_at  TEXT NOT NULL,
  processed_at TEXT,
  result       TEXT
);
CREATE INDEX IF NOT EXISTS stripe_events_received ON stripe_events(received_at);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_state (
  id                   INTEGER PRIMARY KEY CHECK (id = 1),
  dirty                INTEGER NOT NULL DEFAULT 0,
  dirty_since          TEXT,
  generation           INTEGER NOT NULL DEFAULT 0,
  published_generation INTEGER NOT NULL DEFAULT 0,
  last_publish_at      TEXT,
  last_publish_sha     TEXT,
  last_error           TEXT
);

-- The last run of each scheduled job (lib/jobs.js), shown in the admin.
-- The breeder link check (lib/jobs.js, links), migration 0006.
CREATE TABLE IF NOT EXISTS link_checks (
  url           TEXT PRIMARY KEY,
  checked_at    TEXT NOT NULL,
  status        INTEGER,
  final_url     TEXT,
  verdict       TEXT NOT NULL CHECK (verdict IN ('ok', 'broken', 'home')),
  failing_since TEXT
);

CREATE TABLE IF NOT EXISTS job_runs (
  job         TEXT PRIMARY KEY,
  last_run_at TEXT NOT NULL,
  last_result TEXT,
  last_error  TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  at          TEXT NOT NULL,
  actor_type  TEXT NOT NULL CHECK (actor_type IN ('breeder','operator','system','stripe')),
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  before_json TEXT,
  after_json  TEXT
);
CREATE INDEX IF NOT EXISTS audit_entity ON audit_log(entity, entity_id);
-- The retention job finds activity older than two years by this (migrations/0060).
CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log(at);

CREATE TABLE IF NOT EXISTS email_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr     TEXT NOT NULL,
  template    TEXT NOT NULL,
  sent_at     TEXT NOT NULL,
  provider_id TEXT,
  status      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS email_log_to ON email_log(to_addr);

-- LOCAL SIMULATION ONLY. Mail bodies (which hold sign-in links) are kept only while
-- EMAIL_MODE is "log", so a developer can open them at /dev/mail. Production never writes
-- here, because a stored sign-in link is a live credential.
CREATE TABLE IF NOT EXISTS dev_mailbox (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr  TEXT NOT NULL,
  subject  TEXT NOT NULL,
  body     TEXT NOT NULL,
  link     TEXT,
  sent_at  TEXT NOT NULL
);

-- TEST ONLY. Which browser asked for mail to which address, so the open test portal's
-- mailbox shows each visitor only their own messages. The token is a random cookie.
CREATE TABLE IF NOT EXISTS dev_mailbox_owners (
  token      TEXT NOT NULL,
  email      TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (token, email)
);

-- LOCAL SIMULATION ONLY. The stand-in for Stripe's Checkout Session objects, used while
-- PAYMENTS_MODE is "sim". Shaped like the fields fulfillCheckout reads from Stripe.
CREATE TABLE IF NOT EXISTS sim_sessions (
  id                  TEXT PRIMARY KEY,
  status              TEXT NOT NULL CHECK (status IN ('open','complete','expired')),
  payment_status      TEXT NOT NULL CHECK (payment_status IN ('unpaid','paid')),
  client_reference_id TEXT NOT NULL,
  price_id            TEXT NOT NULL,
  quantity            INTEGER NOT NULL,
  unit_amount         INTEGER NOT NULL,
  amount_total        INTEGER NOT NULL,
  currency            TEXT NOT NULL,
  payment_intent      TEXT,
  customer_email      TEXT,
  success_url         TEXT NOT NULL,
  cancel_url          TEXT NOT NULL,
  created             INTEGER NOT NULL,
  expires_at          INTEGER NOT NULL
);

INSERT OR IGNORE INTO site_state (id) VALUES (1);
INSERT OR IGNORE INTO settings (key, value) VALUES
  -- 0 means a paid listing stays up until it is removed (Alex, 2026-10-04: one-time payment).
  -- Any other number is the days a payment buys, and turns on the expiry job and renewals.
  ('listing_days', '0'),
  ('warn_days', '7'),
  ('suspended_listings_visible', '0'),
  ('min_photos', '1'),
  ('terms_version', 'draft-2026-09-30'),
  ('fee_cents', '1499'),
  ('max_photos', '12'),
  -- migrations/0016. The registry list from Amber's Wix Add Puppy form, and the video limits.
  ('registries', 'AKC, AKC Canine Partners, APRI, ACA, CKC, UKC'),
  ('max_videos', '2'),
  ('video_max_seconds', '120'),
  -- migrations/0018. Where a photo that fails the quality check goes: breeder or review.
  ('photo_check_route', 'breeder'),
  -- migrations/0019. Days after adoption that a puppy page leaves the sitemap and becomes noindex.
  ('adopted_index_days', '30'),
  -- migrations/0030. Days with no new photo to the first email, the last email, offline and removed.
  ('inactivity_days', '28,35,42,84'),
  -- migrations/0033. The go-live date the photo clock waits for (Alex, 2026-10-19).
  ('photo_clock_start', '2026-11-01');

-- Plan P3.4. The terms start as Amber's placeholder, marked, both as the version on file and
-- as the first draft. The admin's Terms screen replaces the draft and publishes new versions.
INSERT OR IGNORE INTO terms_versions (version, body, updated_at, updated_by, published_at, published_by) VALUES
  ('draft-2026-09-30', 'REPLACE THIS: the listing terms, in Amber''s own words (build spec section 14). Nothing has been written here on her behalf.',
   '2026-09-30T00:00:00Z', 'setup', '2026-09-30T00:00:00Z', 'setup'),
  -- Amber's photo standard (2026-10-19, workplan A14) is in the draft, as migrations/0032 adds it on staging.
  ('draft', 'REPLACE THIS: the listing terms, in Amber''s own words (build spec section 14). Nothing has been written here on her behalf.' || char(10) || char(10) ||
   'Photo standard. Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.',
   '2026-09-30T00:00:00Z', 'setup', NULL, NULL);

-- What the public may see. The exporter reads only these views (spec 4.1).
DROP VIEW IF EXISTS public_documents;
DROP VIEW IF EXISTS public_parents;
DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;
DROP VIEW IF EXISTS public_breeders;

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
       -- Plan P4.3 (migrations/0004). The old Wix product slug, for the site's 301 map.
       pu.legacy_slug,
       -- migrations/0009. The coat type.
       pu.coat,
       -- migrations/0016. More puppy details.
       pu.registry, pu.markings, pu.health_notes, pu.vaccinations, pu.deworming, pu.disclosures, pu.deposit_url,
       -- migrations/0019. When it was marked adopted.
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

-- migrations/0050. Only parents on a public litter, and only public documents of public puppies and parents.
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


-- Puppy Connection's own mailing list (migrations/0011_mailing_list.sql). Nothing sends to it
-- until real email is set up. An unsubscribed row is kept so an import cannot re-add the person.
-- A 'contact' is a Wix contact who never subscribed, kept with no list email (migrations/0028).
CREATE TABLE IF NOT EXISTS subscribers (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name             TEXT,
  -- Empty once an address unsubscribes (migrations/0060, lib/retention.js).
  source           TEXT CHECK (source IS NULL OR source IN ('site','import','admin')),
  status           TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed','contact')),
  unsub_token      TEXT NOT NULL UNIQUE,
  created_at       TEXT NOT NULL,
  unsubscribed_at  TEXT,
  import_batch     TEXT
);
CREATE INDEX IF NOT EXISTS subscribers_status ON subscribers(status, created_at);

-- Sending to the mailing list (migrations/0012_campaigns.sql).
CREATE TABLE IF NOT EXISTS campaigns (
  id              TEXT PRIMARY KEY,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent')),
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  send_started_at TEXT,
  sent_at         TEXT,
  total           INTEGER NOT NULL DEFAULT 0,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0,
  -- migrations/0040. Subscribers only, or all contacts who have not unsubscribed.
  audience        TEXT NOT NULL DEFAULT 'subscribers' CHECK (audience IN ('subscribers','all'))
);

CREATE TABLE IF NOT EXISTS campaign_sends (
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id),
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  provider_id   TEXT,
  error         TEXT,
  sent_at       TEXT,
  PRIMARY KEY (campaign_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS campaign_sends_pending ON campaign_sends(campaign_id, status);

-- Launch checklist (workplan A17). The items Alex and Amber work through to go-live and the
-- Gate 1, 2 and 3 additions. Status, owner and parts live here, and the workplan keeps the
-- detail and evidence (ops/checklist.mjs compares the two). Nothing is ever deleted: an item or
-- part leaves the list by archived_at, and only Alex may archive. Every write is in audit_log
-- under entity checklist_item. ref is the workplan id and is never shown on the screen.
-- An area groups items that are handled together (migrations/0044), listed in the order that
-- unblocks the most. An item has at most one, and one with none groups under its section.
CREATE TABLE IF NOT EXISTS checklist_areas (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checklist_items (
  id            TEXT PRIMARY KEY,
  ref           TEXT UNIQUE,
  section       TEXT NOT NULL CHECK (section IN ('launch','gate1','gate2','gate3')),
  position      INTEGER NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  owner         TEXT NOT NULL CHECK (owner IN ('Alex','Amber','Luke','Claude')),
  status        TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','waiting','done')),
  waiting_on    TEXT,
  waiting_owner TEXT CHECK (waiting_owner IS NULL OR waiting_owner IN ('Alex','Amber','Luke','Claude')),
  done_at       TEXT,
  done_by       TEXT,
  archived_at   TEXT,
  archived_by   TEXT,
  created_at    TEXT NOT NULL,
  created_by    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  area          TEXT REFERENCES checklist_areas(id)
);
CREATE INDEX IF NOT EXISTS checklist_items_section ON checklist_items(section, position);
CREATE TABLE IF NOT EXISTS checklist_parts (
  id          TEXT PRIMARY KEY,
  item_id     TEXT NOT NULL REFERENCES checklist_items(id),
  position    INTEGER NOT NULL,
  title       TEXT NOT NULL,
  owner       TEXT NOT NULL CHECK (owner IN ('Alex','Amber','Luke','Claude')),
  done_at     TEXT,
  done_by     TEXT,
  archived_at TEXT,
  archived_by TEXT,
  created_at  TEXT NOT NULL,
  created_by  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS checklist_parts_item ON checklist_parts(item_id, position);
CREATE TABLE IF NOT EXISTS checklist_comments (
  id           TEXT PRIMARY KEY,
  item_id      TEXT NOT NULL REFERENCES checklist_items(id),
  author       TEXT NOT NULL,
  author_email TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS checklist_comments_item ON checklist_comments(item_id, created_at);
-- Which checklist names an operator address acts as. The shared address is 'Amber,Luke'.
CREATE TABLE IF NOT EXISTS checklist_signers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  names TEXT NOT NULL
);
-- end of launch checklist
-- Failure alerts, at most one of each kind an hour (migrations/0040, lib/mail.js alertOnce).
CREATE TABLE IF NOT EXISTS alert_state (
  kind         TEXT PRIMARY KEY,
  last_sent_at TEXT,
  held         INTEGER NOT NULL DEFAULT 0,
  held_since   TEXT,
  last_title   TEXT,
  last_detail  TEXT
);
