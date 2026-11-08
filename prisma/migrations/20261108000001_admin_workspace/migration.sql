-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "complimentaryAt" TIMESTAMP(3),
ADD COLUMN     "isExample" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ShowcaseExample" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "showInHero" BOOLEAN NOT NULL DEFAULT true,
    "showInCatalog" BOOLEAN NOT NULL DEFAULT true,
    "publishedContent" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowcaseExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "useCustomExamples" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceRevision" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'mxn',
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(240) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "PriceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtesyGrant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CourtesyGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "exampleSlug" VARCHAR(80) NOT NULL DEFAULT '',
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsBudget" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsBudget_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShowcaseExample_eventId_key" ON "ShowcaseExample"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowcaseExample_slug_key" ON "ShowcaseExample"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PriceRevision_effectiveAt_key" ON "PriceRevision"("effectiveAt");

-- CreateIndex
CREATE INDEX "PriceRevision_effectiveAt_idx" ON "PriceRevision"("effectiveAt");

-- CreateIndex
CREATE INDEX "CourtesyGrant_eventId_revokedAt_idx" ON "CourtesyGrant"("eventId", "revokedAt");

-- CreateIndex
CREATE INDEX "CourtesyGrant_ownerId_idx" ON "CourtesyGrant"("ownerId");

-- CreateIndex
CREATE INDEX "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key" ON "AnalyticsEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_kind_idx" ON "AnalyticsEvent"("createdAt", "kind");

-- CreateIndex
CREATE INDEX "AnalyticsBudget_expiresAt_idx" ON "AnalyticsBudget"("expiresAt");

-- AddForeignKey
ALTER TABLE "ShowcaseExample" ADD CONSTRAINT "ShowcaseExample_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bound operator-managed values and arbitrate concurrent courtesy grants.
ALTER TABLE "User" ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('USER', 'ADMIN'));
ALTER TABLE "PriceRevision" ADD CONSTRAINT "PriceRevision_amount_check" CHECK ("amount" BETWEEN 1000 AND 99999900 AND "currency" = 'mxn');
ALTER TABLE "ShowcaseExample" ADD CONSTRAINT "ShowcaseExample_position_check" CHECK ("position" BETWEEN 0 AND 9999);
CREATE UNIQUE INDEX "CourtesyGrant_one_active_event" ON "CourtesyGrant"("eventId") WHERE "revokedAt" IS NULL;
