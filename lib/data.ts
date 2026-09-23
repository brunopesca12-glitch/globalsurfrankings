import type { CategoryCode, Sex, VerificationTier } from "@prisma/client";
import { DEMO_THEME_SLUG, SEASON_2027 } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { deriveLeaderboard } from "@/lib/leaderboard";
import { placementPoints } from "@/lib/points";

export async function getEditionBoard(slug: string, category: CategoryCode, sex: Sex) {
  const theme = await prisma.theme.findFirst({
    where: { slug, season: { vintage: SEASON_2027.vintage } },
  });
  if (!theme) return null;

  const entries = await prisma.entry.findMany({
    where: {
      themeId: theme.id,
      category,
      sex,
      status: { in: ["SUBMITTED", "PLACED"] },
    },
    include: { athlete: true, placement: true },
    orderBy: { createdAt: "asc" },
  });

  const entrants = entries.length;
  const placed = entries
    .filter((entry) => entry.placement)
    .sort((a, b) => a.placement!.place - b.placement!.place)
    .map((entry) => ({
      entryId: entry.id,
      place: entry.placement!.place,
      points: placementPoints(entry.placement!.place, entrants),
      videoUrl: entry.videoUrl,
      spot: entry.spot,
      environment: entry.environment,
      athlete: entry.athlete,
    }));

  const pending = entries.filter((entry) => !entry.placement);
  return { theme, entrants, placed, pending };
}

export type RankingRow = {
  athleteId: string;
  displayName: string;
  slug: string;
  verification: VerificationTier;
  city: string | null;
  hashtags: string[];
  points: number;
  results: number;
};

export async function getSeasonRankings() {
  const entries = await prisma.entry.findMany({
    where: {
      season: { vintage: SEASON_2027.vintage },
      status: { in: ["SUBMITTED", "PLACED"] },
    },
    include: { athlete: true, placement: true },
  });

  const field = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.themeId}:${entry.category}:${entry.sex}`;
    field.set(key, (field.get(key) ?? 0) + 1);
  }

  const editions = new Map<string, Map<string, RankingRow>>();
  for (const entry of entries) {
    if (!entry.placement) continue;
    const editionKey = `${entry.category}:${entry.sex}`;
    const entrants = field.get(`${entry.themeId}:${entry.category}:${entry.sex}`) ?? 0;
    const points = placementPoints(entry.placement.place, entrants);
    const bucket = editions.get(editionKey) ?? new Map<string, RankingRow>();
    const current = bucket.get(entry.athleteId);
    if (!current) {
      bucket.set(entry.athleteId, {
        athleteId: entry.athleteId,
        displayName: entry.athlete.displayName,
        slug: entry.athlete.slug,
        verification: entry.athlete.verification,
        city: entry.athlete.city,
        hashtags: entry.athlete.hashtags,
        points,
        results: 1,
      });
    } else {
      current.points = Math.round((current.points + points) * 100) / 100;
      current.results += 1;
    }
    editions.set(editionKey, bucket);
  }

  return editions;
}

export async function getHashtagBoard(tag: string, category: CategoryCode, sex: Sex) {
  const board = await getEditionBoard(DEMO_THEME_SLUG, category, sex);
  if (!board) return null;
  const derived = deriveLeaderboard(
    board.placed.map((row) => ({
      athleteId: row.athlete.id,
      place: row.place,
      hashtags: row.athlete.hashtags,
    })),
    tag,
  );
  const byId = new Map(board.placed.map((row) => [row.athlete.id, row]));
  return {
    theme: board.theme,
    entrants: board.entrants,
    rows: derived.map((row) => ({ ...row, athlete: byId.get(row.athleteId)!.athlete, points: byId.get(row.athleteId)!.points })),
  };
}

export async function listVideos() {
  return prisma.entry.findMany({
    where: { season: { vintage: SEASON_2027.vintage } },
    include: { athlete: true, theme: true, placement: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVideo(id: string) {
  return prisma.entry.findUnique({
    where: { id },
    include: { athlete: true, theme: true, placement: true },
  });
}

export async function listHashtags() {
  const athletes = await prisma.athlete.findMany({ select: { hashtags: true } });
  const tags = new Set<string>();
  for (const athlete of athletes) {
    for (const tag of athlete.hashtags) tags.add(tag);
  }
  return [...tags].sort();
}

export async function getAthleteByUser(userId: string) {
  return prisma.athlete.findUnique({
    where: { userId },
    include: {
      entries: {
        include: { theme: true, placement: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getPublicAthlete(slug: string) {
  return prisma.athlete.findUnique({
    where: { slug },
    include: {
      entries: {
        where: { status: "PLACED" },
        include: { theme: true, placement: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
