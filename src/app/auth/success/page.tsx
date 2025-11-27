'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Poll for session to be ready
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds max
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Session is ready, redirect
        router.replace(next);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkSession, 100);
      } else {
        // Timeout - redirect anyway
        setChecking(false);
        router.replace('/login');
      }
    };
    
    checkSession();
  }, [next, router]);

  return (
    <p className="text-gray-600">
      {checking ? 'Signing you in...' : 'Redirecting...'}
    </p>
  );
}

/**
 * Auth success page - handles redirect after OAuth
 * Waits for session to be available before redirecting
 */
export default function AuthSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <Suspense fallback={<p className="text-gray-600">Loading...</p>}>
          <AuthSuccessContent />
        </Suspense>
      </div>
    </main>
  );
}

