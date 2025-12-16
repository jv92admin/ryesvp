-- Add engagement tracking fields to User (replaces localStorage-based tracking)
ALTER TABLE "User" ADD COLUMN "lastVisitAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "firstEngagementAt" TIMESTAMP(3);

