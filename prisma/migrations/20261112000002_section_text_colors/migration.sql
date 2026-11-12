ALTER TABLE "Event" ALTER COLUMN "textColorMode" SET DEFAULT 'auto';
-- Before per-section colors, white and the default had identical behavior.
-- Preserve that appearance while making individual section colors available.
UPDATE "Event" SET "textColorMode" = 'auto' WHERE "textColorMode" = 'white';
