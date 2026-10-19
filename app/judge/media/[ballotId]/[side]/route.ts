import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { demoPair } from "@/lib/demo-clips";
import { probeInsertion } from "@/lib/binary-insertion";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ ballotId: string; side: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  const { ballotId, side } = await params;
  if (side !== "drawn" && side !== "board") return new Response("Not found", { status: 404 });

  const ballot = await prisma.ballot.findFirst({
    where: { id: ballotId, userId: session.user.id },
    select: { lo: true, hi: true, boardEntryIds: true },
  });
  if (!ballot) return new Response("Not found", { status: 404 });
  if (side === "board") {
    const probe = probeInsertion({ lo: ballot.lo, hi: ballot.hi });
    if (probe.kind !== "probe") return new Response("Not found", { status: 404 });
    const probeEntryId = ballot.boardEntryIds[probe.index];
    if (!probeEntryId) return new Response("Not found", { status: 404 });
    const probeEntry = await prisma.entry.findUnique({ where: { id: probeEntryId }, select: { id: true } });
    if (!probeEntry) return new Response("Not found", { status: 404 });
  }

  const pair = demoPair(ballotId);
  const clip = side === "drawn" ? pair.drawn : pair.board;
  const file = path.join(process.cwd(), "public", clip.replace(/^\//, ""));
  const bytes = await readFile(file).catch(() => null);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
