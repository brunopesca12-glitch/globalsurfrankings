import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollegeVerdictLine } from "@/components/CollegeVerdict";
import { FlagWave } from "@/components/FlagWave";
import { WavePlayer } from "@/components/WavePlayer";
import { auth } from "@/lib/auth";
import { themeBySlug } from "@/lib/catalogue";
import { CATEGORY_LABEL } from "@/lib/category";
import { collegeVerdictMap, getVideo } from "@/lib/data";
import { environmentLabel, ordinal, verificationLabel } from "@/lib/format";
import { submissionStatus } from "@/lib/submission-check";

export const metadata: Metadata = { title: "Watch" };

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();
  const session = await auth();
  const status = submissionStatus(video);
  const showNote = status.label === "Pending review" || session?.user?.id === video.athlete.userId || session?.user?.role === "ADMIN";
  const verdicts = video.placement ? await collegeVerdictMap([video.id]) : null;
  const titleName = themeBySlug(video.theme.slug)?.name ?? video.theme.name;
  const title = `${video.athlete.displayName} · ${titleName}`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/videos" className="hover:text-ocean">
          Videos
        </Link>
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink/50">Athlete</p>
      <h1 className="mt-1 font-serif text-4xl md:text-5xl">{video.athlete.displayName}</h1>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/50">Title</p>
      <p className="mt-1 text-lg text-ink/80">
        {titleName} · {CATEGORY_LABEL[video.category]} · {environmentLabel(video.environment)}
        {video.placement ? ` · ${ordinal(video.placement.place)}` : " · waiting for a place"}
        {video.spot ? ` · ${video.spot}` : ""}
      </p>
      {showNote ? (
        <p className="mt-4 border border-line bg-white px-3 py-2 text-sm">
          <span className="uppercase tracking-wider text-ink/60">{status.label}</span>
          {status.note ? <span className="mt-1 block text-ink/75">{status.note}</span> : null}
        </p>
      ) : null}
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
      {video.placement ? (
        <CollegeVerdictLine verdicts={verdicts?.get(video.id) ?? []} finalPlace={video.placement.place} />
      ) : null}
      <div className="mt-8 max-w-xl">
        {session?.user ? (
          <FlagWave entryId={video.id} />
        ) : (
          <p className="text-sm text-ink/70">
            <Link href="/sign-in" className="text-ocean">
              Sign in
            </Link>{" "}
            to report a wave that was already posted.
          </p>
        )}
      </div>
    </div>
  );
}
