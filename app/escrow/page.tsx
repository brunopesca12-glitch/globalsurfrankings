import type { Metadata } from "next";
import Link from "next/link";
import { ESCROW_MIRROR } from "@/lib/escrow";
import { formatUsdAmount } from "@/lib/format";

export const metadata: Metadata = { title: "Escrow" };

export default function EscrowPage() {
  const mirror = ESCROW_MIRROR;
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <span className="stamp">Demo</span>
        <p className="text-sm text-ink/70">No contract is deployed. No USDC has moved.</p>
      </div>
      <h1 className="mt-4 font-serif text-5xl">Escrow</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
        The funding account holds Season 1. Monday pays the week before. The season pays the annual awards. This page
        is the mirror.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["USDC balance", formatUsdAmount(mirror.balanceUsd)],
          ["Committed", formatUsdAmount(mirror.committedUsd)],
          ["Paid", formatUsdAmount(mirror.paidUsd)],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-white px-4 py-4">
            <dt className="text-xs uppercase tracking-widest text-ink/50">{label}</dt>
            <dd className="mt-2 font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Contract</h2>
        <p className="mt-3 text-sm text-ink/70">
          Placeholder until the contract is deployed and audited. {mirror.network} · {mirror.asset}
        </p>
        <p className="mt-3 break-all border border-dashed border-gold bg-white px-4 py-3 font-mono text-sm">
          {mirror.address}
        </p>
        <p className="mt-2 text-sm text-stamp">Not deployed.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Deposits</h2>
        <ul className="mt-4 divide-y divide-line border border-line bg-white">
          {mirror.deposits.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <p>
                {row.from} · {formatUsdAmount(row.usd)}
              </p>
              <p className="text-ink/60">{row.note} · Demo</p>
              <p className="mt-1 break-all font-mono text-xs text-ocean">{row.tx}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Payouts</h2>
        <p className="mt-2 text-sm text-ink/60">Sample rows. These transactions were not sent.</p>
        <ul className="mt-4 divide-y divide-line border border-line bg-white">
          {mirror.payouts.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <p>
                {row.when} · {row.to} · {formatUsdAmount(row.usd)}
              </p>
              <a className="mt-1 block break-all font-mono text-xs text-ocean" href={`https://etherscan.io/tx/${row.tx}`}>
                {row.tx}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/rules" className="text-ocean">
          Read the protocol
        </Link>
      </p>
    </div>
  );
}
