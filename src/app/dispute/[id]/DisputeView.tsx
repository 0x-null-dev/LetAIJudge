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
  topic,
  personAName,
  personAArgument,
  personBName,
  personBArgument,
  juryName,
  juryBio,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [yourChoice, setYourChoice] = useState<string | null>(null);
  const [counts, setCounts] = useState<VoteCounts | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setCounts(data.counts);
        setVerdict(data.verdict);
        localStorage.setItem(`vote-${disputeId}`, choice);
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
        <div className="animate-pulse-slow text-muted">Loading dispute...</div>
      </div>
    );
  }

  const winnerName =
    verdict?.winner === "person_a"
      ? personAName
      : verdict?.winner === "person_b"
        ? personBName
        : null;

  const personAPercent =
    counts && counts.total > 0
      ? Math.round((counts.person_a / counts.total) * 100)
      : 0;
  const personBPercent =
    counts && counts.total > 0
      ? Math.round((counts.person_b / counts.total) * 100)
      : 0;

  return (
    <div className="py-6 flex flex-col gap-6">
      {/* Topic header */}
      <div className="text-center">
        <p className="text-sm text-muted uppercase tracking-wide font-medium mb-1">
          The dispute
        </p>
        <h1 className="text-2xl font-bold">
          {personAName} vs {personBName}
        </h1>
        <p className="text-muted mt-1">&ldquo;{topic}&rdquo;</p>
      </div>

      {/* Both arguments */}
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

      {/* Vote prompt (visitors only, before voting) */}
      {!revealed && !isParticipant && (
        <div className="text-center py-2">
          <p className="text-sm text-muted mb-3">
            Who&apos;s right? Vote to reveal the AI verdict.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleVote("person_a")}
              disabled={voting}
              className="flex-1 max-w-[180px] rounded-full border border-card-border bg-card-bg px-6 py-3 text-base font-semibold transition-all hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {personAName}
            </button>
            <span className="text-muted self-center text-sm">or</span>
            <button
              onClick={() => handleVote("person_b")}
              disabled={voting}
              className="flex-1 max-w-[180px] rounded-full border border-card-border bg-card-bg px-6 py-3 text-base font-semibold transition-all hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {personBName}
            </button>
          </div>
        </div>
      )}

      {/* Revealed section: vote results then verdict */}
      {revealed && (
        <>
          {/* Vote results bar */}
          {counts && counts.total > 0 && (
            <div className="py-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium w-16 text-right truncate">
                  {personAName}
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
                  {personBName}
                </span>
              </div>
              <p className="text-[10px] text-muted text-center">
                {counts.total} vote{counts.total !== 1 ? "s" : ""}
                {yourChoice && !isParticipant && (
                  <>
                    {" "}&middot; You sided with{" "}
                    <span className="font-semibold">
                      {yourChoice === "person_a" ? personAName : personBName}
                    </span>
                  </>
                )}
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

              {winnerName && (
                <p className="text-sm font-semibold text-accent mb-2">
                  Ruled in favor of {winnerName}
                </p>
              )}

              <div className="text-sm leading-relaxed whitespace-pre-line">
                {verdict.text}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
