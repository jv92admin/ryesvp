import { createClient } from '@/lib/supabase/server';
import { getUserByAuthId } from '@/db/users';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export interface AuthUser {
  supabaseUser: {
    id: string;
    email: string;
  };
  dbUser: User;
}

/** Thrown by requireAuthAPI when user is not authenticated */
export class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthRequiredError';
  }
}

/**
 * Get the current authenticated user (Supabase + DB user)
 * Returns null if not authenticated OR if user doesn't exist in our DB yet
 * (new users must complete invite flow before DB user is created)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    return null;
  }

  // Check if user exists in our database (don't auto-create)
  const dbUser = await getUserByAuthId(supabaseUser.id);

  if (!dbUser) {
    // User has Supabase auth but no DB account yet (hasn't completed invite flow)
    return null;
  }

  return {
    supabaseUser: {
      id: supabaseUser.id,
      email: supabaseUser.email,
    },
    dbUser,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use in page server components only (not API routes)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Require authentication for API routes - throws AuthRequiredError if not authenticated
 * Use in API route handlers instead of getCurrentUser() + manual 401 check
 */
export async function requireAuthAPI(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthRequiredError();
  }

  return user;
}

/**
 * Standard error handler for API routes
 * Handles AuthRequiredError (401) and generic errors (500)
 */
export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('API error:', error);
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Get optional user - returns null if not authenticated (doesn't redirect)
 * Use this for pages that work for both logged-in and logged-out users
 */
export async function getOptionalUser(): Promise<AuthUser | null> {
  return getCurrentUser();
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

