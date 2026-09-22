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

export const metadata: Metadata = { title: "Bolsa" };

export default function PursePage() {
  const tables = foundingEditionTables(FOUNDING.seasonTableUsd * 100);
  const overallPoolCents = FOUNDING.overallUsd * FOUNDING_THEME_COUNT * 100;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-4">
        <span className="stamp">Demo</span>
        <p className="text-sm text-ink/70">Nenhum valor nesta página é dinheiro. Não há cobrança, escrow nem saque.</p>
      </div>
      <h1 className="mt-4 font-serif text-5xl">Bolsa afixada</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
        Espelho de demonstração da aritmética publicada na edição fundadora. O aplicativo não incrementa saldos: quando existir
        escrow, o número na tela será uma leitura do extrato, não um contador interno. Até lá, o que se vê é a lei.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Ingresso do tema", formatUsdAmount(FOUNDING.ticketUsd)],
          ["Atletas · 84%", formatUsdAmount(FOUNDING.athleteUsd)],
          ["Plataforma · 16%", formatUsdAmount(FOUNDING.platformUsd)],
        ].map(([label, value]) => (
          <article key={label} className="border border-line bg-white px-4 py-5">
            <p className="text-xs uppercase tracking-widest text-ink/55">{label}</p>
            <p className="mt-2 font-serif text-4xl">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Como os US$ 336.000 se repartem</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Tabelas da temporada", FOUNDING.seasonTableUsd],
            ["Corrida semanal", FOUNDING.weeklyUsd],
            ["Fundo dos campeões", FOUNDING.overallUsd],
          ].map(([label, amount]) => (
            <li key={String(label)} className="border border-line px-4 py-4">
              <p className="text-sm text-ink/70">{label}</p>
              <p className="font-serif text-3xl">{formatUsdAmount(Number(amount))}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink/65">
          Doze temas: {formatUsdAmount(FOUNDING.seasonAthleteUsd)} em bolsas e {formatUsdAmount(FOUNDING.seasonPlatformUsd)} de
          comissão. A corrida semanal soma cerca de {formatUsd(Math.round(FOUNDING.weeklyPerMondayUsd * 100))} por segunda, se
          o ano tiver 52 segundas.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Tabelas por edição</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          A tabela da temporada (US$ 250.000) reparte-se pelas oito edições segundo a fatia de campo do cenário fundador. A
          curva exata dos seis primeiros lugares é 35 / 20 / 14 / 12 / 10 / 9. A v9 imprime alguns desses valores arredondados;
          a coluna da lei é a que esta página usa.
        </p>
        <div className="mt-4 overflow-x-auto border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-3 py-2">Edição</th>
                <th className="px-3 py-2">Fatia</th>
                <th className="px-3 py-2">Tabela</th>
                <th className="px-3 py-2">1º exato</th>
                <th className="px-3 py-2">6º exato</th>
                <th className="px-3 py-2">1º impresso</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => {
                const printed = PRINTED_EDITION_HEADLINES[table.id];
                return (
                  <tr key={table.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">{table.labelPt}</td>
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
          Os 20% de cima de cada edição são pagos. Com seis lugares, a curva acima é a lei inteira. Com mais lugares, o resto
          divide um peso de cauda e o vetor volta a somar 100%. As tabelas de uma temporada real ficam fixas na abertura; o
          campo realizado só recalibra a temporada seguinte.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Campeões no cenário impresso</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          Quatro vitórias de evento, o Overall em dinheiro e uma estimativa de semanais — os números do Anexo B.2, não uma
          projeção calculada a partir das ondas deste banco. O fundo de Overall exato, antes do arredondamento impresso, é a
          fatia de campo sobre {formatUsd(overallPoolCents)}.
        </p>
        <div className="mt-4 overflow-x-auto border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="px-3 py-2">Campeão</th>
                <th className="px-3 py-2">4 eventos</th>
                <th className="px-3 py-2">Overall</th>
                <th className="px-3 py-2">Semanais</th>
                <th className="px-3 py-2">Caixa</th>
              </tr>
            </thead>
            <tbody>
              {EDITIONS.map((edition) => {
                const row = PRINTED_CHAMPION_SEASON[edition.id];
                return (
                  <tr key={edition.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-2">{edition.labelPt}</td>
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
        <h2 className="font-serif text-3xl">O livro fundador, somado</h2>
        <ul className="mt-4 space-y-1 text-sm">
          <li>Bolsas afixadas, 12 × US$ 336.000 = {formatUsdAmount(FOUNDING.seasonAthleteUsd)}</li>
          <li>Plataforma, 12 × US$ 64.000 = {formatUsdAmount(FOUNDING.seasonPlatformUsd)}</li>
          <li>Livro em caixa = {formatUsdAmount(FOUNDING.seasonBookCashUsd)}</li>
          <li>Face do apresentador, em créditos = {formatUsdAmount(FOUNDING.presenterFaceUsd)}</li>
          <li>
            Pedágios de piscina, {FOUNDING_POOL_ENTRIES.toLocaleString("en-US")} × US$ 20 = {formatUsdAmount(FOUNDING.poolTollUsd)}
          </li>
          <li>O sistema move US$ 7.050.000 nesse cenário. Continua sendo uma conta, não um caixa.</li>
        </ul>
      </section>
    </div>
  );
}
