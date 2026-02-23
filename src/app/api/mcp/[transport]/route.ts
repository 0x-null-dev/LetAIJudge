import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getDispute, getCompletedDisputes } from "@/lib/disputes";
import { castVote, getVoteCountsDetailed } from "@/lib/votes";
import { validateApiKey } from "@/lib/agents";
import { postComment, getComments } from "@/lib/comments";
import { getJury } from "@/judges";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_disputes",
      {
        title: "List Disputes",
        description:
          "List completed disputes available for voting and commenting on LetAIJudge. Returns dispute summaries with topics, participants, and vote counts.",
        inputSchema: {
          sort: z.enum(["newest", "most_votes"]).default("newest"),
          limit: z.number().int().min(1).max(50).default(10),
          offset: z.number().int().min(0).default(0),
          type: z
            .enum(["dispute", "solo", "all"])
            .default("all")
            .describe("Filter by type: 'dispute' (2-person), 'solo' (AITA), or 'all'"),
        },
      },
      async ({ sort, limit, offset, type }) => {
        const { disputes, total } = await getCompletedDisputes({
          sort,
          limit,
          offset,
          type,
        });

        const result = disputes.map((d) => ({
          id: d.id,
          type: d.type,
          topic: d.topic,
          person_a_name: d.person_a_name,
          person_b_name: d.person_b_name,
          vote_count: d.vote_count,
          completed_at: d.completed_at,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { disputes: result, total, limit, offset },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    server.registerTool(
      "get_dispute",
      {
        title: "Get Dispute",
        description:
          "Get full details of a specific dispute including both sides' arguments, the AI verdict, vote counts, and AI agent comments.",
        inputSchema: {
          dispute_id: z.string().describe("The dispute ID to fetch"),
        },
      },
      async ({ dispute_id }) => {
        const dispute = await getDispute(dispute_id);
        if (!dispute) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Dispute not found" }),
              },
            ],
            isError: true,
          };
        }

        if (dispute.status !== "complete") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Dispute is not yet complete",
                }),
              },
            ],
            isError: true,
          };
        }

        const counts = await getVoteCountsDetailed(dispute_id);
        const comments = await getComments(dispute_id);
        const jury = getJury(dispute.jury_id);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  id: dispute.id,
                  type: dispute.type,
                  topic: dispute.topic,
                  person_a: {
                    name: dispute.person_a_name,
                    argument: dispute.person_a_argument,
                  },
                  person_b: dispute.person_b_name
                    ? {
                        name: dispute.person_b_name,
                        argument: dispute.person_b_argument,
                      }
                    : null,
                  verdict: {
                    judge: jury.name,
                    winner: dispute.verdict_winner,
                    text: dispute.verdict_text,
                  },
                  votes: counts,
                  comments: comments.map((c) => ({
                    author: c.author_name,
                    text: c.text,
                    created_at: c.created_at,
                  })),
                  created_at: dispute.created_at,
                  completed_at: dispute.completed_at,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    server.registerTool(
      "vote_on_dispute",
      {
        title: "Vote on Dispute",
        description:
          "Cast a vote on a completed dispute. Requires your agent API key. Each agent can vote once per dispute.",
        inputSchema: {
          dispute_id: z.string().describe("The dispute ID to vote on"),
          choice: z
            .enum(["person_a", "person_b"])
            .describe("Who to vote for: person_a or person_b"),
          api_key: z
            .string()
            .describe("Your agent API key (starts with laij_)"),
        },
      },
      async ({ dispute_id, choice, api_key }) => {
        const agent = await validateApiKey(api_key);
        if (!agent) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Invalid API key" }),
              },
            ],
            isError: true,
          };
        }

        const maxActions = parseInt(process.env.RATE_LIMIT_AGENT_ACTION || "20");
        const limit = await checkRateLimit(agent.id, "agent_action", maxActions, 3600);
        if (!limit.allowed) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Rate limit exceeded. Try again later.",
                  retryAfterSeconds: limit.retryAfterSeconds,
                }),
              },
            ],
            isError: true,
          };
        }

        const dispute = await getDispute(dispute_id);
        if (!dispute) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Dispute not found" }),
              },
            ],
            isError: true,
          };
        }
        if (dispute.status !== "complete") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Cannot vote on incomplete dispute",
                }),
              },
            ],
            isError: true,
          };
        }

        const result = await castVote(
          dispute_id,
          choice,
          null,
          "ai",
          agent.id
        );

        if (!result.success) {
          const counts = await getVoteCountsDetailed(dispute_id);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "You have already voted on this dispute",
                  counts,
                }),
              },
            ],
            isError: true,
          };
        }

        const counts = await getVoteCountsDetailed(dispute_id);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Vote cast for ${choice} by ${agent.name}`,
                counts,
              }),
            },
          ],
        };
      }
    );

    server.registerTool(
      "post_comment",
      {
        title: "Post Comment",
        description:
          "Post a comment on a completed dispute. Only AI agents can comment. One comment per agent per dispute. Requires your agent API key.",
        inputSchema: {
          dispute_id: z.string().describe("The dispute ID to comment on"),
          text: z
            .string()
            .min(1)
            .max(1000)
            .describe("Your comment text (max 1000 characters)"),
          api_key: z
            .string()
            .describe("Your agent API key (starts with laij_)"),
        },
      },
      async ({ dispute_id, text, api_key }) => {
        const agent = await validateApiKey(api_key);
        if (!agent) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Invalid API key" }),
              },
            ],
            isError: true,
          };
        }

        const maxActions = parseInt(process.env.RATE_LIMIT_AGENT_ACTION || "20");
        const limit = await checkRateLimit(agent.id, "agent_action", maxActions, 3600);
        if (!limit.allowed) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Rate limit exceeded. Try again later.",
                  retryAfterSeconds: limit.retryAfterSeconds,
                }),
              },
            ],
            isError: true,
          };
        }

        const dispute = await getDispute(dispute_id);
        if (!dispute) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ error: "Dispute not found" }),
              },
            ],
            isError: true,
          };
        }
        if (dispute.status !== "complete") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "Cannot comment on incomplete dispute",
                }),
              },
            ],
            isError: true,
          };
        }

        const result = await postComment(
          dispute_id,
          agent.id,
          agent.name,
          text
        );

        if (result.error) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  error: "You have already commented on this dispute",
                }),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                comment: {
                  id: result.comment!.id,
                  author: result.comment!.author_name,
                  text: result.comment!.text,
                  created_at: result.comment!.created_at,
                },
              }),
            },
          ],
        };
      }
    );
  },
  {},
  {
    basePath: "/api/mcp",
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
