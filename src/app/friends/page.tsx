import { Header } from '@/components/Header';
import { FriendsContent } from '@/components/FriendsContent';

export default function FriendsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-[var(--lark-text-primary)]">Friends</h1>
            <p className="text-[var(--lark-text-secondary)] mt-2">
              Connect with friends and plan events together
            </p>
          </header>

          <FriendsContent />
        </div>
      </main>
    </>
  );
}
