import type { Metadata } from "next";
import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { CATEGORY_LABEL, type CategoryCode } from "@/lib/category";
import { formatDatePt } from "@/lib/format";

export const metadata: Metadata = { title: "Calendário" };

export default function CalendarPage() {
  const groups = new Map<string, typeof THEMES[number][]>();
  for (const theme of THEMES) {
    const list = groups.get(theme.finaleOn) ?? [];
    list.push(theme);
    groups.set(theme.finaleOn, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{SEASON_2027.name}</p>
      <h1 className="mt-2 font-serif text-5xl">Calendário dos doze eventos</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        O ranking corre de {formatDatePt(SEASON_2027.startsOn)} a {formatDatePt(SEASON_2027.endsOn)}. Um evento não é um
        encontro: é um quadro que fica aberto até o final. O Mais Elegante, em 31 de outubro, é o primeiro final da vintage. O
        Melhor Tubo fecha o ano no mesmo dia do Overall. O gala, em {SEASON_2027.galaLabel}, é a única cerimônia ao vivo —{" "}
        {SEASON_2027.galaVenue}.
      </p>
      <ol className="mt-10 space-y-8">
        {[...groups.entries()].map(([date, themes]) => (
          <li key={date} className="grid gap-3 border-t border-line pt-6 md:grid-cols-[9rem_1fr]">
            <p className="font-serif text-2xl">{formatDatePt(date)}</p>
            <div className="space-y-4">
              {themes.map((theme) => (
                <article key={theme.slug}>
                  <h2 className="text-xl">
                    <Link href={`/quadro/${theme.slug}`} className="hover:text-ocean">
                      {theme.namePt}
                    </Link>
                  </h2>
                  <p className="text-sm text-ink/60">{theme.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wider text-ink/70">
                    {theme.categories.map((category: CategoryCode) => (
                      <span key={category} className="border border-line px-2 py-0.5">
                        {CATEGORY_LABEL[category]}
                      </span>
                    ))}
                    {theme.proposedDate ? <span className="text-gold">Data proposta</span> : null}
                    {theme.poolOnly ? <span>Piscina</span> : null}
                    {theme.oceanOnly ? <span>Só oceano</span> : null}
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
