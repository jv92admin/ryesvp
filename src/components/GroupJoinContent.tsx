'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

type GroupMember = {
  id: string;
  displayName: string | null;
  email: string;
  isOwner: boolean;
};

type GroupInfo = {
  group: {
    id: string;
    name: string;
    memberCount: number;
  };
  members: GroupMember[];
  isLoggedIn: boolean;
  isMember: boolean;
  isOwner: boolean;
};

interface GroupJoinContentProps {
  code: string;
}

export function GroupJoinContent({ code }: GroupJoinContentProps) {
  const router = useRouter();
  const [data, setData] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<{
    success: boolean;
    message: string;
    newFriendships: number;
  } | null>(null);

  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch(`/api/groups/join/${code}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('This group link is invalid or has expired.');
          } else {
            setError('Failed to load group information.');
          }
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError('Failed to load group information.');
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/groups/join/${code}`, {
        method: 'POST',
      });
      const json = await res.json();
      
      if (!res.ok) {
        setError(json.error || 'Failed to join group');
        return;
      }
      
      setJoinResult({
        success: true,
        message: json.message,
        newFriendships: json.newFriendships,
      });
      
      // Redirect to friends page after a short delay
      setTimeout(() => {
        router.push('/friends');
      }, 2000);
    } catch {
      setError('Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Group Link</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Already a member state
  if (data.isMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re already a member!</h1>
          <p className="text-gray-600 mb-6">
            You&apos;re already part of <span className="font-medium">{data.group.name}</span>
          </p>
          <Link
            href="/friends"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            View Your Friends
          </Link>
        </div>
      </div>
    );
  }

  // Success state after joining
  if (joinResult?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the group!</h1>
          <p className="text-gray-600 mb-2">{joinResult.message}</p>
          {joinResult.newFriendships > 0 && (
            <p className="text-sm text-green-600 font-medium mb-6">
              🎉 {joinResult.newFriendships} new friend{joinResult.newFriendships > 1 ? 's' : ''} added!
            </p>
          )}
          <p className="text-sm text-gray-500">Redirecting to your friends...</p>
        </div>
      </div>
    );
  }

  // Main join UI
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--brand-primary)] to-emerald-500 p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Join {data.group.name}</h1>
          <p className="text-white/80 text-sm mt-1">{data.group.memberCount} member{data.group.memberCount > 1 ? 's' : ''}</p>
        </div>

        {/* Members */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            You&apos;ll become friends with everyone in this group:
          </p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            {data.members.slice(0, 8).map((member) => {
              const avatarStyle = getAvatarStyle(member.id);
              const initials = getInitials(member.displayName, member.email);
              const name = getDisplayName(member.displayName, member.email);
              
              return (
                <div key={member.id} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={avatarStyle}
                    title={name}
                  >
                    {initials}
                  </div>
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              );
            })}
            {data.members.length > 8 && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                  +{data.members.length - 8}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Actions */}
          {data.isLoggedIn ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full px-6 py-3 text-sm font-medium text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? 'Joining...' : 'Join Group'}
            </button>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/login?redirect=/g/${code}`}
                className="block w-full px-6 py-3 text-sm font-medium text-center text-white bg-[var(--brand-primary)] rounded-lg hover:bg-[var(--brand-primary-hover)] transition-colors"
              >
                Sign In to Join
              </Link>
              <p className="text-xs text-gray-500 text-center">
                Don&apos;t have an account? You&apos;ll create one when you sign in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

