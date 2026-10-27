ALTER TYPE "EventStatus" ADD VALUE 'SUSPENDED';
ALTER TYPE "EventStatus" ADD VALUE 'REFUNDED';
CREATE TYPE "InvitationPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
CREATE TABLE "InvitationPayment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "InvitationPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "livemode" BOOLEAN NOT NULL,
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeChargeId" TEXT,
  "checkoutExpiresAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "refundedAmount" INTEGER NOT NULL DEFAULT 0,
  "refundPendingAmount" INTEGER NOT NULL DEFAULT 0,
  "refunds" JSONB NOT NULL DEFAULT '[]',
  "disputes" JSONB NOT NULL DEFAULT '[]',
  "disputeStatus" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "InvitationPayment_stripeCheckoutSessionId_key" ON "InvitationPayment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "InvitationPayment_stripePaymentIntentId_key" ON "InvitationPayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "InvitationPayment_stripeChargeId_key" ON "InvitationPayment"("stripeChargeId");
CREATE INDEX "InvitationPayment_ownerId_createdAt_idx" ON "InvitationPayment"("ownerId", "createdAt");
CREATE INDEX "InvitationPayment_eventId_idx" ON "InvitationPayment"("eventId");
-- Existing sessions are reconciled with Stripe before reusing them. The API mode
-- is deliberately not inferred here: legacy records are corrected on first sync.
INSERT INTO "InvitationPayment" (
  "id", "ownerId", "eventId", "eventName", "amount", "currency", "status", "livemode",
  "stripeCheckoutSessionId", "stripePaymentIntentId", "checkoutExpiresAt", "paidAt", "expiresAt", "createdAt", "updatedAt"
) SELECT 'legacy:' || "id", "ownerId", "id", "name", 49900, 'mxn',
  CASE WHEN "paidAt" IS NULL THEN 'PENDING' ELSE 'PAID' END::"InvitationPaymentStatus", false,
  "stripeCheckoutSessionId", "stripePaymentIntentId", CURRENT_TIMESTAMP, "paidAt", "expiresAt", "createdAt", CURRENT_TIMESTAMP
  FROM "Event" WHERE "stripeCheckoutSessionId" IS NOT NULL;
