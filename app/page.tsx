import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { EDITIONS } from "@/lib/constitution";
import { getHomeRankings, type RankingRow } from "@/lib/data";
import { formatDate, formatPoints } from "@/lib/format";
import { MONEY_BLANK } from "@/lib/prize";
import { circuitClock } from "@/lib/season-clock";

export default async function HomePage() {
  const board = await loadBoard();
  const clock = circuitClock(new Date());

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">
            Founding Season · {formatDate(SEASON_2027.startsOn)} – {formatDate(SEASON_2027.endsOn)}
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">World rankings</h1>
        </div>
        <div className="max-w-xs text-sm leading-relaxed text-ink/70">
          <p>
            {clock.headline}. {clock.detail}{" "}
            {board ? `${board.wavesThisWeek} ${board.wavesThisWeek === 1 ? "wave" : "waves"} in the calendar week.` : ""}
          </p>
          <p className="mt-2">
            <Link href="/about" className="text-ocean">
              How the circuit works
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {EDITIONS.map((edition) => {
          const rows = topRows(board?.editions.get(`${edition.category}:${edition.sex}`), 3);
          return (
            <section key={edition.id} className="border border-line bg-white">
              <h2 className="border-b border-line px-3 py-2 font-serif text-xl">
                <Link href={`/ranking#${edition.id}`} className="hover:text-ocean">
                  {edition.label}
                </Link>
              </h2>
              {rows.length === 0 ? (
                <p className="px-3 py-4 text-sm text-ink/55">No places yet.</p>
              ) : (
                <ol>
                  {rows.map((row, index) => (
                    <li key={row.athleteId} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="mr-2 font-serif text-lg">{index + 1}</span>
                        <Link href={`/athlete/${row.slug}`} className="hover:text-ocean">
                          {row.displayName}
                        </Link>
                      </span>
                      <span className="shrink-0 text-ink/70">{formatPoints(row.points)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-4xl">Seven titles</h2>
          <Link href="/ranking" className="text-sm text-ocean">
            Season points
          </Link>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75">
          The ranking is season points. Prize money stays on the table and stays blank until a sponsor is affixed.
          Nothing here is a cash prize.
        </p>
        <div className="mt-6 overflow-x-auto border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Season closes</th>
                <th className="px-3 py-2">Prize money</th>
              </tr>
            </thead>
            <tbody>
              {THEMES.map((theme) => (
                <tr key={theme.slug} className="border-b border-line last:border-b-0">
                  <td className="px-3 py-2">
                    <Link href={`/board/${theme.slug}`} className="hover:text-ocean">
                      {theme.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink/70">{formatDate(theme.finaleOn)}</td>
                  <td className="px-3 py-2">{MONEY_BLANK}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink/60">
          Seven titles, four divisions, 28 weekly champions. Your ten best results decide the season.
        </p>
      </section>
    </div>
  );
}

function topRows(bucket: Map<string, RankingRow> | undefined, count: number): RankingRow[] {
  if (!bucket) return [];
  return [...bucket.values()]
    .sort((a, b) => b.points - a.points || a.displayName.localeCompare(b.displayName, "en"))
    .slice(0, count);
}

async function loadBoard() {
  try {
    return await getHomeRankings();
  } catch {
    return null;
  }
}
