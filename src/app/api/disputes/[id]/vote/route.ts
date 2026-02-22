import { NextRequest, NextResponse } from "next/server";
import { getDispute } from "@/lib/disputes";
import { castVote, getVoteCountsDetailed, hasVoted } from "@/lib/votes";
import { getClientIp } from "@/lib/rate-limit";

// POST: Cast a vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { choice } = body;

    if (!choice || !["person_a", "person_b"].includes(choice)) {
      return NextResponse.json(
        { error: "Choice must be 'person_a' or 'person_b'" },
        { status: 400 }
      );
    }

    const dispute = await getDispute(id);
    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }
    if (dispute.status !== "complete") {
      return NextResponse.json(
        { error: "Cannot vote on an incomplete dispute" },
        { status: 400 }
      );
    }

    const voterIp = getClientIp(request);
    const fingerprint = request.cookies.get("laij_vid")?.value || null;
    const result = await castVote(id, choice, voterIp, "human", null, fingerprint);

    if (!result.success) {
      // Already voted — return results anyway
      const counts = await getVoteCountsDetailed(id);
      return NextResponse.json(
        {
          error: "You've already voted on this dispute",
          alreadyVoted: true,
          counts,
          verdict: {
            text: dispute.verdict_text,
            winner: dispute.verdict_winner,
          },
        },
        { status: 409 }
      );
    }

    // Vote successful — return verdict + counts
    const counts = await getVoteCountsDetailed(id);
    return NextResponse.json({
      success: true,
      counts,
      verdict: {
        text: dispute.verdict_text,
        winner: dispute.verdict_winner,
      },
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}

// GET: Check if voted + get results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dispute = await getDispute(id);
    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const voterIp = getClientIp(request);
    const fingerprint = request.cookies.get("laij_vid")?.value || null;
    const voteStatus = await hasVoted(id, voterIp, fingerprint);
    const counts = await getVoteCountsDetailed(id);

    if (voteStatus.voted) {
      return NextResponse.json({
        voted: true,
        yourChoice: voteStatus.choice,
        counts,
        verdict: {
          text: dispute.verdict_text,
          winner: dispute.verdict_winner,
        },
      });
    }

    return NextResponse.json({
      voted: false,
      counts: null,
      verdict: null,
    });
  } catch (error) {
    console.error("Error checking vote:", error);
    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 }
    );
  }
}
