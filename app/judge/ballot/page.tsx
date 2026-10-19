import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { undoPlacement } from "@/app/actions/ballot";
import { PlaceBoard } from "@/components/PlaceBoard";
import { auth } from "@/lib/auth";
import { ensureWeeklyQueue, loadJudgeStack } from "@/lib/judge-queue";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Place the wave" };

export default async function BallotPage({
  searchParams,
}: {
  searchParams: Promise<{ sealed?: string; error?: string; place?: string }>;
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
      select: { id: true, place: true },
    });
    const place = latest?.place ?? Number(query.place);
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Placed</p>
        <h1 className="mt-3 font-serif text-6xl">#{Number.isInteger(place) ? place : "—"}</h1>
        <p className="mt-4 text-lg text-ink/75">That wave is in your list.</p>
        <div className="mt-8 flex flex-col gap-3">
          {latest ? (
            <form action={undoPlacement}>
              <input type="hidden" name="ballotId" value={latest.id} />
              <button className="min-h-12 w-full border border-line" type="submit">
                Undo
              </button>
            </form>
          ) : null}
          {queue.pending > 0 ? (
            <Link href="/judge/ballot" className="min-h-12 bg-ocean px-5 py-3 text-center text-paper">
              Next wave
            </Link>
          ) : (
            <Link href="/judge" className="min-h-12 bg-ocean px-5 py-3 text-center text-paper">
              Done for this week
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!queue.ballot) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-serif text-5xl">Nothing to place.</h1>
        <Link href="/judge" className="mt-6 inline-block text-ocean">
          Back
        </Link>
      </div>
    );
  }

  const stack = await loadJudgeStack(session.user.id, queue.ballot.id);
  if (!stack) redirect("/judge");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-5 md:py-10">
      {query.error === "1" ? <p className="mb-4 text-sm text-stamp">That place was not saved. Try again.</p> : null}
      <PlaceBoard
        ballotId={queue.ballot.id}
        incomingSrc={`/judge/media/${queue.ballot.id}/drawn`}
        eventLine={`You're judging: ${stack.event} · ${stack.edition}`}
        tiles={stack.tiles}
      />
    </div>
  );
}
