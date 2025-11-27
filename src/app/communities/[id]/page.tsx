import { Header } from '@/components/Header';
import { CommunityDetailContent } from '@/components/CommunityDetailContent';

interface CommunityPageProps {
  params: Promise<{ id: string }>;
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <CommunityDetailContent communityId={id} />
      </main>
    </>
  );
}

