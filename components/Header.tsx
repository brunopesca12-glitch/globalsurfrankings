import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureWeeklyQueue, type JudgeSession } from "@/lib/judge-queue";

const links = [
  { href: "/videos", label: "Videos" },
  { href: "/calendar", label: "Calendar" },
  { href: "/ranking", label: "Rankings" },
  { href: "/hashboards", label: "Hashboards" },
  { href: "/purse", label: "Purse" },
];

type HeaderViewer =
  | { signedIn: false }
  | { signedIn: true; role: "ADMIN" | "ATHLETE"; judge: JudgeSession | null };

async function readSession() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function loadViewer(): Promise<HeaderViewer> {
  const session = await readSession();
  const userId = session?.user?.id;
  if (!userId) return { signedIn: false };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    // A cookie for a deleted account is not a session we can render.
    if (!user) return { signedIn: false };
    try {
      return { signedIn: true, role: user.role, judge: await ensureWeeklyQueue(userId) };
    } catch {
      return { signedIn: true, role: user.role, judge: null };
    }
  } catch {
    return {
      signedIn: true,
      role: session?.user?.role === "ADMIN" ? "ADMIN" : "ATHLETE",
      judge: null,
    };
  }
}

export async function Header() {
  const viewer = await loadViewer();

  return (
    <header className="border-b border-line bg-paper/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
        <Link href="/" className="mr-auto flex items-baseline gap-2">
          <span className="font-serif text-2xl tracking-tight">GSR</span>
          <span className="hidden text-xs uppercase tracking-[0.22em] text-ink/60 sm:inline">Global Surf Rankings</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink/80 hover:text-ocean">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {viewer.signedIn ? (
            <>
              <Link href="/enter" className="hover:text-ocean">
                Enter a wave
              </Link>
              <Link href="/my-waves" className="hover:text-ocean">
                My waves
              </Link>
              {viewer.judge?.college ? (
                <Link href="/judge" className="hover:text-ocean">
                  Judge{viewer.judge.pending > 0 ? ` (${viewer.judge.pending})` : ""}
                </Link>
              ) : null}
              <Link href="/profile" className="hover:text-ocean">
                Profile
              </Link>
              {viewer.role === "ADMIN" ? (
                <Link href="/admin/judge" className="hover:text-ocean">
                  Desk
                </Link>
              ) : null}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="text-ink/60 hover:text-ink">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hover:text-ocean">
                Sign in
              </Link>
              <Link href="/sign-up" className="bg-ocean px-3 py-1.5 text-paper">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
