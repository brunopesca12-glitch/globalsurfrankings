import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { castKeyVote, createCalibrationDuel, markCalibrationPro } from "@/app/actions/calibration";
import { auth } from "@/lib/auth";
import { themeBySlug } from "@/lib/catalogue";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Calibration key" };

const field = "mt-1 w-full border border-line bg-white px-3 py-2";

export default async function CalibrationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, calibrationPro: true },
  });
  if (!me || (me.role !== "ADMIN" && !me.calibrationPro)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12">
        <h1 className="font-serif text-5xl">Desk and pros</h1>
        <p className="mt-4">This account does not lock the calibration key.</p>
      </div>
    );
  }
  const query = await searchParams;
  const [waves, duels, pros] = await Promise.all([
    prisma.entry.findMany({
      where: { status: "PLACED", placement: { isNot: null } },
      include: { athlete: true, theme: true, placement: true },
      orderBy: [{ theme: { slug: "asc" } }, { placement: { place: "asc" } }],
      take: 80,
    }),
    prisma.calibrationDuel.findMany({
      include: {
        leftEntry: { include: { athlete: true, theme: true, placement: true } },
        rightEntry: { include: { athlete: true, theme: true, placement: true } },
        votes: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.user.findMany({ where: { calibrationPro: true }, select: { email: true, name: true } }),
  ]);

  function label(entry: (typeof waves)[number]) {
    const title = themeBySlug(entry.theme.slug)?.name ?? entry.theme.name;
    return `${entry.placement ? `#${entry.placement.place} ` : ""}${entry.athlete.displayName} · ${title}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/admin/judge" className="hover:text-ocean">
          Desk
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-5xl">Calibration key</h1>
      <p className="mt-4 max-w-2xl text-ink/75">
        Bruno and two or three pros judge the same pairs. Two agreeing votes lock the answer. A split stays open until
        someone breaks it. About one card in four of the judge deck uses a locked pair, and a guest plays three before signing up.
      </p>
      {query.saved === "created" ? <p className="mt-4 text-sm text-ocean">Pair added.</p> : null}
      {query.saved === "vote" ? <p className="mt-4 text-sm text-ocean">Vote saved. The key updates when the pros agree.</p> : null}
      {query.saved === "pro" ? <p className="mt-4 text-sm text-ocean">Pro list updated.</p> : null}
      {query.error ? <p className="mt-4 text-sm text-stamp">That could not be saved.</p> : null}

      {me.role === "ADMIN" ? (
        <form action={markCalibrationPro} className="mt-8 flex flex-wrap items-end gap-2 border border-line bg-white px-4 py-4">
          <label className="text-sm">
            Pro email
            <input className={field} name="email" type="email" required placeholder="name@gsr.surf" />
          </label>
          <input type="hidden" name="on" value="yes" />
          <button className="min-h-11 bg-ocean px-4 text-paper" type="submit">
            Add pro
          </button>
        </form>
      ) : null}
      {pros.length > 0 ? (
        <p className="mt-3 text-sm text-ink/70">Pros: {pros.map((pro) => pro.name).join(", ")}</p>
      ) : (
        <p className="mt-3 text-sm text-ink/60">No pros marked yet. The desk can vote.</p>
      )}

      <form action={createCalibrationDuel} className="mt-10 space-y-3">
        <h2 className="font-serif text-3xl">New duel</h2>
        <label className="block text-sm">
          Wave A
          <select className={field} name="left" required>
            {waves.map((wave) => (
              <option key={wave.id} value={wave.id}>
                {label(wave)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Wave B
          <select className={field} name="right" required>
            {waves.map((wave) => (
              <option key={wave.id} value={wave.id}>
                {label(wave)}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 bg-ocean px-4 text-paper" type="submit">
          Add the pair
        </button>
      </form>

      <ul className="mt-10 space-y-4">
        {duels.map((duel) => (
          <li key={duel.id} className="border border-line bg-white px-4 py-4">
            <p>
              A · {label(duel.leftEntry)}
            </p>
            <p className="mt-1">
              B · {label(duel.rightEntry)}
            </p>
            <p className="mt-2 text-sm text-ink/70">
              {duel.higher ? `Key locked: ${duel.higher === "LEFT" ? "A" : "B"} goes higher.` : "Key open."}{" "}
              {duel.votes.length} vote{duel.votes.length === 1 ? "" : "s"}.
            </p>
            <div className="mt-3 flex gap-2">
              <form action={castKeyVote}>
                <input type="hidden" name="duelId" value={duel.id} />
                <input type="hidden" name="higher" value="LEFT" />
                <button className="min-h-11 border border-line px-3" type="submit">
                  A goes higher
                </button>
              </form>
              <form action={castKeyVote}>
                <input type="hidden" name="duelId" value={duel.id} />
                <input type="hidden" name="higher" value="RIGHT" />
                <button className="min-h-11 border border-line px-3" type="submit">
                  B goes higher
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
