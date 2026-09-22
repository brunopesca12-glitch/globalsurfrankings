import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-serif text-5xl">Sign in</h1>
      <p className="mt-3 text-sm text-ink/70">
        Demo account: joao.vasques@gsr.surf · password wave-2027. The desk is desk@gsr.surf, with the same password.
      </p>
      <div className="mt-8">
        <LoginForm />
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
