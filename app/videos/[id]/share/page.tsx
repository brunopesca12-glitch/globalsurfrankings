import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { ordinal } from "@/lib/format";

export const metadata: Metadata = { title: "Story" };

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.entry.findFirst({
    where: { id, status: "PLACED", placement: { isNot: null } },
    include: { athlete: true, theme: true, placement: true },
  });
  if (!entry?.placement) notFound();
  const title = themeBySlug(entry.theme.slug)?.name ?? entry.theme.name;

  return (
    <div className="mx-auto max-w-sm px-5 py-8">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Stories</p>
      <h1 className="mt-2 font-serif text-4xl">
        {ordinal(entry.placement.place)} · {title}
      </h1>
      <p className="mt-2 text-sm text-ink/70">{entry.athlete.displayName}. Save the card, then add it to an Instagram story.</p>
      <img
        alt={`${entry.athlete.displayName}, ${title}`}
        src={`/videos/${entry.id}/card`}
        className="mt-6 aspect-[9/16] w-full border border-line bg-ocean object-cover"
      />
      <a href={`/videos/${entry.id}/card`} download className="mt-4 inline-flex min-h-12 items-center bg-ocean px-4 text-paper">
        Save image
      </a>
      <p className="mt-4 text-sm">
        <Link href={`/videos/${entry.id}`} className="text-ocean">
          Watch the wave
        </Link>
      </p>
    </div>
  );
}
