-- CreateEnum
CREATE TYPE "PerformerType" AS ENUM ('ARTIST', 'TEAM', 'COMEDIAN', 'COMPANY', 'OTHER');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "performerId" TEXT;

-- CreateTable
CREATE TABLE "Performer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PerformerType" NOT NULL DEFAULT 'OTHER',
    "bio" TEXT,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "tags" TEXT[],
    "spotifyId" TEXT,
    "ticketmasterId" TEXT,
    "espnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Performer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPerformerFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPerformerFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Performer_slug_key" ON "Performer"("slug");

-- CreateIndex
CREATE INDEX "Performer_slug_idx" ON "Performer"("slug");

-- CreateIndex
CREATE INDEX "Performer_type_idx" ON "Performer"("type");

-- CreateIndex
CREATE INDEX "Performer_name_idx" ON "Performer"("name");

-- CreateIndex
CREATE INDEX "Performer_spotifyId_idx" ON "Performer"("spotifyId");

-- CreateIndex
CREATE INDEX "Performer_ticketmasterId_idx" ON "Performer"("ticketmasterId");

-- CreateIndex
CREATE INDEX "UserPerformerFollow_userId_idx" ON "UserPerformerFollow"("userId");

-- CreateIndex
CREATE INDEX "UserPerformerFollow_performerId_idx" ON "UserPerformerFollow"("performerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPerformerFollow_userId_performerId_key" ON "UserPerformerFollow"("userId", "performerId");

-- CreateIndex
CREATE INDEX "Event_performerId_idx" ON "Event"("performerId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPerformerFollow" ADD CONSTRAINT "UserPerformerFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPerformerFollow" ADD CONSTRAINT "UserPerformerFollow_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "Performer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
