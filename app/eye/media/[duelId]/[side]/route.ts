import { prisma } from "@/lib/db";
import { respondWithVideo } from "@/lib/judge-media";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ duelId: string; side: string }> },
) {
  const { duelId, side } = await params;
  if (side !== "left" && side !== "right") return new Response("Not found", { status: 404 });
  const duel = await prisma.calibrationDuel.findFirst({
    where: { id: duelId, higher: { not: null } },
    select: {
      id: true,
      leftEntry: { select: { id: true, videoUrl: true } },
      rightEntry: { select: { id: true, videoUrl: true } },
    },
  });
  if (!duel) return new Response("Not found", { status: 404 });
  const entry = side === "left" ? duel.leftEntry : duel.rightEntry;
  return respondWithVideo(entry.videoUrl, request, `${duel.id}:${side}`);
}
