-- Launch workplan A24 to A26 (2026-10-24). Puppy Connection access, invitations, and sign-in by
-- password with an optional authenticator. Run once on each database after a backup; schema.sql
-- already carries all of it for a new database.
--
-- No breeder's access is turned on here. The workplan names nine breeders Amber manages today,
-- and the staging data does not say which nine (40 imported breeders have never signed in), so an
-- owner records each one in the admin with "Record existing management arrangement".

-- A24. Whether Puppy Connection may open the portal as this kennel, and who last set it, when and
-- how: 'breeder' (the breeder in the portal), 'existing_arrangement' (an operator recording the
-- arrangement from before launch) or 'operator' (an operator turning it off).
ALTER TABLE breeders ADD COLUMN manage_access INTEGER NOT NULL DEFAULT 0;
ALTER TABLE breeders ADD COLUMN manage_access_by TEXT;
ALTER TABLE breeders ADD COLUMN manage_access_at TEXT;
ALTER TABLE breeders ADD COLUMN manage_access_how TEXT;

-- A24. A portal session opened by an operator through the admin's Manage as this breeder. NULL on
-- every breeder's own session.
ALTER TABLE sessions ADD COLUMN operator_email TEXT COLLATE NOCASE;

-- A26. Each sign-in address's password and authenticator, keyed by the address so they follow the
-- person when Make main contact moves them. password_hash is "pbkdf2-sha256$<iterations>$<salt>$<hash>".
-- totp_secret is "v1:<iv>:<ciphertext>" under the TOTP_KEY Worker secret, or "plain:<base32>"
-- until that secret is set. totp_pending holds a secret during set-up, before one code confirms it.
CREATE TABLE IF NOT EXISTS credentials (
  email            TEXT PRIMARY KEY COLLATE NOCASE,
  breeder_id       TEXT NOT NULL REFERENCES breeders(id),
  password_hash    TEXT,
  password_set_at  TEXT,
  totp_secret      TEXT,
  totp_pending     TEXT,
  totp_enabled_at  TEXT,
  totp_last_step   INTEGER,
  totp_nudge_dismissed_at TEXT,
  updated_at       TEXT NOT NULL
);

-- A26. Ten one-time recovery codes per address with an authenticator, stored as SHA-256 only.
CREATE TABLE IF NOT EXISTS recovery_codes (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL COLLATE NOCASE,
  code_hash  TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at    TEXT
);
CREATE INDEX IF NOT EXISTS recovery_codes_email ON recovery_codes(email);

-- A24 to A26. One-time links and hand-overs, stored as SHA-256 only. invite (7 days, from the admin
-- or a breeder adding a person), reset (1 hour, Forgot password), verify (24 hours, a new breeder
-- proving their address before setting a password), mfa (5 minutes, between a right password and
-- the authenticator code) and handoff (2 minutes, the admin opening the portal as a kennel).
CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash     TEXT PRIMARY KEY,
  purpose        TEXT NOT NULL CHECK (purpose IN ('invite','reset','verify','mfa','handoff')),
  email          TEXT COLLATE NOCASE,
  breeder_id     TEXT REFERENCES breeders(id),
  operator_email TEXT COLLATE NOCASE,
  signup_name    TEXT,
  created_by     TEXT,
  ip             TEXT,
  created_at     TEXT NOT NULL,
  expires_at     TEXT NOT NULL,
  used_at        TEXT,
  tries          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS auth_tokens_email ON auth_tokens(email, purpose, created_at);

-- A26. Wrong passwords and wrong authenticator codes, counted per address and per network address.
CREATE TABLE IF NOT EXISTS signin_failures (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  ip    TEXT NOT NULL,
  kind  TEXT NOT NULL,
  at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS signin_failures_email ON signin_failures(email, at);
CREATE INDEX IF NOT EXISTS signin_failures_ip ON signin_failures(ip, at);
