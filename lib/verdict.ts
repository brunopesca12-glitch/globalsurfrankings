import type { CategoryCode, College, Prisma, Sex } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/iso-week";
import {
  collegeVerdictsFromBallots,
  finalPlaceFromCollegeVerdicts,
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
        select: { entryId: true, college: true, place: true },
      });
      const byEntry = new Map<string, { college: College; place: number }[]>();
      for (const ballot of sealed) {
        if (ballot.place == null) continue;
        const list = byEntry.get(ballot.entryId) ?? [];
        list.push({ college: ballot.college, place: ballot.place });
        byEntry.set(ballot.entryId, list);
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
      return { placed, held };
    },
    { timeout: 30_000 },
  );
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
  await tx.entry.update({ where: { id: entryId }, data: { status: "PLACED" } });
}
