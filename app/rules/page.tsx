import type { Metadata } from "next";
import Link from "next/link";
import { SEASON_2027, THEMES, themesFor } from "@/lib/catalogue";
import { CATEGORY_LABEL, type CategoryCode } from "@/lib/category";
import {
  EDITIONS,
  FOUNDING,
  FOUNDING_WEEKS,
  POOL_TOLL_CENTS,
  PRINTED_BALLOT_PAY,
} from "@/lib/constitution";
import { formatDate, formatUsdAmount } from "@/lib/format";

export const metadata: Metadata = { title: "Rules" };

const CONTENTS = [
  ["eligibility", "Eligibility and entry"],
  ["submit", "How to submit"],
  ["rankings", "Categories and world rankings"],
  ["season", "Season and the weekly cycle"],
  ["judging", "Judging"],
  ["scoring", "Scoring"],
  ["ties", "Tie-breaks"],
  ["authenticity", "Disqualification and authenticity"],
  ["prizes", "Prizes"],
  ["appeals", "Appeals"],
] as const;

const CATEGORY_EVENTS: { code: CategoryCode; who: string }[] = [
  { code: "OPEN", who: "Ages 19–39" },
  { code: "JUNIOR", who: "Age 18 and under" },
  { code: "MASTERS_40", who: "Ages 40–49" },
  { code: "MASTERS_50", who: "Age 50 and over" },
];

