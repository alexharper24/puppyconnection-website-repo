-- 2026-10-17. More puppy details and video (launch workplan A3). Every field is optional.
-- registry is one name from the registries setting, which starts as the list on Amber's Wix
-- Add Puppy form. The rest are the breeder's own words. deposit_url is the breeder's own deposit
-- page, because Puppy Connection never takes a deposit.
ALTER TABLE puppies ADD COLUMN registry TEXT;
ALTER TABLE puppies ADD COLUMN markings TEXT;
ALTER TABLE puppies ADD COLUMN health_notes TEXT;
ALTER TABLE puppies ADD COLUMN vaccinations TEXT;
ALTER TABLE puppies ADD COLUMN deworming TEXT;
ALTER TABLE puppies ADD COLUMN disclosures TEXT;
ALTER TABLE puppies ADD COLUMN deposit_url TEXT;

-- Videos a breeder uploads to a puppy, stored and played by Cloudflare Stream (lib/stream.js).
-- The browser sends the file straight to Stream, so it never passes through the Worker. A row
-- starts as uploading, becomes processing once the file is in, and ready once Stream can play
-- it. Only ready videos of public puppies reach the site.
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

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('registries', 'AKC, AKC Canine Partners, APRI, ACA, CKC, UKC'),
  ('max_videos', '2'),
  ('video_max_seconds', '120');

DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;
CREATE VIEW public_puppies AS
SELECT pu.id, pu.breeder_id, pu.litter_id, pu.slug, pu.name, pu.sex, pu.color,
       pu.price_cents, pu.deposit_cents, pu.description, pu.breeder_url, pu.includes_json,
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at,
       pu.legacy_slug, pu.coat,
       pu.registry, pu.markings, pu.health_notes, pu.vaccinations, pu.deworming, pu.disclosures, pu.deposit_url
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
