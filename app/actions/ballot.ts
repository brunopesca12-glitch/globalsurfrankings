"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { applyBallotComparison, sealFinishedBallot } from "@/lib/judge-queue";

export async function castComparison(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const ballotId = String(formData.get("ballotId") ?? "");
  const raw = String(formData.get("comparison") ?? "");
  if (raw !== "better" && raw !== "worse") redirect("/judge?error=1");
  const outcome = await applyBallotComparison(session.user.id, ballotId, raw);
  if (outcome === "sealed") redirect("/judge?sealed=1");
  if (outcome === "rejected") redirect("/judge?error=1");
  redirect("/judge");
}

export async function sealPlacement(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const ballotId = String(formData.get("ballotId") ?? "");
  const outcome = await sealFinishedBallot(session.user.id, ballotId);
  if (outcome === "sealed") redirect("/judge?sealed=1");
  redirect("/judge?error=1");
}
