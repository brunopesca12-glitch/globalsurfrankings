import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { finishOnboarding } from "@/app/actions/judge-home";
import { auth } from "@/lib/auth";
import { eligibilityFor } from "@/lib/eligibility";
import { loadJudgeContext } from "@/lib/judge-context";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "How judging works" };

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

  return (
    <div className="mx-auto max-w-xl px-5 py-10 md:py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{seat.label}</p>
      <h1 className="mt-3 font-serif text-5xl leading-none">A wave gets a place, not a score.</h1>
      <p className="mt-4 leading-relaxed text-ink/80">{seat.why}</p>
      <ol className="mt-8 space-y-4">
        {[
          ["Blind", "You never see the athlete or the category. Two waves. Which one is better?"],
          ["The same ballot", "Legends and competitors use this exact comparison. One college, one median, on Monday."],
          ["Your record", "Monday publishes the college verdict. Your accuracy is how close your place sat to that verdict."],
        ].map(([title, body]) => (
          <li key={title} className="border border-line bg-white px-4 py-4">
            <p className="font-serif text-2xl">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/75">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col gap-3">
        <form action={finishOnboarding}>
          <input type="hidden" name="next" value="/judge/ballot" />
          <button className="min-h-12 w-full bg-ocean px-4 py-3 text-paper" type="submit">
            Start judging
          </button>
        </form>
        <form action={finishOnboarding}>
          <input type="hidden" name="next" value="/judge" />
          <button className="min-h-12 w-full text-sm text-ink/70" type="submit">
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
