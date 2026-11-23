import { canonicalJson } from "@/lib/payment-orders";

export function publicationResponse(request: Request, body: unknown, hash: string): Response {
  const etag = `"${hash}"`;
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60",
    etag,
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(canonicalJson(body), { status: 200, headers });
}
