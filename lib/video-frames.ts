import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import { dHashFromGray } from "@/lib/perceptual-hash";

const FRAME_COUNT = 6;
const GRAY_WIDTH = 9;
const GRAY_HEIGHT = 8;
const GRAY_BYTES = GRAY_WIDTH * GRAY_HEIGHT;

export class FrameSampleError extends Error {
  constructor(readonly reason: "missing-ffmpeg" | "unreadable") {
    super(reason);
  }
}

export function parseDuration(stderr: string): number | null {
  const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!match) return null;
  const duration = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Number.isFinite(duration) && duration > 0 ? duration : null;
}

export function parseFrameRate(stderr: string): number {
  const match = /(\d+(?:\.\d+)?)\s+fps/.exec(stderr);
  const rate = match ? Number(match[1]) : 30;
  return Number.isFinite(rate) && rate > 1 && rate < 1000 ? rate : 30;
}

/** Times spread across the clip, in seconds, staying off the very edges. */
export function sampleTimes(durationSeconds: number, count = FRAME_COUNT): number[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0.2 ? durationSeconds : 2;
  const pad = Math.min(0.12, duration * 0.08);
  const start = pad;
  const end = Math.max(start, duration - pad);
  if (count <= 1) return [Math.round(start * 1000) / 1000];
  const times: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const time = start + ((end - start) * i) / (count - 1);
    times.push(Math.round(time * 1000) / 1000);
  }
  return times;
}

export function splitJpegs(buffer: Buffer): Buffer[] {
  const frames: Buffer[] = [];
  let start = -1;
  for (let i = 0; i < buffer.length - 1; i += 1) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd8) start = i;
    if (start >= 0 && buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
      frames.push(Buffer.from(buffer.subarray(start, i + 2)));
      start = -1;
      i += 1;
    }
  }
  return frames;
}

export function pickEvenly<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  const picked: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.round((i * (items.length - 1)) / (count - 1));
    picked.push(items[index]!);
  }
  return picked;
}

export function ffmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (typeof ffmpegStatic === "string" && ffmpegStatic.length > 0) return ffmpegStatic;
  return "ffmpeg";
}

function run(binary: string, args: string[], timeoutMs: number): Promise<{ code: number; stdout: Buffer; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new FrameSampleError("unreadable"));
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => out.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => {
      err += chunk.toString();
      if (err.length > 8000) err = err.slice(-8000);
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(new FrameSampleError(error.code === "ENOENT" ? "missing-ffmpeg" : "unreadable"));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout: Buffer.concat(out), stderr: err });
    });
  });
}

function hashesFromRaw(buffer: Buffer): string[] {
  const hashes: string[] = [];
  for (let offset = 0; offset + GRAY_BYTES <= buffer.length; offset += GRAY_BYTES) {
    hashes.push(dHashFromGray(buffer.subarray(offset, offset + GRAY_BYTES), GRAY_WIDTH, GRAY_HEIGHT));
  }
  return hashes;
}

export type SampledFrames = {
  hashes: string[];
  jpegs: Buffer[];
  duration: number | null;
  /** ffmpeg's probe log, used to read capture date, device, and GPS. */
  probeText: string;
};

export async function sampleFrames(bytes: Uint8Array): Promise<SampledFrames> {
  const dir = await mkdtemp(path.join(tmpdir(), "gsr-wave-"));
  const input = path.join(dir, "wave.bin");
  const binary = ffmpegPath();
  try {
    await writeFile(input, bytes);
    const probe = await run(binary, ["-hide_banner", "-i", input], 15_000);
    const duration = parseDuration(probe.stderr);
    if (!duration) throw new FrameSampleError("unreadable");
    const rate = parseFrameRate(probe.stderr);
    const selects = sampleTimes(duration)
      .map((time) => Math.max(0, Math.round(time * rate)))
      .map((frame) => `eq(n\\,${frame})`)
      .join("+");
    const select = `select='${selects}'`;
    const full = await run(
      binary,
      ["-hide_banner", "-i", input, "-an", "-vf", `${select},scale=${GRAY_WIDTH}:${GRAY_HEIGHT},format=gray`, "-vsync", "vfr", "-f", "rawvideo", "pipe:1"],
      25_000,
    );
    const center = await run(
      binary,
      [
        "-hide_banner",
        "-i",
        input,
        "-an",
        "-vf",
        `${select},crop=iw*0.7:ih*0.7,scale=${GRAY_WIDTH}:${GRAY_HEIGHT},format=gray`,
        "-vsync",
        "vfr",
        "-f",
        "rawvideo",
        "pipe:1",
      ],
      25_000,
    );
    const jpeg = await run(
      binary,
      ["-hide_banner", "-i", input, "-an", "-vf", `${select},scale=480:-2`, "-vsync", "vfr", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"],
      25_000,
    );
    const hashes = [...hashesFromRaw(full.stdout), ...hashesFromRaw(center.stdout)];
    if (hashes.length === 0) throw new FrameSampleError("unreadable");
    return { hashes, jpegs: splitJpegs(jpeg.stdout), duration, probeText: probe.stderr };
  } catch (error) {
    if (error instanceof FrameSampleError) throw error;
    throw new FrameSampleError("unreadable");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function readVideoFile(filePath: string): Promise<Uint8Array> {
  const bytes = await readFile(filePath);
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
