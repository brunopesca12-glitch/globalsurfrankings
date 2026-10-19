import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { setJudgeNamePublic } from "@/app/actions/judge-home";
import { auth } from "@/lib/auth";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { entryWeekLabel } from "@/lib/season-clock";
import { meanAbsoluteDeviation } from "@/lib/tribunal";

export const metadata: Metadata = { title: "Judging history" };

export default async function JudgeHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const queue = await ensureWeeklyQueue(session.user.id);
  if (!queue.college) redirect("/judge");

  const [mine, shared] = await Promise.all([
    prisma.ballot.findMany({
      where: { userId: session.user.id, status: "SEALED" },
      orderBy: { sealedAt: "desc" },
      take: 40,
      select: {
        id: true,
        place: true,
        sealedAt: true,
        isoYear: true,
        isoWeek: true,
        entry: { select: { placement: { select: { place: true } } } },
      },
    }),
    prisma.ballot.findMany({
      where: {
        college: queue.college,
        status: "SEALED",
        place: { not: null },
        user: { judgeNamePublic: true },
        entry: { placement: { isNot: null } },
      },
      select: {
        userId: true,
        place: true,
        user: { select: { name: true } },
        entry: { select: { placement: { select: { place: true } } } },
      },
    }),
  ]);

  const board = new Map<string, { name: string; pairs: { ballotPlace: number; finalPlace: number }[] }>();
  for (const row of shared) {
    if (row.place == null || !row.entry.placement) continue;
    const current = board.get(row.userId) ?? { name: row.user.name, pairs: [] };
    current.pairs.push({ ballotPlace: row.place, finalPlace: row.entry.placement.place });
    board.set(row.userId, current);
  }
  const leaders = [...board.entries()]
    .map(([id, row]) => ({ id, name: row.name, mean: meanAbsoluteDeviation(row.pairs), ballots: row.pairs.length }))
    .filter((row) => row.mean != null)
    .sort((a, b) => a.mean! - b.mean! || b.ballots - a.ballots || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Your record</p>
      <h1 className="mt-2 font-serif text-5xl">History</h1>
      <p className="mt-3 text-sm text-ink/70">
        <Link href="/judge" className="text-ocean">
          Back to this week
        </Link>
      </p>

      <ul className="mt-8 divide-y divide-line border border-line bg-white">
        {mine.length === 0 ? <li className="px-4 py-4 text-sm text-ink/70">No sealed ballots yet.</li> : null}
        {mine.map((ballot) => {
          const monday = ballot.entry.placement?.place ?? null;
          const delta = ballot.place != null && monday != null ? Math.abs(ballot.place - monday) : null;
          return (
            <li key={ballot.id} className="px-4 py-3 text-sm">
              <p>
                {entryWeekLabel(ballot.isoYear, ballot.isoWeek, new Date())}
                {ballot.sealedAt ? ` · ${formatDate(ballot.sealedAt.toISOString().slice(0, 10))}` : ""}
              </p>
              <p className="text-ink/70">
                Your place {ballot.place ?? "—"}. Monday {monday ?? "not published"}.
                {delta != null ? ` Off by ${delta}.` : ""}
              </p>
            </li>
          );
        })}
      </ul>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">College list</h2>
        <p className="mt-2 text-sm text-ink/70">
          Names are opt-in. Lower deviation is closer to Monday. {queue.namePublic ? "Your name is on this list." : "Your name is hidden."}
        </p>
        <form action={setJudgeNamePublic} className="mt-3">
          <input type="hidden" name="public" value={queue.namePublic ? "no" : "yes"} />
          <button className="min-h-11 border border-ocean px-4 py-2 text-sm text-ocean" type="submit">
            {queue.namePublic ? "Hide my name" : "Show my name"}
          </button>
        </form>
        <ol className="mt-4 divide-y divide-line border border-line bg-white">
          {leaders.length === 0 ? <li className="px-4 py-4 text-sm text-ink/70">No one in this college has opted in yet.</li> : null}
          {leaders.map((row, index) => (
            <li key={row.id} className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
              <span>
                {index + 1}. {row.name}
              </span>
              <span className="text-ink/60">
                {row.mean?.toFixed(1)} · {row.ballots}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
