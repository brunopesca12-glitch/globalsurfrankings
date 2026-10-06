import { OCEAN_ENTRY_TOLL_CENTS, OCEAN_WAVES_PER_ISO_WEEK, POOL_TOLL_CENTS } from "@/lib/constitution";
import type { CategoryCode } from "@/lib/category";
import { themeAllowsCategory, type ThemeDefinition } from "@/lib/catalogue";

export type Environment = "OCEAN" | "POOL";

export type EntryDecision =
  | { ok: true; tollCents: number }
  | {
      ok: false;
      code: "DUTY" | "QUOTA" | "THEME_CLOSED" | "CATEGORY" | "ENVIRONMENT" | "VIDEO";
    };

export function themeIsOpen(finaleOn: string, today: string): boolean {
  return finaleOn >= today;
}

export function parseVideoUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function oceanWeekTaken(
  existing: readonly { isoYear: number; isoWeek: number }[],
  isoYear: number,
  isoWeek: number,
): boolean {
  const taken = existing.filter((entry) => entry.isoYear === isoYear && entry.isoWeek === isoWeek).length;
  return taken >= OCEAN_WAVES_PER_ISO_WEEK;
}

export function decideEntry(input: {
  dutyCurrent: boolean;
  environment: Environment;
  theme: Pick<ThemeDefinition, "categories" | "finaleOn" | "oceanOnly" | "poolOnly">;
  category: CategoryCode;
  existingOceanWeeks: readonly { isoYear: number; isoWeek: number }[];
  isoYear: number;
  isoWeek: number;
  today: string;
  videoUrl: string;
}): EntryDecision {
  if (!input.dutyCurrent) return { ok: false, code: "DUTY" };
  if (!themeAllowsCategory(input.theme, input.category)) {
    return { ok: false, code: "CATEGORY" };
  }
  if (!themeIsOpen(input.theme.finaleOn, input.today)) return { ok: false, code: "THEME_CLOSED" };
  if (input.theme.poolOnly && input.environment !== "POOL") return { ok: false, code: "ENVIRONMENT" };
  if (input.theme.oceanOnly && input.environment !== "OCEAN") return { ok: false, code: "ENVIRONMENT" };
  if (parseVideoUrl(input.videoUrl) == null) return { ok: false, code: "VIDEO" };
  if (
    input.environment === "OCEAN" &&
    oceanWeekTaken(input.existingOceanWeeks, input.isoYear, input.isoWeek)
  ) {
    return { ok: false, code: "QUOTA" };
  }
  return {
    ok: true,
    tollCents: input.environment === "POOL" ? POOL_TOLL_CENTS : OCEAN_ENTRY_TOLL_CENTS,
  };
}

export const ENTRY_REJECTION: Record<Exclude<EntryDecision, { ok: true }>["code"], string> = {
  DUTY: "Judging duty is not current. A wave joins Monday's verdict only when the queue is up to date.",
  QUOTA: "This ISO week's ocean wave has already been used. There is no banking and no rollover — one wave a week.",
  THEME_CLOSED: "This event has closed. The finale has passed.",
  CATEGORY: "This event does not constitute your category's ranking.",
  ENVIRONMENT: "This wave's environment does not belong in this event.",
  VIDEO: "Enter an http(s) URL for the video. File upload comes later.",
};
