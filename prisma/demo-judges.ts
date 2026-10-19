/**
 * Insert-only demo judges. Safe to run again: it creates missing rows and
 * never deletes or rewrites an existing user, entry, seat, or placement.
 *
 * Do not use `npm run db:seed` for this. Seed wipes the season.
 */
import { hashSync } from "bcryptjs";
import { CategoryCode, College, PrismaClient, Sex } from "@prisma/client";
import { isoWeek } from "../lib/iso-week";

const prisma = new PrismaClient();
const PASSWORD = "wave-2027";

type DemoAthlete = {
  email: string;
  displayName: string;
  slug: string;
  sex: Sex;
  birthDate: string;
  country: string;
  city: string;
};

const ACCOUNTS = {
  chamber: {
    email: "chamber@gsr.surf",
    displayName: "Leila Costa",
    slug: "leila-costa",
    sex: "M" as const,
    birthDate: "1972-04-04",
    country: "BR",
    city: "Salvador",
  },
  ranked: {
    email: "ranked@gsr.surf",
    displayName: "Marco Vieri",
    slug: "marco-vieri",
    sex: "W" as const,
    birthDate: "1984-06-06",
    country: "IT",
    city: "Genoa",
  },
  athletes: {
    email: "athletes@gsr.surf",
    displayName: "Ines Duarte",
    slug: "ines-duarte",
    sex: "M" as const,
    birthDate: "1999-02-02",
    country: "PT",
    city: "Lisbon",
  },
  upper: {
    email: "upper@gsr.surf",
    displayName: "Hanae Sato",
    slug: "hanae-sato",
    sex: "W" as const,
    birthDate: "1996-08-08",
    country: "JP",
    city: "Chiba",
  },
  public: {
    email: "public@gsr.surf",
    displayName: "Owen Blake",
    slug: "owen-blake",
    sex: "M" as const,
    birthDate: "1991-01-15",
    country: "AU",
    city: "Byron Bay",
  },
} satisfies Record<string, DemoAthlete>;

function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

async function ensureAthlete(input: DemoAthlete): Promise<{ id: string; userId: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    include: { athlete: true },
  });
  if (existing?.athlete) return { id: existing.athlete.id, userId: existing.id };
  if (existing) {
    const athlete = await prisma.athlete.create({
      data: {
        userId: existing.id,
        displayName: input.displayName,
        slug: input.slug,
        verification: "VERIFIED",
        sex: input.sex,
        birthDate: dateOnly(input.birthDate),
        country: input.country,
        city: input.city,
        hashtags: [],
        judgingDutyCurrent: true,
      },
    });
    return { id: athlete.id, userId: existing.id };
  }
  const created = await prisma.user.create({
    data: {
      email: input.email,
      name: input.displayName,
      passwordHash: hashSync(PASSWORD, 10),
      role: "ATHLETE",
      athlete: {
        create: {
          displayName: input.displayName,
          slug: input.slug,
          verification: "VERIFIED",
          sex: input.sex,
          birthDate: dateOnly(input.birthDate),
          country: input.country,
          city: input.city,
          hashtags: [],
          judgingDutyCurrent: true,
        },
      },
    },
    include: { athlete: true },
  });
  return { id: created.athlete!.id, userId: created.id };
}

async function ensureSeat(userId: string, college: Extract<College, "CHAMBER" | "RANKED">) {
  await prisma.collegeSeat.upsert({
    where: { userId_college: { userId, college } },
    create: { userId, college },
    update: {},
  });
}

