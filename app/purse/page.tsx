import type { Metadata } from "next";
import {
  EDITIONS,
  FOUNDING,
  FOUNDING_POOL_ENTRIES,
  FOUNDING_THEME_COUNT,
  PRINTED_CHAMPION_SEASON,
  PRINTED_EDITION_HEADLINES,
} from "@/lib/constitution";
import { formatUsd, formatUsdAmount } from "@/lib/format";
import { foundingEditionTables } from "@/lib/payout";

export const metadata: Metadata = { title: "Purse" };

export default function PursePage() {
  const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
  const overallPoolCents = FOUNDING.overallUsd * FOUNDING_THEME_COUNT * 100;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="stamp">Demo</span>
        <p className="text-sm text-ink/70">No figure on this page is money. There is no charge, no escrow, and no payout.</p>
      </div>
      <h1 className="mt-4 font-serif text-5xl">Affixed purse</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        A demonstration mirror of the arithmetic published in the founding edition. The application does not increment
        balances: when escrow exists, the number on screen will be a reading of the statement. Until then, what you see is
        the law.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Theme ticket", formatUsdAmount(FOUNDING.ticketUsd)],
          ["Athletes · 84%", formatUsdAmount(FOUNDING.athleteUsd)],
          ["Platform · 16%", formatUsdAmount(FOUNDING.platformUsd)],
        ].map(([label, value]) => (
          <article key={label} className="border border-line bg-white px-4 py-5">
            <p className="text-xs uppercase tracking-widest text-ink/55">{label}</p>
            <p className="mt-2 font-serif text-4xl">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">How the {formatUsdAmount(FOUNDING.athleteUsd)} is split</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Season tables", FOUNDING.seasonTableUsd],
            ["Weekly race", FOUNDING.weeklyUsd],
            ["Champions' fund", FOUNDING.overallUsd],
          ].map(([label, amount]) => (
            <li key={String(label)} className="border border-line px-4 py-4">
              <p className="text-sm text-ink/70">{label}</p>
              <p className="font-serif text-3xl">{formatUsdAmount(Number(amount))}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/65">
          Twelve themes: {formatUsdAmount(FOUNDING.seasonAthleteUsd)} in purses and{" "}
          {formatUsdAmount(FOUNDING.seasonPlatformUsd)} in commission. The weekly race is about{" "}
          {formatUsd(Math.round(FOUNDING.weeklyPerMondayUsd * 100))} each Monday, if the year has 52 Mondays.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Tables by edition</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          The season table ({formatUsdAmount(FOUNDING.seasonTableUsd)}) is shared across the eight editions by the founding
          field share. The exact curve of the first six places is 35 / 20 / 14 / 12 / 10 / 9. v9 prints some of those
          dollars rounded; this page uses the column of the law.
        </p>
        <div className="mt-4 overflow-x-auto border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-3 py-2">Edition</th>
                <th className="px-3 py-2">Share</th>
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">Exact 1st</th>
                <th className="px-3 py-2">Exact 6th</th>
                <th className="px-3 py-2">Printed 1st</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => {
                const printed = PRINTED_EDITION_HEADLINES[table.id];
                return (
                  <tr key={table.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">{table.label}</td>
                    <td className="px-3 py-2">{table.shareBps / 100}%</td>
                    <td className="px-3 py-2">{formatUsd(table.seasonTableCents)}</td>
                    <td className="px-3 py-2">{formatUsd(table.winnerCents)}</td>
                    <td className="px-3 py-2">{formatUsd(table.sixthCents)}</td>
                    <td className="px-3 py-2 text-ink/60">{formatUsdAmount(printed.winnerUsd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink/65">
          The top 20% of each edition is paid. With six places, the curve above is the whole law. With more places, the
          rest shares a tail weight and the vector sums to 100% again. A real season&apos;s tables are fixed at the opening;
          the field that actually raced recalibrates only the next season.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Champions in the printed scenario</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Four event wins, the Overall in cash, and an estimate of weeklies — the Annex B.2 figures, not a projection from
          the waves in this database. The exact Overall fund, before the printed rounding, is the field share of{" "}
          {formatUsd(overallPoolCents)}.
        </p>
        <div className="mt-4 overflow-x-auto border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-3 py-2">Champion</th>
                <th className="px-3 py-2">4 events</th>
                <th className="px-3 py-2">Overall</th>
                <th className="px-3 py-2">Weeklies</th>
                <th className="px-3 py-2">Cash</th>
              </tr>
            </thead>
            <tbody>
              {EDITIONS.map((edition) => {
                const row = PRINTED_CHAMPION_SEASON[edition.id];
                return (
                  <tr key={edition.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">{edition.label}</td>
                    <td className="px-3 py-2">{formatUsdAmount(row.eventWinsUsd)}</td>
                    <td className="px-3 py-2">{formatUsdAmount(row.overallUsd)}</td>
                    <td className="px-3 py-2">{formatUsdAmount(row.weekliesUsd)}</td>
                    <td className="px-3 py-2">{formatUsdAmount(row.totalCashUsd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 border border-line bg-foam px-5 py-6">
        <h2 className="font-serif text-3xl">The founding book, summed</h2>
        <ul className="mt-4 space-y-1 text-sm">
          <li>
            Affixed purses, 12 × {formatUsdAmount(FOUNDING.athleteUsd)} = {formatUsdAmount(FOUNDING.seasonAthleteUsd)}
          </li>
          <li>
            Platform, 12 × {formatUsdAmount(FOUNDING.platformUsd)} = {formatUsdAmount(FOUNDING.seasonPlatformUsd)}
          </li>
          <li>Book in cash = {formatUsdAmount(FOUNDING.seasonBookCashUsd)}</li>
          <li>Presenter face, in credits = {formatUsdAmount(FOUNDING.presenterFaceUsd)}</li>
          <li>
            Pool tolls, {FOUNDING_POOL_ENTRIES.toLocaleString("en-US")} × US$ 20 = {formatUsdAmount(FOUNDING.poolTollUsd)}
          </li>
          <li>
            The system moves {formatUsdAmount(7_050_000)} in that scenario. It remains an account, not a cash drawer.
          </li>
        </ul>
      </section>
    </div>
  );
}
