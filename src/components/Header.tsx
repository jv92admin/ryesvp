import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { getPendingRequestCount } from '@/db/friends';
import { getPendingInvitationCount } from '@/db/communities';

export async function Header() {
  const user = await getCurrentUser();
  const [friendRequests, communityInvites] = user 
    ? await Promise.all([
        getPendingRequestCount(user.dbUser.id),
        getPendingInvitationCount(user.dbUser.id),
      ])
    : [0, 0];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo + Tagline */}
        <div className="flex items-center gap-4">
          <Link href="/" className="group">
            <div className="p-[2px] rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-[10px]">
                <span className="text-2xl">🎟️</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-blue-700">
                  RyesVP
                </span>
              </div>
            </div>
          </Link>
          <span className="hidden sm:inline text-gray-500 text-base">
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
                  <span className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
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
                  <span className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

