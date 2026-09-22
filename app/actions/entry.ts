"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { SEASON_2027, themeBySlug } from "@/lib/catalogue";
import { categoryFor } from "@/lib/category";
import { prisma } from "@/lib/db";
import { decideEntry, ENTRY_REJECTION, parseVideoUrl } from "@/lib/entry-rules";
import { isoWeek } from "@/lib/iso-week";

export type EntryState = { error: string | null };

export async function submitEntry(_prev: EntryState, formData: FormData): Promise<EntryState> {
  const session = await auth();
  if (!session?.user) return { error: "Sign in to enter a wave." };

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return { error: "The house does not compete in its own rankings." };

  const season = await prisma.season.findUnique({
    where: { vintage: SEASON_2027.vintage },
    include: { themes: true },
  });
  if (!season) return { error: "Season 2027 is not in the database yet. Run the seed." };

  const theme = season.themes.find((item) => item.slug === String(formData.get("theme") ?? ""));
  const catalogue = theme ? themeBySlug(theme.slug) : undefined;
  if (!theme || !catalogue) return { error: "Choose an event from the season." };

  const environment = formData.get("environment") === "POOL" ? "POOL" : "OCEAN";
  const videoUrl = String(formData.get("videoUrl") ?? "");
  const spot = String(formData.get("spot") ?? "").trim().slice(0, 80);
  const category = categoryFor(athlete.birthDate, season.ageAsOf);
  const now = new Date();
  const week = isoWeek(now);
  const existing = await prisma.entry.findMany({
    where: {
      athleteId: athlete.id,
      environment: "OCEAN",
      isoYear: week.isoYear,
      isoWeek: week.isoWeek,
    },
    select: { isoYear: true, isoWeek: true },
  });

  const decision = decideEntry({
    dutyCurrent: athlete.judgingDutyCurrent,
    environment,
    theme: catalogue,
    category,
    existingOceanWeeks: existing,
    isoYear: week.isoYear,
    isoWeek: week.isoWeek,
    today: now.toISOString().slice(0, 10),
    videoUrl,
  });
  if (!decision.ok) return { error: ENTRY_REJECTION[decision.code] };

  const canonical = parseVideoUrl(videoUrl);
  if (!canonical) return { error: ENTRY_REJECTION.VIDEO };

  await prisma.entry.create({
    data: {
      athleteId: athlete.id,
      themeId: theme.id,
      seasonId: season.id,
      environment,
      videoUrl: canonical,
      spot: spot || null,
      isoYear: week.isoYear,
      isoWeek: week.isoWeek,
      tollCents: decision.tollCents,
      status: "SUBMITTED",
      category,
      sex: athlete.sex,
    },
  });

  revalidatePath("/my-waves");
  revalidatePath(`/board/${theme.slug}`);
  revalidatePath("/ranking");
  redirect("/my-waves");
}
