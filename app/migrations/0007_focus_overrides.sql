-- 2026-10-07. Hand-set focus points for five lead photos. The phone cards crop each photo to a
-- 4:5 portrait around focus_x, and on these five the measured point follows the body, so the
-- crop clipped the head at the edge of the frame. Each value was checked against Wix's own
-- crop of the photo. ops/measure_photos.py keeps a cached photo's values, so a rerun leaves
-- these alone, and _harvest/data/framing.json carries the same values for the local seed.
UPDATE photos SET focus_x = 0.6  WHERE external_url = 'https://static.wixstatic.com/media/8d80ac_f00c67917ee9451d8a12729457e762ee~mv2.jpg';  -- Cap'n Crunch
UPDATE photos SET focus_x = 0.62 WHERE external_url = 'https://static.wixstatic.com/media/8d80ac_95885a55b66740bfb1203b118710de1a~mv2.jpeg'; -- Dixon
UPDATE photos SET focus_x = 0.66 WHERE external_url = 'https://static.wixstatic.com/media/8d80ac_a4ecfc3e44c14fd6b4281d56dcfdedf2f002.jpg';  -- Spencer
UPDATE photos SET focus_x = 0.62 WHERE external_url = 'https://static.wixstatic.com/media/8d80ac_d30245da701249058e424a56fec4a352~mv2.jpg';  -- Trooper
UPDATE photos SET focus_x = 0.6  WHERE external_url = 'https://static.wixstatic.com/media/8d80ac_460f0d8ef5604f7bbc727744f5461012~mv2.jpeg'; -- Kenneth
