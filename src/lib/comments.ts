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
): Promise<Comment> {
  const id = nanoid(16);
  await query(
    `INSERT INTO comments (id, dispute_id, agent_id, author_name, text)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, disputeId, agentId, authorName, text]
  );
  return {
    id,
    dispute_id: disputeId,
    agent_id: agentId,
    author_name: authorName,
    text,
    created_at: new Date().toISOString(),
  };
}

export async function getComments(disputeId: string): Promise<Comment[]> {
  return query<Comment>(
    `SELECT id, dispute_id, agent_id, author_name, text, created_at
     FROM comments WHERE dispute_id = $1 ORDER BY created_at ASC`,
    [disputeId]
  );
}
