import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureWeeklyQueue } from "@/lib/judge-queue";

export const dynamic = "force-dynamic";

/** Temporary production diagnostic. Removed once the signed-in crash is identified. */
async function readSession() {
  try {
    return await auth();
  } catch (error) {
    return { failed: error } as const;
  }
}

export async function GET() {
  const session = await readSession();
  if (session && "failed" in session) {
    return NextResponse.json({ signedIn: false, authFailed: true, message: messageOf(session.failed) });
  }
  if (!session?.user?.id) return NextResponse.json({ signedIn: false });
  try {
    const judge = await ensureWeeklyQueue(session.user.id);
    return NextResponse.json({
      signedIn: true,
      college: judge.college,
      pending: judge.pending,
      sealed: judge.sealed,
      athlete: judge.athlete,
    });
  } catch (error) {
    const err = error as { code?: string; name?: string; meta?: unknown };
    return NextResponse.json({
      signedIn: true,
      failed: true,
      name: err.name ?? "Error",
      code: typeof err.code === "string" ? err.code : null,
      message: messageOf(error),
    });
  }
}

function messageOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 1500);
}
