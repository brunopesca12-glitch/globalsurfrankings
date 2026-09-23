/** Hyphen, not an em dash: HTTP header values must be bytes, and U+2014 crashes the challenge. */
const REALM = 'Basic realm="GSR - private preview", charset="UTF-8"';

export type GateDecision = "off" | "allow" | "deny";

function safeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function decodeBasicToken(token: string): string | null {
  try {
    const bytes = Uint8Array.from(atob(token), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Gate is off when the password env var is missing or empty. User defaults to `gsr`. */
export function decideSiteGate(input: {
  password: string | undefined;
  user: string | undefined;
  authorization: string | null;
}): GateDecision {
  const password = input.password ?? "";
  if (password.length === 0) return "off";

  const expectedUser = input.user && input.user.length > 0 ? input.user : "gsr";
  const header = input.authorization ?? "";
  if (!header.startsWith("Basic ")) return "deny";

  const decoded = decodeBasicToken(header.slice("Basic ".length).trim());
  if (!decoded) return "deny";
  const separator = decoded.indexOf(":");
  if (separator < 0) return "deny";

  const name = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);
  if (safeEqual(name, expectedUser) && safeEqual(pass, password)) return "allow";
  return "deny";
}

export function siteGateResponse(authorization: string | null): Response | null {
  const decision = decideSiteGate({
    password: process.env["SITE_GATE_PASSWORD"],
    user: process.env["SITE_GATE_USER"],
    authorization,
  });
  if (decision !== "deny") return null;
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "Cache-Control": "no-store",
    },
  });
}
