import type { CategoryCode, College, Prisma, Sex } from "@prisma/client";
import { prisma } from "@/lib/db";
import { eyeLevel, eyeScore } from "@/lib/eye";
import { isoWeek } from "@/lib/iso-week";
import { loadJudgeContext } from "@/lib/judge-context";
import {
  appealPanel,
  appealThreshold,
  calibrationMinimum,
  merkleRoot,
  mondayGate,
  type QuorumJudge,
  waveAgreement,
  duelAgreements,
} from "@/lib/receipt";
import {
  canJudgeEntry,
  collegeVerdictsFromBallots,
  editionKey,
  finalPlaceFromCollegeVerdicts,
  forbiddenForAthlete,
  resolveCollege,
  verdictInsertionOrder,
  type ProposedVerdict,
} from "@/lib/tribunal";

type Tx = Prisma.TransactionClient;

export type VerdictResult = { placed: number; held: number };

/**
 * Publish every submitted wave whose athlete has finished the queue for the
 * week of that entry. Places follow `nextBoard`: worst equal-median first, so
 * the better wave ends in front.
 */
export async function runMondayVerdict(now = new Date()): Promise<VerdictResult> {
  const week = isoWeek(now);
  const quorum = (await import("@/lib/receipt")).verdictQuorum();
  const threshold = appealThreshold();
  const minimum = calibrationMinimum();
  const ctx = await loadJudgeContext();
  return prisma.$transaction(
    async (tx) => {
      const submitted = await tx.entry.findMany({
        where: { status: "SUBMITTED", placement: null },
        include: { athlete: { select: { userId: true } } },
        orderBy: { createdAt: "asc" },
      });
      const run = await tx.verdictRun.create({
        data: { isoYear: week.isoYear, isoWeek: week.isoWeek, placed: 0, held: 0 },
      });
      if (submitted.length === 0) return { placed: 0, held: 0 };

      const userIds = [...new Set(submitted.map((entry) => entry.athlete.userId))];
      const open = await tx.ballot.findMany({
        where: { userId: { in: userIds }, status: "OPEN", entry: { status: "SUBMITTED" } },
        select: { userId: true, isoYear: true, isoWeek: true },
      });
      const blocked = new Set(open.map((ballot) => `${ballot.userId}:${ballot.isoYear}:${ballot.isoWeek}`));

      const entryIds = submitted.map((entry) => entry.id);
      const sealed = await tx.ballot.findMany({
        where: { entryId: { in: entryIds }, status: "SEALED", place: { gte: 1 } },
        select: { entryId: true, college: true, place: true, userId: true, appeal: true },
      });
      const byEntry = new Map<string, { college: College; place: number }[]>();
      const judgesByEntry = new Map<string, QuorumJudge[]>();
      const placesByEntry = new Map<string, number[]>();
      const appealSealedByEntry = new Map<string, number>();
      const calibrationRows = await tx.calibrationAnswer.findMany({
        where: { userId: { not: null } },
        select: { userId: true, correct: true },
      });
      const calibrationCount = new Map<string, { total: number; hits: number }>();
      for (const row of calibrationRows) {
        if (!row.userId) continue;
        const current = calibrationCount.get(row.userId) ?? { total: 0, hits: 0 };
        current.total += 1;
        if (row.correct) current.hits += 1;
        calibrationCount.set(row.userId, current);
      }
      for (const ballot of sealed) {
        if (ballot.place == null) continue;
        const list = byEntry.get(ballot.entryId) ?? [];
        list.push({ college: ballot.college, place: ballot.place });
        byEntry.set(ballot.entryId, list);
        const judges = judgesByEntry.get(ballot.entryId) ?? [];
        judges.push({
          userId: ballot.userId,
          calibrated: (calibrationCount.get(ballot.userId)?.total ?? 0) >= minimum,
          qualified: true,
        });
        judgesByEntry.set(ballot.entryId, judges);
        const places = placesByEntry.get(ballot.entryId) ?? [];
        places.push(ballot.place);
        placesByEntry.set(ballot.entryId, places);
        if (ballot.appeal) appealSealedByEntry.set(ballot.entryId, (appealSealedByEntry.get(ballot.entryId) ?? 0) + 1);
      }
      const commits = await tx.voteCommit.findMany({
        where: { entryId: { in: entryIds } },
        select: { entryId: true, probeEntryId: true, choice: true },
      });
      const pairMap = new Map<string, { subjectId: string; probeId: string; better: number; worse: number }>();
      for (const commit of commits) {
        const key = `${commit.entryId}:${commit.probeEntryId}`;
        const pair = pairMap.get(key) ?? { subjectId: commit.entryId, probeId: commit.probeEntryId, better: 0, worse: 0 };
        if (commit.choice === "BETTER") pair.better += 1;
        else pair.worse += 1;
        pairMap.set(key, pair);
      }

      type Ready = {
        id: string;
        themeId: string;
        category: CategoryCode;
        sex: Sex;
        athleteId: string;
        createdAt: Date;
        place: number;
        chamberPlace: number | null;
        verdicts: { college: College; place: number | null; ballots: number }[];
      };
      const ready: Ready[] = [];
      let held = 0;

      for (const entry of submitted) {
        const key = `${entry.athlete.userId}:${entry.isoYear}:${entry.isoWeek}`;
        if (blocked.has(key)) {
          held += 1;
          continue;
        }
        const verdicts = collegeVerdictsFromBallots(byEntry.get(entry.id) ?? []);
        const place = finalPlaceFromCollegeVerdicts(verdicts);
        if (place == null) {
          held += 1;
          continue;
        }
        const duels = duelAgreements(
          [...pairMap.values()].filter((pair) => pair.subjectId === entry.id),
        );
        const gate = mondayGate({
          judges: judgesByEntry.get(entry.id) ?? [],
          agreement: waveAgreement(duels, placesByEntry.get(entry.id) ?? []),
          appealSealed: appealSealedByEntry.get(entry.id) ?? 0,
          quorum,
          threshold,
        });
        if (gate !== "rank") {
          if (gate === "appeal") {
            const assigned = await tx.ballot.count({ where: { entryId: entry.id, appeal: true } });
            if (assigned === 0) await openAppeal(tx, entry, week, quorum, calibrationCount, ctx);
          }
          await holdWave(tx, entry, week, gate === "quorum" ? "QUORUM" : "APPEAL");
          held += 1;
          continue;
        }
        const chamber = verdicts.find((verdict) => verdict.college === "CHAMBER")?.place ?? null;
        ready.push({
          id: entry.id,
          themeId: entry.themeId,
          category: entry.category,
          sex: entry.sex,
          athleteId: entry.athleteId,
          createdAt: entry.createdAt,
          place,
          chamberPlace: chamber,
          verdicts,
        });
      }

      const groups = new Map<string, Ready[]>();
      for (const wave of ready) {
        const key = `${wave.themeId}:${wave.category}:${wave.sex}`;
        const list = groups.get(key) ?? [];
        list.push(wave);
        groups.set(key, list);
      }

      let placed = 0;
      for (const waves of groups.values()) {
        const sample = waves[0]!;
        const board = await tx.board.upsert({
          where: {
            themeId_category_sex: { themeId: sample.themeId, category: sample.category, sex: sample.sex },
          },
          create: { themeId: sample.themeId, category: sample.category, sex: sample.sex },
          update: {},
        });
        const proposed: ProposedVerdict[] = waves.map((wave) => ({
          id: wave.id,
          place: wave.place,
          chamberPlace: wave.chamberPlace,
          createdAt: wave.createdAt.getTime(),
        }));
        for (const wave of verdictInsertionOrder(proposed)) {
          const source = waves.find((item) => item.id === wave.id)!;
          const count = await tx.placement.count({ where: { boardId: board.id } });
          const place = Math.min(Math.max(wave.place, 1), count + 1);
          await insertAt(tx, board.id, wave.id, source.athleteId, place);
          await tx.collegeVerdict.createMany({
            data: source.verdicts.map((verdict) => ({
              entryId: wave.id,
              college: verdict.college,
              place: verdict.place,
              ballots: verdict.ballots,
              runId: run.id,
            })),
          });
          placed += 1;
        }
      }

      await tx.verdictRun.update({ where: { id: run.id }, data: { placed, held } });
      const published = await tx.weekRoot.findUnique({
        where: { isoYear_isoWeek: { isoYear: week.isoYear, isoWeek: week.isoWeek } },
        select: { id: true },
      });
      if (!published) {
        const hashes = await tx.voteCommit.findMany({
          where: { isoYear: week.isoYear, isoWeek: week.isoWeek },
          select: { payloadHash: true },
        });
        await tx.weekRoot.create({
          data: {
            isoYear: week.isoYear,
            isoWeek: week.isoWeek,
            merkleRoot: merkleRoot(hashes.map((row) => row.payloadHash)),
            voteCount: hashes.length,
          },
        });
      }
      return { placed, held };
    },
    { timeout: 60_000 },
  );
}

