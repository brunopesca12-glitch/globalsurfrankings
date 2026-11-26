import { SEASON_2027 } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { isoWeek } from "@/lib/iso-week";
import { PRESEASON, seasonWindow } from "@/lib/seasons";

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
  const window = seasonWindow(today);
  if (window === "preseason") {
    return {
      phase: "preseason",
      weekKey: key,
      headline: PRESEASON.name,
      detail: `Points from ${PRESEASON.name} do not count toward the Founding Season, which starts ${formatDate(season.startsOn)}. Results still publish on Monday.`,
    };
  }
  if (today < season.startsOn) {
    return {
      phase: "preseason",
      weekKey: key,
      headline: `Founding Season starts ${formatDate(season.startsOn)}`,
      detail: `Preseason 2026–27 opens ${formatDate(PRESEASON.startsOn)}. This week (${key}) is before that, and preseason points will not count toward the Founding Season.`,
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
  if (clock.phase !== "live") return `Week ${key}`;
  return key;
}

/** Days until the next Monday verdict. Zero when today is Monday. */
export function daysUntilMonday(now: Date): number {
  const day = now.getUTCDay();
  return day === 1 ? 0 : (8 - day) % 7;
}

const VERDICT_ZONE = "America/Sao_Paulo";
const VERDICT_HOUR = 9;

function saoPauloClock(now: Date): { weekday: number; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: VERDICT_ZONE,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((part) => [part.type, part.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday.slice(0, 3));
  return { weekday, hour: Number(parts.hour) };
}

/** Verdict copy in America/Sao_Paulo. After Monday 09:00 the sentence is past tense. */
export function mondayCountdown(now: Date): string {
  const clock = saoPauloClock(now);
  const at = "at 09:00 (São Paulo time)";
  if (clock.weekday === 1 && clock.hour < VERDICT_HOUR) {
    return `Monday's verdict publishes today ${at}.`;
  }
  if (clock.weekday === 1) {
    return `Monday's verdict published today ${at}.`;
  }
  const days = (8 - clock.weekday) % 7;
  if (days === 1) return `Monday's verdict publishes tomorrow ${at}.`;
  return `Monday's verdict publishes in ${days} days, ${at}.`;
}

export type PurseMirror = {
  tone: "none" | "unpaid" | "pending";
  text: string;
};

/**
 * Prize money is not published. The mirror stays blank of amounts.
 */
export function purseMirror(input: {
  college: "CHAMBER" | "RANKED" | "ATHLETES" | "UPPER" | "PUBLIC" | null;
  today: string;
  startsOn: string;
}): PurseMirror {
  if (input.today < input.startsOn || !input.college) {
    return {
      tone: "none",
      text: "Founding season. Prize money is not published. Rankings are season points.",
    };
  }
  if (input.college === "CHAMBER" || input.college === "RANKED") {
    return {
      tone: "pending",
      text: "Champions and the pro tour. Prize money for judges is not published. Rankings are season points.",
    };
  }
  return {
    tone: "unpaid",
      text: "Your record is how close you sat to Monday. Prize money is not published.",
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
