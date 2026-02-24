import { query } from "./db";
import { nanoid } from "nanoid";

export interface VoteCounts {
  person_a: number;
  person_b: number;
  total: number;
}

export interface DetailedVoteCounts {
  person_a: number;
  person_b: number;
  total: number;
  ai_votes: number;
  human_votes: number;
  ai_person_a: number;
  ai_person_b: number;
  human_person_a: number;
  human_person_b: number;
}

export async function castVote(
  disputeId: string,
  choice: "person_a" | "person_b",
  voterIp: string | null,
  voterType: "human" | "ai" = "human",
  agentId: string | null = null,
  voterFingerprint: string | null = null
): Promise<{ success: boolean; reason?: string }> {
  // AI agent deduplication: check by agent_id
  if (voterType === "ai" && agentId) {
    const existing = await query(
      "SELECT id FROM votes WHERE dispute_id = $1 AND agent_id = $2",
      [disputeId, agentId]
    );
    if (existing.length > 0) {
      return { success: false, reason: "already_voted" };
    }
  }

  // Human deduplication: check by IP OR fingerprint
  if (voterType === "human") {
    const conditions: string[] = [];
    const params: (string | null)[] = [disputeId];
    let idx = 2;

    if (voterIp) {
      conditions.push(`voter_ip = $${idx}`);
      params.push(voterIp);
      idx++;
    }
    if (voterFingerprint) {
      conditions.push(`voter_fingerprint = $${idx}`);
      params.push(voterFingerprint);
      idx++;
    }

    if (conditions.length > 0) {
      const existing = await query(
        `SELECT id FROM votes WHERE dispute_id = $1 AND (${conditions.join(" OR ")})`,
        params
      );
      if (existing.length > 0) {
        return { success: false, reason: "already_voted" };
      }
    }
  }

  const id = nanoid(16);
  try {
    await query(
      "INSERT INTO votes (id, dispute_id, choice, voter_ip, voter_type, agent_id, voter_fingerprint) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, disputeId, choice, voterIp, voterType, agentId, voterFingerprint]
    );
  } catch (err: unknown) {
    // UNIQUE constraint backstop for race conditions
    if (err instanceof Error && err.message.includes("unique")) {
      return { success: false, reason: "already_voted" };
    }
    throw err;
  }

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

export async function getVoteCountsDetailed(disputeId: string): Promise<DetailedVoteCounts> {
  const rows = await query<{ choice: string; voter_type: string; count: string }>(
    `SELECT choice, voter_type, COUNT(*)::text as count
     FROM votes WHERE dispute_id = $1
     GROUP BY choice, voter_type`,
    [disputeId]
  );

  let person_a = 0;
  let person_b = 0;
  let ai_votes = 0;
  let human_votes = 0;
  let ai_person_a = 0;
  let ai_person_b = 0;
  let human_person_a = 0;
  let human_person_b = 0;

  for (const row of rows) {
    const count = parseInt(row.count);
    if (row.choice === "person_a") person_a += count;
    if (row.choice === "person_b") person_b += count;
    if (row.voter_type === "ai") {
      ai_votes += count;
      if (row.choice === "person_a") ai_person_a = count;
      if (row.choice === "person_b") ai_person_b = count;
    }
    if (row.voter_type === "human") {
      human_votes += count;
      if (row.choice === "person_a") human_person_a = count;
      if (row.choice === "person_b") human_person_b = count;
    }
  }

  return {
    person_a, person_b, total: person_a + person_b,
    ai_votes, human_votes,
    ai_person_a, ai_person_b, human_person_a, human_person_b,
  };
}

export async function hasVoted(
  disputeId: string,
  voterIp: string | null,
  voterFingerprint: string | null = null
): Promise<{ voted: boolean; choice?: string }> {
  const conditions: string[] = [];
  const params: (string | null)[] = [disputeId];
  let idx = 2;

  if (voterIp) {
    conditions.push(`voter_ip = $${idx}`);
    params.push(voterIp);
    idx++;
  }
  if (voterFingerprint) {
    conditions.push(`voter_fingerprint = $${idx}`);
    params.push(voterFingerprint);
    idx++;
  }

  if (conditions.length === 0) return { voted: false };

  const rows = await query<{ choice: string }>(
    `SELECT choice FROM votes WHERE dispute_id = $1 AND (${conditions.join(" OR ")})`,
    params
  );

  if (rows.length > 0) {
    return { voted: true, choice: rows[0].choice };
  }
  return { voted: false };
}
