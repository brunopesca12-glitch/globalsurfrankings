import type { Metadata } from "next";
import { LegalDraft } from "@/components/LegalDraft";
import { TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <LegalDraft />
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Global Surf Rankings</p>
      <h1 className="mt-2 font-serif text-5xl">Terms of Use</h1>
      <p className="mt-4 text-sm text-ink/60">Version {TERMS_VERSION}. These terms govern gsr.surf and globalsurfrankings.com.</p>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">The service</h2>
        <p>
          Global Surf Rankings (&ldquo;GSR&rdquo;) is an asynchronous surf circuit. You enter a wave, peers place it,
          and Monday publishes an ordinal place. Season points and ranking status are the prize. Season prize money
          and career earnings are shown on every athlete. While no sponsor is affixed those amounts are blank. GSR
          does not offer a cash prize, hold an escrow, or pay a wallet.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Accounts</h2>
        <p>
          One person, one account. You must give a name, email, password, sex, and date of birth. Date of birth sets
          your division (Open, or Masters 40+ from age 40, men&apos;s and women&apos;s) and is not a public score. You
          are responsible for keeping the password confidential. You may also save a country, city, club, short note,
          hashtags, and a public stablecoin address. Never send a seed phrase or a private key. We will not ask for
          one.
        </p>
        <p>
          If you are under 18 you may use GSR only with a parent or guardian who accepts these terms for you. The
          service is not directed at children under 13.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Entries</h2>
        <p>
          Entry is free. Ocean and pool waves are not charged. A pool verification toll may be switched on later in
          the season; while it is off, athletes pay nothing. One ocean wave per ISO week. Pool waves do not use that
          shot. There is no banking of unused weeks.
        </p>
        <p>
          Every upload must be your original footage of a wave ridden in the current season, and it must never have
          been posted on any social network or other platform. You confirm that when you enter. The same wave cannot
          be entered twice, including a copy that was saved again, trimmed, or cropped. The clip has to fit the title
          you chose.
        </p>
        <p>
          Reposting an old wave, or a wave that was already published anywhere, is a breach of these terms and leads
          to a ban. GSR may refuse the entry, remove it, and close the account. A signed-in surfer or judge may
          report a wave that was already published. The desk reviews that report.
        </p>
        <p>
          You grant GSR a non-exclusive licence to host, transcode, display, and judge the video for the circuit, the
          rankings, and the operation of the site. You keep ownership of the footage.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Judging</h2>
        <p>
          To be judged, you judge. An entry joins Monday&apos;s verdict when this week&apos;s ballot queue is
          complete. You place waves into your own list. You do not place your own division or a declared
          clubmate&apos;s. The screen does not show the surfer. Monday takes the median of the panels that reached
          three sealed places. A wave is ranked only when at least seven distinct calibrated judges, qualified for
          that wave&apos;s title, have sealed a place. That number is seven unless GSR_VERDICT_QUORUM sets another
          whole number, so it can later be raised without a new release. A wave that is short of the quorum is not
          ranked. It rolls to the next Monday and stays in the queue. If the judges who did vote agree on fewer than
          60 percent of the deciding duels (GSR_APPEAL_AGREEMENT can change that fraction), the wave is not ranked
          that Monday. It goes to a second quorum of Golden Eye judges, or to the highest eye scores if there are not
          enough Golden Eye judges. No one on the desk picks that panel. Places become season points on the published
          curve. Judges are not named. Each judged wave has a public receipt: a stable pseudonym, the eye score at the
          time of the vote, the duel tallies, and the hashes anyone can recompute.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Points and prize money</h2>
        <p>
          Season points are calculated from published places and can change until the season closes, because the
          field size changes. Prize-money fields stay in the product so a later sponsor can fill them. A blank is not
          an amount you are owed. GSR may correct a place that was produced by a rules breach.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Acceptable use</h2>
        <p>
          Do not impersonate another surfer, share an account, attack the site, scrape it in a way that degrades it,
          upload malware, or enter footage you do not have the right to use. Do not include anyone else&apos;s private
          information in a video or a profile note.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Suspension</h2>
        <p>
          We may remove a wave or suspend or close an account for a breach, including a published or out-of-season
          upload, a duplicate, or judging abuse. Where we can, we will say why. A ban for reposting old or published
          footage can be permanent.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Disclaimers</h2>
        <p>
          The site is provided as available. Rankings, points, and video playback can be interrupted. We do not
          warrant that a place or a points total is free of error, or that a video will play on every device. Surfing
          is dangerous. Entering a wave on GSR does not make GSR responsible for how or where it was ridden.
        </p>
        <p>
          To the extent the law allows, GSR is not liable for lost points, lost ranking, lost footage, or indirect
          damages arising from use of the site. Nothing in these terms limits liability that cannot legally be
          limited.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Changes and law</h2>
        <p>
          We may update these terms. If the change needs a new acceptance, the version number changes and the signup
          and entry forms ask again. Continued use after a posted update is acceptance of the parts that do not
          require a new tick. These terms are governed by the laws of Brazil. The courts of São Paulo have
          jurisdiction, without taking away any right a consumer has to sue at home.
        </p>
        <p>Questions: privacy@gsr.surf.</p>
      </section>
    </div>
  );
}
