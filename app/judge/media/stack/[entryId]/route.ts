import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { demoClipFor } from "@/lib/demo-clips";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Not found", { status: 404 });
  const { entryId } = await params;
  const ballot = await prisma.ballot.findFirst({
    where: { userId: session.user.id, entryId },
    select: { id: true },
  });
  if (!ballot) return new Response("Not found", { status: 404 });
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
