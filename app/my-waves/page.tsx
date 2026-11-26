import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { worldBoardHref } from "@/lib/board-link";
import { themeBySlug } from "@/lib/catalogue";
import { CATEGORY_LABEL } from "@/lib/category";
import { getAthleteByUser, getSeasonRankings, pointsForAthlete } from "@/lib/data";
import { environmentLabel, formatPoints, formatUsd, ordinal } from "@/lib/format";
import { poolFeeCents } from "@/lib/pool-fee";
import { MONEY_BLANK } from "@/lib/prize";
import { entryWeekLabel } from "@/lib/season-clock";
import { submissionStatus } from "@/lib/submission-check";

export const metadata: Metadata = { title: "My waves" };

export default async function MyEntriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const athlete = await getAthleteByUser(session.user.id);
  if (!athlete) redirect("/profile");

  const points = pointsForAthlete(await getSeasonRankings(), athlete.id);
  const feeOn = poolFeeCents() > 0;
  const count =
    athlete.entries.length === 0
      ? "No waves yet."
      : athlete.entries.length === 1
        ? "One entry."
        : `${athlete.entries.length} entries.`;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-5xl">My waves</h1>
      <p className="mt-3 text-sm text-ink/70">{count}</p>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
        {[
          ["Season points", formatPoints(points)],
          ["Season prize money", MONEY_BLANK],
          ["Career earnings", MONEY_BLANK],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-white px-3 py-3">
            <dt className="text-xs uppercase tracking-wider text-ink/55">{label}</dt>
            <dd className="mt-1 font-serif text-2xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3">
        <Link href="/enter" className="text-ocean">
          Enter a wave
        </Link>
      </p>
      <ul className="mt-8 space-y-3">
        {athlete.entries.map((entry) => {
          const status = submissionStatus(entry);
          return (
          <li key={entry.id} className="border border-line bg-white px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg">
                <Link
                  href={worldBoardHref(entry.theme.slug, entry.category, athlete.sex)}
                  className="hover:text-ocean"
                >
                  {themeBySlug(entry.theme.slug)?.name ?? entry.theme.name}
                </Link>
              </h2>
              <p className={entry.placement ? "font-serif text-3xl" : "text-sm text-ink/60"}>
                {entry.placement ? ordinal(entry.placement.place) : "Not placed yet"}
              </p>
            </div>
            <p className="mt-1 text-sm text-ink/70">
              {CATEGORY_LABEL[entry.category]} · {environmentLabel(entry.environment)} ·{" "}
              {entryWeekLabel(entry.isoYear, entry.isoWeek, new Date())} ·{" "}
              {feeOn && entry.tollCents > 0 ? formatUsd(entry.tollCents) : "Free"}
              {entry.spot ? ` · ${entry.spot}` : ""}
            </p>
            <p className="mt-2 text-sm">
              <span className="border border-line px-2 py-0.5 text-xs uppercase tracking-wider text-ink/70">
                {status.label}
              </span>
              {status.note ? <span className="ml-2 text-ink/70">{status.note}</span> : null}
            </p>
            <p className="mt-1 text-sm">
              {entry.placement ? "Placement published." : "Results come out on Monday."}{" "}
              <Link className="text-ocean" href={`/videos/${entry.id}`}>
                Watch
              </Link>
            </p>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
