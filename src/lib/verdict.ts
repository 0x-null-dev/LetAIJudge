import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getJury } from "./jury";
import { getDispute, saveVerdict } from "./disputes";

export async function generateVerdict(disputeId: string): Promise<{
  verdictText: string;
  verdictWinner: string;
}> {
  const dispute = await getDispute(disputeId);
  if (!dispute) throw new Error("Dispute not found");
  if (!dispute.person_b_argument) throw new Error("Both sides must be submitted first");

  const jury = getJury(dispute.jury_id);

  const prompt = `You are judging a dispute between two people.

TOPIC: "${dispute.topic}"

${dispute.person_a_name.toUpperCase()}'S ARGUMENT:
"${dispute.person_a_argument}"

${dispute.person_b_name?.toUpperCase()}'S ARGUMENT:
"${dispute.person_b_argument}"

Read both arguments carefully. Deliver your verdict. You MUST pick a side — state clearly who you're siding with using their actual name. Only rule it a draw if both arguments are genuinely equal in merit.

After your verdict text, on a NEW LINE, write exactly one of these:
WINNER: person_a
WINNER: person_b
WINNER: neutral`;

  const { text } = await generateText({
    model: openai("gpt-4"),
    system: jury.systemPrompt,
    prompt,
    maxOutputTokens: 1000,
    temperature: 0.8,
  });

  // Parse winner from the last line
  let verdictWinner = "neutral";
  let verdictText = text;

  const winnerMatch = text.match(/WINNER:\s*(person_a|person_b|neutral)\s*$/m);
  if (winnerMatch) {
    verdictWinner = winnerMatch[1];
    verdictText = text.replace(/\nWINNER:\s*(person_a|person_b|neutral)\s*$/m, "").trim();
  }

  await saveVerdict(disputeId, verdictText, verdictWinner);

  return { verdictText, verdictWinner };
}
