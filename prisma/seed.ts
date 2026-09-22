import { hashSync } from "bcryptjs";
import { CategoryCode, Environment, PrismaClient, Sex, VerificationTier } from "@prisma/client";
import { SEASON_2027, THEMES } from "../lib/catalogue";
import { isoWeek } from "../lib/iso-week";

const prisma = new PrismaClient();
const PASSWORD = "wave-2027";

type SeedAthlete = {
  email: string;
  displayName: string;
  slug: string;
  sex: Sex;
  birthDate: string;
  country: string;
  city: string;
  club?: string;
  hashtags: string[];
  verification: VerificationTier;
  duty: boolean;
  bio?: string;
};

const athletes: SeedAthlete[] = [
  {
    email: "caio.mendes@gsr.surf",
    displayName: "Caio Mendes",
    slug: "caio-mendes",
    sex: "M",
    birthDate: "1995-01-20",
    country: "BR",
    city: "Saquarema",
    hashtags: ["brazil", "saquarema"],
    verification: "VERIFIED_PRO",
    duty: true,
  },
  {
    email: "theo.lambert@gsr.surf",
    displayName: "Theo Lambert",
    slug: "theo-lambert",
    sex: "M",
    birthDate: "1992-07-01",
    country: "FR",
    city: "Hossegor",
    hashtags: ["hossegor"],
    verification: "VERIFIED_PRO",
    duty: true,
  },
  {
    email: "rafael.nunes@gsr.surf",
    displayName: "Rafael Nunes",
    slug: "rafael-nunes",
    sex: "M",
    birthDate: "2000-11-02",
    country: "BR",
    city: "Florianopolis",
    hashtags: ["brazil", "florianopolis"],
    verification: "VERIFIED",
    duty: true,
  },
  {
    email: "joao.vasques@gsr.surf",
    displayName: "Joao Vasques",
    slug: "joao-vasques",
    sex: "M",
    birthDate: "1998-04-12",
    country: "BR",
    city: "Rio de Janeiro",
    hashtags: ["ipanema", "brazil"],
    verification: "VERIFIED",
    duty: true,
    bio: "This week's wave, filmed at the break.",
  },
  {
    email: "kenji.aoki@gsr.surf",
    displayName: "Kenji Aoki",
    slug: "kenji-aoki",
    sex: "M",
    birthDate: "1999-03-03",
    country: "JP",
    city: "Chiba",
    hashtags: ["chiba"],
    verification: "VERIFIED",
    duty: true,
  },
  {
    email: "mateo.cruz@gsr.surf",
    displayName: "Mateo Cruz",
    slug: "mateo-cruz",
    sex: "M",
    birthDate: "2001-08-15",
    country: "AR",
    city: "Mar del Plata",
    hashtags: ["mardelplata"],
    verification: "VERIFIED",
    duty: true,
  },
  {
    email: "pedro.lima@gsr.surf",
    displayName: "Pedro Lima",
    slug: "pedro-lima",
    sex: "M",
    birthDate: "1997-12-01",
    country: "BR",
    city: "Recife",
    hashtags: ["brazil", "recife"],
    verification: "VERIFIED",
    duty: false,
    bio: "Judging duty is overdue — the next wave does not enter.",
  },
  {
    email: "noah.keller@gsr.surf",
    displayName: "Noah Keller",
    slug: "noah-keller",
    sex: "M",
    birthDate: "1994-06-18",
    country: "ZA",
    city: "Jeffreys Bay",
    hashtags: ["jbay"],
    verification: "VERIFIED_PRO",
    duty: true,
  },
  {
    email: "marina.alves@gsr.surf",
    displayName: "Marina Alves",
    slug: "marina-alves",
    sex: "W",
    birthDate: "1998-02-02",
    country: "BR",
    city: "Rio de Janeiro",
    hashtags: ["rio"],
    verification: "VERIFIED_PRO",
    duty: true,
  },
  {
    email: "ana.luz@gsr.surf",
    displayName: "Ana Luz",
    slug: "ana-luz",
    sex: "W",
    birthDate: "2011-05-05",
    country: "BR",
    city: "Rio de Janeiro",
    hashtags: ["ipanema"],
    verification: "VERIFIED",
    duty: true,
    bio: "Junior. A guardian's consent waits for real verification.",
  },
  {
    email: "helena.prado@gsr.surf",
    displayName: "Helena Prado",
    slug: "helena-prado",
    sex: "W",
    birthDate: "1981-01-30",
    country: "BR",
    city: "Sao Paulo",
    club: "Sao Paulo Surf Club",
    hashtags: ["jhsf"],
    verification: "VERIFIED",
    duty: true,
  },
  {
    email: "sergio.bahia@gsr.surf",
    displayName: "Sergio Bahia",
    slug: "sergio-bahia",
    sex: "M",
    birthDate: "1973-09-01",
    country: "BR",
    city: "Salvador",
    hashtags: ["bahia"],
    verification: "VERIFIED_PRO",
    duty: true,
  },
];

