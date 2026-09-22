"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { parseDateOnly } from "@/lib/category";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export type FormState = { error: string | null };

const credentials = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Invalid email or password." };

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/profile",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }
  return { error: null };
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
  });
  if (!parsed.success) return { error: "Check the fields. The password needs 8 characters." };

  const birthDate = parseDateOnly(parsed.data.birthDate);
  const today = new Date().toISOString().slice(0, 10);
  if (!birthDate || parsed.data.birthDate >= today) {
    return { error: "Enter a valid date of birth." };
  }

  const email = parsed.data.email.toLowerCase();
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { error: "An account with that email already exists." };

  const passwordHash = await hash(parsed.data.password, 10);
  const slug = await uniqueSlug(parsed.data.displayName);
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
          hashtags: [],
          judgingDutyCurrent: true,
        },
      },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/profile",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try signing in." };
    }
    throw error;
  }
  return { error: null };
}
