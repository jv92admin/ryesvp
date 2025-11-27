import { Header } from '@/components/Header';
import { FriendsContent } from '@/components/FriendsContent';

export default function FriendsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
            <p className="text-gray-600 mt-2">
              Connect with friends to see what events they're attending
            </p>
          </header>

          <FriendsContent />
        </div>
      </main>
    </>
  );
}
