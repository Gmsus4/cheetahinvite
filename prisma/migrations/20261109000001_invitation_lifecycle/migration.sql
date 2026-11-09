ALTER TABLE "InvitationPayment" ADD COLUMN "renewalOfPaymentIntentId" TEXT;
CREATE INDEX "Event_expiresAt_idx" ON "Event"("expiresAt");
