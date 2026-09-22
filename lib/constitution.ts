/**
 * Constitutional constants from GSR Founding Edition v9 (September 2026).
 * Changing these is a governance act, not a product tweak.
 * The house never competes. Ocean athletes are never charged.
 */

export const OCEAN_ENTRY_TOLL_CENTS = 0;
export const POOL_TOLL_CENTS = 2_000;
export const OCEAN_WAVES_PER_ISO_WEEK = 1;

export const ATHLETE_RAIL_BPS = 8_400;
export const PLATFORM_RAIL_BPS = 1_600;

export const THEME_TICKET_USD = 400_000;
export const FOUNDING_THEME_COUNT = 12;

/** Of each theme's affixed purse (the athlete rail): season tables, weekly race, world champions' fund. */
export const PURSE_WEIGHTS = {
  seasonTable: 250,
  weekly: 50,
  overall: 36,
} as const;

export const PRESENTER_FACE_USD = 1_750_000;
export const PRESENTER_WEIGHTS = {
  overallLeaderboards: 76,
  chamberTravel: 8,
  operations: 16,
} as const;

/** Founding scenario, Annex B. Not a live field. */
export const FOUNDING_OCEAN_ATHLETES = 8_000;
export const FOUNDING_POOL_ENTRIES = 25_000;

export const RANKED_BALLOT_USD = 6;
export const RANKED_QUORUM = 3;

export const CLUB_SERVICE_FEE_BPS = 2_000;

export const POINTS_BASE = 100;
export const PODIUM_POINT_FRACTIONS = [1, 0.6, 0.45, 0.35, 0.28, 0.22] as const;
export const TOP_FIFTH_POINT_FRACTION = 0.12;
export const ENTRANT_POINT_FRACTION = 0.04;

/** Season-table places, as shares of the edition table. Sum is 100. */
export const PODIUM_PAYOUT_BPS = [3_500, 2_000, 1_400, 1_200, 1_000, 900] as const;
/** Weight of each paid place after sixth, before the shares are normalised to 100%. */
export const TAIL_PAYOUT_WEIGHT = 4;
export const PAID_FIELD_FRACTION = 0.2;

export type EditionId =
  | "OPEN_M"
  | "MASTERS_40_M"
  | "MASTERS_50_M"
  | "OPEN_W"
  | "JUNIOR_M"
  | "JUNIOR_W"
  | "MASTERS_50_W"
  | "MASTERS_40_W";

export type Edition = {
  id: EditionId;
  category: "OPEN" | "JUNIOR" | "MASTERS_40" | "MASTERS_50";
  sex: "M" | "W";
  label: string;
  /** Basis points of the theme's season table. The eight editions sum to 10_000. */
  shareBps: number;
};

export const EDITIONS: readonly Edition[] = [
  { id: "OPEN_M", category: "OPEN", sex: "M", label: "Open — Men", shareBps: 4_000 },
  { id: "MASTERS_40_M", category: "MASTERS_40", sex: "M", label: "Masters 40+ — Men", shareBps: 1_500 },
  { id: "MASTERS_50_M", category: "MASTERS_50", sex: "M", label: "Masters 50+ — Men", shareBps: 1_200 },
  { id: "OPEN_W", category: "OPEN", sex: "W", label: "Open — Women", shareBps: 1_000 },
  { id: "JUNIOR_M", category: "JUNIOR", sex: "M", label: "Junior — Men", shareBps: 1_000 },
  { id: "JUNIOR_W", category: "JUNIOR", sex: "W", label: "Junior — Women", shareBps: 500 },
  { id: "MASTERS_50_W", category: "MASTERS_50", sex: "W", label: "Masters 50+ — Women", shareBps: 500 },
  { id: "MASTERS_40_W", category: "MASTERS_40", sex: "W", label: "Masters 40+ — Women", shareBps: 300 },
] as const;

/**
 * Figures printed in Annex B.2 / the Section 5 table, including the edition's
 * own rounding. The executable law is the exact curve in `payout.ts`.
 * Winner and sixth are the only places the paper prints per edition.
 */
export const PRINTED_EDITION_HEADLINES: Record<EditionId, { winnerUsd: number; sixthUsd: number }> = {
  OPEN_M: { winnerUsd: 35_000, sixthUsd: 9_000 },
  MASTERS_40_M: { winnerUsd: 13_100, sixthUsd: 3_400 },
  MASTERS_50_M: { winnerUsd: 10_500, sixthUsd: 2_700 },
  OPEN_W: { winnerUsd: 8_750, sixthUsd: 2_250 },
  JUNIOR_M: { winnerUsd: 8_750, sixthUsd: 2_250 },
  JUNIOR_W: { winnerUsd: 4_400, sixthUsd: 1_100 },
  MASTERS_50_W: { winnerUsd: 4_400, sixthUsd: 1_100 },
  MASTERS_40_W: { winnerUsd: 2_600, sixthUsd: 650 },
};

