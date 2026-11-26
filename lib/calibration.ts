export type HigherSideName = "LEFT" | "RIGHT";

/** About one card in four of the judge deck is a keyed calibration duel. */
export function isCalibrationSlot(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && (index + 1) % 4 === 0;
}

/**
 * Two agreeing votes lock the key. Three or more lock on a strict majority.
 * A split stays open until another pro breaks it.
 */
export function keyFromVotes(votes: readonly HigherSideName[]): HigherSideName | null {
  if (votes.length < 2) return null;
  const left = votes.filter((vote) => vote === "LEFT").length;
  const right = votes.length - left;
  if (left === votes.length) return "LEFT";
  if (right === votes.length) return "RIGHT";
  if (votes.length >= 3 && left !== right) return left > right ? "LEFT" : "RIGHT";
  return null;
}

export const GUEST_DUELS = 3;
