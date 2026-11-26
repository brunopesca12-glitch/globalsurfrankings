import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { themeBySlug } from "@/lib/catalogue";
import { demoClipFor, isUnplayableHost } from "@/lib/demo-clips";
import { prisma } from "@/lib/db";
import { ordinal } from "@/lib/format";
import { isoWeek } from "@/lib/iso-week";
import { playbackFor } from "@/lib/playback";
import { mondayCountdown } from "@/lib/season-clock";
import { LineupActions } from "@/components/LineupActions";

function playableSrc(url: string): string | null {
  if (isUnplayableHost(url)) return `/demo-waves/${demoClipFor(url)}`;
  const playback = playbackFor(url);
  return playback.kind === "file" ? url : null;
}

export const metadata: Metadata = { title: "The Lineup" };

export default async function LineupPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const week = isoWeek(new Date());
  const follows = userId
    ? await prisma.follow.findMany({ where: { followerId: userId }, select: { athleteId: true } })
    : [];
  const friendIds = follows.map((row) => row.athleteId);

  const [placed, locked, mine] = await Promise.all([
    prisma.entry.findMany({
      where: { status: "PLACED", placement: { isNot: null } },
      include: {
        athlete: true,
        theme: true,
        placement: true,
        _count: { select: { shakas: true } },
        shakas: { where: { userId: userId ?? "__none__" }, select: { id: true } },
      },
      orderBy: { placement: { createdAt: "desc" } },
      take: 30,
    }),
    friendIds.length
      ? prisma.entry.findMany({
          where: {
            athleteId: { in: friendIds },
            status: "SUBMITTED",
            isoYear: week.isoYear,
            isoWeek: week.isoWeek,
          },
          include: { athlete: true, theme: true },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : Promise.resolve([]),
    userId ? prisma.athlete.findUnique({ where: { userId }, select: { id: true } }) : null,
  ]);

  const following = new Set(friendIds);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#07161c] text-[#f4efe6] snap-y snap-mandatory">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#07161c]/80 px-4 py-3 text-xs uppercase tracking-[0.18em] backdrop-blur">
        <Link href="/" className="font-serif text-lg tracking-normal normal-case">
          GSR
        </Link>
        <span className="text-[#e6d3b0]">The Lineup</span>
        <Link href={userId ? "/judge" : "/sign-in"}>{userId ? "Judge" : "Sign in"}</Link>
      </header>

      {locked.map((entry) => (
        <article key={entry.id} className="flex min-h-[100dvh] snap-start flex-col justify-end px-6 pb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[#e6d3b0]">Unlocks Monday</p>
          <h2 className="mt-3 font-serif text-5xl leading-none">{entry.athlete.displayName}</h2>
          <p className="mt-3 text-[#f4efe6]/75">{themeBySlug(entry.theme.slug)?.name ?? entry.theme.name}</p>
          <p className="mt-2 max-w-xs text-sm text-[#f4efe6]/60">{mondayCountdown(new Date())} The clip stays hidden until the verdict.</p>
        </article>
      ))}

      {placed.length === 0 && locked.length === 0 ? (
        <article className="flex min-h-[100dvh] snap-start flex-col justify-end px-6 pb-16">
          <h2 className="font-serif text-5xl leading-none">No verdict yet.</h2>
          <p className="mt-4 max-w-sm text-[#f4efe6]/75">Waves appear here after Monday. Until then they stay blind.</p>
        </article>
      ) : null}

      {placed.map((entry) => {
        const title = themeBySlug(entry.theme.slug)?.name ?? entry.theme.name;
        const shakaOn = entry.shakas.length > 0;
        const src = playableSrc(entry.videoUrl);
        return (
          <article key={entry.id} className="relative flex min-h-[100dvh] snap-start flex-col justify-end">
            {src ? (
              <video className="absolute inset-0 h-full w-full object-cover" src={src} muted playsInline loop autoPlay preload="metadata" />
            ) : (
              <div className="absolute inset-0 bg-[#0d3a48]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07161c] via-[#07161c]/20 to-transparent" />
            <div className="relative px-5 pb-10">
              <p className="text-xs uppercase tracking-[0.22em] text-[#e6d3b0]">
                {entry.placement ? ordinal(entry.placement.place) : ""} · {title}
              </p>
              <h2 className="mt-2 font-serif text-4xl">
                <Link href={`/athlete/${entry.athlete.slug}`}>{entry.athlete.displayName}</Link>
              </h2>
              {entry.spot ? <p className="mt-1 text-sm text-[#f4efe6]/70">{entry.spot}</p> : null}
              <LineupActions
                entryId={entry.id}
                athleteId={entry.athlete.id}
                shakaOn={shakaOn}
                shakaCount={entry._count.shakas}
                following={following.has(entry.athlete.id)}
                self={mine?.id === entry.athlete.id}
                signedIn={userId != null}
                shareHref={`/videos/${entry.id}/share`}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
