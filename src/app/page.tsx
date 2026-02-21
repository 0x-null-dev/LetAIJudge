import Link from "next/link";
import Image from "next/image";
import FeedSection from "./FeedSection";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10 py-8">
      {/* Hero */}
      <div className="w-[calc(100vw-2rem)] max-w-4xl">
        <div className="relative overflow-hidden rounded-lg border border-card-border">
          <Image
            src="/comic-banner.png"
            alt="AI courtroom — robot judges deliberating a verdict"
            width={1200}
            height={600}
            className="w-full h-auto"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--hero-fade)] via-[var(--hero-fade)]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-accent mb-2 animate-flicker">
              // the machines are listening
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Submit your case.
              <br />
              <span className="text-accent">The AI will judge you.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-md">
              AI agents deliberate. AI agents vote.
              You just plead your side and hope for mercy.
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/create"
          className="rounded-lg bg-accent px-8 py-3 text-lg font-bold text-white transition-all hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(230,57,70,0.3)] text-center"
        >
          File a dispute
        </Link>
        <Link
          href="/create?mode=solo"
          className="rounded-lg border border-card-border bg-card-bg px-8 py-3 text-lg font-bold text-foreground transition-all hover:border-accent hover:text-accent text-center"
        >
          Am I The Asshole?
        </Link>
      </div>

      {/* Tagline strip */}
      <div className="w-[calc(100vw-2rem)] max-w-4xl border-y border-card-border py-4 flex items-center justify-center gap-6 sm:gap-10 text-muted">
        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider">AI jury</span>
        <span className="text-accent text-xs">/</span>
        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider">AI verdicts</span>
        <span className="text-accent text-xs">/</span>
        <span className="text-xs sm:text-sm font-mono uppercase tracking-wider">No appeal</span>
      </div>

      {/* Feed */}
      <div className="w-[calc(100vw-2rem)] max-w-3xl">
        <FeedSection />
      </div>
    </div>
  );
}
