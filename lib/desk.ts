import type { College } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loadJudgeContext } from "@/lib/judge-context";
import { resolveCollege, type College as TribunalCollege, type ManualCollege } from "@/lib/tribunal";

export type DeskPerson = {
  userId: string;
  name: string;
  email: string;
  college: TribunalCollege | null;
  chamber: boolean;
  ranked: boolean;
};

export type DeskRun = {
  id: string;
  createdAt: Date;
  placed: number;
  held: number;
};

export async function getDeskOverview(): Promise<{ people: DeskPerson[]; waiting: number; runs: DeskRun[] }> {
  const [users, waiting, runs, ctx] = await Promise.all([
    prisma.user.findMany({
      include: { athlete: { select: { id: true, displayName: true } }, seats: true },
      orderBy: { name: "asc" },
    }),
    prisma.entry.count({ where: { status: "SUBMITTED" } }),
    prisma.verdictRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    loadJudgeContext(),
  ]);

  const people = users.map((user) => {
    const athleteId = user.athlete?.id ?? null;
    const college = resolveCollege({
      role: user.role,
      seatedChamber: user.seats.some((seat) => seat.college === "CHAMBER"),
      seatedRanked: user.seats.some((seat) => seat.college === "RANKED"),
      upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
      enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
    });
    return {
      userId: user.id,
      name: user.athlete?.displayName ?? user.name,
      email: user.email,
      college,
      chamber: user.seats.some((seat) => seat.college === "CHAMBER"),
      ranked: user.seats.some((seat) => seat.college === "RANKED"),
    };
  });

  return {
    people,
    waiting,
    runs: runs.map((run) => ({ id: run.id, createdAt: run.createdAt, placed: run.placed, held: run.held })),
  };
}

export async function setManualSeat(userId: string, college: ManualCollege, seated: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return;
  await prisma.$transaction(async (tx) => {
    if (seated) {
      await tx.collegeSeat.upsert({
        where: { userId_college: { userId, college: college as College } },
        create: { userId, college: college as College },
        update: {},
      });
    } else {
      await tx.collegeSeat.deleteMany({ where: { userId, college: college as College } });
    }
    await tx.ballot.deleteMany({ where: { userId, status: "OPEN" } });
  });
}
