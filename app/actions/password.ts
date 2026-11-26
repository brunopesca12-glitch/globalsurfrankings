"use server";

import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import { publicOrigin } from "@/lib/auth-redirect";
import { prisma } from "@/lib/db";
import { sendResetEmail } from "@/lib/mailer";
import { assessResetToken, hashResetToken, newResetToken } from "@/lib/password-reset";

export type ResetState = { error: string | null; notice: string | null };

const NOT_CONFIGURED =
  "Password reset email is not available right now. RESEND_API_KEY is not set, so no message was sent.";
const SENT = "If that email has an account, we sent a reset link. It expires in 60 minutes and works once.";
const SEND_FAILED = "The reset email could not be sent. Try again later.";

async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  return publicOrigin({
    forwardedHost: headerList.get("x-forwarded-host"),
    forwardedProto: headerList.get("x-forwarded-proto"),
    host: headerList.get("host"),
    fallbackOrigin: process.env.AUTH_URL || "https://gsr.surf",
  });
}

export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = z.string().trim().email().max(120).safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter the email on the account.", notice: null };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey?.trim()) return { error: NOT_CONFIGURED, notice: null };

  const email = parsed.data.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { error: null, notice: SENT };

  const issued = newResetToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: issued.tokenHash, expiresAt: issued.expiresAt },
    }),
  ]);

  const origin = await siteOrigin();
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(issued.token)}`;
  const mailed = await sendResetEmail({ apiKey, to: email, resetUrl });
  if (!mailed.sent) {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash: issued.tokenHash } });
    return { error: mailed.reason === "not_configured" ? NOT_CONFIGURED : SEND_FAILED, notice: null };
  }
  return { error: null, notice: SENT };
}

const nextPassword = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8).max(72),
  confirm: z.string().min(8).max(72),
});

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = nextPassword.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: "The password needs 8 characters.", notice: null };
  if (parsed.data.password !== parsed.data.confirm) {
    return { error: "The two passwords do not match.", notice: null };
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  const status = assessResetToken(row, new Date());
  if (status !== "ok" || !row) {
    return { error: "This reset link is invalid or has expired. Request a new one.", notice: null };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const updated = await prisma.passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (updated.count !== 1) {
    return { error: "This reset link is invalid or has expired. Request a new one.", notice: null };
  }
  await prisma.user.update({ where: { id: row.userId }, data: { passwordHash } });
  return { error: null, notice: "Password saved. You can sign in with it." };
}
