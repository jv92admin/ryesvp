-- CreateEnum
CREATE TYPE "ListMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'LEFT');

-- CreateEnum
CREATE TYPE "ListRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListMember" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ListMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "ListRole" NOT NULL DEFAULT 'MEMBER',
    "invitedById" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "List_ownerId_idx" ON "List"("ownerId");

-- CreateIndex
CREATE INDEX "List_isPublic_idx" ON "List"("isPublic");

-- CreateIndex
CREATE INDEX "ListMember_listId_idx" ON "ListMember"("listId");

-- CreateIndex
CREATE INDEX "ListMember_userId_idx" ON "ListMember"("userId");

-- CreateIndex
CREATE INDEX "ListMember_status_idx" ON "ListMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ListMember_listId_userId_key" ON "ListMember"("listId", "userId");

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListMember" ADD CONSTRAINT "ListMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
