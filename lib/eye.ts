import { isoWeekKey } from "@/lib/iso-week";

export const EYE_LEVELS = ["Shorebreak", "Lineup", "Channel", "Tower", "Golden Eye"] as const;
export type EyeLevel = (typeof EYE_LEVELS)[number];

const LEVEL_FLOORS: { name: EyeLevel; min: number }[] = [
  { name: "Golden Eye", min: 90 },
  { name: "Tower", min: 75 },
  { name: "Channel", min: 60 },
  { name: "Lineup", min: 40 },
  { name: "Shorebreak", min: 0 },
];

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/**
 * 0–100. Ranking error is the existing mean absolute deviation, in places.
 * A perfect Monday match is 100. Eight places off is 0. Calibration is the
 * share of keyed duels answered correctly. When both exist, ranking weighs 60%.
 */
export function eyeScore(input: {
  meanDeviation: number | null;
  calibrationHits: number;
  calibrations: number;
}): number {
  const ranking =
    input.meanDeviation == null || !Number.isFinite(input.meanDeviation)
      ? null
      : clamp(Math.round(100 - input.meanDeviation * 12.5), 0, 100);
  const calibration =
    input.calibrations > 0 ? clamp(Math.round((input.calibrationHits / input.calibrations) * 100), 0, 100) : null;
  if (ranking == null && calibration == null) return 0;
  if (ranking == null) return calibration!;
  if (calibration == null) return ranking;
  return clamp(Math.round(ranking * 0.6 + calibration * 0.4), 0, 100);
}

export function eyeLevel(score: number): EyeLevel {
  const value = clamp(Math.round(score), 0, 100);
  return LEVEL_FLOORS.find((level) => value >= level.min)?.name ?? "Shorebreak";
}

export type Badge = { id: string; name: string; detail: string };

export function eyeBadges(input: {
  duels: number;
  calibrations: number;
  calibrationHits: number;
  dailyStreak: number;
  freezes: number;
  eye: number;
  verdicts: number;
}): Badge[] {
  const badges: Badge[] = [];
  if (input.duels + input.calibrations >= 1) {
    badges.push({ id: "first-light", name: "First light", detail: "You judged a wave." });
  }
  if (input.dailyStreak >= 7) {
    badges.push({ id: "week-on", name: "Week on the water", detail: "Seven days in a row." });
  }
  if (input.freezes >= 1) {
    badges.push({ id: "flat-day", name: "Flat day", detail: "One freeze kept the streak." });
  }
  if (input.calibrations >= 8 && input.calibrationHits / input.calibrations >= 0.8) {
    badges.push({ id: "sharp", name: "Sharp", detail: "Calibration holds." });
  }
  if (input.eye >= 90 && (input.verdicts >= 3 || input.calibrations >= 10)) {
    badges.push({ id: "golden-eye", name: "Golden Eye", detail: "The top of the eye score." });
  }
  return badges;
}

function dayStamp(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year!, (month ?? 1) - 1, date ?? 1);
}

export function addDays(day: string, delta: number): string {
  const next = new Date(dayStamp(day) + delta * 86_400_000);
  return next.toISOString().slice(0, 10);
}

function weekKey(day: string): string {
  return isoWeekKey(new Date(`${day}T12:00:00.000Z`));
}

/**
 * Consecutive São Paulo days with a judgment. One missing day per ISO week
 * is a Flat Day and does not break the streak. Today may still be open.
 */
export function dailyStreak(days: readonly string[], today: string): { streak: number; freezes: number } {
  const have = new Set(days);
  let cursor = have.has(today) ? today : addDays(today, -1);
  let streak = 0;
  let freezes = 0;
  const usedWeeks = new Set<string>();
  for (let i = 0; i < 400; i += 1) {
    if (have.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    const week = weekKey(cursor);
    const older = addDays(cursor, -1);
    if (!usedWeeks.has(week) && have.has(older)) {
      usedWeeks.add(week);
      freezes += 1;
      streak += 1;
      cursor = older;
      continue;
    }
    break;
  }
  return { streak, freezes };
}

/** Consecutive ISO weeks with at least one judgment. The current week may still be open. */
export function weeklyStreak(days: readonly string[], today: string): number {
  const weeks = new Set(days.map(weekKey));
  let cursor = today;
  if (!weeks.has(weekKey(cursor))) cursor = addDays(cursor, -7);
  let streak = 0;
  const seen = new Set<string>();
  for (let i = 0; i < 80; i += 1) {
    const key = weekKey(cursor);
    if (seen.has(key)) {
      cursor = addDays(cursor, -7);
      continue;
    }
    seen.add(key);
    if (!weeks.has(key)) break;
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/** Calendar date in America/Sao_Paulo. */
export function saoPauloDate(now: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}
