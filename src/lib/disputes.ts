import { query } from "./db";
import { nanoid } from "nanoid";
import { getRandomJury } from "./jury";

export interface Dispute {
  id: string;
  type: "dispute" | "solo";
  topic: string;
  person_a_name: string;
  person_a_argument: string;
  person_b_name: string | null;
  person_b_argument: string | null;
  jury_id: string;
  verdict_text: string | null;
  verdict_winner: string | null;
  status: "pending" | "complete" | "incomplete" | "reported";
  challenge_token: string;
  lock_holder: string | null;
  lock_expires_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function createDispute(
  topic: string,
  personAName: string,
  personAArgument: string
): Promise<{ disputeId: string; challengeToken: string }> {
  const id = nanoid(12);
  const challengeToken = nanoid(24);
  const jury = getRandomJury();

  await query(
    `INSERT INTO disputes (id, type, topic, person_a_name, person_a_argument, jury_id, challenge_token, status)
     VALUES ($1, 'dispute', $2, $3, $4, $5, $6, 'pending')`,
    [id, topic, personAName, personAArgument, jury.id, challengeToken]
  );

  return { disputeId: id, challengeToken };
}

export async function createAITADispute(
  topic: string,
  personAName: string,
  personAArgument: string
): Promise<{ disputeId: string }> {
  const id = nanoid(12);
  const challengeToken = nanoid(24);
  const jury = getRandomJury();

  await query(
    `INSERT INTO disputes (id, type, topic, person_a_name, person_a_argument, jury_id, challenge_token, status)
     VALUES ($1, 'solo', $2, $3, $4, $5, $6, 'pending')`,
    [id, topic, personAName, personAArgument, jury.id, challengeToken]
  );

  return { disputeId: id };
}

export async function getDispute(id: string): Promise<Dispute | null> {
  const rows = await query<Dispute>("SELECT * FROM disputes WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function getDisputeByChallenge(
  disputeId: string,
  token: string
): Promise<Dispute | null> {
  const rows = await query<Dispute>(
    "SELECT * FROM disputes WHERE id = $1 AND challenge_token = $2",
    [disputeId, token]
  );
  return rows[0] || null;
}

export async function acquireLock(
  disputeId: string,
  sessionId: string,
  lockMinutes: number = 5
): Promise<{ success: boolean; reason?: string }> {
  const lockTimeout = parseInt(
    process.env.CHALLENGE_LOCK_TIMEOUT_MINUTES || String(lockMinutes)
  );

  const result = await query(
    `UPDATE disputes
     SET lock_holder = $1,
         lock_expires_at = NOW() + ($2 || ' minutes')::interval
     WHERE id = $3
       AND status = 'pending'
       AND person_b_argument IS NULL
       AND (lock_holder IS NULL OR lock_expires_at < NOW() OR lock_holder = $1)
     RETURNING id`,
    [sessionId, String(lockTimeout), disputeId]
  );

  if (result.length === 0) {
    const dispute = await getDispute(disputeId);
    if (!dispute) return { success: false, reason: "Dispute not found" };
    if (dispute.status !== "pending")
      return { success: false, reason: "Dispute already completed" };
    if (dispute.person_b_argument)
      return { success: false, reason: "Someone already responded" };
    return { success: false, reason: "Someone is currently responding" };
  }

  return { success: true };
}

export async function submitChallenge(
  disputeId: string,
  sessionId: string,
  personBName: string,
  personBArgument: string
): Promise<{ success: boolean; reason?: string }> {
  const result = await query(
    `UPDATE disputes
     SET person_b_name = $1,
         person_b_argument = $2,
         lock_holder = NULL,
         lock_expires_at = NULL
     WHERE id = $3
       AND status = 'pending'
       AND person_b_argument IS NULL
       AND lock_holder = $4
     RETURNING id`,
    [personBName, personBArgument, disputeId, sessionId]
  );

  if (result.length === 0) {
    return { success: false, reason: "Lock expired or dispute was already answered" };
  }

  return { success: true };
}

export async function saveVerdict(
  disputeId: string,
  verdictText: string,
  verdictWinner: string,
  personATeaser?: string | null,
  personBTeaser?: string | null
): Promise<void> {
  await query(
    `UPDATE disputes
     SET verdict_text = $1,
         verdict_winner = $2,
         person_a_teaser = $3,
         person_b_teaser = $4,
         status = 'complete',
         completed_at = NOW()
     WHERE id = $5`,
    [verdictText, verdictWinner, personATeaser || null, personBTeaser || null, disputeId]
  );
}

export interface FeedDispute {
  id: string;
  type: "dispute" | "solo";
  topic: string;
  person_a_name: string;
  person_b_name: string | null;
  person_a_teaser: string | null;
  person_b_teaser: string | null;
  completed_at: string;
  votes_a: number;
  votes_b: number;
  vote_count: number;
}

export async function getCompletedDisputes(options: {
  sort: "newest" | "most_votes";
  limit: number;
  offset: number;
}): Promise<{ disputes: FeedDispute[]; total: number }> {
  const orderBy =
    options.sort === "most_votes"
      ? "vote_count DESC, d.completed_at DESC"
      : "d.completed_at DESC";

  const disputes = await query<FeedDispute>(
    `SELECT d.id, d.type, d.topic, d.person_a_name, d.person_b_name, d.person_a_teaser, d.person_b_teaser, d.completed_at,
            COUNT(v.id) FILTER (WHERE v.choice = 'person_a')::int AS votes_a,
            COUNT(v.id) FILTER (WHERE v.choice = 'person_b')::int AS votes_b,
            COUNT(v.id)::int AS vote_count
     FROM disputes d
     LEFT JOIN votes v ON v.dispute_id = d.id
     WHERE d.status = 'complete'
     GROUP BY d.id
     ORDER BY ${orderBy}
     LIMIT $1 OFFSET $2`,
    [options.limit, options.offset]
  );

  const countResult = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM disputes WHERE status = 'complete'"
  );

  return {
    disputes,
    total: countResult[0]?.count || 0,
  };
}
