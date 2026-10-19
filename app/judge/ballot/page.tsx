import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BallotDesk } from "@/components/BallotDesk";
import { auth } from "@/lib/auth";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Ballot" };

export default async function BallotPage({
  searchParams,
}: {
  searchParams: Promise<{ sealed?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const query = await searchParams;
  const queue = await ensureWeeklyQueue(session.user.id);
  if (!queue.college) redirect("/judge");
  if (!queue.onboarded) redirect("/judge/welcome");

  if (query.sealed === "1") {
    const latest = await prisma.ballot.findFirst({
      where: { userId: session.user.id, status: "SEALED", place: { not: null } },
      orderBy: { sealedAt: "desc" },
      select: { place: true },
    });
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Sealed</p>
        <h1 className="mt-4 font-serif text-6xl">That wave has a place.</h1>
        {latest?.place ? (
          <p className="mt-4 text-lg text-ink/75">You put it {ordinal(latest.place)} on this board.</p>
        ) : (
          <p className="mt-4 text-lg text-ink/75">Your ballot is in. Monday reads the colleges together.</p>
        )}
        <div className="mt-10 flex w-full flex-col gap-3">
          {queue.pending > 0 ? (
            <Link href="/judge/ballot" className="min-h-12 bg-ocean px-5 py-3 text-paper">
              Next ballot
            </Link>
          ) : (
            <Link href="/judge" className="min-h-12 bg-ocean px-5 py-3 text-paper">
              Back to the week
            </Link>
          )}
          <Link href="/judge/history" className="text-sm text-ocean">
            See your history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 md:py-10">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Blind ballot</p>
        <Link href="/judge" className="text-sm text-ocean">
          Week
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink/70">
        {queue.pending} open · {queue.sealed} sealed this week
      </p>
      {query.error === "1" ? <p className="mt-3 text-sm text-stamp">That action was not recorded. Try the wave again.</p> : null}
      {queue.ballot ? (
        <div className="mt-4">
          <BallotDesk
            ballotId={queue.ballot.id}
            mode={queue.ballot.mode}
            step={queue.ballot.step}
            canUndo={queue.ballot.canUndo}
          />
        </div>
      ) : (
        <p className="mt-10 border border-line bg-white px-4 py-6">This week&apos;s queue is complete.</p>
      )}
    </div>
  );
}

function ordinal(place: number): string {
  const mod100 = place % 100;
  const mod10 = place % 10;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th";
  return `${place}${suffix}`;
}
