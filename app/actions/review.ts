"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type FlagState = { error: string | null; sent: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function flagPublished(_prev: FlagState, formData: FormData): Promise<FlagState> {
  const user = await requireUser();
  if (!user) return { error: "Sign in to report a wave.", sent: false };
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  let entryId = String(formData.get("entryId") ?? "");
  const ballotId = String(formData.get("ballotId") ?? "");
  if (ballotId) {
    const ballot = await prisma.ballot.findFirst({
      where: { id: ballotId, userId: user.id },
      select: { entryId: true },
    });
    if (!ballot) return { error: "That wave is not on your desk.", sent: false };
    entryId = ballot.entryId;
  }
  const entry = await prisma.entry.findUnique({ where: { id: entryId }, select: { id: true } });
  if (!entry) return { error: "That wave is not on the site.", sent: false };
  const existing = await prisma.publicationFlag.findUnique({
    where: { entryId_userId: { entryId, userId: user.id } },
  });
  if (existing && !existing.resolvedAt) return { error: "You already reported this wave.", sent: false };
  if (existing) {
    await prisma.publicationFlag.update({
      where: { id: existing.id },
      data: { note, resolvedAt: null, createdAt: new Date() },
    });
  } else {
    await prisma.publicationFlag.create({ data: { entryId, userId: user.id, note } });
  }
  revalidatePath("/admin/review");
  revalidatePath(`/videos/${entryId}`);
  return { error: null, sent: true };
}

export async function clearReview(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/sign-in");
  const entryId = String(formData.get("entryId") ?? "");
  const entry = await prisma.entry.findUnique({ where: { id: entryId }, select: { modalityNote: true } });
  if (!entry) redirect("/admin/review?error=missing");
  const note = entry.modalityNote.includes("Cleared by the desk.")
    ? entry.modalityNote
    : `${entry.modalityNote} Cleared by the desk.`.trim();
  await prisma.entry.update({
    where: { id: entryId },
    data: { reviewStatus: "CLEAR", modalityNote: note },
  });
  revalidatePath("/admin/review");
  revalidatePath("/my-waves");
  revalidatePath(`/videos/${entryId}`);
  redirect("/admin/review?saved=cleared");
}

export async function dismissFlag(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/sign-in");
  const flagId = String(formData.get("flagId") ?? "");
  await prisma.publicationFlag.update({ where: { id: flagId }, data: { resolvedAt: new Date() } }).catch(() => undefined);
  revalidatePath("/admin/review");
  redirect("/admin/review?saved=flag");
}

export async function removeEntry(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) redirect("/sign-in");
  const entryId = String(formData.get("entryId") ?? "");
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { status: true, placement: { select: { id: true } } },
  });
  if (!entry) redirect("/admin/review?error=missing");
  if (entry.status === "PLACED" || entry.placement) redirect("/admin/review?error=placed");
  await prisma.entry.delete({ where: { id: entryId } });
  revalidatePath("/admin/review");
  revalidatePath("/my-waves");
  revalidatePath("/videos");
  revalidatePath("/ranking");
  redirect("/admin/review?saved=removed");
}
