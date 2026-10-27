CREATE TYPE "CloudinaryAssetState" AS ENUM ('UPLOADING', 'READY', 'DELETE_PENDING');

CREATE TABLE "CloudinaryAsset" (
    "publicId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT,
    "bytes" INTEGER NOT NULL,
    "state" "CloudinaryAssetState" NOT NULL DEFAULT 'UPLOADING',
    "expiresAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CloudinaryAsset_pkey" PRIMARY KEY ("publicId"),
    CONSTRAINT "CloudinaryAsset_bytes_check" CHECK ("bytes" >= 0)
);
CREATE INDEX "CloudinaryAsset_eventId_state_idx" ON "CloudinaryAsset"("eventId", "state");
CREATE INDEX "CloudinaryAsset_ownerId_idx" ON "CloudinaryAsset"("ownerId");
CREATE INDEX "CloudinaryAsset_state_expiresAt_idx" ON "CloudinaryAsset"("state", "expiresAt");
CREATE INDEX "CloudinaryAsset_state_nextAttemptAt_idx" ON "CloudinaryAsset"("state", "nextAttemptAt");

CREATE TABLE "ImageUploadBudget" (
    "key" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImageUploadBudget_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "ImageUploadBudget_ownerId_expiresAt_idx" ON "ImageUploadBudget"("ownerId", "expiresAt");
