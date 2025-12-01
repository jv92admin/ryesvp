import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { getPendingRequestCount } from '@/db/friends';
import { getPendingInvitationCount } from '@/db/communities';
import { RyesVPLogo, RyesVPWordmark } from './brand/RyesVPLogo';

export async function Header() {
  const user = await getCurrentUser();
  const [friendRequests, communityInvites] = user 
    ? await Promise.all([
        getPendingRequestCount(user.dbUser.id),
        getPendingInvitationCount(user.dbUser.id),
      ])
    : [0, 0];

  return (
    <header className="bg-white border-b" style={{ borderColor: 'var(--brand-border)' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Wordmark + Tagline */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <RyesVPLogo size={40} />
            <RyesVPWordmark className="text-2xl" />
          </Link>
          <span className="hidden md:inline text-gray-500 text-sm">
            <em className="font-semibold">See</em> what&apos;s happening. <em className="font-semibold">Go</em> with friends.
          </span>
        </div>
        
        <nav className="flex items-center gap-4">
          {user && (
            <>
              <Link
                href="/friends"
                className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Friends
                {friendRequests > 0 && (
                  <span 
                    className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white rounded-full"
                    style={{ backgroundColor: 'var(--brand-danger)' }}
                  >
                    {friendRequests}
                  </span>
                )}
              </Link>
              <Link
                href="/communities"
                className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Communities
                {communityInvites > 0 && (
                  <span 
                    className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white rounded-full"
                    style={{ backgroundColor: 'var(--brand-danger)' }}
                  >
                    {communityInvites}
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

