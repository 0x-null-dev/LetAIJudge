export type { JuryCharacter } from "./types";
export { AXIOM_9 } from "./axiom-9";

import type { JuryCharacter } from "./types";
import { AXIOM_9 } from "./axiom-9";

const JUDGES: Record<string, JuryCharacter> = {
  [AXIOM_9.id]: AXIOM_9,
};

const DEFAULT_JUDGE = AXIOM_9;

export function getJury(juryId: string): JuryCharacter {
  return JUDGES[juryId] ?? DEFAULT_JUDGE;
}

export function getRandomJury(): JuryCharacter {
  const all = Object.values(JUDGES);
  return all[Math.floor(Math.random() * all.length)];
}
