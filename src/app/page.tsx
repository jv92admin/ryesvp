import { getEventsWithSocialSignals } from '@/db/events';
import { getPrivateLists } from '@/db/lists';
import { getUserCommunities } from '@/db/communities';
import { FilterStrip } from '@/components/discovery';
import { Header } from '@/components/Header';
import { SetNameBanner } from '@/components/SetNameBanner';
import { HomePageContent } from '@/components/HomePageContent';
import { InviteBanner } from '@/components/InviteBanner';
import { InviteRedemptionHandler } from '@/components/InviteRedemptionHandler';
import { OnboardingTips } from '@/components/OnboardingTips';
import { SignInTip } from '@/components/SignInTip';
import { OnboardingModal } from '@/components/OnboardingModal';
import { getCurrentUser } from '@/lib/auth';
import { EventCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface HomePageProps {
  searchParams: Promise<{
    venueId?: string;
    venueIds?: string;
    categories?: string;
    startDate?: string;
    endDate?: string;
    myEvents?: string;
    friendsGoing?: string;
    listId?: string;
    communityId?: string;
    // Discovery filters (Phase 1.6)
    q?: string;
    new?: string;
    presales?: string;
    when?: 'today' | 'thisWeek' | 'weekend';
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const [lists, communities] = user 
    ? await Promise.all([
        getPrivateLists(user.dbUser.id),
        getUserCommunities(user.dbUser.id),
      ])
    : [[], []];
  
  // Parse multi-select params
  const venueIds = params.venueIds ? params.venueIds.split(',').filter(Boolean) : undefined;
  const categories = params.categories 
    ? params.categories.split(',').filter(Boolean) as EventCategory[]
    : undefined;
  
  // Get first page of events with social signals
  const events = await getEventsWithSocialSignals({
    venueIds,
    categories,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate + 'T23:59:59') : undefined,
    myEvents: user ? params.myEvents === 'true' : false,
    friendsGoing: user ? params.friendsGoing === 'true' : false,
    listId: user ? params.listId || undefined : undefined,
    communityId: user ? params.communityId || undefined : undefined,
    userId: user?.dbUser.id || '',
    limit: PAGE_SIZE + 1, // Fetch one extra to check if more exist
    // Discovery filters (Phase 1.6)
    q: params.q || undefined,
    newListings: params.new === 'true',
    presales: params.presales === 'true',
    when: params.when || undefined,
  });
  
  const hasMore = events.length > PAGE_SIZE;
  const initialEvents = hasMore ? events.slice(0, -1) : events;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Invite Banner for logged-out users with ?ref= */}
          <InviteBanner isLoggedIn={!!user} />
          
          {/* Invite Redemption Handler - redeems invite after login */}
          {user && <InviteRedemptionHandler />}

          {/* Filter Strip - Instant apply, no Apply button */}
          <FilterStrip />

          {/* Onboarding Modal for first-time users */}
          {user && <OnboardingModal />}

          {/* Tips for users */}
          {user ? (
            <>
              <SetNameBanner />
              <OnboardingTips />
            </>
          ) : (
            <SignInTip />
          )}

          {/* Home Page Content with Conditional Layout */}
          <HomePageContent
            initialEvents={initialEvents}
            initialHasMore={hasMore}
            isLoggedIn={!!user}
            filters={{
              venueIds: params.venueIds,
              categories: params.categories,
              startDate: params.startDate,
              endDate: params.endDate,
              myEvents: params.myEvents === 'true',
              friendsGoing: params.friendsGoing === 'true',
              listId: params.listId,
              communityId: params.communityId,
              // Discovery filters (Phase 1.6)
              q: params.q,
              newListings: params.new === 'true',
              presales: params.presales === 'true',
              when: params.when,
            }}
          />
        </div>
      </main>
    </>
  );
}
