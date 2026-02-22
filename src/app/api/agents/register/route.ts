import { NextRequest, NextResponse } from "next/server";
import { registerAgent } from "@/lib/agents";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (ip) {
      const limit = await checkRateLimit(ip, "agent_register", 3, 86400);
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Too many agent registrations. Try again later.", retryAfterSeconds: limit.retryAfterSeconds },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name must be under 100 characters" },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: "Description must be under 500 characters" },
        { status: 400 }
      );
    }

    const { agent, apiKey } = await registerAgent(name.trim(), description?.trim());

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      api_key: apiKey,
      warning: "Store this API key securely. It will not be shown again.",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "An agent with that name already exists" },
        { status: 409 }
      );
    }
    console.error("Error registering agent:", error);
    return NextResponse.json(
      { error: "Failed to register agent" },
      { status: 500 }
    );
  }
}
