BEGIN;
ALTER TABLE "Event" ADD COLUMN "privacy" TEXT NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "pinHash" TEXT,
  ADD COLUMN "privacyVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Event" ALTER COLUMN "privacy" SET DEFAULT 'UNSET';
ALTER TABLE "Event" ADD CONSTRAINT "Event_privacy_check" CHECK (
  "privacy" IN ('UNSET', 'PUBLIC', 'PRIVATE') AND ("privacy" <> 'PRIVATE' OR "pinHash" IS NOT NULL)
);
CREATE TABLE "InvitationAccessSession" (
  "tokenHash" TEXT PRIMARY KEY, "eventId" TEXT NOT NULL, "version" INTEGER NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvitationAccessSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InvitationAccessSession_eventId_expiresAt_idx" ON "InvitationAccessSession"("eventId", "expiresAt");
CREATE TABLE "InvitationPinBudget" (
  "key" TEXT PRIMARY KEY, "eventId" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvitationPinBudget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InvitationPinBudget_eventId_expiresAt_idx" ON "InvitationPinBudget"("eventId", "expiresAt");
COMMIT;
