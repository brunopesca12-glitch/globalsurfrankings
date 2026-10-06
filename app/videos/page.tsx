import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_LABEL } from "@/lib/category";
import { listVideos } from "@/lib/data";
import { environmentLabel, ordinal } from "@/lib/format";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const query = await searchParams;
  const videos = await listVideos();
  const themes = [...new Map(videos.map((video) => [video.theme.slug, video.theme.name])).entries()];
  const selected = themes.some(([slug]) => slug === query.theme) ? query.theme : undefined;
  const visible = selected ? videos.filter((video) => video.theme.slug === selected) : videos;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Watch</p>
      <h1 className="mt-2 font-serif text-5xl">Videos</h1>
      <p className="mt-4 max-w-2xl text-ink/80">
        Every wave entered on the circuit. Open a card to watch it, with the athlete and the event beside the player.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/videos" className={`border px-3 py-1 ${selected ? "border-line" : "border-ocean bg-ocean text-paper"}`}>
          All
        </Link>
        {themes.map(([slug, name]) => (
          <Link
            key={slug}
            href={`/videos?theme=${slug}`}
            className={`border px-3 py-1 ${selected === slug ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {name}
          </Link>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-10 border border-line bg-white px-4 py-8 text-ink/70">
          No waves here yet.{" "}
          <Link href="/enter" className="text-ocean">
            Enter a wave
          </Link>{" "}
          to put the first video up.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((video) => (
            <li key={video.id}>
              <Link href={`/videos/${video.id}`} className="block border border-line bg-white hover:border-ocean">
                <div className="relative flex aspect-video items-center justify-center bg-ocean text-paper">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-paper/50 text-xl">
                    ▶
                  </span>
                  {video.placement ? (
                    <span className="absolute left-3 top-3 bg-paper px-2 py-0.5 text-xs uppercase tracking-wider text-ocean">
                      {ordinal(video.placement.place)}
                    </span>
                  ) : null}
                </div>
                <div className="px-3 py-3">
                  <p className="font-medium">{video.athlete.displayName}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {video.theme.name} · {CATEGORY_LABEL[video.category]} · {environmentLabel(video.environment)}
                  </p>
                  {video.spot ? <p className="mt-1 text-xs uppercase tracking-wider text-ink/50">{video.spot}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
