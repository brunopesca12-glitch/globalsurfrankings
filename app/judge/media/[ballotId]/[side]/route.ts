import { auth } from "@/lib/auth";
import { probeInsertion } from "@/lib/binary-insertion";
import { prisma } from "@/lib/db";
import { respondWithVideo } from "@/lib/judge-media";

export async function GET(request: Request, { params }: { params: Promise<{ ballotId: string; side: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Not found", { status: 404 });
  const { ballotId, side } = await params;
  if (side !== "drawn" && side !== "board") return new Response("Not found", { status: 404 });

  const ballot = await prisma.ballot.findFirst({
    where: { id: ballotId, userId: session.user.id },
    select: { lo: true, hi: true, boardEntryIds: true, entry: { select: { videoUrl: true } } },
  });
  if (!ballot) return new Response("Not found", { status: 404 });
  let videoUrl = ballot.entry.videoUrl;
  if (side === "board") {
    const probe = probeInsertion({ lo: ballot.lo, hi: ballot.hi });
    if (probe.kind !== "probe") return new Response("Not found", { status: 404 });
    const probeEntryId = ballot.boardEntryIds[probe.index];
    if (!probeEntryId) return new Response("Not found", { status: 404 });
    const probeEntry = await prisma.entry.findUnique({ where: { id: probeEntryId }, select: { videoUrl: true } });
    if (!probeEntry) return new Response("Not found", { status: 404 });
    videoUrl = probeEntry.videoUrl;
  }
  return respondWithVideo(videoUrl, request, `${ballotId}:${side}`);
}
