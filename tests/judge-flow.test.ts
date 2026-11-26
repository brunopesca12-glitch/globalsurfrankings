import { afterAll, describe, expect, it } from "vitest";
import { hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { openFreshComparison } from "@/lib/fresh-ballot";
import { ensureWeeklyQueue, loadRankSession, saveRankingOrder } from "@/lib/judge-queue";

const databaseUrl = process.env.DATABASE_URL ?? "";
const local = /localhost|127\.0\.0\.1/.test(databaseUrl);
const prisma = local ? new PrismaClient() : null;
const prefix = `flow-test-${Date.now()}`;

async function ensureSeason() {
  if (!prisma) return;
  const existing = await prisma.season.findUnique({ where: { vintage: 2027 } });
  if (existing) return existing;
  return prisma.season.create({
    data: {
      vintage: 2027,
      name: "Founding Season 2027–28",
      startsOn: new Date("2027-03-01"),
      endsOn: new Date("2028-02-29"),
      ageAsOf: new Date("2028-02-29"),
      themes: {
        create: {
          slug: "best-tube",
          name: "Best Tube",
          namePt: "Best Tube",
          finaleOn: new Date("2028-02-29"),
          sortOrder: 1,
          open: true,
          junior: false,
          masters40: true,
          masters50: false,
          oceanOnly: false,
          poolOnly: false,
        },
      },
    },
  });
}

describe.skipIf(!local)("judge assignment on a local database", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
    await prisma.$disconnect();
  });

  it("assigns placed waves, shows the ballot, and saves the ranking", async () => {
    if (!prisma) return;
    const season = await ensureSeason();
    const theme = await prisma.theme.findFirst({ where: { seasonId: season!.id, slug: "best-tube" } });
    expect(theme).toBeTruthy();

    async function surfer(name: string, sex: "M" | "W") {
      const email = `${prefix}-${name}@example.com`;
      const user = await prisma!.user.create({
        data: {
          email,
          name,
          passwordHash: hashSync("wave-2027", 4),
          role: "ATHLETE",
          judgeOnboardedAt: new Date(),
          athlete: {
            create: {
              displayName: name,
              slug: `${prefix}-${name}`,
              sex,
              birthDate: new Date("1996-04-04"),
              country: "BR",
              verification: "VERIFIED",
              hashtags: [],
            },
          },
        },
        include: { athlete: true },
      });
      return user;
    }

    const judge = await surfer("judge", "W");
    const left = await surfer("left", "M");
    const right = await surfer("right", "M");
    for (const athlete of [left, right]) {
      await prisma.entry.create({
        data: {
          athleteId: athlete.athlete!.id,
          themeId: theme!.id,
          seasonId: season!.id,
          environment: "OCEAN",
          videoUrl: `https://video.gsr.surf/demo/flow/${athlete.id}`,
          isoYear: 2026,
          isoWeek: 48,
          tollCents: 0,
          status: "PLACED",
          category: "OPEN",
          sex: "M",
        },
      });
    }

    const assigned = await openFreshComparison(judge.email);
    expect(assigned.ok).toBe(true);
    if (!assigned.ok) return;
    expect(assigned.created).toBeGreaterThanOrEqual(2);

    const desk = await ensureWeeklyQueue(judge.id);
    expect(desk.pending).toBeGreaterThanOrEqual(2);
    expect(desk.ballot).not.toBeNull();
    expect(desk.destination?.edition).toContain("Men");

    const ranking = await loadRankSession(judge.id, desk.ballot!.id);
    expect(ranking).not.toBeNull();
    const ballots = ranking!.cards.filter((card) => card.key.startsWith("b:"));
    expect(ballots.length).toBeGreaterThanOrEqual(2);
    const saved = await saveRankingOrder(judge.id, desk.ballot!.id, ballots.map((card) => card.key).join(","));
    expect(saved).toBe("saved");
    const sealed = await prisma.ballot.count({
      where: { userId: judge.id, status: "SEALED", id: { in: ballots.map((card) => card.key.slice(2)) } },
    });
    expect(sealed).toBe(ballots.length);
  });
});
