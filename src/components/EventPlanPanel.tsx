'use client';

import { useState, useEffect } from 'react';
import { SquadInviteModal } from './squad/SquadInviteModal';
import { getDisplayName, getAvatarStyle, getInitials } from '@/lib/avatar';
import { useToast } from '@/contexts/ToastContext';
import { generateSharePlanText } from '@/lib/squadShareText';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SquadMember {
  id: string;
  userId: string;
  status: 'THINKING' | 'IN' | 'OUT';
  ticketStatus: 'YES' | 'MAYBE' | 'NO' | 'COVERED';
  coveredById: string | null;
  buyingForIds: string[];
  guestCount: number;
  isOrganizer: boolean;
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
}

interface Squad {
  id: string;
  eventId: string;
  createdById: string;
  meetTime: string | null;
  meetSpot: string | null;
  deadline: string | null;
  playlistUrl: string | null;
  event: {
    id: string;
    title: string;
    displayTitle: string;
    startDateTime: string;
    venue: {
      name: string;
    };
  };
  members: SquadMember[];
}

interface EventPlanPanelProps {
  squadId: string;
  eventId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'IN' as const, label: 'Yes' },
  { value: 'THINKING' as const, label: 'Maybe' },
  { value: 'OUT' as const, label: 'No' },
];

