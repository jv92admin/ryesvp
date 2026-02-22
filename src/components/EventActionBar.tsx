'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SquadCreationModal } from './squad/SquadCreationModal';
import { SquadInviteModal } from './squad/SquadInviteModal';

interface EventActionBarProps {
  isLoggedIn: boolean;
  hasSquad: boolean;
  squadId?: string | null;
  hasFriendsGoing: boolean;
  event: {
    id: string;
    title: string;
    startDateTime: string;
    venue: { name: string };
  };
}

export function EventActionBar({
  isLoggedIn,
  hasSquad,
  squadId,
  hasFriendsGoing,
  event,
}: EventActionBarProps) {
  const [showCreation, setShowCreation] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [squadData, setSquadData] = useState<{
    id: string;
    eventId: string;
    members: { id: string; userId: string; user: { displayName: string | null; email: string } }[];
  } | null>(null);

  const isStateA = isLoggedIn && hasSquad;
  const isStateB = isLoggedIn && !hasSquad && hasFriendsGoing;
  const isStateC = isLoggedIn && !hasSquad && !hasFriendsGoing;

  const handleInvite = async () => {
    if (!squadId) return;
    try {
      const res = await fetch(`/api/squads/${squadId}`);
      const data = await res.json();
      setSquadData(data.squad);
      setShowInvite(true);
    } catch (e) {
      console.error('Failed to fetch squad:', e);
    }
  };

  const barWrapper = "fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-sm border-t border-[var(--border-subtle)]";
  const barInner = "max-w-3xl mx-auto px-4 py-3 flex items-center gap-3";
  const barPadding = { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' };
  const primaryBtn = "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] transition-colors";
  // State A: has plan — Invite Friends + Share Plan
  if (isStateA) {
    return (
      <>
        <div className={barWrapper}>
          <div className={barInner} style={barPadding}>
            <button onClick={handleInvite} className={primaryBtn}>
              Invite Friends
            </button>
          </div>
        </div>
        {showInvite && squadData && (
          <SquadInviteModal
            squad={squadData}
            isOpen={showInvite}
            onClose={() => setShowInvite(false)}
            onMemberAdded={() => {
              setShowInvite(false);
              window.location.reload();
            }}
          />
        )}
      </>
    );
  }

  // State B: friends going, no plan — Start Plan is the hero
  if (isStateB) {
    return (
      <>
        <div className={barWrapper}>
          <div className={barInner} style={barPadding}>
            <button onClick={() => setShowCreation(true)} className={primaryBtn}>
              Start Plan
            </button>
          </div>
        </div>
        {showCreation && (
          <SquadCreationModal
            event={event}
            isOpen={showCreation}
            onClose={() => setShowCreation(false)}
            onSquadCreated={() => {
              setShowCreation(false);
              window.location.reload();
            }}
          />
        )}
      </>
    );
  }

  // State C: discovery — Start Plan is the hero
  if (isStateC) {
    return (
      <>
        <div className={barWrapper}>
          <div className={barInner} style={barPadding}>
            <button onClick={() => setShowCreation(true)} className={primaryBtn}>
              Start Plan
            </button>
          </div>
        </div>
        {showCreation && (
          <SquadCreationModal
            event={event}
            isOpen={showCreation}
            onClose={() => setShowCreation(false)}
            onSquadCreated={() => {
              setShowCreation(false);
              window.location.reload();
            }}
          />
        )}
      </>
    );
  }

  // Logged out — Sign In is the hero
  if (!isLoggedIn) {
    return (
      <div className={barWrapper}>
        <div className={barInner} style={barPadding}>
          <Link href="/login" className={primaryBtn}>
            Sign In to Plan
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
