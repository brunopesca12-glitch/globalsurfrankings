import { gateway, generateText } from "ai";
import { pickEvenly } from "@/lib/video-frames";
import type { WaveAnswer, WaveObservation, WaveSetting, WaveSize, WaveStance } from "@/lib/modality";

export type VisionFrame = { mimeType: "image/jpeg"; bytes: Uint8Array };

export interface WaveVision {
  readonly name: string;
  readonly model?: string;
  classify(frames: readonly VisionFrame[]): Promise<WaveObservation | null>;
}

/** Cheap vision model on the Vercel AI Gateway. Override with AI_GATEWAY_MODEL. */
export const DEFAULT_GATEWAY_MODEL = "google/gemini-2.5-flash";

export function gatewayModelFromEnv(env: { [key: string]: string | undefined }): string {
  return env.AI_GATEWAY_MODEL?.trim() || DEFAULT_GATEWAY_MODEL;
}

export function gatewayConfigured(env: { [key: string]: string | undefined }): boolean {
  return Boolean(env.AI_GATEWAY_API_KEY?.trim() || env.VERCEL_OIDC_TOKEN?.trim());
}

const PROMPT = `You are checking a surf video for Global Surf Rankings. These stills are samples from one clip, in time order.
Reply with JSON only, no markdown, using exactly these fields:
{"setting":"ocean"|"pool"|"unknown","stance":"frontside"|"backside"|"unknown","tube":"yes"|"no"|"unknown","aerial":"yes"|"no"|"unknown","size":"small"|"medium"|"large"|"unknown","paddleIn":"yes"|"no"|"unknown","confidence":0}
Rules:
- pool means an artificial wave pool (channel, concrete, a machine wave, no open coastline). ocean means a beach, reef, point, or open water.
- frontside means the surfer's chest faces the wave face. backside means their back faces the wave face. Use unknown when the stance is not clear.
- tube means a hollow barrel with a lip pitching over the surfer, or the surfer inside a tube. Whitewater or a closeout is not a tube.
- aerial means the surfer and board leave the lip and are in the air above the wave. A floater on the lip is not an aerial.
- size small is about waist-high or below. medium is chest-high to a little overhead. large is well overhead, a big wave. Use unknown when the scale is unclear.
- paddleIn yes means the surfer paddles into the wave with their arms. no means a jet ski or other craft is towing them. unknown when the takeoff is not in the frames.
- confidence is how sure you are of this whole reading, from 0 to 1. Use a value under 0.6 when the frames are dark, blurry, or do not show the maneuver.`;

const SETTINGS = new Set<WaveSetting>(["ocean", "pool", "unknown"]);
const STANCES = new Set<WaveStance>(["frontside", "backside", "unknown"]);
const ANSWERS = new Set<WaveAnswer>(["yes", "no", "unknown"]);
const SIZES = new Set<WaveSize>(["small", "medium", "large", "unknown"]);

function asChoice<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;
}

export function parseObservation(raw: unknown): WaveObservation | null {
  let value = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const confidence = typeof record.confidence === "number" ? record.confidence : Number(record.confidence);
  if (!Number.isFinite(confidence)) return null;
  return {
    setting: asChoice(record.setting, SETTINGS, "unknown"),
    stance: asChoice(record.stance, STANCES, "unknown"),
    tube: asChoice(record.tube, ANSWERS, "unknown"),
    aerial: asChoice(record.aerial, ANSWERS, "unknown"),
    size: asChoice(record.size, SIZES, "unknown"),
    paddleIn: asChoice(record.paddleIn, ANSWERS, "unknown"),
    confidence: Math.min(1, Math.max(0, confidence)),
  };
}

function dataUrl(frame: VisionFrame): string {
  return `data:${frame.mimeType};base64,${Buffer.from(frame.bytes).toString("base64")}`;
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

function textFrom(value: unknown, path: readonly string[]): string | null {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : null;
}

async function classifyOpenAI(key: string, model: string, frames: readonly VisionFrame[]): Promise<WaveObservation | null> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            ...frames.map((frame) => ({ type: "image_url", image_url: { url: dataUrl(frame) } })),
          ],
        },
      ],
    }),
  });
  const body = await readJson(response);
  return parseObservation(textFrom(body, ["choices", "0", "message", "content"]));
}

async function classifyGemini(key: string, model: string, frames: readonly VisionFrame[]): Promise<WaveObservation | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              ...frames.map((frame) => ({
                inlineData: { mimeType: frame.mimeType, data: Buffer.from(frame.bytes).toString("base64") },
              })),
            ],
          },
        ],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    },
  );
  const body = await readJson(response);
  const parts = (body as { candidates?: { content?: { parts?: { text?: string }[] } }[] } | null)?.candidates?.[0]?.content
    ?.parts;
  const text = parts?.map((part) => part.text ?? "").join("") ?? null;
  return parseObservation(text);
}

async function classifyAnthropic(key: string, model: string, frames: readonly VisionFrame[]): Promise<WaveObservation | null> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            ...frames.map((frame) => ({
              type: "image",
              source: { type: "base64", media_type: frame.mimeType, data: Buffer.from(frame.bytes).toString("base64") },
            })),
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });
  const body = await readJson(response);
  const blocks = (body as { content?: { text?: string }[] } | null)?.content;
  const text = blocks?.map((block) => block.text ?? "").join("") ?? null;
  return parseObservation(text);
}

function provider(
  name: string,
  classify: (frames: readonly VisionFrame[]) => Promise<WaveObservation | null>,
  model?: string,
): WaveVision {
  return {
    name,
    model,
    async classify(frames) {
      const picked = pickEvenly(frames, 4).filter((frame) => frame.bytes.byteLength > 80);
      if (picked.length === 0) return null;
      try {
        return await classify(picked);
      } catch {
        return null;
      }
    },
  };
}

/** Sends stills through the AI SDK gateway. Throws on auth or request failure; callers treat that as pending review. */
export async function classifyGateway(model: string, frames: readonly VisionFrame[]): Promise<WaveObservation | null> {
  const result = await generateText({
    model: gateway(model),
    temperature: 0,
    maxOutputTokens: 300,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          ...frames.map((frame) => ({
            type: "file" as const,
            data: frame.bytes,
            mediaType: frame.mimeType,
          })),
        ],
      },
    ],
  });
  return parseObservation(result.text);
}

/** The first configured provider wins, so a wave is sent to one model. */
export function waveVisionFromEnv(env: { [key: string]: string | undefined }): WaveVision | null {
  const openai = env.OPENAI_API_KEY?.trim();
  if (openai) {
    const model = env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
    return provider("OpenAI", (frames) => classifyOpenAI(openai, model, frames));
  }
  const gemini = env.GEMINI_API_KEY?.trim() || env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (gemini) {
    const model = env.GEMINI_VISION_MODEL?.trim() || "gemini-2.5-flash";
    return provider("Gemini", (frames) => classifyGemini(gemini, model, frames));
  }
  const anthropic = env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    const model = env.ANTHROPIC_VISION_MODEL?.trim() || "claude-haiku-4-5";
    return provider("Anthropic", (frames) => classifyAnthropic(anthropic, model, frames));
  }
  if (gatewayConfigured(env)) {
    const model = gatewayModelFromEnv(env);
    return provider(
      "Vercel AI Gateway",
      async (frames) => {
        try {
          return await classifyGateway(model, frames);
        } catch {
          return null;
        }
      },
      model,
    );
  }
  return null;
}
