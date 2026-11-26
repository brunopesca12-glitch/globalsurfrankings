import { createHash, randomBytes } from "node:crypto";
import { eyeLevel, type EyeLevel } from "@/lib/eye";
import { ordinalMedian } from "@/lib/median";

export const DEFAULT_VERDICT_QUORUM = 7;
export const DEFAULT_CALIBRATION_MINIMUM = 1;
export const DEFAULT_RECEIPT_PEPPER = "gsr-receipt-v1";

export type HoldDecision = "rank" | "quorum";

export function verdictQuorum(env: NodeJS.ProcessEnv = process.env): number {
  return positiveInt(env.GSR_VERDICT_QUORUM, DEFAULT_VERDICT_QUORUM);
}

export function calibrationMinimum(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.GSR_CALIBRATION_MINIMUM?.trim();
  if (!raw) return DEFAULT_CALIBRATION_MINIMUM;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return DEFAULT_CALIBRATION_MINIMUM;
  return value;
}

export function receiptPepper(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.GSR_RECEIPT_PEPPER?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_RECEIPT_PEPPER;
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw?.trim());
  if (!Number.isInteger(value) || value < 1) return fallback;
  return value;
}

export type QuorumJudge = { userId: string; calibrated: boolean; qualified: boolean };

/** Distinct judges who are both calibrated and qualified for this wave's title. */
export function quorumCount(judges: readonly QuorumJudge[]): number {
  const ids = new Set<string>();
  for (const judge of judges) {
    if (judge.calibrated && judge.qualified) ids.add(judge.userId);
  }
  return ids.size;
}

/** Once the quorum is in, that panel's place is the verdict. Agreement does not send it back. */
export function mondayGate(input: { judges: readonly QuorumJudge[]; quorum: number }): HoldDecision {
  if (quorumCount(input.judges) < input.quorum) return "quorum";
  return "rank";
}

export type PairTally = { subjectId: string; probeId: string; better: number; worse: number };

export type DuelAgreement = {
  subjectId: string;
  probeId: string;
  agree: number;
  total: number;
  majority: "BETTER" | "WORSE";
};

export function duelAgreements(pairs: readonly PairTally[]): DuelAgreement[] {
  return pairs
    .map((pair) => {
      const total = pair.better + pair.worse;
      const betterWins = pair.better >= pair.worse;
      return {
        subjectId: pair.subjectId,
        probeId: pair.probeId,
        agree: betterWins ? pair.better : pair.worse,
        total,
        majority: betterWins ? ("BETTER" as const) : ("WORSE" as const),
      };
    })
    .filter((pair) => pair.total > 0);
}

/**
 * Lowest agreement among duels seen by two or more judges.
 * With no shared duel, the share of judges who landed on the median place.
 */
export function waveAgreement(duels: readonly DuelAgreement[], places: readonly number[]): number {
  const shared = duels.filter((duel) => duel.total >= 2);
  if (shared.length > 0) {
    return Math.min(...shared.map((duel) => duel.agree / duel.total));
  }
  if (places.length === 0) return 1;
  const median = ordinalMedian(places);
  if (median == null) return 1;
  return places.filter((place) => place === median).length / places.length;
}

export function isOutlier(input: { place: number | null; median: number | null }): boolean {
  if (input.place == null || input.median == null) return false;
  return Math.abs(input.place - input.median) >= 3;
}

export function judgePseudonym(userId: string, pepper = DEFAULT_RECEIPT_PEPPER): string {
  return `J-${sha256Hex(`${pepper}:${userId}`).slice(0, 8).toUpperCase()}`;
}

export function newNonce(): string {
  return randomBytes(16).toString("hex");
}

export type CanonicalVote = {
  voteId: string;
  subjectId: string;
  probeId: string;
  choice: "BETTER" | "WORSE";
  pseudonym: string;
  timestamp: string;
  nonce: string;
};

/** One line, field order fixed. This is the string that is hashed. */
export function canonicalVote(vote: CanonicalVote): string {
  return [vote.voteId, vote.subjectId, vote.probeId, vote.choice, vote.pseudonym, vote.timestamp, vote.nonce].join("|");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function voteHash(vote: CanonicalVote): string {
  return sha256Hex(canonicalVote(vote));
}

/**
 * Sorted leaves. A parent is SHA-256 of `left|right`. An odd leaf is paired
 * with itself. An empty list hashes the empty string.
 * `chainTx` on the stored root is unused until a later on-chain anchor.
 */
export function merkleRoot(leaves: readonly string[]): string {
  const level = [...leaves].map((leaf) => leaf.toLowerCase()).sort();
  if (level.length === 0) return sha256Hex("");
  let layer = level;
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]!;
      const right = layer[i + 1] ?? left;
      next.push(sha256Hex(`${left}|${right}`));
    }
    layer = next;
  }
  return layer[0]!;
}

export function holdCopy(reason: "NONE" | "QUORUM", quorum: number): string | null {
  if (reason === "QUORUM") {
    return `This wave did not reach ${quorum} calibrated judges for its title. It is not ranked and rolls to next Monday.`;
  }
  return null;
}

export function finalLine(judges: number): string {
  const noun = judges === 1 ? "judge" : "judges";
  return `Judged by ${judges} qualified ${noun}. Verdict final.`;
}

export function levelName(score: number): EyeLevel {
  return eyeLevel(score);
}
