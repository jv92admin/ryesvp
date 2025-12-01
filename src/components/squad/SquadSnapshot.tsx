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
      <h4 className="font-medium text-gray-900">Plan overview</h4>
      
      {/* Solo Plan Onboarding */}
      {members.length === 1 && (
        <div className="bg-[var(--brand-primary-light)] border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div>
              <h5 className="font-medium text-green-900 mb-1">You&apos;re the first one here!</h5>
              <p className="text-sm text-green-700">
                Use the <strong>Share Plan</strong> button to invite friends.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Member Status Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {members.length} invited
          </span>
          <div className="flex items-center gap-3 text-xs">
            {statusCounts.in > 0 && (
              <span className="text-green-700">
                {statusCounts.in} In
              </span>
            )}
            {statusCounts.thinking > 0 && (
              <span className="text-amber-700">
                {statusCounts.thinking} Thinking
              </span>
            )}
            {statusCounts.out > 0 && (
              <span className="text-red-700">
                {statusCounts.out} Out
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-gray-500">
          {committedMembers}/{totalIn} people In have tickets sorted
        </div>
      </div>

      {/* Ticket Summary */}
      {totalIn > 0 && (
        <div className="text-sm space-y-1">
          <div className="font-medium text-gray-700">Tickets:</div>
          <div className="text-gray-600 space-y-1">
            {ticketInfo.buyingOwn > 0 && (
              <div>🎫 {ticketInfo.buyingOwn} buying own tickets</div>
            )}
            {ticketInfo.buyingForOthers > 0 && (
              <div>🎫 {ticketInfo.buyingForOthers} buying for others</div>
            )}
            {ticketInfo.notBought > 0 && (
              <div>⏳ {ticketInfo.notBought} still need to buy</div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Ticket Buying */}
      {members.some(m => m.ticketStatus === 'BUYING_FOR_OTHERS' && (m.buyingForIds?.length || 0) > 0) && (
        <div className="text-sm space-y-2">
          <div className="font-medium text-gray-700">Ticket Coordination:</div>
          <div className="space-y-1">
            {members
              .filter(m => m.ticketStatus === 'BUYING_FOR_OTHERS' && (m.buyingForIds?.length || 0) > 0)
              .map((buyer) => {
                const buyingForMembers = members.filter(m => buyer.buyingForIds?.includes(m.userId));
                return (
                  <div key={buyer.id} className="text-gray-600 bg-[var(--brand-primary-light)] p-2 rounded">
                    <span className="font-medium">
                      {buyer.user.displayName || buyer.user.email.split('@')[0]}
                    </span>
                    <span className="text-gray-500"> is buying tickets for </span>
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
        <div className="font-medium text-gray-700 text-sm">Members:</div>
        <div className="space-y-1">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  {(member.user.displayName || member.user.email.split('@')[0]).charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-900">
                  {member.user.displayName || member.user.email.split('@')[0]}
                </span>
                {member.isOrganizer && (
                  <span className="text-xs px-1.5 py-0.5 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded">
                    Organizer
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  member.status === 'IN' 
                    ? 'bg-green-100 text-green-700'
                    : member.status === 'THINKING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {member.status === 'IN' ? '✅' : member.status === 'THINKING' ? '🤔' : '❌'}
                </span>
                
                {member.status === 'IN' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    member.ticketStatus === 'BUYING_FOR_OTHERS'
                      ? 'bg-green-100 text-green-700'
                      : member.ticketStatus === 'BUYING_OWN'
                      ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {member.ticketStatus === 'BUYING_FOR_OTHERS' 
                      ? '🎫👥'
                      : member.ticketStatus === 'BUYING_OWN'
                      ? '🎫'
                      : '⏳'
                    }
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Invite Friends Button */}
        {isOrganizer && onInviteFriends && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={onInviteFriends}
              fullWidth
              className="text-[var(--brand-primary)] border-green-200 hover:bg-[var(--brand-primary-light)]"
            >
              + Invite Friends
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
