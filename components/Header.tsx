import Link from "next/link";
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";

const links = [
  { href: "/calendar", label: "Calendar" },
  { href: "/board/best-barrel", label: "Board" },
  { href: "/ranking", label: "Rankings" },
  { href: "/purse", label: "Purse" },
  { href: "/t/ipanema", label: "#ipanema" },
];

export async function Header() {
  const session = await auth();
  const signedIn = Boolean(session?.user);

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
          {signedIn ? (
            <>
              <Link href="/enter" className="hover:text-ocean">
                Enter a wave
              </Link>
              <Link href="/my-waves" className="hover:text-ocean">
                My waves
              </Link>
              <Link href="/profile" className="hover:text-ocean">
                Profile
              </Link>
              {session?.user.role === "ADMIN" ? (
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
