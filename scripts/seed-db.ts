import { Pool } from "pg";
import { nanoid } from "nanoid";

const DISPUTES = [
  {
    topic: "Should we get a cat?",
    person_a_name: "Sarah",
    person_a_argument:
      "We both work from home, we have the space, and I've wanted a cat since we moved in together. It would make the apartment feel more alive and they're low maintenance compared to dogs. I'll handle the litter box.",
    person_b_name: "Mike",
    person_b_argument:
      "Our apartment is small, we travel a lot on weekends, and cats destroy furniture. We just bought a new couch. Plus 'I'll handle the litter box' is what everyone says before the other person ends up doing it three weeks later.",
    verdict_winner: "person_b",
    verdict_text: `I'm siding with Mike.

Sarah, I hear you — wanting a cat is valid, and yes, they're lower maintenance than dogs. But "I'll handle the litter box" is the "I'll start going to the gym on Monday" of pet ownership promises. Everyone says it. Nobody means it.

Mike raises three concrete points: the furniture risk with a brand new couch, the travel issue (cats still need care when you're gone every weekend), and the historical unreliability of litter box pledges. Sarah's argument is mostly vibes — "it would feel more alive" isn't a plan, it's a Pinterest caption.

Get the cat when you've had the couch for a year and figured out a travel routine. Not before.`,
    person_a_teaser: "Says she'll handle everything — the classic pre-cat promise",
    person_b_teaser: "Just bought a new couch and isn't about to let a cat destroy it",
    votes: { person_a: 23, person_b: 18 },
  },
  {
    topic: "Who left the kitchen a mess?",
    person_a_name: "Alex",
    person_a_argument:
      "I cooked dinner for both of us. The deal has always been one person cooks, the other cleans. You sat on the couch watching TikTok for two hours and now you're complaining the kitchen is dirty. That's literally your job tonight.",
    person_b_name: "Jordan",
    person_b_argument:
      'You used every single pot we own to make pasta. Pasta. There\'s sauce on the ceiling somehow. I agreed to clean up after normal cooking, not a disaster zone. If you can\'t cook without destroying the kitchen, that changes the deal.',
    verdict_winner: "person_a",
    verdict_text: `I'm siding with Alex.

Jordan, I get it — sauce on the ceiling is dramatic. But here's the thing: the deal is the deal. One cooks, one cleans. You don't get to renegotiate the terms based on how many pots were used. That's like saying "I agreed to do laundry, but not THIS much laundry."

Alex cooked for both of you while you watched TikTok for two hours. Two hours. You had time. The mess was sitting right there waiting for you. If you have opinions about how Alex cooks, that's a separate conversation — but tonight, the dishes are yours.

A deal's a deal, Jordan. Put down the phone and pick up the sponge.`,
    person_a_teaser: "Cooked dinner while their partner watched TikTok for two straight hours",
    person_b_teaser: "Found sauce on the CEILING after a simple pasta night",
    votes: { person_a: 31, person_b: 12 },
  },
  {
    topic: "Is it okay to recline your seat on a 2-hour flight?",
    person_a_name: "Tom",
    person_a_argument:
      "I paid for my seat and it reclines. That's what the button is for. The airline designed it this way. I'm 6'2 and I need the back support. If the person behind me has a problem, they can recline too.",
    person_b_name: "Lisa",
    person_b_argument:
      "Just because you can doesn't mean you should. On a short flight you're crushing the person behind you for no reason. Their laptop screen is now at 45 degrees. It's two hours, just sit upright like a civilized person.",
    verdict_winner: "person_b",
    verdict_text: `I'm siding with Lisa.

Tom, you're technically correct — the button exists, you paid for the seat, the airline allows it. Congratulations on meeting the absolute bare minimum standard of "not breaking any rules." That's not the same as being right.

Lisa nails it: two hours. That's it. You're not crossing the Atlantic, you're going to Denver. The person behind you is trying to work, eat, or simply exist without your headrest in their face. "They can recline too" is a domino theory of discomfort that ends with everyone in the last row getting crushed.

Being 6'2 is a real issue — on a 10-hour flight. For two hours, you'll survive sitting upright. The rest of the plane will thank you.`,
    person_a_teaser: "Paid for the seat, it has a button, and he's using it",
    person_b_teaser: "Two hours — just sit upright like a civilized person",
    votes: { person_a: 19, person_b: 34 },
  },
  {
    topic: "Should we cancel on friends tonight?",
    person_a_name: "Mia",
    person_a_argument:
      "We've had a long week, it's raining, we already have leftovers in the fridge, and we haven't had a night in together for weeks. Our friends will understand. I'll text them now, it's not a big deal.",
    person_b_name: "Dan",
    person_b_argument:
      "We cancelled on them last month too. And the month before that. At some point we become the couple that never shows up. They made a reservation. It's dinner, not a marathon. Put on pants and let's go.",
    verdict_winner: "person_b",
    verdict_text: `I'm siding with Dan.

Mia, everything you said is comfortable and cozy and completely reasonable — in isolation. But Dan dropped the bomb: you cancelled last month AND the month before. That changes everything. This isn't about tonight, it's about a pattern.

"Our friends will understand" only works so many times before friends stop inviting you. And they won't tell you they're hurt — they'll just quietly stop asking. Dan sees the bigger picture here. One uncomfortable rainy dinner protects a friendship. Leftovers will be there tomorrow.

Put on pants, Mia. The couch isn't going anywhere.`,
    person_a_teaser: "Long week, rain, leftovers ready — the perfect excuse to stay in",
    person_b_teaser: "They've cancelled twice already and the friends made a reservation",
    votes: { person_a: 14, person_b: 27 },
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Set it in your .env.local file.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  console.log("Seeding database with sample disputes...\n");

  for (const d of DISPUTES) {
    const disputeId = nanoid(12);
    const challengeToken = nanoid(24);

    // Insert the dispute as completed
    await pool.query(
      `INSERT INTO disputes (id, type, topic, person_a_name, person_a_argument, person_b_name, person_b_argument, jury_id, verdict_text, verdict_winner, person_a_teaser, person_b_teaser, status, challenge_token, completed_at)
       VALUES ($1, 'dispute', $2, $3, $4, $5, $6, 'judge-diana', $7, $8, $9, $10, 'complete', $11, NOW())`,
      [
        disputeId,
        d.topic,
        d.person_a_name,
        d.person_a_argument,
        d.person_b_name,
        d.person_b_argument,
        d.verdict_text,
        d.verdict_winner,
        d.person_a_teaser,
        d.person_b_teaser,
        challengeToken,
      ]
    );

    // Insert fake votes
    for (let i = 0; i < d.votes.person_a; i++) {
      await pool.query(
        "INSERT INTO votes (id, dispute_id, choice, voter_ip) VALUES ($1, $2, 'person_a', $3)",
        [nanoid(16), disputeId, `seed-a-${i}`]
      );
    }
    for (let i = 0; i < d.votes.person_b; i++) {
      await pool.query(
        "INSERT INTO votes (id, dispute_id, choice, voter_ip) VALUES ($1, $2, 'person_b', $3)",
        [nanoid(16), disputeId, `seed-b-${i}`]
      );
    }

    console.log(`  ✓ "${d.topic}" (${d.votes.person_a + d.votes.person_b} votes)`);
  }

  console.log(`\nSeeded ${DISPUTES.length} disputes!`);
  await pool.end();
}

seed().catch(console.error);
