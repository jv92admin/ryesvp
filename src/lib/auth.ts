import { createClient } from '@/lib/supabase/server';
import { getUserByAuthId } from '@/db/users';
import { User } from '@prisma/client';
import { redirect } from 'next/navigation';

export interface AuthUser {
  supabaseUser: {
    id: string;
    email: string;
  };
  dbUser: User;
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
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

