import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SEASON_2027 } from "@/lib/catalogue";
import { CATEGORY_LABEL, categoryFor, parseDateOnly } from "@/lib/category";
import { getAthleteByUser, getHashtagBoard, listHashtags } from "@/lib/data";
import { formatPoints, ordinal } from "@/lib/format";

export const metadata: Metadata = { title: "Hashboards" };

export default async function HashboardsPage() {
  const session = await auth();
  const athlete = session?.user ? await getAthleteByUser(session.user.id) : null;
  const tags = await listHashtags();
  const category = athlete ? categoryFor(athlete.birthDate, parseDateOnly(SEASON_2027.ageAsOf)!) : null;
  const yours = athlete && category
    ? await Promise.all(
        athlete.hashtags.map(async (tag) => ({
          tag,
          board: await getHashtagBoard(tag, category, athlete.sex),
        })),
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Your tags</p>
      <h1 className="mt-2 font-serif text-5xl">Hashboards</h1>
      <p className="mt-4 max-w-2xl text-ink/80">
        A hashtag you put on your profile opens its own ranking. The tag filters the world board and renumbers the
        athletes on it. Nothing is judged again, and nothing is paid apart.
      </p>

      {athlete && category ? (
        <section className="mt-10">
          <h2 className="font-serif text-3xl">Your hashboards</h2>
          <p className="mt-2 text-sm text-ink/60">
            {CATEGORY_LABEL[category]} · shown on Best Barrel, the filled demo board.
          </p>
          {yours.length === 0 ? (
            <p className="mt-4 border border-line bg-white px-4 py-6 text-sm text-ink/70">
              No hashtags on your profile yet.{" "}
              <Link href="/profile" className="text-ocean">
                Add some
              </Link>{" "}
              and each one becomes a hashboard.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              {yours.map(({ tag, board }) => {
                const mine = board?.rows.find((row) => row.athleteId === athlete.id);
                return (
                  <article key={tag} className="border border-line bg-white">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
                      <h3 className="font-serif text-2xl">
                        <Link href={`/hashboards/${tag}?category=${category}&sex=${athlete.sex}`} className="hover:text-ocean">
                          #{tag}
                        </Link>
                      </h3>
                      <p className="text-sm text-ink/70">
                        {mine ? `You are ${ordinal(mine.derivedPlace)}` : "You are not on this hashboard yet"}
                        {board ? ` · ${board.rows.length} on the tag` : ""}
                      </p>
                    </div>
                    {!board || board.rows.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-ink/60">Nobody placed on this tag yet.</p>
                    ) : (
                      <ol>
                        {board.rows.map((row) => (
                          <li
                            key={row.athleteId}
                            className={`flex items-baseline justify-between gap-4 px-4 py-2 text-sm ${row.athleteId === athlete.id ? "bg-foam" : ""}`}
                          >
                            <span>
                              <span className="mr-3 font-serif text-xl">{row.derivedPlace}</span>
                              <Link href={`/athlete/${row.athlete.slug}`} className="hover:text-ocean">
                                {row.athlete.displayName}
                              </Link>
                            </span>
                            <span>{formatPoints(row.points)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <p className="mt-6 text-sm text-ink/70">
          <Link href="/sign-in" className="text-ocean">
            Sign in
          </Link>{" "}
          to see the hashboards your own hashtags open.
        </p>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-3xl">All hashboards</h2>
        {tags.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">No hashtags on the circuit yet.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {tags.map((tag) => (
              <Link key={tag} href={`/hashboards/${tag}`} className="border border-line px-3 py-1 hover:border-ocean">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
