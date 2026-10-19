import {
  ENTRANT_POINT_FRACTION,
  PODIUM_POINT_FRACTIONS,
  POINTS_BASE,
  TOP_FIFTH_POINT_FRACTION,
} from "@/lib/constitution";

export function roundPoints(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Winner's base at field S. A field of 400 pays twice a field of 100. */
export function scaledBase(entrants: number, base = POINTS_BASE): number {
  if (!Number.isInteger(entrants) || entrants < 0) {
    throw new Error("entrants must be a non-negative integer");
  }
  if (entrants === 0) return 0;
  return base * Math.sqrt(entrants / 100);
}

export function pointFraction(place: number, entrants: number): number {
  if (place < 1 || place > entrants) return 0;
  if (place <= PODIUM_POINT_FRACTIONS.length) {
    return PODIUM_POINT_FRACTIONS[place - 1]!;
  }
  const topFifth = Math.floor(entrants / 5);
  if (place <= topFifth) return TOP_FIFTH_POINT_FRACTION;
  return ENTRANT_POINT_FRACTION;
}

export function placementPoints(place: number, entrants: number, base = POINTS_BASE): number {
  if (!Number.isInteger(place) || !Number.isInteger(entrants)) {
    throw new Error("place and entrants must be integers");
  }
  return roundPoints(scaledBase(entrants, base) * pointFraction(place, entrants));
}

export type EventResult = {
  athleteId: string;
  eventKey: string;
  place: number;
  entrants: number;
};

/** The category world ranking is the sum of an athlete's event points. */
export function seasonPoints(results: readonly EventResult[], base = POINTS_BASE): Map<string, number> {
  const totals = new Map<string, number>();
  for (const result of results) {
    const points = placementPoints(result.place, result.entrants, base);
    totals.set(result.athleteId, roundPoints((totals.get(result.athleteId) ?? 0) + points));
  }
  return totals;
}
