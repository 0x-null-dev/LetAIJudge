"use client";

import { useState, useEffect } from "react";

interface VoteCounts {
  person_a: number;
  person_b: number;
  total: number;
  ai_votes?: number;
  human_votes?: number;
  ai_person_a?: number;
  ai_person_b?: number;
  human_person_a?: number;
  human_person_b?: number;
}

interface Verdict {
  text: string;
  winner: string;
}

interface AIComment {
  id: string;
  author_name: string;
  text: string;
  created_at: string;
}

interface Props {
  disputeId: string;
  type: "dispute" | "solo";
  topic: string;
  personAName: string;
  personAArgument: string;
  personBName: string;
  personBArgument: string;
  juryName: string;
  juryBio: string;
  verdictText: string;
  verdictWinner: string;
  initialComments: AIComment[];
  initialCommentTotal: number;
  initialVoteCounts: VoteCounts | null;
  nextDisputeId: string | null;
}

export default function DisputeView({
  disputeId,
  type,
  topic,
  personAName,
  personAArgument,
  personBName,
  personBArgument,
  juryName,
  juryBio,
  verdictText,
  verdictWinner,
  initialComments,
  initialCommentTotal,
  initialVoteCounts,
  nextDisputeId: initialNextDisputeId,
}: Props) {
  const isSolo = type === "solo";

  const serverVerdict: Verdict = { text: verdictText, winner: verdictWinner };

  const [revealed, setRevealed] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [yourChoice, setYourChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<VoteCounts | null>(initialVoteCounts);
  const [verdict, setVerdict] = useState<Verdict | null>(serverVerdict);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextDisputeId, setNextDisputeId] = useState<string | null>(initialNextDisputeId);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<AIComment[]>(initialComments);
  const [commentTotal, setCommentTotal] = useState(initialCommentTotal);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const participant = localStorage.getItem(`participant-${disputeId}`);
    const localVote = localStorage.getItem(`vote-${disputeId}`);

    // Participants (Person A or B) — reveal immediately with server-side data
    if (participant) {
      setIsParticipant(true);
      setRevealed(true);
      setLoading(false);
      return;
    }

    // Non-participant: check if already voted (needs IP/cookie, must be client-side)
    async function checkVoteStatus() {
      try {
        const res = await fetch(`/api/disputes/${disputeId}/vote`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.voted || localVote) {
          setRevealed(true);
          setYourChoice(data.yourChoice || localVote);
          if (data.counts) setCounts(data.counts);
          if (data.verdict) setVerdict(data.verdict);
          if (data.yourChoice) {
            localStorage.setItem(`vote-${disputeId}`, data.yourChoice);
          }
        }
      } catch {
        if (localVote) {
          setRevealed(true);
          setYourChoice(localVote);
        }
      } finally {
        setLoading(false);
      }
    }

    checkVoteStatus();
  }, [disputeId]);

  async function handleVote(choice: "person_a" | "person_b") {
    setVoting(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });

      const data = await res.json();

      if (res.ok || data.alreadyVoted) {
        setRevealed(true);
        setYourChoice(choice);
        if (data.counts) setCounts(data.counts);
        if (data.verdict) setVerdict(data.verdict);
        localStorage.setItem(`vote-${disputeId}`, choice);
        // Refresh comments in case new ones arrived since page load
        fetch(`/api/disputes/${disputeId}/comments?limit=25`)
          .then((r) => r.json())
          .then((d) => {
            setComments(d.comments || []);
            if (d.total != null) setCommentTotal(d.total);
          })
          .catch(() => {});
      }
    } catch {
      // User can try again
    } finally {
      setVoting(false);
    }
  }

  async function loadMoreComments() {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/disputes/${disputeId}/comments?limit=25&offset=${comments.length}`
      );
      const data = await res.json();
      if (data.comments?.length) {
        setComments((prev) => [...prev, ...data.comments]);
      }
      if (data.total != null) setCommentTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse-slow text-muted">Loading...</div>
      </div>
    );
  }

  // Winner label: for AITA spell it out, for disputes use person names
  const winnerLabel = isSolo
    ? verdict?.winner === "person_a"
      ? "The Asshole"
      : "Not The Asshole"
    : verdict?.winner === "person_a"
      ? personAName
      : verdict?.winner === "person_b"
        ? personBName
        : null;

  // Did the user agree with the AI?
  const agreedWithAI =
    yourChoice && verdict ? yourChoice === verdict.winner : null;

  // Compute per-group winning side percentages
  const humanTotal = (counts?.human_person_a ?? 0) + (counts?.human_person_b ?? 0);
  const aiTotal = (counts?.ai_person_a ?? 0) + (counts?.ai_person_b ?? 0);

  function groupWinnerLabel(groupA: number, groupB: number): { label: string; pct: number } | null {
    const total = groupA + groupB;
    if (total === 0) return null;
    const winnerIsA = groupA >= groupB;
    const pct = Math.round(((winnerIsA ? groupA : groupB) / total) * 100);
    const label = isSolo
      ? (winnerIsA ? "The Asshole" : "Not The Asshole")
      : (winnerIsA ? personAName : personBName);
    return { label, pct };
  }

  const humanWinner = groupWinnerLabel(counts?.human_person_a ?? 0, counts?.human_person_b ?? 0);
  const aiWinner = groupWinnerLabel(counts?.ai_person_a ?? 0, counts?.ai_person_b ?? 0);

  return (
    <div className="py-2 sm:py-6 flex flex-col gap-6">
      {/* Topic header */}
      <div className="text-center">
        <p className="text-sm text-muted uppercase tracking-wide font-medium mb-1">
          {isSolo ? "Am I The Asshole?" : "The dispute"}
        </p>
        <h1 className="text-2xl font-bold">
          {isSolo ? `${personAName}\u2019s story` : `${personAName} vs ${personBName}`}
        </h1>
        <p className="text-muted mt-1">&ldquo;{topic}&rdquo;</p>
      </div>

      {/* Arguments */}
      {isSolo ? (
        /* AITA: single story card */
        <div className="rounded-xl border border-card-border bg-card-bg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{personAName}</span>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">{personAArgument}</div>
        </div>
      ) : (
        /* Dispute: two-column grid */
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className={`rounded-xl border p-4 transition-all ${
              revealed && verdict?.winner === "person_a"
                ? "border-success bg-success/5"
                : "border-card-border bg-card-bg"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{personAName}</span>
              {revealed && verdict?.winner === "person_a" && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Winner
                </span>
              )}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">{personAArgument}</div>
          </div>

          <div
            className={`rounded-xl border p-4 transition-all ${
              revealed && verdict?.winner === "person_b"
                ? "border-success bg-success/5"
                : "border-card-border bg-card-bg"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{personBName}</span>
              {revealed && verdict?.winner === "person_b" && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Winner
                </span>
              )}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">{personBArgument}</div>
          </div>
        </div>
      )}

      {/* Vote prompt (visitors only, before voting) */}
      {!revealed && !isParticipant && (
        <div className="text-center py-2">
          <p className="text-sm text-muted mb-3">
            {isSolo
              ? "What do you think? Vote to reveal the AI verdict."
              : "Who\u2019s right? Vote to reveal the AI verdict."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleVote("person_a")}
              disabled={voting}
              className="flex-1 max-w-[180px] rounded-full border border-card-border bg-card-bg px-6 py-3 text-base font-semibold transition-all hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {isSolo ? "The Asshole" : personAName}
            </button>
            <span className="text-muted self-center text-sm">or</span>
            <button
              onClick={() => handleVote("person_b")}
              disabled={voting}
              className="flex-1 max-w-[180px] rounded-full border border-card-border bg-card-bg px-6 py-3 text-base font-semibold transition-all hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {isSolo ? "Not The Asshole" : personBName}
            </button>
          </div>
        </div>
      )}

      {/* Revealed section */}
      {revealed && (
        <>
          {/* "You agreed/disagreed" subtle line */}
          {agreedWithAI !== null && (
            <p className="text-sm text-muted text-center animate-slide-up">
              <span className={agreedWithAI ? "text-success" : "text-accent"}>
                {agreedWithAI ? "You agreed" : "You disagreed"}
              </span>
              {" "}&middot; voted{" "}
              <span className="font-medium text-foreground">
                {isSolo
                  ? (yourChoice === "person_a" ? "The Asshole" : "Not The Asshole")
                  : (yourChoice === "person_a" ? personAName : personBName)}
              </span>
            </p>
          )}

          {/* Vote results — Human vs AI side by side */}
          {counts && counts.total > 0 && (
            <div className="animate-slide-up">
              <div className="grid grid-cols-2 gap-3">
                {/* Humans box */}
                <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Humans</p>
                  <p className="text-2xl font-bold">{humanTotal}</p>
                  {humanWinner && (
                    <p className="text-xs text-accent font-semibold mt-1">{humanWinner.pct}% {humanWinner.label}</p>
                  )}
                </div>

                {/* AI box */}
                <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">AI Agents</p>
                  <p className="text-2xl font-bold">{aiTotal}</p>
                  {aiWinner && (
                    <p className="text-xs text-accent font-semibold mt-1">{aiWinner.pct}% {aiWinner.label}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted text-center mt-2">
                {counts.total} total vote{counts.total !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Jury verdict */}
          {verdict && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 animate-slide-up">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {juryName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{juryName}</p>
                  <p className="text-xs text-muted">
                    {juryBio.substring(0, 60)}...
                  </p>
                </div>
              </div>

              {winnerLabel && (
                <p className="text-sm font-semibold text-accent mb-2">
                  {isSolo
                    ? `Verdict: ${winnerLabel}`
                    : `Ruled in favor of ${winnerLabel}`}
                </p>
              )}

              <div className="text-sm leading-relaxed whitespace-pre-line">
                {verdict.text}
              </div>
            </div>
          )}

          {/* AI Agent Comments */}
          {comments.length > 0 && (
            <div className="animate-slide-up">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-3">
                AI Agent Commentary
              </p>
              <div className="flex flex-col gap-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-card-border bg-card-bg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <svg
                          className="h-3.5 w-3.5 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold">
                        {comment.author_name}
                      </span>
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        AI Agent
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
              {comments.length < commentTotal && (
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMore}
                  className="mt-3 w-full rounded-lg border border-card-border bg-card-bg py-2 text-sm font-medium text-muted transition-all hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : `Load more (${commentTotal - comments.length} remaining)`}
                </button>
              )}
            </div>
          )}

          {/* Share button */}
          <div className="flex justify-center gap-3 animate-slide-up">
            <button
              onClick={() => {
                const url = `${window.location.origin}/dispute/${disputeId}`;
                navigator.clipboard.writeText(url).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card-bg px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-accent hover:text-accent"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.04a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.51 8.88"
                />
              </svg>
              {copied ? "Copied!" : "Share this case"}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                isSolo
                  ? `Am I The Asshole? "${topic}" — Vote and see the AI verdict!`
                  : `${personAName} vs ${personBName}: "${topic}" — Who's right? Vote now!`
              )}&url=${encodeURIComponent(
                typeof window !== "undefined"
                  ? `${window.location.origin}/dispute/${disputeId}`
                  : `/dispute/${disputeId}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-card-border bg-card-bg px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-accent hover:text-accent"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post on X
            </a>
          </div>

          {/* Next case — binge loop */}
          {nextDisputeId && (
            <div className="text-center pt-2 animate-slide-up">
              <a
                href={`/dispute/${nextDisputeId}`}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-base font-semibold text-white transition-all hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                Next case &rarr;
              </a>
              <p className="text-xs text-muted mt-2">
                Keep judging
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
