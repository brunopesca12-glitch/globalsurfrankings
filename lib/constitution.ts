/**
 * Constitutional constants from GSR Founding Edition v10.1 (6 Oct 2026).
 * Changing these is a governance act, not a product tweak.
 * The house never competes. Ocean athletes are never charged.
 * The platform mirrors the escrow. It does not hold or pay the purse.
 */

export const OCEAN_ENTRY_TOLL_CENTS = 0;
export const POOL_TOLL_CENTS = 2_000;
export const OCEAN_WAVES_PER_ISO_WEEK = 1;

/** 84% of a theme ticket, all of it to surfers: competitors plus surfer-judges. */
export const SURFER_RAIL_BPS = 8_400;
export const ATHLETE_RAIL_BPS = SURFER_RAIL_BPS;
/** 78% prize money. */
export const COMPETITOR_RAIL_BPS = 7_800;
/** 6% judges' fee, 3% to each paid college. */
export const JUDGE_RAIL_BPS = 600;
export const CHAMBER_RAIL_BPS = 300;
export const RANKED_RAIL_BPS = 300;
export const PLATFORM_RAIL_BPS = 1_600;

export const THEME_TICKET_USD = 400_000;
/** Season 1 judges six events. The per-event ticket and the 78/6/16 split are unchanged. */
export const FOUNDING_THEME_COUNT = 6;
/** Founding Season Mondays, 1 Mar – 30 Sep 2027. 6 × US$ 46,500 / 30 = US$ 9,300. */
export const FOUNDING_WEEKS = 30;

