import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadEyeSnapshot } from "@/lib/eye-record";
import { ensureWeeklyQueue } from "@/lib/judge-queue";

export const metadata: Metadata = { title: "Eye" };

export default async function EyePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/eye");
  const queue = await ensureWeeklyQueue(session.user.id);
  const eye = await loadEyeSnapshot(session.user.id, queue.accuracy?.mean ?? null, queue.accuracy?.verdicts ?? 0);

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/judge" className="hover:text-ocean">
          Judge
        </Link>
      </p>
      <h1 className="mt-3 font-serif text-6xl leading-none">{eye.score}</h1>
      <p className="mt-2 font-serif text-3xl text-gold">{eye.level}</p>
      <p className="mt-4 text-ink/75">
        The eye score mixes how close you sit to Monday with your calibration hits. Season points still come only from the Monday verdict.
      </p>
      <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
        <div className="border border-line bg-white px-3 py-3">
          <dt className="text-xs uppercase tracking-wider text-ink/55">Daily streak</dt>
          <dd className="mt-1 font-serif text-3xl">{eye.daily}</dd>
          <p className="mt-1 text-ink/60">One Flat Day freeze each week.</p>
        </div>
        <div className="border border-line bg-white px-3 py-3">
          <dt className="text-xs uppercase tracking-wider text-ink/55">Weekly streak</dt>
          <dd className="mt-1 font-serif text-3xl">{eye.weekly}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-ink/60">
        Shorebreak, Lineup, Channel, Tower, Golden Eye.
        {eye.calibrations > 0 ? ` Calibration ${eye.calibrationHits}/${eye.calibrations}.` : ""}
      </p>
      <ul className="mt-6 space-y-2">
        {eye.badges.length === 0 ? <li className="text-sm text-ink/55">Badges appear as you judge.</li> : null}
        {eye.badges.map((badge) => (
          <li key={badge.id} className="border border-line bg-white px-3 py-3">
            <p className="font-serif text-2xl">{badge.name}</p>
            <p className="text-sm text-ink/70">{badge.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
