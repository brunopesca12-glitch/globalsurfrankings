import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { respondWithVideo } from "@/lib/judge-media";

export async function GET(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Not found", { status: 404 });
  const { entryId } = await params;
  const ballot = await prisma.ballot.findFirst({
    where: { userId: session.user.id, entryId },
    select: { id: true, entry: { select: { videoUrl: true } } },
  });
  if (!ballot) return new Response("Not found", { status: 404 });
  return respondWithVideo(ballot.entry.videoUrl, request, entryId);
}
