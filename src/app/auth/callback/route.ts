import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getUserByAuthId } from '@/db/users';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if user already exists in our database
      const existingUser = await getUserByAuthId(data.user.id);
      
      if (existingUser) {
        // Existing user - redirect through success page for client-side navigation
        // This ensures cookies are processed before loading the app
        const successUrl = new URL('/auth/success', requestUrl.origin);
        successUrl.searchParams.set('next', next);
        return NextResponse.redirect(successUrl);
      } else {
        // New user - redirect to invite-required page to complete signup
        // Pass the 'next' param so we can redirect after invite is entered
        const inviteUrl = new URL('/invite-required', requestUrl.origin);
        if (next !== '/') {
          inviteUrl.searchParams.set('next', next);
        }
        return NextResponse.redirect(inviteUrl);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}

