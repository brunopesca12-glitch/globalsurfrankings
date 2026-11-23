import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ATHLETE" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ATHLETE" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ATHLETE" | "ADMIN";
  }
}
