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

export const ENTRY_REJECTION_PT: Record<Exclude<EntryDecision, { ok: true }>["code"], string> = {
  DUTY: "O dever de julgar não está em dia. A onda só entra na liturgia de segunda com a fila corrente.",
  QUOTA: "A cota do oceano desta semana ISO já foi usada. Não há banco nem acumulação — uma onda por semana.",
  THEME_CLOSED: "Este evento já fechou. O final passou.",
  CATEGORY: "Este evento não constitui o ranking da sua categoria.",
  ENVIRONMENT: "O ambiente desta onda não cabe neste evento.",
  VIDEO: "Informe uma URL http(s) do vídeo. O envio de arquivo chega depois.",
};
