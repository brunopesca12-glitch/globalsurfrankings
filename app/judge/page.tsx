import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { eligibilityFor } from "@/lib/eligibility";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { loadJudgeContext } from "@/lib/judge-context";
import { prisma } from "@/lib/db";
import { mondayCountdown } from "@/lib/season-clock";

export const metadata: Metadata = { title: "Judge" };

export default async function JudgeHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) redirect("/sign-in");

  const ctx = await loadJudgeContext();
  const athleteId = user.athlete?.id ?? null;
  const seat = eligibilityFor({
    role: user.role,
    hasAthlete: athleteId != null,
    seatedChamber: user.seats.some((row) => row.college === "CHAMBER"),
    seatedRanked: user.seats.some((row) => row.college === "RANKED"),
    upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
    enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
    override: user.collegeOverride,
  });

  if (!seat.college) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-serif text-5xl">You&apos;re not judging yet.</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/80">
          {user.role === "ADMIN"
            ? "This is the desk. It runs Monday. It does not place waves."
            : "Create an athlete profile. Then you can place waves with everyone else."}
        </p>
      </div>
    );
  }

  const queue = await ensureWeeklyQueue(session.user.id);
  if (!queue.onboarded) redirect("/judge/welcome");

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Your panel: {queue.panel}</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight">
        {queue.destination
          ? `You're judging: ${queue.destination.event} · ${queue.destination.edition}`
          : "Nothing to place this week."}
      </h1>
      <p className="mt-4 text-lg text-ink/75">
        {queue.pending === 0
          ? "You're done for this week."
          : queue.pending === 1
            ? "1 wave left this week."
            : `${queue.pending} waves left this week.`}
      </p>
      <p className="mt-2 text-sm text-ink/60">{mondayCountdown(new Date())}</p>
      {queue.pending > 0 ? (
        <Link href="/judge/ballot" className="mt-8 inline-flex min-h-12 items-center bg-ocean px-5 py-3 text-paper">
          Place the next wave
        </Link>
      ) : (
        <Link href="/judge/history" className="mt-8 inline-flex min-h-12 items-center border border-ocean px-5 py-3 text-ocean">
          Your places
        </Link>
      )}
    </div>
  );
}
