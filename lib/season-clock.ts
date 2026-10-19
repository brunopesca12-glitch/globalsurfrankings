import { SEASON_2027 } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { isoWeek } from "@/lib/iso-week";

export type CircuitPhase = "preseason" | "live" | "closed";

export type CircuitClock = {
  phase: CircuitPhase;
  weekKey: string;
  headline: string;
  detail: string;
};

function weekKey(isoYear: number, isoWeekNumber: number): string {
  return `${isoYear}-W${String(isoWeekNumber).padStart(2, "0")}`;
}

/** The public clock. Before opening day the calendar week is a demo week, not the circuit. */
export function circuitClock(now: Date, season = SEASON_2027): CircuitClock {
  const today = now.toISOString().slice(0, 10);
  const week = isoWeek(now);
  const key = weekKey(week.isoYear, week.isoWeek);
  if (today < season.startsOn) {
    return {
      phase: "preseason",
      weekKey: key,
      headline: `Founding Season starts ${formatDate(season.startsOn)}`,
      detail: `This is a preseason demo week (${key}), not a week of the circuit. Verdicts still publish on Monday.`,
    };
  }
  if (today > season.endsOn) {
    return {
      phase: "closed",
      weekKey: key,
      headline: `${season.name} has closed`,
      detail: `The calendar week is ${key}.`,
    };
  }
  return {
    phase: "live",
    weekKey: key,
    headline: `This week ${key}`,
    detail: "Verdicts publish Monday.",
  };
}

/** An entry week recorded before the season, or outside the live season, is labelled a demo week. */
export function entryWeekLabel(isoYear: number, isoWeekNumber: number, now: Date, season = SEASON_2027): string {
  const key = weekKey(isoYear, isoWeekNumber);
  const clock = circuitClock(now, season);
  if (clock.phase !== "live") return `Demo week ${key}`;
  return key;
}

/** Days until the next Monday verdict. Zero when today is Monday. */
export function daysUntilMonday(now: Date): number {
  const day = now.getUTCDay();
  return day === 1 ? 0 : (8 - day) % 7;
}

export function mondayCountdown(now: Date): string {
  const days = daysUntilMonday(now);
  if (days === 0) return "Monday's verdict publishes today.";
  if (days === 1) return "Monday's verdict publishes tomorrow.";
  return `Monday's verdict publishes in ${days} days.`;
}

export type PurseMirror = {
  tone: "none" | "unpaid" | "pending";
  text: string;
};

/**
 * Before the season opens there is no escrowed purse. Paid colleges then see a
 * pending mirror. This site never pays it.
 */
export function purseMirror(input: {
  college: "CHAMBER" | "RANKED" | "ATHLETES" | "UPPER" | "PUBLIC" | null;
  today: string;
  startsOn: string;
}): PurseMirror {
  if (input.today < input.startsOn || !input.college) {
    return {
      tone: "none",
      text: "Founding season, no purse yet. When a purse is escrowed, the judges' 6% is paid from that account, not through this site.",
    };
  }
  if (input.college === "CHAMBER" || input.college === "RANKED") {
    return {
      tone: "pending",
      text: "Pending, escrow mirror. The Chamber and the Ranked split the judges' 6%, 3% each. The Ranked rate is also fed by pool tolls and capped at US$ 6 a ballot. Nothing here is paid.",
    };
  }
  return {
    tone: "unpaid",
    text: "This college is unpaid. The judges' 6% goes to the Chamber and the Ranked. Your record is the accuracy of your ballots.",
  };
}

/** Consecutive weeks with a sealed ballot, allowing the current week to still be open. */
export function judgingStreak(
  sealedWeeks: readonly { isoYear: number; isoWeek: number }[],
  now: Date,
): number {
  const have = new Set(sealedWeeks.map((week) => weekKey(week.isoYear, week.isoWeek)));
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const current = isoWeek(cursor);
  if (!have.has(weekKey(current.isoYear, current.isoWeek))) {
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const week = isoWeek(cursor);
    if (!have.has(weekKey(week.isoYear, week.isoWeek))) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}
