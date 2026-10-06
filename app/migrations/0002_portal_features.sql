-- Plan P2.3, P2.5 and P2.7, 2026-10-05. Profile extras, view and click counts, and account
-- requests. schema.sql already has all of this for a new database. Run this once on a
-- database made before it, after a backup, and then run schema.sql so the public_breeders
-- view picks up the new columns. Running it twice fails on the duplicate columns, which is
-- harmless, because the tables use IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS breeder_breeds (
  breeder_id TEXT NOT NULL REFERENCES breeders(id),
  breed_id   TEXT NOT NULL REFERENCES breeds(id),
  PRIMARY KEY (breeder_id, breed_id)
);
CREATE TABLE IF NOT EXISTS puppy_stats (
  puppy_id TEXT NOT NULL REFERENCES puppies(id),
  day      TEXT NOT NULL,
  views    INTEGER NOT NULL DEFAULT 0,
  clicks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (puppy_id, day)
);
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
ALTER TABLE breeder_profiles ADD COLUMN kennel_key TEXT;
ALTER TABLE breeder_profiles ADD COLUMN facebook_url TEXT;
