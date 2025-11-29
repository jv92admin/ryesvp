/*
  Warnings:

  - You are about to drop the column `tmAdditionalInfo` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `tmDescription` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `tmPriceCurrency` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `tmPriceMax` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `tmPriceMin` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `tmPriceRanges` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `tmSource` on the `Enrichment` table. All the data in the column will be lost.
  - You are about to drop the column `additionalInfo` on the `TMEventCache` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `TMEventCache` table. All the data in the column will be lost.
  - You are about to drop the column `priceCurrency` on the `TMEventCache` table. All the data in the column will be lost.
  - You are about to drop the column `priceMax` on the `TMEventCache` table. All the data in the column will be lost.
  - You are about to drop the column `priceMin` on the `TMEventCache` table. All the data in the column will be lost.
  - You are about to drop the column `priceRanges` on the `TMEventCache` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `TMEventCache` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Enrichment" DROP COLUMN "tmAdditionalInfo",
DROP COLUMN "tmDescription",
DROP COLUMN "tmPriceCurrency",
DROP COLUMN "tmPriceMax",
DROP COLUMN "tmPriceMin",
DROP COLUMN "tmPriceRanges",
DROP COLUMN "tmSource";

-- AlterTable
ALTER TABLE "TMEventCache" DROP COLUMN "additionalInfo",
DROP COLUMN "description",
DROP COLUMN "priceCurrency",
DROP COLUMN "priceMax",
DROP COLUMN "priceMin",
DROP COLUMN "priceRanges",
DROP COLUMN "source";
