import type { Metadata } from "next";
import { getDispute } from "@/lib/disputes";
import { getJury } from "@/lib/jury";
import { notFound } from "next/navigation";
import DisputeView from "./DisputeView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dispute = await getDispute(id);

  if (!dispute) {
    return { title: "Dispute not found" };
  }

  const isSolo = dispute.type === "solo";
  const title = isSolo
    ? `${dispute.person_a_name}'s story — Am I The Asshole?`
    : `${dispute.person_a_name} vs ${dispute.person_b_name} — LetAIJudge`;
  const description = `"${dispute.topic}" — Vote and see the AI jury's verdict.`;
  const ogImageUrl = `/dispute/${id}/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: dispute.topic,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

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

  // Pending state
  if (dispute.status === "pending") {
    // AITA disputes should be completed immediately — this is a rare edge case
    if (dispute.type === "solo") {
      return (
        <div className="py-12 text-center flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center animate-pulse-slow">
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
          <h1 className="text-2xl font-bold">The jury is still deliberating...</h1>
          <p className="text-muted max-w-sm">
            This is taking longer than usual. Try refreshing the page in a moment.
          </p>
        </div>
      );
    }

    // Dispute: waiting for Person B
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

  // Complete state — pass to client component (NO verdict in initial HTML)
  return (
    <DisputeView
      disputeId={dispute.id}
      type={dispute.type as "dispute" | "solo"}
      topic={dispute.topic}
      personAName={dispute.person_a_name}
      personAArgument={dispute.person_a_argument}
      personBName={dispute.person_b_name || ""}
      personBArgument={dispute.person_b_argument || ""}
      juryName={jury.name}
      juryBio={jury.bio}
    />
  );
}
