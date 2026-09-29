import { UPPER_CHAMBER_SIZE } from "@/lib/constitution";
import {
  COLLEGES,
  collegeSeat,
  medianCollegePlace,
  type College,
  type CollegeBallot,
} from "@/lib/median";

export type { College };

export type ManualCollege = "CHAMBER" | "RANKED";

/**
 * One person sits in one college. Upper outranks Athletes: the top 10 are the
 * same people as the Athletes' College, and seating Athletes first would leave
 * the Upper Chamber empty.
 */
export const SEAT_PRECEDENCE = ["CHAMBER", "RANKED", "UPPER", "ATHLETES", "PUBLIC"] as const;

export const COLLEGE_PUBLIC_LABEL: Record<College, string> = {
  CHAMBER: "Chamber",
  RANKED: "Ranked",
  ATHLETES: "Athletes",
  UPPER: "Upper",
  PUBLIC: "Public",
};

export const COLLEGE_SEAT_LABEL: Record<College, string> = {
  CHAMBER: "Chamber of Champions",
  RANKED: "The Ranked",
  ATHLETES: "Athletes' College",
  UPPER: "Upper Chamber",
  PUBLIC: "The Public",
};

export function isManualCollege(value: string): value is ManualCollege {
  return value === "CHAMBER" || value === "RANKED";
}

export function resolveCollege(input: {
  role: "ATHLETE" | "ADMIN";
  seatedChamber: boolean;
  seatedRanked: boolean;
  upper: boolean;
  enteredThisSeason: boolean;
}): College | null {
  if (input.seatedChamber) return "CHAMBER";
  if (input.seatedRanked) return "RANKED";
  if (input.role === "ADMIN") return null;
  if (input.upper) return "UPPER";
  if (input.enteredThisSeason) return "ATHLETES";
  return "PUBLIC";
}

export function editionKey(category: string, sex: string): string {
  return `${category}:${sex}`;
}