async function main() {
  const season = await prisma.season.findUnique({ where: { vintage: 2027 } });
  if (!season) {
    throw new Error("Season 2027 is not in the database. This script does not seed the season and does not delete anything.");
  }
  const themes = await prisma.theme.findMany({ where: { seasonId: season.id } });
  const themeId = (slug: string) => {
    const theme = themes.find((item) => item.slug === slug);
    if (!theme) throw new Error(`Theme ${slug} is missing. This script does not create the calendar.`);
    return theme.id;
  };
  const week = isoWeek(dateOnly("2027-03-02"));

  const chamber = await ensureAthlete(ACCOUNTS.chamber);
  await ensureSeat(chamber.userId, "CHAMBER");

  const ranked = await ensureAthlete(ACCOUNTS.ranked);
  await ensureSeat(ranked.userId, "RANKED");

  const athletes = await ensureAthlete(ACCOUNTS.athletes);
  await ensureEntry({
    athleteId: athletes.id,
    themeId: themeId("best-cutback"),
    seasonId: season.id,
    category: "OPEN",
    sex: "M",
    videoUrl: "https://video.gsr.surf/demo/judges/athletes",
    status: "SUBMITTED",
    isoYear: week.isoYear,
    isoWeek: week.isoWeek,
  });

  const upper = await ensureAthlete(ACCOUNTS.upper);
  await ensureUpperEntry({
    athleteId: upper.id,
    themeId: themeId("best-backside"),
    seasonId: season.id,
    category: "OPEN",
    sex: "W",
    videoUrl: "https://video.gsr.surf/demo/judges/upper",
    isoYear: week.isoYear,
    isoWeek: week.isoWeek,
  });

  await ensureAthlete(ACCOUNTS.public);

  console.log("Demo judges are in place. Nothing was deleted. Password for each new account: wave-2027");
  console.log("chamber@gsr.surf   Chamber of Champions");
  console.log("ranked@gsr.surf    The Ranked");
  console.log("athletes@gsr.surf  Athletes' College");
  console.log("upper@gsr.surf     Upper Chamber");
  console.log("public@gsr.surf    The Public");
}

async function ensureEntry(input: {
  athleteId: string;
  themeId: string;
  seasonId: string;
  category: CategoryCode;
  sex: Sex;
  videoUrl: string;
  status: "SUBMITTED";
  isoYear: number;
  isoWeek: number;
}) {
  const existing = await prisma.entry.findFirst({
    where: { athleteId: input.athleteId, themeId: input.themeId },
    select: { id: true },
  });
  if (existing) return;
  await prisma.entry.create({
    data: {
      athleteId: input.athleteId,
      themeId: input.themeId,
      seasonId: input.seasonId,
      environment: "OCEAN",
      videoUrl: input.videoUrl,
      isoYear: input.isoYear,
      isoWeek: input.isoWeek,
      tollCents: 0,
      status: input.status,
      category: input.category,
      sex: input.sex,
    },
  });
}

async function ensureUpperEntry(input: {
  athleteId: string;
  themeId: string;
  seasonId: string;
  category: CategoryCode;
  sex: Sex;
  videoUrl: string;
  isoYear: number;
  isoWeek: number;
}) {
  const existing = await prisma.entry.findFirst({
    where: { athleteId: input.athleteId, themeId: input.themeId },
    select: { id: true },
  });
  if (existing) return;

  const board = await prisma.board.findUnique({
    where: { themeId_category_sex: { themeId: input.themeId, category: input.category, sex: input.sex } },
    include: { placements: { select: { id: true } } },
  });
  if (board && board.placements.length >= 10) {
    console.log("Best Backside Open Women already has 10 places. upper@gsr.surf was not placed, so this account may sit with the Athletes.");
    await ensureEntry({ ...input, status: "SUBMITTED" });
    return;
  }

  const owned =
    board ??
    (await prisma.board.create({
      data: { themeId: input.themeId, category: input.category, sex: input.sex },
    }));
  const place = (board?.placements.length ?? 0) + 1;
  await prisma.entry.create({
    data: {
      athleteId: input.athleteId,
      themeId: input.themeId,
      seasonId: input.seasonId,
      environment: "OCEAN",
      videoUrl: input.videoUrl,
      isoYear: input.isoYear,
      isoWeek: input.isoWeek,
      tollCents: 0,
      status: "PLACED",
      category: input.category,
      sex: input.sex,
      placement: { create: { boardId: owned.id, athleteId: input.athleteId, place } },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
