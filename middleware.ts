import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/perfil/:path*", "/inscrever/:path*", "/minhas/:path*", "/admin/:path*"],
};
