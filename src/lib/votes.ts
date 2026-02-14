import { query } from "./db";
import { nanoid } from "nanoid";

export interface VoteCounts {
  person_a: number;
  person_b: number;
  total: number;
}

export async function castVote(
  disputeId: string,
  choice: "person_a" | "person_b",
  voterIp: string | null
): Promise<{ success: boolean; reason?: string }> {
  // Check for existing vote by IP
  if (voterIp) {
    const existing = await query(
      "SELECT id FROM votes WHERE dispute_id = $1 AND voter_ip = $2",
      [disputeId, voterIp]
    );
    if (existing.length > 0) {
      return { success: false, reason: "already_voted" };
    }
  }

  const id = nanoid(16);
  await query(
    "INSERT INTO votes (id, dispute_id, choice, voter_ip) VALUES ($1, $2, $3, $4)",
    [id, disputeId, choice, voterIp]
  );

  return { success: true };
}

export async function getVoteCounts(disputeId: string): Promise<VoteCounts> {
  const rows = await query<{ choice: string; count: string }>(
    "SELECT choice, COUNT(*)::text as count FROM votes WHERE dispute_id = $1 GROUP BY choice",
    [disputeId]
  );

  let person_a = 0;
  let person_b = 0;

  for (const row of rows) {
    if (row.choice === "person_a") person_a = parseInt(row.count);
    if (row.choice === "person_b") person_b = parseInt(row.count);
  }

  return { person_a, person_b, total: person_a + person_b };
}

export async function hasVoted(
  disputeId: string,
  voterIp: string | null
): Promise<{ voted: boolean; choice?: string }> {
  if (!voterIp) return { voted: false };

  const rows = await query<{ choice: string }>(
    "SELECT choice FROM votes WHERE dispute_id = $1 AND voter_ip = $2",
    [disputeId, voterIp]
  );

  if (rows.length > 0) {
    return { voted: true, choice: rows[0].choice };
  }
  return { voted: false };
}
