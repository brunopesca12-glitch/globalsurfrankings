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

/** How a stored wave URL should play. Demo links that are not files stay links. */
export function playbackFor(url: string): Playback {
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
  if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return { kind: "file" };
  return { kind: "link" };
}
