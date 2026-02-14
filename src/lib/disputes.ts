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
  verdictWinner: string
): Promise<void> {
  await query(
    `UPDATE disputes
     SET verdict_text = $1,
         verdict_winner = $2,
         status = 'complete',
         completed_at = NOW()
     WHERE id = $3`,
    [verdictText, verdictWinner, disputeId]
  );
}
