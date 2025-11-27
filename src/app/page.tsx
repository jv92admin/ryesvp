import { getEventsWithSocialSignals } from '@/db/events';
import { getAllVenues } from '@/db/venues';
import { getPrivateLists } from '@/db/lists';
import { getUserCommunities } from '@/db/communities';
import { EventListWithPagination } from '@/components/EventListWithPagination';
import { EventFilters } from '@/components/EventFilters';
import { Header } from '@/components/Header';
import { SetNameBanner } from '@/components/SetNameBanner';
import { SocialSidebar } from '@/components/SocialSidebar';
import { InviteBanner } from '@/components/InviteBanner';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

interface HomePageProps {
  searchParams: Promise<{
    venueId?: string;
    startDate?: string;
    endDate?: string;
    myEvents?: string;
    friendsGoing?: string;
    listId?: string;
    communityId?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const venues = await getAllVenues();
  const [lists, communities] = user 
    ? await Promise.all([
        getPrivateLists(user.dbUser.id),
        getUserCommunities(user.dbUser.id),
      ])
    : [[], []];
  
  // Get first page of events with social signals
  const events = await getEventsWithSocialSignals({
        venueId: params.venueId || undefined,
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        endDate: params.endDate ? new Date(params.endDate + 'T23:59:59') : undefined,
    myEvents: user ? params.myEvents === 'true' : false,
    friendsGoing: user ? params.friendsGoing === 'true' : false,
    listId: user ? params.listId || undefined : undefined,
    communityId: user ? params.communityId || undefined : undefined,
    userId: user?.dbUser.id || '',
    limit: PAGE_SIZE + 1, // Fetch one extra to check if more exist
      });
  
  const hasMore = events.length > PAGE_SIZE;
  const initialEvents = hasMore ? events.slice(0, -1) : events;

  return (
    <>
      <Header />
      {user && <SetNameBanner />}
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Invite Banner for logged-out users with ?ref= */}
          <InviteBanner isLoggedIn={!!user} />
          

          {/* Filters - Full Width */}
          <EventFilters 
            venues={venues} 
            lists={lists.map(l => ({ id: l.id, name: l.name }))}
            communities={communities.map(c => ({ id: c.id, name: c.name }))}
            showFriendsFilter={!!user}
          />

          {/* Two Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Social Sidebar - Shows first on mobile (via order), right column on desktop */}
            <aside className="order-first lg:order-last lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:scrollbar-thin">
                <SocialSidebar isLoggedIn={!!user} />
              </div>
            </aside>

            {/* Events List - Main Column */}
            <div className="flex-1 min-w-0 order-last lg:order-first">
              <EventListWithPagination
                initialEvents={initialEvents}
                initialHasMore={hasMore}
                filters={{
                  venueId: params.venueId,
                  startDate: params.startDate,
                  endDate: params.endDate,
                  myEvents: params.myEvents === 'true',
                  friendsGoing: params.friendsGoing === 'true',
                  listId: params.listId,
                  communityId: params.communityId,
                }}
              />
            </div>
            </div>
        </div>
      </main>
    </>
  );
}
