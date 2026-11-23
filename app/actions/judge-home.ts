"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function finishOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { judgeOnboardedAt: new Date() },
  });
  revalidatePath("/judge");
  const next = String(formData.get("next") ?? "/judge");
  redirect(next === "/judge/ballot" ? "/judge/ballot" : "/judge");
}

export async function setJudgeNamePublic(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { judgeNamePublic: formData.get("public") === "yes" },
  });
  revalidatePath("/judge/history");
  redirect("/judge/history");
}
