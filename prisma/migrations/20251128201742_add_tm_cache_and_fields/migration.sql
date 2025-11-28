-- CreateTable
CREATE TABLE "TMEventCache" (
    "id" TEXT NOT NULL,
    "venueSlug" TEXT NOT NULL,
    "tmVenueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3),
    "url" TEXT,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "priceCurrency" TEXT,
    "onSaleStart" TIMESTAMP(3),
    "onSaleEnd" TIMESTAMP(3),
    "presales" JSONB,
    "imageUrl" TEXT,
    "attractionId" TEXT,
    "attractionName" TEXT,
    "genre" TEXT,
    "subGenre" TEXT,
    "segment" TEXT,
    "supportingActs" TEXT[],
    "externalLinks" JSONB,
    "status" TEXT,
    "seatmapUrl" TEXT,
    "pleaseNote" TEXT,
    "info" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TMEventCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TMEventCache_venueSlug_startDateTime_idx" ON "TMEventCache"("venueSlug", "startDateTime");

-- CreateIndex
CREATE INDEX "TMEventCache_tmVenueId_idx" ON "TMEventCache"("tmVenueId");

-- CreateIndex
CREATE INDEX "TMEventCache_fetchedAt_idx" ON "TMEventCache"("fetchedAt");
