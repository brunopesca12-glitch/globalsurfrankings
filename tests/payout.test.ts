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

  it("pays a large field 28% to the winner and 7.2% to sixth", () => {
    expect(payoutSharesBps(20).slice(0, 6)).toEqual([2_800, 1_600, 1_120, 960, 800, 720]);
    const openMen = payoutCents(9_280_000, 106);
    expect(openMen[0]).toBe(2_598_400);
    expect(openMen[5]).toBe(668_160);
    const tail = openMen.slice(6);
    expect(tail).toHaveLength(100);
    expect(tail.reduce((sum, value) => sum + value, 0)).toBe(1_856_000);
    expect(tail.every((value) => value === 18_560)).toBe(true);
  });

  it("sums to 100.00% at every paid depth", () => {
    for (let paid = 0; paid <= 200; paid += 1) {
      const shares = payoutSharesBps(paid);
      expect(shares).toHaveLength(paid);
      expect(shares.reduce((sum, share) => sum + share, 0)).toBe(paid === 0 ? 0 : 10_000);
      const cents = payoutCents(23_200_000, paid);
      expect(cents.reduce((sum, value) => sum + value, 0)).toBe(paid === 0 ? 0 : 23_200_000);
      if (paid > 6) {
        const sixth = shares[5]!;
        for (const place of shares.slice(6)) expect(place).toBeLessThanOrEqual(sixth);
      }
    }
  });

  it("caps a short tail at sixth and returns the excess to the podium", () => {
    expect(payoutSharesBps(1)).toEqual([10_000]);
    const seven = payoutSharesBps(7);
    expect(seven[6]).toBe(720);
    expect(seven[5]).toBeGreaterThan(seven[6]!);
    const eight = payoutSharesBps(8);
    expect(eight[6]).toBe(720);
    expect(eight[7]).toBe(720);
    expect(eight[5]).toBeGreaterThan(720);
    const twenty = payoutSharesBps(20);
    const tail = twenty.slice(6);
    expect(Math.max(...tail) - Math.min(...tail)).toBeLessThanOrEqual(1);
  });

  it("builds the founding edition tables from field share × US$ 232,000", () => {
    const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
    expect(tables.reduce((sum, table) => sum + table.seasonTableCents, 0)).toBe(23_200_000);
    const openMen = tables.find((table) => table.id === "OPEN_M");
    expect(openMen?.seasonTableCents).toBe(9_280_000);
    expect(openMen?.winnerCents).toBe(2_598_400);
    expect(openMen?.sixthCents).toBe(668_160);

    const mastersWomen = tables.find((table) => table.id === "MASTERS_40_W");
    expect(mastersWomen?.seasonTableCents).toBe(696_000);
    expect(mastersWomen?.winnerCents).toBe(194_880);
    expect(mastersWomen?.sixthCents).toBe(50_112);
  });

  it("records the printed section 5 headlines, which round the exact cents", () => {
    const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
    for (const table of tables) {
      const printed = PRINTED_EDITION_HEADLINES[table.id];
      expect(Math.abs(table.winnerCents / 100 - printed.winnerUsd)).toBeLessThanOrEqual(1);
      expect(Math.abs(table.sixthCents / 100 - printed.sixthUsd)).toBeLessThanOrEqual(1);
    }
    expect(PRINTED_EDITION_HEADLINES.MASTERS_40_W.sixthUsd).toBe(501);
  });
});
