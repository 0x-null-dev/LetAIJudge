import { getDispute } from "@/lib/disputes";
import { getJury } from "@/lib/jury";
import { notFound } from "next/navigation";

export default async function DisputePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dispute = await getDispute(id);

  if (!dispute) {
    notFound();
  }

  const jury = getJury(dispute.jury_id);

  // Pending state — waiting for Person B
  if (dispute.status === "pending") {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Waiting for the other side</h1>
        <p className="text-muted max-w-sm">
          <span className="font-semibold text-foreground">
            {dispute.person_a_name}
          </span>{" "}
          wants to settle:{" "}
          <span className="font-semibold">&ldquo;{dispute.topic}&rdquo;</span>
        </p>
        <p className="text-sm text-muted">
          The AI jury can&apos;t rule until both sides have made their case.
        </p>
      </div>
    );
  }

  // Complete state — show verdict (Milestone 1: no voting, just display)
  const winnerName =
    dispute.verdict_winner === "person_a"
      ? dispute.person_a_name
      : dispute.verdict_winner === "person_b"
      ? dispute.person_b_name
      : null;

  return (
    <div className="py-6 flex flex-col gap-6">
      {/* Topic header */}
      <div className="text-center">
        <p className="text-sm text-muted uppercase tracking-wide font-medium mb-1">
          The dispute
        </p>
        <h1 className="text-2xl font-bold">
          {dispute.person_a_name} vs {dispute.person_b_name}
        </h1>
        <p className="text-muted mt-1">&ldquo;{dispute.topic}&rdquo;</p>
      </div>

      {/* Both arguments */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Person A */}
        <div
          className={`rounded-xl border p-4 ${
            dispute.verdict_winner === "person_a"
              ? "border-success bg-success/5"
              : "border-card-border bg-card-bg"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{dispute.person_a_name}</span>
            {dispute.verdict_winner === "person_a" && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Winner
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">{dispute.person_a_argument}</p>
        </div>

        {/* Person B */}
        <div
          className={`rounded-xl border p-4 ${
            dispute.verdict_winner === "person_b"
              ? "border-success bg-success/5"
              : "border-card-border bg-card-bg"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{dispute.person_b_name}</span>
            {dispute.verdict_winner === "person_b" && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Winner
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed">{dispute.person_b_argument}</p>
        </div>
      </div>

      {/* Jury verdict */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
            {jury.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm">{jury.name}</p>
            <p className="text-xs text-muted">{jury.bio.substring(0, 60)}...</p>
          </div>
        </div>

        {winnerName && (
          <p className="text-sm font-semibold text-accent mb-2">
            Ruled in favor of {winnerName}
          </p>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-line">
          {dispute.verdict_text}
        </div>
      </div>

      {/* Placeholder for voting (Milestone 2) */}
      <div className="rounded-xl border border-dashed border-card-border p-4 text-center text-sm text-muted">
        Voting coming soon — the internet will have their say.
      </div>
    </div>
  );
}
