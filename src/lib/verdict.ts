import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getJury, getAITASystemPrompt } from "./jury";
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

After your verdict text, add these on NEW LINES in this exact format:
WINNER: person_a
TEASER_A: [One punchy sentence that captures ${dispute.person_a_name}'s side in a dramatic, curiosity-inducing way — like a headline that makes people desperate to know who won]
TEASER_B: [Same for ${dispute.person_b_name}'s side]

The teasers should NOT be neutral summaries. They should be dramatic, slightly biased restatements that create tension when read side-by-side. Think tabloid headlines, not Wikipedia.`;

  const { text } = await generateText({
    model: openai("gpt-4"),
    system: jury.systemPrompt,
    prompt,
    maxOutputTokens: 1000,
    temperature: 0.8,
  });

  // Parse structured output from the end
  let verdictWinner = "neutral";
  let verdictText = text;
  let personATeaser: string | null = null;
  let personBTeaser: string | null = null;

  const winnerMatch = text.match(/WINNER:\s*(person_a|person_b|neutral)/m);
  if (winnerMatch) {
    verdictWinner = winnerMatch[1];
  }

  const teaserAMatch = text.match(/TEASER_A:\s*(.+)/m);
  if (teaserAMatch) {
    personATeaser = teaserAMatch[1].trim();
  }

  const teaserBMatch = text.match(/TEASER_B:\s*(.+)/m);
  if (teaserBMatch) {
    personBTeaser = teaserBMatch[1].trim();
  }

  // Strip all metadata lines from the verdict text
  verdictText = text
    .replace(/\nWINNER:\s*.+/m, "")
    .replace(/\nTEASER_A:\s*.+/m, "")
    .replace(/\nTEASER_B:\s*.+/m, "")
    .trim();

  await saveVerdict(disputeId, verdictText, verdictWinner, personATeaser, personBTeaser);

  return { verdictText, verdictWinner };
}

export async function generateAITAVerdict(disputeId: string): Promise<{
  verdictText: string;
  verdictWinner: string;
}> {
  const dispute = await getDispute(disputeId);
  if (!dispute) throw new Error("Dispute not found");
  if (dispute.type !== "solo") throw new Error("Not an AITA dispute");

  const jury = getJury(dispute.jury_id);

  const prompt = `You are judging an "Am I The Asshole?" case. One person has submitted their story and wants to know if THEY are in the wrong.

SITUATION: "${dispute.topic}"

${dispute.person_a_name.toUpperCase()}'S STORY:
"${dispute.person_a_argument}"

Read the story carefully. Deliver your verdict: Is ${dispute.person_a_name} the asshole, or not? You MUST pick one — YTA (You're The Asshole) or NTA (Not The Asshole). No middle ground.

After your verdict text, add these on NEW LINES in this exact format:
WINNER: person_a
TEASER: [One punchy sentence that captures the drama of this story — like a headline that makes people desperate to find out the verdict]

For WINNER:
- Use "person_a" if they ARE the asshole (YTA)
- Use "person_b" if they are NOT the asshole (NTA)

The teaser should be dramatic and curiosity-inducing. Think tabloid headline, not Wikipedia.`;

  const { text } = await generateText({
    model: openai("gpt-4"),
    system: getAITASystemPrompt(jury),
    prompt,
    maxOutputTokens: 1000,
    temperature: 0.8,
  });

  let verdictWinner = "person_b"; // Default NTA
  let verdictText = text;
  let teaser: string | null = null;

  const winnerMatch = text.match(/WINNER:\s*(person_a|person_b)/m);
  if (winnerMatch) {
    verdictWinner = winnerMatch[1];
  }

  const teaserMatch = text.match(/TEASER:\s*(.+)/m);
  if (teaserMatch) {
    teaser = teaserMatch[1].trim();
  }

  verdictText = text
    .replace(/\nWINNER:\s*.+/m, "")
    .replace(/\nTEASER:\s*.+/m, "")
    .trim();

  // Store teaser in person_a_teaser (the single teaser for the story)
  await saveVerdict(disputeId, verdictText, verdictWinner, teaser, null);

  return { verdictText, verdictWinner };
}
