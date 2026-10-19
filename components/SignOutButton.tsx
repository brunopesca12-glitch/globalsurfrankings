"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className = "text-ink/60 hover:text-ink" }: { className?: string }) {
  return (
    <button className={className} type="button" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  );
}
