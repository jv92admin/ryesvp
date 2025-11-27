'use client';

import { useState, useEffect } from 'react';
import { getAvatarStyle, getInitials } from '@/lib/avatar';

type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
};

export function ProfileContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch user');
        }
        const json = await res.json();
        setUser(json.user);
        setDisplayName(json.user.displayName || '');
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() || null }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save');
      }

      const json = await res.json();
      setUser(json.user);
      setMessage({ type: 'success', text: 'Profile updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Failed to load profile
      </div>
    );
  }

  const initials = getInitials(user.displayName, user.email);
  const avatarStyle = getAvatarStyle(user.id);

  return (
    <div className="space-y-6">
      {/* Avatar Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Your Avatar
        </h2>
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style={avatarStyle}
          >
            {initials}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.displayName || user.email.split('@')[0]}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Your avatar color is based on your account ID
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Display Name
        </h2>
        
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is how your name appears to friends and in communities
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Email (read-only) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Email Address
        </h2>
        <p className="text-gray-900">{user.email}</p>
        <p className="text-xs text-gray-500 mt-1">
          Email cannot be changed
        </p>
      </div>
    </div>
  );
}

