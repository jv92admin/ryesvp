import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';
import { StartPlanButton } from './StartPlanButton';
import { RyesVPLogo, RyesVPWordmark } from './brand/RyesVPLogo';

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b sticky top-0 z-50" style={{ borderColor: 'var(--brand-border)' }}>
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
              {/* Start a Plan CTA */}
              <StartPlanButton variant="header" />
              
              {/* Notification Bell with Dropdown */}
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
              className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            >
              Get Started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

