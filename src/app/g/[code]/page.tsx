import { Metadata } from 'next';
import { GroupJoinContent } from '@/components/GroupJoinContent';

interface GroupJoinPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: GroupJoinPageProps): Promise<Metadata> {
  const { code } = await params;
  
  // Fetch group info for metadata
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lark.show';
  try {
    const res = await fetch(`${baseUrl}/api/groups/join/${code}`, {
      cache: 'no-store',
    });
    
    if (res.ok) {
      const data = await res.json();
      return {
        title: `Join ${data.group.name} | Lark`,
        description: `Join ${data.group.name}, connect with ${data.group.memberCount} people, and make future plans easier on Lark.`,
      };
    }
  } catch {
    // Ignore errors, use default metadata
  }
  
  return {
    title: 'Join Group | Lark',
    description: 'Join a group and connect with friends on Lark',
  };
}

export default async function GroupJoinPage({ params }: GroupJoinPageProps) {
  const { code } = await params;
  
  return <GroupJoinContent code={code} />;
}

