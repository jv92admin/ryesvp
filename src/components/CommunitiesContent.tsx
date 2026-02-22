'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CommunityCard } from '@/components/CommunityCard';
import { CreateCommunityModal } from '@/components/CreateCommunityModal';
import { CommunityInviteCard } from '@/components/CommunityInviteCard';

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
  isPublic: boolean;
  owner: User;
  _count: { members: number };
  eventStats?: { upcomingEvents: number; membersGoing: number };
};

type CommunityMembership = {
  id: string;
  listId: string;
  userId: string;
  status: string;
  list: {
    id: string;
    name: string;
    description: string | null;
    owner: User;
  };
};

type CommunitiesData = {
  communities: CommunityWithCount[];
  pendingInvitations: CommunityMembership[];
  pendingCount: number;
};

export function CommunitiesContent() {
  const [data, setData] = useState<CommunitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'communities' | 'invitations'>('communities');

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/communities');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch communities');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCreateCommunity = async (name: string, description: string) => {
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error('Failed to create community');
      await fetchCommunities();
      setShowCreateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create community');
    }
  };

  const handleAcceptInvitation = async (communityId: string) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/accept`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to accept invitation');
      await fetchCommunities();
    } catch (err) {
      console.error('Error accepting invitation:', err);
    }
  };

  const handleDeclineInvitation = async (communityId: string) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/decline`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to decline invitation');
      await fetchCommunities();
    } catch (err) {
      console.error('Error declining invitation:', err);
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--bg-surface)] p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('communities')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'communities'
              ? 'bg-[var(--bg-elevated)] text-[var(--lark-text-primary)]'
              : 'text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]'
          }`}
        >
          My Communities {data && data.communities.length > 0 && `(${data.communities.length})`}
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
            activeTab === 'invitations'
              ? 'bg-[var(--bg-elevated)] text-[var(--lark-text-primary)]'
              : 'text-[var(--lark-text-secondary)] hover:text-[var(--lark-text-primary)]'
          }`}
        >
          Invitations
          {data && data.pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {data.pendingCount}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)] mx-auto"></div>
          <p className="text-[var(--lark-text-secondary)] mt-4">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full px-4 py-3 text-sm font-medium text-[var(--lark-text-secondary)] bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                + Create New Community
              </button>

              {data.communities.length === 0 ? (
                <div className="text-center py-8 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                  <p className="text-[var(--lark-text-secondary)] mb-2">No communities yet.</p>
                  <p className="text-sm text-[var(--lark-text-muted)]">
                    Start one or get invited by a friend.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.communities.map((community) => (
                    <Link key={community.id} href={`/communities/${community.id}`}>
                      <CommunityCard community={community} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="space-y-3">
              {data.pendingInvitations.length === 0 ? (
                <div className="text-center py-8 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                  <p className="text-[var(--lark-text-secondary)]">No pending invitations</p>
                </div>
              ) : (
                data.pendingInvitations.map((invitation) => (
                  <CommunityInviteCard
                    key={invitation.id}
                    invitation={invitation}
                    onAccept={() => handleAcceptInvitation(invitation.listId)}
                    onDecline={() => handleDeclineInvitation(invitation.listId)}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCommunity}
        />
      )}
    </>
  );
}
