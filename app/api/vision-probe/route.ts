import { PROBE_FRAME_BASE64 } from "@/lib/probe-frame";
import { classifyGateway, gatewayModelFromEnv, waveVisionFromEnv } from "@/lib/vision";

export const runtime = "nodejs";
export const maxDuration = 60;

function publicError(error: unknown): { name: string; message: string } {
  const name = error instanceof Error ? error.name : "Error";
  const raw = error instanceof Error ? error.message : "The gateway call failed.";
  return {
    name,
    message: raw.replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]").slice(0, 240),
  };
}

/** Preview-only check that the AI Gateway accepts this deployment's login. */
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ ok: false, reason: "preview-only" }, { status: 404 });
  }
  const vision = waveVisionFromEnv(process.env);
  if (!vision || vision.name !== "Vercel AI Gateway") {
    return Response.json({
      ok: false,
      reason: vision ? "direct-key" : "unconfigured",
      provider: vision?.name ?? null,
    });
  }
  const model = gatewayModelFromEnv(process.env);
  try {
    const observation = await classifyGateway(model, [
      { mimeType: "image/jpeg", bytes: Buffer.from(PROBE_FRAME_BASE64, "base64") },
    ]);
    if (!observation) {
      return Response.json({ ok: false, provider: vision.name, model, reason: "unreadable" });
    }
    return Response.json({ ok: true, provider: vision.name, model, observation });
  } catch (error) {
    const detail = publicError(error);
    const auth = /auth|oidc|api key/i.test(`${detail.name} ${detail.message}`);
    return Response.json({
      ok: false,
      provider: vision.name,
      model,
      reason: auth ? "auth" : "request",
      errorName: detail.name,
      message: detail.message,
    });
  }
}
