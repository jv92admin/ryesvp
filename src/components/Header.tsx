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
        {/* Lark Wordmark */}
        <div className="flex items-baseline gap-2.5">
          <Link href="/" className="flex items-center group">
            <span
              className="text-lg font-bold tracking-tight text-[var(--lark-text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Lark
            </span>
          </Link>
          <span className="text-[var(--border-visible)] text-xs select-none" aria-hidden="true">|</span>
          <span className="text-[var(--lark-text-muted)] text-xs tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            Nights start here.
          </span>
        </div>

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
