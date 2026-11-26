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

const ALL = ["OPEN", "MASTERS_40"] as const satisfies readonly CategoryCode[];
const SEASON_END = "2028-02-29";

/**
 * Founding Season: seven titles, four divisions each, 1 March 2027 – 29 February 2028.
 * Every title runs all 52 weeks; champions are crowned in March 2028.
 */
export const THEMES: readonly ThemeDefinition[] = [
  {
    slug: "best-tube",
    name: "Best Tube",
    namePt: "Best Tube",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Ocean. Point, reef or beach break.",
  },
  {
    slug: "best-aerial",
    name: "Best Aerial",
    namePt: "Best Aerial",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: true,
    poolOnly: false,
    proposedDate: false,
    note: "Ocean only.",
  },
  {
    slug: "biggest-paddle-in",
    name: "Biggest Paddle-In Wave",
    namePt: "Biggest Paddle-In Wave",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Big-wave title. Paddle-in only.",
  },
  {
    slug: "best-small-wave",
    name: "Best Small-Wave Performance",
    namePt: "Best Small-Wave Performance",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Waist-high maximum.",
  },
  {
    slug: "frontside",
    name: "Frontside Lines",
    namePt: "Frontside Lines",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Point break or reef break.",
  },
  {
    slug: "backside",
    name: "Backside Lines",
    namePt: "Backside Lines",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Point break or reef break.",
  },
  {
    slug: "wave-pool",
    name: "Wave Pool",
    namePt: "Wave Pool",
    finaleOn: SEASON_END,
    categories: ALL,
    oceanOnly: false,
    poolOnly: true,
    proposedDate: false,
    note: "Wave pools only.",
  },
];

/** Former catalogue events. They are not judged or ranked in Season 1. */
export const FUTURE_THEMES = [
  "Best Beachbreak",
  "Best Cutback",
  "Big Wave of the Year",
  "Most Powerful Rails",
  "Most Elegant (Twin Fin)",
] as const;

export const SEASON_SLUGS: readonly string[] = THEMES.map((theme) => theme.slug);

export const SEASON_2027 = {
  vintage: 2027,
  name: "Founding Season 2027–28",
  startsOn: "2027-03-01",
  endsOn: SEASON_END,
  ageAsOf: SEASON_END,
  galaLabel: "March 2028",
} as const;

export const DEMO_THEME_SLUG = "best-tube";

export function themeBySlug(slug: string): ThemeDefinition | undefined {
  return THEMES.find((theme) => theme.slug === slug);
}

export function themesFor(category: string): ThemeDefinition[] {
  return THEMES.filter((theme) => (theme.categories as readonly string[]).includes(category));
}

export function themeAllowsCategory(
  theme: { categories: readonly CategoryCode[] },
  category: string,
): boolean {
  return (theme.categories as readonly string[]).includes(category);
}
