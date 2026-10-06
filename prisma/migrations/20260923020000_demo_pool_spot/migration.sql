-- Drop the named village from demo wave locations already stored in production.
UPDATE "Entry" SET "spot" = 'demo pool' WHERE "spot" = 'Boa Vista';
