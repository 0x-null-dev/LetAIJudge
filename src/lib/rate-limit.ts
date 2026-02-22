import { NextRequest } from "next/server";
import { query } from "./db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

/**
 * DB-based rate limiter for serverless environments.
 * Each call records an action row and counts within the time window.
 */
export async function checkRateLimit(
  key: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const rows = await query<{ count: string; oldest: string | null }>(
    `SELECT COUNT(*)::text AS count,
            MIN(created_at)::text AS oldest
     FROM rate_limits
     WHERE key = $1
       AND action = $2
       AND created_at > NOW() - ($3 || ' seconds')::interval`,
    [key, action, String(windowSeconds)]
  );

  const count = parseInt(rows[0]?.count || "0");

  if (count >= maxRequests) {
    const oldest = rows[0]?.oldest ? new Date(rows[0].oldest) : new Date();
    const expiresAt = new Date(oldest.getTime() + windowSeconds * 1000);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
    );

    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Record this action
  await query(
    "INSERT INTO rate_limits (key, action) VALUES ($1, $2)",
    [key, action]
  );

  // Probabilistic cleanup (~1% of requests)
  if (Math.random() < 0.01) {
    query(
      "DELETE FROM rate_limits WHERE created_at < NOW() - interval '24 hours'"
    ).catch(() => {});
  }

  return { allowed: true, remaining: maxRequests - count - 1 };
}

export function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}
