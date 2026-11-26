import type { Metadata } from "next";
import { FUTURE_THEMES, SEASON_2027, THEMES } from "@/lib/catalogue";
import { formatDate } from "@/lib/format";
import { MONEY_BLANK } from "@/lib/prize";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Protocol</p>
      <h1 className="mt-2 font-serif text-5xl">The rules execute themselves.</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/80">
        GSR runs the competition in public. Surfers enter waves. Judges place them. Monday publishes the places.
        The prize is season points and ranking status. Prize-money columns stay on the athlete and read {MONEY_BLANK}{" "}
        until a sponsor is affixed. No cash prize is offered.
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Founding Season</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}. Seven titles, each with four
          divisions: Open and Masters 40+, men&apos;s and women&apos;s. Each title runs 52 weekly championships; your
          ten best results decide the season. Champions are crowned in {SEASON_2027.galaLabel}.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {THEMES.map((theme) => (
            <li key={theme.slug}>
              {theme.name}
              {theme.note ? <span className="text-ink/60"> — {theme.note}</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Original waves</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          Enter a wave that has never been posted on any social network or platform. The same wave cannot be entered
          twice. A file that matches an earlier entry is refused, including a copy that was saved again, trimmed, or
          cropped. Each title has a shape: a pool wave belongs in Wave Pool, an ocean wave does not, a frontside line
          belongs in Frontside Lines, a backside line belongs in Backside Lines, an aerial needs an aerial, a tube
          needs a tube, a big paddle-in wave has to be a big paddle-in, and a small-wave performance stays small. The
          site watches frames from the file. A clear miss is refused. An unsure read is accepted and marked for the
          desk. Anyone signed in can report a wave that was already published. Uploads must be original, unpublished,
          current-season footage. Reposting an old or already published wave leads to a ban.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Place, then points</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          A wave does not get a score. A judge drops it into their own list, best at #1. Three sealed places from a
          panel make that panel&apos;s place: the middle one. The wave&apos;s place is the middle of the panels that
          reached three. An even split resolves toward the Champions panel. Below three, a panel abstains.
        </p>
        <p className="mt-3 leading-relaxed text-ink/80">
          You never place your own event, or a declared clubmate&apos;s. The screen does not show the surfer.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Points</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          Event points use 100 / 60 / 45 / 35 / 28 / 22 on the podium, then 12% through the top fifth, then 4% to every
          other entrant. The winner&apos;s base is 100 × √(S/100). A division ranking is the sum of those points. Your
          ten best results decide the season.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Prize money</h2>
        <p className="mt-3 leading-relaxed text-ink/80">
          Season prize money and career earnings are shown for every athlete. With no sponsor affixed they read{" "}
          {MONEY_BLANK}. That blank is not a promise and not a balance. Entry is free. A pool verification toll can be
          switched on later; it is off. Nothing on this site is a cash prize.
        </p>
        <p className="mt-3 leading-relaxed text-ink/80">
          A public wallet address can be saved for a later season. It is not paid while prize money is unpublished.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Coming in future seasons</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {FUTURE_THEMES.map((name) => (
            <li key={name} className="border border-line px-3 py-2 text-ink/70">
              {name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
