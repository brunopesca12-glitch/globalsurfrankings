import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BlindWave } from "@/components/BlindWave";
import { castComparison, sealPlacement } from "@/app/actions/ballot";
import { auth } from "@/lib/auth";
import { RANKED_BALLOT_USD } from "@/lib/constitution";
import { formatUsdAmount } from "@/lib/format";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { accuracyLine, ballotProgressLine, COLLEGE_SEAT_LABEL, dutyStatusLine } from "@/lib/tribunal";

export const metadata: Metadata = { title: "Judge" };

export default async function JudgePage({
  searchParams,
}: {
  searchParams: Promise<{ sealed?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const query = await searchParams;
  const queue = await ensureWeeklyQueue(session.user.id);

  if (!queue.college) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">No seat</h1>
        <p className="mt-4 text-ink/75">
          This account is the desk. It judges only when it is seated in the Chamber of Champions or the Ranked.
        </p>
        {session.user.role === "ADMIN" ? (
          <p className="mt-6">
            <Link href="/admin/judge" className="text-ocean">
              Open the desk
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  const progress = ballotProgressLine(queue.sealed, queue.sealed + queue.pending);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{COLLEGE_SEAT_LABEL[queue.college]}</p>
      {queue.college === "RANKED" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="stamp">Demo</span>
          <p className="text-sm text-ink/70">
            US$ {RANKED_BALLOT_USD} per ballot. {queue.rankedSealed} sealed ·{" "}
            {formatUsdAmount(queue.rankedSealed * RANKED_BALLOT_USD)} recorded. Nothing is paid.
          </p>
        </div>
      ) : null}
      <h1 className="mt-2 font-serif text-5xl">Judge</h1>
      <p className="mt-3 text-sm text-ink/70">{progress}</p>
      {queue.athlete ? <p className="mt-2 text-sm">{dutyStatusLine(queue.pending)}</p> : null}
      {query.sealed === "1" ? <p className="mt-4 text-sm text-ocean">Ballot sealed.</p> : null}
      {query.error === "1" ? (
        <p className="mt-4 text-sm text-stamp">That comparison was not recorded.</p>
      ) : null}

      {queue.ballot ? (
        <section className="mt-8">
          <div className={`grid gap-4 ${queue.ballot.comparisonVideoUrl ? "md:grid-cols-2" : ""}`}>
            <figure>
              <figcaption className="mb-2 text-xs uppercase tracking-wider text-ink/60">The wave drawn for you</figcaption>
              <div className="border border-line">
                <BlindWave
                  mediaHref={`/judge/media/${queue.ballot.id}/drawn`}
                  url={queue.ballot.drawnVideoUrl}
                  title="The wave drawn for you"
                />
              </div>
            </figure>
            {queue.ballot.comparisonVideoUrl ? (
              <figure>
                <figcaption className="mb-2 text-xs uppercase tracking-wider text-ink/60">This wave</figcaption>
                <div className="border border-line">
                  <BlindWave
                    mediaHref={`/judge/media/${queue.ballot.id}/board`}
                    url={queue.ballot.comparisonVideoUrl}
                    title="This wave"
                  />
                </div>
              </figure>
            ) : null}
          </div>

          {queue.ballot.comparisonVideoUrl ? (
            <div className="mt-8">
              <h2 className="text-center font-serif text-3xl md:text-4xl">Better or worse than this wave?</h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <form action={castComparison}>
                  <input type="hidden" name="ballotId" value={queue.ballot.id} />
                  <input type="hidden" name="comparison" value="better" />
                  <button className="min-h-16 w-full bg-ocean px-4 py-5 text-lg text-paper" type="submit">
                    Better
                  </button>
                </form>
                <form action={castComparison}>
                  <input type="hidden" name="ballotId" value={queue.ballot.id} />
                  <input type="hidden" name="comparison" value="worse" />
                  <button className="min-h-16 w-full border border-ocean bg-white px-4 py-5 text-lg" type="submit">
                    Worse
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form action={sealPlacement} className="mt-8">
              <p className="text-center font-serif text-3xl">Nothing on this board to compare.</p>
              <input type="hidden" name="ballotId" value={queue.ballot.id} />
              <button className="mt-6 min-h-16 w-full bg-ocean px-4 py-5 text-lg text-paper" type="submit">
                Seal placement
              </button>
            </form>
          )}
        </section>
      ) : (
        <p className="mt-10 border border-line bg-white px-4 py-6">This week&apos;s queue is complete.</p>
      )}

      <p className="mt-10 text-sm text-ink/60">{accuracyLine(queue.accuracy)}</p>
    </div>
  );
}