async function holdWave(
  tx: Tx,
  entry: { id: string; rolloverCount: number; lastHoldYear: number | null; lastHoldWeek: number | null },
  week: { isoYear: number; isoWeek: number },
  reason: "QUORUM" | "APPEAL",
) {
  const sameWeek = entry.lastHoldYear === week.isoYear && entry.lastHoldWeek === week.isoWeek;
  await tx.entry.update({
    where: { id: entry.id },
    data: {
      holdReason: reason,
      lastHoldYear: week.isoYear,
      lastHoldWeek: week.isoWeek,
      rolloverCount: sameWeek ? entry.rolloverCount : { increment: 1 },
    },
  });
}

async function openAppeal(
  tx: Tx,
  entry: { id: string; athleteId: string; themeId: string; category: CategoryCode; sex: Sex },
  week: { isoYear: number; isoWeek: number },
  quorum: number,
  calibrationCount: Map<string, { total: number; hits: number }>,
  ctx: Awaited<ReturnType<typeof loadJudgeContext>>,
) {
  const users = await tx.user.findMany({
    where: { bannedAt: null },
    select: {
      id: true,
      role: true,
      collegeOverride: true,
      seats: { select: { college: true } },
      athlete: { select: { id: true } },
    },
  });
  const already = new Set(
    (
      await tx.ballot.findMany({
        where: { entryId: entry.id },
        select: { userId: true },
      })
    ).map((row) => row.userId),
  );
  const candidates = users.flatMap((user) => {
    const athleteId = user.athlete?.id ?? null;
    const college = resolveCollege({
      role: user.role,
      seatedChamber: user.seats.some((seat) => seat.college === "CHAMBER"),
      seatedRanked: user.seats.some((seat) => seat.college === "RANKED"),
      upper: athleteId != null && ctx.upperAthleteIds.has(athleteId),
      enteredThisSeason: athleteId != null && ctx.enteredAthleteIds.has(athleteId),
      override: user.collegeOverride,
      hasAthlete: athleteId != null,
    });
    if (!college || already.has(user.id)) return [];
    const forbidden = forbiddenForAthlete(athleteId, ctx.athletes, ctx.entryEditions);
    if (
      !canJudgeEntry({
        judgeAthleteId: athleteId,
        entryAthleteId: entry.athleteId,
        edition: editionKey(entry.category, entry.sex),
        forbidden,
      })
    ) {
      return [];
    }
    const stats = calibrationCount.get(user.id) ?? { total: 0, hits: 0 };
    const eye = eyeScore({ meanDeviation: null, calibrationHits: stats.hits, calibrations: stats.total });
    return [{ userId: user.id, eye, level: eyeLevel(eye), college }];
  });
  const panel = appealPanel(candidates, already, quorum);
  if (panel.ids.length === 0) return;
  await tx.entry.update({ where: { id: entry.id }, data: { appealFallback: panel.fallback } });
  const board = await tx.board.findFirst({
    where: { themeId: entry.themeId, category: entry.category, sex: entry.sex },
    include: { placements: { orderBy: { place: "asc" }, select: { entryId: true } } },
  });
  const boardEntryIds = (board?.placements ?? []).map((row) => row.entryId).filter((id) => id !== entry.id);
  const collegeByUser = new Map(candidates.map((candidate) => [candidate.userId, candidate.college]));
  await tx.ballot.createMany({
    data: panel.ids.flatMap((userId) => {
      const college = collegeByUser.get(userId);
      if (!college) return [];
      return [
        {
          userId,
          entryId: entry.id,
          college,
          isoYear: week.isoYear,
          isoWeek: week.isoWeek,
          boardEntryIds,
          lo: 0,
          hi: boardEntryIds.length,
          appeal: true,
        },
      ];
    }),
    skipDuplicates: true,
  });
}

/** Shift from the worst place so the (board, place) unique key never collides. */
async function insertAt(tx: Tx, boardId: string, entryId: string, athleteId: string, place: number) {
  const current = await tx.placement.findMany({ where: { boardId }, orderBy: { place: "desc" } });
  for (const row of current) {
    if (row.place >= place) {
      await tx.placement.update({ where: { id: row.id }, data: { place: row.place + 1 } });
    }
  }
  await tx.placement.create({ data: { boardId, entryId, athleteId, place } });
  await tx.entry.update({ where: { id: entryId }, data: { status: "PLACED", holdReason: "NONE" } });
}
