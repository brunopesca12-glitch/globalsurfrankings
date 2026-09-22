"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type JudgeState = { error: string | null; saved: boolean };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function insertAtPlace(_prev: JudgeState, formData: FormData): Promise<JudgeState> {
  const session = await requireAdmin();
  if (!session) return { error: "Somente a mesa publica colocações.", saved: false };

  const entryId = String(formData.get("entryId") ?? "");
  const place = Number(formData.get("place"));
  if (!entryId || !Number.isInteger(place)) return { error: "Colocação inválida.", saved: false };

  try {
    await prisma.$transaction(async (tx) => {
      const entry = await tx.entry.findUnique({ where: { id: entryId } });
      if (!entry || entry.status !== "SUBMITTED") throw new Error("ENTRY");

      const board = await tx.board.upsert({
        where: {
          themeId_category_sex: {
            themeId: entry.themeId,
            category: entry.category,
            sex: entry.sex,
          },
        },
        create: { themeId: entry.themeId, category: entry.category, sex: entry.sex },
        update: {},
      });

      const placements = await tx.placement.findMany({
        where: { boardId: board.id },
        orderBy: { place: "desc" },
      });
      if (place < 1 || place > placements.length + 1) throw new Error("PLACE");

      for (const current of placements) {
        if (current.place >= place) {
          await tx.placement.update({
            where: { id: current.id },
            data: { place: current.place + 1 },
          });
        }
      }

      await tx.placement.create({
        data: {
          boardId: board.id,
          entryId: entry.id,
          athleteId: entry.athleteId,
          place,
        },
      });
      await tx.entry.update({ where: { id: entry.id }, data: { status: "PLACED" } });
    });
  } catch {
    return { error: "Não foi possível inserir essa onda nesse lugar.", saved: false };
  }

  revalidatePath("/admin/julgar");
  revalidatePath("/quadro", "layout");
  revalidatePath("/ranking");
  return { error: null, saved: true };
}

export async function setJudgingDuty(_prev: JudgeState, formData: FormData): Promise<JudgeState> {
  const session = await requireAdmin();
  if (!session) return { error: "Somente a mesa altera o dever de julgar.", saved: false };

  const athleteId = String(formData.get("athleteId") ?? "");
  const current = formData.get("duty") === "on";
  if (!athleteId) return { error: "Atleta ausente.", saved: false };

  await prisma.athlete.update({
    where: { id: athleteId },
    data: { judgingDutyCurrent: current },
  });
  revalidatePath("/admin/julgar");
  return { error: null, saved: true };
}
