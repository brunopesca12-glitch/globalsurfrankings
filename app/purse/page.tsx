import type { Metadata } from "next";
import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { MONEY_BLANK } from "@/lib/prize";

export const metadata: Metadata = { title: "Purse" };

export default function PursePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Reserved</p>
      <h1 className="mt-2 font-serif text-5xl">Prize money</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        Season prize money and career earnings are part of every athlete&apos;s record. No sponsor is affixed, so every
        amount on this page is {MONEY_BLANK}. Rankings are season points.
      </p>
      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          ["Season prize money", MONEY_BLANK],
          ["Career earnings", MONEY_BLANK],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-white px-4 py-4">
            <dt className="text-xs uppercase tracking-widest text-ink/55">{label}</dt>
            <dd className="mt-2 font-serif text-4xl">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 overflow-x-auto border border-line bg-white">
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
                <td className="px-3 py-2">{theme.name}</td>
                <td className="px-3 py-2 text-ink/70">{formatDate(theme.finaleOn)}</td>
                <td className="px-3 py-2">{MONEY_BLANK}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-ink/60">
        {SEASON_2027.name}. Entry is free.{" "}
        <Link href="/ranking" className="text-ocean">
          Season points
        </Link>
      </p>
    </div>
  );
}
