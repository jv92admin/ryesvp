-- AlterTable
ALTER TABLE "Enrichment" ADD COLUMN     "tmSource" TEXT;

-- AlterTable
ALTER TABLE "TMEventCache" ADD COLUMN     "additionalInfo" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "priceRanges" JSONB,
ADD COLUMN     "promoterId" TEXT,
ADD COLUMN     "promoterName" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "spanMultipleDays" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketLimit" INTEGER,
ADD COLUMN     "timezone" TEXT;
