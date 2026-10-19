import { describe, expect, it } from "vitest";
import { FOUNDING_WEEKS, allocateByWeights } from "@/lib/constitution";
import { payoutCents } from "@/lib/payout";
import {
  RULES_VERSION,
  SEASON_CHAMPIONS_CENTS,
  SEASON_JUDGE_CENTS,
  SEASON_WEEKLY_RACE_CENTS,
  THEME_SEASON_TABLE_CENTS,
  buildPublication,
  contentHashOf,
  seasonWeeks,
  verifyContentHash,
  type OrderBallot,
  type OrderPlacement,
} from "@/lib/payment-orders";

const ETH = "0x1111111111111111111111111111111111111111";

const weeks = seasonWeeks("2027-03-01", "2027-09-30");
const first = weeks[0]!;
const firstYear = Number(first.period.slice(0, 4));
const firstWeek = Number(first.period.slice(6));

function placed(overrides: Partial<OrderPlacement> = {}): OrderPlacement {
  return {
    entryId: "entry-1",
    athleteId: "athlete-a",
    displayName: "Ada",
    themeSlug: "best-tube",
    themeName: "Best Tube",
    category: "OPEN",
    sex: "M",
    place: 1,
    isoYear: firstYear,
    isoWeek: firstWeek,
    walletNetwork: "ethereum",
    walletAddress: ETH,
    ...overrides,
  };
}

function ballot(overrides: Partial<OrderBallot> = {}): OrderBallot {
  return {
    userId: "judge-1",
    displayName: "Jules",
    college: "RANKED",
    isoYear: firstYear,
    isoWeek: firstWeek,
    walletNetwork: "ethereum",
    walletAddress: ETH,
    ...overrides,
  };
}

