-- AlterTable
ALTER TABLE "Enrichment" ADD COLUMN     "tmEventName" TEXT,
ADD COLUMN     "tmPreferTitle" BOOLEAN NOT NULL DEFAULT false;
