import { NextRequest, NextResponse } from "next/server";
import { createDispute, createAITADispute } from "@/lib/disputes";
import { generateAITAVerdict } from "@/lib/verdict";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, personAName, personAArgument, type } = body;

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

    const maxArgLength = type === "solo" ? 2000 : 500;
    if (personAArgument.length > maxArgLength) {
      return NextResponse.json(
        { error: `Story must be under ${maxArgLength} characters` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // AITA flow: create + generate verdict immediately
    if (type === "solo") {
      const { disputeId } = await createAITADispute(
        topic.trim(),
        personAName.trim(),
        personAArgument.trim()
      );

      try {
        await generateAITAVerdict(disputeId);
      } catch (verdictError) {
        console.error("AITA verdict generation failed:", verdictError);
        return NextResponse.json(
          { error: "Failed to generate AI verdict. Please try again." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        disputeId,
        publicUrl: `${appUrl}/dispute/${disputeId}`,
        type: "solo",
      });
    }

    // Dispute flow (unchanged)
    const { disputeId, challengeToken } = await createDispute(
      topic.trim(),
      personAName.trim(),
      personAArgument.trim()
    );

    const publicUrl = `${appUrl}/dispute/${disputeId}`;
    const challengeUrl = `${appUrl}/dispute/${disputeId}/challenge?token=${challengeToken}`;

    return NextResponse.json({
      disputeId,
      publicUrl,
      challengeUrl,
      type: "dispute",
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    );
  }
}
