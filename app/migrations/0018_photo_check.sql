-- 2026-10-17. The photo quality check (launch workplan A9, lib/photocheck.js). Each photo a
-- breeder uploads starts as pending and is judged by a vision model on Workers AI. quality is
--   NULL       never checked: imported Wix photos, demo photos and photos an operator added
--   pending    uploaded and waiting for the check
--   pass       checked and fine
--   sent_back  the breeder was told what is wrong and asked to upload another
--   review     waiting in the admin's Photo review queue (photo_check_route review)
-- Only NULL and pass photos reach the site or are served publicly. A pending photo also counts
-- toward a listing's minimum, so a check a few seconds behind never blocks a payment.
ALTER TABLE photos ADD COLUMN quality TEXT CHECK (quality IN ('pending','pass','sent_back','review'));
ALTER TABLE photos ADD COLUMN quality_reasons TEXT;
ALTER TABLE photos ADD COLUMN quality_checked_at TEXT;
ALTER TABLE photos ADD COLUMN quality_note TEXT;
CREATE INDEX IF NOT EXISTS photos_quality ON photos(quality) WHERE quality IS NOT NULL;

-- breeder (the default, Alex 2026-10-17) or review.
INSERT OR IGNORE INTO settings (key, value) VALUES ('photo_check_route', 'breeder');
