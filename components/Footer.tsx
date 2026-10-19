import Link from "next/link";
import { SEASON_2027 } from "@/lib/catalogue";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink/70">
        <p>
          GSR · {SEASON_2027.name} · gala {SEASON_2027.galaLabel}
        </p>
        <p className="flex gap-4">
          <Link href="/about" className="hover:text-ocean">
            About
          </Link>
          <Link href="/rules" className="hover:text-ocean">
            Rules
          </Link>
        </p>
        <p>gsr.surf · globalsurfrankings.com</p>
      </div>
    </footer>
  );
}
