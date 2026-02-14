"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreateDisputePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">Loading...</div>}>
      <CreateDispute />
    </Suspense>
  );
}

function CreateDispute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSolo = searchParams.get("mode") === "solo";

  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [argument, setArgument] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    challengeUrl: string;
    publicUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const maxArgLength = isSolo ? 2000 : 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          personAName: name.trim(),
          personAArgument: argument.trim(),
          ...(isSolo && { type: "solo" }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Mark as participant so they skip voting on the verdict page
      localStorage.setItem(`participant-${data.disputeId}`, "true");

      // AITA: redirect straight to verdict page (no opponent to share with)
      if (isSolo) {
        router.push(`/dispute/${data.disputeId}`);
        return;
      }

      setResult({
        challengeUrl: data.challengeUrl,
        publicUrl: data.publicUrl,
      });
    } catch {
      setError("Failed to create dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.challengeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Success state — show share link (disputes only, AITA redirects)
  if (result) {
    return (
      <div className="animate-slide-up flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg
            className="h-8 w-8 text-success"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Your case has been filed!</h1>
        <p className="text-muted max-w-sm">
          Now share this link with the other person. They&apos;ll see the topic
          and make their case. Once they respond, the AI jury will deliver the
          verdict.
        </p>

        <div className="w-full max-w-md">
          <label className="mb-2 block text-left text-sm font-medium text-muted">
            Send this link to your opponent:
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={result.challengeUrl}
              className="flex-1 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/80"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-md">
          <p className="text-xs text-muted">Or share via:</p>
          <div className="flex gap-2 justify-center">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `I just took our argument about "${topic}" to AI court. Now make your case before the verdict drops: ${result.challengeUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-card-border px-4 py-2 text-sm hover:bg-card-border/50 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                result.challengeUrl
              )}&text=${encodeURIComponent(
                `I just took our argument about "${topic}" to AI court. Make your case!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-card-border px-4 py-2 text-sm hover:bg-card-border/50 transition-colors"
            >
              Telegram
            </a>
            <a
              href={`sms:?body=${encodeURIComponent(
                `I just took our argument about "${topic}" to AI court. Make your case before the verdict drops: ${result.challengeUrl}`
              )}`}
              className="rounded-lg border border-card-border px-4 py-2 text-sm hover:bg-card-border/50 transition-colors"
            >
              SMS
            </a>
          </div>
        </div>

        <a
          href={result.publicUrl}
          className="text-sm text-accent hover:underline mt-4"
        >
          View dispute page
        </a>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-1">
        {isSolo ? "Am I The Asshole?" : "What's the argument?"}
      </h1>
      <p className="text-muted text-sm mb-6">
        {isSolo
          ? "Tell your story. The AI jury will decide if you're the asshole."
          : "State your case. We'll send a link to the other person to make theirs."}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium"
          >
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mike"
            maxLength={50}
            required
            className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label
            htmlFor="topic"
            className="mb-1 block text-sm font-medium"
          >
            {isSolo ? "The situation" : "The topic / question"}
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              isSolo
                ? "e.g. AITA for refusing to lend my car to my sister?"
                : "e.g. Who should cook on weeknights?"
            }
            maxLength={300}
            required
            className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-muted">{topic.length}/300</p>
        </div>

        <div>
          <label
            htmlFor="argument"
            className="mb-1 block text-sm font-medium"
          >
            {isSolo ? "Your story" : "Your side of the story"}
          </label>
          <textarea
            id="argument"
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            placeholder={
              isSolo
                ? "Tell the full story. Be honest — the AI jury reads between the lines."
                : "Make your case. Be specific — the AI jury will judge based on what you write here."
            }
            maxLength={maxArgLength}
            required
            rows={isSolo ? 8 : 5}
            className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
          />
          <p className="mt-1 text-xs text-muted">
            {argument.length}/{maxArgLength}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || !topic.trim() || !argument.trim()}
          className="rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? isSolo
              ? "The jury is deliberating..."
              : "Filing your case..."
            : isSolo
              ? "Submit for judgment"
              : "Submit your side"}
        </button>
      </form>
    </div>
  );
}
