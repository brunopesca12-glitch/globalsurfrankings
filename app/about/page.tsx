import type { Metadata } from "next";
import Link from "next/link";
import { FUTURE_THEMES, SEASON_2027, THEMES } from "@/lib/catalogue";
import { auth } from "@/lib/auth";
import { EDITIONS } from "@/lib/constitution";
import { formatDate } from "@/lib/format";
import { MONEY_BLANK } from "@/lib/prize";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const session = await auth().catch(() => null);
  return (
    <>
      <section className="bg-ocean text-paper">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.28em] text-sand">
            Founding Season · {formatDate(SEASON_2027.startsOn)} – {formatDate(SEASON_2027.endsOn)} · gala{" "}
            {SEASON_2027.galaLabel}
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[0.92] md:text-8xl">The best wave wins.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/85">
            An asynchronous world circuit. Seven titles, four divisions, 28 weekly champions, a verdict every Monday. You film the wave, you
            enter it, and it receives a place. Ocean entry is free.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/ranking" className="bg-paper px-5 py-3 text-ocean">
              See the rankings
            </Link>
            {session?.user ? (
              <Link href="/enter" className="border border-paper/40 px-5 py-3">
                Enter a wave
              </Link>
            ) : (
              <Link href="/sign-up" className="border border-paper/40 px-5 py-3">
                Create an athlete account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3">
          {[
            ["Free", "Ocean and pool entry. No membership, no banked waves. Athletes do not pay."],
            ["Points", "Season points and ranking status are the prize. Your ten best results decide the season."],
            [MONEY_BLANK, "Season prize money and career earnings stay on the profile and stay blank until a sponsor is affixed."],
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
          <h2 className="font-serif text-4xl">A title is not a beach on a day.</h2>
          <p className="mt-4 leading-relaxed text-ink/80">
            At GSR, a title is a tournament: one dimension of surfing, with its own world board and its own points, open
            every week from {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}. Your ten best
            results decide the season. The wave may have been ridden
            anywhere. What is measured is not who won the heat. It is who rode the best wave of the year.
          </p>
          <p className="mt-4 leading-relaxed text-ink/80">
            To be judged, you judge. An entry joins Monday&apos;s verdict only when this week&apos;s ballot queue is
            complete.
          </p>
        </div>
        <blockquote className="border-l-2 border-gold pl-6">
          <p className="font-serif text-3xl leading-snug">&ldquo;A wave does not receive a score. It receives a place.&rdquo;</p>
          <p className="mt-4 text-sm text-ink/70">
            Judges place each wave into their own list. Monday takes the median. Points follow the
            curve 100 / 60 / 45 / 35 / 28 / 22, base × √(S/100).
          </p>
        </blockquote>
      </section>

      <section className="bg-foam">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-4xl">Seven titles. Four divisions.</h2>
            <Link href="/calendar" className="text-sm text-ocean">
              Full calendar
            </Link>
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((theme) => (
              <li key={theme.slug} className="border border-line bg-paper px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-gold">52 weeks</p>
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
        <h2 className="font-serif text-4xl">Points first.</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">
          Every athlete has season points, season prize money, and career earnings. Season points are live. Prize
          money and career earnings stay on the page and read {MONEY_BLANK} until a sponsor is affixed. There is no
          cash prize and no escrow to collect.
        </p>
        <Link href="/ranking" className="mt-6 inline-block border border-ocean px-4 py-2 text-ocean">
          See the rankings
        </Link>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl">Coming in future seasons</h2>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {FUTURE_THEMES.map((name) => (
              <li key={name} className="border border-line px-4 py-3 text-ink/70">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
