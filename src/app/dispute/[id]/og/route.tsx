import { ImageResponse } from "next/og";
import { getDispute } from "@/lib/disputes";
import { getVoteCounts } from "@/lib/votes";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dispute = await getDispute(id);

  if (!dispute) {
    return new Response("Not found", { status: 404 });
  }

  const counts = await getVoteCounts(id);
  const isSolo = dispute.type === "solo";
  const hasVotes = counts.total > 0;
  const personAPercent = hasVotes
    ? Math.round((counts.person_a / counts.total) * 100)
    : 50;
  const personBPercent = hasVotes ? 100 - personAPercent : 50;

  const winnerLabel = isSolo
    ? dispute.verdict_winner === "person_a"
      ? "The Asshole"
      : "Not The Asshole"
    : dispute.verdict_winner === "person_a"
      ? dispute.person_a_name
      : dispute.person_b_name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fafafa",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#1a1a2e",
            }}
          >
            LetAI
          </span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#e63946",
            }}
          >
            Judge
          </span>
          <span
            style={{
              fontSize: "20px",
              color: "#6b7280",
              marginLeft: "12px",
            }}
          >
            {isSolo ? "Am I The Asshole?" : "The Dispute"}
          </span>
        </div>

        {/* Topic */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#1a1a2e",
            marginTop: "32px",
            lineHeight: 1.2,
            display: "flex",
          }}
        >
          {dispute.topic.length > 80
            ? dispute.topic.substring(0, 77) + "..."
            : dispute.topic}
        </div>

        {/* Names */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "24px",
            fontSize: "28px",
            color: "#6b7280",
          }}
        >
          {isSolo ? (
            <span>{dispute.person_a_name}&apos;s story</span>
          ) : (
            <span>
              {dispute.person_a_name} vs {dispute.person_b_name}
            </span>
          )}
        </div>

        {/* Vote bar + verdict */}
        {dispute.status === "complete" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              gap: "16px",
            }}
          >
            {/* Vote bar */}
            {hasVotes && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#1a1a2e",
                    width: "120px",
                    textAlign: "right",
                  }}
                >
                  {isSolo ? "Asshole" : dispute.person_a_name}
                </span>
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    height: "40px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    backgroundColor: "#e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: `${personAPercent}%`,
                      height: "100%",
                      backgroundColor: "#e63946",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {personAPercent > 15 && (
                      <span
                        style={{
                          color: "white",
                          fontSize: "18px",
                          fontWeight: 700,
                        }}
                      >
                        {personAPercent}%
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: `${personBPercent}%`,
                      height: "100%",
                      backgroundColor: "#1a1a2e99",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {personBPercent > 15 && (
                      <span
                        style={{
                          color: "white",
                          fontSize: "18px",
                          fontWeight: 700,
                        }}
                      >
                        {personBPercent}%
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#1a1a2e",
                    width: "120px",
                  }}
                >
                  {isSolo ? "Not" : dispute.person_b_name}
                </span>
              </div>
            )}

            {/* Verdict line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#e63946",
                }}
              >
                {isSolo
                  ? `Verdict: ${winnerLabel}`
                  : `AI ruled in favor of ${winnerLabel}`}
              </span>
              <span style={{ fontSize: "18px", color: "#6b7280" }}>
                {counts.total} vote{counts.total !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
