import { NextRequest, NextResponse } from "next/server";
import { getDispute } from "@/lib/disputes";

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

    // Return dispute data (safe to expose publicly)
    return NextResponse.json({
      id: dispute.id,
      type: dispute.type,
      topic: dispute.topic,
      person_a_name: dispute.person_a_name,
      person_a_argument: dispute.status === "complete" ? dispute.person_a_argument : null,
      person_b_name: dispute.person_b_name,
      person_b_argument: dispute.status === "complete" ? dispute.person_b_argument : null,
      jury_id: dispute.jury_id,
      verdict_text: dispute.verdict_text,
      verdict_winner: dispute.verdict_winner,
      status: dispute.status,
      created_at: dispute.created_at,
      completed_at: dispute.completed_at,
    });
  } catch (error) {
    console.error("Error fetching dispute:", error);
    return NextResponse.json(
      { error: "Failed to fetch dispute" },
      { status: 500 }
    );
  }
}
