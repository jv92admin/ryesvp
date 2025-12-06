-- Fix security warning: Set search_path on SECURITY DEFINER functions
-- This prevents potential schema injection attacks

-- Also enable RLS on Prisma's internal migrations table (service-role only)
-- NOTE: Commented out because it breaks Prisma's shadow database during migrate dev
-- This was already applied to production on Dec 2, 2025. Do not uncomment.
-- ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Fix helper function with search_path AND optimized auth.uid() call
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS text AS $$
  SELECT id FROM "User" WHERE "authProviderId" = (select auth.uid())::text;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

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
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_squad_member(squad_id_param text, user_id_param text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "SquadMember"
    WHERE "squadId" = squad_id_param AND "userId" = user_id_param
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================================
-- Fix User table policies: Optimize auth.uid() to not re-evaluate per row
-- Drop old policies and recreate with (select auth.uid()) pattern
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can delete own account" ON "User";

CREATE POLICY "Users can update own profile"
ON "User" FOR UPDATE
TO authenticated
USING ("authProviderId" = (select auth.uid())::text)
WITH CHECK ("authProviderId" = (select auth.uid())::text);

CREATE POLICY "Users can delete own account"
ON "User" FOR DELETE
TO authenticated
USING ("authProviderId" = (select auth.uid())::text);

