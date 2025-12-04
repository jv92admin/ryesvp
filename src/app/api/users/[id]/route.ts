import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserProfile, getUserEventsForProfile, getMutualEvents, cancelFriendRequest } from '@/db/users';
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '@/db/friends';
import { createNotification } from '@/db/notifications';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id] - Get user profile
 * Returns profile data, friendship status, and events (if friends)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const viewerId = currentUser.dbUser.id;

    // Get profile with relationship context
    const profile = await getUserProfile(targetUserId, viewerId);

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only return events for friends or self
    let events = null;
    let mutualEvents = null;

    if (profile.relation === 'friend' || profile.relation === 'self') {
      events = await getUserEventsForProfile(targetUserId, viewerId);
      
      // Get mutual events only for friends (not self)
      if (profile.relation === 'friend') {
        mutualEvents = await getMutualEvents(viewerId, targetUserId);
      }
    }

    return NextResponse.json({
      profile,
      events,
      mutualEvents,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id] - Friend actions (send request, accept, decline)
 * Body: { action: 'send' | 'accept' | 'decline' | 'cancel' }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const viewerId = currentUser.dbUser.id;
    const { action, friendshipId } = await request.json();

    if (viewerId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot perform friend action on yourself' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'send': {
        // Send friend request
        const friendship = await sendFriendRequest(viewerId, targetUserId);
        
        // Create notification for target user
        await createNotification(targetUserId, 'FRIEND_REQUEST_RECEIVED', {
          actorId: viewerId,
        });

        return NextResponse.json({ 
          success: true, 
          friendshipId: friendship.id,
          relation: 'pending_sent' 
        });
      }

      case 'accept': {
        if (!friendshipId) {
          return NextResponse.json(
            { error: 'Friendship ID required' },
            { status: 400 }
          );
        }
        
        const friendship = await acceptFriendRequest(friendshipId, viewerId);
        
        // Create notification for the requester (targetUserId is the one who sent the request)
        await createNotification(targetUserId, 'FRIEND_REQUEST_ACCEPTED', {
          actorId: viewerId,
        });

        return NextResponse.json({ 
          success: true, 
          relation: 'friend',
          friendsSince: friendship.updatedAt 
        });
      }

      case 'decline': {
        if (!friendshipId) {
          return NextResponse.json(
            { error: 'Friendship ID required' },
            { status: 400 }
          );
        }
        
        await declineFriendRequest(friendshipId, viewerId);
        
        return NextResponse.json({ 
          success: true, 
          relation: 'stranger' 
        });
      }

      case 'cancel': {
        if (!friendshipId) {
          return NextResponse.json(
            { error: 'Friendship ID required' },
            { status: 400 }
          );
        }
        
        await cancelFriendRequest(friendshipId, viewerId);
        
        return NextResponse.json({ 
          success: true, 
          relation: 'stranger' 
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error performing friend action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/users/[id] - Remove friend
 * Query: ?friendshipId=xxx
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: targetUserId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const viewerId = currentUser.dbUser.id;
    const url = new URL(request.url);
    const friendshipId = url.searchParams.get('friendshipId');

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID required' },
        { status: 400 }
      );
    }

    await removeFriend(friendshipId, viewerId);

    return NextResponse.json({ 
      success: true, 
      relation: 'stranger' 
    });
  } catch (error: any) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove friend' },
      { status: 400 }
    );
  }
}

