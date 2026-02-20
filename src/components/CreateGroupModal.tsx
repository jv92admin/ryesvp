'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateGroupModal({ onClose, onCreated }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [defaultName, setDefaultName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's display name for default group name
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          const displayName = data.user?.displayName || data.user?.email?.split('@')[0] || 'My';
          setDefaultName(`${displayName}'s Group`);
        }
      } catch {
        setDefaultName("My Group");
      }
    }
    fetchUser();
    inputRef.current?.focus();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create group');
        return;
      }
      
      const data = await res.json();
      setInviteUrl(data.inviteUrl);
    } catch {
      setError('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => {
        onCreated();
      }, 1500);
    } catch {
      console.error('Failed to copy');
    }
  };

  // Success state - show link to copy
  if (inviteUrl) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()} size="sm">
        <DialogBody>
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--signal-going-light)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--signal-going)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Group Created!
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Share this link with your friends. Everyone who joins becomes friends with each other so future plans are easier.
            </p>
          </div>

          <div className="bg-[var(--surface-inset)] rounded-lg p-3 flex items-center gap-2 mb-4">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-[var(--text-secondary)] outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                copied
                  ? 'bg-[var(--signal-going-light)] text-[var(--signal-going)]'
                  : 'bg-[var(--action-primary)] text-[var(--action-primary-text)] hover:bg-[var(--action-primary-hover)]'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <button
            onClick={onCreated}
            className="w-full py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Done
          </button>
        </DialogBody>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()} size="sm">
      <DialogHeader onClose={onClose}>
        <DialogTitle>Create Group Link</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          Group Name
        </label>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultName || "My Group"}
          className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--border-strong)] focus:border-transparent outline-none"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          This helps you remember what this link is for. Only you can see it.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-6 bg-[var(--surface-inset)] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[var(--signal-going-light)] rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[var(--signal-going)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)] mb-1">How it works</p>
              <p>Anyone with this link will become friends with everyone else in the group.</p>
            </div>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 text-sm font-medium text-[var(--action-primary-text)] bg-[var(--action-primary)] rounded-lg hover:bg-[var(--action-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create & Copy Link'}
        </button>
      </DialogFooter>
    </Dialog>
  );
}

