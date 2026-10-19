export type WorldRow = {
  athleteId: string;
  place: number;
  hashtags: readonly string[];
};

export type DerivedRow = {
  athleteId: string;
  worldPlace: number;
  derivedPlace: number;
};

export function normalizeHashtag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** A hashtag filters the world board and renumbers the members. Nothing is re-judged. */
export function deriveLeaderboard(world: readonly WorldRow[], hashtag: string): DerivedRow[] {
  const tag = normalizeHashtag(hashtag);
  if (!tag) return [];
  return [...world]
    .filter((row) => row.hashtags.some((item) => normalizeHashtag(item) === tag))
    .sort((a, b) => a.place - b.place)
    .map((row, index) => ({
      athleteId: row.athleteId,
      worldPlace: row.place,
      derivedPlace: index + 1,
    }));
}
