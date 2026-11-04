-- Display names only. Slugs and ids unchanged. Revert: set the names back to 'Frontside' / 'Backside'.
UPDATE "Theme" SET "name" = 'Frontside Lines', "namePt" = 'Frontside Lines' WHERE "slug" = 'frontside';
UPDATE "Theme" SET "name" = 'Backside Lines', "namePt" = 'Backside Lines' WHERE "slug" = 'backside';
