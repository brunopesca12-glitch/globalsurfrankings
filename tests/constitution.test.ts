import { describe, expect, it } from "vitest";
import {
  ATHLETE_RAIL_BPS,
  EDITIONS,
  FOUNDING,
  FOUNDING_POOL_ENTRIES,
  OCEAN_ENTRY_TOLL_CENTS,
  PLATFORM_RAIL_BPS,
  POOL_TOLL_CENTS,
  PRESENTER_FACE_USD,
  PRESENTER_WEIGHTS,
  PRINTED_CHAMPION_SEASON,
  PRINTED_EDITION_HEADLINES,
  PURSE_WEIGHTS,
  THEME_TICKET_USD,
  allocateByWeights,
  splitAffixedPurse,
  splitTicketCents,
} from "@/lib/constitution";

describe("constitutional rails", () => {
  it("charges nothing for the ocean and US$ 20 for the pool", () => {
    expect(OCEAN_ENTRY_TOLL_CENTS).toBe(0);
    expect(POOL_TOLL_CENTS).toBe(2_000);
  });

  it("splits every ticket 78 / 6 / 16, with 84% still to surfers", () => {
    expect(ATHLETE_RAIL_BPS + PLATFORM_RAIL_BPS).toBe(10_000);
    for (const cents of [0, 1, 99, 100, 20_000, THEME_TICKET_USD * 100, 123_456_789]) {
      const split = splitTicketCents(cents);
      expect(split.athleteCents + split.platformCents).toBe(cents);
      expect(split.competitorCents + split.judgeCents).toBe(split.athleteCents);
      expect(split.chamberCents + split.rankedCents).toBe(split.judgeCents);
    }
    const founding = splitTicketCents(THEME_TICKET_USD * 100);
    expect(founding.athleteCents).toBe(33_600_000);
    expect(founding.competitorCents).toBe(31_200_000);
    expect(founding.judgeCents).toBe(2_400_000);
    expect(founding.chamberCents).toBe(1_200_000);
    expect(founding.rankedCents).toBe(1_200_000);
    expect(founding.platformCents).toBe(6_400_000);
  });

  it("splits the prize money 232 / 46.5 / 33.5, summing to the 78%", () => {
    expect(PURSE_WEIGHTS.seasonTable + PURSE_WEIGHTS.weekly + PURSE_WEIGHTS.overall).toBe(312_000);
    const purse = splitAffixedPurse(31_200_000);
    expect(purse).toEqual({
      seasonTableCents: 23_200_000,
      weeklyCents: 4_650_000,
      overallCents: 3_350_000,
    });
    for (const cents of [0, 1, 312_000, 10_000, 31_200_000]) {
      const split = splitAffixedPurse(cents);
      expect(split.seasonTableCents + split.weeklyCents + split.overallCents).toBe(cents);
    }
  });

  it("reconciles the founding book in Annex B.1", () => {
    expect(FOUNDING.athleteUsd).toBe(336_000);
    expect(FOUNDING.competitorUsd).toBe(312_000);
    expect(FOUNDING.judgeUsd).toBe(24_000);
    expect(FOUNDING.chamberUsd).toBe(12_000);
    expect(FOUNDING.rankedUsd).toBe(12_000);
    expect(FOUNDING.platformUsd).toBe(64_000);
    expect(FOUNDING.seasonTableUsd).toBe(232_000);
    expect(FOUNDING.weeklyUsd).toBe(46_500);
    expect(FOUNDING.overallUsd).toBe(33_500);
    expect(FOUNDING.seasonAthleteUsd).toBe(2_016_000);
    expect(FOUNDING.seasonCompetitorUsd).toBe(1_872_000);
    expect(FOUNDING.seasonJudgeUsd).toBe(144_000);
    expect(FOUNDING.seasonPlatformUsd).toBe(384_000);
    expect(FOUNDING.seasonBookCashUsd).toBe(2_400_000);
    expect(FOUNDING.poolTollUsd).toBe(FOUNDING_POOL_ENTRIES * 20);
    expect(FOUNDING.seasonAthleteUsd + FOUNDING.seasonPlatformUsd + FOUNDING.presenterFaceUsd + FOUNDING.poolTollUsd).toBe(
      4_650_000,
    );
    expect(FOUNDING.weeklyPerMondayUsd).toBe(9_300);
  });

  it("splits the presenter face 76 / 8 / 16", () => {
    const weights = [
      PRESENTER_WEIGHTS.overallLeaderboards,
      PRESENTER_WEIGHTS.chamberTravel,
      PRESENTER_WEIGHTS.operations,
    ];
    expect(weights.reduce((sum, weight) => sum + weight, 0)).toBe(100);
    expect(allocateByWeights(PRESENTER_FACE_USD * 100, weights)).toEqual([133_000_000, 14_000_000, 28_000_000]);
  });

  it("field shares sum to 100% and the printed champion rows add up", () => {
    expect(EDITIONS.reduce((sum, edition) => sum + edition.shareBps, 0)).toBe(10_000);
    for (const edition of EDITIONS) {
      const printed = PRINTED_CHAMPION_SEASON[edition.id];
      expect(printed.eventWinsUsd).toBe(PRINTED_EDITION_HEADLINES[edition.id].winnerUsd * 4);
      expect(printed.eventWinsUsd + printed.overallUsd + printed.weekliesUsd).toBe(printed.totalCashUsd);
    }
  });
});
