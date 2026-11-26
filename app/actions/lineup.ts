"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function toggleShaka(entryId: string): Promise<{ on: boolean; count: number } | null> {
  const session = await auth();
  if (!session?.user) return null;
  const entry = await prisma.entry.findFirst({
    where: { id: entryId, status: "PLACED" },
    select: { id: true },
  });
  if (!entry) return null;
  const existing = await prisma.shaka.findUnique({
    where: { userId_entryId: { userId: session.user.id, entryId } },
  });
  if (existing) {
    await prisma.shaka.delete({ where: { id: existing.id } });
  } else {
    await prisma.shaka.create({ data: { userId: session.user.id, entryId } });
  }
  const count = await prisma.shaka.count({ where: { entryId } });
  revalidatePath("/lineup");
  return { on: !existing, count };
}

export async function toggleFollow(athleteId: string): Promise<{ on: boolean } | null> {
  const session = await auth();
  if (!session?.user) return null;
  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId }, select: { id: true, userId: true } });
  if (!athlete || athlete.userId === session.user.id) return null;
  const existing = await prisma.follow.findUnique({
    where: { followerId_athleteId: { followerId: session.user.id, athleteId } },
  });
  if (existing) await prisma.follow.delete({ where: { id: existing.id } });
  else await prisma.follow.create({ data: { followerId: session.user.id, athleteId } });
  revalidatePath("/lineup");
  return { on: !existing };
}
