import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JudgeFeed } from "@/components/DuelStage";
import { currentEye } from "@/app/actions/feed";
import { auth } from "@/lib/auth";
import { eligibilityFor } from "@/lib/eligibility";
import { loadJudgeCard } from "@/lib/feed";
import { loadJudgeContext } from "@/lib/judge-context";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Judge" };

export default async function JudgeHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { seats: true, athlete: { select: { id: true } } },
  });
  if (!user) redirect("/sign-in");
  if (user.bannedAt) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-serif text-5xl">This account is closed.</h1>
      </div>
    );
  }

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
        <Link href="/lineup" className="mt-6 inline-block text-ocean">
          The Lineup
        </Link>
      </div>
    );
  }

  const [card, eye] = await Promise.all([loadJudgeCard(session.user.id), currentEye()]);

  return <JudgeFeed initial={card} eye={eye} />;
}
