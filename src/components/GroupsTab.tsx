'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import { CreateGroupModal } from '@/components/CreateGroupModal';

type GroupMember = {
  user: {
    id: string;
    displayName: string | null;
    email: string;
  };
};

type GroupLink = {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  owner: {
    id: string;
    displayName: string | null;
    email: string;
  };
  members: GroupMember[];
  _count: { members: number };
};

type GroupsData = {
  created: GroupLink[];
  joined: GroupLink[];
};

export function GroupsTab() {
  const [data, setData] = useState<GroupsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleShareLink = async (group: GroupLink) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/g/${group.inviteCode}`;
    
    const shareText = `Join ${group.name} on RyesVP! Everyone who joins becomes friends with each other so future plans are easier.

${inviteUrl}`;

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on RyesVP`,
          text: shareText,
        });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // Fall back to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(group.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error('Failed to copy link');
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Delete this group? Friends you made will stay friends, but the group link will stop working.')) {
      return;
    }
    
    setDeletingId(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    fetchGroups();
  };

  const totalGroups = (data?.created.length || 0) + (data?.joined.length || 0);
  const hasGroups = totalGroups > 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!hasGroups) {
    return (
      <>
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No friend groups yet</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
            Create a group link to add multiple friends at once. Everyone who joins becomes friends with each other — perfect for your crew.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Group Link
          </button>
        </div>

        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleGroupCreated}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Create New Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-4 py-3 text-sm font-medium text-[var(--brand-primary)] bg-[var(--brand-primary-light)] border-2 border-dashed border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Group Link
        </button>

        {/* Groups you created */}
        {data?.created.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            isOwner={true}
            copiedId={copiedId}
            deletingId={deletingId}
            isExpanded={expandedId === group.id}
            onToggleExpand={() => setExpandedId(expandedId === group.id ? null : group.id)}
            onShare={() => handleShareLink(group)}
            onDelete={() => handleDelete(group.id)}
          />
        ))}

        {/* Groups you joined */}
        {data?.joined.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            isOwner={false}
            copiedId={copiedId}
            deletingId={deletingId}
            isExpanded={expandedId === group.id}
            onToggleExpand={() => setExpandedId(expandedId === group.id ? null : group.id)}
            onShare={() => handleShareLink(group)}
            onDelete={() => {}}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </>
  );
}

function GroupCard({
  group,
  isOwner,
  copiedId,
  deletingId,
  isExpanded,
  onToggleExpand,
  onShare,
  onDelete,
}: {
  group: GroupLink;
  isOwner: boolean;
  copiedId: string | null;
  deletingId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const allMembers = [
    group.owner,
    ...group.members.map((m) => m.user).filter((u) => u.id !== group.owner.id),
  ];
  const memberCount = allMembers.length;
  
  const isCopied = copiedId === group.id;
  const isDeleting = deletingId === group.id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 truncate">{group.name}</h4>
            {isOwner && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                Created by you
              </span>
            )}
          </div>
          
          {/* Member avatars - clickable to expand */}
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex -space-x-1.5">
              {allMembers.slice(0, 5).map((member) => {
                const avatarStyle = getAvatarStyle(member.id);
                const initials = getInitials(member.displayName, member.email);
                return (
                  <div
                    key={member.id}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium border-2 border-white"
                    style={avatarStyle}
                    title={getDisplayName(member.displayName, member.email)}
                  >
                    {initials}
                  </div>
                );
              })}
              {memberCount > 5 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-medium border-2 border-white">
                  +{memberCount - 5}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onShare}
            className={`p-2 rounded-lg transition-colors ${
              isCopied 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isCopied ? 'Copied!' : 'Share invite link'}
          >
            {isCopied ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>
          
          {isOwner && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete group"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded member list */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            {allMembers.map((member) => {
              const avatarStyle = getAvatarStyle(member.id);
              const initials = getInitials(member.displayName, member.email);
              const displayName = getDisplayName(member.displayName, member.email);
              const isGroupOwner = member.id === group.owner.id;
              
              return (
                <Link
                  key={member.id}
                  href={`/users/${member.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={avatarStyle}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {displayName}
                  </span>
                  {isGroupOwner && (
                    <span className="text-xs text-gray-400">
                      Creator
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