export function clubKey(club: string | null | undefined): string | null {
  const trimmed = club?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function forbiddenEditionKeys(input: {
  own: { category: string; sex: string } | null;
  clubmates: readonly { category: string; sex: string }[];
  entryEditions: readonly { category: string; sex: string }[];
}): Set<string> {
  const keys = new Set<string>();
  if (input.own) keys.add(editionKey(input.own.category, input.own.sex));
  for (const mate of input.clubmates) keys.add(editionKey(mate.category, mate.sex));
  for (const edition of input.entryEditions) keys.add(editionKey(edition.category, edition.sex));
  return keys;
}

export function forbiddenForAthlete(
  athleteId: string | null,
  athletes: readonly { id: string; clubKey: string | null; category: string; sex: string }[],
  entryEditions: ReadonlyMap<string, readonly { category: string; sex: string }[]>,
): Set<string> {
  if (!athleteId) return new Set();
  const self = athletes.find((athlete) => athlete.id === athleteId);
  if (!self) return new Set();
  const clubmates = self.clubKey
    ? athletes.filter((athlete) => athlete.id !== self.id && athlete.clubKey === self.clubKey)
    : [];
  const editions = [
    ...(entryEditions.get(self.id) ?? []),
    ...clubmates.flatMap((mate) => entryEditions.get(mate.id) ?? []),
  ];
  return forbiddenEditionKeys({
    own: { category: self.category, sex: self.sex },
    clubmates: clubmates.map((mate) => ({ category: mate.category, sex: mate.sex })),
    entryEditions: editions,
  });
}

export function canJudgeEntry(input: {
  judgeAthleteId: string | null;
  entryAthleteId: string;
  edition: string;
  forbidden: ReadonlySet<string>;
}): boolean {
  if (input.judgeAthleteId != null && input.judgeAthleteId === input.entryAthleteId) return false;
  return !input.forbidden.has(input.edition);
}

export function upperAthleteIds(editions: readonly (readonly { athleteId: string; points: number }[])[]): string[] {
  const ids: string[] = [];
  for (const edition of editions) {
    const ranked = [...edition].sort(
      (a, b) => b.points - a.points || (a.athleteId < b.athleteId ? -1 : a.athleteId > b.athleteId ? 1 : 0),
    );
    for (const row of ranked.slice(0, UPPER_CHAMBER_SIZE)) ids.push(row.athleteId);
  }
  return ids;
}

export function dutyIsCurrent(pendingBallots: number): boolean {
  return pendingBallots <= 0;
}

export function dutyStatusLine(pendingBallots: number): string {
  if (pendingBallots <= 0) return "Your duty is current. Your entries are eligible for Monday.";
  const noun = pendingBallots === 1 ? "ballot" : "ballots";
  return `Complete ${pendingBallots} ${noun} to keep your entries eligible.`;
}

export function ballotProgressLine(sealed: number, total: number): string {
  if (total <= 0) return "No ballots in the draw this week.";
  const noun = total === 1 ? "ballot" : "ballots";
  return `${sealed} of ${total} ${noun} this week`;
}

export function accuracyLine(summary: { mean: number; verdicts: number } | null): string {
  if (!summary) return "Your accuracy appears after Monday publishes a verdict you voted on.";
  const noun = summary.verdicts === 1 ? "published verdict" : "published verdicts";
  const mean = summary.mean.toFixed(1);
  return `Your accuracy: mean deviation ${mean} places across ${summary.verdicts} ${noun}.`;
}

export function meanAbsoluteDeviation(pairs: readonly { ballotPlace: number; finalPlace: number }[]): number | null {
  if (pairs.length === 0) return null;
  const total = pairs.reduce((sum, pair) => sum + Math.abs(pair.ballotPlace - pair.finalPlace), 0);
  return Math.round((total / pairs.length) * 10) / 10;
}

/**
 * Blind draw: take `count` entries, always from those the college has judged
 * least, and at random inside that tie.
 */
export function drawEntries<T extends { id: string; collegeBallots: number }>(
  candidates: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const pool = [...candidates];
  const drawn: T[] = [];
  while (drawn.length < count && pool.length > 0) {
    let min = pool[0]!.collegeBallots;
    for (const item of pool) min = Math.min(min, item.collegeBallots);
    const tied = pool
      .filter((item) => item.collegeBallots === min)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const index = Math.min(tied.length - 1, Math.floor(random() * tied.length));
    const choice = tied[index]!;
    drawn.push(choice);
    const removeAt = pool.findIndex((item) => item.id === choice.id);
    pool.splice(removeAt, 1);
  }
  return drawn;
}

export type SealedCollegeBallot = { college: College; place: number };

export function collegeVerdictsFromBallots(ballots: readonly SealedCollegeBallot[]): {
  college: College;
  place: number | null;
  ballots: number;
}[] {
  return COLLEGES.map((college) => {
    const places = ballots.filter((ballot) => ballot.college === college).map((ballot) => ballot.place);
    return { college, place: collegeSeat(college, places), ballots: places.length };
  });
}

export function finalPlaceFromCollegeVerdicts(verdicts: readonly CollegeBallot[]): number | null {
  return medianCollegePlace(verdicts);
}

export type ProposedVerdict = {
  id: string;
  place: number;
  chamberPlace: number | null;
  createdAt: number;
};

/** Best first, then reverse so equal places land with the better wave in front. */
export function verdictInsertionOrder(waves: readonly ProposedVerdict[]): ProposedVerdict[] {
  const bestFirst = [...waves].sort((a, b) => {
    if (a.place !== b.place) return a.place - b.place;
    const chamberA = a.chamberPlace ?? Number.POSITIVE_INFINITY;
    const chamberB = b.chamberPlace ?? Number.POSITIVE_INFINITY;
    if (chamberA !== chamberB) return chamberA - chamberB;
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return bestFirst.reverse();
}

/** Pure mirror of the Monday insert. Index 0 is the best place. */
export function nextBoard(board: readonly string[], waves: readonly ProposedVerdict[]): string[] {
  const next = [...board];
  for (const wave of verdictInsertionOrder(waves)) {
    const place = Math.min(Math.max(wave.place, 1), next.length + 1);
    next.splice(place - 1, 0, wave.id);
  }
  return next;
}
