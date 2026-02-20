-- DropIndex
DROP INDEX "Event_startDateTime_idx";

-- DropIndex
DROP INDEX "UserEvent_eventId_idx";

-- CreateIndex
CREATE INDEX "Enrichment_eventId_status_idx" ON "Enrichment"("eventId", "status");

-- CreateIndex
CREATE INDEX "Event_startDateTime_status_idx" ON "Event"("startDateTime", "status");

-- CreateIndex
CREATE INDEX "Event_startDateTime_status_category_idx" ON "Event"("startDateTime", "status", "category");

-- CreateIndex
CREATE INDEX "UserEvent_eventId_status_idx" ON "UserEvent"("eventId", "status");
