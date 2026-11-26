import { prisma } from "@/lib/db";
import { VERDICT_FROM, sendVerdictEmail, verdictLetter } from "@/lib/mailer";

export function cronAuthorized(authorization: string | null, secret: string | undefined): boolean {
  const key = secret?.trim() ?? "";
  if (!key) return false;
  const header = authorization?.trim() ?? "";
  return header === `Bearer ${key}`;
}

/** Monday in America/Sao_Paulo. 09:00 there is 12:00 UTC. */
export function isSaoPauloMonday(now: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(now);
  return weekday.startsWith("Mon");
}

export async function notifyMondayVerdict(origin: string): Promise<{
  sent: number;
  failed: number;
  skipped: "not_configured" | "none" | null;
  from: string;
}> {
  const run = await prisma.verdictRun.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      verdicts: {
        include: {
          entry: {
            include: {
              placement: { select: { place: true } },
              theme: { select: { name: true, slug: true } },
              athlete: { include: { user: { select: { email: true, name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!run || run.placed < 1) return { sent: 0, failed: 0, skipped: "none", from: VERDICT_FROM };

  const byEmail = new Map<string, { name: string; lines: { place: number; title: string }[] }>();
  const seen = new Set<string>();
  for (const verdict of run.verdicts) {
    if (seen.has(verdict.entryId)) continue;
    seen.add(verdict.entryId);
    const place = verdict.entry.placement?.place;
    if (!place) continue;
    const email = verdict.entry.athlete.user.email;
    const current = byEmail.get(email) ?? { name: verdict.entry.athlete.user.name, lines: [] };
    current.lines.push({ place, title: verdict.entry.theme.name });
    byEmail.set(email, current);
  }
  if (byEmail.size === 0) return { sent: 0, failed: 0, skipped: "none", from: VERDICT_FROM };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) return { sent: 0, failed: 0, skipped: "not_configured", from: VERDICT_FROM };

  const revealUrl = `${origin.replace(/\/$/, "")}/verdict`;
  let sent = 0;
  let failed = 0;
  for (const [email, athlete] of byEmail) {
    const letter = verdictLetter({ name: athlete.name, lines: athlete.lines, revealUrl });
    const result = await sendVerdictEmail({ apiKey, to: email, letter });
    if (result.sent) sent += 1;
    else failed += 1;
  }
  return { sent, failed, skipped: null, from: VERDICT_FROM };
}
