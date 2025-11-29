-- CreateEnum
CREATE TYPE "SquadMemberStatus" AS ENUM ('THINKING', 'IN', 'OUT');

-- CreateEnum
CREATE TYPE "SquadBudget" AS ENUM ('NO_PREFERENCE', 'UNDER_50', 'FIFTY_TO_100', 'OVER_100');

-- CreateEnum
CREATE TYPE "SquadTicketStatus" AS ENUM ('NOT_BOUGHT', 'BUYING_OWN', 'BUYING_FOR_OTHERS');

-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "meetTime" TIMESTAMP(3),
    "meetSpot" TEXT,
    "deadline" TIMESTAMP(3),
    "playlistUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadMember" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SquadMemberStatus" NOT NULL DEFAULT 'THINKING',
    "budget" "SquadBudget",
    "ticketStatus" "SquadTicketStatus" NOT NULL DEFAULT 'NOT_BOUGHT',
    "buyingForCount" INTEGER,
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Squad_eventId_idx" ON "Squad"("eventId");

-- CreateIndex
CREATE INDEX "Squad_createdById_idx" ON "Squad"("createdById");

-- CreateIndex
CREATE INDEX "SquadMember_userId_idx" ON "SquadMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadMember_squadId_userId_key" ON "SquadMember"("squadId", "userId");

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Squad" ADD CONSTRAINT "Squad_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
