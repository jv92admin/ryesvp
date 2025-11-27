type User = {
  id: string;
  email: string;
  displayName: string | null;
};

type CommunityWithCount = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: User;
  _count: { members: number };
  eventStats?: { upcomingEvents: number; membersGoing: number };
};

interface CommunityCardProps {
  community: CommunityWithCount;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const stats = community.eventStats;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {community.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{community.name}</p>
          <p className="text-sm text-gray-500">
            {community._count.members} {community._count.members === 1 ? 'member' : 'members'}
            {stats && stats.upcomingEvents > 0 && (
              <span className="text-green-600 ml-2">
                · {stats.upcomingEvents} {stats.upcomingEvents === 1 ? 'event' : 'events'} coming up
              </span>
            )}
          </p>
          {community.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{community.description}</p>
          )}
        </div>
        <div className="text-gray-400">
          →
        </div>
      </div>
    </div>
  );
}

