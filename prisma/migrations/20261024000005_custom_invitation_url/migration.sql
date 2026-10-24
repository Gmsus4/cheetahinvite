ALTER TABLE "Event" ADD COLUMN "customSlug" VARCHAR(80);
CREATE UNIQUE INDEX "Event_ownerId_customSlug_key" ON "Event"("ownerId", "customSlug");
