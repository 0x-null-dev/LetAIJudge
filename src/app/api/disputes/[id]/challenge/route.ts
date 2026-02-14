import { NextRequest, NextResponse } from "next/server";
import {
  getDisputeByChallenge,
  acquireLock,
  submitChallenge,
} from "@/lib/disputes";
import { generateVerdict } from "@/lib/verdict";

// POST: Submit the challenger's response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { token, sessionId, personBName, personBArgument } = body;

    // Validation
    if (!token || !sessionId || !personBName || !personBArgument) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (personBName.length > 50) {
      return NextResponse.json(
        { error: "Name must be under 50 characters" },
        { status: 400 }
      );
    }

    if (personBArgument.length > 500) {
      return NextResponse.json(
        { error: "Argument must be under 500 characters" },
        { status: 400 }
      );
    }

    // Verify challenge token
    const dispute = await getDisputeByChallenge(id, token);
    if (!dispute) {
      return NextResponse.json(
        { error: "Invalid challenge link" },
        { status: 404 }
      );
    }

    if (dispute.status !== "pending" || dispute.person_b_argument) {
      return NextResponse.json(
        { error: "This dispute has already been answered" },
        { status: 400 }
      );
    }

    // Submit the challenge
    const submitResult = await submitChallenge(
      id,
      sessionId,
      personBName.trim(),
      personBArgument.trim()
    );

    if (!submitResult.success) {
      return NextResponse.json(
        { error: submitResult.reason },
        { status: 400 }
      );
    }

    // Generate verdict
    try {
      await generateVerdict(id);
    } catch (verdictError) {
      console.error("Verdict generation failed:", verdictError);
      return NextResponse.json(
        { error: "Your response was saved but the AI jury failed to generate a verdict. Please try refreshing the page." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      verdictGenerated: true,
      redirectUrl: `/dispute/${id}`,
    });
  } catch (error) {
    console.error("Error submitting challenge:", error);
    return NextResponse.json(
      { error: "Failed to submit response. Please try again." },
      { status: 500 }
    );
  }
}

// PUT: Acquire or refresh lock
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { token, sessionId } = body;

    if (!token || !sessionId) {
      return NextResponse.json(
        { error: "Token and session ID required" },
        { status: 400 }
      );
    }

    // Verify challenge token
    const dispute = await getDisputeByChallenge(id, token);
    if (!dispute) {
      return NextResponse.json(
        { error: "Invalid challenge link" },
        { status: 404 }
      );
    }

    if (dispute.status !== "pending" || dispute.person_b_argument) {
      return NextResponse.json(
        { error: "This dispute has already been answered" },
        { status: 400 }
      );
    }

    const lockResult = await acquireLock(id, sessionId);

    if (!lockResult.success) {
      return NextResponse.json(
        { locked: true, reason: lockResult.reason },
        { status: 423 }
      );
    }

    return NextResponse.json({ locked: false, acquired: true });
  } catch (error) {
    console.error("Error acquiring lock:", error);
    return NextResponse.json(
      { error: "Failed to acquire lock" },
      { status: 500 }
    );
  }
}
