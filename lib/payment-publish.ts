import { SEASON_2027, SEASON_SLUGS } from "@/lib/catalogue";
import type { CategoryCode } from "@/lib/category";
import { prisma } from "@/lib/db";
import {
  buildPublication,
  type OrderBallot,
  type OrderPlacement,
  type Publication,
} from "@/lib/payment-orders";

/**
 * Reads verdicts and registered wallets and publishes payment orders.
 * It does not sign, transfer, or call a payments API.
 */
export async function loadPublication(): Promise<Publication> {
  const themes = await prisma.theme.findMany({
    where: { season: { vintage: SEASON_2027.vintage }, slug: { in: [...SEASON_SLUGS] } },
    select: { id: true, slug: true, name: true },
  });
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));
  const themeIds = themes.map((theme) => theme.id);

  const [placed, entrants, ballots] = await Promise.all([
    prisma.placement.findMany({
      where: { entry: { themeId: { in: themeIds }, status: "PLACED" } },
      include: { athlete: true, entry: true },
    }),
    prisma.entry.findMany({
      where: { themeId: { in: themeIds }, status: { in: ["SUBMITTED", "PLACED"] } },
      select: { themeId: true, category: true, sex: true },
    }),
    prisma.ballot.findMany({
      where: {
        status: "SEALED",
        college: { in: ["CHAMBER", "RANKED"] },
        entry: { themeId: { in: themeIds } },
      },
      include: { user: { include: { athlete: true } } },
    }),
  ]);

  const placements: OrderPlacement[] = [];
  for (const row of placed) {
    const theme = themeById.get(row.entry.themeId);
    if (!theme) continue;
    placements.push({
      entryId: row.entryId,
      athleteId: row.athleteId,
      displayName: row.athlete.displayName,
      themeSlug: theme.slug,
      themeName: theme.name,
      category: row.entry.category,
      sex: row.entry.sex,
      place: row.place,
      isoYear: row.entry.isoYear,
      isoWeek: row.entry.isoWeek,
      walletNetwork: row.athlete.walletNetwork,
      walletAddress: row.athlete.walletAddress,
    });
  }

  const fieldCounts = new Map<string, number>();
  for (const entry of entrants) {
    const theme = themeById.get(entry.themeId);
    if (!theme) continue;
    const key = `${theme.slug}:${entry.category}:${entry.sex}`;
    fieldCounts.set(key, (fieldCounts.get(key) ?? 0) + 1);
  }

  const judgeBallots: OrderBallot[] = ballots.map((ballot) => ({
    userId: ballot.userId,
    displayName: judgeLabel(ballot.user),
    college: ballot.college as "CHAMBER" | "RANKED",
    isoYear: ballot.isoYear,
    isoWeek: ballot.isoWeek,
    walletNetwork: ballot.user.athlete?.walletNetwork ?? null,
    walletAddress: ballot.user.athlete?.walletAddress ?? null,
  }));

  return buildPublication({
    placements,
    fields: [...fieldCounts.entries()].map(([key, count]) => {
      const [themeSlug, category, sex] = key.split(":");
      return {
        themeSlug: themeSlug ?? "",
        category: category as CategoryCode,
        sex: sex === "W" ? "W" : "M",
        entrants: count,
      };
    }),
    ballots: judgeBallots,
  });
}

function judgeLabel(user: {
  name: string;
  judgeNamePublic: boolean;
  athlete: { displayName: string } | null;
}): string {
  if (user.athlete?.displayName.trim()) return user.athlete.displayName.trim();
  if (user.judgeNamePublic && user.name.trim()) return user.name.trim();
  return "Judge";
}
