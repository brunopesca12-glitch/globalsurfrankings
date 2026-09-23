import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WavePlayer } from "@/components/WavePlayer";
import { CATEGORY_LABEL } from "@/lib/category";
import { getVideo } from "@/lib/data";
import { environmentLabel, ordinal, verificationLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Watch" };

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();
  const title = `${video.athlete.displayName} · ${video.theme.name}`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/videos" className="hover:text-ocean">
          Videos
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{video.athlete.displayName}</h1>
      <p className="mt-2 text-ink/75">
        {video.theme.name} · {CATEGORY_LABEL[video.category]} · {environmentLabel(video.environment)}
        {video.placement ? ` · ${ordinal(video.placement.place)}` : " · waiting for a place"}
        {video.spot ? ` · ${video.spot}` : ""}
      </p>
      <div className="mt-6 border border-line">
        <WavePlayer url={video.videoUrl} title={title} />
      </div>
      <p className="mt-4 text-sm text-ink/70">
        <Link href={`/athlete/${video.athlete.slug}`} className="text-ocean">
          {video.athlete.displayName}
        </Link>
        <span className="mx-2 text-ink/40">·</span>
        {verificationLabel(video.athlete.verification)}
        <span className="mx-2 text-ink/40">·</span>
        <Link
          href={`/board/${video.theme.slug}?category=${video.category}&sex=${video.sex}`}
          className="text-ocean"
        >
          World board
        </Link>
      </p>
    </div>
  );
}
