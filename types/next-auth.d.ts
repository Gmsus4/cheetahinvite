import "next-auth";

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    sessionVersion?: number;
  }
  interface Session {
    user: {
      id: string;
      role?: "ADMIN" | "USER";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sessionVersion?: number;
  }
}
