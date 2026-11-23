import { demoClipFor, isUnplayableHost } from "@/lib/demo-clips";
import { playbackFor } from "@/lib/playback";

export function WavePlayer({ url, title }: { url: string; title: string }) {
  const playback = playbackFor(url);
  const fileSrc = isUnplayableHost(url) ? `/demo-waves/${demoClipFor(url)}` : url;
  return (
    <div className="aspect-video overflow-hidden bg-ocean">
      {playback.kind === "file" ? (
        <video className="h-full w-full" controls playsInline preload="metadata" src={fileSrc}>
          <a href={fileSrc}>Play {title}</a>
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
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-paper">
          <p className="font-serif text-2xl">{title}</p>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center border border-paper/50 px-4">
            Open this wave in a new tab
          </a>
          <p className="max-w-sm text-sm text-paper/80">
            This link leaves the site. It has to be public. A private file, such as a closed Google Drive link, will not play.
          </p>
        </div>
      ) : null}
    </div>
  );
}
