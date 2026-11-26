import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_LABEL } from "@/lib/category";
import { THEMES, themeBySlug } from "@/lib/catalogue";
import { listVideos } from "@/lib/data";
import { environmentLabel, ordinal } from "@/lib/format";

export const metadata: Metadata = { title: "Videos" };

const PAGE_SIZE = 24;

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; page?: string }>;
}) {
  const query = await searchParams;
  const videos = await listVideos();
  const themes = THEMES.map((theme) => [theme.slug, theme.name] as const);
  const selected = themes.some(([slug]) => slug === query.theme) ? query.theme : undefined;
  const visible = selected ? videos.filter((video) => video.theme.slug === selected) : videos;
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const requested = Number(query.page);
  const current = Number.isInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  const slice = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const themeQuery = selected ? `&theme=${selected}` : "";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Watch</p>
      <h1 className="mt-2 font-serif text-5xl">Videos</h1>
      <p className="mt-4 max-w-2xl text-ink/80">
        Waves that already have a Monday verdict. Unjudged waves stay off this page.{" "}
        <Link href="/lineup" className="text-ocean">
          The Lineup
        </Link>{" "}
        plays them full screen.
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
          {slice.map((video) => (
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
                    {themeBySlug(video.theme.slug)?.name ?? video.theme.name} · {CATEGORY_LABEL[video.category]} ·{" "}
                    {environmentLabel(video.environment)}
                  </p>
                  {video.spot ? <p className="mt-1 text-xs uppercase tracking-wider text-ink/50">{video.spot}</p> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 ? (
        <nav className="mt-8 flex items-center justify-between text-sm">
          {current > 1 ? (
            <Link href={`/videos?page=${current - 1}${themeQuery}`} className="text-ocean">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <p className="text-ink/60">
            Page {current} of {pages}
          </p>
          {current < pages ? (
            <Link href={`/videos?page=${current + 1}${themeQuery}`} className="text-ocean">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
