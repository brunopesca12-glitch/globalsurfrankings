import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CATEGORY_LABEL } from "@/lib/category";
import { getAthleteByUser } from "@/lib/data";
import { environmentLabel, formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Minhas ondas" };

export default async function MyEntriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const athlete = await getAthleteByUser(session.user.id);
  if (!athlete) redirect("/perfil");

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-5xl">Minhas ondas</h1>
      <p className="mt-3 text-sm text-ink/70">
        {athlete.entries.length === 0
          ? "Nenhuma onda ainda."
          : athlete.entries.length === 1
            ? "Uma inscrição."
            : `${athlete.entries.length} inscrições.`}{" "}
        <Link href="/inscrever" className="text-ocean">
          Inscrever
        </Link>
      </p>
      <ul className="mt-8 space-y-3">
        {athlete.entries.map((entry) => (
          <li key={entry.id} className="border border-line bg-white px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg">
                <Link href={`/quadro/${entry.theme.slug}?categoria=${entry.category}&sexo=${athlete.sex}`} className="hover:text-ocean">
                  {entry.theme.namePt}
                </Link>
              </h2>
              <p className="font-serif text-3xl">{entry.placement ? `${entry.placement.place}º` : "—"}</p>
            </div>
            <p className="mt-1 text-sm text-ink/70">
              {CATEGORY_LABEL[entry.category]} · {environmentLabel(entry.environment)} · {entry.isoYear}-W
              {String(entry.isoWeek).padStart(2, "0")} ·{" "}
              {entry.tollCents === 0 ? "sem pedágio" : `${formatUsd(entry.tollCents)} DEMO, não cobrado`}
              {entry.spot ? ` · ${entry.spot}` : ""}
            </p>
            <p className="mt-1 text-sm">
              {entry.placement ? "Colocação publicada." : "Aguardando a liturgia de segunda."}{" "}
              <a className="text-ocean" href={entry.videoUrl}>
                vídeo
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
