import { cache } from "react";
import type { CategoryCode, Sex } from "@prisma/client";
import { SEASON_2027 } from "@/lib/catalogue";
import { categoryFor, parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { placementPoints } from "@/lib/points";
import { clubKey, editionKey, upperAthleteIds } from "@/lib/tribunal";

export type ContextAthlete = {
  id: string;
  userId: string;
  sex: Sex;
  category: CategoryCode;
  clubKey: string | null;
};

export type JudgeContext = {
  seasonId: string | null;
  athletes: ContextAthlete[];
  upperAthleteIds: Set<string>;
  enteredAthleteIds: Set<string>;
  entryEditions: Map<string, { category: string; sex: string }[]>;
};

export const loadJudgeContext = cache(async (): Promise<JudgeContext> => {
  const season = await prisma.season.findUnique({ where: { vintage: SEASON_2027.vintage } });
  const ageAsOf = season?.ageAsOf ?? parseDateOnly(SEASON_2027.ageAsOf)!;
  if (!season) {
    return {
      seasonId: null,
      athletes: [],
      upperAthleteIds: new Set(),
      enteredAthleteIds: new Set(),
      entryEditions: new Map(),
    };
  }

  const [athletes, entries] = await Promise.all([
    prisma.athlete.findMany({
      select: { id: true, userId: true, sex: true, birthDate: true, club: true },
    }),
    prisma.entry.findMany({
      where: { seasonId: season.id },
      select: {
        athleteId: true,
        category: true,
        sex: true,
        themeId: true,
        placement: { select: { place: true } },
      },
    }),
  ]);

  const profiles: ContextAthlete[] = athletes.map((athlete) => ({
    id: athlete.id,
    userId: athlete.userId,
    sex: athlete.sex,
    category: categoryFor(athlete.birthDate, ageAsOf),
    clubKey: clubKey(athlete.club),
  }));

  const enteredAthleteIds = new Set<string>();
  const entryEditions = new Map<string, { category: string; sex: string }[]>();
  const field = new Map<string, number>();
  const points = new Map<string, Map<string, number>>();

  for (const entry of entries) {
    enteredAthleteIds.add(entry.athleteId);
    const editions = entryEditions.get(entry.athleteId) ?? [];
    editions.push({ category: entry.category, sex: entry.sex });
    entryEditions.set(entry.athleteId, editions);
    const fieldKey = `${entry.themeId}:${entry.category}:${entry.sex}`;
    field.set(fieldKey, (field.get(fieldKey) ?? 0) + 1);
  }

  for (const entry of entries) {
    if (!entry.placement) continue;
    const edition = editionKey(entry.category, entry.sex);
    const entrants = field.get(`${entry.themeId}:${entry.category}:${entry.sex}`) ?? 0;
    const bucket = points.get(edition) ?? new Map<string, number>();
    const next = (bucket.get(entry.athleteId) ?? 0) + placementPoints(entry.placement.place, entrants);
    bucket.set(entry.athleteId, Math.round(next * 100) / 100);
    points.set(edition, bucket);
  }

  const editions = [...points.values()].map((bucket) =>
    [...bucket.entries()].map(([athleteId, total]) => ({ athleteId, points: total })),
  );

  return {
    seasonId: season.id,
    athletes: profiles,
    upperAthleteIds: new Set(upperAthleteIds(editions)),
    enteredAthleteIds,
    entryEditions,
  };
});
