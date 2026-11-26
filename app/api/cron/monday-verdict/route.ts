import { runMondayVerdict } from "@/lib/verdict";
import { cronAuthorized, isSaoPauloMonday, notifyMondayVerdict } from "@/lib/monday";

export const dynamic = "force-dynamic";

/** Monday 09:00 America/Sao_Paulo. Vercel cron is UTC, so the schedule is 12:00 UTC. */
export async function GET(request: Request) {
  if (!cronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  if (!isSaoPauloMonday(new Date())) {
    return Response.json({ ok: true, skipped: "not_monday" });
  }
  try {
    const result = await runMondayVerdict();
    const origin = new URL(request.url).origin;
    const mail = await notifyMondayVerdict(origin);
    return Response.json({ ok: true, placed: result.placed, held: result.held, mail });
  } catch {
    return Response.json({ ok: false, reason: "verdict_failed" }, { status: 500 });
  }
}
