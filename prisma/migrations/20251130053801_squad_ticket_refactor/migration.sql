/*
  Warnings:

  - The values [NOT_BOUGHT,BUYING_OWN,BUYING_FOR_OTHERS] on the enum `SquadTicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `budget` on the `SquadMember` table. All the data in the column will be lost.
  - You are about to drop the column `buyingForCount` on the `SquadMember` table. All the data in the column will be lost.

*/

-- AlterEnum with data migration via USING clause
BEGIN;
CREATE TYPE "SquadTicketStatus_new" AS ENUM ('YES', 'MAYBE', 'NO', 'COVERED');
ALTER TABLE "public"."SquadMember" ALTER COLUMN "ticketStatus" DROP DEFAULT;
-- Convert old values to new values during type change:
-- NOT_BOUGHT -> MAYBE, BUYING_OWN -> YES, BUYING_FOR_OTHERS -> YES
ALTER TABLE "SquadMember" ALTER COLUMN "ticketStatus" TYPE "SquadTicketStatus_new" 
  USING (
    CASE "ticketStatus"::text
      WHEN 'NOT_BOUGHT' THEN 'MAYBE'
      WHEN 'BUYING_OWN' THEN 'YES'
      WHEN 'BUYING_FOR_OTHERS' THEN 'YES'
      ELSE 'MAYBE'
    END
  )::"SquadTicketStatus_new";
ALTER TYPE "SquadTicketStatus" RENAME TO "SquadTicketStatus_old";
ALTER TYPE "SquadTicketStatus_new" RENAME TO "SquadTicketStatus";
DROP TYPE "public"."SquadTicketStatus_old";
ALTER TABLE "SquadMember" ALTER COLUMN "ticketStatus" SET DEFAULT 'MAYBE';
COMMIT;

-- AlterTable
ALTER TABLE "SquadMember" DROP COLUMN "budget",
DROP COLUMN "buyingForCount",
ADD COLUMN     "coveredById" TEXT,
ALTER COLUMN "ticketStatus" SET DEFAULT 'MAYBE';

-- DropEnum
DROP TYPE "SquadBudget";

-- CreateTable
CREATE TABLE "SquadPriceGuide" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "label" TEXT,
    "priceMin" INTEGER NOT NULL,
    "priceMax" INTEGER,
    "source" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadPriceGuide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SquadPriceGuide_squadId_idx" ON "SquadPriceGuide"("squadId");

-- CreateIndex
CREATE INDEX "SquadMember_coveredById_idx" ON "SquadMember"("coveredById");

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_coveredById_fkey" FOREIGN KEY ("coveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPriceGuide" ADD CONSTRAINT "SquadPriceGuide_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadPriceGuide" ADD CONSTRAINT "SquadPriceGuide_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
