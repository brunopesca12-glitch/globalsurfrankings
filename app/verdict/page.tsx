import type { Metadata } from "next";
import Link from "next/link";
import { themeBySlug } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { ordinal } from "@/lib/format";
import { mondayCountdown } from "@/lib/season-clock";

export const metadata: Metadata = { title: "Monday's verdict" };

export default async function VerdictPage() {
  const run = await prisma.verdictRun.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      verdicts: {
        include: {
          entry: {
            include: {
              athlete: true,
              theme: true,
              placement: true,
            },
          },
        },
      },
    },
  });

  const seen = new Set<string>();
  const rows = (run?.verdicts ?? []).filter((verdict) => {
    if (seen.has(verdict.entryId)) return false;
    seen.add(verdict.entryId);
    return verdict.entry.placement != null;
  });
  rows.sort((a, b) => (a.entry.placement?.place ?? 99) - (b.entry.placement?.place ?? 99));

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Monday drop</p>
      <h1 className="mt-3 font-serif text-5xl leading-none">The verdict.</h1>
      <p className="mt-4 text-ink/75">{mondayCountdown(new Date())} Places are the median of the colleges. Points land here, and nowhere else.</p>
      {rows.length === 0 ? (
        <p className="mt-10 text-ink/60">Nothing has been published yet.</p>
      ) : (
        <ol className="mt-10 space-y-3">
          {rows.map((verdict) => {
            const title = themeBySlug(verdict.entry.theme.slug)?.name ?? verdict.entry.theme.name;
            const place = verdict.entry.placement?.place ?? 0;
            return (
              <li key={verdict.entryId} className="border border-line bg-white px-4 py-4">
                <p className="font-serif text-3xl">{ordinal(place)}</p>
                <p className="mt-1">
                  <Link href={`/athlete/${verdict.entry.athlete.slug}`} className="hover:text-ocean">
                    {verdict.entry.athlete.displayName}
                  </Link>
                  <span className="text-ink/60"> · {title}</span>
                </p>
                <Link href={`/videos/${verdict.entryId}/share`} className="mt-3 inline-block text-sm text-ocean">
                  Story card
                </Link>
                <Link href={`/videos/${verdict.entryId}/receipt`} className="mt-3 ml-4 inline-block text-sm text-ocean">
                  Receipt
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-8 text-sm">
        <Link href="/lineup" className="text-ocean">
          The Lineup
        </Link>
      </p>
    </div>
  );
}
