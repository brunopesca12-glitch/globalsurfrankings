import { cache } from "react";
import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { WEEKLY_JUDGING_BALLOTS } from "@/lib/constitution";
import { prisma } from "@/lib/db";
import { loadJudgeContext } from "@/lib/judge-context";
import { isoWeek } from "@/lib/iso-week";
import { applyComparison, probeInsertion } from "@/lib/binary-insertion";
import {
  canJudgeEntry,
  drawEntries,
  editionKey,
  forbiddenForAthlete,
  meanAbsoluteDeviation,
  resolveCollege,
  type College as TribunalCollege,
} from "@/lib/tribunal";

export type OpenBallot = {
  id: string;
  drawnVideoUrl: string;
  comparisonVideoUrl: string | null;
};

export type JudgeSession = {
  college: TribunalCollege | null;
  athlete: boolean;
  pending: number;
  sealed: number;
  ballot: OpenBallot | null;
  accuracy: { mean: number; verdicts: number } | null;
  rankedSealed: number;
};

const EMPTY: JudgeSession = {
  college: null,
  athlete: false,
  pending: 0,
  sealed: 0,
  ballot: null,
  accuracy: null,
  rankedSealed: 0,
};

function randomUnit(): number {
  return randomInt(0, 1_000_000) / 1_000_000;
}

type Tx = Prisma.TransactionClient;

