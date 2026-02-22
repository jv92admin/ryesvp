'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';

interface CreateCommunityModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export function CreateCommunityModal({ onClose, onCreate }: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onCreate(name.trim(), description.trim());
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <DialogHeader onClose={onClose}>
          <DialogTitle>Create New Community</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--lark-text-secondary)] mb-1">
                Community Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., EDM Lovers, Austin FC Fans"
                className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-visible)] focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[var(--lark-text-secondary)] mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this community about?"
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg text-[var(--lark-text-primary)] placeholder:text-[var(--lark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-visible)] focus:border-transparent resize-none"
              />
            </div>

            <p className="text-sm text-[var(--lark-text-muted)]">
              You'll be able to invite friends after creating the community.
            </p>
          </div>
        </DialogBody>

        <DialogFooter className="justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--lark-text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Community'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
