-- 2026-10-25. One person may manage several kennels with one sign-in (Alex, 2026-10-25), so the
-- Responsible Dog Breeder Network can manage each breeder it lists for with one address (launch
-- workplan A27).
--
-- breeder_members is rebuilt so an address is unique on each kennel instead of across every kennel.
-- The same address can then be a person on several kennels, and the main contact of one of them,
-- because breeders.email stays unique. It gains awaiting_accept, which holds a kennel back from a
-- person who already signs in elsewhere until they confirm it from their invitation. Every row
-- copied here starts at 0, because each one was added under the old one-kennel rule. Nothing refers
-- to breeder_members, so no other table moves.
--
-- sessions is rebuilt so breeder_id may be empty. A person on more than one kennel signs in once,
-- and the session has no kennel until they pick one on the Choose a kennel page. Nothing refers to
-- sessions. Every session row is copied, so nobody is signed out by this migration.
--
-- credentials and recovery_codes do not change, because a password and an authenticator have been
-- keyed by the email address since migrations/0055. credentials.breeder_id now records only the
-- kennel the person first set a password on.
--
-- Back up D1 first and confirm the export printed "Downloaded". Apply with ops/d1-apply.mjs, because
-- the rebuild needs PRAGMA defer_foreign_keys. Each group drops any half-built copy first, so a group
-- that failed can run again. Run the whole file once only, because a later run would set every
-- awaiting_accept back to 0 and open kennels that people have not confirmed yet.

PRAGMA defer_foreign_keys = true;

-- group
-- awaiting_accept is 1 while a person who already signs in to another kennel has not yet confirmed
-- this one from their invitation, with their current password or authenticator code.
DROP TABLE IF EXISTS breeder_members_new;
CREATE TABLE breeder_members_new (
  id          TEXT PRIMARY KEY,
  breeder_id  TEXT NOT NULL REFERENCES breeders(id),
  email       TEXT NOT NULL COLLATE NOCASE,
  name        TEXT,
  added_by    TEXT NOT NULL,
  added_at    TEXT NOT NULL,
  joined_at   TEXT,
  awaiting_accept INTEGER NOT NULL DEFAULT 0,
  UNIQUE (breeder_id, email)
);
INSERT INTO breeder_members_new (id, breeder_id, email, name, added_by, added_at, joined_at)
  SELECT id, breeder_id, email, name, added_by, added_at, joined_at FROM breeder_members;
DROP TABLE breeder_members;
ALTER TABLE breeder_members_new RENAME TO breeder_members;
CREATE INDEX IF NOT EXISTS breeder_members_breeder ON breeder_members(breeder_id);
CREATE INDEX IF NOT EXISTS breeder_members_email ON breeder_members(email);

-- group
DROP TABLE IF EXISTS sessions_new;
CREATE TABLE sessions_new (
  token_hash     TEXT PRIMARY KEY,
  breeder_id     TEXT REFERENCES breeders(id),
  created_at     TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  last_seen_at   TEXT NOT NULL,
  revoked_at     TEXT,
  email          TEXT COLLATE NOCASE,
  operator_email TEXT COLLATE NOCASE
);
INSERT INTO sessions_new (token_hash, breeder_id, created_at, expires_at, last_seen_at, revoked_at, email, operator_email)
  SELECT token_hash, breeder_id, created_at, expires_at, last_seen_at, revoked_at, email, operator_email FROM sessions;
DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;
CREATE INDEX IF NOT EXISTS sessions_breeder ON sessions(breeder_id);
CREATE INDEX IF NOT EXISTS sessions_email ON sessions(email);
