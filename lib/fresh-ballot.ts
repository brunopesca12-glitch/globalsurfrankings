import { SEASON_SLUGS } from "@/lib/catalogue";
import { eventTitle } from "@/lib/comparison";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/iso-week";
import { loadJudgeContext } from "@/lib/judge-context";
import { editionLine } from "@/lib/panel";
import { canJudgeEntry, editionKey, forbiddenForAthlete, resolveCollege } from "@/lib/tribunal";

const TARGET = 6;

export type FreshBallotResult =
  | {
      ok: true;
      email: string;
      created: number;
      event: string;
      edition: string;
      ballotIds: string[];
      entryIds: string[];
    }
  | { ok: false; reason: "no_user" | "no_panel" | "season_missing" | "not_enough_waves" };

/**
 * Adds open ballots for one account. It does not delete, update, or reseed anything.
 * The waves share one current division so the ballot is a real comparison.
 */
export async function openFreshComparison(email: string): Promise<FreshBallotResult> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) return { ok: false, reason: "no_user" };

  const ctx = await loadJudgeContext();
  if (!ctx.seasonId) return { ok: false, reason: "season_missing" };
  const athleteId = user.athlete?.id ?? null;
  const college = resolveCollege({
    role: user.role,
    seatedChamber: user.seats.some((seat) => seat.college === "CHAMBER"),
    seatedRanked: user.seats.some((seat) => seat.college === "RANKED"),
    upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
    enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
    override: user.collegeOverride,
    hasAthlete: athleteId != null,
  });
  if (!college) return { ok: false, reason: "no_panel" };

  const forbidden = forbiddenForAthlete(athleteId, ctx.athletes, ctx.entryEditions);
  const held = await prisma.ballot.findMany({ where: { userId: user.id }, select: { entryId: true } });
  const heldIds = new Set(held.map((row) => row.entryId));
  const entries = await prisma.entry.findMany({
    where: {
      seasonId: ctx.seasonId,
      status: "SUBMITTED",
      category: { in: ["OPEN", "MASTERS_40"] },
      theme: { slug: { in: [...SEASON_SLUGS] } },
    },
    select: {
      id: true,
      athleteId: true,
      category: true,
      sex: true,
      themeId: true,
      videoUrl: true,
      createdAt: true,
      theme: { select: { slug: true, name: true } },
    },
  });
  const eligible = entries.filter(
    (entry) =>
      !heldIds.has(entry.id) &&
      canJudgeEntry({
        judgeAthleteId: athleteId,
        entryAthleteId: entry.athleteId,
        edition: editionKey(entry.category, entry.sex),
        forbidden,
      }),
  );

  const groups = new Map<string, typeof eligible>();
  for (const entry of eligible) {
    const key = `${entry.themeId}:${entry.category}:${entry.sex}`;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  let best: typeof eligible = [];
  for (const group of groups.values()) {
    if (score(group) > score(best)) best = group;
  }
  if (best.length < 2) return { ok: false, reason: "not_enough_waves" };

  const chosen = [...best].sort((a, b) => Number(playable(b.videoUrl)) - Number(playable(a.videoUrl)) || a.createdAt.getTime() - b.createdAt.getTime());
  const waves = chosen.slice(0, TARGET);
  const week = isoWeek(new Date());
  const ids = waves.map((wave) => wave.id);
  await prisma.ballot.createMany({
    data: waves.map((wave) => ({
      userId: user.id,
      entryId: wave.id,
      college,
      isoYear: week.isoYear,
      isoWeek: week.isoWeek,
      status: "OPEN" as const,
      boardEntryIds: ids.filter((id) => id !== wave.id),
      lo: 0,
      hi: ids.length - 1,
    })),
    skipDuplicates: true,
  });
  const created = await prisma.ballot.findMany({
    where: { userId: user.id, entryId: { in: ids }, status: "OPEN" },
    select: { id: true, entryId: true },
  });
  if (created.length < 2) return { ok: false, reason: "not_enough_waves" };
  const first = waves[0]!;
  return {
    ok: true,
    email: user.email,
    created: created.length,
    event: eventTitle(first.theme.slug, first.theme.name),
    edition: editionLine(first.category, first.sex),
    ballotIds: created.map((row) => row.id),
    entryIds: created.map((row) => row.entryId),
  };
}

function playable(url: string): boolean {
  if (url.startsWith("/media/entries/") || url.includes(".public.blob.vercel-storage.com")) return true;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function score(group: { videoUrl: string }[]): number {
  if (group.length < 2) return group.length;
  const real = group.filter((row) => playable(row.videoUrl)).length;
  return group.length + real * 100;
}
