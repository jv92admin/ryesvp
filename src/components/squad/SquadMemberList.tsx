'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  onRefresh?: () => void;
}

// Status icon mapping
const STATUS_DISPLAY: Record<string, { icon: string; color: string }> = {
  IN: { icon: '✓', color: 'text-[var(--lark-text-primary)]' },
  THINKING: { icon: '?', color: 'text-[var(--lark-text-secondary)]' },
  OUT: { icon: '✗', color: 'text-[var(--lark-text-muted)]' },
};

// Ticket icon mapping
const TICKET_DISPLAY: Record<TicketStatus, { icon: string; color: string }> = {
  YES: { icon: '✓', color: 'text-[var(--accent)]' },
  MAYBE: { icon: '—', color: 'text-[var(--lark-text-muted)]' },
  NO: { icon: '—', color: 'text-[var(--lark-text-muted)]' },
  COVERED: { icon: '✓', color: 'text-[var(--accent)]' },
};

export function SquadMemberList({ squad, currentUserId, isOrganizer, onInvite, onRefresh }: SquadMemberListProps) {
  const router = useRouter();
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const { members } = squad;
  const isAlone = members.length === 1;

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this person from the plan?')) return;
    
    setRemovingUserId(userId);
    try {
      const res = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) throw new Error('Failed to remove member');
      
      // Use the refresh callback if available, otherwise fallback to router.refresh()
      if (onRefresh) {
        onRefresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Empty State - Only you in the plan */}
      {isAlone && onInvite && (
        <div className="bg-[var(--bg-surface)] border-2 border-dashed border-[var(--accent)]/40 rounded-xl p-6 text-center mb-3">
          <h3 className="font-bold text-[var(--lark-text-primary)] mb-1">Nights are better together.</h3>
          <p className="text-sm text-[var(--lark-text-secondary)] mb-4">
            Invite someone to join your plan.
          </p>
          <button
            onClick={onInvite}
            className="w-full px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent)] transition-colors"
          >
            Invite Friends
          </button>
        </div>
      )}

      {/* Column Headers */}
      <div className="flex items-center text-[10px] text-[var(--lark-text-muted)] uppercase tracking-wider px-1">
        <div className="flex-1">Member</div>
        <div className="w-10 text-center">Going</div>
        <div className="w-10 text-center">Ticket</div>
        {isOrganizer && <div className="w-6"></div>}
      </div>

      {/* Member List */}
      <div className="divide-y divide-[var(--border-subtle)]">
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
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0 hover:ring-2 hover:ring-[var(--accent)] hover:ring-offset-1 transition-shadow"
                style={getAvatarStyle(member.userId)}
                title={`View ${displayName}'s profile`}
              >
                {getInitials(member.user.displayName, member.user.email)}
              </Link>

              {/* Name + badges - clickable link to profile */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <Link 
                  href={`/users/${member.userId}`}
                  className="text-sm text-[var(--lark-text-primary)] truncate hover:text-[var(--accent)] transition-colors"
                >
                  {displayName}
                </Link>
                {member.isOrganizer && (
                  <span className="text-[9px] px-1 py-0.5 bg-[var(--bg-surface)] text-[var(--accent)] rounded flex-shrink-0">
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
                    className="text-[var(--accent)] text-[10px] font-medium"
                    title={`Covered by ${getDisplayName(coveredByMember.user.displayName, coveredByMember.user.email)}`}
                  >
                    ({getDisplayName(coveredByMember.user.displayName, coveredByMember.user.email).charAt(0)})
                  </span>
                ) : member.status === 'OUT' ? (
                  <span className="text-[var(--lark-text-muted)]">—</span>
                ) : (
                  ticketInfo.icon
                )}
              </div>

              {/* Remove button - only for organizer, not on self or other organizers */}
              {isOrganizer && member.userId !== currentUserId && !member.isOrganizer && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={removingUserId === member.userId}
                  className="w-6 text-center text-[var(--lark-text-muted)] hover:text-[var(--lark-text-primary)] transition-colors disabled:opacity-50"
                  title={`Remove ${displayName} from plan`}
                >
                  {removingUserId === member.userId ? '...' : '×'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite button - only show when there are already members */}
      {onInvite && !isAlone && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onInvite}
          fullWidth
          className="mt-2 text-[var(--accent)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
        >
          + Invite more friends
        </Button>
      )}
    </div>
  );
}
