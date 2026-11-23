import type { College } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/iso-week";

const TARGET = 37;
const DEMO_EMAIL = "chamber.guest@gsr.surf";

/**
 * Adds sealed waves to one demo judge's own list. It only inserts rows
 * marked demo-list. It does not delete, and it does not run the seed.
 */
export async function ensureDemoJudgeStack(email = DEMO_EMAIL): Promise<
  | { ok: true; email: string; event: string; edition: string; sealed: number; incoming: string }
  | { ok: false; reason: string }
> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) return { ok: false, reason: "judge_not_found" };

  const college = judgeCollege(user);
  if (!college) return { ok: false, reason: "judge_has_no_panel" };

  const season = await prisma.season.findUnique({ where: { vintage: 2027 } });
  if (!season) return { ok: false, reason: "season_missing" };

  const open = await prisma.ballot.findFirst({
    where: { userId: user.id, status: "OPEN", entry: { status: "SUBMITTED" } },
    orderBy: { createdAt: "asc" },
    include: { entry: { include: { theme: true } } },
  });

  const board = open
    ? {
        themeId: open.entry.themeId,
        themeName: open.entry.theme.name,
        category: open.entry.category,
        sex: open.entry.sex,
      }
    : await defaultBoard(season.id);
  if (!board) return { ok: false, reason: "theme_missing" };

  const already = await prisma.ballot.findMany({
    where: {
      userId: user.id,
      status: "SEALED",
      entry: { themeId: board.themeId, category: board.category, sex: board.sex },
    },
    select: { place: true },
  });
  const existing = already.length;
  let nextPlace = already.reduce((max, row) => Math.max(max, row.place ?? 0), 0);

  const week = isoWeek(new Date());
  let incomingId = open?.id ?? null;
  if (!incomingId) {
    const entry = await prisma.entry.create({
      data: {
        athleteId: await demoAthlete("incoming"),
        themeId: board.themeId,
        seasonId: season.id,
        environment: "OCEAN",
        videoUrl: "https://demo.gsr.surf/list-incoming",
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        tollCents: 0,
        status: "SUBMITTED",
        category: board.category,
        sex: board.sex,
      },
    });
    const ballot = await prisma.ballot.create({
      data: {
        userId: user.id,
        entryId: entry.id,
        college,
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        status: "OPEN",
        boardEntryIds: [],
        lo: 0,
        hi: 0,
      },
    });
    incomingId = ballot.id;
  }

  for (let rank = existing + 1; rank <= TARGET; rank += 1) {
    nextPlace += 1;
    const athleteId = await demoAthlete(String(nextPlace).padStart(2, "0"));
    const entry = await prisma.entry.create({
      data: {
        athleteId,
        themeId: board.themeId,
        seasonId: season.id,
        environment: "OCEAN",
        videoUrl: `https://demo.gsr.surf/list-${rank}`,
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        tollCents: 0,
        status: "PLACED",
        category: board.category,
        sex: board.sex,
      },
    });
    await prisma.ballot.create({
      data: {
        userId: user.id,
        entryId: entry.id,
        college,
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        status: "SEALED",
        place: nextPlace,
        sealedAt: new Date(Date.UTC(2026, 9, 19, 12, rank)),
        boardEntryIds: [],
        lo: 0,
        hi: 0,
      },
    });
  }

  if (!user.judgeOnboardedAt) {
    await prisma.user.update({ where: { id: user.id }, data: { judgeOnboardedAt: new Date() } });
  }

  const sealed = await prisma.ballot.count({
    where: {
      userId: user.id,
      status: "SEALED",
      entry: { themeId: board.themeId, category: board.category, sex: board.sex },
    },
  });

  return {
    ok: true,
    email: user.email,
    event: board.themeName,
    edition: `${board.sex === "W" ? "Women's" : "Men's"} ${board.category}`,
    sealed,
    incoming: incomingId,
  };
}

function judgeCollege(user: {
  collegeOverride: College | null;
  seats: { college: College }[];
}): College | null {
  if (user.collegeOverride) return user.collegeOverride;
  return user.seats.find((seat) => seat.college === "CHAMBER")?.college ?? user.seats[0]?.college ?? null;
}

async function defaultBoard(seasonId: string) {
  const theme = await prisma.theme.findFirst({
    where: { seasonId, slug: "best-tube" },
  });
  if (!theme) return null;
  return { themeId: theme.id, themeName: theme.name, category: "OPEN" as const, sex: "M" as const };
}

async function demoAthlete(key: string): Promise<string> {
  const slug = `demo-list-${key}`;
  const existing = await prisma.athlete.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const owner = await prisma.user.create({
    data: {
      email: `${slug}@gsr.surf`,
      passwordHash: "demo-list-no-login",
      name: `Demo list ${key}`,
    },
  });
  const athlete = await prisma.athlete.create({
    data: {
      userId: owner.id,
      displayName: `Demo list ${key}`,
      slug,
      sex: "M",
      birthDate: new Date("2000-01-15"),
    },
  });
  return athlete.id;
}
