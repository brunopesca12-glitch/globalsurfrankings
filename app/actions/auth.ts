"use server";

import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeCallback } from "@/lib/auth-redirect";
import { parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { parseWallet } from "@/lib/wallet";

export type FormState = { error: string | null };

const credentials = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
});

async function signInAccount(
  email: string,
  password: string,
  redirectTo: string,
  failure = "Invalid email or password.",
): Promise<FormState> {
  try {
    const destination = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo,
    });
    if (typeof destination !== "string" || /[?&]error=/.test(destination)) {
      return { error: failure };
    }
  } catch (error) {
    if (error instanceof AuthError) return { error: failure };
    throw error;
  }
  redirect(redirectTo);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid email or password." };

  const redirectTo = safeCallback(String(formData.get("callbackUrl") ?? ""), "/judge");
  return signInAccount(parsed.data.email.toLowerCase(), parsed.data.password, redirectTo);
}

const signup = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  sex: z.enum(["M", "W"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.string().trim().regex(/^[A-Za-z]{2}$/),
  city: z.string().trim().max(80).optional(),
  pro: z.boolean(),
  walletNetwork: z.string().optional(),
  walletAddress: z.string().optional(),
});

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const existing = await prisma.athlete.findUnique({ where: { slug: base } });
  if (!existing) return base;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signup.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    sex: formData.get("sex"),
    birthDate: formData.get("birthDate"),
    country: formData.get("country") || "BR",
    city: String(formData.get("city") ?? ""),
    pro: formData.get("pro") === "on",
    walletNetwork: String(formData.get("walletNetwork") ?? ""),
    walletAddress: String(formData.get("walletAddress") ?? ""),
  });
  if (!parsed.success) return { error: "Check the fields. The password needs 8 characters." };

  const walletText = parsed.data.walletAddress?.trim() ?? "";
  const wallet = walletText ? parseWallet(parsed.data.walletNetwork ?? "", walletText) : null;
  if (walletText && !wallet) {
    return { error: "That wallet address does not match the network. Paste the public address only." };
  }

  const birthDate = parseDateOnly(parsed.data.birthDate);
  const today = new Date().toISOString().slice(0, 10);
  if (!birthDate || parsed.data.birthDate >= today) {
    return { error: "Enter a valid date of birth." };
  }

  if (formData.get("rules") !== "on") {
    return { error: "Tick the box to agree to the competition rules." };
  }

  const email = parsed.data.email.toLowerCase();
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) {
    const samePassword = await compare(parsed.data.password, taken.passwordHash);
    if (!samePassword) return { error: "An account with that email already exists." };
    return signInAccount(email, parsed.data.password, "/judge", "Account created, but sign-in failed. Try signing in.");
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const slug = await uniqueSlug(parsed.data.displayName);
  try {
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.displayName,
      passwordHash,
      role: "ATHLETE",
      athlete: {
        create: {
          displayName: parsed.data.displayName,
          slug,
          sex: parsed.data.sex,
          birthDate,
          country: parsed.data.country.toUpperCase(),
          city: parsed.data.city || null,
          verification: parsed.data.pro ? "VERIFIED_PRO" : "VERIFIED",
          walletNetwork: wallet?.network ?? null,
          walletAddress: wallet?.address ?? null,
          hashtags: [],
          judgingDutyCurrent: true,
        },
      },
    },
  });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.user.findUnique({ where: { email } });
      const samePassword = existing ? await compare(parsed.data.password, existing.passwordHash) : false;
      if (!samePassword) return { error: "An account with that email already exists." };
      return signInAccount(email, parsed.data.password, "/judge", "Account created, but sign-in failed. Try signing in.");
    }
    throw error;
  }

  return signInAccount(email, parsed.data.password, "/judge", "Account created, but sign-in failed. Try signing in.");
}
