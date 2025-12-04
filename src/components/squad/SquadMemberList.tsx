'use client';

import Link from 'next/link';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import { Button } from '@/components/ui';

// Ticket status type (matches Prisma enum)
type TicketStatus = 'YES' | 'MAYBE' | 'NO' | 'COVERED';

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  ticketStatus: TicketStatus;
  coveredById: string | null;
  buyingForIds: string[];
  isOrganizer: boolean;
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface Squad {
  id: string;
  members: SquadMember[];
}

interface SquadMemberListProps {
  squad: Squad;
  currentUserId: string;
  isOrganizer: boolean;
  onInvite?: () => void;
}

// Status icon mapping
const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  IN: { icon: '✓', color: 'text-green-600' },
  THINKING: { icon: '?', color: 'text-amber-500' },
  OUT: { icon: '✗', color: 'text-red-400' },
};

// Ticket icon mapping
const TICKET_DISPLAY: Record<TicketStatus, { icon: string; color: string }> = {
  YES: { icon: '🎫', color: '' },
  MAYBE: { icon: '—', color: 'text-gray-400' },
  NO: { icon: '—', color: 'text-gray-400' },
  COVERED: { icon: '✓', color: 'text-[var(--brand-primary)]' },
};

export function SquadMemberList({ squad, currentUserId, isOrganizer, onInvite }: SquadMemberListProps) {
  const { members } = squad;

  return (
    <div className="space-y-2">
      {/* Column Headers */}
      <div className="flex items-center text-[10px] text-gray-400 uppercase tracking-wider px-1">
        <div className="flex-1">Member</div>
        <div className="w-10 text-center">Going</div>
        <div className="w-10 text-center">Ticket</div>
      </div>

      {/* Member List */}
      <div className="divide-y divide-gray-100">
        {members.map((member) => {
          const displayName = getDisplayName(member.user.displayName, member.user.email);
          const statusInfo = STATUS_DISPLAY[member.status];
          const ticketInfo = TICKET_DISPLAY[member.ticketStatus];
          const isCovered = member.ticketStatus === 'COVERED';
          const coveredByMember = isCovered 
            ? members.find(m => m.userId === member.coveredById)
            : null;

          return (
            <div
              key={member.id}
              className="flex items-center gap-2 py-2"
            >
              {/* Avatar - clickable link to profile */}
              <Link
                href={`/users/${member.userId}`}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0 hover:ring-2 hover:ring-[var(--brand-primary)] hover:ring-offset-1 transition-shadow"
                style={getAvatarStyle(member.userId)}
                title={`View ${displayName}'s profile`}
              >
                {getInitials(member.user.displayName, member.user.email)}
              </Link>

              {/* Name + badges - clickable link to profile */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <Link 
                  href={`/users/${member.userId}`}
                  className="text-sm text-gray-900 truncate hover:text-[var(--brand-primary)] transition-colors"
                >
                  {displayName}
                </Link>
                {member.isOrganizer && (
                  <span className="text-[9px] px-1 py-0.5 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] rounded flex-shrink-0">
                    Org
                  </span>
                )}
              </div>

              {/* Going status */}
              <div className={`w-10 text-center text-sm ${statusInfo.color}`}>
                {statusInfo.icon}
              </div>

              {/* Ticket status */}
              <div className={`w-10 text-center text-sm ${ticketInfo.color}`}>
                {isCovered && coveredByMember ? (
                  <span 
                    className="text-[var(--brand-primary)] text-[10px] font-medium"
                    title={`Covered by ${getDisplayName(coveredByMember.user.displayName, coveredByMember.user.email)}`}
                  >
                    ({getDisplayName(coveredByMember.user.displayName, coveredByMember.user.email).charAt(0)})
                  </span>
                ) : member.status === 'OUT' ? (
                  <span className="text-gray-300">—</span>
                ) : (
                  ticketInfo.icon
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite button */}
      {onInvite && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onInvite}
          fullWidth
          className="mt-2 text-[var(--brand-primary)] border-green-200 hover:bg-[var(--brand-primary-light)]"
        >
          + Invite friends
        </Button>
      )}
    </div>
  );
}
