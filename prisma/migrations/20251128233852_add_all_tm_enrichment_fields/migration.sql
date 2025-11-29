-- AlterTable
ALTER TABLE "Enrichment" ADD COLUMN     "tmAdditionalInfo" TEXT,
ADD COLUMN     "tmDescription" TEXT,
ADD COLUMN     "tmInfo" TEXT,
ADD COLUMN     "tmPleaseNote" TEXT,
ADD COLUMN     "tmPriceRanges" JSONB,
ADD COLUMN     "tmPromoterId" TEXT,
ADD COLUMN     "tmPromoterName" TEXT,
ADD COLUMN     "tmSeatmapUrl" TEXT,
ADD COLUMN     "tmStatus" TEXT,
ADD COLUMN     "tmTicketLimit" INTEGER,
ADD COLUMN     "tmTimezone" TEXT;
