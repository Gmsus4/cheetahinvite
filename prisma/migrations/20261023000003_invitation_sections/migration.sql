ALTER TABLE "Event"
ADD COLUMN "sections" JSONB NOT NULL DEFAULT '[]'::jsonb;
