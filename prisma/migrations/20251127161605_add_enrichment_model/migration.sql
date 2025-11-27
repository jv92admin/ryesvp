-- CreateEnum
CREATE TYPE "EnrichmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "Enrichment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "kgEntityId" TEXT,
    "kgName" TEXT,
    "kgDescription" TEXT,
    "kgBio" TEXT,
    "kgImageUrl" TEXT,
    "kgWikiUrl" TEXT,
    "kgTypes" TEXT[],
    "kgScore" DOUBLE PRECISION,
    "spotifyId" TEXT,
    "spotifyName" TEXT,
    "spotifyUrl" TEXT,
    "spotifyGenres" TEXT[],
    "spotifyPopularity" INTEGER,
    "spotifyImageUrl" TEXT,
    "inferredCategory" "EventCategory",
    "categoryUpdated" BOOLEAN NOT NULL DEFAULT false,
    "status" "EnrichmentStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrichment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrichment_eventId_key" ON "Enrichment"("eventId");

-- CreateIndex
CREATE INDEX "Enrichment_status_idx" ON "Enrichment"("status");

-- CreateIndex
CREATE INDEX "Enrichment_kgEntityId_idx" ON "Enrichment"("kgEntityId");

-- CreateIndex
CREATE INDEX "Enrichment_spotifyId_idx" ON "Enrichment"("spotifyId");

-- AddForeignKey
ALTER TABLE "Enrichment" ADD CONSTRAINT "Enrichment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
