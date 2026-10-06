import type { Metadata } from "next";
import Link from "next/link";
import type { CategoryCode, Sex } from "@prisma/client";
import { DEMO_THEME_SLUG, themeBySlug } from "@/lib/catalogue";
import { CATEGORY_LABEL } from "@/lib/category";
import { EDITIONS } from "@/lib/constitution";
import { getHashtagBoard, listHashtags } from "@/lib/data";
import { formatPoints, ordinal, sexLabel, verificationLabel } from "@/lib/format";
import { normalizeHashtag } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Hashboard" };

export default async function HashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ category?: string; sex?: string }>;
}) {
  const { tag: raw } = await params;
  const query = await searchParams;
  const tag = normalizeHashtag(decodeURIComponent(raw));
  const theme = themeBySlug(DEMO_THEME_SLUG)!;
  const category = (query.category as CategoryCode) || "OPEN";
  const sex: Sex = query.sex === "W" ? "W" : "M";
  const allowed = theme.categories.includes(category) ? category : "OPEN";
  const board = tag ? await getHashtagBoard(tag, allowed, sex) : null;
  const tags = await listHashtags();

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">
        <Link href="/hashboards" className="hover:text-ocean">
          Hashboards
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-5xl">#{tag || "—"}</h1>
      <p className="mt-4 max-w-2xl text-ink/80">
        This hashboard filters {theme.name} and renumbers the athletes who carry the tag. Nothing is judged again and
        nothing is paid apart.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        {tags.map((item) => (
          <Link
            key={item}
            href={`/hashboards/${item}?category=${allowed}&sex=${sex}`}
            className={`border px-2 py-1 hover:border-ocean ${item === tag ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            #{item}
          </Link>
        ))}
        {tags.length === 0 ? <span className="text-ink/60">No hashtags on the circuit yet.</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {EDITIONS.filter((edition) => theme.categories.includes(edition.category)).map((edition) => (
          <Link
            key={edition.id}
            href={`/hashboards/${tag}?category=${edition.category}&sex=${edition.sex}`}
            className={`border px-2 py-1 ${edition.category === allowed && edition.sex === sex ? "border-ocean bg-ocean text-paper" : "border-line"}`}
          >
            {CATEGORY_LABEL[edition.category]} {sexLabel(edition.sex)}
          </Link>
        ))}
      </div>
      {!board ? (
        <p className="mt-8 text-sm text-ink/60">The demo board is not in the database yet.</p>
      ) : (
        <>
          <p className="mt-8 text-sm text-ink/60">
            World N on this board = {board.entrants}. Hashtag N = {board.rows.length}.
          </p>
          <ol className="mt-3 divide-y divide-line border border-line bg-white">
            {board.rows.length === 0 ? (
              <li className="px-3 py-6 text-sm text-ink/60">Nobody with that hashtag on this board.</li>
            ) : (
              board.rows.map((row) => (
                <li key={row.athleteId} className="flex items-baseline justify-between gap-4 px-3 py-3 text-sm">
                  <span>
                    <span className="mr-3 font-serif text-2xl">{row.derivedPlace}</span>
                    <Link href={`/athlete/${row.athlete.slug}`} className="hover:text-ocean">
                      {row.athlete.displayName}
                    </Link>
                    <span className="ml-2 text-xs uppercase tracking-wider text-ink/50">
                      {verificationLabel(row.athlete.verification)} · world {ordinal(row.worldPlace)}
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
