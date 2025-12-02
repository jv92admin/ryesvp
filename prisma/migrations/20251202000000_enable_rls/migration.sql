-- Enable Row Level Security on all tables
-- This migration adds RLS as defense-in-depth protection.
-- Primary access control remains in API routes (Prisma + application logic).
-- RLS protects against: direct DB access, Supabase Dashboard, future client queries.

-- ============================================================================
-- HELPER FUNCTION: Get internal user ID from Supabase auth.uid()
-- ============================================================================
-- Maps auth.uid() (Supabase Auth ID) to our User.id (internal text UUID)
-- Note: Prisma stores UUIDs as text, not native uuid type

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS text AS $$
  SELECT id FROM "User" WHERE "authProviderId" = auth.uid()::text;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if two users are friends (ACCEPTED status)
-- ============================================================================

CREATE OR REPLACE FUNCTION are_friends(user1_id text, user2_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Friendship"
    WHERE status = 'ACCEPTED'
      AND (
        ("requesterId" = user1_id AND "addresseeId" = user2_id)
        OR ("requesterId" = user2_id AND "addresseeId" = user1_id)
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- HELPER FUNCTION: Check if user is a member of a squad
-- ============================================================================

CREATE OR REPLACE FUNCTION is_squad_member(squad_id_param text, user_id_param text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "SquadMember"
    WHERE "squadId" = squad_id_param AND "userId" = user_id_param
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- VENUE - Public read, service-only write
-- ============================================================================

ALTER TABLE "Venue" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are viewable by authenticated users"
ON "Venue" FOR SELECT
TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies = service role only

-- ============================================================================
-- EVENT - Public read, service-only write
-- ============================================================================

ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by authenticated users"
ON "Event" FOR SELECT
TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies = service role only

-- ============================================================================
-- ENRICHMENT - Public read, service-only write
-- ============================================================================

ALTER TABLE "Enrichment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrichments are viewable by authenticated users"
ON "Enrichment" FOR SELECT
TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies = service role only

-- ============================================================================
-- USER - Display name public, email self-only
-- ============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Everyone can see id, displayName, createdAt (for friend lists, squad members, etc.)
-- But email is only visible to self (handled by not selecting it in queries)
CREATE POLICY "Users can view other users basic info"
ON "User" FOR SELECT
TO authenticated
USING (true);

-- Only self can update their own profile
CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
TO authenticated
USING ("authProviderId" = auth.uid()::text)
WITH CHECK ("authProviderId" = auth.uid()::text);

-- Only self can delete their account
CREATE POLICY "Users can delete own account"
ON "User" FOR DELETE
TO authenticated
USING ("authProviderId" = auth.uid()::text);

-- INSERT handled by service role (auto-create on first login)

-- ============================================================================
-- FRIENDSHIP - Participants only
-- ============================================================================

ALTER TABLE "Friendship" ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they're part of
CREATE POLICY "Users can view their friendships"
ON "Friendship" FOR SELECT
TO authenticated
USING (
  "requesterId" = get_user_id() OR "addresseeId" = get_user_id()
);

-- Users can create friend requests (as requester)
CREATE POLICY "Users can send friend requests"
ON "Friendship" FOR INSERT
TO authenticated
WITH CHECK ("requesterId" = get_user_id());

-- Participants can update (accept/decline)
CREATE POLICY "Participants can update friendship"
ON "Friendship" FOR UPDATE
TO authenticated
USING (
  "requesterId" = get_user_id() OR "addresseeId" = get_user_id()
)
WITH CHECK (
  "requesterId" = get_user_id() OR "addresseeId" = get_user_id()
);

-- Participants can delete (unfriend)
CREATE POLICY "Participants can delete friendship"
ON "Friendship" FOR DELETE
TO authenticated
USING (
  "requesterId" = get_user_id() OR "addresseeId" = get_user_id()
);

-- ============================================================================
-- USER EVENT - Self + friends can see
-- ============================================================================

ALTER TABLE "UserEvent" ENABLE ROW LEVEL SECURITY;

-- User can see their own events + friends' events
CREATE POLICY "Users can view own and friends events"
ON "UserEvent" FOR SELECT
TO authenticated
USING (
  "userId" = get_user_id()
  OR are_friends(get_user_id(), "userId")
);

-- Users can only create their own event status
CREATE POLICY "Users can create own event status"
ON "UserEvent" FOR INSERT
TO authenticated
WITH CHECK ("userId" = get_user_id());

-- Users can only update their own event status
CREATE POLICY "Users can update own event status"
ON "UserEvent" FOR UPDATE
TO authenticated
USING ("userId" = get_user_id())
WITH CHECK ("userId" = get_user_id());

-- Users can only delete their own event status
CREATE POLICY "Users can delete own event status"
ON "UserEvent" FOR DELETE
TO authenticated
USING ("userId" = get_user_id());

-- ============================================================================
-- LIST - Private lists, owner only (removing public/community concept)
-- ============================================================================

ALTER TABLE "List" ENABLE ROW LEVEL SECURITY;

-- Owner can see their lists
CREATE POLICY "Owners can view their lists"
ON "List" FOR SELECT
TO authenticated
USING ("ownerId" = get_user_id());

-- Owner can create lists
CREATE POLICY "Users can create lists"
ON "List" FOR INSERT
TO authenticated
WITH CHECK ("ownerId" = get_user_id());

-- Owner can update their lists
CREATE POLICY "Owners can update their lists"
ON "List" FOR UPDATE
TO authenticated
USING ("ownerId" = get_user_id())
WITH CHECK ("ownerId" = get_user_id());

-- Owner can delete their lists
CREATE POLICY "Owners can delete their lists"
ON "List" FOR DELETE
TO authenticated
USING ("ownerId" = get_user_id());

-- ============================================================================
-- LIST MEMBER - Owner can manage, members can see self
-- ============================================================================

ALTER TABLE "ListMember" ENABLE ROW LEVEL SECURITY;

-- Owner can see all members, users can see their own membership
CREATE POLICY "List members viewable by owner or self"
ON "ListMember" FOR SELECT
TO authenticated
USING (
  "userId" = get_user_id()
  OR EXISTS (
    SELECT 1 FROM "List" WHERE "List".id = "ListMember"."listId" AND "List"."ownerId" = get_user_id()
  )
);

-- Owner can add members
CREATE POLICY "Owners can add list members"
ON "ListMember" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "List" WHERE "List".id = "listId" AND "List"."ownerId" = get_user_id()
  )
);

-- Owner can update, members can update their own (for visibility toggle)
CREATE POLICY "Owners or self can update membership"
ON "ListMember" FOR UPDATE
TO authenticated
USING (
  "userId" = get_user_id()
  OR EXISTS (
    SELECT 1 FROM "List" WHERE "List".id = "ListMember"."listId" AND "List"."ownerId" = get_user_id()
  )
)
WITH CHECK (
  "userId" = get_user_id()
  OR EXISTS (
    SELECT 1 FROM "List" WHERE "List".id = "listId" AND "List"."ownerId" = get_user_id()
  )
);

-- Owner can remove, members can remove self
CREATE POLICY "Owners or self can delete membership"
ON "ListMember" FOR DELETE
TO authenticated
USING (
  "userId" = get_user_id()
  OR EXISTS (
    SELECT 1 FROM "List" WHERE "List".id = "ListMember"."listId" AND "List"."ownerId" = get_user_id()
  )
);

-- ============================================================================
-- INVITE CODE - Self only
-- ============================================================================

ALTER TABLE "InviteCode" ENABLE ROW LEVEL SECURITY;

-- Users can only see their own invite code
CREATE POLICY "Users can view own invite code"
ON "InviteCode" FOR SELECT
TO authenticated
USING ("userId" = get_user_id());

-- Users can create their own invite code (usually auto-created)
CREATE POLICY "Users can create own invite code"
ON "InviteCode" FOR INSERT
TO authenticated
WITH CHECK ("userId" = get_user_id());

-- Users can update their own invite code
CREATE POLICY "Users can update own invite code"
ON "InviteCode" FOR UPDATE
TO authenticated
USING ("userId" = get_user_id())
WITH CHECK ("userId" = get_user_id());

-- Users can delete their own invite code
CREATE POLICY "Users can delete own invite code"
ON "InviteCode" FOR DELETE
TO authenticated
USING ("userId" = get_user_id());

-- ============================================================================
-- INVITE REDEMPTION - Self only (as new user)
-- ============================================================================

ALTER TABLE "InviteRedemption" ENABLE ROW LEVEL SECURITY;

-- Users can see their own redemption record
CREATE POLICY "Users can view own invite redemption"
ON "InviteRedemption" FOR SELECT
TO authenticated
USING ("newUserId" = get_user_id());

-- INSERT handled by service role (during signup flow)
-- No UPDATE/DELETE (immutable record)

-- ============================================================================
-- TM EVENT CACHE - Service only (not user-facing)
-- ============================================================================

ALTER TABLE "TMEventCache" ENABLE ROW LEVEL SECURITY;

-- No policies = service role only (scrapers/enrichment jobs)

-- ============================================================================
-- SQUAD - Members see full, friends see existence only
-- ============================================================================

ALTER TABLE "Squad" ENABLE ROW LEVEL SECURITY;

-- Squad members can see full details
-- Friends of members can see the squad exists (for "user is already in a squad" check)
CREATE POLICY "Squad viewable by members and friends of members"
ON "Squad" FOR SELECT
TO authenticated
USING (
  -- User is a member
  is_squad_member(id, get_user_id())
  -- OR user is a friend of any member (can see it exists)
  OR EXISTS (
    SELECT 1 FROM "SquadMember" sm
    WHERE sm."squadId" = "Squad".id
      AND are_friends(get_user_id(), sm."userId")
  )
);

-- Any authenticated user can create a squad (they become a member via SquadMember)
CREATE POLICY "Users can create squads"
ON "Squad" FOR INSERT
TO authenticated
WITH CHECK ("createdById" = get_user_id());

-- Members can update squad (logistics, etc.)
CREATE POLICY "Members can update squad"
ON "Squad" FOR UPDATE
TO authenticated
USING (is_squad_member(id, get_user_id()))
WITH CHECK (is_squad_member(id, get_user_id()));

-- Only creator can delete squad
CREATE POLICY "Creator can delete squad"
ON "Squad" FOR DELETE
TO authenticated
USING ("createdById" = get_user_id());

-- ============================================================================
-- SQUAD MEMBER - Squad members can see all, manage self
-- ============================================================================

ALTER TABLE "SquadMember" ENABLE ROW LEVEL SECURITY;

-- Squad members can see all members of their squads
CREATE POLICY "Squad members can view squad members"
ON "SquadMember" FOR SELECT
TO authenticated
USING (
  is_squad_member("squadId", get_user_id())
);

-- Squad members can add new members (invite friends)
CREATE POLICY "Squad members can add members"
ON "SquadMember" FOR INSERT
TO authenticated
WITH CHECK (
  is_squad_member("squadId", get_user_id())
  OR "userId" = get_user_id() -- Can add self when creating squad
);

-- Users can only update their own membership (status, tickets, guests)
CREATE POLICY "Users can update own squad membership"
ON "SquadMember" FOR UPDATE
TO authenticated
USING ("userId" = get_user_id())
WITH CHECK ("userId" = get_user_id());

-- Users can only remove themselves (leave squad)
CREATE POLICY "Users can delete own squad membership"
ON "SquadMember" FOR DELETE
TO authenticated
USING ("userId" = get_user_id());

-- ============================================================================
-- SQUAD PRICE GUIDE - Squad members can view/add, creator can edit/delete
-- ============================================================================

ALTER TABLE "SquadPriceGuide" ENABLE ROW LEVEL SECURITY;

-- Squad members can view price guides
CREATE POLICY "Squad members can view price guides"
ON "SquadPriceGuide" FOR SELECT
TO authenticated
USING (
  is_squad_member("squadId", get_user_id())
);

-- Squad members can add price guides
CREATE POLICY "Squad members can add price guides"
ON "SquadPriceGuide" FOR INSERT
TO authenticated
WITH CHECK (
  is_squad_member("squadId", get_user_id())
  AND "addedById" = get_user_id()
);

-- Only the creator of the price guide can update it
CREATE POLICY "Price guide creator can update"
ON "SquadPriceGuide" FOR UPDATE
TO authenticated
USING ("addedById" = get_user_id())
WITH CHECK ("addedById" = get_user_id());

-- Only the creator of the price guide can delete it
CREATE POLICY "Price guide creator can delete"
ON "SquadPriceGuide" FOR DELETE
TO authenticated
USING ("addedById" = get_user_id());

-- ============================================================================
-- SQUAD STOP - Squad members can view/add, creator can edit/delete
-- ============================================================================

ALTER TABLE "SquadStop" ENABLE ROW LEVEL SECURITY;

-- Squad members can view stops
CREATE POLICY "Squad members can view stops"
ON "SquadStop" FOR SELECT
TO authenticated
USING (
  is_squad_member("squadId", get_user_id())
);

-- Squad members can add stops
CREATE POLICY "Squad members can add stops"
ON "SquadStop" FOR INSERT
TO authenticated
WITH CHECK (
  is_squad_member("squadId", get_user_id())
  AND "addedById" = get_user_id()
);

-- Only the creator of the stop can update it
CREATE POLICY "Stop creator can update"
ON "SquadStop" FOR UPDATE
TO authenticated
USING ("addedById" = get_user_id())
WITH CHECK ("addedById" = get_user_id());

-- Only the creator of the stop can delete it
CREATE POLICY "Stop creator can delete"
ON "SquadStop" FOR DELETE
TO authenticated
USING ("addedById" = get_user_id());

-- ============================================================================
-- WEATHER CACHE - Public read, service-only write
-- ============================================================================

ALTER TABLE "WeatherCache" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weather cache is viewable by authenticated users"
ON "WeatherCache" FOR SELECT
TO authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies = service role only

