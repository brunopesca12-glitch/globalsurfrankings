import {
  EDITIONS,
  PAID_FIELD_FRACTION,
  PODIUM_PAYOUT_BPS,
  TAIL_PAYOUT_WEIGHT,
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
 * Six paid places reproduce 35 / 20 / 14 / 12 / 10 / 9 exactly.
 * Fewer places renormalise the podium weights.
 * Further places share the tail at weight 4, then the whole vector is
 * normalised so the rails still sum to 100%.
 */
export function payoutSharesBps(paidPlaces: number): number[] {
  if (!Number.isInteger(paidPlaces) || paidPlaces < 0) {
    throw new Error("paidPlaces must be a non-negative integer");
  }
  if (paidPlaces === 0) return [];
  const weights =
    paidPlaces <= PODIUM_PAYOUT_BPS.length
      ? PODIUM_PAYOUT_BPS.slice(0, paidPlaces)
      : [...PODIUM_PAYOUT_BPS, ...Array.from({ length: paidPlaces - PODIUM_PAYOUT_BPS.length }, () => TAIL_PAYOUT_WEIGHT)];
  return allocateByWeights(10_000, weights);
}

export function payoutCents(tableCents: number, paidPlaces: number): number[] {
  const shares = payoutSharesBps(paidPlaces);
  return allocateByWeights(tableCents, shares);
}

export type EditionTable = {
  id: (typeof EDITIONS)[number]["id"];
  labelPt: string;
  shareBps: number;
  seasonTableCents: number;
  winnerCents: number;
  sixthCents: number;
};

export function foundingEditionTables(seasonTableCents: number): EditionTable[] {
  return EDITIONS.map((edition) => {
    const table = editionSeasonTableCents(seasonTableCents, edition.shareBps);
    const amounts = payoutCents(table, 6);
    return {
      id: edition.id,
      labelPt: edition.labelPt,
      shareBps: edition.shareBps,
      seasonTableCents: table,
      winnerCents: amounts[0] ?? 0,
      sixthCents: amounts[5] ?? 0,
    };
  });
}
