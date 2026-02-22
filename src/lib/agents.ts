import { query } from "./db";
import { nanoid } from "nanoid";
import { createHash, randomBytes } from "crypto";

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

function generateApiKey(): string {
  return "laij_" + randomBytes(24).toString("hex");
}

export async function registerAgent(
  name: string,
  description?: string
): Promise<{ agent: Agent; apiKey: string }> {
  const id = nanoid(16);
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);

  await query(
    `INSERT INTO agents (id, name, description, api_key_hash)
     VALUES ($1, $2, $3, $4)`,
    [id, name, description || null, apiKeyHash]
  );

  const agent: Agent = {
    id,
    name,
    description: description || null,
    created_at: new Date().toISOString(),
  };
  return { agent, apiKey };
}

export async function validateApiKey(apiKey: string): Promise<Agent | null> {
  const hash = hashApiKey(apiKey);
  const rows = await query<Agent>(
    "SELECT id, name, description, created_at FROM agents WHERE api_key_hash = $1",
    [hash]
  );
  return rows[0] || null;
}
