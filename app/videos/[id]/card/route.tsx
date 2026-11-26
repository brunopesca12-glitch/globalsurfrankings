import { ImageResponse } from "next/og";
import { themeBySlug } from "@/lib/catalogue";
import { prisma } from "@/lib/db";
import { ordinal } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.entry.findFirst({
    where: { id, status: "PLACED", placement: { isNot: null } },
    include: { athlete: true, theme: true, placement: true },
  });
  if (!entry?.placement) return new Response("Not found", { status: 404 });
  const title = themeBySlug(entry.theme.slug)?.name ?? entry.theme.name;
  const place = ordinal(entry.placement.place);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#07161c",
          color: "#f4efe6",
          padding: "80px 72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#e6d3b0" }}>GLOBAL SURF RANKINGS</div>
        <div style={{ display: "flex", fontSize: 180, lineHeight: 1, marginTop: 36 }}>{place}</div>
        <div style={{ display: "flex", fontSize: 64, marginTop: 12 }}>{title}</div>
        <div style={{ display: "flex", fontSize: 42, marginTop: 28, color: "#e6d3b0" }}>{entry.athlete.displayName}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 48, letterSpacing: 4 }}>gsr.surf</div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
