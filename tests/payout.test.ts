import { describe, expect, it } from "vitest";
import { FOUNDING, PRINTED_EDITION_HEADLINES } from "@/lib/constitution";
import { foundingEditionTables, paidPlaceCount, payoutCents, payoutSharesBps } from "@/lib/payout";

describe("season-table payout law", () => {
  it("pays the top fifth, and at least the winner", () => {
    expect(paidPlaceCount(0)).toBe(0);
    expect(paidPlaceCount(1)).toBe(1);
    expect(paidPlaceCount(9)).toBe(1);
    expect(paidPlaceCount(10)).toBe(2);
    expect(paidPlaceCount(30)).toBe(6);
    expect(paidPlaceCount(100)).toBe(20);
  });

  it("reproduces 35/20/14/12/10/9 when six places are paid", () => {
    expect(payoutSharesBps(6)).toEqual([3_500, 2_000, 1_400, 1_200, 1_000, 900]);
    expect(payoutCents(10_000_000, 6)).toEqual([
      3_500_000, 2_000_000, 1_400_000, 1_200_000, 1_000_000, 900_000,
    ]);
  });

  it("sums to 100.00% at every paid depth", () => {
    for (let paid = 0; paid <= 200; paid += 1) {
      const shares = payoutSharesBps(paid);
      expect(shares).toHaveLength(paid);
      expect(shares.reduce((sum, share) => sum + share, 0)).toBe(paid === 0 ? 0 : 10_000);
      const cents = payoutCents(250_000_00, paid);
      expect(cents.reduce((sum, value) => sum + value, 0)).toBe(paid === 0 ? 0 : 250_000_00);
    }
  });

  it("keeps the tail below the podium and renormalises a short podium", () => {
    expect(payoutSharesBps(1)).toEqual([10_000]);
    const seven = payoutSharesBps(7);
    expect(seven[0]).toBeGreaterThan(seven[1]!);
    expect(seven[5]).toBeGreaterThan(seven[6]!);
    const twenty = payoutSharesBps(20);
    const tail = twenty.slice(6);
    expect(Math.max(...tail) - Math.min(...tail)).toBeLessThanOrEqual(1);
  });

  it("builds the founding edition tables from field share × US$ 250,000", () => {
    const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
    expect(tables.reduce((sum, table) => sum + table.seasonTableCents, 0)).toBe(25_000_000);
    const openMen = tables.find((table) => table.id === "OPEN_M");
    expect(openMen?.seasonTableCents).toBe(10_000_000);
    expect(openMen?.winnerCents).toBe(3_500_000);
    expect(openMen?.sixthCents).toBe(900_000);

    const mastersWomen = tables.find((table) => table.id === "MASTERS_40_W");
    expect(mastersWomen?.seasonTableCents).toBe(750_000);
    expect(mastersWomen?.winnerCents).toBe(262_500);
    expect(mastersWomen?.sixthCents).toBe(67_500);
  });

  it("records the printed annex headlines, which round a few exact curve values", () => {
    const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
    for (const table of tables) {
      const printed = PRINTED_EDITION_HEADLINES[table.id];
      expect(Math.abs(table.winnerCents / 100 - printed.winnerUsd)).toBeLessThanOrEqual(100);
      expect(Math.abs(table.sixthCents / 100 - printed.sixthUsd)).toBeLessThanOrEqual(100);
    }
    expect(PRINTED_EDITION_HEADLINES.MASTERS_40_W.sixthUsd).toBe(650);
    expect(tables.find((table) => table.id === "MASTERS_40_W")?.sixthCents).toBe(67_500);
  });
});
