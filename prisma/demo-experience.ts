/**
 * Insert-only accounts for the judge experience. Never deletes and never
 * rewrites an existing user. Do not use `npm run db:seed`.
 */
import { hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PASSWORD = "wave-2027";

async function ensureAthlete(input: {
  email: string;
  displayName: string;
  slug: string;
  birthDate: string;
  college: "CHAMBER" | null;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    console.log(`kept ${input.email}`);
    return;
  }
  await prisma.user.create({
    data: {
      email: input.email,
      name: input.displayName,
      passwordHash: hashSync(PASSWORD, 10),
      role: "ATHLETE",
      collegeOverride: input.college,
      athlete: {
        create: {
          displayName: input.displayName,
          slug: input.slug,
          sex: "M",
          birthDate: new Date(`${input.birthDate}T00:00:00.000Z`),
          country: "BR",
          city: "Rio de Janeiro",
          verification: "VERIFIED",
          hashtags: [],
          judgingDutyCurrent: true,
        },
      },
      seats: input.college === "CHAMBER" ? { create: [{ college: "CHAMBER" }] } : undefined,
    },
  });
  console.log(`created ${input.email}`);
}

async function main() {
  await ensureAthlete({
    email: "legend@gsr.surf",
    displayName: "Legend Costa",
    slug: "legend-costa",
    birthDate: "1970-01-15",
    college: "CHAMBER",
  });
  await ensureAthlete({
    email: "gallery@gsr.surf",
    displayName: "Gallery Nunes",
    slug: "gallery-nunes",
    birthDate: "1998-08-20",
    college: null,
  });
  console.log("Judge-experience accounts are in place. Nothing was deleted.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
