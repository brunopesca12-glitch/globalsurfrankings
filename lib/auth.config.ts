import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const signedIn = Boolean(auth?.user);
      if (pathname.startsWith("/admin")) return signedIn;
      if (pathname.startsWith("/profile") || pathname.startsWith("/enter") || pathname.startsWith("/my-waves")) {
        return signedIn;
      }
      return true;
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
