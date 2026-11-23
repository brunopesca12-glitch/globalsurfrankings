export type Playback = { kind: "file" } | { kind: "embed"; src: string } | { kind: "link" };

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return fromQuery;
    const parts = url.pathname.split("/").filter(Boolean);
    const embed = parts[0] === "embed" || parts[0] === "shorts" ? parts[1] : null;
    return embed || null;
  }
  return null;
}

/** How a stored wave URL should play. The old demo host is served as a same-origin file. */
export function playbackFor(url: string): Playback {
  if (url.startsWith("/media/entries/") || url.startsWith("/uploads/")) return { kind: "file" };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "link" };
  }
  const youtube = youtubeId(parsed);
  if (youtube) return { kind: "embed", src: `https://www.youtube.com/embed/${youtube}` };
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    if (id) return { kind: "embed", src: `https://player.vimeo.com/video/${id}` };
  }
  if (host === "video.gsr.surf") return { kind: "file" };
  if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(parsed.pathname)) return { kind: "file" };
  return { kind: "link" };
}

/** Judges watch a real file through the blind route. Demo hosts and embeds stay on the stand-in clip. */
export function playsAsFile(url: string): boolean {
  if (url.startsWith("/media/entries/")) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "video.gsr.surf") return false;
  } catch {
    return false;
  }
  return playbackFor(url).kind === "file";
}