/** Annex B.2 modelled campaign: 4 theme wins + Overall cash + weekly estimates. */
export const PRINTED_CHAMPION_SEASON: Record<
  EditionId,
  { eventWinsUsd: number; overallUsd: number; weekliesUsd: number; totalCashUsd: number; creditsUsd: number }
> = {
  OPEN_M: { eventWinsUsd: 140_000, overallUsd: 172_800, weekliesUsd: 15_000, totalCashUsd: 327_800, creditsUsd: 133_000 },
  MASTERS_40_M: { eventWinsUsd: 52_400, overallUsd: 64_800, weekliesUsd: 5_600, totalCashUsd: 122_800, creditsUsd: 50_000 },
  MASTERS_50_M: { eventWinsUsd: 42_000, overallUsd: 51_800, weekliesUsd: 4_500, totalCashUsd: 98_300, creditsUsd: 40_000 },
  OPEN_W: { eventWinsUsd: 35_000, overallUsd: 43_200, weekliesUsd: 3_700, totalCashUsd: 81_900, creditsUsd: 33_300 },
  JUNIOR_M: { eventWinsUsd: 35_000, overallUsd: 43_200, weekliesUsd: 3_700, totalCashUsd: 81_900, creditsUsd: 33_300 },
  JUNIOR_W: { eventWinsUsd: 17_600, overallUsd: 21_600, weekliesUsd: 1_900, totalCashUsd: 41_100, creditsUsd: 16_600 },
  MASTERS_50_W: { eventWinsUsd: 17_600, overallUsd: 21_600, weekliesUsd: 1_900, totalCashUsd: 41_100, creditsUsd: 16_600 },
  MASTERS_40_W: { eventWinsUsd: 10_400, overallUsd: 13_000, weekliesUsd: 1_100, totalCashUsd: 24_500, creditsUsd: 10_000 },
};

export function splitTicketCents(ticketCents: number): { athleteCents: number; platformCents: number } {
  if (!Number.isInteger(ticketCents) || ticketCents < 0) {
    throw new Error("ticketCents must be a non-negative integer");
  }
  const athleteCents = Math.floor((ticketCents * ATHLETE_RAIL_BPS) / 10_000);
  return { athleteCents, platformCents: ticketCents - athleteCents };
}

export function allocateByWeights(total: number, weights: readonly number[]): number[] {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error("total must be a non-negative integer");
  }
  if (weights.length === 0) return [];
  if (weights.some((weight) => !Number.isInteger(weight) || weight < 0)) {
    throw new Error("weights must be non-negative integers");
  }
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  if (sum === 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (weight * total) / sum);
  const floors = exact.map((value) => Math.floor(value));
  const remainder = total - floors.reduce((acc, value) => acc + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - floors[index]! }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  const shares = [...floors];
  for (let i = 0; i < remainder; i += 1) {
    shares[order[i]!.index] += 1;
  }
  return shares;
}

export function splitAffixedPurse(athleteCents: number): {
  seasonTableCents: number;
  weeklyCents: number;
  overallCents: number;
} {
  const [seasonTableCents, weeklyCents, overallCents] = allocateByWeights(athleteCents, [
    PURSE_WEIGHTS.seasonTable,
    PURSE_WEIGHTS.weekly,
    PURSE_WEIGHTS.overall,
  ]);
  return { seasonTableCents: seasonTableCents!, weeklyCents: weeklyCents!, overallCents: overallCents! };
}

export function editionSeasonTableCents(seasonTableCents: number, shareBps: number): number {
  if (!Number.isInteger(shareBps) || shareBps < 0) {
    throw new Error("shareBps must be a non-negative integer");
  }
  return Math.floor((seasonTableCents * shareBps) / 10_000);
}

export const FOUNDING = (() => {
  const ticketCents = THEME_TICKET_USD * 100;
  const perTheme = splitTicketCents(ticketCents);
  const purse = splitAffixedPurse(perTheme.athleteCents);
  const themes = FOUNDING_THEME_COUNT;
  return {
    ticketUsd: THEME_TICKET_USD,
    athleteUsd: perTheme.athleteCents / 100,
    platformUsd: perTheme.platformCents / 100,
    seasonTableUsd: purse.seasonTableCents / 100,
    weeklyUsd: purse.weeklyCents / 100,
    overallUsd: purse.overallCents / 100,
    seasonAthleteUsd: (perTheme.athleteCents * themes) / 100,
    seasonPlatformUsd: (perTheme.platformCents * themes) / 100,
    seasonBookCashUsd: (ticketCents * themes) / 100,
    poolTollUsd: (FOUNDING_POOL_ENTRIES * POOL_TOLL_CENTS) / 100,
    presenterFaceUsd: PRESENTER_FACE_USD,
    weeklyPerMondayUsd: (purse.weeklyCents * themes) / 100 / 52,
  };
})();
