const ALLOWED_HOST =
  /^(?:[a-z0-9-]+\.)*vercel\.app$|^(?:[a-z0-9-]+\.)*gsr\.surf$|^(?:[a-z0-9-]+\.)*globalsurfrankings\.com$/i;

/**
 * Where a redirect should send the browser. Auth.js rewrites the request URL to
 * AUTH_URL before the sign-in check, so the request origin can be a host the
 * visitor cannot open. The forwarded host is the site they actually loaded.
 */
export function publicOrigin(input: {
  forwardedHost: string | null;
  forwardedProto: string | null;
  host: string | null;
  fallbackOrigin: string;
}): string {
  const forwarded = firstHost(input.forwardedHost);
  const fromHost = firstHost(input.host);
  const chosen = allowed(forwarded) ? forwarded : allowed(fromHost) ? fromHost : "";
  if (!chosen) return input.fallbackOrigin;
  const hostname = chosen.replace(/:\d+$/, "");
  const proto = input.forwardedProto?.split(",")[0]?.trim() === "http" ? "http" : "https";
  if (hostname === "localhost" || hostname === "127.0.0.1") return `${proto}://${chosen}`;
  return `${proto}://${hostname}`;
}

function firstHost(value: string | null): string {
  return value?.split(",")[0]?.trim().toLowerCase() ?? "";
}

function allowed(host: string): boolean {
  if (!host || host.includes("@") || host.includes("/") || host.includes(" ")) return false;
  const hostname = host.replace(/:\d+$/, "");
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return ALLOWED_HOST.test(hostname);
}

/** A same-site path. Absolute callback URLs are what sent sign-in to the wrong host. */
export function safeCallback(raw: string | null | undefined, fallback: string): string {
  const value = raw?.trim() ?? "";
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("://") ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.length > 200
  ) {
    return fallback;
  }
  return value;
}