/** Of the 78% prize money: season tables, weekly race, world champions' fund. Sums to US$ 312,000. */
export const PURSE_WEIGHTS = {
  seasonTable: 232_000,
  weekly: 46_500,
  overall: 33_500,
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
/** Sealed ballots a college needs on a wave. Below this, that college abstains. */
export const COLLEGE_QUORUM = 3;
/** Annex B.3 names the same threshold for the Ranked payroll. */
export const RANKED_QUORUM = COLLEGE_QUORUM;
/**
 * Ballots in one ISO week. The white paper calls the duty about fifteen minutes;
 * eight ballots is the queue this MVP draws.
 */
export const WEEKLY_JUDGING_BALLOTS = 8;
/** Automatic Upper Chamber: the top of each category ranking. */
export const UPPER_CHAMBER_SIZE = 10;

export const CLUB_SERVICE_FEE_BPS = 2_000;

export const POINTS_BASE = 100;
export const PODIUM_POINT_FRACTIONS = [1, 0.6, 0.45, 0.35, 0.28, 0.22] as const;
export const TOP_FIFTH_POINT_FRACTION = 0.12;
export const ENTRANT_POINT_FRACTION = 0.04;

/** Podium curve, shares of the six. Sum 100. On a large field this is 80% of the table. */
export const PODIUM_CURVE = [35, 20, 14, 12, 10, 9] as const;
/** Large-field podium, basis points of the edition table (28% … 7.2%). Sum 8_000. */
export const LARGE_FIELD_PODIUM_BPS = [2_800, 1_600, 1_120, 960, 800, 720] as const;
/** Places 7 through the top fifth share this slice of the table, equally, capped at sixth. */
export const TAIL_POOL_BPS = 2_000;
export const SIXTH_CAP_BPS = 720;
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
 * Section 5 table, rounded to the dollar. The executable law is `payout.ts`:
 * a large field pays the winner 28% and sixth 7.2% of the edition table.
 */
export const PRINTED_EDITION_HEADLINES: Record<EditionId, { winnerUsd: number; sixthUsd: number }> = {
  OPEN_M: { winnerUsd: 25_984, sixthUsd: 6_682 },
  MASTERS_40_M: { winnerUsd: 9_744, sixthUsd: 2_506 },
  MASTERS_50_M: { winnerUsd: 7_795, sixthUsd: 2_004 },
  OPEN_W: { winnerUsd: 6_496, sixthUsd: 1_670 },
  JUNIOR_M: { winnerUsd: 6_496, sixthUsd: 1_670 },
  JUNIOR_W: { winnerUsd: 3_248, sixthUsd: 835 },
  MASTERS_50_W: { winnerUsd: 3_248, sixthUsd: 835 },
  MASTERS_40_W: { winnerUsd: 1_949, sixthUsd: 501 },
};

/** Annex B.2: four theme wins + Overall cash + estimated weeklies. Credits sit beside the cash. */
export const PRINTED_CHAMPION_SEASON: Record<
  EditionId,
  { eventWinsUsd: number; overallUsd: number; weekliesUsd: number; totalCashUsd: number; creditsUsd: number }
> = {
  OPEN_M: { eventWinsUsd: 103_936, overallUsd: 160_800, weekliesUsd: 13_900, totalCashUsd: 278_636, creditsUsd: 133_000 },
  MASTERS_40_M: { eventWinsUsd: 38_976, overallUsd: 60_300, weekliesUsd: 5_200, totalCashUsd: 104_476, creditsUsd: 50_000 },
  MASTERS_50_M: { eventWinsUsd: 31_180, overallUsd: 48_240, weekliesUsd: 4_200, totalCashUsd: 83_620, creditsUsd: 40_000 },
  OPEN_W: { eventWinsUsd: 25_984, overallUsd: 40_200, weekliesUsd: 3_400, totalCashUsd: 69_584, creditsUsd: 33_300 },
  JUNIOR_M: { eventWinsUsd: 25_984, overallUsd: 40_200, weekliesUsd: 3_400, totalCashUsd: 69_584, creditsUsd: 33_300 },
  JUNIOR_W: { eventWinsUsd: 12_992, overallUsd: 20_100, weekliesUsd: 1_800, totalCashUsd: 34_892, creditsUsd: 16_600 },
  MASTERS_50_W: { eventWinsUsd: 12_992, overallUsd: 20_100, weekliesUsd: 1_800, totalCashUsd: 34_892, creditsUsd: 16_600 },
  MASTERS_40_W: { eventWinsUsd: 7_796, overallUsd: 12_060, weekliesUsd: 1_000, totalCashUsd: 20_856, creditsUsd: 10_000 },
};

/** Annex B.3 founding scenario, printed per ballot. The US$ 6 figure is a cap, not the rate. */
export const PRINTED_BALLOT_PAY = {
  rankedUsd: 3.3,
  chamberUsd: 4.8,
  capUsd: RANKED_BALLOT_USD,
} as const;

export function splitTicketCents(ticketCents: number): {
  athleteCents: number;
  competitorCents: number;
  judgeCents: number;
  chamberCents: number;
  rankedCents: number;
  platformCents: number;
} {
  if (!Number.isInteger(ticketCents) || ticketCents < 0) {
    throw new Error("ticketCents must be a non-negative integer");
  }
  const [athleteCents, platformCents] = allocateByWeights(ticketCents, [SURFER_RAIL_BPS, PLATFORM_RAIL_BPS]);
  const [competitorCents, judgeCents] = allocateByWeights(athleteCents!, [COMPETITOR_RAIL_BPS, JUDGE_RAIL_BPS]);
  const [chamberCents, rankedCents] = allocateByWeights(judgeCents!, [CHAMBER_RAIL_BPS, RANKED_RAIL_BPS]);
  return {
    athleteCents: athleteCents!,
    competitorCents: competitorCents!,
    judgeCents: judgeCents!,
    chamberCents: chamberCents!,
    rankedCents: rankedCents!,
    platformCents: platformCents!,
  };
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

/** Splits the 78% prize money. The 6% judges' fee is not part of this purse. */
export function splitAffixedPurse(competitorCents: number): {
  seasonTableCents: number;
  weeklyCents: number;
  overallCents: number;
} {
  const [seasonTableCents, weeklyCents, overallCents] = allocateByWeights(competitorCents, [
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
  const purse = splitAffixedPurse(perTheme.competitorCents);
  const themes = FOUNDING_THEME_COUNT;
  return {
    ticketUsd: THEME_TICKET_USD,
    athleteUsd: perTheme.athleteCents / 100,
    competitorUsd: perTheme.competitorCents / 100,
    judgeUsd: perTheme.judgeCents / 100,
    chamberUsd: perTheme.chamberCents / 100,
    rankedUsd: perTheme.rankedCents / 100,
    platformUsd: perTheme.platformCents / 100,
    seasonTableUsd: purse.seasonTableCents / 100,
    weeklyUsd: purse.weeklyCents / 100,
    overallUsd: purse.overallCents / 100,
    seasonAthleteUsd: (perTheme.athleteCents * themes) / 100,
    seasonCompetitorUsd: (perTheme.competitorCents * themes) / 100,
    seasonJudgeUsd: (perTheme.judgeCents * themes) / 100,
    seasonPlatformUsd: (perTheme.platformCents * themes) / 100,
    seasonBookCashUsd: (ticketCents * themes) / 100,
    poolTollUsd: (FOUNDING_POOL_ENTRIES * POOL_TOLL_CENTS) / 100,
    presenterFaceUsd: PRESENTER_FACE_USD,
    weeklyPerMondayUsd: (purse.weeklyCents * themes) / 100 / FOUNDING_WEEKS,
  };
})();
