import { Pool, QueryResultRow } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (err) => {
      console.error("Pool error, discarding pool:", err.message);
      pool = null;
    });
  }
  return pool;
}

function isConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("connection terminated") ||
    msg.includes("connection refused") ||
    msg.includes("connection reset") ||
    msg.includes("broken pipe") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("epipe") ||
    msg.includes("terminating connection") ||
    msg.includes("ssl connection has been closed") ||
    msg.includes("client has encountered a connection error") ||
    msg.includes("cannot use a pool after calling end")
  );
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  try {
    const result = await getPool().query<T>(text, params);
    return result.rows;
  } catch (err) {
    if (isConnectionError(err)) {
      console.warn("DB connection error, retrying with fresh pool:", (err as Error).message);
      try { await pool?.end(); } catch { /* ignore */ }
      pool = null;
      const result = await getPool().query<T>(text, params);
      return result.rows;
    }
    throw err;
  }
}
