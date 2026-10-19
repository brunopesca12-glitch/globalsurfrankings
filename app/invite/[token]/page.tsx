import type { Metadata } from "next";
import Link from "next/link";
import { acceptInvite, registerFromInvite } from "@/app/actions/invite";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COLLEGE_SEAT_LABEL } from "@/lib/tribunal";
import type { College } from "@/lib/median";

export const metadata: Metadata = { title: "Judge invite" };

const field = "mt-1 w-full border border-line bg-white px-3 py-3 outline-none focus:border-ocean";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const invite = await prisma.judgeInvite.findUnique({ where: { token } });
  const closed = !invite || invite.acceptedAt != null || (invite.expiresAt != null && invite.expiresAt < new Date());
  if (closed || !invite) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-serif text-5xl">This invite is closed</h1>
        <p className="mt-4 text-ink/75">Ask the desk for a new link.</p>
      </div>
    );
  }

  const session = await auth();
  const label = COLLEGE_SEAT_LABEL[invite.college as College];

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Invitation</p>
      <h1 className="mt-3 font-serif text-5xl">{label}</h1>
      <p className="mt-4 leading-relaxed text-ink/80">
        This link seats you in the {label}. The ballot is the same one every judge uses.
      </p>
      {query.error === "exists" ? (
        <p className="mt-4 text-sm text-stamp">That email already has an account. Sign in, then open this link again.</p>
      ) : null}
      {query.error === "1" ? <p className="mt-4 text-sm text-stamp">The invite could not be accepted.</p> : null}

      {session?.user ? (
        <form action={acceptInvite} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <button className="min-h-12 w-full bg-ocean px-4 py-3 text-paper" type="submit">
            Join this college
          </button>
        </form>
      ) : (
        <form action={registerFromInvite} className="mt-8 space-y-4">
          <input type="hidden" name="token" value={token} />
          <label className="block text-sm">
            Name
            <input className={field} name="displayName" required minLength={2} />
          </label>
          <label className="block text-sm">
            Email
            <input className={field} name="email" type="email" required defaultValue={invite.email ?? ""} readOnly={Boolean(invite.email)} />
          </label>
          <label className="block text-sm">
            Password
            <input className={field} name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Edition
              <select className={field} name="sex" defaultValue="M">
                <option value="M">Men</option>
                <option value="W">Women</option>
              </select>
            </label>
            <label className="block text-sm">
              Date of birth
              <input className={field} name="birthDate" type="date" required />
            </label>
          </div>
          <button className="min-h-12 w-full bg-ocean px-4 py-3 text-paper" type="submit">
            Create account and join
          </button>
          <p className="text-sm">
            Already have an account?{" "}
            <Link href={`/sign-in?callbackUrl=/invite/${token}`} className="text-ocean">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
