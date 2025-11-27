import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { getPendingRequestCount } from '@/db/friends';

export async function Header() {
  const user = await getCurrentUser();
  const pendingCount = user ? await getPendingRequestCount(user.dbUser.id) : 0;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          RyesVP
        </Link>
        
        <nav className="flex items-center gap-4">
          {user && (
            <Link
              href="/friends"
              className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Friends
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-3 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <UserMenu email={user.supabaseUser.email} />
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

