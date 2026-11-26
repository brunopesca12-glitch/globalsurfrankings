import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return new Response("Not found", { status: 404 });
  const { id } = await params;
  const frame = await prisma.entryKeyframe.findUnique({ where: { id }, select: { bytes: true } });
  if (!frame) return new Response("Not found", { status: 404 });
  return new Response(frame.bytes, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" },
  });
}
