import { describe, expect, it } from "vitest";
import {
  ATHLETE_RAIL_BPS,
  EDITIONS,
  FOUNDING,
  OCEAN_ENTRY_TOLL_CENTS,
  PLATFORM_RAIL_BPS,
  POOL_TOLL_CENTS,
  PURSE_WEIGHTS,
  SPONSORSHIP_USD,
  THEME_TICKET_CENTS,
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
    for (const cents of [0, 1, 99, 100, 20_000, THEME_TICKET_CENTS, 123_456_789]) {
      const split = splitTicketCents(cents);
      expect(split.athleteCents + split.platformCents).toBe(cents);
      expect(split.competitorCents + split.judgeCents).toBe(split.athleteCents);
      expect(split.chamberCents + split.rankedCents).toBe(split.judgeCents);
    }
    const season = splitTicketCents(SPONSORSHIP_USD * 100);
    expect(season.athleteCents).toBe(420_000_000);
    expect(season.competitorCents).toBe(390_000_000);
    expect(season.judgeCents).toBe(30_000_000);
    expect(season.chamberCents).toBe(15_000_000);
    expect(season.rankedCents).toBe(15_000_000);
    expect(season.platformCents).toBe(80_000_000);
  });

  it("splits the prize money 53 / 36 / 11, summing to the 78%", () => {
    expect(PURSE_WEIGHTS.seasonTable + PURSE_WEIGHTS.weekly + PURSE_WEIGHTS.overall).toBe(10_000);
    expect(splitAffixedPurse(390_000_000)).toEqual({
      seasonTableCents: 206_700_000,
      weeklyCents: 140_400_000,
      overallCents: 42_900_000,
    });
    for (const cents of [0, 1, 312_000, 10_000, 31_200_000]) {
      const split = splitAffixedPurse(cents);
      expect(split.seasonTableCents + split.weeklyCents + split.overallCents).toBe(cents);
    }
  });

  it("reconciles the US$ 5M founding book", () => {
    expect(FOUNDING.sponsorshipUsd).toBe(5_000_000);
    expect(FOUNDING.titles).toBe(7);
    expect(FOUNDING.seasonCompetitorUsd).toBe(3_900_000);
    expect(FOUNDING.seasonJudgeUsd).toBe(300_000);
    expect(FOUNDING.seasonPlatformUsd).toBe(800_000);
    expect(FOUNDING.seasonTableUsd).toBe(2_067_000);
    expect(FOUNDING.weeklyUsd).toBe(1_404_000);
    expect(FOUNDING.overallUsd).toBe(429_000);
    expect(FOUNDING.weeklyPerMondayUsd).toBe(27_000);
    expect(FOUNDING.titleShares).toHaveLength(7);
    expect(FOUNDING.titleShares.reduce((sum, share) => sum + share, 0)).toBe(3_900_000);
    expect(Math.max(...FOUNDING.titleShares) - Math.min(...FOUNDING.titleShares)).toBeLessThanOrEqual(1);
  });

  it("has four divisions whose field shares sum to 100%", () => {
    expect(EDITIONS).toHaveLength(4);
    expect(EDITIONS.reduce((sum, edition) => sum + edition.shareBps, 0)).toBe(10_000);
  });
});
