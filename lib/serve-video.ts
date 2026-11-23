import { prisma } from "@/lib/db";
import { playsAsFile } from "@/lib/playback";
import { byteRange, entryMediaId, publicHttpUrl } from "@/lib/video-bytes";

function videoHeaders(mime: string, extra?: Record<string, string>): Headers {
  const headers = new Headers({
    "Content-Type": mime.startsWith("video/") ? mime : "video/mp4",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  }
  return headers;
}

function bytesResponse(bytes: Uint8Array, mime: string, rangeHeader: string | null): Response {
  const range = byteRange(rangeHeader, bytes.byteLength);
  if (range === "invalid") {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${bytes.byteLength}` },
    });
  }
  if (!range) {
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: videoHeaders(mime, { "Content-Length": String(bytes.byteLength) }),
    });
  }
  const slice = bytes.subarray(range.start, range.end + 1);
  return new Response(Buffer.from(slice), {
    status: 206,
    headers: videoHeaders(mime, {
      "Content-Length": String(slice.byteLength),
      "Content-Range": `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
    }),
  });
}

/** Serves a checked video without putting its storage URL in the judge's address bar. */
export async function serveStoredVideo(videoUrl: string, rangeHeader: string | null): Promise<Response | null> {
  if (!playsAsFile(videoUrl)) return null;
  const mediaId = entryMediaId(videoUrl);
  if (mediaId) {
    const media = await prisma.entryMedia.findUnique({ where: { entryId: mediaId } });
    if (!media) return null;
    return bytesResponse(media.bytes, media.mimeType, rangeHeader);
  }
  let current = videoUrl;
  try {
    for (let hop = 0; hop < 4; hop += 1) {
      const url = await publicHttpUrl(current);
      if (!url) return null;
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(25_000),
        headers: rangeHeader ? { Range: rangeHeader } : {},
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        current = new URL(location, url).toString();
        continue;
      }
      if (!response.ok && response.status !== 206) return null;
      const mime = response.headers.get("content-type") ?? "video/mp4";
      if (!mime.startsWith("video/") && !mime.startsWith("application/octet-stream")) return null;
      const headers = videoHeaders(mime.startsWith("video/") ? mime : "video/mp4");
      const length = response.headers.get("content-length");
      if (length) headers.set("Content-Length", length);
      const contentRange = response.headers.get("content-range");
      if (contentRange) headers.set("Content-Range", contentRange);
      return new Response(response.body, { status: response.status, headers });
    }
  } catch {
    return null;
  }
  return null;
}
