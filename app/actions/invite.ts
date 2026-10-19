"use server";

import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { COLLEGE_SEAT_LABEL, isManualCollege } from "@/lib/tribunal";
import type { College } from "@/lib/median";

function isCollege(value: string): value is College {
  return value === "CHAMBER" || value === "RANKED" || value === "ATHLETES" || value === "UPPER" || value === "PUBLIC";
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function createInvite(formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/sign-in");
  const college = String(formData.get("college") ?? "");
  if (!isCollege(college)) redirect("/admin/judge?error=invite");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = randomBytes(18).toString("hex");
  await prisma.judgeInvite.create({
    data: {
      token,
      college,
      email: email.length > 0 ? email : null,
      note: `Seats the ${COLLEGE_SEAT_LABEL[college]}.`,
    },
  });
  revalidatePath("/admin/judge");
  redirect(`/admin/judge?invite=${token}`);
}

export async function setCollegeOverride(formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/sign-in");
  const userId = String(formData.get("userId") ?? "");
  const college = String(formData.get("college") ?? "");
  if (!userId) redirect("/admin/judge?error=override");
  await prisma.user.update({
    where: { id: userId },
    data: { collegeOverride: college === "auto" || !isCollege(college) ? null : college },
  });
  revalidatePath("/admin/judge");
  revalidatePath("/judge");
  redirect("/admin/judge?saved=1");
}

async function acceptInviteFor(userId: string, token: string) {
  const invite = await prisma.judgeInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || (invite.expiresAt && invite.expiresAt < new Date())) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return false;
  if (invite.email && invite.email !== user.email) return false;
  await prisma.$transaction([
    prisma.judgeInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedById: userId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { collegeOverride: invite.college },
    }),
    ...(isManualCollege(invite.college)
      ? [
          prisma.collegeSeat.upsert({
            where: { userId_college: { userId, college: invite.college } },
            create: { userId, college: invite.college },
            update: {},
          }),
        ]
      : []),
  ]);
  return true;
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const session = await auth();
  if (!session?.user) redirect(`/invite/${token}`);
  const ok = await acceptInviteFor(session.user.id, token);
  if (!ok) redirect(`/invite/${token}?error=1`);
  redirect("/judge/welcome");
}

export async function registerFromInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const invite = await prisma.judgeInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) redirect(`/invite/${token}?error=1`);
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const sex = String(formData.get("sex") ?? "M");
  const birthDate = String(formData.get("birthDate") ?? "");
  if (displayName.length < 2 || !email.includes("@") || password.length < 8) {
    redirect(`/invite/${token}?error=1`);
  }
  if (invite.email && invite.email !== email) redirect(`/invite/${token}?error=1`);
  if (sex !== "M" && sex !== "W") redirect(`/invite/${token}?error=1`);
  if (!parseDateOnly(birthDate)) redirect(`/invite/${token}?error=1`);
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) redirect(`/invite/${token}?error=exists`);

  const passwordHash = await hash(password, 10);
  const base = slugify(displayName);
  const slugTaken = await prisma.athlete.findUnique({ where: { slug: base } });
  const slug = slugTaken ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
  const user = await prisma.user.create({
    data: {
      email,
      name: displayName,
      passwordHash,
      role: "ATHLETE",
      athlete: {
        create: {
          displayName,
          slug,
          sex,
          birthDate: parseDateOnly(birthDate)!,
          country: "BR",
          verification: "VERIFIED",
          hashtags: [],
          judgingDutyCurrent: true,
        },
      },
    },
  });
  const ok = await acceptInviteFor(user.id, token);
  if (!ok) redirect(`/invite/${token}?error=1`);
  await signIn("credentials", { email, password, redirectTo: "/judge/welcome" });
}
