import { Header } from '@/components/Header';
import { ProfileContent } from '@/components/ProfileContent';

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your profile and how others see you
            </p>
          </header>

          <ProfileContent />
        </div>
      </main>
    </>
  );
}
