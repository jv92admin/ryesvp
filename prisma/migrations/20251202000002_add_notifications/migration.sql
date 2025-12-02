-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'ADDED_TO_PLAN', 'PLAN_CANCELLED', 'PLAN_MEMBER_JOINED', 'PLAN_MEMBER_LEFT', 'TICKET_COVERED_FOR_YOU', 'PLAN_MEETUP_CREATED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON "Notification" FOR SELECT
TO authenticated
USING ("recipientId" = (SELECT get_user_id()));

-- RLS Policy: Service role creates notifications (no INSERT policy for users)

-- RLS Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON "Notification" FOR UPDATE
TO authenticated
USING ("recipientId" = (SELECT get_user_id()))
WITH CHECK ("recipientId" = (SELECT get_user_id()));

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON "Notification" FOR DELETE
TO authenticated
USING ("recipientId" = (SELECT get_user_id()));

