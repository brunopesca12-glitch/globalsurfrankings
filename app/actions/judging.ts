"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setManualSeat } from "@/lib/desk";
import { isManualCollege } from "@/lib/tribunal";
import { runMondayVerdict } from "@/lib/verdict";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function seatJudge(formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/sign-in");
  const userId = String(formData.get("userId") ?? "");
  const college = String(formData.get("college") ?? "");
  const seated = formData.get("seated") === "yes";
  if (!userId || !isManualCollege(college)) redirect("/admin/judge?error=seat");
  await setManualSeat(userId, college, seated);
  revalidatePath("/admin/judge");
  revalidatePath("/judge");
  redirect("/admin/judge?saved=1");
}

export async function runVerdict() {
  const session = await requireAdmin();
  if (!session) redirect("/sign-in");
  let result: { placed: number; held: number };
  try {
    result = await runMondayVerdict();
  } catch {
    redirect("/admin/judge?error=verdict");
  }
  revalidatePath("/admin/judge");
  revalidatePath("/board", "layout");
  revalidatePath("/ranking");
  revalidatePath("/videos", "layout");
  revalidatePath("/judge");
  redirect(`/admin/judge?placed=${result.placed}&held=${result.held}`);
}
