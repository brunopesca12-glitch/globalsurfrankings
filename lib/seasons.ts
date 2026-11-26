import { SEASON_2027 } from "@/lib/catalogue";

/** Dec 2026 through February 2027. Points never enter the Founding Season. */
export const PRESEASON = {
  vintage: 2026,
  name: "Preseason 2026–27",
  startsOn: "2026-12-01",
  endsOn: "2027-02-28",
  ageAsOf: "2027-02-28",
  countsForRanking: false,
} as const;

export type SeasonWindow = "before" | "preseason" | "founding" | "after";

export function seasonWindow(day: string): SeasonWindow {
  if (day < PRESEASON.startsOn) return "before";
  if (day <= PRESEASON.endsOn) return "preseason";
  if (day < SEASON_2027.startsOn) return "before";
  if (day <= SEASON_2027.endsOn) return "founding";
  return "after";
}

/** The season a new entry is filed in. Before opening day the scaffold stays the Founding Season. */
export function entryVintage(day: string): number {
  return seasonWindow(day) === "preseason" ? PRESEASON.vintage : SEASON_2027.vintage;
}

/**
 * Dates a camera file may carry. Before preseason opens, November footage for
 * the opening weeks is allowed. A file from a previous season is not.
 */
export function captureWindow(day: string): { startsOn: string; endsOn: string } {
  const window = seasonWindow(day);
  if (window === "preseason") return { startsOn: PRESEASON.startsOn, endsOn: PRESEASON.endsOn };
  if (window === "founding") return { startsOn: SEASON_2027.startsOn, endsOn: SEASON_2027.endsOn };
  if (window === "before") return { startsOn: "2026-11-01", endsOn: PRESEASON.endsOn };
  return { startsOn: SEASON_2027.startsOn, endsOn: SEASON_2027.endsOn };
}

export function countsTowardFounding(season: { vintage: number; countsForRanking?: boolean }): boolean {
  if (season.countsForRanking === false) return false;
  return season.vintage === SEASON_2027.vintage;
}