describe("payment orders", () => {
  it("uses every Monday from opening day through the finale", () => {
    expect(weeks).toHaveLength(31);
    expect(weeks).not.toHaveLength(FOUNDING_WEEKS);
    expect(weeks[0]).toMatchObject({ weekMonday: "2027-03-01", payOn: "2027-03-08" });
    expect(weeks[weeks.length - 1]).toMatchObject({ weekMonday: "2027-09-27", payOn: "2027-10-04" });
    for (const week of weeks) {
      expect(new Date(`${week.weekMonday}T00:00:00.000Z`).getUTCDay()).toBe(1);
    }
  });

  it("splits the season weekly race and the judges' fee across those Mondays", () => {
    const publication = buildPublication({ placements: [], fields: [], ballots: [] });
    const weeklyFiles = publication.files.filter((file) => file.clock === "monday");
    expect(weeklyFiles).toHaveLength(31);
    expect(weeklyFiles.reduce((sum, file) => sum + file.weeklyRaceCents, 0)).toBe(SEASON_WEEKLY_RACE_CENTS);
    expect(weeklyFiles.reduce((sum, file) => sum + file.judgeCents, 0)).toBe(SEASON_JUDGE_CENTS);
    expect(weeklyFiles.every((file) => file.weeklyRaceCents === 900_000)).toBe(true);
    expect(publication.files.find((file) => file.period === "2027-season")).toMatchObject({
      clock: "season_close",
      payOn: "2027-09-30",
      orders: [],
    });
  });

  it("keeps a stable hash, and the hash covers the orders rather than a timestamp", () => {
    const input = {
      placements: [placed()],
      fields: [{ themeSlug: "best-tube", category: "OPEN" as const, sex: "M" as const, entrants: 1 }],
      ballots: [],
    };
    const once = buildPublication(input);
    const twice = buildPublication(input);
    expect(once.index.contentHash).toBe(twice.index.contentHash);
    expect(once.files.map((file) => file.contentHash)).toEqual(twice.files.map((file) => file.contentHash));
    for (const file of once.files) expect(verifyContentHash(file)).toBe(true);
    expect(verifyContentHash(once.index)).toBe(true);

    const week = once.files.find((file) => file.period === first.period)!;
    const forged = {
      ...week,
      orders: week.orders.map((order) => ({ ...order, amountCents: order.amountCents + 1 })),
    };
    expect(verifyContentHash(forged)).toBe(false);
    expect(contentHashOf({ b: 1, a: 2 })).toBe(contentHashOf({ a: 2, b: 1 }));
  });

  it("pays the weekly curve, and withholds the share of an edition that had no waves", () => {
    const rows = Array.from({ length: 30 }, (_, index) => {
      const place = index + 1;
      return placed({
        entryId: `entry-${place}`,
        athleteId: `athlete-${place}`,
        displayName: `Surfer ${place}`,
        place,
      });
    });
    const publication = buildPublication({
      placements: rows,
      fields: [{ themeSlug: "best-tube", category: "OPEN", sex: "M", entrants: 30 }],
      ballots: [],
    });
    const week = publication.files.find((file) => file.period === first.period)!;
    const weekly = week.orders.filter((order) => order.splitBasis === "weekly_race");
    const expected = payoutCents(360_000, 6);
    expect(weekly.map((order) => order.amountCents)).toEqual(expected);
    expect(weekly.reduce((sum, order) => sum + order.amountCents, 0)).toBe(360_000);
    expect(week.orders.every((order) => order.board === "Men's Open")).toBe(true);
    expect(weekly[0]).toMatchObject({
      id: `${RULES_VERSION}:${first.period}:weekly_race:entry-1`,
      event: "Best Tube",
      board: "Men's Open",
      placement: 1,
      amountUsdc: "1260.000000",
      amountBaseUnits: String(126_000 * 10_000),
      ruleRef: `${RULES_VERSION}#weekly-race`,
      status: "published",
      walletNetwork: "ethereum",
    });
  });

  it("pays the season table on board place and the champions' fund to the points leader", () => {
    const publication = buildPublication({
      placements: [
        placed({ entryId: "tube", athleteId: "athlete-b", displayName: "Bea", place: 1 }),
        placed({
          entryId: "front",
          athleteId: "athlete-a",
          displayName: "Ada",
          themeSlug: "frontside",
          themeName: "Frontside",
          place: 1,
        }),
      ],
      fields: [
        { themeSlug: "best-tube", category: "OPEN", sex: "M", entrants: 1 },
        { themeSlug: "frontside", category: "OPEN", sex: "M", entrants: 1 },
      ],
      ballots: [],
    });
    const season = publication.files.find((file) => file.period === "2027-season")!;
    const tables = season.orders.filter((order) => order.splitBasis === "season_table");
    expect(tables.map((order) => order.amountCents)).toEqual([9_280_000, 9_280_000]);
    expect(tables.every((order) => order.clock === "season_close")).toBe(true);
    const champion = season.orders.find((order) => order.splitBasis === "champions_fund");
    expect(champion).toMatchObject({
      id: `${RULES_VERSION}:2027-season:champions_fund:OPEN:M`,
      recipientId: "athlete-a",
      placement: 1,
      event: "Season ranking",
      amountCents: 8_040_000,
      ruleRef: `${RULES_VERSION}#champions-fund`,
    });
    expect(SEASON_CHAMPIONS_CENTS).toBe(20_100_000);
    expect(THEME_SEASON_TABLE_CENTS).toBe(23_200_000);
  });

  it("publishes a missing or invalid wallet as waiting, and keeps the order id", () => {
    const fields = [{ themeSlug: "best-tube", category: "OPEN" as const, sex: "M" as const, entrants: 1 }];
    const ready = buildPublication({ placements: [placed()], fields, ballots: [] });
    const waiting = buildPublication({
      placements: [placed({ walletNetwork: null, walletAddress: null })],
      fields,
      ballots: [],
    });
    const invalid = buildPublication({
      placements: [placed({ walletNetwork: "ethereum", walletAddress: "abandon abandon abandon" })],
      fields,
      ballots: [],
    });
    const readyWeek = ready.files.find((file) => file.period === first.period)!;
    const waitingWeek = waiting.files.find((file) => file.period === first.period)!;
    const invalidWeek = invalid.files.find((file) => file.period === first.period)!;
    expect(waitingWeek.orders[0]).toMatchObject({
      id: readyWeek.orders[0]!.id,
      status: "awaiting_wallet",
      walletNetwork: null,
      walletAddress: null,
      amountCents: readyWeek.orders[0]!.amountCents,
    });
    expect(invalidWeek.orders[0]?.status).toBe("awaiting_wallet");
    expect(waitingWeek.contentHash).not.toBe(readyWeek.contentHash);
  });

  it("caps the pro tour at US$ 6 a ballot and does not hand the remainder to anyone", () => {
    const publication = buildPublication({
      placements: [],
      fields: [],
      ballots: [
        ballot({ userId: "pro-1", college: "RANKED" }),
        ballot({ userId: "pro-1", college: "RANKED" }),
        ballot({ userId: "pro-2", college: "RANKED" }),
        ballot({ userId: "champ-1", college: "CHAMBER", displayName: "Cleo" }),
        ballot({ userId: "champ-2", college: "CHAMBER", displayName: "Ciro" }),
      ],
    });
    const week = publication.files.find((file) => file.period === first.period)!;
    const [chamberBudget, rankedBudget] = allocateByWeights(week.judgeCents, [1, 1]);
    const ranked = week.orders.filter((order) => order.splitBasis === "judges_pro_tour");
    const chamber = week.orders.filter((order) => order.splitBasis === "judges_champions");
    expect(ranked.map((order) => [order.recipientId, order.amountCents, order.ballots])).toEqual([
      ["pro-1", 1_200, 2],
      ["pro-2", 600, 1],
    ]);
    expect(ranked.reduce((sum, order) => sum + order.amountCents, 0)).toBeLessThan(rankedBudget!);
    expect(chamber.map((order) => order.amountCents).reduce((sum, cents) => sum + cents, 0)).toBe(chamberBudget);
    expect(ranked[0]?.ruleRef).toBe(`${RULES_VERSION}#judges-pro-tour`);
    expect(chamber[0]?.ruleRef).toBe(`${RULES_VERSION}#judges-champions`);
    expect(week.orders.some((order) => order.ruleRef.includes("platform"))).toBe(false);
    expect(publication.files.some((file) => file.period === "2026-W42")).toBe(false);
  });

  it("ignores waves and ballots outside Season 1", () => {
    const publication = buildPublication({
      placements: [
        placed({
          entryId: "old",
          themeSlug: "best-barrel",
          themeName: "Best Barrel",
          isoYear: 2026,
          isoWeek: 42,
        }),
      ],
      fields: [],
      ballots: [ballot({ isoYear: 2026, isoWeek: 42 })],
    });
    expect(publication.files.every((file) => file.orders.length === 0)).toBe(true);
  });
});
