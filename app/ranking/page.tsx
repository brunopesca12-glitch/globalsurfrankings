import type { Metadata } from "next";
import Link from "next/link";
import { EDITIONS } from "@/lib/constitution";
import { getSeasonRankings } from "@/lib/data";
import { formatPoints, verificationLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Rankings" };

export default async function RankingPage() {
  const editions = await getSeasonRankings();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Oito rankings mundiais</p>
      <h1 className="mt-2 font-serif text-5xl">Campeonato da temporada</h1>
      <p className="mt-4 max-w-2xl text-ink/80">
        O ranking da categoria é a soma dos pontos de evento. Cada evento paga a curva 100 / 60 / 45 / 35 / 28 / 22 por cento da
        base, e a base do vencedor é 100 × √(S/100). N é o número de atletas já colocados na edição. Pontos provisórios até os
        finais.
      </p>
      <div className="mt-10 space-y-10">
        {EDITIONS.map((edition) => {
          const rows = [...(editions.get(`${edition.category}:${edition.sex}`)?.values() ?? [])].sort(
            (a, b) => b.points - a.points || a.displayName.localeCompare(b.displayName, "pt"),
          );
          return (
            <section key={edition.id}>
              <h2 className="font-serif text-3xl">{edition.labelPt}</h2>
              <p className="text-sm text-ink/60">N = {rows.length}</p>
              {rows.length === 0 ? (
                <p className="mt-3 text-sm text-ink/60">Sem resultados julgados nesta edição.</p>
              ) : (
                <ol className="mt-3 divide-y divide-line border border-line bg-white">
                  {rows.map((row, index) => (
                    <li key={row.athleteId} className="flex items-baseline justify-between gap-4 px-3 py-2 text-sm">
                      <span>
                        <span className="mr-3 font-serif text-xl">{index + 1}</span>
                        <Link href={`/atleta/${row.slug}`} className="hover:text-ocean">
                          {row.displayName}
                        </Link>
                        <span className="ml-2 text-xs uppercase tracking-wider text-ink/50">
                          {verificationLabel(row.verification)}
                          {row.city ? ` · ${row.city}` : ""} · {row.results} evento{row.results === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span>{formatPoints(row.points)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
