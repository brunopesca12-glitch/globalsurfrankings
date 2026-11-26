"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { GUEST_DUELS } from "@/lib/calibration";
import { prisma } from "@/lib/db";
import { loadEyeSnapshot, touchEyeDay, type EyeSnapshot } from "@/lib/eye-record";
import { eyeLevel, eyeScore } from "@/lib/eye";
import { loadJudgeCard, type FeedCard } from "@/lib/feed";
import { applyBallotComparison, ensureWeeklyQueue, sealFinishedBallot } from "@/lib/judge-queue";
import { commitLatestComparison } from "@/lib/vote-commit";

export type VoteResult = {
  ok: boolean;
  sealed: boolean;
  correct: boolean | null;
  card: FeedCard;
  eye: EyeSnapshot | null;
  commitId: string | null;
};

const EMPTY_EYE: EyeSnapshot = {
  score: 0,
  level: "Shorebreak",
  daily: 0,
  weekly: 0,
  freezes: 0,
  badges: [],
  calibrations: 0,
  calibrationHits: 0,
};

async function signedEye(userId: string): Promise<EyeSnapshot> {
  const queue = await ensureWeeklyQueue(userId);
  return loadEyeSnapshot(userId, queue.accuracy?.mean ?? null, queue.accuracy?.verdicts ?? 0);
}

export async function voteLive(ballotId: string, side: "left" | "right"): Promise<VoteResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, sealed: false, correct: null, card: { kind: "idle", pending: 0 }, eye: null, commitId: null };
  const comparison = side === "left" ? "better" : "worse";
  const outcome = await applyBallotComparison(session.user.id, ballotId, comparison);
  if (outcome === "rejected") {
    return { ok: false, sealed: false, correct: null, card: await loadJudgeCard(session.user.id), eye: await signedEye(session.user.id), commitId: null };
  }
  const commitId = await commitLatestComparison(session.user.id, ballotId).catch(() => null);
  await touchEyeDay(session.user.id, { duels: 1 });
  return {
    ok: true,
    sealed: outcome === "sealed",
    correct: null,
    card: await loadJudgeCard(session.user.id),
    eye: await signedEye(session.user.id),
    commitId,
  };
}

export async function voteSeat(ballotId: string): Promise<VoteResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, sealed: false, correct: null, card: { kind: "idle", pending: 0 }, eye: null, commitId: null };
  const outcome = await sealFinishedBallot(session.user.id, ballotId);
  if (outcome !== "sealed") {
    return { ok: false, sealed: false, correct: null, card: await loadJudgeCard(session.user.id), eye: await signedEye(session.user.id), commitId: null };
  }
  await touchEyeDay(session.user.id, { duels: 1 });
  return {
    ok: true,
    sealed: true,
    correct: null,
    card: await loadJudgeCard(session.user.id),
    eye: await signedEye(session.user.id),
    commitId: null,
  };
}

export async function voteCalibration(duelId: string, side: "LEFT" | "RIGHT"): Promise<VoteResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, sealed: false, correct: null, card: { kind: "idle", pending: 0 }, eye: null, commitId: null };
  const duel = await prisma.calibrationDuel.findFirst({ where: { id: duelId, higher: { not: null } } });
  if (!duel?.higher) {
    return { ok: false, sealed: false, correct: null, card: await loadJudgeCard(session.user.id), eye: await signedEye(session.user.id), commitId: null };
  }
  const correct = duel.higher === side;
  await prisma.calibrationAnswer.create({
    data: { duelId, userId: session.user.id, higher: side, correct },
  });
  await touchEyeDay(session.user.id, { calibrations: 1, calibrationHits: correct ? 1 : 0 });
  return {
    ok: true,
    sealed: false,
    correct,
    card: await loadJudgeCard(session.user.id),
    eye: await signedEye(session.user.id),
    commitId: null,
  };
}

export async function setVoteConfidence(commitId: string, confidence: "CONFIDENT" | "UNSURE"): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const updated = await prisma.voteCommit.updateMany({
    where: { id: commitId, userId: session.user.id },
    data: { confidence },
  });
  return updated.count === 1;
}

export type GuestAnswer = {
  correct: boolean;
  answered: number;
  total: number;
  done: boolean;
  score: number;
  level: string;
};

export async function answerGuestDuel(duelId: string, side: "LEFT" | "RIGHT"): Promise<GuestAnswer | null> {
  const jar = await cookies();
  let key = jar.get("gsr_eye")?.value ?? "";
  if (!key || key.length > 80) {
    key = crypto.randomUUID();
    jar.set("gsr_eye", key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  const duel = await prisma.calibrationDuel.findFirst({ where: { id: duelId, higher: { not: null } } });
  if (!duel?.higher) return null;
  const correct = duel.higher === side;
  const prior = await prisma.calibrationAnswer.findFirst({ where: { duelId, guestKey: key } });
  if (!prior) {
    await prisma.calibrationAnswer.create({ data: { duelId, guestKey: key, higher: side, correct } });
  }
  const rows = await prisma.calibrationAnswer.findMany({
    where: { guestKey: key },
    select: { correct: true, duelId: true },
    orderBy: { createdAt: "asc" },
    take: GUEST_DUELS,
  });
  const hits = rows.filter((row) => row.correct).length;
  const score = eyeScore({ meanDeviation: null, calibrationHits: hits, calibrations: rows.length });
  return {
    correct: prior ? prior.correct : correct,
    answered: rows.length,
    total: GUEST_DUELS,
    done: rows.length >= GUEST_DUELS,
    score,
    level: eyeLevel(score),
  };
}

export async function currentEye(): Promise<EyeSnapshot> {
  const session = await auth();
  if (!session?.user) return EMPTY_EYE;
  try {
    return await signedEye(session.user.id);
  } catch {
    return EMPTY_EYE;
  }
}
