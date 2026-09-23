import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntryForm } from "@/components/Forms";
import { auth } from "@/lib/auth";
import { SEASON_2027, themeBySlug, themesFor } from "@/lib/catalogue";
import { CATEGORY_LABEL, categoryFor, parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/iso-week";
import { themeIsOpen } from "@/lib/entry-rules";

export const metadata: Metadata = { title: "Enter a wave" };

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
        One ocean wave per ISO week, into an event of your category. A pool wave does not spend that shot and records the
        US$ 20 toll as a demonstration — nothing is charged. The video is a URL. Current ISO week: {week.isoYear}-W
        {String(week.isoWeek).padStart(2, "0")}.
      </p>
      <div className="mt-8">
        <EntryForm themes={themes} dutyCurrent={athlete.judgingDutyCurrent} oceanUsed={oceanUsed} />
      </div>
      <p className="mt-6 text-xs text-ink/50">Reference event: {themeBySlug("best-barrel")?.name}.</p>
    </div>
  );
}
