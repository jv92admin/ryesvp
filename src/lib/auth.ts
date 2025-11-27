import { createClient } from '@/lib/supabase/server';
import { createOrUpdateUser } from '@/db/users';
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
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    return null;
  }

  // Sync user to database (create if doesn't exist)
  const dbUser = await createOrUpdateUser({
    authProviderId: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.display_name || null,
  });

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

