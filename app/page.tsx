import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { FOUNDING, OCEAN_ENTRY_TOLL_CENTS, POOL_TOLL_CENTS } from "@/lib/constitution";
import { formatDatePt } from "@/lib/format";

const rankings = [
  "Open — Homens",
  "Open — Mulheres",
  "Júnior — Homens",
  "Júnior — Mulheres",
  "Masters 40+ — Homens",
  "Masters 40+ — Mulheres",
  "Masters 50+ — Homens",
  "Masters 50+ — Mulheres",
];

export default function HomePage() {
  return (
    <>
      <section className="bg-ocean text-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.28em] text-sand">
            {SEASON_2027.name} · gala {SEASON_2027.galaLabel}
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[0.92] md:text-8xl">A melhor onda vence.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/85">
            Um circuito mundial assíncrono. Doze eventos temáticos, oito rankings, veredito toda segunda-feira. Você filma a
            onda, entra, e ela recebe um lugar — não uma nota. A entrada no oceano custa US$ {OCEAN_ENTRY_TOLL_CENTS / 100}. O
            oceano cobra o pedágio.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/cadastrar" className="bg-paper px-5 py-3 text-ocean">
              Criar conta de atleta
            </Link>
            <Link href="/quadro/best-barrel" className="border border-paper/40 px-5 py-3">
              Ver o quadro de demonstração
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3">
          {[
            ["US$ 0", "Entrada no oceano. Uma onda por semana ISO. Sem anuidade, sem banco de ondas."],
            ["84%", "De cada ingresso de patrocínio vai para os atletas, em bolsa afixada antes da temporada."],
            ["16%", `Fica com a plataforma — e o pedágio da piscina, US$ ${POOL_TOLL_CENTS / 100}, que ela retém.`],
          ].map(([title, body]) => (
            <div key={title} className="border-line px-5 py-10 md:border-r md:last:border-r-0">
              <p className="font-serif text-5xl text-ocean">{title}</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/75">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-4xl">O evento não é uma praia num dia.</h2>
          <p className="mt-4 leading-relaxed text-ink/80">
            Na GSR, um evento é um torneio: uma dimensão do surfe, com quadro mundial próprio, bolsa própria e final próprio,
            aberto a temporada inteira. A onda pode ter sido surfada em qualquer lugar. O que se mede não é quem ganhou a
            bateria. É quem andou a melhor onda do ano.
          </p>
          <p className="mt-4 leading-relaxed text-ink/80">
            Para ser julgado, você julga. A entrada só segue para a liturgia de segunda se o dever de julgar estiver em dia.
            Nesta versão, esse dever é uma marca da mesa — as cinco casas ainda não estão sentadas.
          </p>
        </div>
        <blockquote className="border-l-2 border-gold pl-6">
          <p className="font-serif text-3xl leading-snug">“A wave does not receive a score. It receives a place.”</p>
          <p className="mt-4 text-sm text-ink/70">
            Cinco casas, um veredito: a mediana. A colocação do MVP é ordinal, publicada pela mesa, sobre a mesma curva de
            pontos da edição fundadora — 100 / 60 / 45 / 35 / 28 / 22, base × √(S/100).
          </p>
        </blockquote>
      </section>

      <section className="bg-foam">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-4xl">Doze finais. Oito coroas.</h2>
            <Link href="/calendario" className="text-sm text-ocean">
              Calendário completo
            </Link>
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <li key={theme.slug} className="border border-line bg-paper px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-gold">{formatDatePt(theme.finaleOn)}</p>
                <p className="mt-1 font-medium">{theme.namePt}</p>
                <p className="text-sm text-ink/60">{theme.name}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-8 flex flex-wrap gap-2 text-sm">
            {rankings.map((name) => (
              <li key={name} className="border border-line bg-paper px-3 py-1">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-serif text-4xl">A bolsa está na porta. Nesta versão, em demonstração.</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
          Cada tema fundador é um ingresso de US$ {FOUNDING.ticketUsd.toLocaleString("en-US")}. Deste número, US${" "}
          {FOUNDING.athleteUsd.toLocaleString("en-US")} ficam com os atletas — tabelas de temporada, corrida semanal e fundo
          dos campeões — e US$ {FOUNDING.platformUsd.toLocaleString("en-US")} com a plataforma. O painel público repete a
          aritmética publicada. Não há Pix, não há escrow, não há saldo.
        </p>
        <Link href="/bolsa" className="mt-6 inline-block border border-ocean px-4 py-2 text-ocean">
          Abrir a bolsa DEMO
        </Link>
      </section>
    </>
  );
}
