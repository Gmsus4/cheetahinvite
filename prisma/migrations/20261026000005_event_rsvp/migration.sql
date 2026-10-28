CREATE TABLE "RsvpResponse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "attending" BOOLEAN NOT NULL,
  "companions" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RsvpResponse_companions_check" CHECK ("companions" BETWEEN 0 AND 5 AND ("attending" OR "companions" = 0)),
  CONSTRAINT "RsvpResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RsvpResponse_eventId_tokenHash_key" ON "RsvpResponse"("eventId", "tokenHash");
CREATE INDEX "RsvpResponse_eventId_createdAt_idx" ON "RsvpResponse"("eventId", "createdAt");
CREATE TABLE "RsvpSubmissionBudget" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RsvpSubmissionBudget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RsvpSubmissionBudget_eventId_expiresAt_idx" ON "RsvpSubmissionBudget"("eventId", "expiresAt");
