import type { Metadata } from "next";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { EDITIONS, FOUNDING, FOUNDING_WEEKS, POOL_TOLL_CENTS } from "@/lib/constitution";
import { formatDate, formatUsdAmount } from "@/lib/format";

export const metadata: Metadata = { title: "Purse" };

export default function PursePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="stamp">Demo</span>
        <p className="text-sm text-ink/70">A mirror of the published escrow. No money moves through the platform.</p>
      </div>
      <h1 className="mt-4 font-serif text-5xl">Affixed purse</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        The Founding Season runs from {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}, and the
        champions are crowned in {SEASON_2027.galaLabel}. Every dollar on this page goes to surfers and judges, and
        all of it is deposited into a public escrow before the season opens. This page orients that account. It does not hold it, collect it,
        or pay it.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          ["To surfers", formatUsdAmount(FOUNDING.seasonCompetitorUsd)],
          ["To judges", formatUsdAmount(FOUNDING.seasonJudgeUsd)],
        ].map(([label, value]) => (
          <article key={label} className="border border-line bg-white px-4 py-5">
            <p className="text-xs uppercase tracking-widest text-ink/55">{label}</p>
            <p className="mt-2 font-serif text-4xl">{value}</p>
          </article>
        ))}
      </section>
      <p className="mt-3 text-sm text-ink/65">
        Both funds are escrowed publicly before the season, and the balance stays visible all season. Wave-pool
        entries pay a US$ {POOL_TOLL_CENTS / 100} verification toll that passes whole to the judging fund. Ocean entry is
        free. This site does not collect either.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">How the {formatUsdAmount(FOUNDING.seasonCompetitorUsd)} is split</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Season tables · 53%", FOUNDING.seasonTableUsd],
            ["Weekly race · 36%", FOUNDING.weeklyUsd],
            ["World champions' fund · 11%", FOUNDING.overallUsd],
          ].map(([label, amount]) => (
            <li key={String(label)} className="border border-line px-4 py-4">
              <p className="text-sm text-ink/70">{label}</p>
              <p className="font-serif text-3xl">{formatUsdAmount(Number(amount))}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/65">
          The weekly race pays about {formatUsdAmount(FOUNDING.weeklyPerMondayUsd)} in checks every Monday across{" "}
          {FOUNDING_WEEKS} weeks: 28 weekly champions, one per division of each title. Each pool is split equally
          across the {FOUNDING.titles} titles and pro-rata to each division&apos;s field — every tribe funds its own
          flag, and fewer entrants means bigger prizes per head.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Judges&apos; fee</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["Chamber of Champions", FOUNDING.seasonChamberUsd],
            ["The Ranked", FOUNDING.seasonRankedUsd],
          ].map(([label, amount]) => (
            <li key={String(label)} className="border border-line px-4 py-4">
              <p className="text-sm text-ink/70">{label}</p>
              <p className="font-serif text-3xl">{formatUsdAmount(Number(amount))}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-2xl text-sm text-ink/65">
          The paid colleges are funded by the judges&apos; fund and the pool toll. Three of the five colleges cost
          nothing. Nothing here is paid.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Seven titles, four divisions</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Each title holds an equal share of the surfers&apos; purse, about{" "}
          {formatUsdAmount(Math.round(FOUNDING.titleCompetitorUsd))}, and runs all {FOUNDING_WEEKS} weeks. Your ten best results decide the season.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ul className="border border-line bg-white">
            {THEMES.map((theme) => (
              <li key={theme.slug} className="border-b border-line px-4 py-2 text-sm last:border-b-0">
                {theme.name}
              </li>
            ))}
          </ul>
          <ul className="border border-line bg-white">
            {EDITIONS.map((edition) => (
              <li key={edition.id} className="border-b border-line px-4 py-2 text-sm last:border-b-0">
                {edition.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 border border-line bg-foam px-5 py-6">
        <h2 className="font-serif text-3xl">The founding book, summed</h2>
        <ul className="mt-4 space-y-1 text-sm">
          <li>To surfers = {formatUsdAmount(FOUNDING.seasonCompetitorUsd)}</li>
          <li>To judges = {formatUsdAmount(FOUNDING.seasonJudgeUsd)}</li>
          <li>Pool tolls pass whole to the judging fund, on top of that.</li>
          <li>This site only points at those accounts.</li>
        </ul>
      </section>
    </div>
  );
}
