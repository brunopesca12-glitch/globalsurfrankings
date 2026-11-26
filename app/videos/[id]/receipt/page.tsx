import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { themeBySlug } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { ordinal } from "@/lib/format";
import { ordinalMedian } from "@/lib/median";
import {
  duelAgreements,
  holdCopy,
  isOutlier,
  verdictQuorum,
  waveAgreement,
} from "@/lib/receipt";
import { canonicalFromCommit } from "@/lib/vote-commit";

export const metadata: Metadata = { title: "Verdict receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: {
      athlete: { select: { displayName: true, slug: true, userId: true } },
      theme: { select: { name: true, slug: true } },
      placement: { select: { place: true } },
      voteCommits: { orderBy: { committedAt: "asc" } },
    },
  });
  if (!entry) notFound();

  const session = await auth();
  const owner = session?.user?.id === entry.athlete.userId || session?.user?.role === "ADMIN";
  const ranked = entry.status === "PLACED" && entry.placement != null;
  const showName = ranked || owner;
  const quorum = verdictQuorum();
  const title = themeBySlug(entry.theme.slug)?.name ?? entry.theme.name;

  const weeks = uniqueWeeks(entry.voteCommits);
  const [ballots, appealCount, roots] = await Promise.all([
    prisma.ballot.findMany({
      where: { entryId: id, status: "SEALED", place: { not: null } },
      select: { userId: true, place: true, appeal: true },
    }),
    prisma.ballot.count({ where: { entryId: id, appeal: true, status: "SEALED" } }),
    weeks.length === 0
      ? Promise.resolve([])
      : prisma.weekRoot.findMany({
          where: { OR: weeks.map((week) => ({ isoYear: week.isoYear, isoWeek: week.isoWeek })) },
        }),
  ]);

  const placeByUser = new Map(ballots.map((ballot) => [ballot.userId, ballot.place]));
  const places = ballots.map((ballot) => ballot.place).filter((place): place is number => place != null);
  const median = ordinalMedian(places);
  const judges = new Map<
    string,
    { pseudonym: string; eyeScore: number; eyeLevel: string; qualified: boolean; calibrated: boolean; place: number | null; outlier: boolean }
  >();
  for (const commit of entry.voteCommits) {
    if (judges.has(commit.pseudonym)) continue;
    const place = placeByUser.get(commit.userId) ?? null;
    judges.set(commit.pseudonym, {
      pseudonym: commit.pseudonym,
      eyeScore: commit.eyeScore,
      eyeLevel: commit.eyeLevel,
      qualified: commit.qualified,
      calibrated: commit.calibrated,
      place,
      outlier: isOutlier({ place, median }),
    });
  }
  const counted = entry.voteCommits.filter((commit) => commit.calibrated && commit.qualified);
  const distinct = new Set(counted.map((commit) => commit.userId)).size;
  const pairMap = new Map<string, { subjectId: string; probeId: string; better: number; worse: number }>();
  for (const commit of entry.voteCommits) {
    const key = commit.probeEntryId;
    const pair = pairMap.get(key) ?? { subjectId: entry.id, probeId: commit.probeEntryId, better: 0, worse: 0 };
    if (commit.choice === "BETTER") pair.better += 1;
    else pair.worse += 1;
    pairMap.set(key, pair);
  }
  const duels = duelAgreements([...pairMap.values()]);
  const agreement = waveAgreement(duels, places);
  const confident = entry.voteCommits.filter((commit) => commit.confidence === "CONFIDENT").length;
  const unsure = entry.voteCommits.filter((commit) => commit.confidence === "UNSURE").length;
  const marked = confident + unsure;
  const hold = holdCopy(entry.holdReason, quorum);
  const rootByWeek = new Map(roots.map((root) => [`${root.isoYear}-${root.isoWeek}`, root]));

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Verdict receipt</p>
      <h1 className="mt-2 font-serif text-5xl leading-none">{title}</h1>
      <p className="mt-3 text-ink/75">
        {showName ? (
          <Link href={`/athlete/${entry.athlete.slug}`} className="hover:text-ocean">
            {entry.athlete.displayName}
          </Link>
        ) : (
          "The surfer stays unnamed until Monday ranks the wave."
        )}
        {ranked && entry.placement ? ` · ${ordinal(entry.placement.place)}` : " · not ranked"}
      </p>
      {hold && !ranked ? <p className="mt-4 border border-line bg-white px-4 py-3 text-sm leading-relaxed">{hold}</p> : null}
      {entry.holdReason === "APPEAL" || appealCount > 0 ? (
        <p className="mt-4 border border-line bg-white px-4 py-3 text-sm leading-relaxed">
          Agreement on the deciding duels was {Math.round(agreement * 100)}%.{" "}
          {entry.appealFallback
            ? "There were not enough Golden Eye judges, so the highest eye scores filled the second quorum."
            : "A second quorum of Golden Eye judges has the wave."}{" "}
          {appealCount > 0 ? `${appealCount} of those ballots are sealed.` : "It is not ranked until that quorum seals."}{" "}
          No one on the desk chose the panel.
        </p>
      ) : null}

      <section className="mt-8 border border-line bg-white px-4 py-4">
        <h2 className="font-serif text-3xl">Quorum</h2>
        <p className="mt-2 text-3xl font-serif">
          {distinct}
          <span className="text-lg text-ink/50"> / {quorum}</span>
        </p>
        <p className="mt-2 text-sm text-ink/70">
          Calibrated judges qualified for {title}. A judge counts once. The number is {quorum} unless GSR_VERDICT_QUORUM
          says otherwise. Short of that, the wave is not ranked and rolls to the next Monday.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-3xl">Judges</h2>
        <p className="mt-2 text-sm text-ink/70">Codes are stable and are not names. The eye score is the one at the time of the vote.</p>
        {judges.size === 0 ? <p className="mt-3 text-sm text-ink/60">No committed votes on this wave yet.</p> : null}
        <ul className="mt-4 space-y-2">
          {[...judges.values()].map((judge) => (
            <li key={judge.pseudonym} className="border border-line bg-white px-3 py-3 text-sm">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-serif text-2xl">{judge.pseudonym}</span>
                <span>
                  {judge.eyeLevel} · {judge.eyeScore}
                </span>
              </p>
              <p className="mt-1 text-ink/70">
                Qualified for {title}. {judge.calibrated ? "Calibrated." : "Not calibrated, so this vote does not count toward quorum."}
                {judge.place != null ? ` Place ${judge.place}.` : ""}
                {judge.outlier ? " Outlier." : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-3xl">Deciding duels</h2>
        <p className="mt-2 text-sm text-ink/70">
          Agreement {Math.round(agreement * 100)}%. {marked === 0 ? "No confidence marks yet." : `${confident} confident, ${unsure} unsure, of ${marked} marks.`}
        </p>
        <ul className="mt-4 space-y-2">
          {duels.map((duel) => (
            <li key={duel.probeId} className="border border-line bg-white px-3 py-3 text-sm">
              <p className="font-serif text-2xl">
                {duel.agree}/{duel.total} agreed
              </p>
              <p className="mt-1 text-ink/70">
                The new wave {duel.majority === "BETTER" ? "goes higher" : "sits lower"} than the wave it was compared with.
                {duel.total >= 2 && duel.agree / duel.total < 0.6 ? " Split." : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-3xl">Check the hashes</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          Each vote is SHA-256 of one line: vote id, the two waves, the choice, the judge code, the time, and a nonce,
          separated by <span className="font-mono">|</span>. The weekly root is a Merkle tree of those hashes, sorted,
          parent <span className="font-mono">SHA-256(left|right)</span>, odd leaf paired with itself.{" "}
          <Link href="/verify" className="text-ocean">
            Verify a line
          </Link>
          . The root is ready to anchor on a chain later. Nothing is anchored yet.
        </p>
        {roots.length === 0 ? <p className="mt-3 text-sm text-ink/60">Monday has not published a root for these votes yet.</p> : null}
        <ul className="mt-4 space-y-2 text-sm">
          {roots.map((root) => (
            <li key={root.id} className="break-all border border-line bg-white px-3 py-3 font-mono text-xs">
              {root.isoYear}-W{String(root.isoWeek).padStart(2, "0")} · {root.voteCount} votes
              <span className="mt-1 block">{root.merkleRoot}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-4 space-y-3">
          {entry.voteCommits.map((commit) => {
            const line = canonicalFromCommit(commit);
            const weekKey = `${commit.isoYear}-${commit.isoWeek}`;
            const root = rootByWeek.get(weekKey);
            return (
              <li key={commit.id} className="border border-line bg-white px-3 py-3 text-xs">
                <p className="font-serif text-base text-ink">
                  {commit.pseudonym} · {commit.choice === "BETTER" ? "Higher" : "Lower"}
                  {commit.confidence === "CONFIDENT" ? " · Confident" : commit.confidence === "UNSURE" ? " · Unsure" : ""}
                </p>
                <p className="mt-2 break-all font-mono text-ink/80">{commit.payloadHash}</p>
                <p className="mt-2 break-all font-mono text-ink/55">{line}</p>
                <p className="mt-2 text-ink/60">{root ? "Inside the weekly root." : "Waiting for the weekly root."}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function uniqueWeeks(commits: { isoYear: number; isoWeek: number }[]): { isoYear: number; isoWeek: number }[] {
  const seen = new Set<string>();
  const weeks: { isoYear: number; isoWeek: number }[] = [];
  for (const commit of commits) {
    const key = `${commit.isoYear}-${commit.isoWeek}`;
    if (seen.has(key)) continue;
    seen.add(key);
    weeks.push({ isoYear: commit.isoYear, isoWeek: commit.isoWeek });
  }
  return weeks;
}
