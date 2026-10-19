import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { finishOnboarding } from "@/app/actions/judge-home";
import { auth } from "@/lib/auth";
import { eligibilityFor } from "@/lib/eligibility";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { loadJudgeContext } from "@/lib/judge-context";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Place the wave" };

export default async function WelcomePage() {
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
  if (!seat.college) redirect("/judge");
  const queue = await ensureWeeklyQueue(session.user.id);

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Your panel: {queue.panel}</p>
      <h1 className="mt-3 font-serif text-5xl leading-none">Place the wave.</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/80">
        {queue.destination
          ? `You're judging: ${queue.destination.event} · ${queue.destination.edition}.`
          : "When a wave is waiting, it goes into your own list."}{" "}
        Best at the top. Names stay hidden. Monday publishes the week&apos;s payment orders.
      </p>
      <form action={finishOnboarding} className="mt-8">
        <input type="hidden" name="next" value="/judge/ballot" />
        <button className="min-h-12 w-full bg-ocean px-4 py-3 text-paper" type="submit">
          Start
        </button>
      </form>
      <form action={finishOnboarding} className="mt-3">
        <input type="hidden" name="next" value="/judge" />
        <button className="min-h-12 w-full text-sm text-ink/60" type="submit">
          Skip
        </button>
      </form>
    </div>
  );
}
