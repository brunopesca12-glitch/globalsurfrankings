import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-serif text-5xl">Forgot password</h1>
      <p className="mt-3 text-sm text-ink/70">
        We email a single-use link that expires in 60 minutes. It comes from GSR &lt;no-reply@gsr.surf&gt;.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/sign-in" className="text-ocean">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
