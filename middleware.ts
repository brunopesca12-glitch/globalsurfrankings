import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/profile/:path*", "/enter/:path*", "/my-waves/:path*", "/admin/:path*"],
};
