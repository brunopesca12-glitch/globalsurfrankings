import type { Metadata } from "next";
import { SEASON_2027 } from "@/lib/catalogue";
import {
  EDITIONS,
  FOUNDING,
  FOUNDING_POOL_ENTRIES,
  FOUNDING_THEME_COUNT,
  FOUNDING_WEEKS,
  PRINTED_BALLOT_PAY,
  PRINTED_CHAMPION_SEASON,
  PRINTED_EDITION_HEADLINES,
} from "@/lib/constitution";
import { formatDate, formatUsd, formatUsdAmount } from "@/lib/format";
import { foundingEditionTables } from "@/lib/payout";

export const metadata: Metadata = { title: "Purse" };

export default function PursePage() {
  const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
  const overallPoolCents = FOUNDING.overallUsd * FOUNDING_THEME_COUNT * 100;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="stamp">Demo</span>
        <p className="text-sm text-ink/70">
          A mirror of the published escrow. No money moves through the platform.
        </p>
      </div>
      <h1 className="mt-4 font-serif text-5xl">Affixed purse</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        The Founding Season runs from {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}. Sponsors
        deposit the surfers&apos; share at a custodian bank before that season opens. Competitors and judges are the
        beneficiaries, under the tables below. This page orients that account. It does not hold it, collect it, or pay
        it.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Theme ticket", formatUsdAmount(FOUNDING.ticketUsd)],
          ["Surfers · 84%", formatUsdAmount(FOUNDING.athleteUsd)],
          ["Platform · 16%", formatUsdAmount(FOUNDING.platformUsd)],
          ["Competitors · 78%", formatUsdAmount(FOUNDING.competitorUsd)],
          ["Judges · 6%", formatUsdAmount(FOUNDING.judgeUsd)],
          ["Pool toll · to judges", formatUsdAmount(POOL_TOLL_LABEL)],
        ].map(([label, value]) => (
          <article key={label} className="border border-line bg-white px-4 py-5">
            <p className="text-xs uppercase tracking-widest text-ink/55">{label}</p>
            <p className="mt-2 font-serif text-4xl">{value}</p>
          </article>
        ))}
      </section>
      <p className="mt-3 text-sm text-ink/65">
        84% still means &ldquo;to surfers&rdquo;: 78% prize money and 6% judges&apos; fees. The US${" "}
        {POOL_TOLL_LABEL} pool toll is collected only so it can be passed whole to the judging fund. This site does
        not collect it.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">How the {formatUsdAmount(FOUNDING.competitorUsd)} is split</h2>
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
          Six events: {formatUsdAmount(FOUNDING.seasonCompetitorUsd)} in prize money,{" "}
          {formatUsdAmount(FOUNDING.seasonJudgeUsd)} in judges&apos; fees, and{" "}
          {formatUsdAmount(FOUNDING.seasonPlatformUsd)} in commission. The printed weekly race is about{" "}
          {formatUsdAmount(FOUNDING.weeklyPerMondayUsd)} a Monday across {FOUNDING_WEEKS} weeks. The payment-order file
          uses every Monday from 1 March through 30 September, which is 31, and those shares still sum to the same
          season total.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Judges&apos; fee</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["Chamber of Champions · 3%", FOUNDING.chamberUsd],
            ["The Ranked · 3%", FOUNDING.rankedUsd],
          ].map(([label, amount]) => (
            <li key={String(label)} className="border border-line px-4 py-4">
              <p className="text-sm text-ink/70">{label}</p>
              <p className="font-serif text-3xl">{formatUsdAmount(Number(amount))}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-2xl text-sm text-ink/65">
          On the founding scenario the Chamber is about US$ {PRINTED_BALLOT_PAY.chamberUsd.toFixed(2)} a ballot, and
          The Ranked about US$ {PRINTED_BALLOT_PAY.rankedUsd.toFixed(2)}, once the pool toll is added to their 3%. The
          Ranked rate is capped at US$ {PRINTED_BALLOT_PAY.capUsd}. The platform may top that up and is never obliged
          to. Nothing here is paid.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Tables by edition</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          The season table ({formatUsdAmount(FOUNDING.seasonTableUsd)}) is shared across the eight editions by the
          founding field share. On a large field the podium six take 80% of an edition&apos;s table, on the curve 35 /
          20 / 14 / 12 / 10 / 9 — that is 28% to the winner and 7.2% to sixth. The paper rounds those cents to the
          dollar. A field of six or fewer returns the unused tail to the podium on the same curve.
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
          The top 20% of each edition is paid. Places after sixth split the remaining 20% equally, and none of them is
          paid more than sixth. Best Small Wave and ocean Best Air keep the same{" "}
          {formatUsdAmount(FOUNDING.athleteUsd)} purse; their season tables concentrate in the editions they run. A
          running season&apos;s tables stay fixed. The field that actually raced recalibrates only the next season.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Champions in the printed scenario</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Four event wins, the Overall in cash, and an estimate of weeklies — Annex B.2, not a projection from the
          waves in this database. Credits are the presenter&apos;s overlay, shown beside the cash and never added into
          it. The exact Overall fund, before the printed rounding, is the field share of {formatUsd(overallPoolCents)}.
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
                <th className="px-3 py-2">Credits</th>
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
                    <td className="px-3 py-2 text-ink/60">{formatUsdAmount(row.creditsUsd)}</td>
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
            Escrowed to surfers, 12 × {formatUsdAmount(FOUNDING.athleteUsd)} ={" "}
            {formatUsdAmount(FOUNDING.seasonAthleteUsd)}
          </li>
          <li>
            Of which prize money, 12 × {formatUsdAmount(FOUNDING.competitorUsd)} ={" "}
            {formatUsdAmount(FOUNDING.seasonCompetitorUsd)}
          </li>
          <li>
            Of which judges&apos; fees, 12 × {formatUsdAmount(FOUNDING.judgeUsd)} ={" "}
            {formatUsdAmount(FOUNDING.seasonJudgeUsd)}
          </li>
          <li>
            Platform, 12 × {formatUsdAmount(FOUNDING.platformUsd)} = {formatUsdAmount(FOUNDING.seasonPlatformUsd)}
          </li>
          <li>Book in cash = {formatUsdAmount(FOUNDING.seasonBookCashUsd)}</li>
          <li>Presenter face, in credits = {formatUsdAmount(FOUNDING.presenterFaceUsd)}</li>
          <li>
            Pool tolls, {FOUNDING_POOL_ENTRIES.toLocaleString("en-US")} × US$ 20 ={" "}
            {formatUsdAmount(FOUNDING.poolTollUsd)}, passed whole to the judges
          </li>
          <li>
            The published scenario moves {formatUsdAmount(7_050_000)}. This site only points at those accounts.
          </li>
        </ul>
      </section>
    </div>
  );
}

const POOL_TOLL_LABEL = 20;
