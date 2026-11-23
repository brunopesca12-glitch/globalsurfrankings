import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { publicOrigin, safeCallback } from "@/lib/auth-redirect";

const PROTECTED = ["/admin", "/profile", "/enter", "/my-waves", "/judge"];

function needsAccount(pathname: string): boolean {
  return PROTECTED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname, search } = request.nextUrl;
      if (!needsAccount(pathname)) return true;
      if (auth?.user) return true;
      const origin = publicOrigin({
        forwardedHost: request.headers.get("x-forwarded-host"),
        forwardedProto: request.headers.get("x-forwarded-proto"),
        host: request.headers.get("host"),
        fallbackOrigin: request.nextUrl.origin,
      });
      const url = new URL("/sign-in", origin);
      url.searchParams.set("callbackUrl", safeCallback(`${pathname}${search}`, pathname));
      return NextResponse.redirect(url);
    },
    jwt({ token, user }) {
      if (user && "role" in user && user.role) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "ATHLETE";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
