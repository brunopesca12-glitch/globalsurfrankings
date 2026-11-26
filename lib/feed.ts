import { probeInsertion } from "@/lib/binary-insertion";
import { isCalibrationSlot } from "@/lib/calibration";
import { prisma } from "@/lib/db";
import { ensureWeeklyQueue } from "@/lib/judge-queue";

export type FeedCard =
  | { kind: "calibration"; duelId: string; leftSrc: string; rightSrc: string; pending: number }
  | { kind: "live"; ballotId: string; leftSrc: string; rightSrc: string; pending: number }
  | { kind: "seat"; ballotId: string; src: string; pending: number }
  | { kind: "idle"; pending: number };

export type GuestDuel = { id: string; leftSrc: string; rightSrc: string };

function watch(entryId: string): string {
  return `/judge/media/watch/${entryId}`;
}

function eyeSrc(duelId: string, side: "left" | "right"): string {
  return `/eye/media/${duelId}/${side}`;
}

async function nextKeyedDuel(userId: string | null, guestKey: string | null) {
  const answered = await prisma.calibrationAnswer.findMany({
    where: userId ? { userId } : { guestKey: guestKey ?? "__none__" },
    select: { duelId: true },
  });
  const seen = new Set(answered.map((row) => row.duelId));
  const duels = await prisma.calibrationDuel.findMany({
    where: { higher: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: 40,
  });
  return duels.find((duel) => !seen.has(duel.id)) ?? null;
}

/** The next card in the judge's deck. Every fourth card is a calibration duel when a key exists. */
export async function loadJudgeCard(userId: string): Promise<FeedCard> {
  const queue = await ensureWeeklyQueue(userId);
  if (!queue.onboarded) {
    await prisma.user.update({ where: { id: userId }, data: { judgeOnboardedAt: new Date() } }).catch(() => undefined);
  }
  if (!queue.ballot) return { kind: "idle", pending: queue.pending };

  const ballot = await prisma.ballot.findFirst({
    where: { id: queue.ballot.id, userId, status: "OPEN" },
    select: {
      id: true,
      lo: true,
      hi: true,
      boardEntryIds: true,
      entryId: true,
      createdAt: true,
      comparisons: { select: { id: true } },
    },
  });
  if (!ballot) return { kind: "idle", pending: queue.pending };

  const calibrations = await prisma.calibrationAnswer.count({
    where: { userId, createdAt: { gte: ballot.createdAt } },
  });
  const slot = ballot.comparisons.length + calibrations;
  if (isCalibrationSlot(slot)) {
    const duel = await nextKeyedDuel(userId, null);
    if (duel) {
      return {
        kind: "calibration",
        duelId: duel.id,
        leftSrc: eyeSrc(duel.id, "left"),
        rightSrc: eyeSrc(duel.id, "right"),
        pending: queue.pending,
      };
    }
  }

  const probe = probeInsertion({ lo: ballot.lo, hi: ballot.hi });
  if (probe.kind === "done") {
    return { kind: "seat", ballotId: ballot.id, src: watch(ballot.entryId), pending: queue.pending };
  }
  const boardId = ballot.boardEntryIds[probe.index];
  if (!boardId) {
    return { kind: "seat", ballotId: ballot.id, src: watch(ballot.entryId), pending: queue.pending };
  }
  return {
    kind: "live",
    ballotId: ballot.id,
    leftSrc: watch(ballot.entryId),
    rightSrc: watch(boardId),
    pending: queue.pending,
  };
}

export async function loadGuestDuels(limit: number): Promise<GuestDuel[]> {
  const duels = await prisma.calibrationDuel.findMany({
    where: { higher: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: limit,
  });
  return duels.map((duel) => ({
    id: duel.id,
    leftSrc: eyeSrc(duel.id, "left"),
    rightSrc: eyeSrc(duel.id, "right"),
  }));
}
