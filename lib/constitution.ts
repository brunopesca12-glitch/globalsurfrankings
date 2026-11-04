/**
 * Constitutional constants from the GSR white paper v11.9 and term sheet (Founding Season 2027–28).
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

/** Founding sponsorship for the whole league, Founding Season 2027–28. */
export const SPONSORSHIP_USD = 5_000_000;
/** Seven titles, judged all season. */
export const FOUNDING_THEME_COUNT = 7;
/** One title's equal share of the founding sponsorship, in cents (floor; the 1-cent residue stays in escrow). */
export const THEME_TICKET_CENTS = Math.floor((SPONSORSHIP_USD * 100) / FOUNDING_THEME_COUNT);
export const THEME_TICKET_USD = THEME_TICKET_CENTS / 100;
/** Founding Season Mondays, 1 Mar 2027 – 29 Feb 2028. */
export const FOUNDING_WEEKS = 52;

/** Of the 78% prize money: 53% season tables, 36% weekly race, 11% world champions' fund. */
export const PURSE_WEIGHTS = {
  seasonTable: 5_300,
  weekly: 3_600,
  overall: 1_100,
} as const;

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

export type EditionId = "OPEN_M" | "OPEN_W" | "MASTERS_40_M" | "MASTERS_40_W";

export type Edition = {
  id: EditionId;
  category: "OPEN" | "MASTERS_40";
  sex: "M" | "W";
  label: string;
  /**
   * Basis points of the title's season table. The four divisions sum to 10_000.
   * The rule is pro-rata to each division's field; before any field exists the
   * divisions are weighted equally.
   */
  shareBps: number;
};

export const EDITIONS: readonly Edition[] = [
  { id: "OPEN_M", category: "OPEN", sex: "M", label: "Open — Men", shareBps: 2_500 },
  { id: "OPEN_W", category: "OPEN", sex: "W", label: "Open — Women", shareBps: 2_500 },
  { id: "MASTERS_40_M", category: "MASTERS_40", sex: "M", label: "Masters 40+ — Men", shareBps: 2_500 },
  { id: "MASTERS_40_W", category: "MASTERS_40", sex: "W", label: "Masters 40+ — Women", shareBps: 2_500 },
] as const;

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
  const seasonCents = SPONSORSHIP_USD * 100;
  const season = splitTicketCents(seasonCents);
  const seasonPurse = splitAffixedPurse(season.competitorCents);
  const perTheme = splitTicketCents(THEME_TICKET_CENTS);
  return {
    sponsorshipUsd: SPONSORSHIP_USD,
    titles: FOUNDING_THEME_COUNT,
    ticketUsd: THEME_TICKET_USD,
    titleCompetitorUsd: perTheme.competitorCents / 100,
    seasonAthleteUsd: season.athleteCents / 100,
    seasonCompetitorUsd: season.competitorCents / 100,
    seasonJudgeUsd: season.judgeCents / 100,
    seasonChamberUsd: season.chamberCents / 100,
    seasonRankedUsd: season.rankedCents / 100,
    seasonPlatformUsd: season.platformCents / 100,
    seasonTableUsd: seasonPurse.seasonTableCents / 100,
    weeklyUsd: seasonPurse.weeklyCents / 100,
    overallUsd: seasonPurse.overallCents / 100,
    weeklyPerMondayUsd: seasonPurse.weeklyCents / 100 / FOUNDING_WEEKS,
  };
})();
