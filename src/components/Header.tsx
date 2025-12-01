import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { getPendingRequestCount } from '@/db/friends';
import { RyesVPLogo, RyesVPWordmark } from './brand/RyesVPLogo';

export async function Header() {
  const user = await getCurrentUser();
  const friendRequests = user 
    ? await getPendingRequestCount(user.dbUser.id)
    : 0;

  return (
    <header className="bg-white border-b" style={{ borderColor: 'var(--brand-border)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Wordmark + Tagline */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 group">
            <RyesVPLogo size={36} />
            <RyesVPWordmark className="text-xl" />
          </Link>
          <span className="hidden md:inline text-gray-500 text-sm">
            <em className="font-semibold">See</em> what&apos;s happening. <em className="font-semibold">Go</em> with friends.
          </span>
        </div>
        
        <nav className="flex items-center gap-3">
          {user && (
            <>
              {/* Notification Bell */}
              <Link
                href="/notifications"
                className="relative p-1.5 text-gray-500 hover:text-[var(--brand-primary)] transition-colors"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {friendRequests > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--brand-primary)] rounded-full" />
                )}
              </Link>
              
              {/* Friends */}
              <Link
                href="/friends"
                className="relative text-sm font-medium text-gray-600 hover:text-[var(--brand-primary)] transition-colors"
              >
                Friends
                {friendRequests > 0 && (
                  <span 
                    className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white rounded-full bg-[var(--brand-primary)]"
                  >
                    {friendRequests}
                  </span>
                )}
              </Link>
            </>
          )}
          {user ? (
            <UserMenu 
              userId={user.dbUser.id}
              displayName={user.dbUser.displayName}
              email={user.supabaseUser.email}
            />
          ) : (
            <Link
              href="/login"
              className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

