import type { CategoryCode, Sex } from "@prisma/client";

const CATEGORIES = new Set<CategoryCode>(["OPEN", "MASTERS_40"]);

/** World-board path for one wave's division. Masters does not fall through to Open. */
export function worldBoardHref(slug: string, category: string, sex: string): string {
  const division = readBoardDivision(category, sex);
  return `/board/${slug}?category=${division.category}&sex=${division.sex}`;
}

export function readBoardDivision(
  category: string | undefined,
  sex: string | undefined,
): { category: CategoryCode; sex: Sex } {
  const raw = category?.trim().toUpperCase().replace(/[\s-]+/g, "_") ?? "";
  const parsed: CategoryCode =
    raw === "MASTERS_40" || raw === "MASTERS" || raw === "MASTERS40" ? "MASTERS_40" : raw === "OPEN" ? "OPEN" : "OPEN";
  const known = CATEGORIES.has(parsed) ? parsed : "OPEN";
  // A masters token must not be rewritten to Open. Unknown values stay Open Men only when absent or unrecognised.
  const categoryCode: CategoryCode = raw === "MASTERS_40" || raw === "MASTERS" || raw === "MASTERS40" ? "MASTERS_40" : known;
  return { category: categoryCode, sex: sex === "W" ? "W" : "M" };
}
