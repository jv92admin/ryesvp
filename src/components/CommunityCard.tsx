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
    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-4 hover:border-[var(--border-visible)] transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--lark-text-primary)] font-bold text-lg">
          {community.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[var(--lark-text-primary)]">{community.name}</p>
          <p className="text-sm text-[var(--lark-text-secondary)]">
            {community._count.members} {community._count.members === 1 ? 'member' : 'members'}
            {stats && stats.upcomingEvents > 0 && (
              <span className="text-[var(--lark-text-primary)] ml-2">
                · {stats.upcomingEvents} {stats.upcomingEvents === 1 ? 'event' : 'events'} coming up
              </span>
            )}
          </p>
          {community.description && (
            <p className="text-sm text-[var(--lark-text-secondary)] mt-1 line-clamp-1">{community.description}</p>
          )}
        </div>
        <div className="text-[var(--lark-text-muted)]">
          →
        </div>
      </div>
    </div>
  );
}
