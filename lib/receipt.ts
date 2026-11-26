import { createHash, randomBytes } from "node:crypto";
import { eyeLevel, type EyeLevel } from "@/lib/eye";
import { ordinalMedian } from "@/lib/median";

export const DEFAULT_VERDICT_QUORUM = 7;
export const DEFAULT_APPEAL_AGREEMENT = 0.6;
export const DEFAULT_CALIBRATION_MINIMUM = 1;
export const DEFAULT_RECEIPT_PEPPER = "gsr-receipt-v1";

export type HoldDecision = "rank" | "quorum" | "appeal";

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

/** Fraction in (0, 1]. Below this, Monday opens a Golden Eye quorum instead of ranking. */
export function appealThreshold(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.GSR_APPEAL_AGREEMENT?.trim();
  if (!raw) return DEFAULT_APPEAL_AGREEMENT;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 1) return DEFAULT_APPEAL_AGREEMENT;
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

export function mondayGate(input: {
  judges: readonly QuorumJudge[];
  agreement: number;
  appealSealed: number;
  quorum: number;
  threshold: number;
}): HoldDecision {
  if (quorumCount(input.judges) < input.quorum) return "quorum";
  if (input.agreement < input.threshold && input.appealSealed < input.quorum) return "appeal";
  return "rank";
}

export type AppealCandidate = { userId: string; eye: number; level: string };

/**
 * A second quorum. Golden Eye first. If that bench is short, the highest eye
 * scores fill the remaining seats. People who already judged this wave are out.
 */
export function appealPanel(
  candidates: readonly AppealCandidate[],
  alreadyJudged: ReadonlySet<string>,
  quorum: number,
): { ids: string[]; fallback: boolean } {
  const fresh = candidates.filter((candidate) => !alreadyJudged.has(candidate.userId));
  const byEye = (a: AppealCandidate, b: AppealCandidate) => b.eye - a.eye || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0);
  const golden = fresh.filter((candidate) => candidate.level === "Golden Eye" || candidate.eye >= 90).sort(byEye);
  if (golden.length >= quorum) {
    return { ids: golden.slice(0, quorum).map((candidate) => candidate.userId), fallback: false };
  }
  const goldenIds = new Set(golden.map((candidate) => candidate.userId));
  const rest = fresh.filter((candidate) => !goldenIds.has(candidate.userId)).sort(byEye);
  return {
    ids: [...golden, ...rest].slice(0, quorum).map((candidate) => candidate.userId),
    fallback: true,
  };
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

export function holdCopy(reason: "NONE" | "QUORUM" | "APPEAL", quorum: number): string | null {
  if (reason === "QUORUM") {
    return `This wave did not reach ${quorum} calibrated judges for its title. It is not ranked and rolls to next Monday.`;
  }
  if (reason === "APPEAL") {
    return "The judges did not agree. A second quorum of Golden Eye judges has the wave before it is ranked. It rolls to the next Monday if that quorum is still open.";
  }
  return null;
}

export function levelName(score: number): EyeLevel {
  return eyeLevel(score);
}
