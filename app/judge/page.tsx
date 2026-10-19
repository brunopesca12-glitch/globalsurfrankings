import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SEASON_2027 } from "@/lib/catalogue";
import { WEEKLY_JUDGING_BALLOTS } from "@/lib/constitution";
import { eligibilityFor } from "@/lib/eligibility";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { loadJudgeContext } from "@/lib/judge-context";
import { prisma } from "@/lib/db";
import { mondayCountdown, purseMirror } from "@/lib/season-clock";
import { COLLEGE_SEAT_LABEL } from "@/lib/tribunal";

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
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">No college yet</h1>
        <p className="mt-4 leading-relaxed text-ink/80">{seat.why}</p>
        {seat.qualify ? <p className="mt-3 leading-relaxed text-ink/80">{seat.qualify}</p> : null}
        <ul className="mt-8 space-y-3">
          {seat.claims.map((claim) => (
            <li key={claim.college} className="border border-line bg-white px-4 py-3 text-sm">
              <p className="font-medium">{COLLEGE_SEAT_LABEL[claim.college]}</p>
              <p className="mt-1 text-ink/70">{claim.because}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const queue = await ensureWeeklyQueue(session.user.id);
  if (!queue.onboarded) redirect("/judge/welcome");

  const today = new Date().toISOString().slice(0, 10);
  const purse = purseMirror({ college: seat.college, today, startsOn: SEASON_2027.startsOn });
  const open = queue.pending;
  const noun = open === 1 ? "ballot" : "ballots";

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{seat.label}</p>
      <h1 className="mt-2 font-serif text-5xl">Judge</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-ink/75">{seat.why}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <article className="border border-line bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-ink/50">This week</p>
          <p className="mt-2 font-serif text-4xl">
            {open} <span className="text-2xl text-ink/60">{noun} open</span>
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {queue.sealed} sealed · draw of {WEEKLY_JUDGING_BALLOTS}
          </p>
        </article>
        <article className="border border-line bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-ink/50">Streak</p>
          <p className="mt-2 font-serif text-4xl">
            {queue.streak} <span className="text-2xl text-ink/60">{queue.streak === 1 ? "week" : "weeks"}</span>
          </p>
          <p className="mt-1 text-sm text-ink/60">{mondayCountdown(new Date())}</p>
        </article>
        <article className="border border-line bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-ink/50">Accuracy</p>
          <p className="mt-2 font-serif text-4xl">
            {queue.accuracy ? queue.accuracy.mean.toFixed(1) : "—"}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {queue.accuracy
              ? `Mean places from Monday, across ${queue.accuracy.verdicts}.`
              : "It appears after Monday publishes a verdict you voted on."}
          </p>
        </article>
        <article className="border border-line bg-white px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-ink/50">Purse</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{purse.text}</p>
        </article>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {open > 0 ? (
          <Link href="/judge/ballot" className="min-h-12 bg-ocean px-5 py-3 text-center text-paper">
            Judge the next wave
          </Link>
        ) : (
          <p className="border border-line bg-white px-4 py-3 text-sm">This week&apos;s queue is complete.</p>
        )}
        <Link href="/judge/history" className="min-h-12 border border-ocean px-5 py-3 text-center text-ocean">
          History
        </Link>
      </div>
    </div>
  );
}
