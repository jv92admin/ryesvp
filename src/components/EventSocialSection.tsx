import Link from 'next/link';
import { EventDetailedSocial } from '@/db/events';
import { getAvatarStyle, getInitials, getDisplayName } from '@/lib/avatar';

interface EventSocialSectionProps {
  social: EventDetailedSocial;
}

export function EventSocialSection({ social }: EventSocialSectionProps) {
  const hasFriends = social.friends.length > 0;
  const hasCommunities = social.communities.length > 0;
  
  if (!hasFriends && !hasCommunities) {
    return null;
  }
  
  const friendsGoing = social.friends.filter(f => f.status === 'GOING');
  const friendsInterested = social.friends.filter(f => f.status === 'INTERESTED');

  return (
    <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 mb-6">
      <h2 className="font-semibold text-[var(--text-primary)] mb-4">Who's Going</h2>
      
      {/* Friends Section */}
      {hasFriends && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            👥 Friends
          </h3>
          
          {/* Friends Going */}
          {friendsGoing.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-green-600 font-medium mb-2">Going</p>
              <div className="flex flex-wrap gap-2">
                {friendsGoing.map(friend => (
                  <Link
                    key={friend.id}
                    href={`/users/${friend.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={getAvatarStyle(friend.id)}
                      title={getDisplayName(friend.displayName, friend.email)}
                    >
                      {getInitials(friend.displayName, friend.email)}
                    </div>
                    <span className="text-sm text-gray-900">
                      {getDisplayName(friend.displayName, friend.email)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Friends Interested */}
          {friendsInterested.length > 0 && (
            <div>
              <p className="text-xs text-amber-600 font-medium mb-2">Interested</p>
              <div className="flex flex-wrap gap-2">
                {friendsInterested.map(friend => (
                  <Link
                    key={friend.id}
                    href={`/users/${friend.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={getAvatarStyle(friend.id)}
                      title={getDisplayName(friend.displayName, friend.email)}
                    >
                      {getInitials(friend.displayName, friend.email)}
                    </div>
                    <span className="text-sm text-gray-900">
                      {getDisplayName(friend.displayName, friend.email)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Communities Section */}
      {hasCommunities && (
        <div>
          {social.communities.map(community => {
            const communityGoing = community.attendees.filter(a => a.status === 'GOING');
            const communityInterested = community.attendees.filter(a => a.status === 'INTERESTED');
            
            return (
              <div key={community.communityId} className="mb-4 last:mb-0">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  🎭 {community.communityName}
                </h3>
                
                {communityGoing.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-green-600 font-medium mb-2">Going</p>
                    <div className="flex flex-wrap gap-2">
                      {communityGoing.map(member => (
                        <Link
                          key={member.id}
                          href={`/users/${member.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={getAvatarStyle(member.id)}
                            title={getDisplayName(member.displayName, member.email)}
                          >
                            {getInitials(member.displayName, member.email)}
                          </div>
                          <span className="text-sm text-gray-900">
                            {getDisplayName(member.displayName, member.email)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {communityInterested.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-600 font-medium mb-2">Interested</p>
                    <div className="flex flex-wrap gap-2">
                      {communityInterested.map(member => (
                        <Link
                          key={member.id}
                          href={`/users/${member.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full hover:bg-amber-100 transition-colors"
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={getAvatarStyle(member.id)}
                            title={getDisplayName(member.displayName, member.email)}
                          >
                            {getInitials(member.displayName, member.email)}
                          </div>
                          <span className="text-sm text-gray-900">
                            {getDisplayName(member.displayName, member.email)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

