"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeHashtag } from "@/lib/leaderboard";

export type ProfileState = { error: string | null; saved: boolean };

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  city: z.string().trim().max(80),
  club: z.string().trim().max(80),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/),
  bio: z.string().trim().max(280),
  hashtags: z.string().max(200),
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) return { error: "Sign in to edit your profile.", saved: false };
  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return { error: "The house does not compete.", saved: false };

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    city: String(formData.get("city") ?? ""),
    club: String(formData.get("club") ?? ""),
    country: formData.get("country"),
    bio: String(formData.get("bio") ?? ""),
    hashtags: String(formData.get("hashtags") ?? ""),
  });
  if (!parsed.success) return { error: "Check the fields.", saved: false };

  const hashtags = [...new Set(parsed.data.hashtags.split(",").map(normalizeHashtag).filter(Boolean))].slice(0, 8);

  await prisma.athlete.update({
    where: { id: athlete.id },
    data: {
      displayName: parsed.data.displayName,
      city: parsed.data.city || null,
      club: parsed.data.club || null,
      country: parsed.data.country.toUpperCase(),
      bio: parsed.data.bio || null,
      hashtags,
    },
  });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.displayName },
  });

  revalidatePath("/profile");
  revalidatePath(`/athlete/${athlete.slug}`);
  return { error: null, saved: true };
}
