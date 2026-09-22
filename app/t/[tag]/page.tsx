import type { Metadata } from "next";
import Link from "next/link";
import type { CategoryCode, Sex } from "@prisma/client";
import { DEMO_THEME_SLUG, themeBySlug } from "@/lib/catalogue";
import { CATEGORY_LABEL } from "@/lib/category";
import { EDITIONS } from "@/lib/constitution";
import { getHashtagBoard, listHashtags } from "@/lib/data";
import { formatPoints, sexLabel, verificationLabel } from "@/lib/format";
import { normalizeHashtag } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Hashtag" };

export default async function HashtagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ categoria?: string; sexo?: string }>;
}) {
  const { tag: raw } = await params;
  const query = await searchParams;
  const tag = normalizeHashtag(decodeURIComponent(raw));
  const theme = themeBySlug(DEMO_THEME_SLUG)!;
  const category = (query.categoria as CategoryCode) || "OPEN";
  const sex: Sex = query.sexo === "W" ? "W" : "M";
  const allowed = theme.categories.includes(category) ? category : "OPEN";
  const board = tag ? await getHashtagBoard(tag, allowed, sex) : null;
  const tags = await listHashtags();

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Leaderboard derivado</p>
      <h1 className="mt-2 font-serif text-5xl">#{tag || "—"}</h1>
      <p className="mt-4 max-w-2xl text-ink/80">
        A hashtag filtra o quadro mundial e renumera os seus. Nada é julgado de novo e nada é pago à parte. #{tag || "…"} no{" "}
        {theme.namePt} é uma vista sobre o mesmo quadro dos profissionais.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {tags.map((item) => (
          <Link key={item} href={`/t/${item}?categoria=${allowed}&sexo=${sex}`} className="border border-line px-2 py-1 hover:border-ocean">
            #{item}
          </Link>
        ))}
        {tags.length === 0 ? <span className="text-ink/60">Rode o seed para ver as hashtags de demonstração.</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {EDITIONS.filter((edition) => theme.categories.includes(edition.category)).map((edition) => (
          <Link
            key={edition.id}
            href={`/t/${tag}?categoria=${edition.category}&sexo=${edition.sex}`}
            className={`border px-2 py-1 ${edition.category === allowed && edition.sex === sex ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {CATEGORY_LABEL[edition.category]} {sexLabel(edition.sex)}
          </Link>
        ))}
      </div>
      {!board ? (
        <p className="mt-8 text-sm text-ink/60">O quadro de demonstração ainda não está no banco.</p>
      ) : (
        <>
          <p className="mt-8 text-sm text-ink/60">
            N do mundo neste quadro = {board.entrants}. N da hashtag = {board.rows.length}.
          </p>
          <ol className="mt-3 divide-y divide-line border border-line bg-white">
            {board.rows.length === 0 ? (
              <li className="px-3 py-6 text-sm text-ink/60">Ninguém com essa hashtag neste quadro.</li>
            ) : (
              board.rows.map((row) => (
                <li key={row.athleteId} className="flex items-baseline justify-between gap-4 px-3 py-3 text-sm">
                  <span>
                    <span className="mr-3 font-serif text-2xl">{row.derivedPlace}</span>
                    <Link href={`/atleta/${row.athlete.slug}`} className="hover:text-ocean">
                      {row.athlete.displayName}
                    </Link>
                    <span className="ml-2 text-xs uppercase tracking-wider text-ink/50">
                      {verificationLabel(row.athlete.verification)} · mundo {row.worldPlace}º
                    </span>
                  </span>
                  <span>{formatPoints(row.points)}</span>
                </li>
              ))
            )}
          </ol>
        </>
      )}
    </div>
  );
}
