"use client";

import { useState, useEffect } from "react";

interface VoteCounts {
  person_a: number;
  person_b: number;
  total: number;
}

interface Verdict {
  text: string;
  winner: string;
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
}: Props) {
  const isSolo = type === "solo";

  const [revealed, setRevealed] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [yourChoice, setYourChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<VoteCounts | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextDisputeId, setNextDisputeId] = useState<string | null>(null);

  useEffect(() => {
    const participant = localStorage.getItem(`participant-${disputeId}`);
    const localVote = localStorage.getItem(`vote-${disputeId}`);

    // Participants (Person A or B) skip voting entirely
    if (participant) {
      setIsParticipant(true);
      setRevealed(true);
      // Fetch verdict + counts directly
      fetch(`/api/disputes/${disputeId}`)
        .then((res) => res.json())
        .then((data) => {
          setVerdict({
            text: data.verdict_text,
            winner: data.verdict_winner,
          });
        })
        .catch(() => {});
      fetch(`/api/disputes/${disputeId}/vote`)
        .then((res) => res.json())
        .then((data) => {
          if (data.counts) setCounts(data.counts);
        })
        .catch(() => {});
      fetchNextDispute();
      setLoading(false);
      return;
    }

    // Non-participant: check if already voted
    async function checkVoteStatus() {
      try {
        const res = await fetch(`/api/disputes/${disputeId}/vote`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.voted || localVote) {
          setRevealed(true);
          setYourChoice(data.yourChoice || localVote);
          setCounts(data.counts);
          setVerdict(data.verdict);
          if (data.yourChoice) {
            localStorage.setItem(`vote-${disputeId}`, data.yourChoice);
          }
          fetchNextDispute();
        }
      } catch {
        if (localVote) {
          setRevealed(true);
          setYourChoice(localVote);
          fetchNextDispute();
        }
      } finally {
        setLoading(false);
      }
    }

    checkVoteStatus();
  }, [disputeId]);

  function fetchNextDispute() {
    fetch(`/api/disputes/next?exclude=${disputeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) setNextDisputeId(data.id);
      })
      .catch(() => {});
  }

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
        setCounts(data.counts);
        setVerdict(data.verdict);
        localStorage.setItem(`vote-${disputeId}`, choice);
        fetchNextDispute();
      }
    } catch {
      // User can try again
    } finally {
      setVoting(false);
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

  const personAPercent =
    counts && counts.total > 0
      ? Math.round((counts.person_a / counts.total) * 100)
      : 0;
  const personBPercent =
    counts && counts.total > 0
      ? Math.round((counts.person_b / counts.total) * 100)
      : 0;

  // Labels for vote bar
  const labelA = isSolo ? "Asshole" : personAName;
  const labelB = isSolo ? "Not" : personBName;

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
          <p className="text-sm leading-relaxed whitespace-pre-line">{personAArgument}</p>
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
            <p className="text-sm leading-relaxed">{personAArgument}</p>
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
            <p className="text-sm leading-relaxed">{personBArgument}</p>
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
          {/* "You agreed/disagreed" badge */}
          {agreedWithAI !== null && !isParticipant && (
            <div
              className={`text-center py-2 animate-slide-up ${
                agreedWithAI ? "text-success" : "text-accent"
              }`}
            >
              <p className="text-lg font-bold">
                {agreedWithAI
                  ? "You agreed with the AI jury!"
                  : "You disagreed with the AI jury!"}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {isSolo ? (
                  <>
                    You voted{" "}
                    <span className="font-semibold">
                      {yourChoice === "person_a" ? "The Asshole" : "Not The Asshole"}
                    </span>
                    {" "}&middot; AI ruled{" "}
                    <span className="font-semibold">{winnerLabel}</span>
                  </>
                ) : (
                  <>
                    You sided with{" "}
                    <span className="font-semibold">
                      {yourChoice === "person_a" ? personAName : personBName}
                    </span>
                    {" "}&middot; AI ruled for{" "}
                    <span className="font-semibold">{winnerLabel}</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Vote results bar */}
          {counts && counts.total > 0 && (
            <div className="py-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium w-16 text-right truncate">
                  {labelA}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-accent rounded-l-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${Math.max(personAPercent, 5)}%` }}
                  >
                    {personAPercent > 20 && (
                      <span className="text-[10px] font-bold text-white">
                        {personAPercent}%
                      </span>
                    )}
                  </div>
                  <div
                    className="h-full bg-foreground/60 rounded-r-full flex items-center justify-start pl-2 transition-all duration-700"
                    style={{ width: `${Math.max(personBPercent, 5)}%` }}
                  >
                    {personBPercent > 20 && (
                      <span className="text-[10px] font-bold text-white">
                        {personBPercent}%
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium w-16 truncate">
                  {labelB}
                </span>
              </div>
              <p className="text-[10px] text-muted text-center">
                {counts.total} vote{counts.total !== 1 ? "s" : ""}
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
