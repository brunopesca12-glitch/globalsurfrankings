import type { Metadata } from "next";
import Link from "next/link";
import { VerifyDesk } from "@/components/VerifyDesk";

export const metadata: Metadata = { title: "Verify a receipt" };

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/verdict" className="hover:text-ocean">
          Monday
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-5xl leading-none">Check a vote</h1>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink/80">
        <p>
          A verdict receipt is public. Anyone can recompute it. Nothing here needs an account, and nothing is sent to a
          chain. The weekly root is stored so it can be anchored later.
        </p>
        <p>The canonical line, in this order, separated by a vertical bar:</p>
        <p className="break-all border border-line bg-white px-3 py-3 font-mono text-xs">
          voteId|subjectWaveId|otherWaveId|BETTER or WORSE|judgeCode|timestamp|nonce
        </p>
        <p>
          The vote hash is SHA-256 of that line, as UTF-8, printed in hex. The weekly root sorts those hashes, then
          folds them: the parent of two hashes is SHA-256 of <span className="font-mono">left|right</span>. A last hash
          with no partner is paired with itself. An empty week hashes the empty string.
        </p>
        <p>
          The same steps are in <span className="font-mono">scripts/verify-receipt.ts</span> and{" "}
          <span className="font-mono">lib/receipt.ts</span>. A judge code is J- and eight hex characters. It is not a
          name.
        </p>
      </div>
      <VerifyDesk />
    </div>
  );
}
