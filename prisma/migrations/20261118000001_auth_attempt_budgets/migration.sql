CREATE TABLE "AuthAttemptBudget" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthAttemptBudget_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "AuthAttemptBudget_expiresAt_idx" ON "AuthAttemptBudget"("expiresAt");
