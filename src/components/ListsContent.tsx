'use client';

import { useState, useEffect } from 'react';
import { ListCard } from '@/components/ListCard';
import { CreateListModal } from '@/components/CreateListModal';
import { ListDetailModal } from '@/components/ListDetailModal';

type ListWithCount = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  _count: { members: number };
};

export function ListsContent() {
  const [lists, setLists] = useState<ListWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch lists');
      }
      const json = await res.json();
      setLists(json.lists || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateList = async (name: string, description: string, memberIds: string[]) => {
    try {
      // Create the list
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error('Failed to create list');
      const { list } = await res.json();

      // Add members if any selected
      for (const friendId of memberIds) {
        await fetch(`/api/lists/${list.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId }),
        });
      }

      await fetchLists();
      setShowCreateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create list');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return;
    try {
      const res = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete list');
      await fetchLists();
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  return (
    <>
      {/* Create button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        >
          + Create List
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {lists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">You haven't created any lists yet.</p>
              <p className="text-sm text-gray-400 mb-4">
                Lists help you organize friends into groups like "Work Friends" or "Concert Crew"
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                Create Your First List
              </button>
            </div>
          ) : (
            lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onView={() => setSelectedListId(list.id)}
                onDelete={() => handleDeleteList(list.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateList}
        />
      )}

      {/* List Detail Modal */}
      {selectedListId && (
        <ListDetailModal
          listId={selectedListId}
          onClose={() => {
            setSelectedListId(null);
            fetchLists(); // Refresh counts
          }}
        />
      )}
    </>
  );
}

