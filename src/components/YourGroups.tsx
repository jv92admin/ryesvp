'use client';

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';
import { CreateGroupModal } from '@/components/CreateGroupModal';

export interface YourGroupsRef {
  refresh: () => void;
}

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

export const YourGroups = forwardRef<YourGroupsRef>(function YourGroups(_, ref) {
  const [data, setData] = useState<GroupsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchGroups,
  }), [fetchGroups]);

  const handleCopyLink = async (group: GroupLink) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/g/${group.inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Friend Groups {hasGroups && <span className="text-gray-500 font-normal">({totalGroups})</span>}
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
        >
          + New
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {!hasGroups ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-2">No friend groups yet</p>
            <p className="text-xs text-gray-400">
              Create a group link to add multiple friends at once — everyone who joins becomes friends with each other.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Groups you created */}
            {data?.created.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isOwner={true}
                copiedId={copiedId}
                deletingId={deletingId}
                onCopy={() => handleCopyLink(group)}
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
                onCopy={() => handleCopyLink(group)}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  );
});

function GroupCard({
  group,
  isOwner,
  copiedId,
  deletingId,
  onCopy,
  onDelete,
}: {
  group: GroupLink;
  isOwner: boolean;
  copiedId: string | null;
  deletingId: string | null;
  onCopy: () => void;
  onDelete: () => void;
}) {
  // Get all members (owner + members list)
  const allMembers = [
    group.owner,
    ...group.members.map((m) => m.user).filter((u) => u.id !== group.owner.id),
  ];
  const memberCount = allMembers.length;
  
  const isCopied = copiedId === group.id;
  const isDeleting = deletingId === group.id;

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">{group.name}</h4>
            {isOwner && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                Created by you
              </span>
            )}
          </div>
          
          {/* Member avatars */}
          <div className="flex items-center gap-1 mt-2">
            <div className="flex -space-x-1.5">
              {allMembers.slice(0, 5).map((member) => {
                const avatarStyle = getAvatarStyle(member.id);
                const initials = getInitials(member.displayName, member.email);
                return (
                  <div
                    key={member.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium border-2 border-white"
                    style={avatarStyle}
                    title={getDisplayName(member.displayName, member.email)}
                  >
                    {initials}
                  </div>
                );
              })}
              {memberCount > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-medium border-2 border-white">
                  +{memberCount - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className={`p-2 rounded-lg transition-colors ${
              isCopied 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isCopied ? 'Copied!' : 'Copy invite link'}
          >
            {isCopied ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

