import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const signedIn = Boolean(auth?.user);
      if (pathname.startsWith("/admin")) return signedIn;
      if (pathname.startsWith("/perfil") || pathname.startsWith("/inscrever") || pathname.startsWith("/minhas")) {
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
