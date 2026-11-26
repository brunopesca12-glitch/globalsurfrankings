import { prisma } from "@/lib/db";
import { loadEyeSnapshot } from "@/lib/eye-record";
import { isoWeek } from "@/lib/iso-week";
import { meanAbsoluteDeviation } from "@/lib/tribunal";
import {
  calibrationMinimum,
  canonicalVote,
  judgePseudonym,
  newNonce,
  receiptPepper,
  voteHash,
} from "@/lib/receipt";

/** Stores the SHA-256 commitment for the comparison just written on this ballot. */
export async function commitLatestComparison(userId: string, ballotId: string): Promise<string | null> {
  const comparison = await prisma.ballotComparison.findFirst({
    where: { ballotId, ballot: { userId } },
    orderBy: { createdAt: "desc" },
    include: {
      ballot: {
        select: {
          entryId: true,
          entry: { select: { theme: { select: { slug: true } } } },
        },
      },
    },
  });
  if (!comparison) return null;
  const existing = await prisma.voteCommit.findUnique({
    where: { comparisonId: comparison.id },
    select: { id: true },
  });
  if (existing) return existing.id;

  const [answers, queueMean] = await Promise.all([
    prisma.calibrationAnswer.count({ where: { userId } }),
    prisma.ballot.findMany({
      where: { userId, status: "SEALED", place: { not: null }, entry: { placement: { isNot: null } } },
      select: { place: true, entry: { select: { placement: { select: { place: true } } } } },
    }),
  ]);
  const pairs = queueMean
    .filter((row) => row.place != null && row.entry.placement)
    .map((row) => ({ ballotPlace: row.place!, finalPlace: row.entry.placement!.place }));
  const eye = await loadEyeSnapshot(userId, meanAbsoluteDeviation(pairs), pairs.length);
  const minimum = calibrationMinimum();
  const week = isoWeek(comparison.createdAt);
  const nonce = newNonce();
  const pseudonym = judgePseudonym(userId, receiptPepper());
  const timestamp = comparison.createdAt.toISOString();
  const choice = comparison.result;
  const hash = voteHash({
    voteId: comparison.id,
    subjectId: comparison.ballot.entryId,
    probeId: comparison.probeEntryId,
    choice,
    pseudonym,
    timestamp,
    nonce,
  });
  const created = await prisma.voteCommit.create({
    data: {
      comparisonId: comparison.id,
      entryId: comparison.ballot.entryId,
      probeEntryId: comparison.probeEntryId,
      userId,
      pseudonym,
      choice,
      nonce,
      committedAt: comparison.createdAt,
      payloadHash: hash,
      eyeScore: eye.score,
      eyeLevel: eye.level,
      qualified: true,
      calibrated: answers >= minimum,
      themeSlug: comparison.ballot.entry.theme.slug,
      isoYear: week.isoYear,
      isoWeek: week.isoWeek,
    },
    select: { id: true },
  });
  return created.id;
}

export function canonicalFromCommit(commit: {
  comparisonId: string;
  entryId: string;
  probeEntryId: string;
  choice: "BETTER" | "WORSE";
  pseudonym: string;
  committedAt: Date;
  nonce: string;
}): string {
  return canonicalVote({
    voteId: commit.comparisonId,
    subjectId: commit.entryId,
    probeId: commit.probeEntryId,
    choice: commit.choice,
    pseudonym: commit.pseudonym,
    timestamp: commit.committedAt.toISOString(),
    nonce: commit.nonce,
  });
}
