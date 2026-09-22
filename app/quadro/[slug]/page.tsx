import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CategoryCode, Sex } from "@prisma/client";
import { themeBySlug } from "@/lib/catalogue";
import { CATEGORY_CODES, CATEGORY_LABEL } from "@/lib/category";
import { getEditionBoard } from "@/lib/data";
import { environmentLabel, formatDatePt, formatPoints, sexLabel, verificationLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Quadro" };

function parseCategory(value: string | undefined, allowed: readonly CategoryCode[]): CategoryCode {
  if (value && allowed.includes(value as CategoryCode)) return value as CategoryCode;
  return allowed[0] ?? "OPEN";
}

function parseSex(value: string | undefined): Sex {
  return value === "W" ? "W" : "M";
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categoria?: string; sexo?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const catalogue = themeBySlug(slug);
  if (!catalogue) notFound();

  const category = parseCategory(query.categoria, catalogue.categories);
  const sex = parseSex(query.sexo);
  const board = await getEditionBoard(slug, category, sex);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Quadro mundial · colocação ordinal</p>
      <h1 className="mt-2 font-serif text-5xl">{catalogue.namePt}</h1>
      <p className="mt-2 text-ink/70">
        {catalogue.name} · final {formatDatePt(catalogue.finaleOn)}
        {catalogue.proposedDate ? " · data proposta" : ""}
      </p>
      {catalogue.note ? <p className="mt-3 max-w-2xl text-sm text-ink/75">{catalogue.note}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {catalogue.categories.map((item) => (
          <Link
            key={item}
            href={`/quadro/${slug}?categoria=${item}&sexo=${sex}`}
            className={`border px-3 py-1 ${item === category ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {CATEGORY_LABEL[item]}
          </Link>
        ))}
        {(["M", "W"] as const).map((item) => (
          <Link
            key={item}
            href={`/quadro/${slug}?categoria=${category}&sexo=${item}`}
            className={`border px-3 py-1 ${item === sex ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {sexLabel(item)}
          </Link>
        ))}
      </div>

      {!board ? (
        <p className="mt-10 border border-line bg-white px-4 py-6">
          Este evento ainda não está no banco. Rode a migração e o seed para ver o quadro.
        </p>
      ) : (
        <>
          <p className="mt-8 text-sm text-ink/70">
            N = {board.entrants} · {CATEGORY_LABEL[category]} · {sexLabel(sex)} · pontos provisórios, base × √(S/100), até o
            final. A liturgia publica o quadro na segunda.
          </p>
          <div className="mt-4 overflow-x-auto border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-ink/60">
                <tr>
                  <th className="px-3 py-2">Lugar</th>
                  <th className="px-3 py-2">Atleta</th>
                  <th className="px-3 py-2">Pontos</th>
                  <th className="px-3 py-2">Onda</th>
                </tr>
              </thead>
              <tbody>
                {board.placed.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-ink/60" colSpan={4}>
                      Nenhuma colocação publicada nesta edição.
                    </td>
                  </tr>
                ) : (
                  board.placed.map((row) => (
                    <tr key={row.entryId} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-3 font-serif text-2xl">{row.place}</td>
                      <td className="px-3 py-3">
                        <Link href={`/atleta/${row.athlete.slug}`} className="hover:text-ocean">
                          {row.athlete.displayName}
                        </Link>
                        <span className="mt-1 block text-xs uppercase tracking-wider text-ink/55">
                          {verificationLabel(row.athlete.verification)}
                          {row.athlete.city ? ` · ${row.athlete.city}` : ""}
                        </span>
                      </td>
                      <td className="px-3 py-3">{formatPoints(row.points)}</td>
                      <td className="px-3 py-3">
                        <span className="block">{environmentLabel(row.environment)}</span>
                        <span className="text-ink/60">{row.spot}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {board.pending.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-serif text-2xl">Na fila da segunda</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {board.pending.map((entry) => (
                  <li key={entry.id} className="border border-line bg-white px-3 py-2">
                    {entry.athlete.displayName} · {environmentLabel(entry.environment)}
                    {entry.spot ? ` · ${entry.spot}` : ""} · sem lugar ainda
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
      <p className="mt-8 text-sm text-ink/60">
        Hashtag de demonstração: <Link href="/t/ipanema" className="text-ocean">#ipanema</Link> renumera este quadro sem julgar
        nada de novo. Edições do catálogo: {CATEGORY_CODES.length} categorias, cada uma em homens e mulheres.
      </p>
    </div>
  );
}
