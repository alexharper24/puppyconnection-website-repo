-- Alex, 2026-11-05 (docs/batch-2026-11-05-selected-send.md). Two changes to the mailing list.
--
-- The mailing address Amber gave for the bottom of every list email, which the CAN-SPAM Act requires and without
-- which a send cannot start. Guarded so it never replaces an address already set in the admin.
--
-- A send to selected people. campaign_picks holds the people ticked on a draft, and campaigns.audience gains
-- 'selected' beside subscribers and all. A selected send reaches the picked people who are on the list or never
-- subscribed, and never anyone who unsubscribed. Changing the CHECK needs a table rebuild: the rows go to a plain
-- copy, the table is made again under its own name, and the rows come back, as migrations/0085 does. The rebuild is
-- one "-- group" so app/ops/d1-apply.mjs sends it with foreign keys deferred. A second run rebuilds the table again
-- with the same rows. Production held no campaigns and no sends on 2026-11-05.
-- Generated 2026-11-05T13:20:00Z.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-05T13:20:00Z', 'system', 'claude', 'settings.update', 'settings', 'mailing_address', json_object('value', NULL),
         json_object('value', 'PO Box 55, Milford, IN 46542', 'why', 'Amber via Alex 2026-11-05')
   WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'mailing_address' AND trim(value) != '');
INSERT INTO settings (key, value) SELECT 'mailing_address', 'PO Box 55, Milford, IN 46542'
   WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'mailing_address' AND trim(value) != '')
  ON CONFLICT (key) DO UPDATE SET value = excluded.value;

CREATE TABLE IF NOT EXISTS campaign_picks (
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id),
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id),
  picked_at     TEXT NOT NULL,
  PRIMARY KEY (campaign_id, subscriber_id)
);

PRAGMA defer_foreign_keys = true;
-- group
DROP TABLE IF EXISTS campaigns_copy;
CREATE TABLE campaigns_copy AS SELECT id, subject, body, status, created_by, created_at, updated_at, send_started_at, sent_at, total, sent_count, failed_count, audience FROM campaigns;
DROP TABLE campaigns;
CREATE TABLE campaigns (
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
  audience        TEXT NOT NULL DEFAULT 'subscribers' CHECK (audience IN ('subscribers','all','selected'))
);
INSERT INTO campaigns (id, subject, body, status, created_by, created_at, updated_at, send_started_at, sent_at, total, sent_count, failed_count, audience)
  SELECT id, subject, body, status, created_by, created_at, updated_at, send_started_at, sent_at, total, sent_count, failed_count, audience FROM campaigns_copy;
DROP TABLE campaigns_copy;
