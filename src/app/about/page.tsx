import { Header } from '@/components/Header';
import Image from 'next/image';

export const metadata = {
  title: 'About | Lark',
  description: 'What is Lark, how it works, and why I\'m building it.',
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Intro Section */}
        <section className="bg-white">
          <div className="max-w-2xl mx-auto px-6 py-10">
            <p className="text-xl text-center text-[var(--brand-primary)] font-semibold leading-relaxed mb-6">
              I built Lark for my friends
              <br />
              <span className="text-gray-500 font-normal">(and maybe yours)</span>
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              I think Austin&apos;s full of great shows, games, and nights out, but a lot 
              of them are scattered across websites, social media, and chats. 
              Lark helps you see what&apos;s happening, shows you what your friends are 
              into, and gives each night its own plan so you can make plans together.
            </p>
            <p className="text-gray-600 leading-relaxed">
              If you think this could be useful,{' '}
              <a 
                href="/friends" 
                className="font-medium text-[var(--brand-primary)] hover:underline"
              >
                invite a few friends
              </a>
              {' '}to join you on Lark, and feel free to{' '}
              <a 
                href="mailto:vignesh.jeyaraman@gmail.com" 
                className="font-medium text-[var(--brand-primary)] hover:underline"
              >
                email me
              </a>
              . Maybe I&apos;ll see you at the next event.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            How It Works
          </h2>
          <p className="text-center text-gray-500 mb-10">
            Discover · Connect · Plan · Go
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Discover */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Discover
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">
                  Find what&apos;s happening
                </span>
              </div>
              <div className="relative w-[200px] h-[360px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100 mb-4">
                <Image
                  src="/about/discover.png"
                  alt="Lark Discover - Events feed"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-[240px] mx-auto">
                Find concerts, comedy, sports, and more around Austin — and curate 
                your nights with venue, genre, and date filters.
              </p>
            </div>

            {/* Connect */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Connect
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">
                  See what friends are into
                </span>
              </div>
              <div className="relative w-[200px] h-[360px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100 mb-4">
                <Image
                  src="/about/connect.png"
                  alt="Lark Connect - Friends"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-[240px] mx-auto">
                Add friends so you see what they&apos;re interested in (and they 
                see you too) — making it easy to spot &quot;oh, that would be fun with them.&quot;
              </p>
            </div>

            {/* Plan */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Plan
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm font-medium text-gray-700">
                  Keep it all in one place
                </span>
              </div>
              <div className="relative w-[200px] h-[360px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100 mb-4">
                <Image
                  src="/about/plan.png"
                  alt="Lark Plan - Coordination"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-[240px] mx-auto">
                Start a plan to make it happen. Track who&apos;s in, tickets, and 
                meetup details — and adjust anytime plans change.
              </p>
            </div>
          </div>

          {/* Go - elegant card with green accent */}
          <div className="text-center py-10 mt-8 bg-white rounded-2xl border-2 border-[var(--brand-primary)] shadow-[0_4px_20px_rgba(22,163,74,0.15)]">
            <h3 className="text-2xl md:text-3xl font-medium text-gray-700">
              Then just… <span className="font-bold text-[var(--brand-primary)]">Go.</span>
            </h3>
          </div>
        </section>

        {/* What's Next - Indie/Patch Notes Style */}
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-2xl mx-auto px-6 py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              What I&apos;m working on next
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              This is a nights-and-weekends project, so none of this is a promise, 
              but roughly this is where I&apos;m headed:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Smarter discovery.
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Keep improving search, filters, and event metadata so it&apos;s easier 
                  to find good options for specific days and moods. Over time, I&apos;d like 
                  to use signals like the artists you follow, the teams you care about, 
                  and eventually what you listen to on Spotify to make the feed feel 
                  more &quot;you.&quot;
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  User-created events.
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  House shows, game nights, dinners—plans that start from your home or 
                  your group, not just venue pages. The goal is for Lark to be where 
                  all your events live, whether it&apos;s a big show in town or something 
                  you&apos;re hosting yourself.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Communities, once there are enough people.
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  A way to connect with people outside your direct friend circle through 
                  communities like &quot;Austin FC fans&quot; or &quot;EDM heads in Austin,&quot; while 
                  still using friend plans for your inner circle. Think of it as scenes 
                  you can plug into on top of your existing chats and plans.
                </p>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Fixes / Improvements
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  I&apos;m building this in my spare time, and it&apos;s still early. 
                  If you use it and something feels confusing, annoying, or surprisingly 
                  good, I genuinely want to hear it. Thanks!
                </p>
                <a
                  href="mailto:vignesh.jeyaraman@gmail.com"
                  className="inline-flex items-center gap-2 px-4 py-2 text-base font-medium text-[var(--text-primary)] bg-[var(--surface-inset)] rounded-lg hover:bg-[var(--border-default)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send me a note
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-6 py-8 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Lark · Austin, TX
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

