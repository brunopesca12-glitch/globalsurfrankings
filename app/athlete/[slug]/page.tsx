import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { worldBoardHref } from "@/lib/board-link";
import { SEASON_2027, themeBySlug } from "@/lib/catalogue";
import { CATEGORY_LABEL, categoryFor, parseDateOnly } from "@/lib/category";
import { getPublicAthlete, getSeasonRankings, pointsForAthlete } from "@/lib/data";
import { formatPoints, ordinal, sexLabel, verificationLabel } from "@/lib/format";
import { MONEY_BLANK } from "@/lib/prize";

export const metadata: Metadata = { title: "Athlete" };

export default async function AthletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const athlete = await getPublicAthlete(slug);
  if (!athlete) notFound();
  const category = categoryFor(athlete.birthDate, parseDateOnly(SEASON_2027.ageAsOf)!);
  const points = pointsForAthlete(await getSeasonRankings(), athlete.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{verificationLabel(athlete.verification)}</p>
      <h1 className="mt-2 font-serif text-5xl">{athlete.displayName}</h1>
      <p className="mt-3 text-ink/75">
        {CATEGORY_LABEL[category]} · {sexLabel(athlete.sex)}
        {athlete.city ? ` · ${athlete.city}` : ""}
        {athlete.country ? ` · ${athlete.country}` : ""}
        {athlete.club ? ` · ${athlete.club}` : ""}
      </p>
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
      {athlete.bio ? <p className="mt-4 max-w-xl">{athlete.bio}</p> : null}
      {athlete.hashtags.length > 0 ? (
        <p className="mt-4 flex flex-wrap gap-2 text-sm">
          {athlete.hashtags.map((tag) => (
            <Link key={tag} href={`/hashboards/${tag}`} className="border border-line px-2 py-1 hover:border-ocean">
              #{tag}
            </Link>
          ))}
        </p>
      ) : null}
      <h2 className="mt-10 font-serif text-3xl">Placements</h2>
      <ul className="mt-4 space-y-2">
        {athlete.entries.length === 0 ? (
          <li className="text-sm text-ink/60">No published place yet.</li>
        ) : (
          athlete.entries.map((entry) => (
            <li key={entry.id} className="border border-line bg-white px-3 py-3 text-sm">
              <Link
                href={worldBoardHref(entry.theme.slug, entry.category, athlete.sex)}
                className="hover:text-ocean"
              >
                {entry.placement ? `${ordinal(entry.placement.place)} · ` : ""}
                {themeBySlug(entry.theme.slug)?.name ?? entry.theme.name}
              </Link>
              <span className="text-ink/60"> · {CATEGORY_LABEL[entry.category]}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
