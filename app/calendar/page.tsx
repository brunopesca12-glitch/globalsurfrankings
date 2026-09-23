import type { Metadata } from "next";
import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { CATEGORY_LABEL, type CategoryCode } from "@/lib/category";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  const groups = new Map<string, (typeof THEMES)[number][]>();
  for (const theme of THEMES) {
    const list = groups.get(theme.finaleOn) ?? [];
    list.push(theme);
    groups.set(theme.finaleOn, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{SEASON_2027.name}</p>
      <h1 className="mt-2 font-serif text-5xl">Calendar of the twelve events</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        The ranking runs from {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}. An event is not a
        meet: it is a board that stays open until the finale. Most Elegant, on October 31, is the first finale of the
        vintage. Best Barrel closes the year on the same day as the Overall. The gala, in {SEASON_2027.galaLabel}, is the
        only live ceremony.
      </p>
      <ol className="mt-10 space-y-8">
        {[...groups.entries()].map(([date, themes]) => (
          <li key={date} className="grid gap-3 border-t border-line pt-6 md:grid-cols-[9rem_1fr]">
            <p className="font-serif text-2xl">{formatDate(date)}</p>
            <div className="space-y-4">
              {themes.map((theme) => (
                <article key={theme.slug}>
                  <h2 className="text-xl">
                    <Link href={`/board/${theme.slug}`} className="hover:text-ocean">
                      {theme.name}
                    </Link>
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wider text-ink/70">
                    {theme.categories.map((category: CategoryCode) => (
                      <span key={category} className="border border-line px-2 py-0.5">
                        {CATEGORY_LABEL[category]}
                      </span>
                    ))}
                    {theme.proposedDate ? <span className="text-gold">Proposed date</span> : null}
                    {theme.poolOnly ? <span>Pool</span> : null}
                    {theme.oceanOnly ? <span>Ocean only</span> : null}
                  </div>
                  {theme.note ? <p className="mt-2 text-sm text-ink/75">{theme.note}</p> : null}
                </article>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