export default function RulesPage() {
  const poolToll = formatUsdAmount(POOL_TOLL_CENTS / 100);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        Founding Season · {formatDate(SEASON_2027.startsOn)} – {formatDate(SEASON_2027.endsOn)}
      </p>
      <h1 className="mt-3 font-serif text-5xl">Competition rules</h1>
      <p className="mt-4 leading-relaxed text-ink/80">
        These are the rules of the circuit: who may enter, how a wave is submitted and judged, how the rankings and
        purses are built, and how a place can be lost. The{" "}
        <Link href="/purse" className="text-ocean">
          purse page
        </Link>{" "}
        shows the same prize tables. This site mirrors the escrow. It does not collect, hold, or pay the money.
      </p>
      <nav className="mt-6 text-sm" aria-label="On this page">
        <ol className="flex flex-wrap gap-x-4 gap-y-2 text-ocean">
          {CONTENTS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`}>{label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="eligibility" title="Eligibility and entry">
        <p>
          One person, one account. Identity is document-verified, and any payout account is in the athlete&apos;s own
          name. Age is taken on {formatDate(SEASON_2027.ageAsOf)}. The bands are exclusive: 18 and under is Junior, 19
          to 39 is Open, 40 to 49 is Masters 40+, and 50 and over is Masters 50+. A Junior entry needs a guardian&apos;s
          consent, and a Junior profile is protected. The public vote on a Junior wave is moderated.
        </p>
        <p>
          Two labels may sit beside a name. Verified means the identity was checked. Verified Pro means a professional
          credential was checked — results, a sponsorship, or a league listing. Neither label closes the door. Ocean
          entry is free for every verified athlete. An elite title requires Verified Pro.
        </p>
        <p>
          Ocean entry is free. An athlete may enter one ocean wave in each ISO week, into any open event of their own
          category. That is one ocean wave in total, whatever the event. There is no membership, no annual fee, no
          banking, and no rollover. A week that is not used is gone.
        </p>
        <p>
          A pool wave pays a published verification toll of {poolToll}. The toll does not spend the ocean week. It is
          passed in full to the fund that pays The Ranked. This site records the toll and does not charge it.
        </p>
      </Section>

      <Section id="submit" title="How to submit">
        <p>A complete entry is one video and a declaration of four facts:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>the category the wave is entered in, which fixes the men&apos;s or women&apos;s edition;</li>
          <li>the place the wave was ridden;</li>
          <li>the date the wave was ridden, inside the current season;</li>
          <li>
            an image-rights attestation: the athlete holds the rights in the footage, and the clip shows that athlete
            riding the wave.
          </li>
        </ul>
        <p>
          One wave per clip. Raw footage only. The footage remains the athlete&apos;s. The event must be open to that
          category, and still open on the day of entry: each event accepts waves from{" "}
          {formatDate(SEASON_2027.startsOn)} until its finale. Best Surf Pool takes pool waves only. Best Air takes
          ocean waves only.
        </p>
        <p>
          The entry screen on this site asks for the event, the environment, a video URL, and the break, and it dates
          the entry to the ISO week it is sent. The ride date and the image-rights attestation above are part of these
          rules. They are not yet fields on that form.
        </p>
      </Section>

      <Section id="rankings" title="Categories and world rankings">
        <p>
          Four categories, each in a men&apos;s and a women&apos;s edition, make eight world rankings. Each ranking is
          the sum of that edition&apos;s event results, and each crowns a world champion in {SEASON_2027.galaLabel}.
          Enrollment is global. A city, country, club, or hashtag board is a view of the same world board, renumbered.
          Nothing new is judged there. A title on a derived board is minted only above a minimum field, and only on a
          sanctioned board. The number of people behind a place, N, is shown beside the points.
        </p>
        <ul className="space-y-3">
          {CATEGORY_EVENTS.map((category) => (
            <li key={category.code} className="border border-line bg-white px-4 py-3">
              <p className="font-medium">
                {CATEGORY_LABEL[category.code]} · {category.who}
              </p>
              <p className="mt-1 text-sm">
                {themesFor(category.code).length} events, men and women.{" "}
                {themesFor(category.code)
                  .map((theme) => theme.name)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
        <p>
          Best Small Wave is Open and Junior only, and the wave is waist-high at most. Best Air is ocean only and is
          off the 50+ ranking. Best Surf Pool is one event: Air in Open and Junior, Wave in 40+ and 50+.
        </p>
      </Section>

      <Section id="season" title="Season and the weekly cycle">
        <p>
          The Founding Season runs from {formatDate(SEASON_2027.startsOn)} to {formatDate(SEASON_2027.endsOn)}. From
          Season 2028 the ranking year returns to October 1 through September 30. The Overall closes on the same day as
          Best Barrel. The next season begins the following morning. The gala in {SEASON_2027.galaLabel} is the only
          live ceremony. Crowns handed over that night have already been paid, week by week, through the season.
        </p>
        <p>
          Every stamp, medal, and ranking is dated to its season. What was earned stays earned. A later change to the
          rules does not reach back.
        </p>
        <ol className="space-y-2">
          {THEMES.map((theme) => (
            <li key={theme.slug} className="grid gap-1 border-t border-line py-2 sm:grid-cols-[9rem_1fr]">
              <span className="text-sm text-ink/60">{formatDate(theme.finaleOn)}</span>
              <span>
                {theme.name}
                {theme.note ? <span className="text-ink/70"> — {theme.note}</span> : null}
              </span>
            </li>
          ))}
        </ol>
        <p>
          The week has one rhythm. An athlete brings the best ocean wave of that ISO week. To be judged, the athlete
          judges: the entry joins Monday&apos;s run only when that week&apos;s ballot queue is complete. The queue is a
          short blind draw from other categories, about fifteen minutes. On Monday the verdicts, the boards, and the
          rankings update, and that week&apos;s champions are paid from the escrow.
        </p>
      </Section>

      <Section id="judging" title="Judging">
        <p>
          A wave does not receive a score. It receives a place. Each judge inserts the wave into an ordered board by
          comparing two waves at a time: better than this one, worse than that one. There is no decimal.
        </p>
        <p>
          The judge is a college, not a person. The college&apos;s place is the median of the ballots it sealed on that
          wave. A college needs three ballots. Below three, it abstains. The wave&apos;s place is the median of the
          colleges that reached quorum.
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <span className="font-medium">Chamber of Champions.</span> Former world champions, men and women. The seat
            is for life, by name, and by opt-in, and it is active after retirement from the elite tour. The Chamber
            judges the decisive band and is paid from its 3% of each theme purse.
          </li>
          <li>
            <span className="font-medium">The Ranked.</span> Surfers who hold a current place on a professional circuit.
            They place every wave. They are paid from their 3% of each theme purse plus the whole of the pool tolls.
          </li>
          <li>
            <span className="font-medium">Athletes&apos; College.</span> Everyone who entered another category that
            season. They place every wave. Completing the week&apos;s queue is what keeps their own entries eligible.
          </li>
          <li>
            <span className="font-medium">Upper Chamber.</span> The top ten of each category ranking, drawn from the
            same athletes, seated as a separate college. They judge the decisive band. They never judge their own
            ladder.
          </li>
          <li>
            <span className="font-medium">The Public.</span> Every verified account may place every wave. Each ballot
            is scored for accuracy against the panel&apos;s median. The season names a Golden Eye at the gala.
          </li>
        </ol>
        <p>
          The decisive band is every wave that enters the paid zone — the top 20% of its edition — and every finale
          contender. Those waves are also judged by the Chamber and the Upper Chamber. The other three colleges place
          every wave.
        </p>
        <p>
          Nobody votes in a category they compete in, read across both genders. An Open athlete judges neither Open Men
          nor Open Women, and does not judge a category where a declared clubmate competes. One person sits in one
          college. A champion who is also ranked sits only in the Chamber; after that the order is Ranked, Upper
          Chamber, Athletes&apos; College, then the Public.
        </p>
        <p>
          The draw is blind. A judge does not choose the waves, and the ballot does not name the athlete. Individual
          ballots stay sealed. The college&apos;s verdict is public. A voter&apos;s deviation from the final median is
          public. Under the rule, a persistent outlier loses weight and then loses the login, and sustained accuracy in
          the Athletes&apos; College can promote a judge into the Upper Chamber. This site shows a judge their own
          deviation after Monday. It does not yet demote, promote, or name a Golden Eye.
        </p>
      </Section>

      <Section id="scoring" title="Scoring">
        <p>
          Judges place waves inside an event. The world ranking is built from those places. A place mints points from
          the winner&apos;s base. The base is 100 × √(S / 100), where S is the number of entrants in that edition of
          the event. A field of 400 pays twice the points of a field of 100.
        </p>
        <p>
          The first six places receive 100%, 60%, 45%, 35%, 28%, and 22% of that base. Places after sixth and through
          the top fifth receive 12%. Every other entrant receives 4%. The category ranking is the sum of an
          athlete&apos;s event points for the season. Points on a running event settle when the event closes, because
          the base uses the field. N is shown beside the number.
        </p>
        <p>
          A sanctioned contest in the water mints points under two limits: field depth counts at most twice, and each
          athlete has an annual cap, so a heavy contest calendar cannot outrun the filmed events. The published rule
          names that annual cap and does not give its number.
        </p>
      </Section>

      <Section id="ties" title="Tie-breaks">
        <p>
          When the colleges that reached quorum split evenly between two places, the place resolves toward the Chamber
          of Champions. If the Chamber abstained, the worse of the two central places stands. An even count inside one
          college takes the worse of its two central ballots. An ordinal has no average.
        </p>
        <p>
          The world ranking orders athletes by season points. The rules name no further tie-break when two athletes
          finish on the same points.
        </p>
      </Section>

      <Section id="authenticity" title="Disqualification and authenticity">
        <p>
          The facts of a clip are checked by machine: identity, date, location, authenticity, one wave in the clip, and
          raw footage. The colleges judge the surfing. They do not decide whether the clip is real. The platform
          certifies a wave only when it has judged it.
        </p>
        <p>The sentence for a fraudulent entry is a permanent ban, with forfeiture of points, stamps, and history. It covers:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>a surfer who is not the declared athlete;</li>
          <li>a wave ridden outside the current season;</li>
          <li>footage manipulated by AI, or otherwise not raw;</li>
          <li>more than one wave in the clip;</li>
          <li>
            any other attempt to defraud the event, including a clip entered to waste the panel rather than to be
            judged as a wave.
          </li>
        </ul>
        <p>
          The one-wave week is the check on a throwaway entry. There is no second ocean bullet, so a mediocre wave
          spends the week.
        </p>
      </Section>

      <Section id="prizes" title="Prizes">
        <p>
          Athletes pay nothing toward the purse. Brands fund it, and the sponsor deposits it in escrow before the
          season opens. Competitors and judges are the beneficiaries. If a sponsor leaves mid-season, the deposit is
          already there. This site displays the tables. No money moves through the platform.
        </p>
        <p>
          Of each theme&apos;s {formatUsdAmount(FOUNDING.ticketUsd)}, 84% ({formatUsdAmount(FOUNDING.athleteUsd)}) goes
          to surfers and 16% ({formatUsdAmount(FOUNDING.platformUsd)}) is the platform&apos;s published commission. The
          surfers&apos; share splits into 78% prize money ({formatUsdAmount(FOUNDING.competitorUsd)}) and 6% judges&apos;
          fees ({formatUsdAmount(FOUNDING.judgeUsd)}).
        </p>
        <p>The {formatUsdAmount(FOUNDING.competitorUsd)} in prize money, per theme, is:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{formatUsdAmount(FOUNDING.seasonTableUsd)} to the season tables, paid at each finale;</li>
          <li>
            {formatUsdAmount(FOUNDING.weeklyUsd)} to the weekly race, about{" "}
            {formatUsdAmount(FOUNDING.weeklyPerMondayUsd)} in checks every Monday across the {FOUNDING_WEEKS} weeks of
            the Founding Season;
          </li>
          <li>
            {formatUsdAmount(FOUNDING.overallUsd)} to the world champions&apos; fund, pooled across the twelve themes
            and paid with the crowns.
          </li>
        </ul>
        <p>
          The season table of a theme is divided across the editions where that theme exists, in proportion to each
          edition&apos;s field. On the founding tables those shares are{" "}
          {EDITIONS.map((edition) => `${edition.label} ${edition.shareBps / 100}%`).join(", ")}. The table is fixed and
          published at the opening of the season. The field that actually arrives recalibrates the next season&apos;s
          table. It does not move a table that is already open. Two themes run in fewer editions and keep the same
          surfers&apos; purse. On the published rounding, the Open Men table is about US$ 142,800 in Best Small Wave and
          about US$ 111,800 in ocean Best Air.
        </p>
        <p>
          The top 20% of an edition are paid, and at least the winner when anyone entered. On a large field the first
          six places share 80% of the table on the curve 35 / 20 / 14 / 12 / 10 / 9. That is 28%, 16%, 11.2%, 9.6%, 8%,
          and 7.2% of the table. Places 7 through the cutoff share the other 20% equally. No place outside the first
          six is paid more than sixth. If the equal share would pass sixth, each of those places stops at sixth&apos;s
          amount and the excess returns to the first six on the same curve. When six or fewer places are paid, they
          share the whole table on that curve. The{" "}
          <Link href="/purse" className="text-ocean">
            purse page
          </Link>{" "}
          prints each edition&apos;s door number. Published amounts are gross. Prize tax is withheld at source.
        </p>
        <p>
          The judges&apos; 6% is {formatUsdAmount(FOUNDING.chamberUsd)} to the Chamber and{" "}
          {formatUsdAmount(FOUNDING.rankedUsd)} to The Ranked, per theme. The Ranked rate is their 3% plus 100% of the
          season&apos;s pool tolls, divided in proportion to ballots cast, and capped at US${" "}
          {PRINTED_BALLOT_PAY.capUsd} a ballot. On the founding scenario that rate is about US${" "}
          {PRINTED_BALLOT_PAY.rankedUsd.toFixed(2)}, and the Chamber is about US${" "}
          {PRINTED_BALLOT_PAY.chamberUsd.toFixed(2)}. The platform may add to the Ranked rate and is never required to.
          The Athletes&apos; College, the Upper Chamber, and the Public are not paid from the purse.
        </p>
        <p>
          Payment leaves the escrow on the published calendar: Monday&apos;s weekly checks, each event finale, and the
          November crowns. It is paid to a verified account in that athlete&apos;s or judge&apos;s own name. Until a
          ranking pays, the platform holds no balance for anyone.
        </p>
      </Section>

      <Section id="appeals" title="Appeals">
        <p>
          A sealed college verdict stands. These rules describe no appeal, no protest window, and no review panel for
          an athlete who disagrees with a place. A later era, after an objective standard of judgment exists, is the
          point at which the human colleges are described as moving to appeals. That is not a right in the Founding
          Season.
        </p>
      </Section>
    </article>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-8 border-t border-line pt-8">
      <h2 className="font-serif text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}
