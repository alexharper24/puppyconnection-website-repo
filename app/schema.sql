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

-- Plan P2.7. A breeder asking Puppy Connection to close their account. Nothing is deleted
-- here; an operator sees the request and marks it handled.
CREATE TABLE IF NOT EXISTS account_requests (
  id          TEXT PRIMARY KEY,
  breeder_id  TEXT NOT NULL REFERENCES breeders(id),
  kind        TEXT NOT NULL CHECK (kind IN ('close')),
  reason      TEXT,
  created_at  TEXT NOT NULL,
  withdrawn_at TEXT,
  resolved_at TEXT,
  resolved_by TEXT
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
  revoked_at   TEXT
);
CREATE INDEX IF NOT EXISTS sessions_breeder ON sessions(breeder_id);

CREATE TABLE IF NOT EXISTS people (
  email    TEXT PRIMARY KEY COLLATE NOCASE,
  name     TEXT NOT NULL,
  role     TEXT NOT NULL CHECK (role IN ('owner','staff')),
  added_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS breeds (
  id   TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE
);

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
  UNIQUE (id, breeder_id),
  FOREIGN KEY (litter_id, breeder_id) REFERENCES litters (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS puppies_breeder ON puppies(breeder_id);
CREATE INDEX IF NOT EXISTS puppies_litter ON puppies(litter_id);

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
  committed_at TEXT,
  created_at   TEXT NOT NULL,
  CHECK (r2_key IS NOT NULL OR external_url IS NOT NULL),
  FOREIGN KEY (puppy_id, breeder_id) REFERENCES puppies (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS photos_puppy ON photos(puppy_id, position);

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

CREATE TABLE IF NOT EXISTS checkout_items (
  checkout_id TEXT NOT NULL,
  puppy_id    TEXT NOT NULL,
  breeder_id  TEXT NOT NULL,
  PRIMARY KEY (checkout_id, puppy_id),
  FOREIGN KEY (checkout_id, breeder_id) REFERENCES checkouts (id, breeder_id),
  FOREIGN KEY (puppy_id, breeder_id)    REFERENCES puppies (id, breeder_id)
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

CREATE TABLE IF NOT EXISTS email_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr     TEXT NOT NULL,
  template    TEXT NOT NULL,
  sent_at     TEXT NOT NULL,
  provider_id TEXT,
  status      TEXT NOT NULL
);

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
  ('max_photos', '12');

-- What the public may see. The exporter reads only these views (spec 4.1).
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
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at
FROM puppies pu JOIN public_breeders pb ON pb.breeder_id = pu.breeder_id
WHERE pu.publication_state = 'published'
  AND pu.payment_state IN ('paid','comped')
  AND pu.operator_hold = 0
  AND (pu.expires_at IS NULL OR pu.expires_at > strftime('%Y-%m-%dT%H:%M:%SZ','now'));

CREATE VIEW public_litters AS
SELECT l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom_weight_lb,
       l.dad_weight_lb, l.description
FROM litters l
WHERE l.archived_at IS NULL
  AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.litter_id = l.id);
