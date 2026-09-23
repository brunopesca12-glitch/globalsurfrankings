import Link from "next/link";
import { SEASON_2027, THEMES } from "@/lib/catalogue";
import { EDITIONS, FOUNDING, POOL_TOLL_CENTS } from "@/lib/constitution";
import { formatDate } from "@/lib/format";

export default function HomePage() {
  return (
    <>
      <section className="bg-ocean text-paper">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.28em] text-sand">
            {SEASON_2027.name} · gala {SEASON_2027.galaLabel}
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[0.92] md:text-8xl">The best wave wins.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/85">
            An asynchronous world circuit. Twelve themed events, eight rankings, a verdict every Monday. You film the wave,
            you enter it, and it receives a place. Ocean entry is free.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/sign-up" className="bg-paper px-5 py-3 text-ocean">
              Create an athlete account
            </Link>
            <Link href="/videos" className="border border-paper/40 px-5 py-3">
              Watch the waves
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3">
          {[
            ["US$ 0", "Ocean entry. One wave per ISO week. No membership, no banked waves."],
            ["84%", "Of every sponsor dollar goes to the athletes, in a purse affixed before the season opens."],
            ["16%", `Stays with the platform — plus the pool toll, US$ ${POOL_TOLL_CENTS / 100}, which the platform retains.`],
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
          <h2 className="font-serif text-4xl">An event is not a beach on a day.</h2>
          <p className="mt-4 leading-relaxed text-ink/80">
            At GSR, an event is a tournament: one dimension of surfing, with its own world board, its own purse, and its own
            finale, open all season. The wave may have been ridden anywhere. What is measured is not who won the heat. It is
            who rode the best wave of the year.
          </p>
          <p className="mt-4 leading-relaxed text-ink/80">
            To be judged, you judge. An entry joins Monday&apos;s verdict only if judging duty is current. In this version that
            duty is a desk flag — the five colleges are not seated yet.
          </p>
        </div>
        <blockquote className="border-l-2 border-gold pl-6">
          <p className="font-serif text-3xl leading-snug">&ldquo;A wave does not receive a score. It receives a place.&rdquo;</p>
          <p className="mt-4 text-sm text-ink/70">
            Five colleges, one verdict: the median. In this MVP the desk publishes the ordinal place, on the founding points
            curve — 100 / 60 / 45 / 35 / 28 / 22, base × √(S/100).
          </p>
        </blockquote>
      </section>

      <section className="bg-foam">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-4xl">Twelve finales. Eight crowns.</h2>
            <Link href="/calendar" className="text-sm text-ocean">
              Full calendar
            </Link>
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <li key={theme.slug} className="border border-line bg-paper px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-gold">{formatDate(theme.finaleOn)}</p>
                <p className="mt-1 font-medium">{theme.name}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-8 flex flex-wrap gap-2 text-sm">
            {EDITIONS.map((edition) => (
              <li key={edition.id} className="border border-line bg-paper px-3 py-1">
                {edition.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-serif text-4xl">The purse is on the door. In this version, as a demonstration.</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
          Each founding theme is a ticket of US$ {FOUNDING.ticketUsd.toLocaleString("en-US")}. Of that number, US${" "}
          {FOUNDING.athleteUsd.toLocaleString("en-US")} stays with the athletes — season tables, the weekly race, and the
          champions&apos; fund — and US$ {FOUNDING.platformUsd.toLocaleString("en-US")} with the platform. The public display
          repeats the published arithmetic. There is no Pix, no escrow, and no balance.
        </p>
        <Link href="/purse" className="mt-6 inline-block border border-ocean px-4 py-2 text-ocean">
          Open the DEMO purse
        </Link>
      </section>
    </>
  );
}
