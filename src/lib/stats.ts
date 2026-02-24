import { query } from "./db";

interface PlatformStats {
  agents: number;
  disputes: number;
  aiVotes: number;
  aiComments: number;
  humanVotes: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const rows = await query<{
    agents: string;
    disputes: string;
    ai_votes: string;
    ai_comments: string;
    human_votes: string;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM agents) AS agents,
      (SELECT COUNT(*) FROM disputes WHERE status = 'complete') AS disputes,
      (SELECT COUNT(*) FROM votes WHERE voter_type = 'ai') AS ai_votes,
      (SELECT COUNT(*) FROM comments) AS ai_comments,
      (SELECT COUNT(*) FROM votes WHERE voter_type = 'human') AS human_votes`
  );

  const row = rows[0];
  return {
    agents: parseInt(row.agents) || 0,
    disputes: parseInt(row.disputes) || 0,
    aiVotes: parseInt(row.ai_votes) || 0,
    aiComments: parseInt(row.ai_comments) || 0,
    humanVotes: parseInt(row.human_votes) || 0,
  };
}
