import { CATEGORY_LABEL, type CategoryCode } from "@/lib/category";
import type { College } from "@/lib/median";

/** Plain names. The word college is not shown. */
export const PANEL_NAME: Record<College, string> = {
  CHAMBER: "Champions",
  RANKED: "Pro tour",
  ATHLETES: "Athletes",
  UPPER: "Top 10",
  PUBLIC: "Everyone",
};

export function panelName(college: College): string {
  return PANEL_NAME[college];
}

export function editionLine(category: string, sex: string): string {
  const who = sex === "W" ? "Women's" : "Men's";
  const label = category in CATEGORY_LABEL ? CATEGORY_LABEL[category as CategoryCode] : category;
  return `${who} ${label}`;
}

export function judgingLine(event: string, category: string, sex: string): string {
  return `You're judging: ${event} · ${editionLine(category, sex)}`;
}
