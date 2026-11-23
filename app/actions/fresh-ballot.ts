"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { openFreshComparison } from "@/lib/fresh-ballot";

export async function openFreshBallot(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/sign-in");
  const email = String(formData.get("email") ?? "");
  const result = await openFreshComparison(email);
  if (!result.ok) redirect(`/admin/judge?error=ballot&reason=${result.reason}`);
  redirect(
    `/admin/judge?fresh=${result.created}&event=${encodeURIComponent(result.event)}&edition=${encodeURIComponent(result.edition)}`,
  );
}
