import { publicationResponse } from "@/app/api/payment-orders/respond";
import { loadPublication } from "@/lib/payment-publish";
import { buildDemoSample, fileByPeriod } from "@/lib/payment-orders";

export const dynamic = "force-dynamic";

const PERIOD = /^\d{4}-W\d{2}$|^\d{4}-season$/;

export async function GET(request: Request, context: { params: Promise<{ period: string }> }) {
  const { period } = await context.params;
  if (period === "demo") {
    const demo = buildDemoSample();
    return publicationResponse(request, demo, demo.contentHash);
  }
  if (!PERIOD.test(period)) {
    return Response.json({ error: "unknown_period" }, { status: 404 });
  }
  try {
    const publication = await loadPublication();
    const file = fileByPeriod(publication, period);
    if (!file) return Response.json({ error: "unknown_period" }, { status: 404 });
    return publicationResponse(request, file, file.contentHash);
  } catch {
    return Response.json({ error: "orders_unavailable" }, { status: 500 });
  }
}
