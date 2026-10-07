-- Plan P4.3, 2026-10-07. Each photo gains its original size and a focus point, measured by
-- ops/measure_photos.py, so the generated site picks sharp landscape photos for breed cards and
-- crops around the puppy instead of the top edge of the frame. Run once on each database.
ALTER TABLE photos ADD COLUMN width INTEGER;
ALTER TABLE photos ADD COLUMN height INTEGER;
ALTER TABLE photos ADD COLUMN focus_x REAL;
ALTER TABLE photos ADD COLUMN focus_y REAL;
