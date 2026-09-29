import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { runVerdict, seatJudge } from "@/app/actions/judging";
import { auth } from "@/lib/auth";
import { getDeskOverview } from "@/lib/desk";
import { formatDate } from "@/lib/format";
import { COLLEGE_SEAT_LABEL } from "@/lib/tribunal";

export const metadata: Metadata = { title: "Desk" };

export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; placed?: string; held?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">Desk only</h1>
        <p className="mt-4">This account does not seat the colleges.</p>
      </div>
    );
  }

  const query = await searchParams;
  const desk = await getDeskOverview();
  const placed = Number(query.placed);
  const held = Number(query.held);
  const ran = Number.isInteger(placed) && Number.isInteger(held) && query.placed != null && query.held != null;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Desk</p>
      <h1 className="mt-2 font-serif text-5xl">Colleges</h1>
      <p className="mt-4 max-w-2xl text-ink/75">
        Seat the Chamber of Champions and the Ranked. Athletes, the Upper Chamber, and the Public sit on their own. A
        wave is placed when you run Monday&apos;s verdict: the median of the colleges that reached three ballots.
      </p>
      {query.saved === "1" ? <p className="mt-4 text-sm text-ocean">Seat updated.</p> : null}
      {query.error === "seat" ? <p className="mt-4 text-sm text-stamp">That seat could not be saved.</p> : null}
      {query.error === "verdict" ? <p className="mt-4 text-sm text-stamp">Monday&apos;s verdict did not run.</p> : null}
      {ran ? (
        <p className="mt-4 text-sm text-ocean">
          Monday&apos;s verdict placed {placed} and held {held}.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Monday verdict</h2>
        <p className="mt-2 text-sm text-ink/70">
          {desk.waiting === 1 ? "1 wave is waiting." : `${desk.waiting} waves are waiting.`} An entry is held when its
          athlete still has open ballots for that week, or when every college is short of three ballots.
        </p>
        <form action={runVerdict} className="mt-4">
          <button className="bg-ocean px-4 py-3 text-paper" type="submit">
            Run Monday verdict
          </button>
        </form>
        {desk.runs.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-ink/70">
            {desk.runs.map((run) => (
              <li key={run.id}>
                {formatDate(run.createdAt.toISOString().slice(0, 10))} · placed {run.placed} · held {run.held}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Seats</h2>
        <ul className="mt-4 divide-y divide-line border border-line bg-white">
          {desk.people.map((person) => (
            <li key={person.userId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
              <div>
                <p>{person.name}</p>
                <p className="text-xs text-ink/55">
                  {person.email}
                  <span className="mx-2 text-ink/30">·</span>
                  {person.college ? COLLEGE_SEAT_LABEL[person.college] : "No college"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={seatJudge}>
                  <input type="hidden" name="userId" value={person.userId} />
                  <input type="hidden" name="college" value="CHAMBER" />
                  <input type="hidden" name="seated" value={person.chamber ? "no" : "yes"} />
                  <button className="border border-line px-2 py-1 text-sm" type="submit">
                    {person.chamber ? "Remove from Chamber" : "Seat in Chamber"}
                  </button>
                </form>
                <form action={seatJudge}>
                  <input type="hidden" name="userId" value={person.userId} />
                  <input type="hidden" name="college" value="RANKED" />
                  <input type="hidden" name="seated" value={person.ranked ? "no" : "yes"} />
                  <button className="border border-line px-2 py-1 text-sm" type="submit">
                    {person.ranked ? "Remove from Ranked" : "Seat in Ranked"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
