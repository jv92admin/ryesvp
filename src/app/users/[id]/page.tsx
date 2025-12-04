import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Header } from '@/components/Header';
import { UserProfileContent } from '@/components/UserProfileContent';

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Redirect logged-out users to login with return URL
  if (!user) {
    redirect(`/login?redirect=/users/${id}`);
  }

  // If viewing own profile, redirect to /profile
  if (user.dbUser.id === id) {
    redirect('/profile');
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <UserProfileContent userId={id} />
      </main>
    </>
  );
}

