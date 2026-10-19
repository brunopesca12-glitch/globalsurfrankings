import { playbackFor } from "@/lib/playback";

/**
 * Plays a ballot wave without printing the stored URL. Demo links carry a
 * slug in the path; the ballot page points at a same-origin redirect instead.
 */
export function BlindWave({
  mediaHref,
  url,
  title,
}: {
  mediaHref: string;
  url: string;
  title: string;
}) {
  const playback = playbackFor(url);
  if (playback.kind === "embed") {
    return (
      <div className="aspect-video overflow-hidden bg-ocean">
        <iframe
          className="h-full w-full"
          src={playback.src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (playback.kind === "file") {
    return (
      <div className="aspect-video overflow-hidden bg-ocean">
        <video className="h-full w-full" controls playsInline preload="metadata" src={mediaHref}>
          <a href={mediaHref}>Play {title}</a>
        </video>
      </div>
    );
  }
  return (
    <a href={mediaHref} className="flex aspect-video flex-col items-center justify-center gap-3 bg-ocean text-paper">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-paper/50 text-2xl">▶</span>
      <span className="px-6 text-center text-sm text-paper/80">Open this wave</span>
    </a>
  );
}
