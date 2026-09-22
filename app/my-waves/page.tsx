import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CATEGORY_LABEL } from "@/lib/category";
import { getAthleteByUser } from "@/lib/data";
import { environmentLabel, formatUsd, ordinal } from "@/lib/format";

export const metadata: Metadata = { title: "My waves" };

export default async function MyEntriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const athlete = await getAthleteByUser(session.user.id);
  if (!athlete) redirect("/profile");

  const count =
    athlete.entries.length === 0
      ? "No waves yet."
      : athlete.entries.length === 1
        ? "One entry."
        : `${athlete.entries.length} entries.`;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-5xl">My waves</h1>
      <p className="mt-3 text-sm text-ink/70">
        {count}{" "}
        <Link href="/enter" className="text-ocean">
          Enter a wave
        </Link>
      </p>
      <ul className="mt-8 space-y-3">
        {athlete.entries.map((entry) => (
          <li key={entry.id} className="border border-line bg-white px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg">
                <Link
                  href={`/board/${entry.theme.slug}?category=${entry.category}&sex=${athlete.sex}`}
                  className="hover:text-ocean"
                >
                  {entry.theme.name}
                </Link>
              </h2>
              <p className="font-serif text-3xl">{entry.placement ? ordinal(entry.placement.place) : "—"}</p>
            </div>
            <p className="mt-1 text-sm text-ink/70">
              {CATEGORY_LABEL[entry.category]} · {environmentLabel(entry.environment)} · {entry.isoYear}-W
              {String(entry.isoWeek).padStart(2, "0")} ·{" "}
              {entry.tollCents === 0 ? "no toll" : `${formatUsd(entry.tollCents)} DEMO, not charged`}
              {entry.spot ? ` · ${entry.spot}` : ""}
            </p>
            <p className="mt-1 text-sm">
              {entry.placement ? "Placement published." : "Waiting for Monday's liturgy."}{" "}
              <a className="text-ocean" href={entry.videoUrl}>
                video
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
