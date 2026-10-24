ALTER TABLE "Event"
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "stripeCheckoutSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT;
CREATE UNIQUE INDEX "Event_stripeCheckoutSessionId_key" ON "Event"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Event_stripePaymentIntentId_key" ON "Event"("stripePaymentIntentId");
-- Existing publications were created without a payment flow. Keep them private
-- until a verified payment is recorded; preserve all invitation content.
UPDATE "Event" SET "status" = 'PENDING_PAYMENT' WHERE "status" = 'PUBLISHED' AND "paidAt" IS NULL;
