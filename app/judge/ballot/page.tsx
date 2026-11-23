import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { saveRanking, undoPlacement } from "@/app/actions/ballot";
import { FlagWave } from "@/components/FlagWave";
import { RankSet } from "@/components/RankSet";
import { auth } from "@/lib/auth";
import { ensureWeeklyQueue, loadRankSession } from "@/lib/judge-queue";
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
        <h1 className="mt-3 font-serif text-5xl">Saved</h1>
        <p className="mt-4 text-lg text-ink/75">
          {Number.isInteger(place) ? `The last wave you moved is #${place}. ` : ""}
          That ranking is in your list.
        </p>
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
        <p className="mt-4 text-lg text-ink/75">
          You have no open waves in a current division. If you already ranked this week, that set is finished.
        </p>
        <Link href="/judge" className="mt-6 inline-block text-ocean">
          Back
        </Link>
      </div>
    );
  }

  const ranking = await loadRankSession(session.user.id, queue.ballot.id);
  const only = ranking?.cards.length === 1 ? ranking.cards[0] : null;
  if (!ranking || ranking.cards.length < 2) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-serif text-5xl">{only ? "Only one wave." : "Nothing to compare."}</h1>
        <p className="mt-4 text-lg text-ink/75">
          {only
            ? "This division has no other wave yet, so there is nothing to rank it against."
            : "There is no set of waves to rank right now."}
        </p>
        {only ? (
          <form action={saveRanking} className="mt-8">
            <input type="hidden" name="ballotId" value={queue.ballot.id} />
            <input type="hidden" name="order" value={only.key} />
            <button className="min-h-12 bg-ocean px-5 py-3 text-paper" type="submit">
              Place it first
            </button>
          </form>
        ) : (
          <Link href="/judge" className="mt-6 inline-block text-ocean">
            Back
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-5 md:py-10">
      {query.error === "1" ? <p className="mb-4 text-sm text-stamp">That ranking was not saved. Try again.</p> : null}
      <p className="mb-4 text-sm text-ink/60">
        {queue.pending === 1 ? "1 wave left to place." : `${queue.pending} waves left to place.`}
      </p>
      <RankSet
        ballotId={queue.ballot.id}
        eventLine={`You're judging: ${ranking.event} · ${ranking.edition}`}
        cards={ranking.cards}
        fresh={ranking.fresh}
        already={ranking.already}
        compared={ranking.compared}
      />
      <div className="mt-8 max-w-md border border-line bg-white px-4 py-4">
        <p className="mb-3 text-sm text-ink/70">
          If the new wave was already posted somewhere, tell the desk. This does not name the surfer.
        </p>
        <FlagWave ballotId={queue.ballot.id} />
      </div>
    </div>
  );
}
