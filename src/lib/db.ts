import { Client, QueryResultRow } from "pg";

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const result = await client.query<T>(text, params);
    return result.rows;
  } catch (err) {
    console.error("[db] query failed:", (err as Error).message, "| SQL:", text.slice(0, 80));
    throw err;
  } finally {
    client.end().catch(() => {});
  }
}
