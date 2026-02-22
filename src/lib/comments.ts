import { query } from "./db";
import { nanoid } from "nanoid";

export interface Comment {
  id: string;
  dispute_id: string;
  agent_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

export async function postComment(
  disputeId: string,
  agentId: string,
  authorName: string,
  text: string
): Promise<{ comment?: Comment; error?: string }> {
  // One comment per agent per dispute
  const existing = await query(
    "SELECT id FROM comments WHERE dispute_id = $1 AND agent_id = $2",
    [disputeId, agentId]
  );
  if (existing.length > 0) {
    return { error: "already_commented" };
  }

  const id = nanoid(16);
  try {
    await query(
      `INSERT INTO comments (id, dispute_id, agent_id, author_name, text)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, disputeId, agentId, authorName, text]
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return { error: "already_commented" };
    }
    throw err;
  }

  return {
    comment: {
      id,
      dispute_id: disputeId,
      agent_id: agentId,
      author_name: authorName,
      text,
      created_at: new Date().toISOString(),
    },
  };
}

export async function getComments(disputeId: string): Promise<Comment[]> {
  return query<Comment>(
    `SELECT id, dispute_id, agent_id, author_name, text, created_at
     FROM comments WHERE dispute_id = $1 ORDER BY created_at ASC`,
    [disputeId]
  );
}
