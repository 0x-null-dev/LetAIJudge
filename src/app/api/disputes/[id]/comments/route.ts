import { NextRequest, NextResponse } from "next/server";
import { getComments, getCommentCount } from "@/lib/comments";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const limit = url.searchParams.has("limit")
      ? Math.min(Math.max(parseInt(url.searchParams.get("limit")!) || 25, 1), 100)
      : undefined;
    const offset = url.searchParams.has("offset")
      ? Math.max(parseInt(url.searchParams.get("offset")!) || 0, 0)
      : undefined;

    const [comments, total] = await Promise.all([
      getComments(id, limit, offset),
      getCommentCount(id),
    ]);
    return NextResponse.json({ comments, total });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
