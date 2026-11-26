import { createHash, randomBytes } from "node:crypto";

export const RESET_TTL_MS = 60 * 60 * 1000;

export function newResetToken(now = new Date()): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token), expiresAt: new Date(now.getTime() + RESET_TTL_MS) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function assessResetToken(
  row: { expiresAt: Date; usedAt: Date | null } | null,
  now: Date,
): "missing" | "used" | "expired" | "ok" {
  if (!row) return "missing";
  if (row.usedAt) return "used";
  if (row.expiresAt.getTime() <= now.getTime()) return "expired";
  return "ok";
}
