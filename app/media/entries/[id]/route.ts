import { prisma } from "@/lib/db";
import { serveStoredVideo } from "@/lib/serve-video";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.entry.findUnique({ where: { id }, select: { id: true } });
  if (!entry) return new Response("Not found", { status: 404 });
  const served = await serveStoredVideo(`/media/entries/${id}`, request.headers.get("range"));
  if (!served) return new Response("Not found", { status: 404 });
  return served;
}
