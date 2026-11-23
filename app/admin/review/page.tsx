import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { clearReview, dismissFlag, removeEntry } from "@/app/actions/review";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { submissionStatus } from "@/lib/submission-check";
import { waveVisionFromEnv } from "@/lib/vision";

export const metadata: Metadata = { title: "Review waves" };

const button = "border border-line px-3 py-2 text-sm";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">Desk only</h1>
        <p className="mt-4">This account does not review waves.</p>
      </div>
    );
  }

  const query = await searchParams;
  const vision = waveVisionFromEnv(process.env);
  const [pending, flags] = await Promise.all([
    prisma.entry.findMany({
      where: { reviewStatus: "PENDING_REVIEW" },
      include: { athlete: true, theme: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.publicationFlag.findMany({
      where: { resolvedAt: null },
      include: { user: true, entry: { include: { athlete: true, theme: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/admin/judge" className="hover:text-ocean">
          Desk
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-5xl">Review waves</h1>
      <p className="mt-4 max-w-2xl text-ink/75">
        A duplicate file is refused at entry. A clear miss on the title is refused too. What lands here was unsure, or
        someone reported that the wave was already posted. There is no automatic check of social networks.
      </p>
      <p className="mt-3 text-sm text-ink/70">
        {vision
          ? `Automatic title check uses ${vision.name}.`
          : "Automatic title check is off. Set OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY. Until then, new waves are marked pending review."}
      </p>
      {query.saved === "cleared" ? <p className="mt-4 text-sm text-ocean">Wave marked checked.</p> : null}
      {query.saved === "flag" ? <p className="mt-4 text-sm text-ocean">Report closed.</p> : null}
      {query.saved === "removed" ? <p className="mt-4 text-sm text-ocean">Wave removed.</p> : null}
      {query.error === "placed" ? (
        <p className="mt-4 text-sm text-stamp">That wave already has a place, so it was left on the board.</p>
      ) : null}
      {query.error === "missing" ? <p className="mt-4 text-sm text-stamp">That wave is not on the site.</p> : null}

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Waiting for a person</h2>
        {pending.length === 0 ? <p className="mt-3 text-sm text-ink/60">Nothing is waiting.</p> : null}
        <ul className="mt-4 space-y-3">
          {pending.map((entry) => {
            const status = submissionStatus(entry);
            return (
              <li key={entry.id} className="border border-line bg-white px-4 py-4">
                <p>
                  <Link href={`/videos/${entry.id}`} className="text-ocean">
                    {entry.theme.name}
                  </Link>
                  <span className="text-ink/50"> · {entry.athlete.displayName}</span>
                </p>
                <p className="mt-1 text-sm text-ink/70">{status.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={clearReview}>
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button className={button} type="submit">
                      Mark checked
                    </button>
                  </form>
                  <form action={removeEntry}>
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button className={button} type="submit">
                      Remove this wave
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Already posted</h2>
        <p className="mt-2 text-sm text-ink/70">
          A surfer or a judge reported that this wave was already on a social network or another platform.
        </p>
        {flags.length === 0 ? <p className="mt-3 text-sm text-ink/60">No open reports.</p> : null}
        <ul className="mt-4 space-y-3">
          {flags.map((flag) => (
            <li key={flag.id} className="border border-line bg-white px-4 py-4">
              <p>
                <Link href={`/videos/${flag.entryId}`} className="text-ocean">
                  {flag.entry.theme.name}
                </Link>
                <span className="text-ink/50"> · {flag.entry.athlete.displayName}</span>
              </p>
              <p className="mt-1 text-sm text-ink/70">
                {flag.user.name}
                {flag.note ? ` — ${flag.note}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={dismissFlag}>
                  <input type="hidden" name="flagId" value={flag.id} />
                  <button className={button} type="submit">
                    Close report
                  </button>
                </form>
                <form action={removeEntry}>
                  <input type="hidden" name="entryId" value={flag.entryId} />
                  <button className={button} type="submit">
                    Remove this wave
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
