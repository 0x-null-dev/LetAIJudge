"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";

export default function ChallengePageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <ChallengePage params={params} />
    </Suspense>
  );
}

function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [name, setName] = useState("");
  const [argument, setArgument] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [personAName, setPersonAName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sessionId] = useState(() =>
    typeof window !== "undefined"
      ? crypto.randomUUID()
      : ""
  );

  // Acquire lock on mount
  const acquireLock = useCallback(async () => {
    if (!token || !sessionId) return;
    setLockLoading(true);
    try {
      const res = await fetch(`/api/disputes/${id}/challenge`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId }),
      });

      const data = await res.json();

      if (res.status === 423) {
        setLocked(true);
        setLockReason(data.reason || "Someone is currently responding");
        // Still fetch dispute info so we can show the topic while waiting
        try {
          const infoRes = await fetch(`/api/disputes/${id}`);
          if (infoRes.ok) {
            const info = await infoRes.json();
            setTopic(info.topic || "");
            setPersonAName(info.person_a_name || "");
          }
        } catch {
          // Non-critical
        }
        return;
      }

      if (res.status === 404) {
        setError("Invalid challenge link.");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setLocked(false);

      // Fetch dispute info for display
      try {
        const infoRes = await fetch(`/api/disputes/${id}`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          setTopic(info.topic || "");
          setPersonAName(info.person_a_name || "");
        }
      } catch {
        // Non-critical — form still works without display info
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLockLoading(false);
    }
  }, [id, token, sessionId]);

  useEffect(() => {
    acquireLock();
  }, [acquireLock]);

  // Auto-retry lock if locked
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(acquireLock, 15000);
    return () => clearInterval(interval);
  }, [locked, acquireLock]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setGenerating(true);

    try {
      const res = await fetch(`/api/disputes/${id}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          sessionId,
          personBName: name.trim(),
          personBArgument: argument.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setGenerating(false);
        return;
      }

      // Mark as participant so they skip voting on the verdict page
      localStorage.setItem(`participant-${id}`, "true");

      // Verdict is generated — redirect to the dispute page
      router.push(`/dispute/${id}`);
    } catch {
      setError("Failed to submit. Please try again.");
      setGenerating(false);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-xl font-bold mb-2">Invalid link</h1>
        <p className="text-muted">This challenge link is missing a token.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-xl font-bold mb-2">Error</h1>
        <p className="text-muted">{error}</p>
        {error.includes("already been answered") && (
          <a
            href={`/dispute/${id}`}
            className="mt-4 inline-block text-accent hover:underline"
          >
            View the verdict
          </a>
        )}
      </div>
    );
  }

  if (lockLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-pulse-slow text-muted">Loading...</div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="py-12 text-center">
        {topic && (
          <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-4 text-left mx-auto max-w-sm">
            <p className="text-sm text-muted mb-1">
              {personAName && (
                <><span className="font-semibold text-foreground">{personAName}</span> wants to settle:</>
              )}
            </p>
            <p className="text-lg font-semibold">&ldquo;{topic}&rdquo;</p>
          </div>
        )}
        <h1 className="text-xl font-bold mb-2">Someone&apos;s in the room</h1>
        <p className="text-muted mb-4">
          {lockReason}. If they don&apos;t respond in a few minutes, you&apos;ll
          get your turn.
        </p>
        <p className="text-sm text-muted animate-pulse-slow">
          Checking every 15 seconds...
        </p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-accent animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold">The jury is deliberating...</h1>
        <p className="text-muted text-sm animate-pulse-slow">
          Reviewing both arguments and reaching a verdict
        </p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-4">
        <p className="text-sm text-muted mb-1">
          <span className="font-semibold text-foreground">{personAName}</span>{" "}
          wants to settle:
        </p>
        <p className="text-lg font-semibold">&ldquo;{topic}&rdquo;</p>
      </div>

      <h1 className="text-xl font-bold mb-1">Make your case</h1>
      <p className="text-muted text-sm mb-6">
        {personAName} has submitted their side. Now it&apos;s your turn. The AI
        jury will judge once you both submit.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah"
            maxLength={50}
            required
            className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="argument"
            className="mb-1 block text-sm font-medium"
          >
            Your side of the story
          </label>
          <textarea
            id="argument"
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            placeholder="Make your case. The jury will read both sides before making a ruling."
            maxLength={500}
            required
            rows={5}
            className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
          />
          <p className="mt-1 text-xs text-muted">{argument.length}/500</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !argument.trim()}
          className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit your side"}
        </button>
      </form>
    </div>
  );
}
