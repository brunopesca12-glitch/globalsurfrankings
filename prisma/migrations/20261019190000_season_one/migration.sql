-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN "walletNetwork" TEXT,
ADD COLUMN "walletAddress" TEXT;

-- Season 1 events. Existing rows are kept. best-small-wave is renamed in place.
UPDATE "Theme" AS theme
SET
  "name" = 'Best Small-Wave Performance',
  "namePt" = 'Best Small-Wave Performance',
  "note" = 'Waist-high maximum. Open and Junior only.'
FROM "Season" AS season
WHERE theme."seasonId" = season."id"
  AND season."vintage" = 2027
  AND theme."slug" = 'best-small-wave';

INSERT INTO "Theme" (
  "id", "seasonId", "slug", "name", "namePt", "finaleOn", "sortOrder",
  "open", "junior", "masters40", "masters50", "oceanOnly", "poolOnly", "proposed", "note"
)
SELECT
  'season1-' || row.slug,
  season."id",
  row.slug,
  row.name,
  row.name,
  row.finale::date,
  row.sort_order,
  row.open,
  row.junior,
  row.masters40,
  row.masters50,
  row.ocean_only,
  false,
  false,
  row.note
FROM "Season" AS season
CROSS JOIN (
  VALUES
    ('frontside', 'Frontside', '2027-07-31', 1, true, true, true, true, false, 'Point break or reef break.'),
    ('backside', 'Backside', '2027-08-15', 2, true, true, true, true, false, 'Point break or reef break.'),
    ('best-aerial', 'Best Aerial', '2027-09-10', 3, true, true, true, false, true, 'Ocean only. Not on the 50+ ranking.'),
    ('best-tube', 'Best Tube', '2027-09-30', 5, true, true, true, true, false, 'Closes with the season.'),
    ('biggest-paddle-in', 'Biggest Paddle-In Wave', '2027-06-30', 6, true, true, true, true, false, 'Paddle-in only.')
) AS row(slug, name, finale, sort_order, open, junior, masters40, masters50, ocean_only, note)
WHERE season."vintage" = 2027
ON CONFLICT ("seasonId", "slug") DO NOTHING;
