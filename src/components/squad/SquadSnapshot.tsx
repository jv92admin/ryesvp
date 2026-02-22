'use client';

import { Button } from '@/components/ui';

interface Squad {
  id: string;
  members: Array<{
    id: string;
    userId: string;
    status: 'THINKING' | 'IN' | 'OUT';
    budget: string | null;
    ticketStatus: 'NOT_BOUGHT' | 'BUYING_OWN' | 'BUYING_FOR_OTHERS';
    buyingForCount: number | null;
    buyingForIds: string[];
    isOrganizer: boolean;
    user: {
      displayName: string | null;
      email: string;
    };
  }>;
}

interface SquadSnapshotProps {
  squad: Squad;
  onInviteFriends?: () => void;
  isOrganizer?: boolean;
}

export function SquadSnapshot({ squad, onInviteFriends, isOrganizer }: SquadSnapshotProps) {
  const { members } = squad;

  // Calculate status counts
  const statusCounts = {
    thinking: members.filter(m => m.status === 'THINKING').length,
    in: members.filter(m => m.status === 'IN').length,
    out: members.filter(m => m.status === 'OUT').length,
  };

  // Calculate ticket info
  const ticketInfo = {
    notBought: members.filter(m => m.ticketStatus === 'NOT_BOUGHT').length,
    buyingOwn: members.filter(m => m.ticketStatus === 'BUYING_OWN').length,
    buyingForOthers: members.filter(m => m.ticketStatus === 'BUYING_FOR_OTHERS').length,
    totalTicketsBeingBought: members.reduce((total, m) => {
      if (m.ticketStatus === 'BUYING_OWN') return total + 1;
      if (m.ticketStatus === 'BUYING_FOR_OTHERS') return total + (m.buyingForCount || 1);
      return total;
    }, 0),
  };

  // Progress calculation (members who are "In" and have ticket situation handled)
  const committedMembers = members.filter(m =>
    m.status === 'IN' && m.ticketStatus !== 'NOT_BOUGHT'
  ).length;

  const totalIn = statusCounts.in;
  const progressPercentage = totalIn > 0 ? (committedMembers / totalIn) * 100 : 0;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-[var(--lark-text-primary)]">Plan overview</h4>

      {/* Solo Plan Onboarding */}
      {members.length === 1 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div>
              <h5 className="font-medium text-[var(--lark-text-primary)] mb-1">You&apos;re the first one here!</h5>
              <p className="text-sm text-[var(--lark-text-secondary)]">
                Use the <strong>Share Plan</strong> button to invite friends.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Member Status Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--lark-text-secondary)]">
            {members.length} invited
          </span>
          <div className="flex items-center gap-3 text-xs">
            {statusCounts.in > 0 && (
              <span className="text-[var(--lark-text-primary)]">
                {statusCounts.in} In
              </span>
            )}
            {statusCounts.thinking > 0 && (
              <span className="text-[var(--lark-text-secondary)]">
                {statusCounts.thinking} Thinking
              </span>
            )}
            {statusCounts.out > 0 && (
              <span className="text-red-400">
                {statusCounts.out} Out
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[var(--bg-surface)] rounded-full h-2">
          <div
            className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="text-xs text-[var(--lark-text-secondary)]">
          {committedMembers}/{totalIn} people In have tickets sorted
        </div>
      </div>

      {/* Ticket Summary */}
      {totalIn > 0 && (
        <div className="text-sm space-y-1">
          <div className="font-medium text-[var(--lark-text-primary)]">Tickets:</div>
          <div className="text-[var(--lark-text-secondary)] space-y-1">
            {ticketInfo.buyingOwn > 0 && (
              <div>{ticketInfo.buyingOwn} buying own tickets</div>
            )}
            {ticketInfo.buyingForOthers > 0 && (
              <div>{ticketInfo.buyingForOthers} buying for others</div>
            )}
            {ticketInfo.notBought > 0 && (
              <div>{ticketInfo.notBought} still need to buy</div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Ticket Buying */}
      {members.some(m => m.ticketStatus === 'BUYING_FOR_OTHERS' && (m.buyingForIds?.length || 0) > 0) && (
        <div className="text-sm space-y-2">
          <div className="font-medium text-[var(--lark-text-primary)]">Ticket Coordination:</div>
          <div className="space-y-1">
            {members
              .filter(m => m.ticketStatus === 'BUYING_FOR_OTHERS' && (m.buyingForIds?.length || 0) > 0)
              .map((buyer) => {
                const buyingForMembers = members.filter(m => buyer.buyingForIds?.includes(m.userId));
                return (
                  <div key={buyer.id} className="text-[var(--lark-text-secondary)] bg-[var(--bg-surface)] p-2 rounded">
                    <span className="font-medium">
                      {buyer.user.displayName || buyer.user.email.split('@')[0]}
                    </span>
                    <span className="text-[var(--lark-text-secondary)]"> is buying tickets for </span>
                    <span className="font-medium">
                      {buyingForMembers.map(m => m.user.displayName || m.user.email.split('@')[0]).join(', ')}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Member List */}
      <div className="space-y-2">
        <div className="font-medium text-[var(--lark-text-primary)] text-sm">Members:</div>
        <div className="space-y-1">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-medium text-[var(--lark-text-secondary)]">
                  {(member.user.displayName || member.user.email.split('@')[0]).charAt(0).toUpperCase()}
                </div>
                <span className="text-[var(--lark-text-primary)]">
                  {member.user.displayName || member.user.email.split('@')[0]}
                </span>
                {member.isOrganizer && (
                  <span className="text-xs px-1.5 py-0.5 bg-[var(--bg-surface)] text-[var(--accent)] rounded">
                    Organizer
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  member.status === 'IN'
                    ? 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)]'
                    : member.status === 'THINKING'
                    ? 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)]'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {member.status === 'IN' ? 'In' : member.status === 'THINKING' ? 'Thinking' : 'Out'}
                </span>

                {member.status === 'IN' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    member.ticketStatus === 'BUYING_FOR_OTHERS'
                      ? 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)]'
                      : member.ticketStatus === 'BUYING_OWN'
                      ? 'bg-[var(--bg-surface)] text-[var(--accent)]'
                      : 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)]'
                  }`}>
                    {member.ticketStatus === 'BUYING_FOR_OTHERS'
                      ? 'Buying for group'
                      : member.ticketStatus === 'BUYING_OWN'
                      ? 'Has ticket'
                      : 'Needs ticket'
                    }
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Invite Friends Button */}
        {isOrganizer && onInviteFriends && (
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button
              variant="secondary"
              size="sm"
              onClick={onInviteFriends}
              fullWidth
            >
              + Invite Friends
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
