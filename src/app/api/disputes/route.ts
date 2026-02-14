import { NextRequest, NextResponse } from "next/server";
import { createDispute } from "@/lib/disputes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, personAName, personAArgument } = body;

    // Validation
    if (!topic || !personAName || !personAArgument) {
      return NextResponse.json(
        { error: "Topic, your name, and your argument are required" },
        { status: 400 }
      );
    }

    if (topic.length > 300) {
      return NextResponse.json(
        { error: "Topic must be under 300 characters" },
        { status: 400 }
      );
    }

    if (personAName.length > 50) {
      return NextResponse.json(
        { error: "Name must be under 50 characters" },
        { status: 400 }
      );
    }

    if (personAArgument.length > 500) {
      return NextResponse.json(
        { error: "Argument must be under 500 characters" },
        { status: 400 }
      );
    }

    const { disputeId, challengeToken } = await createDispute(
      topic.trim(),
      personAName.trim(),
      personAArgument.trim()
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicUrl = `${appUrl}/dispute/${disputeId}`;
    const challengeUrl = `${appUrl}/dispute/${disputeId}/challenge?token=${challengeToken}`;

    return NextResponse.json({
      disputeId,
      publicUrl,
      challengeUrl,
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    );
  }
}
