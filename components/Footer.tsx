import { SEASON_2027 } from "@/lib/catalogue";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-8 text-sm text-ink/70">
        <p>
          GSR · {SEASON_2027.name} · gala {SEASON_2027.galaLabel}, {SEASON_2027.galaVenue}
        </p>
        <p>Bruno Pesca · Founder · gsr.surf · globalsurfrankings.com</p>
      </div>
    </footer>
  );
}
