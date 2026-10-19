import { redirect } from "next/navigation";

export default async function LegacyHashtagRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ category?: string; sex?: string }>;
}) {
  const { tag } = await params;
  const query = await searchParams;
  const next = new URLSearchParams();
  if (query.category) next.set("category", query.category);
  if (query.sex) next.set("sex", query.sex);
  const suffix = next.toString();
  redirect(`/hashboards/${tag}${suffix ? `?${suffix}` : ""}`);
}
