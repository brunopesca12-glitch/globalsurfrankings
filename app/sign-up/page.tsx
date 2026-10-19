import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="font-serif text-5xl">Sign up</h1>
      <p className="mt-3 text-ink/75">
        One person, one account. Category comes from age on September 30, 2027: Junior through 18, then Open, Masters 40+,
        and Masters 50+. Document verification does not exist in this version — the badge is Verified by default, and Pro is
        a stub.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-sm">
        Already registered?{" "}
        <Link href="/sign-in" className="text-ocean">
          Sign in
        </Link>
      </p>
    </div>
  );
}
