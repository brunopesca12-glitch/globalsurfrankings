import type { Metadata } from "next";
import { LegalDraft } from "@/components/LegalDraft";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <LegalDraft />
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Global Surf Rankings</p>
      <h1 className="mt-2 font-serif text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-ink/60">Version 2026-11-26. This policy describes gsr.surf and globalsurfrankings.com.</p>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Who we are</h2>
        <p>
          Global Surf Rankings operates the circuit at gsr.surf. For privacy requests, email privacy@gsr.surf. We are
          the controller of the account and entry data described here.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">What we collect</h2>
        <p>When you create an account or enter a wave, we collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Name, email, and a hashed password. We do not store the password itself.</li>
          <li>Date of birth and sex, so we can place you in a division.</li>
          <li>Country, and optionally city, club, a short note, and hashtags.</li>
          <li>A public wallet network and address, if you choose to save one. Never a seed phrase or a private key.</li>
          <li>Video files or links you upload, a cryptographic hash of the file, and perceptual hashes of sampled frames.</li>
          <li>The unpublished-wave statement you tick, and the terms version and timestamp of your acceptance, on the account and on the entry.</li>
          <li>Judging ballots: which waves you compared and the order you saved. Individual ballots are not published.</li>
          <li>Reports that a wave was already published, and desk notes on review.</li>
        </ul>
        <p>
          The server also receives standard technical data: IP address, browser type, and the time of the request, in
          host logs. Sign-in uses a session cookie.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Why</h2>
        <p>
          We use this data to run the account, assign the division, accept or refuse an entry, detect duplicate or
          already published footage, run peer judging, publish places and season points, keep the prize-money columns
          ready for a later sponsor, and secure the site. The legal bases are the contract (providing the circuit you
          signed up for), legitimate interests (integrity of the rankings, security, and abuse reports), and consent
          where we ask for it, including the terms tick and the unpublished-wave statement.
        </p>
        <p>
          Date of birth is used for the division. It is not shown as a birth date on the public profile. The public
          profile shows the division, name, and the fields you choose to display.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Video checks</h2>
        <p>
          Frames from an upload may be sent to a vision model to see whether the clip fits the title. A clear miss is
          refused. An unsure read is kept and marked pending review. If that check is not configured, the wave is
          still accepted and marked pending review. We do not use the frames to train a public model of our own. The
          provider processes the frames to answer that check.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Wallets and prize money</h2>
        <p>
          A wallet address is a public payment destination you type in. We store it so a future prize payment could
          be addressed to you. While prize money is unpublished we do not send funds and we do not show an invented
          balance. Wallet addresses you save can appear on a later payment instruction. Do not save an address you do
          not control.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Who we share with</h2>
        <p>We use processors to host the product:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Vercel, for the application and, when configured, file storage.</li>
          <li>Neon, for the Postgres database.</li>
          <li>Resend, to send password-reset email from no-reply@gsr.surf, when that mail is configured.</li>
          <li>A vision-model provider, only for the title check described above, when a key is set.</li>
        </ul>
        <p>
          We do not sell personal data. We share it if the law requires, or to investigate a ban for a published or
          duplicated wave. Public pages show your name, division, points, places, and the videos you entered.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">How long</h2>
        <p>
          Account data and entries stay for the season and for as long as the rankings that depend on them are
          published. Password-reset tokens expire after 60 minutes and are single-use. Host logs are kept for
          security for a limited period. You can ask us to delete an account. We may retain a record of a ban, and
          the hashes needed to keep a banned wave from being entered again.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Your rights</h2>
        <p>
          Depending on where you live, you can ask for access, correction, deletion, or a copy of your data, and you
          can object to a use or complain to a data-protection authority. Email privacy@gsr.surf. We may need to
          confirm it is your account before we change it. Sex and date of birth stay fixed after signup because they
          define the division; a correction of a mistake is still available through that email.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Children</h2>
        <p>
          We collect date of birth because the circuit has age divisions. We do not knowingly open an account for a
          child under 13. If we learn that we have, we will delete it. Athletes under 18 need a parent or guardian.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-ink/85">
        <h2 className="font-serif text-3xl text-ink">Transfers and changes</h2>
        <p>
          Hosts may process data outside your country, including in the United States, under their own terms and
          safeguards. We will update this policy when the practice changes, and we will change the version date at
          the top. The session cookie is essential for sign-in. We do not use it for advertising.
        </p>
      </section>
    </div>
  );
}
