import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { EDITIONS, FOUNDING } from "@/lib/constitution";
import { getHomeRankings, type RankingRow } from "@/lib/data";
import { formatDate, formatPoints, formatUsdAmount } from "@/lib/format";

export default async function HomePage() {
  const board = await loadBoard();
  const weekLabel = board
    ? `${board.week.isoYear}-W${String(board.week.isoWeek).padStart(2, "0")}`
    : null;

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
          {weekLabel ? (
            <p>
              This week {weekLabel}. {board?.wavesThisWeek ?? 0}{" "}
              {board?.wavesThisWeek === 1 ? "wave" : "waves"} entered. Verdicts publish Monday.
            </p>
          ) : (
            <p>This week&apos;s count is unavailable. Verdicts publish Monday.</p>
          )}
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
          <h2 className="font-serif text-4xl">Purses on the door</h2>
          <Link href="/purse" className="text-sm text-ocean">
            Full purse
          </Link>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/75">
          Each theme escrows {formatUsdAmount(FOUNDING.athleteUsd)} to surfers before the season opens —{" "}
          {formatUsdAmount(FOUNDING.competitorUsd)} in prize money and {formatUsdAmount(FOUNDING.judgeUsd)} to the
          judges. This list mirrors that account. No money moves through the platform.
        </p>
        <div className="mt-6 overflow-x-auto border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-3 py-2">Theme</th>
                <th className="px-3 py-2">Finale</th>
                <th className="px-3 py-2">To surfers</th>
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
                  <td className="px-3 py-2">{formatUsdAmount(FOUNDING.athleteUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink/60">
          Twelve themes, {formatUsdAmount(FOUNDING.seasonAthleteUsd)} escrowed to surfers. About{" "}
          {formatUsdAmount(FOUNDING.weeklyPerMondayUsd)} in weekly checks each Monday of the Founding Season.
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
