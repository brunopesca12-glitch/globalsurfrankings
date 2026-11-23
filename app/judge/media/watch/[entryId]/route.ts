import { auth } from "@/lib/auth";
import { isCurrentModality } from "@/lib/comparison";
import { prisma } from "@/lib/db";
import { respondWithVideo } from "@/lib/judge-media";

export async function GET(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Not found", { status: 404 });
  const { entryId } = await params;
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: {
      id: true,
      videoUrl: true,
      themeId: true,
      category: true,
      sex: true,
      theme: { select: { slug: true } },
    },
  });
  if (!entry || !isCurrentModality(entry.theme.slug, entry.category)) return new Response("Not found", { status: 404 });
  const ballot = await prisma.ballot.findFirst({
    where: {
      userId: session.user.id,
      entry: { themeId: entry.themeId, category: entry.category, sex: entry.sex },
    },
    select: { id: true },
  });
  if (!ballot) return new Response("Not found", { status: 404 });
  return respondWithVideo(entry.videoUrl, request, entry.id);
}