async function lockWeek(tx: Tx, userId: string, isoYear: number, isoWeekNumber: number) {
  const key = `gsr-judge:${userId}:${isoYear}:${isoWeekNumber}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

export const ensureWeeklyQueue = cache(async (userId: string): Promise<JudgeSession> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) return EMPTY;

  const ctx = await loadJudgeContext();
  const week = isoWeek(new Date());
  const athleteId = user.athlete?.id ?? null;
  const forbidden = forbiddenForAthlete(athleteId, ctx.athletes, ctx.entryEditions);

  await prisma.$transaction(async (tx) => {
    await lockWeek(tx, userId, week.isoYear, week.isoWeek);
    const fresh = await tx.user.findUnique({
      where: { id: userId },
      include: { seats: true, athlete: { select: { id: true } } },
    });
    if (!fresh) return;
    const college = resolveCollege({
      role: fresh.role,
      seatedChamber: fresh.seats.some((seat) => seat.college === "CHAMBER"),
      seatedRanked: fresh.seats.some((seat) => seat.college === "RANKED"),
      upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
      enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
    });

    const existing = await tx.ballot.findMany({
      where: { userId, isoYear: week.isoYear, isoWeek: week.isoWeek },
      include: { entry: { select: { id: true, status: true, athleteId: true, category: true, sex: true } } },
    });

    const dropIds = existing
      .filter((ballot) => {
        if (ballot.status !== "OPEN") return false;
        if (!college || ballot.college !== college) return true;
        if (ballot.entry.status !== "SUBMITTED") return true;
        return !canJudgeEntry({
          judgeAthleteId: athleteId,
          entryAthleteId: ballot.entry.athleteId,
          edition: editionKey(ballot.entry.category, ballot.entry.sex),
          forbidden,
        });
      })
      .map((ballot) => ballot.id);
    if (dropIds.length > 0) {
      await tx.ballot.deleteMany({ where: { id: { in: dropIds } } });
    }
    if (!college || !ctx.seasonId) return;

    const kept = existing.filter((ballot) => !dropIds.includes(ballot.id));
    const heldIds = new Set(kept.map((ballot) => ballot.entryId));
    const need = Math.max(0, WEEKLY_JUDGING_BALLOTS - kept.length);
    if (need === 0) return;

    const submitted = await tx.entry.findMany({
      where: { seasonId: ctx.seasonId, status: "SUBMITTED" },
      select: { id: true, athleteId: true, category: true, sex: true, themeId: true },
    });
    const eligible = submitted.filter(
      (entry) =>
        !heldIds.has(entry.id) &&
        canJudgeEntry({
          judgeAthleteId: athleteId,
          entryAthleteId: entry.athleteId,
          edition: editionKey(entry.category, entry.sex),
          forbidden,
        }),
    );
    if (eligible.length === 0) return;

    const counts = await tx.ballot.groupBy({
      by: ["entryId"],
      where: { college, entryId: { in: eligible.map((entry) => entry.id) } },
      _count: { _all: true },
    });
    const countByEntry = new Map(counts.map((row) => [row.entryId, row._count._all]));
    const picked = drawEntries(
      eligible.map((entry) => ({ ...entry, collegeBallots: countByEntry.get(entry.id) ?? 0 })),
      need,
      randomUnit,
    );

    const boards = await tx.board.findMany({
      where: { theme: { seasonId: ctx.seasonId } },
      include: { placements: { orderBy: { place: "asc" }, select: { entryId: true } } },
    });
    const boardByKey = new Map(
      boards.map((board) => [
        `${board.themeId}:${board.category}:${board.sex}`,
        board.placements.map((row) => row.entryId),
      ]),
    );

    for (const entry of picked) {
      const boardEntryIds = boardByKey.get(`${entry.themeId}:${entry.category}:${entry.sex}`) ?? [];
      try {
        await tx.ballot.create({
          data: {
            userId,
            entryId: entry.id,
            college,
            isoYear: week.isoYear,
            isoWeek: week.isoWeek,
            boardEntryIds,
            lo: 0,
            hi: boardEntryIds.length,
          },
        });
      } catch (error) {
        if (!isUnique(error)) throw error;
      }
    }
  });

  return readJudgeSession(userId, week.isoYear, week.isoWeek);
});

async function readJudgeSession(userId: string, isoYear: number, isoWeekNumber: number): Promise<JudgeSession> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) return EMPTY;
  const ctx = await loadJudgeContext();
  const athleteId = user.athlete?.id ?? null;
  const college = resolveCollege({
    role: user.role,
    seatedChamber: user.seats.some((seat) => seat.college === "CHAMBER"),
    seatedRanked: user.seats.some((seat) => seat.college === "RANKED"),
    upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
    enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
  });

  const [weekBallots, rankedSealed, sealedFinal] = await Promise.all([
    prisma.ballot.findMany({
      where: { userId, isoYear, isoWeek: isoWeekNumber },
      include: { entry: { select: { videoUrl: true, status: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ballot.count({ where: { userId, status: "SEALED", college: "RANKED" } }),
    prisma.ballot.findMany({
      where: { userId, status: "SEALED", place: { not: null }, entry: { placement: { isNot: null } } },
      select: { place: true, entry: { select: { placement: { select: { place: true } } } } },
    }),
  ]);

  const open = weekBallots.filter((ballot) => ballot.status === "OPEN" && ballot.entry.status === "SUBMITTED");
  const sealed = weekBallots.filter((ballot) => ballot.status === "SEALED").length;
  const pairs = sealedFinal
    .filter((ballot) => ballot.place != null && ballot.entry.placement)
    .map((ballot) => ({ ballotPlace: ballot.place!, finalPlace: ballot.entry.placement!.place }));
  const mean = meanAbsoluteDeviation(pairs);
  const shown = await presentBallot(open);

  return {
    college,
    athlete: athleteId != null,
    pending: Math.max(0, open.length - shown.removed),
    sealed,
    ballot: shown.ballot,
    accuracy: mean == null ? null : { mean, verdicts: pairs.length },
    rankedSealed,
  };
}

async function presentBallot(
  open: {
    id: string;
    lo: number;
    hi: number;
    boardEntryIds: string[];
    entry: { videoUrl: string };
  }[],
): Promise<{ ballot: OpenBallot | null; removed: number }> {
  let removed = 0;
  for (const ballot of open) {
    const probe = probeInsertion({ lo: ballot.lo, hi: ballot.hi });
    if (probe.kind === "done") {
      return {
        removed,
        ballot: { id: ballot.id, drawnVideoUrl: ballot.entry.videoUrl, comparisonVideoUrl: null },
      };
    }
    const probeEntryId = ballot.boardEntryIds[probe.index];
    const probeEntry = probeEntryId
      ? await prisma.entry.findUnique({ where: { id: probeEntryId }, select: { videoUrl: true } })
      : null;
    if (!probeEntry) {
      await prisma.ballot.delete({ where: { id: ballot.id } }).catch(() => undefined);
      removed += 1;
      continue;
    }
    return {
      removed,
      ballot: {
        id: ballot.id,
        drawnVideoUrl: ballot.entry.videoUrl,
        comparisonVideoUrl: probeEntry.videoUrl,
      },
    };
  }
  return { ballot: null, removed };
}

export async function applyBallotComparison(
  userId: string,
  ballotId: string,
  comparison: "better" | "worse",
): Promise<"sealed" | "next" | "rejected"> {
  const allowed = await ballotStillAllowed(userId, ballotId);
  if (!allowed) return "rejected";

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Ballot" WHERE "id" = ${ballotId} AND "userId" = ${userId} FOR UPDATE`;
      const ballot = await tx.ballot.findFirst({
        where: { id: ballotId, userId },
        include: { entry: { select: { status: true } } },
      });
      if (!ballot || ballot.status !== "OPEN" || ballot.entry.status !== "SUBMITTED") return "rejected";
      const probe = probeInsertion({ lo: ballot.lo, hi: ballot.hi });
      if (probe.kind !== "probe") return "rejected";
      const probeEntryId = ballot.boardEntryIds[probe.index];
      if (!probeEntryId) return "rejected";
      const next = applyComparison({ lo: ballot.lo, hi: ballot.hi }, probe.index, comparison);
      const after = probeInsertion(next);
      const sealed = after.kind === "done";
      const updated = await tx.ballot.updateMany({
        where: { id: ballot.id, status: "OPEN", lo: ballot.lo, hi: ballot.hi },
        data: {
          lo: next.lo,
          hi: next.hi,
          ...(sealed
            ? { status: "SEALED" as const, place: after.index + 1, sealedAt: new Date() }
            : {}),
        },
      });
      if (updated.count !== 1) return "rejected";
      await tx.ballotComparison.create({
        data: {
          ballotId: ballot.id,
          probeIndex: probe.index,
          probeEntryId,
          result: comparison === "better" ? "BETTER" : "WORSE",
        },
      });
      return sealed ? "sealed" : "next";
    });
  } catch {
    return "rejected";
  }
}

