-- Shadow Database Auth Stub
-- Creates stub auth schema/functions for Prisma shadow database compatibility
-- Production Supabase ignores this (auth schema already exists with real functions)

-- Create auth schema if it doesn't exist
-- Supabase already has this, so IF NOT EXISTS means production ignores it
CREATE SCHEMA IF NOT EXISTS auth;

-- Create stub auth.uid() function
-- Returns NULL in shadow DB, production uses real Supabase function
-- The OR REPLACE ensures this doesn't fail if function exists
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS text AS $$ 
  SELECT NULL::text; 
$$ LANGUAGE sql SECURITY DEFINER;

