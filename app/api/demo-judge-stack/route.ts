import { auth } from "@/lib/auth";
import { ensureDemoJudgeStack } from "@/lib/demo-judge-stack";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Desk-only trigger for scripts/add-demo-judge-stack.ts. Additive. */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "desk_only" }, { status: 401 });
  }
  try {
    const result = await ensureDemoJudgeStack();
    return Response.json(result, { status: result.ok ? 200 : 404 });
  } catch {
    return Response.json({ error: "stack_unavailable" }, { status: 500 });
  }
}
