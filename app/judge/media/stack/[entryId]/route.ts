import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { demoClipFor } from "@/lib/demo-clips";
import { prisma } from "@/lib/db";
import { serveStoredVideo } from "@/lib/serve-video";

export async function GET(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Not found", { status: 404 });
  const { entryId } = await params;
  const ballot = await prisma.ballot.findFirst({
    where: { userId: session.user.id, entryId },
    select: { id: true, entry: { select: { videoUrl: true } } },
  });
  if (!ballot) return new Response("Not found", { status: 404 });
  const served = await serveStoredVideo(ballot.entry.videoUrl, request.headers.get("range")).catch(() => null);
  if (served) return served;
  const clip = demoClipFor(entryId);
  const bytes = await readFile(path.join(process.cwd(), "public", "demo-waves", clip)).catch(() => null);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
