import NextAuth from "next-auth";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { siteGateResponse } from "@/lib/site-gate";

const auth = NextAuth(authConfig).auth as NextMiddleware;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const gate = siteGateResponse(request.headers.get("authorization"));
  if (gate) return gate;
  return auth(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
