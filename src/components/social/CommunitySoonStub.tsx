'use client';

import { useState } from 'react';

export function CommunitySoonStub() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Actually save the email for notifications
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setNotifyEmail('');
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-dashed border-purple-200 rounded-lg p-6">
      <div className="text-center space-y-4">
        {/* Header */}
        <div>
          <span className="text-2xl mb-2 block">🚧</span>
          <h3 className="font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <h4 className="text-lg font-medium text-purple-700 mb-1">Community & Tickets</h4>
        </div>

        {/* Features Preview */}
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <span className="text-lg">🎫</span>
            <div className="text-left">
              <div className="font-medium">Trusted Ticket Exchange</div>
              <div className="text-xs text-gray-600">Buy and sell tickets safely within your communities</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <span className="text-lg">🔍</span>
            <div className="text-left">
              <div className="font-medium">Community Discovery</div>
              <div className="text-xs text-gray-600">See what's trending in your music communities</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <span className="text-lg">👥</span>
            <div className="text-left">
              <div className="font-medium">Community Coordination</div>
              <div className="text-xs text-gray-600">Plan group outings with community members</div>
            </div>
          </div>
        </div>

        {/* Notify Me Form */}
        {!submitted ? (
          <form onSubmit={handleNotifySubmit} className="space-y-3 pt-2">
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="Get notified when ready"
              className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80"
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Notify Me
            </button>
          </form>
        ) : (
          <div className="py-4">
            <div className="text-green-600 font-medium text-sm flex items-center justify-center gap-2">
              <span>✓</span>
              Thanks! We'll let you know.
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="pt-4 border-t border-purple-200/50">
          <div className="text-xs text-gray-500">
            <strong className="text-purple-600">Phase 2</strong> • Expected: Early 2025
          </div>
        </div>
      </div>
    </div>
  );
}
