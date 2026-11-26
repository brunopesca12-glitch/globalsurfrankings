import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  const token = query.token?.trim() ?? "";

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-serif text-5xl">Reset password</h1>
      {token.length < 20 ? (
        <p className="mt-4 text-sm text-ink/75">
          This reset link is missing its token.{" "}
          <Link href="/forgot-password" className="text-ocean">
            Request a new one
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      )}
    </div>
  );
}
