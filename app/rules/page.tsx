import type { Metadata } from "next";
import Link from "next/link";
import { FUTURE_THEMES, SEASON_2027, THEMES } from "@/lib/catalogue";
import { FOUNDING } from "@/lib/constitution";
import { formatDate, formatUsdAmount } from "@/lib/format";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Protocol</p>
      <h1 className="mt-2 font-serif text-5xl">The rules execute themselves.</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/80">
        GSR runs the competition and publishes the payment orders. The rules are public. Every Monday the prior
        week&apos;s file is published. At the end of the season the annual file is published. No one at the desk types
        an amount. Surfers enter waves. Judges place them. A separate bot, outside this site, sends USDC on the
        blockchain to the wallet on the profile.
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Season 1</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}. Six events. Each one is a board that
          stays open until its finale.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {THEMES.map((theme) => (
            <li key={theme.slug}>
              {theme.name}
              {theme.note ? <span className="text-ink/60"> — {theme.note}</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Place, then pay</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          A wave does not get a score. A judge drops it into their own list, best at #1. Three sealed places from a
          panel make that panel&apos;s place: the middle one. The wave&apos;s place is the middle of the panels that
          reached three. An even split resolves toward the Champions panel. Below three, a panel abstains.
        </p>
        <p className="mt-3 leading-relaxed text-ink/80">
          You never place your own event, or a declared clubmate&apos;s. The screen does not show the surfer.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">The split</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          Each event is a ticket of {formatUsdAmount(FOUNDING.ticketUsd)}. Of every dollar: 78% to athletes, 6% to
          judges, 16% to the platform. Season 1 is six tickets, {formatUsdAmount(FOUNDING.seasonBookCashUsd)} in all.
          The 78% splits into the season table, the weekly race, and the world champions&apos; fund. The 6% is shared by
          the Champions panel and the pro tour panel.
        </p>
        <p className="mt-3 leading-relaxed text-ink/80">
          A place maps to an amount by the published curve. The top fifth of a board is paid. On a large field the
          first six places take 80% of that edition&apos;s table, on 35 / 20 / 14 / 12 / 10 / 9. Places after sixth
          share the rest equally, and none is paid more than sixth. Event points use 100 / 60 / 45 / 35 / 28 / 22 on
          the podium, then 12% through the top fifth, then 4% to every other entrant. The winner&apos;s base is 100 ×
          √(S/100).
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">When USDC moves</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          This site does not send USDC. It publishes a payment order: the period, the event and board, the place, the
          wallet and network, the USDC amount, the split, the rule, and a status. The same orders are listed on the
          escrow page and at /api/payment-orders, one file per week and one for the season. Each file has a content
          hash anyone can recompute.
        </p>
        <p className="mt-3 leading-relaxed text-ink/80">
          Every Monday&apos;s file covers the prior week: weekly race money for that week&apos;s places, and the
          judges&apos; share for Champions and pro tour ballots sealed that week. The season file covers the season
          tables and the world champions&apos; fund, and it is meant to be paid at season close. The only destination
          is the USDC address on the profile — Ethereum, Solana, or another USDC network. A profile without one keeps
          that order waiting. The bot that pays is not in this codebase. Until a contract address is public, the escrow
          page has no transaction hashes.
        </p>
        <p className="mt-3">
          <Link href="/escrow" className="text-ocean">
            See the escrow
          </Link>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Coming in future seasons</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {FUTURE_THEMES.map((name) => (
            <li key={name} className="border border-line px-3 py-2 text-ink/70">
              {name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
