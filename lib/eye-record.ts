import { prisma } from "@/lib/db";
import { eyeBadges, eyeLevel, eyeScore, dailyStreak, saoPauloDate, weeklyStreak, type Badge, type EyeLevel } from "@/lib/eye";

export type EyeSnapshot = {
  score: number;
  level: EyeLevel;
  daily: number;
  weekly: number;
  freezes: number;
  badges: Badge[];
  calibrations: number;
  calibrationHits: number;
};

function dateOnly(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export async function touchEyeDay(
  userId: string,
  patch: { duels?: number; calibrations?: number; calibrationHits?: number },
  now = new Date(),
) {
  const day = dateOnly(saoPauloDate(now));
  await prisma.eyeDay.upsert({
    where: { userId_day: { userId, day } },
    create: {
      userId,
      day,
      duels: patch.duels ?? 0,
      calibrations: patch.calibrations ?? 0,
      calibrationHits: patch.calibrationHits ?? 0,
    },
    update: {
      duels: { increment: patch.duels ?? 0 },
      calibrations: { increment: patch.calibrations ?? 0 },
      calibrationHits: { increment: patch.calibrationHits ?? 0 },
    },
  });
}

export async function loadEyeSnapshot(
  userId: string,
  meanDeviation: number | null,
  verdicts: number,
  now = new Date(),
): Promise<EyeSnapshot> {
  const rows = await prisma.eyeDay.findMany({
    where: { userId },
    select: { day: true, duels: true, calibrations: true, calibrationHits: true },
  });
  const days = rows.map((row) => row.day.toISOString().slice(0, 10));
  const today = saoPauloDate(now);
  const streak = dailyStreak(days, today);
  let duels = 0;
  let calibrations = 0;
  let calibrationHits = 0;
  for (const row of rows) {
    duels += row.duels;
    calibrations += row.calibrations;
    calibrationHits += row.calibrationHits;
  }
  const score = eyeScore({ meanDeviation, calibrationHits, calibrations });
  return {
    score,
    level: eyeLevel(score),
    daily: streak.streak,
    weekly: weeklyStreak(days, today),
    freezes: streak.freezes,
    badges: eyeBadges({
      duels,
      calibrations,
      calibrationHits,
      dailyStreak: streak.streak,
      freezes: streak.freezes,
      eye: score,
      verdicts,
    }),
    calibrations,
    calibrationHits,
  };
}
