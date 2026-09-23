import { playbackFor } from "@/lib/playback";

export function WavePlayer({ url, title }: { url: string; title: string }) {
  const playback = playbackFor(url);
  return (
    <div className="aspect-video overflow-hidden bg-ocean">
      {playback.kind === "file" ? (
        <video className="h-full w-full" controls playsInline preload="metadata" src={url}>
          <a href={url}>Play {title}</a>
        </video>
      ) : null}
      {playback.kind === "embed" ? (
        <iframe
          className="h-full w-full"
          src={playback.src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : null}
      {playback.kind === "link" ? (
        <a href={url} className="flex h-full flex-col items-center justify-center gap-3 text-paper">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-paper/50 text-2xl">
            ▶
          </span>
          <span className="px-6 text-center text-sm text-paper/80">Open this wave</span>
        </a>
      ) : null}
    </div>
  );
}
