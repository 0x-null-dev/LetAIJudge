import { NextRequest, NextResponse } from "next/server";
import { getCompletedDisputes } from "@/lib/disputes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") === "most_votes" ? "most_votes" : "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;
    const offset = (page - 1) * limit;

    const { disputes, total } = await getCompletedDisputes({ sort, limit, offset });

    return NextResponse.json({
      disputes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
