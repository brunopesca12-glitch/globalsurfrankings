"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { keyFromVotes, type HigherSideName } from "@/lib/calibration";
import { prisma } from "@/lib/db";

async function requireKeyMaker() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, calibrationPro: true },
  });
  if (!user || (user.role !== "ADMIN" && !user.calibrationPro)) return null;
  return user;
}

export async function createCalibrationDuel(formData: FormData) {
  const user = await requireKeyMaker();
  if (!user) redirect("/sign-in");
  const left = String(formData.get("left") ?? "");
  const right = String(formData.get("right") ?? "");
  if (!left || !right || left === right) redirect("/admin/calibration?error=pair");
  const entries = await prisma.entry.findMany({
    where: { id: { in: [left, right] }, status: "PLACED" },
    select: { id: true },
  });
  if (entries.length !== 2) redirect("/admin/calibration?error=pair");
  const existing = await prisma.calibrationDuel.findFirst({
    where: {
      OR: [
        { leftEntryId: left, rightEntryId: right },
        { leftEntryId: right, rightEntryId: left },
      ],
    },
  });
  if (existing) redirect("/admin/calibration?error=exists");
  await prisma.calibrationDuel.create({ data: { leftEntryId: left, rightEntryId: right } });
  revalidatePath("/admin/calibration");
  redirect("/admin/calibration?saved=created");
}

export async function castKeyVote(formData: FormData) {
  const user = await requireKeyMaker();
  if (!user) redirect("/sign-in");
  const duelId = String(formData.get("duelId") ?? "");
  const side = String(formData.get("higher") ?? "");
  if (side !== "LEFT" && side !== "RIGHT") redirect("/admin/calibration?error=vote");
  const duel = await prisma.calibrationDuel.findUnique({ where: { id: duelId }, select: { id: true } });
  if (!duel) redirect("/admin/calibration?error=vote");
  await prisma.calibrationVote.upsert({
    where: { duelId_userId: { duelId, userId: user.id } },
    create: { duelId, userId: user.id, higher: side },
    update: { higher: side },
  });
  const votes = await prisma.calibrationVote.findMany({ where: { duelId }, select: { higher: true } });
  const key = keyFromVotes(votes.map((vote) => vote.higher as HigherSideName));
  await prisma.calibrationDuel.update({ where: { id: duelId }, data: { higher: key } });
  revalidatePath("/admin/calibration");
  revalidatePath("/");
  redirect("/admin/calibration?saved=vote");
}

export async function markCalibrationPro(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/sign-in");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const on = formData.get("on") === "yes";
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) redirect("/admin/calibration?error=pro");
  await prisma.user.update({ where: { id: user.id }, data: { calibrationPro: on } });
  revalidatePath("/admin/calibration");
  redirect("/admin/calibration?saved=pro");
}