export async function sealFinishedBallot(userId: string, ballotId: string): Promise<"sealed" | "rejected"> {
  const allowed = await ballotStillAllowed(userId, ballotId);
  if (!allowed) return "rejected";
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Ballot" WHERE "id" = ${ballotId} AND "userId" = ${userId} FOR UPDATE`;
      const ballot = await tx.ballot.findFirst({
        where: { id: ballotId, userId },
        include: { entry: { select: { status: true } } },
      });
      if (!ballot || ballot.status !== "OPEN" || ballot.entry.status !== "SUBMITTED") return "rejected";
      const probe = probeInsertion({ lo: ballot.lo, hi: ballot.hi });
      if (probe.kind !== "done") return "rejected";
      const updated = await tx.ballot.updateMany({
        where: { id: ballot.id, status: "OPEN", lo: ballot.lo, hi: ballot.hi },
        data: { status: "SEALED", place: probe.index + 1, sealedAt: new Date() },
      });
      return updated.count === 1 ? "sealed" : "rejected";
    });
  } catch {
    return "rejected";
  }
}

async function ballotStillAllowed(userId: string, ballotId: string): Promise<boolean> {
  const ballot = await prisma.ballot.findFirst({
    where: { id: ballotId, userId, status: "OPEN" },
    include: { entry: { select: { athleteId: true, category: true, sex: true, status: true } } },
  });
  if (!ballot || ballot.entry.status !== "SUBMITTED") {
    if (ballot) await prisma.ballot.delete({ where: { id: ballot.id } }).catch(() => undefined);
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) return false;
  const ctx = await loadJudgeContext();
  const athleteId = user.athlete?.id ?? null;
  const college = resolveCollege({
    role: user.role,
    seatedChamber: user.seats.some((seat) => seat.college === "CHAMBER"),
    seatedRanked: user.seats.some((seat) => seat.college === "RANKED"),
    upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
    enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
  });
  const forbidden = forbiddenForAthlete(athleteId, ctx.athletes, ctx.entryEditions);
  const ok =
    college === ballot.college &&
    canJudgeEntry({
      judgeAthleteId: athleteId,
      entryAthleteId: ballot.entry.athleteId,
      edition: editionKey(ballot.entry.category, ballot.entry.sex),
      forbidden,
    });
  if (!ok) {
    await prisma.ballot.delete({ where: { id: ballot.id } }).catch(() => undefined);
    return false;
  }
  return true;
}

function isUnique(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}
