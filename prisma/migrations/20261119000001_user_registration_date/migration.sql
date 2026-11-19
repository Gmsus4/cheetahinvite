-- Historical accounts have no recorded registration date. Keep it unknown.
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "User_createdAt_id_idx" ON "User"("createdAt", "id");
