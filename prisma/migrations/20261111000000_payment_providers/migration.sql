ALTER TABLE "InvitationPayment" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'stripe', ADD COLUMN "providerCheckoutId" TEXT, ADD COLUMN "providerPaymentId" TEXT, ADD COLUMN "checkoutUrl" TEXT;
CREATE UNIQUE INDEX "InvitationPayment_providerCheckoutId_key" ON "InvitationPayment"("providerCheckoutId");
CREATE UNIQUE INDEX "InvitationPayment_providerPaymentId_key" ON "InvitationPayment"("providerPaymentId");
ALTER TABLE "InvitationPayment" ADD COLUMN "stripeOxxo" BOOLEAN NOT NULL DEFAULT false;
