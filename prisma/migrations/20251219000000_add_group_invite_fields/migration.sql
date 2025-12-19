-- Add group invite link fields to List model
ALTER TABLE "List" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "List" ADD COLUMN "inviteCode" TEXT;
ALTER TABLE "List" ADD COLUMN "autoFriend" BOOLEAN NOT NULL DEFAULT true;

-- Create unique index for invite codes
CREATE UNIQUE INDEX "List_inviteCode_key" ON "List"("inviteCode");

-- Create index for faster invite code lookups
CREATE INDEX "List_inviteCode_idx" ON "List"("inviteCode");

-- Add GROUP_MEMBER_JOINED to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'GROUP_MEMBER_JOINED';

