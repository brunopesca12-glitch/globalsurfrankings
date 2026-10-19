import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Temporary desk probe. Removed after the invite failure is identified. */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ ok: false, reason: "auth" });
  }
  try {
    const token = randomBytes(18).toString("hex");
    const row = await prisma.judgeInvite.create({
      data: {
        token,
        college: "CHAMBER",
        email: "chamber.guest@gsr.surf",
        note: "Seats the Chamber of Champions.",
      },
    });
    return Response.json({ ok: true, token: row.token });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, message: message.slice(0, 400) });
  }
}
