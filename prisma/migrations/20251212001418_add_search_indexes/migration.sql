-- Enable pg_trgm extension for fuzzy text search
-- Supabase has this extension available by default
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for fuzzy search on key text fields
-- These enable typo-tolerant search with relevance ranking

-- Event title search (primary search target)
CREATE INDEX idx_event_title_trgm ON "Event" USING GIN (title gin_trgm_ops);

-- Performer name search
CREATE INDEX idx_performer_name_trgm ON "Performer" USING GIN (name gin_trgm_ops);

-- Venue name search
CREATE INDEX idx_venue_name_trgm ON "Venue" USING GIN (name gin_trgm_ops);

-- Also add a regular index on Event.createdAt for "new listings" filter
-- (may already exist via Prisma, but ensure it's there for efficient filtering)
CREATE INDEX IF NOT EXISTS idx_event_created_at ON "Event" ("createdAt" DESC);
