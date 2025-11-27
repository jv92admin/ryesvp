import { Header } from '@/components/Header';
import { CommunitiesContent } from '@/components/CommunitiesContent';

export default function CommunitiesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-600 mt-2">
              Discover events through shared interest groups
            </p>
          </header>

          <CommunitiesContent />
        </div>
      </main>
    </>
  );
}

