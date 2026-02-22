import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { StartPlanButton } from './StartPlanButton';
import { HeaderScrollEffect } from './HeaderScrollEffect';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-[var(--bg-primary)] sticky top-0 z-50 border-b border-transparent transition-colors duration-200">
      <HeaderScrollEffect />
      <div className="max-w-6xl mx-auto px-[var(--screen-padding)] py-3 flex items-center justify-between">
        {/* Bird Mark + Lark Wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="24" height="20" viewBox="0 0 100 100" aria-hidden="true" className="text-[var(--lark-text-primary)]">
            <path d="M 15 65 Q 30 30, 50 45 Q 60 50, 70 35 Q 78 22, 88 18"
                  stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 15 65 Q 28 55, 45 58 Q 55 60, 68 52"
                  stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6"/>
          </svg>
          <span
            className="text-lg font-bold tracking-tight text-[var(--lark-text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Lark
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {user && (
            <>
              <StartPlanButton variant="header" />
              <NotificationBell />
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
              className="bg-[var(--accent)] text-[var(--text-inverse)] px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--accent-hover)]"
            >
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