const TICKET_OPTIONS = [
  { value: 'YES' as const, label: 'Have / Getting' },
  { value: 'MAYBE' as const, label: 'Need' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventPlanPanel({ squadId, eventId }: EventPlanPanelProps) {
  const { showToast } = useToast();

  // Data state
  const [squad, setSquad] = useState<Squad | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showInvite, setShowInvite] = useState(false);
  const [copying, setCopying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [editingMeetup, setEditingMeetup] = useState(false);
  const [meetSpotDraft, setMeetSpotDraft] = useState('');
  const [meetTimeDraft, setMeetTimeDraft] = useState('');
  const [savingMeetup, setSavingMeetup] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchSquad = async () => {
    try {
      const res = await fetch(`/api/squads/${squadId}`);
      if (res.ok) {
        const data = await res.json();
        setSquad(data.squad);
        setCurrentUserId(data.currentUserId);
      }
    } catch (e) {
      console.error('Failed to fetch squad:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSquad();
  }, [squadId]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const currentMember = squad?.members.find(m => m.userId === currentUserId);
  const isOrganizer = currentMember?.isOrganizer ?? false;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleStatusChange = async (status: 'THINKING' | 'IN' | 'OUT') => {
    if (updatingStatus || currentMember?.status === status) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchSquad();
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTicketChange = async (ticketStatus: 'YES' | 'MAYBE') => {
    if (updatingTicket || currentMember?.ticketStatus === ticketStatus) return;
    setUpdatingTicket(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketStatus }),
      });
      if (res.ok) await fetchSquad();
    } catch (e) {
      console.error('Failed to update ticket status:', e);
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleMeetupEdit = () => {
    setMeetSpotDraft(squad?.meetSpot || '');
    setMeetTimeDraft(squad?.meetTime || '');
    setEditingMeetup(true);
  };

  const handleMeetupSave = async () => {
    setSavingMeetup(true);
    try {
      const res = await fetch(`/api/squads/${squadId}/meetup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetSpot: meetSpotDraft.trim() || null,
          meetTime: meetTimeDraft.trim() || null,
        }),
      });
      if (res.ok) {
        await fetchSquad();
        setEditingMeetup(false);
      }
    } catch (e) {
      console.error('Failed to update meetup:', e);
    } finally {
      setSavingMeetup(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this plan?`)) return;
    setRemovingMemberId(userId);
    try {
      const res = await fetch(`/api/squads/${squadId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        showToast({ message: `${name} removed from plan`, type: 'success' });
        await fetchSquad();
      }
    } catch (e) {
      console.error('Failed to remove member:', e);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this plan? You can rejoin later.')) return;
    try {
      const res = await fetch(`/api/squads/${squadId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to leave plan:', e);
    }
  };

  const handleShare = async () => {
    if (!squad || !currentUserId) return;
    const shareText = generateSharePlanText(squad, currentUserId);

    if (navigator.share) {
      try {
        await navigator.share({ title: squad.event.displayTitle, text: shareText });
        return;
      } catch { /* cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  // -------------------------------------------------------------------------
  // Loading & empty states
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-[var(--bg-surface)] rounded" />
        <div className="h-10 bg-[var(--bg-surface)] rounded-lg" />
        <div className="h-10 bg-[var(--bg-surface)] rounded-lg" />
        <div className="h-24 bg-[var(--bg-surface)] rounded-lg" />
      </div>
    );
  }

  if (!squad || !currentMember) return null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <div className="space-y-0">
        {/* Section header */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--lark-text-muted)] mb-4">
          Your Plan
        </h3>

        {/* ── Status controls ── */}
        <div className="flex items-center gap-3 pb-3">
          <span className="text-sm text-[var(--lark-text-secondary)] flex-shrink-0 w-14">Going?</span>
          <div className="flex gap-1.5 flex-1">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = currentMember.status === opt.value;
              let activeClasses = '';
              if (isActive) {
                if (opt.value === 'IN') activeClasses = 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)] border-[var(--border-visible)]';
                else if (opt.value === 'THINKING') activeClasses = 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] border-[var(--border-visible)]';
                else activeClasses = 'bg-[var(--bg-surface)] text-[var(--lark-text-secondary)] border-[var(--border-visible)]';
              }
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={updatingStatus}
                  className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isActive
                      ? activeClasses
                      : 'border-[var(--border-subtle)] text-[var(--lark-text-secondary)] hover:bg-[var(--bg-hover)]'
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Ticket status (only if not OUT) ── */}
        {currentMember.status !== 'OUT' && (
          <div className="flex items-center gap-3 pb-4">
            <span className="text-sm text-[var(--lark-text-secondary)] flex-shrink-0 w-14">Ticket?</span>
            <div className="flex gap-1.5 flex-1">
              {TICKET_OPTIONS.map((opt) => {
                const isActive = currentMember.ticketStatus === opt.value
                  || (opt.value === 'YES' && currentMember.ticketStatus === 'COVERED');
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleTicketChange(opt.value)}
                    disabled={updatingTicket || currentMember.ticketStatus === 'COVERED'}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isActive
                        ? 'bg-[var(--bg-surface)] text-[var(--lark-text-primary)] border-[var(--border-visible)]'
                        : 'border-[var(--border-subtle)] text-[var(--lark-text-secondary)] hover:bg-[var(--bg-hover)]'
                    } disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div className="border-t border-[var(--border-subtle)] pt-4">
          {/* ── Members list ── */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lark-text-muted)]">
              Members ({squad.members.length})
            </span>
          </div>

          <div className="space-y-2">
            {squad.members.map((member) => {
              const name = getDisplayName(member.user.displayName, member.user.email);
              const isMe = member.userId === currentUserId;
              const canRemove = isOrganizer && !member.isOrganizer && !isMe;

              return (
                <div key={member.id} className="flex items-center gap-2.5 py-1">
                  {/* Avatar */}
                  <Link href={`/users/${member.userId}`} className="flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                      style={getAvatarStyle(member.userId)}
                    >
                      {getInitials(member.user.displayName, member.user.email)}
                    </div>
                  </Link>

                  {/* Name + organizer badge */}
                  <Link href={`/users/${member.userId}`} className="flex-1 min-w-0">
                    <span className="text-sm text-[var(--lark-text-primary)] truncate block">
                      {isMe ? 'You' : name}
                      {member.isOrganizer && (
                        <span className="text-[10px] text-[var(--lark-text-muted)] ml-1">org</span>
                      )}
                    </span>
                  </Link>

                  {/* Status icon */}
                  <span className="flex-shrink-0 text-xs w-12 text-right">
                    {member.status === 'IN' && (
                      <span className="text-[var(--lark-text-primary)]">In</span>
                    )}
                    {member.status === 'THINKING' && (
                      <span className="text-[var(--lark-text-secondary)]">Maybe</span>
                    )}
                    {member.status === 'OUT' && (
                      <span className="text-[var(--lark-text-muted)]">Out</span>
                    )}
                  </span>

                  {/* Ticket icon */}
                  <span className="flex-shrink-0 w-5 text-center text-xs">
                    {(member.ticketStatus === 'YES' || member.ticketStatus === 'COVERED') ? (
                      <svg className="w-4 h-4 text-[var(--lark-text-secondary)] inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                      </svg>
                    ) : (
                      <span className="text-[var(--lark-text-muted)]">—</span>
                    )}
                  </span>

                  {/* Remove button (organizer only) */}
                  {canRemove ? (
                    <button
                      onClick={() => handleRemoveMember(member.userId, name)}
                      disabled={removingMemberId === member.userId}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[var(--lark-text-muted)] hover:text-[var(--status-need-ticket)] transition-colors disabled:opacity-50"
                      aria-label={`Remove ${name}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Invite inline link */}
          <button
            onClick={() => setShowInvite(true)}
            className="mt-3 text-sm text-[var(--lark-text-primary)] hover:underline transition-colors"
          >
            + Invite Friends
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
          {/* ── Meetup section ── */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lark-text-muted)]">
              Meetup
            </span>
            {!editingMeetup && (
              <button
                onClick={handleMeetupEdit}
                className="text-xs text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)] transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingMeetup ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--lark-text-muted)] mb-1 block">Where</label>
                <input
                  type="text"
                  value={meetSpotDraft}
                  onChange={(e) => setMeetSpotDraft(e.target.value)}
                  placeholder="e.g. Front entrance"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:outline-none focus:border-[var(--border-visible)]"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--lark-text-muted)] mb-1 block">When</label>
                <input
                  type="text"
                  value={meetTimeDraft}
                  onChange={(e) => setMeetTimeDraft(e.target.value)}
                  placeholder="e.g. 6:30 PM"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:outline-none focus:border-[var(--border-visible)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMeetupSave}
                  disabled={savingMeetup}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {savingMeetup ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingMeetup(false)}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg text-[var(--lark-text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {squad.meetSpot && (
                <div className="flex items-center gap-2 text-sm text-[var(--lark-text-secondary)]">
                  <svg className="w-4 h-4 text-[var(--lark-text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="font-medium">{squad.meetSpot}</span>
                </div>
              )}
              {squad.meetTime && (
                <div className="flex items-center gap-2 text-sm text-[var(--lark-text-secondary)]">
                  <svg className="w-4 h-4 text-[var(--lark-text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{squad.meetTime}</span>
                </div>
              )}
              {!squad.meetSpot && !squad.meetTime && (
                <p className="text-sm text-[var(--lark-text-muted)]">No meetup details yet</p>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
          {/* ── Action buttons ── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--lark-text-primary)] border border-[var(--border-visible)] hover:bg-[var(--bg-surface)] transition-colors"
            >
              Invite Friends
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 text-sm font-medium rounded-lg text-[var(--lark-text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              {copying ? 'Copied!' : 'Share Plan'}
            </button>
          </div>
        </div>

        {/* ── Leave plan ── */}
        <div className="pt-6">
          <button
            onClick={handleLeave}
            className="text-sm text-[var(--status-need-ticket)] hover:underline transition-colors"
          >
            Leave plan
          </button>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && squad && (
        <SquadInviteModal
          squad={{
            id: squad.id,
            eventId: squad.eventId,
            members: squad.members.map(m => ({
              id: m.id,
              userId: m.userId,
              user: { displayName: m.user.displayName, email: m.user.email },
            })),
          }}
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          onMemberAdded={() => fetchSquad()}
        />
      )}
    </>
  );
}
