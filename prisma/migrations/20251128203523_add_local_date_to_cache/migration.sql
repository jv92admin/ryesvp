-- DropIndex
DROP INDEX "TMEventCache_venueSlug_startDateTime_idx";

-- AlterTable
ALTER TABLE "TMEventCache" ADD COLUMN     "localDate" TEXT;

-- CreateIndex
CREATE INDEX "TMEventCache_venueSlug_localDate_idx" ON "TMEventCache"("venueSlug", "localDate");
