import type { CategoryCode } from "@/lib/category";

export type ThemeDefinition = {
  slug: string;
  name: string;
  namePt: string;
  finaleOn: string;
  categories: readonly CategoryCode[];
  oceanOnly: boolean;
  poolOnly: boolean;
  proposedDate: boolean;
  note: string;
};

const ALL = ["OPEN", "JUNIOR", "MASTERS_40", "MASTERS_50"] as const satisfies readonly CategoryCode[];
const NOT_50 = ["OPEN", "JUNIOR", "MASTERS_40"] as const satisfies readonly CategoryCode[];
const OPEN_JUNIOR = ["OPEN", "JUNIOR"] as const satisfies readonly CategoryCode[];

/**
 * Twelve events of the Open catalogue (Section 4), dated on the Section 3
 * calendar. The vintage runs 1 Oct → 30 Sep, so the first finales of the
 * 2027 vintage fall in late 2026.
 * Best Surf Pool is one event: Air in Open and Junior, Wave in 40+ and 50+.
 */
export const THEMES: readonly ThemeDefinition[] = [
  {
    slug: "most-elegant",
    name: "Most Elegant (Twin Fin)",
    namePt: "Most Elegant (Twin Fin)",
    finaleOn: "2026-10-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "First finale of the season.",
  },
  {
    slug: "best-air",
    name: "Best Air",
    namePt: "Best Air",
    finaleOn: "2026-11-30",
    categories: NOT_50,
    oceanOnly: true,
    poolOnly: false,
    proposedDate: true,
    note: "Ocean only. Proposed date, in the quiet stretch before the gala. Not on the 50+ ranking.",
  },
  {
    slug: "best-beachbreak",
    name: "Best Beachbreak Surfer",
    namePt: "Best Beachbreak Surfer",
    finaleOn: "2027-01-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "",
  },
  {
    slug: "most-powerful-rails",
    name: "Most Powerful Rails",
    namePt: "Most Powerful Rails",
    finaleOn: "2027-02-28",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "",
  },
  {
    slug: "big-wave",
    name: "Big Wave of the Year",
    namePt: "Big Wave of the Year",
    finaleOn: "2027-03-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Heavy-water double finale, with Big Barrel.",
  },
  {
    slug: "big-barrel",
    name: "Big Barrel",
    namePt: "Big Barrel",
    finaleOn: "2027-03-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Heavy-water double finale, with Big Wave of the Year.",
  },
  {
    slug: "best-small-wave",
    name: "Best Small Wave Surfer",
    namePt: "Best Small Wave Surfer",
    finaleOn: "2027-04-30",
    categories: OPEN_JUNIOR,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Waist-high maximum. Open and Junior only.",
  },
  {
    slug: "best-frontside",
    name: "Best Frontside (point/reef)",
    namePt: "Best Frontside (point/reef)",
    finaleOn: "2027-05-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "",
  },
  {
    slug: "best-backside",
    name: "Best Backside (point/reef)",
    namePt: "Best Backside (point/reef)",
    finaleOn: "2027-06-30",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "",
  },
  {
    slug: "best-cutback",
    name: "Best Cutback",
    namePt: "Best Cutback",
    finaleOn: "2027-07-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "",
  },
  {
    slug: "best-surf-pool",
    name: "Best Surf Pool",
    namePt: "Best Surf Pool",
    finaleOn: "2027-08-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: true,
    proposedDate: false,
    note: "Air in Open and Junior. Wave in 40+ and 50+.",
  },
  {
    slug: "best-barrel",
    name: "Best Barrel",
    namePt: "Best Barrel",
    finaleOn: "2027-09-30",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Closes with the Overall. Double finale of the season.",
  },
] as const;

export const SEASON_2027 = {
  vintage: 2027,
  name: "Season 2027",
  startsOn: "2026-10-01",
  endsOn: "2027-09-30",
  ageAsOf: "2027-09-30",
  galaLabel: "November 2027",
  galaVenue: "Boa Vista Village",
} as const;

export const DEMO_THEME_SLUG = "best-barrel";

export function themeBySlug(slug: string): ThemeDefinition | undefined {
  return THEMES.find((theme) => theme.slug === slug);
}

export function themesFor(category: CategoryCode): ThemeDefinition[] {
  return THEMES.filter((theme) => theme.categories.includes(category));
}

export function themeAllowsCategory(
  theme: { categories: readonly CategoryCode[] },
  category: CategoryCode,
): boolean {
  return theme.categories.includes(category);
}
