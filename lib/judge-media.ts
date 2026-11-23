import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { demoClipFor, isStandInHost } from "@/lib/demo-clips";
import { playsAsFile } from "@/lib/playback";
import { serveStoredVideo } from "@/lib/serve-video";
import { isVercelBlobUrl } from "@/lib/video-bytes";

/** Plays a stored wave for a judge without putting a private link in the page. */
export async function respondWithVideo(videoUrl: string, request: Request, demoSeed: string): Promise<Response> {
  if (isVercelBlobUrl(videoUrl)) {
    return NextResponse.redirect(videoUrl, { status: 302 });
  }
  if (playsAsFile(videoUrl)) {
    const served = await serveStoredVideo(videoUrl, request.headers.get("range")).catch(() => null);
    if (served) return served;
  }
  if (isStandInHost(videoUrl)) {
    const clip = demoClipFor(demoSeed);
    const bytes = await readFile(path.join(process.cwd(), "public", "demo-waves", clip)).catch(() => null);
    if (!bytes) return new Response("Not found", { status: 404 });
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  }
  return new Response("This wave is a link and cannot be played here.", { status: 415 });
}
