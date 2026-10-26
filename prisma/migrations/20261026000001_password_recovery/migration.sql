ALTER TABLE "User"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "passwordResetHash" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_passwordResetHash_key" ON "User"("passwordResetHash");

CREATE TABLE "PasswordRecoveryLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PasswordRecoveryLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "PasswordRecoveryLimit_expiresAt_idx" ON "PasswordRecoveryLimit"("expiresAt");
