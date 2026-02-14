import Link from "next/link";
import Image from "next/image";
import FeedSection from "./FeedSection";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Both sides testify.
          <br />
          <span className="text-accent">AI jury judges.</span>
          <br />
          The internet votes.
        </h1>
        <p className="text-lg text-muted">
          Submit your side of the argument. Let a random AI jury deliver the
          verdict. Let the crowd decide who&apos;s actually right.
        </p>
      </div>

      <Link
        href="/create"
        className="rounded-full bg-accent px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Start a dispute
      </Link>

      {/* Comic strip "How it works" — full width, breaks out of max-w-2xl container */}
      <div className="mt-4 w-[calc(100vw-2rem)] max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
          How it works
        </p>

        {/* Mobile: 2x2 grid, larger panels. Desktop: 4 across */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {/* Panel 1: Testify */}
          <div className="comic-panel flex flex-col">
            <div className="comic-caption rounded-sm self-start m-2 mb-0">
              Step 1
            </div>
            <div className="relative z-10 flex flex-col items-center px-3 pt-1 pb-3">
              <div className="w-full h-40 sm:h-48 relative">
                <Image
                  src="/comic/panel1-testify.svg"
                  alt="Person making their case"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="speech-bubble speech-bubble-inner mt-2 text-center">
                &ldquo;She NEVER does the dishes!&rdquo;
              </div>
            </div>
          </div>

          {/* Panel 2: Respond */}
          <div className="comic-panel flex flex-col">
            <div className="comic-caption rounded-sm self-start m-2 mb-0">
              Step 2
            </div>
            <div className="relative z-10 flex flex-col items-center px-3 pt-1 pb-3">
              <div className="w-full h-40 sm:h-48 relative">
                <Image
                  src="/comic/panel2-respond.svg"
                  alt="Two people debating"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="speech-bubble speech-bubble-inner mt-2 text-center">
                &ldquo;He cooked ONCE in 2019!&rdquo;
              </div>
            </div>
          </div>

          {/* Panel 3: AI jury */}
          <div className="comic-panel flex flex-col border-accent">
            <div className="comic-caption rounded-sm self-start m-2 mb-0">
              Step 3
            </div>
            <div className="relative z-10 flex flex-col items-center px-3 pt-1 pb-3">
              <div className="w-full h-40 sm:h-48 relative">
                <Image
                  src="/comic/panel3-jury.svg"
                  alt="AI judge making a ruling"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="speech-bubble speech-bubble-inner mt-2 text-center">
                &ldquo;I&apos;ve heard enough.&rdquo;
              </div>
            </div>
          </div>

          {/* Panel 4: Votes */}
          <div className="comic-panel flex flex-col">
            <div className="comic-caption rounded-sm self-start m-2 mb-0">
              Step 4
            </div>
            <div className="relative z-10 flex flex-col items-center px-3 pt-1 pb-3">
              <div className="w-full h-40 sm:h-48 relative">
                <Image
                  src="/comic/panel4-votes.svg"
                  alt="People voting on the verdict"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="speech-bubble speech-bubble-inner mt-2 text-center">
                &ldquo;72% say she&apos;s right&rdquo;
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Live feed — disputes people can vote on */}
      <div className="w-[calc(100vw-2rem)] max-w-3xl mt-4">
        <FeedSection />
      </div>
    </div>
  );
}
