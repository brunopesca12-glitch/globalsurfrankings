import { publicationResponse } from "@/app/api/payment-orders/respond";
import { loadPublication } from "@/lib/payment-publish";
import { prizeMoneyPublished } from "@/lib/prize";

export const dynamic = "force-dynamic";

const UNPUBLISHED = {
  published: false,
  note: "Prize money is not published. Rankings are season points. No amounts are listed.",
  orders: [],
};

export async function GET(request: Request) {
  if (!prizeMoneyPublished()) {
    return Response.json(UNPUBLISHED);
  }
  try {
    const publication = await loadPublication();
    return publicationResponse(request, publication.index, publication.index.contentHash);
  } catch {
    return Response.json({ error: "orders_unavailable" }, { status: 500 });
  }
}
