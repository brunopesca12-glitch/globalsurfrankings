import { SEASON_SLUGS, themeBySlug } from "@/lib/catalogue";

const CURRENT_CATEGORIES = new Set(["OPEN", "MASTERS_40"]);

/** Founding Season titles and the four current divisions. Retired rows stay in the database. */
export function isCurrentModality(themeSlug: string, category: string): boolean {
  return (SEASON_SLUGS as readonly string[]).includes(themeSlug) && CURRENT_CATEGORIES.has(category);
}

export function eventTitle(themeSlug: string, fallback: string): string {
  return themeBySlug(themeSlug)?.name ?? fallback;
}

export type RankCard = { key: string; label: string; src: string };

export type RankToken = { kind: "ballot" | "peer"; id: string };

/** `b:<ballotId>,p:<entryId>`. Ballot ids are the waves this judge is placing. */
export function parseRankOrder(raw: string): RankToken[] | null {
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > 24) return null;
  const seen = new Set<string>();
  const tokens: RankToken[] = [];
  for (const part of parts) {
    const match = /^(b|p):([a-z0-9]+)$/i.exec(part);
    if (!match) return null;
    const key = `${match[1]!.toLowerCase()}:${match[2]!}`;
    if (seen.has(key)) return null;
    seen.add(key);
    tokens.push({ kind: match[1]!.toLowerCase() === "b" ? "ballot" : "peer", id: match[2]! });
  }
  return tokens;
}

/** 1-based place of each ballot in the order the judge saved. Peers take a slot and are not stored. */
export function placesFromOrder(tokens: readonly RankToken[]): { ballotId: string; place: number }[] | null {
  if (tokens.length === 0) return null;
  const places: { ballotId: string; place: number }[] = [];
  tokens.forEach((token, index) => {
    if (token.kind === "ballot") places.push({ ballotId: token.id, place: index + 1 });
  });
  return places.length > 0 ? places : null;
}

/** Athletes who already have a published place. One athlete counts once. */
export function placedAthleteCount(rows: readonly { athleteId: string; placed: boolean }[]): number {
  const ids = new Set<string>();
  for (const row of rows) {
    if (row.placed) ids.add(row.athleteId);
  }
  return ids.size;
}
