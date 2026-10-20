-- 2026-10-19. The photo clock waits for go-live (Alex, 2026-10-19: "I need to set that to go live,
-- which is likely going to be November 1st. So I don't want the clock to run yet."). No listing
-- counts its four weeks from before photo_clock_start, so the first emails can go four weeks after
-- that date and nothing goes offline before six weeks after it. The date is on the admin's Settings
-- screen, and an empty value starts the clock at once.
INSERT INTO settings (key, value) VALUES ('photo_clock_start', '2026-11-01')
  ON CONFLICT (key) DO UPDATE SET value = excluded.value;