const barrelOrder = [
  "caio-mendes",
  "theo-lambert",
  "rafael-nunes",
  "joao-vasques",
  "kenji-aoki",
  "mateo-cruz",
  "pedro-lima",
  "noah-keller",
];

function dateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

async function main() {
  await prisma.placement.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.board.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.season.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashSync(PASSWORD, 10);
  const week = isoWeek(dateOnly("2027-03-02"));

  await prisma.user.create({
    data: {
      email: "desk@gsr.surf",
      name: "GSR Desk",
      passwordHash,
      role: "ADMIN",
    },
  });

  const season = await prisma.season.create({
    data: {
      vintage: SEASON_2027.vintage,
      name: SEASON_2027.name,
      startsOn: dateOnly(SEASON_2027.startsOn),
      endsOn: dateOnly(SEASON_2027.endsOn),
      ageAsOf: dateOnly(SEASON_2027.ageAsOf),
    },
  });

  const themes = new Map<string, string>();
  for (const [index, theme] of THEMES.entries()) {
    const created = await prisma.theme.create({
      data: {
        seasonId: season.id,
        slug: theme.slug,
        name: theme.name,
        namePt: theme.namePt,
        finaleOn: dateOnly(theme.finaleOn),
        sortOrder: index + 1,
        open: theme.categories.includes("OPEN"),
        junior: theme.categories.includes("JUNIOR"),
        masters40: theme.categories.includes("MASTERS_40"),
        masters50: theme.categories.includes("MASTERS_50"),
        oceanOnly: theme.oceanOnly,
        poolOnly: theme.poolOnly,
        proposed: theme.proposedDate,
        note: theme.note,
      },
    });
    themes.set(theme.slug, created.id);
  }

  const bySlug = new Map<string, { id: string; sex: Sex }>();
  for (const athlete of athletes) {
    const user = await prisma.user.create({
      data: {
        email: athlete.email,
        name: athlete.displayName,
        passwordHash,
        role: "ATHLETE",
        athlete: {
          create: {
            displayName: athlete.displayName,
            slug: athlete.slug,
            verification: athlete.verification,
            sex: athlete.sex,
            birthDate: dateOnly(athlete.birthDate),
            country: athlete.country,
            city: athlete.city,
            club: athlete.club,
            hashtags: athlete.hashtags,
            bio: athlete.bio,
            judgingDutyCurrent: athlete.duty,
          },
        },
      },
      include: { athlete: true },
    });
    bySlug.set(athlete.slug, { id: user.athlete!.id, sex: athlete.sex });
  }

  const barrelId = themes.get("best-barrel")!;
  const category: CategoryCode = "OPEN";
  const board = await prisma.board.create({
    data: { themeId: barrelId, category, sex: "M" },
  });

  for (const [index, slug] of barrelOrder.entries()) {
    const athlete = bySlug.get(slug)!;
    const entry = await prisma.entry.create({
      data: {
        athleteId: athlete.id,
        themeId: barrelId,
        seasonId: season.id,
        environment: "OCEAN",
        videoUrl: `https://video.gsr.surf/demo/best-barrel/${String(index + 1).padStart(2, "0")}`,
        spot: "demo break",
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        tollCents: 0,
        status: "PLACED",
        category,
        sex: "M",
        placement: {
          create: { boardId: board.id, athleteId: athlete.id, place: index + 1 },
        },
      },
    });
    void entry;
  }

  const extras: {
    slug: string;
    theme: string;
    environment: Environment;
    category: CategoryCode;
    tollCents: number;
    spot: string;
  }[] = [
    { slug: "marina-alves", theme: "best-air", environment: "OCEAN", category: "OPEN", tollCents: 0, spot: "Arpoador" },
    { slug: "ana-luz", theme: "best-small-wave", environment: "OCEAN", category: "JUNIOR", tollCents: 0, spot: "Ipanema" },
    {
      slug: "helena-prado",
      theme: "best-surf-pool",
      environment: "POOL",
      category: "MASTERS_40",
      tollCents: 2000,
      spot: "Boa Vista",
    },
    { slug: "sergio-bahia", theme: "big-wave", environment: "OCEAN", category: "MASTERS_50", tollCents: 0, spot: "Nazare" },
  ];

  for (const extra of extras) {
    const athlete = bySlug.get(extra.slug)!;
    await prisma.entry.create({
      data: {
        athleteId: athlete.id,
        themeId: themes.get(extra.theme)!,
        seasonId: season.id,
        environment: extra.environment,
        videoUrl: `https://video.gsr.surf/demo/${extra.theme}/${extra.slug}`,
        spot: extra.spot,
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        tollCents: extra.tollCents,
        status: "SUBMITTED",
        category: extra.category,
        sex: athlete.sex,
      },
    });
  }

  console.log(`Seeded Season ${SEASON_2027.vintage}. Password for every demo account: ${PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
