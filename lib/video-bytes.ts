import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export const MAX_VIDEO_BYTES = 64 * 1024 * 1024;

const PRIVATE_HOST = /(^|\.)local$|(^|\.)internal$|^localhost$/i;

export function isPrivateAddress(ip: string): boolean {
  const host = ip.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;
  const mapped = host.startsWith("::ffff:") ? host.slice("::ffff:".length) : host;
  const parts = mapped.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return host.includes(":") ? false : true;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true;
  return false;
}

export async function publicHttpUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_HOST.test(host)) return null;
  try {
    const ips = isIP(host) ? [host] : (await lookup(host, { all: true })).map((row) => row.address);
    if (ips.length === 0 || ips.some((ip) => isPrivateAddress(ip))) return null;
  } catch {
    return null;
  }
  return url;
}

export function isVercelBlobUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function looksLikeVideoContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  const kind = String.fromCharCode(bytes[4] ?? 0, bytes[5] ?? 0, bytes[6] ?? 0, bytes[7] ?? 0);
  if (kind === "ftyp") return true;
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return true;
  const ogg = String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
  return ogg === "OggS";
}

export function urlLooksDirect(raw: string): boolean {
  try {
    return /\.(mp4|webm|mov|m4v|ogg)$/i.test(new URL(raw).pathname);
  } catch {
    return false;
  }
}

export function acceptedUpload(mime: string, name: string): boolean {
  if (/^video\/(mp4|webm|quicktime|ogg)$/i.test(mime)) return true;
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(name);
}

export function mimeForUpload(mime: string, name: string): string {
  if (mime.startsWith("video/")) return mime;
  if (/\.webm$/i.test(name)) return "video/webm";
  if (/\.ogg$/i.test(name)) return "video/ogg";
  if (/\.mov$/i.test(name)) return "video/quicktime";
  return "video/mp4";
}

export function entryMediaId(videoUrl: string): string | null {
  const match = /^\/media\/entries\/([a-z0-9]+)$/i.exec(videoUrl);
  return match?.[1] ?? null;
}

/** null when the caller wants the whole body. "invalid" is a bad Range header. */
export function byteRange(
  header: string | null,
  size: number,
): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const match = /^bytes=(\d+)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) return "invalid";
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start >= size || end < start) return "invalid";
  return { start, end: Math.min(end, size - 1) };
}

async function readCapped(response: Response, max: number): Promise<Uint8Array | "too-big" | "empty"> {
  const reader = response.body?.getReader();
  if (!reader) return "empty";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return "too-big";
    }
    chunks.push(value);
  }
  if (total === 0) return "empty";
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export type FetchedVideo =
  | { kind: "file"; bytes: Uint8Array; mime: string; finalUrl: string }
  | { kind: "page"; finalUrl: string }
  | { kind: "too-big" }
  | { kind: "blocked" }
  | { kind: "unreadable" }
  | { kind: "failed" };

export async function fetchVideo(raw: string, maxBytes = MAX_VIDEO_BYTES): Promise<FetchedVideo> {
  let current = raw;
  for (let hop = 0; hop < 4; hop += 1) {
    const url = await publicHttpUrl(current);
    if (!url) return { kind: "blocked" };
    let response: Response;
    try {
      response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(25_000) });
    } catch {
      return { kind: "failed" };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { kind: "blocked" };
      current = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) return { kind: "failed" };
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > maxBytes) return { kind: "too-big" };
    const mime = (response.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
    const body = await readCapped(response, maxBytes);
    if (body === "too-big") return { kind: "too-big" };
    if (body === "empty") return { kind: "unreadable" };
    const videoMime = mime.startsWith("video/");
    const direct = urlLooksDirect(url.toString()) || isVercelBlobUrl(url.toString());
    if (looksLikeVideoContainer(body)) {
      return { kind: "file", bytes: body, mime: videoMime ? mime : "video/mp4", finalUrl: url.toString() };
    }
    if (videoMime || direct) return { kind: "unreadable" };
    return { kind: "page", finalUrl: url.toString() };
  }
  return { kind: "blocked" };
}
