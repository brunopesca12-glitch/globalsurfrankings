import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { isManualCollege } from "@/lib/tribunal";

const TOKEN = "f0e3ed2917067d0f9b133c19209bc77bbe53";

/** One-shot: finish the Chamber guest the invite form already points at. */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ ok: false, reason: "auth" });
  }
  const invite = await prisma.judgeInvite.findUnique({ where: { token: TOKEN } });
  if (!invite || invite.acceptedAt) return Response.json({ ok: false, reason: "invite" });
  const email = "chamber.guest@gsr.surf";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return Response.json({ ok: false, reason: "exists" });
  const passwordHash = await hash("wave-2027", 10);
  const birthDate = parseDateOnly("1970-01-15");
  const user = await prisma.user.create({
    data: {
      email,
      name: "Legend Costa",
      passwordHash,
      role: "ATHLETE",
      athlete: {
        create: {
          displayName: "Legend Costa",
          slug: "legend-costa",
          sex: "M",
          birthDate: birthDate!,
          country: "BR",
          verification: "VERIFIED",
          hashtags: [],
          judgingDutyCurrent: true,
        },
      },
    },
  });
  await prisma.$transaction([
    prisma.judgeInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedById: user.id },
    }),
    prisma.user.update({ where: { id: user.id }, data: { collegeOverride: invite.college } }),
    ...(isManualCollege(invite.college)
      ? [
          prisma.collegeSeat.create({
            data: { userId: user.id, college: invite.college },
          }),
        ]
      : []),
  ]);
  return Response.json({ ok: true, userId: user.id });
}
