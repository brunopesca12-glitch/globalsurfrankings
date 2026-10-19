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
 * Season 1 is six events, 1 March – 30 September 2027.
 * Events that are not in this list wait for a later season.
 */
export const THEMES: readonly ThemeDefinition[] = [
  {
    slug: "frontside",
    name: "Frontside",
    namePt: "Frontside",
    finaleOn: "2027-07-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Point break or reef break.",
  },
  {
    slug: "backside",
    name: "Backside",
    namePt: "Backside",
    finaleOn: "2027-08-15",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Point break or reef break.",
  },
  {
    slug: "best-aerial",
    name: "Best Aerial",
    namePt: "Best Aerial",
    finaleOn: "2027-09-10",
    categories: NOT_50,
    oceanOnly: true,
    poolOnly: false,
    proposedDate: false,
    note: "Ocean only. Not on the 50+ ranking.",
  },
  {
    slug: "best-small-wave",
    name: "Best Small-Wave Performance",
    namePt: "Best Small-Wave Performance",
    finaleOn: "2027-04-25",
    categories: OPEN_JUNIOR,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Waist-high maximum. Open and Junior only.",
  },
  {
    slug: "best-tube",
    name: "Best Tube",
    namePt: "Best Tube",
    finaleOn: "2027-09-30",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Closes with the season.",
  },
  {
    slug: "biggest-paddle-in",
    name: "Biggest Paddle-In Wave",
    namePt: "Biggest Paddle-In Wave",
    finaleOn: "2027-06-30",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Paddle-in only.",
  },
];

/** Former catalogue events. They are not judged or ranked in Season 1. */
export const FUTURE_THEMES = [
  "Best Beachbreak",
  "Best Surf Pool",
  "Best Cutback",
  "Big Wave of the Year",
  "Big Barrel",
  "Most Powerful Rails",
  "Most Elegant (Twin Fin)",
  "Best Barrel",
] as const;

export const SEASON_SLUGS: readonly string[] = THEMES.map((theme) => theme.slug);

export const SEASON_2027 = {
  vintage: 2027,
  name: "Season 2027",
  startsOn: "2027-03-01",
  endsOn: "2027-09-30",
  ageAsOf: "2027-09-30",
  galaLabel: "November 2027",
} as const;

export const DEMO_THEME_SLUG = "best-tube";

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
