import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BinaryInsert, DirectPlaceForm } from "@/components/BinaryInsert";
import { DutyForm } from "@/components/DutyForm";
import { auth } from "@/lib/auth";
import { CATEGORY_LABEL } from "@/lib/category";
import { prisma } from "@/lib/db";
import { sexLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Desk" };

export default async function JudgingPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">Desk only</h1>
        <p className="mt-4">This account does not publish placements.</p>
      </div>
    );
  }

  const pending = await prisma.entry.findMany({
    where: { status: "SUBMITTED" },
    include: { athlete: true, theme: true },
    orderBy: { createdAt: "asc" },
  });
  const athletes = await prisma.athlete.findMany({ orderBy: { displayName: "asc" } });

  const boards = new Map<string, { name: string; place: number }[]>();
  for (const entry of pending) {
    const key = `${entry.themeId}:${entry.category}:${entry.sex}`;
    if (boards.has(key)) continue;
    const placed = await prisma.placement.findMany({
      where: { board: { themeId: entry.themeId, category: entry.category, sex: entry.sex } },
      include: { athlete: true },
      orderBy: { place: "asc" },
    });
    boards.set(
      key,
      placed.map((row) => ({ name: row.athlete.displayName, place: row.place })),
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Judging stub</p>
      <h1 className="mt-2 font-serif text-5xl">Desk</h1>
      <p className="mt-4 max-w-2xl text-ink/75">
        A wave does not receive a score. It receives a place, by direct comparison — binary insertion on the edition board.
        The five colleges do not vote in this version: the desk publishes the order. Judging duty is a flag, not a drawn
        queue.
      </p>

      <section className="mt-10 space-y-8">
        <h2 className="font-serif text-3xl">Waves without a place</h2>
        {pending.length === 0 ? <p className="text-sm text-ink/60">Nothing in the queue.</p> : null}
        {pending.map((entry) => {
          const key = `${entry.themeId}:${entry.category}:${entry.sex}`;
          const board = boards.get(key) ?? [];
          const places =
            board.length === 1 ? "board with 1 place" : `board with ${board.length} places`;
          return (
            <article key={entry.id} className="border border-line bg-foam/40 p-4">
              <h3 className="text-lg">{entry.athlete.displayName}</h3>
              <p className="text-sm text-ink/70">
                {entry.theme.name} · {CATEGORY_LABEL[entry.category]} · {sexLabel(entry.sex)} · {places}
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <BinaryInsert entryId={entry.id} athlete={entry.athlete.displayName} board={board} />
                <div>
                  <p className="text-sm text-ink/70">Desk shortcut: the same act of inserting at a place.</p>
                  <div className="mt-2">
                    <DirectPlaceForm entryId={entry.id} maxPlace={board.length + 1} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Judging duty</h2>
        <ul className="mt-4 divide-y divide-line border border-line bg-white">
          {athletes.map((athlete) => (
            <li key={athlete.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
              <span>
                {athlete.displayName}
                <span className="ml-2 text-xs uppercase tracking-wider text-ink/50">
                  {athlete.judgingDutyCurrent ? "current" : "overdue"}
                </span>
              </span>
              <DutyForm athleteId={athlete.id} current={athlete.judgingDutyCurrent} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
