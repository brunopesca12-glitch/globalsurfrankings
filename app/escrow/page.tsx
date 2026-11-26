import type { Metadata } from "next";
import Link from "next/link";
import { MONEY_BLANK } from "@/lib/prize";

export const metadata: Metadata = { title: "Escrow" };

export default function EscrowPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Reserved</p>
      <h1 className="mt-2 font-serif text-5xl">Escrow</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
        No escrow is published. Prize money reads {MONEY_BLANK} for every athlete. This page does not hold a balance,
        list a payout, or promise one.
      </p>
      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Season prize money", MONEY_BLANK],
          ["Career earnings", MONEY_BLANK],
          ["Published orders", "0"],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-white px-4 py-4">
            <dt className="text-xs uppercase tracking-widest text-ink/50">{label}</dt>
            <dd className="mt-2 font-serif text-3xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-sm">
        <Link href="/ranking" className="text-ocean">
          Season points
        </Link>
      </p>
    </div>
  );
}
