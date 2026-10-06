-- Plan P6.2, 2026-10-05. The six-digit sign-in code beside the emailed link.
-- schema.sql already has these columns for a new database. Run this once on a database
-- made before them, after a backup. Running it twice fails on the duplicate column, which
-- is harmless.
ALTER TABLE login_tokens ADD COLUMN code_hash TEXT;
ALTER TABLE login_tokens ADD COLUMN browser_hash TEXT;
ALTER TABLE login_tokens ADD COLUMN code_tries INTEGER NOT NULL DEFAULT 0;
