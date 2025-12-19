import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getOptionalUser } from '@/lib/auth';
import { getGroupByInviteCode, joinGroupLink } from '@/db/communities';
import { createNotifications } from '@/db/notifications';

// GET /api/groups/join/[code] - Get group info by invite code (public for preview)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const optionalUser = await getOptionalUser();
    
    const group = await getGroupByInviteCode(code);
    
    if (!group) {
      return NextResponse.json(
        { error: 'Invalid or expired group link' },
        { status: 404 }
      );
    }

    // Check if current user is already a member
    let isMember = false;
    let isOwner = false;
    if (optionalUser?.dbUser) {
      isOwner = group.ownerId === optionalUser.dbUser.id;
      isMember = isOwner || group.members.some(m => m.userId === optionalUser.dbUser.id);
    }

    // Get all members for display (owner + members)
    const allMembers = [
      {
        id: group.owner.id,
        displayName: group.owner.displayName,
        email: group.owner.email,
        isOwner: true,
      },
      ...group.members
        .filter(m => m.userId !== group.ownerId) // Exclude owner from members list (already added)
        .map(m => ({
          id: m.user.id,
          displayName: m.user.displayName,
          email: m.user.email,
          isOwner: false,
        })),
    ];

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        memberCount: allMembers.length,
      },
      members: allMembers,
      isLoggedIn: !!optionalUser,
      isMember,
      isOwner,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

// POST /api/groups/join/[code] - Join a group via invite code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth();
    const { code } = await params;

    const result = await joinGroupLink(code, user.dbUser.id);

    if (result.alreadyMember) {
      return NextResponse.json({
        success: true,
        message: "You're already a member of this group",
        group: result.group,
        newFriendships: 0,
        alreadyMember: true,
      });
    }

    // Send notifications to all existing members (except the joiner)
    const memberIds = [
      result.group.ownerId,
      ...result.group.members
        .filter(m => m.userId !== user.dbUser.id)
        .map(m => m.userId),
    ].filter(id => id !== user.dbUser.id);

    if (memberIds.length > 0) {
      const joinerName = user.dbUser.displayName || user.dbUser.email.split('@')[0];
      await createNotifications(memberIds, 'GROUP_MEMBER_JOINED', {
        actorId: user.dbUser.id,
        actorName: joinerName,
        groupId: result.group.id,
        groupName: result.group.name,
      });
    }

    return NextResponse.json({
      success: true,
      message: result.newFriendships > 0 
        ? `You joined ${result.group.name}! ${result.newFriendships} new friend${result.newFriendships > 1 ? 's' : ''} added.`
        : `You joined ${result.group.name}!`,
      group: result.group,
      newFriendships: result.newFriendships,
      alreadyMember: false,
    });
  } catch (error) {
    console.error('Error joining group:', error);
    const message = error instanceof Error ? error.message : 'Failed to join group';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

