import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exclude = searchParams.get("exclude") || "";

    // Get a random completed dispute, excluding the current one
    const rows = await query<{ id: string }>(
      `SELECT id FROM disputes
       WHERE status = 'complete' AND id != $1
       ORDER BY RANDOM()
       LIMIT 1`,
      [exclude]
    );

    if (rows.length === 0) {
      return NextResponse.json({ id: null });
    }

    return NextResponse.json({ id: rows[0].id });
  } catch (error) {
    console.error("Error fetching next dispute:", error);
    return NextResponse.json({ id: null });
  }
}
