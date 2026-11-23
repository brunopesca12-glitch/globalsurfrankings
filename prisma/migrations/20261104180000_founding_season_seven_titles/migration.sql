-- Founding Season 2027–28: seven titles, four divisions (Open and Masters 40+).
-- Data-only and non-destructive: no rows are deleted, no columns or enum values dropped.
-- Junior and Masters 50+ flags are switched off; existing entries keep their stored category.
-- Revert: set "endsOn"/"ageAsOf" back to 2027-09-30, restore the flags, and delete the 'season1-wave-pool' row if it has no entries.

UPDATE "Season"
SET "name" = 'Founding Season 2027–28',
    "endsOn" = DATE '2028-02-29',
    "ageAsOf" = DATE '2028-02-29'
WHERE "vintage" = 2027;

UPDATE "Theme" AS theme
SET "finaleOn" = DATE '2028-02-29',
    "open" = true,
    "masters40" = true,
    "junior" = false,
    "masters50" = false
FROM "Season" AS season
WHERE theme."seasonId" = season."id"
  AND season."vintage" = 2027
  AND theme."slug" IN ('best-tube', 'best-aerial', 'biggest-paddle-in', 'best-small-wave', 'frontside', 'backside');

UPDATE "Theme" AS theme
SET "note" = CASE theme."slug"
    WHEN 'best-tube' THEN 'Ocean. Point, reef or beach break.'
    WHEN 'best-aerial' THEN 'Ocean only.'
    WHEN 'biggest-paddle-in' THEN 'Big-wave title. Paddle-in only.'
    WHEN 'best-small-wave' THEN 'Waist-high maximum.'
    ELSE theme."note" END
FROM "Season" AS season
WHERE theme."seasonId" = season."id"
  AND season."vintage" = 2027
  AND theme."slug" IN ('best-tube', 'best-aerial', 'biggest-paddle-in', 'best-small-wave');

INSERT INTO "Theme" (
  "id", "seasonId", "slug", "name", "namePt", "finaleOn", "sortOrder",
  "open", "junior", "masters40", "masters50", "oceanOnly", "poolOnly", "proposed", "note"
)
SELECT
  'season1-wave-pool', season."id", 'wave-pool', 'Wave Pool', 'Wave Pool', DATE '2028-02-29', 7,
  true, false, true, false, false, true, false,
  'Wave pools only. US$ 20 verification toll, passed whole to the judging fund.'
FROM "Season" AS season
WHERE season."vintage" = 2027
ON CONFLICT ("seasonId", "slug") DO NOTHING;
