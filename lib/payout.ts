import {
  EDITIONS,
  LARGE_FIELD_PODIUM_BPS,
  PAID_FIELD_FRACTION,
  PODIUM_CURVE,
  SIXTH_CAP_BPS,
  TAIL_POOL_BPS,
  allocateByWeights,
  editionSeasonTableCents,
} from "@/lib/constitution";

/** Top 20% of the edition, at least the winner when anyone entered. */
export function paidPlaceCount(entrants: number): number {
  if (!Number.isInteger(entrants) || entrants < 0) {
    throw new Error("entrants must be a non-negative integer");
  }
  if (entrants === 0) return 0;
  return Math.min(entrants, Math.max(1, Math.floor(entrants * PAID_FIELD_FRACTION)));
}

/**
 * Shares of an edition's season table, in basis points, summing to 10_000.
 * A large field pays the podium 80% on 35 / 20 / 14 / 12 / 10 / 9
 * (28 / 16 / 11.2 / 9.6 / 8 / 7.2% of the table). Places 7 through the top
 * fifth split the other 20% equally. No place past sixth is paid more than
 * sixth; the excess returns to the podium on the same curve. With six or
 * fewer paid places, that unused tail returns the same way, so six places
 * are exactly 35 / 20 / 14 / 12 / 10 / 9 of the whole table.
 */
export function payoutSharesBps(paidPlaces: number): number[] {
  if (!Number.isInteger(paidPlaces) || paidPlaces < 0) {
    throw new Error("paidPlaces must be a non-negative integer");
  }
  if (paidPlaces === 0) return [];
  if (paidPlaces <= PODIUM_CURVE.length) {
    return allocateByWeights(10_000, PODIUM_CURVE.slice(0, paidPlaces));
  }
  const tailCount = paidPlaces - PODIUM_CURVE.length;
  if (TAIL_POOL_BPS / tailCount <= SIXTH_CAP_BPS) {
    const tail = allocateByWeights(TAIL_POOL_BPS, Array.from({ length: tailCount }, () => 1));
    return [...LARGE_FIELD_PODIUM_BPS, ...tail];
  }
  const tailTotal = SIXTH_CAP_BPS * tailCount;
  const podium = allocateByWeights(10_000 - tailTotal, [...PODIUM_CURVE]);
  return [...podium, ...Array.from({ length: tailCount }, () => SIXTH_CAP_BPS)];
}

export function payoutCents(tableCents: number, paidPlaces: number): number[] {
  const shares = payoutSharesBps(paidPlaces);
  return allocateByWeights(tableCents, shares);
}

export type EditionTable = {
  id: (typeof EDITIONS)[number]["id"];
  label: string;
  shareBps: number;
  seasonTableCents: number;
  winnerCents: number;
  sixthCents: number;
};

export function foundingEditionTables(seasonTableCents: number): EditionTable[] {
  return EDITIONS.map((edition) => {
    const table = editionSeasonTableCents(seasonTableCents, edition.shareBps);
    // Section 5 prints the large-field door: winner 28%, sixth 7.2%.
    const amounts = payoutCents(table, 20);
    return {
      id: edition.id,
      label: edition.label,
      shareBps: edition.shareBps,
      seasonTableCents: table,
      winnerCents: amounts[0] ?? 0,
      sixthCents: amounts[5] ?? 0,
    };
  });
}
