import { NextRequest, NextResponse } from "next/server";
import { getCompletedDisputes } from "@/lib/disputes";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  console.log("[feed] handler start");
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") === "most_votes" ? "most_votes" : "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log("[feed] querying DB");
    const { disputes, total } = await getCompletedDisputes({ sort, limit, offset });
    console.log("[feed] DB done, returning", disputes.length, "disputes");

    return NextResponse.json({
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[feed] caught error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
