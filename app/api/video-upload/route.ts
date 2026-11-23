import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MAX_VIDEO_BYTES } from "@/lib/video-bytes";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("x-vercel-signature");
  const body = (await request.json()) as HandleUploadBody;
  // A callback signature skips the visitor gate. Only the finished-upload callback may use that path.
  if (signature && body.type !== "blob.upload-completed") {
    return NextResponse.json({ error: "Sign in to upload a wave." }, { status: 401 });
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session?.user) throw new Error("Sign in to upload a wave.");
        if (!/\.(mp4|webm|mov|m4v|ogg)$/i.test(pathname)) throw new Error("Use an MP4, WebM, or MOV file.");
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/ogg",
            "application/octet-stream",
          ],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          tokenPayload: session.user.id,
        };
      },
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The upload did not finish.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
