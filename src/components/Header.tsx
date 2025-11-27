import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          RyesVP
        </Link>
        
        <nav className="flex items-center gap-4">
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

