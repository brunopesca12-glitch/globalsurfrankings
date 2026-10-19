import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const query = await searchParams;
  const callbackUrl = query.callbackUrl?.startsWith("/invite/") || query.callbackUrl?.startsWith("/judge") ? query.callbackUrl : "";

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-serif text-5xl">Sign in</h1>
      <p className="mt-3 text-sm text-ink/70">Use the email and password for your athlete account.</p>
      <div className="mt-8">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-6 text-sm">
        No account?{" "}
        <Link href="/sign-up" className="text-ocean">
          Sign up
        </Link>
      </p>
    </div>
  );
}