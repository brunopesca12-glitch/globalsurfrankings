import { RANKED_QUORUM } from "@/lib/constitution";

export const COLLEGES = ["CHAMBER", "RANKED", "ATHLETES", "UPPER", "PUBLIC"] as const;
export type College = (typeof COLLEGES)[number];

export function collegeQuorum(college: College): number {
  return college === "RANKED" ? RANKED_QUORUM : 1;
}

/**
 * Median place inside one college. Even counts take the worse of the two
 * central places — an ordinal has no mean. Empty input abstains.
 */
export function ordinalMedian(places: readonly number[]): number | null {
  if (places.length === 0) return null;
  if (places.some((place) => !Number.isInteger(place) || place < 1)) {
    throw new Error("places must be positive integers");
  }
  const sorted = [...places].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

export function collegeSeat(college: College, ballots: readonly number[]): number | null {
  if (ballots.length < collegeQuorum(college)) return null;
  return ordinalMedian(ballots);
}

export type CollegeBallot = {
  college: College;
  place: number | null;
};

/**
 * The wave's place is the median of the colleges that returned a seat.
 * An even split resolves toward the Chamber of Champions. If the Chamber
 * abstained, the worse of the two central places stands.
 */
export function medianCollegePlace(ballots: readonly CollegeBallot[]): number | null {
  const seen = new Set<College>();
  for (const ballot of ballots) {
    if (seen.has(ballot.college)) throw new Error("one ballot per college");
    seen.add(ballot.college);
  }
  const voting = ballots.filter((ballot): ballot is { college: College; place: number } => ballot.place != null);
  if (voting.length === 0) return null;
  const sorted = [...voting].sort((a, b) => a.place - b.place);
  if (sorted.length % 2 === 1) return sorted[Math.floor(sorted.length / 2)]!.place;

  const lower = sorted[sorted.length / 2 - 1]!.place;
  const upper = sorted[sorted.length / 2]!.place;
  if (lower === upper) return lower;

  const chamber = voting.find((ballot) => ballot.college === "CHAMBER");
  if (!chamber) return upper;
  return Math.abs(chamber.place - lower) <= Math.abs(chamber.place - upper) ? lower : upper;
}
