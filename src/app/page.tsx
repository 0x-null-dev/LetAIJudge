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
            src="/comic-banner.jpg"
            alt="AI courtroom — robot judges deliberating a verdict"
            width={1536}
            height={1024}
            className="w-full h-auto"
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAEAAAAAD/wAARCAAQABgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9sAQwACAgICAgIDAgIDBQMDAwUGBQUFBQYIBgYGBgYICggICAgICAoKCgoKCgoKDAwMDAwMDg4ODg4PDw8PDw8PDw8P/9sAQwECAgIEBAQHBAQHEAsJCxAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ/90ABAAC/9oADAMBAAIRAxEAPwCh8K7X4HyajFqJ0W1AuPKjibzAkkrlS5cqUWPGBgNkAngjNfX9p8RfgrL4m/4Qz/hFrprX7R/YhuZBD9jGrcyGAnbxLtG3O/r8u3vX5b/BbQdNvLyW4+IF1NpOmCJY5pEk8iPyjzyG2jYWHGe/ua+q7rwz+zWLDzIvEmj6mupatbymR9Qks7yysmhxNO+6UiW4E/zBFVeD03DNMCl8R4/gdI8+r6bpVjPPZCRXmhdZDG5QuNqKHCnCnLN0PAGea8C/4TD4bf8APu35L/8AGas/Fbwpp2j61FqXwruLnV4ZkMbXBl82KSGUknLfvFYNuJyckk8V5P8A2b4+/wCgRH+Sf/GKdwP/2Q=="
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
