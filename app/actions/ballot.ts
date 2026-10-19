"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { applyBallotComparison, sealFinishedBallot, undoBallotComparison } from "@/lib/judge-queue";

export async function castComparison(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const ballotId = String(formData.get("ballotId") ?? "");
  const raw = String(formData.get("comparison") ?? "");
  if (raw !== "better" && raw !== "worse") redirect("/judge/ballot?error=1");
  const outcome = await applyBallotComparison(session.user.id, ballotId, raw);
  if (outcome === "sealed") redirect("/judge/ballot?sealed=1");
  if (outcome === "rejected") redirect("/judge/ballot?error=1");
  redirect("/judge/ballot");
}

export async function sealPlacement(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const ballotId = String(formData.get("ballotId") ?? "");
  const outcome = await sealFinishedBallot(session.user.id, ballotId);
  if (outcome === "sealed") redirect("/judge/ballot?sealed=1");
  redirect("/judge/ballot?error=1");
}

export async function undoComparison(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const ballotId = String(formData.get("ballotId") ?? "");
  const outcome = await undoBallotComparison(session.user.id, ballotId);
  if (outcome === "rejected") redirect("/judge/ballot?error=1");
  redirect("/judge/ballot");
}
