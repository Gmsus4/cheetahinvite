ALTER TABLE "Event" ADD COLUMN "draftLastSavedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Existing drafts retain their last known activity; status updates never extend it again.
UPDATE "Event" SET "draftLastSavedAt" = "updatedAt";
CREATE INDEX "Event_draftLastSavedAt_idx" ON "Event"("draftLastSavedAt");
