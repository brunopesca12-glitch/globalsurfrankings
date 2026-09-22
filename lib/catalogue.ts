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
    namePt: "Mais Elegante (Twin Fin)",
    finaleOn: "2026-10-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Primeiro final da temporada.",
  },
  {
    slug: "best-air",
    name: "Best Air",
    namePt: "Melhor Aéreo",
    finaleOn: "2026-11-30",
    categories: NOT_50,
    oceanOnly: true,
    poolOnly: false,
    proposedDate: true,
    note: "Somente oceano. Data proposta, no intervalo quieto antes do gala. Fora do ranking 50+.",
  },
  {
    slug: "best-beachbreak",
    name: "Best Beachbreak Surfer",
    namePt: "Melhor Surfista de Beachbreak",
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
    namePt: "Rails Mais Potentes",
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
    namePt: "Onda Grande do Ano",
    finaleOn: "2027-03-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Final duplo de água pesada, com o Big Barrel.",
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
    note: "Final duplo de água pesada, com a Onda Grande do Ano.",
  },
  {
    slug: "best-small-wave",
    name: "Best Small Wave Surfer",
    namePt: "Melhor Surfista de Onda Pequena",
    finaleOn: "2027-04-30",
    categories: OPEN_JUNIOR,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Altura máxima na cintura. Somente Open e Júnior.",
  },
  {
    slug: "best-frontside",
    name: "Best Frontside (point/reef)",
    namePt: "Melhor Frontside (point/reef)",
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
    namePt: "Melhor Backside (point/reef)",
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
    namePt: "Melhor Cutback",
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
    namePt: "Melhor Surf Pool",
    finaleOn: "2027-08-31",
    categories: ALL,
    oceanOnly: false,
    poolOnly: true,
    proposedDate: false,
    note: "Air no Open e no Júnior. Wave no 40+ e no 50+.",
  },
  {
    slug: "best-barrel",
    name: "Best Barrel",
    namePt: "Melhor Tubo",
    finaleOn: "2027-09-30",
    categories: ALL,
    oceanOnly: false,
    poolOnly: false,
    proposedDate: false,
    note: "Fecha junto com o Overall. Final duplo da temporada.",
  },
] as const;

export const SEASON_2027 = {
  vintage: 2027,
  name: "Temporada 2027",
  startsOn: "2026-10-01",
  endsOn: "2027-09-30",
  ageAsOf: "2027-09-30",
  galaLabel: "Novembro de 2027",
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
