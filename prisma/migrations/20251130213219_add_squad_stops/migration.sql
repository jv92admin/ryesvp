-- CreateTable
CREATE TABLE "SquadStop" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "time" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SquadStop_squadId_idx" ON "SquadStop"("squadId");

-- CreateIndex
CREATE INDEX "SquadStop_addedById_idx" ON "SquadStop"("addedById");

-- AddForeignKey
ALTER TABLE "SquadStop" ADD CONSTRAINT "SquadStop_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadStop" ADD CONSTRAINT "SquadStop_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
