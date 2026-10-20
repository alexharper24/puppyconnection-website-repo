-- 2026-10-19. Two launch items cleared by Alex on 2026-10-19. Run once on each database after a backup.
--
-- Failure alerts (launch workplan B10). One row per kind of alert, such as job:backup, publish,
-- build or stripe_webhook, holding when the last one went out and how many were held back since,
-- so a failure that repeats sends at most one alert an hour (lib/mail.js, alertOnce).
CREATE TABLE IF NOT EXISTS alert_state (
  kind         TEXT PRIMARY KEY,
  last_sent_at TEXT,
  held         INTEGER NOT NULL DEFAULT 0,
  held_since   TEXT,
  last_title   TEXT,
  last_detail  TEXT
);

-- A mailing list send to every contact (launch workplan C5). Alex decided the list works as a
-- mailing service, so an announcement can go to everyone who has not unsubscribed. Each send
-- records whom it went to: subscribers only, or all contacts (subscribed and never subscribed).
-- Unsubscribed addresses are left out of both.
ALTER TABLE campaigns ADD COLUMN audience TEXT NOT NULL DEFAULT 'subscribers' CHECK (audience IN ('subscribers','all'));
