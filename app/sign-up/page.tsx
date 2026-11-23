import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="font-serif text-5xl">Sign up</h1>
      <p className="mt-3 text-ink/75">
        One person, one account. Your division comes from your age on February 29, 2028: Open, or Masters 40+ from age
        40, men&apos;s and women&apos;s.
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
