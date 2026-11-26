import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntryForm } from "@/components/Forms";
import { auth } from "@/lib/auth";
import { SEASON_2027, themesFor } from "@/lib/catalogue";
import { CATEGORY_LABEL, categoryFor, parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { ensureWeeklyQueue } from "@/lib/judge-queue";
import { isoWeek } from "@/lib/iso-week";
import { themeIsOpen } from "@/lib/entry-rules";
import { formatUsd } from "@/lib/format";
import { poolFeeCents } from "@/lib/pool-fee";

export const metadata: Metadata = { title: "Enter a wave" };
export const maxDuration = 60;

export default async function EnterPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) redirect("/profile");

  const asOf = parseDateOnly(SEASON_2027.ageAsOf)!;
  const category = categoryFor(athlete.birthDate, asOf);
  const today = new Date().toISOString().slice(0, 10);
  const themes = themesFor(category)
    .filter((theme) => themeIsOpen(theme.finaleOn, today))
    .map((theme) => ({
      slug: theme.slug,
      name: theme.name,
      poolOnly: theme.poolOnly,
      oceanOnly: theme.oceanOnly,
    }));
  const fee = poolFeeCents();
  const queue = await ensureWeeklyQueue(session.user.id);
  const week = isoWeek(new Date());
  const oceanUsed = Boolean(
    await prisma.entry.findFirst({
      where: {
        athleteId: athlete.id,
        environment: "OCEAN",
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
      },
    }),
  );

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{CATEGORY_LABEL[category]}</p>
      <h1 className="mt-2 font-serif text-5xl">Enter a wave</h1>
      <p className="mt-4 text-ink/75">
        One ocean wave per ISO week, into a title of your division. A pool wave does not spend that shot. Entry is free.
        Upload the video file. The same wave cannot be entered twice, and the clip has to fit the title. If the check
        is unsure, the wave still goes in and the desk reviews it. Current ISO week: {week.isoYear}-W
        {String(week.isoWeek).padStart(2, "0")}.
      </p>
      <div className="mt-8">
        <EntryForm
          themes={themes}
          pendingBallots={queue.pending}
          oceanUsed={oceanUsed}
          poolChoiceLabel={fee > 0 ? `Pool · ${formatUsd(fee)}` : "Pool · free"}
          blobUpload={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
        />
      </div>
    </div>
  );
}
