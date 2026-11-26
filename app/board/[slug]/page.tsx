import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readBoardDivision } from "@/lib/board-link";
import { MONEY_BLANK } from "@/lib/prize";
import { themeBySlug } from "@/lib/catalogue";
import { CATEGORY_CODES, CATEGORY_LABEL } from "@/lib/category";
import { getEditionBoard } from "@/lib/data";
import { CollegeVerdictLine } from "@/components/CollegeVerdict";
import { environmentLabel, formatDate, formatPoints, sexLabel, verificationLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Board" };

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; sex?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const catalogue = themeBySlug(slug);
  if (!catalogue) notFound();

  const division = readBoardDivision(query.category, query.sex);
  const category = division.category;
  const sex = division.sex;
  const board = await getEditionBoard(slug, category, sex);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">World board · ordinal placement</p>
      <h1 className="mt-2 font-serif text-5xl">{catalogue.name}</h1>
      <p className="mt-2 text-ink/70">
        Season closes {formatDate(catalogue.finaleOn)}
        {catalogue.proposedDate ? " · proposed date" : ""}
      </p>
      {catalogue.note ? <p className="mt-3 max-w-2xl text-sm text-ink/75">{catalogue.note}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {catalogue.categories.map((item) => (
          <Link
            key={item}
            href={`/board/${slug}?category=${item}&sex=${sex}`}
            className={`border px-3 py-1 ${item === category ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {CATEGORY_LABEL[item]}
          </Link>
        ))}
        {(["M", "W"] as const).map((item) => (
          <Link
            key={item}
            href={`/board/${slug}?category=${category}&sex=${item}`}
            className={`border px-3 py-1 ${item === sex ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {sexLabel(item)}
          </Link>
        ))}
      </div>

      {!board ? (
        <p className="mt-10 border border-line bg-white px-4 py-6">
          This title is not in the database yet. Run the migration and the seed to see the board.
        </p>
      ) : (
        <>
          <p className="mt-8 text-sm text-ink/70">
            N = {board.placedAthletes} athletes placed · {CATEGORY_LABEL[category]} · {sexLabel(sex)}. Points use S ={" "}
            {board.entrants} waves entered, base × √(S/100), until the season closes. Monday results publish the places.
          </p>
          {board.placed.length === 0 && board.pending.length === 0 ? (
            <p className="mt-8 border border-line bg-white px-4 py-6 text-sm text-ink/60">
              No place yet.{" "}
              <Link href="/enter" className="text-ocean">
                Enter a wave
              </Link>
            </p>
          ) : board.placed.length > 0 ? (
          <div className="mt-4 overflow-x-auto border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="px-3 py-2">Place</th>
                  <th className="px-3 py-2">Athlete</th>
                  <th className="px-3 py-2">Points</th>
                  <th className="px-3 py-2">Prize</th>
                  <th className="px-3 py-2">Wave</th>
                </tr>
              </thead>
              <tbody>
                {board.placed.map((row) => (
                    <tr key={row.entryId} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-3 font-serif text-2xl">{row.place}</td>
                      <td className="px-3 py-3">
                        <Link href={`/athlete/${row.athlete.slug}`} className="hover:text-ocean">
                          {row.athlete.displayName}
                        </Link>
                        <span className="mt-1 block text-xs uppercase tracking-wider text-ink/55">
                          {verificationLabel(row.athlete.verification)}
                          {row.athlete.city ? ` · ${row.athlete.city}` : ""}
                        </span>
                        <CollegeVerdictLine verdicts={row.verdicts} finalPlace={row.place} />
                      </td>
                      <td className="px-3 py-3">{formatPoints(row.points)}</td>
                      <td className="px-3 py-3">{MONEY_BLANK}</td>
                      <td className="px-3 py-3">
                        <span className="block">{environmentLabel(row.environment)}</span>
                        <span className="text-ink/60">{row.spot}</span>
                        <Link href={`/videos/${row.entryId}`} className="mt-1 block text-ocean">
                          Watch
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          ) : null}
          {board.pending.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-serif text-2xl">No place yet</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {board.pending.map((entry) => (
                  <li key={entry.id} className="border border-line bg-white px-3 py-2">
                    {entry.athlete.displayName} · {environmentLabel(entry.environment)}
                    {entry.spot ? ` · ${entry.spot}` : ""} ·{" "}
                    <Link href={`/videos/${entry.id}`} className="text-ocean">
                      Watch
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
      <p className="mt-8 text-sm text-ink/60">
        <Link href="/hashboards" className="text-ocean">Hashboards</Link> renumber this board by hashtag without a new
        judgment. <Link href="/videos" className="text-ocean">Videos</Link> plays the waves. Catalogue editions:{" "}
        {CATEGORY_CODES.length} categories, each for men and for women.
      </p>
    </div>
  );
}
