import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-[var(--screen-padding)]">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-[var(--lark-text-primary)] mb-2">
          Authentication Error
        </h1>
        <p className="text-[var(--lark-text-secondary)] mb-6">
          Something went wrong. The link may have expired.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] rounded-lg hover:opacity-90 transition-colors"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
