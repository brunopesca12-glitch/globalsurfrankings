import { publicationResponse } from "@/app/api/payment-orders/respond";
import { loadPublication } from "@/lib/payment-publish";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const publication = await loadPublication();
    return publicationResponse(request, publication.index, publication.index.contentHash);
  } catch {
    return Response.json({ error: "orders_unavailable" }, { status: 500 });
  }
}
