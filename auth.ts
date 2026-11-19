import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/prisma";
import { authRequestAddress, consumeAuthAttempt, type AuthAttemptScope } from "@/lib/auth-attempts";

class TooManyLoginAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}

class LoginTemporarilyUnavailable extends CredentialsSignin {
  code = "temporarily_unavailable";
}

async function checkLoginLimit(scope: AuthAttemptScope, identifier: string) {
  let budget;
  try {
    budget = await consumeAuthAttempt(scope, identifier);
  } catch {
    // A storage outage must never disable admission control.
    throw new LoginTemporarilyUnavailable();
  }
  if (!budget.allowed) throw new TooManyLoginAttempts();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    Credentials({
      name: "Correo electrónico",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        await checkLoginLimit("login-ip", authRequestAddress(request));
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || normalizedEmail.length > 254 || !password.length || password.length > 128) return null;
        await checkLoginLimit("login-email", normalizedEmail);

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (!token.sub) return null;
      const account = await prisma.user.findUnique({ where: { id: token.sub }, select: { sessionVersion: true, role: true } });
      if (!account) return null;
      token.role = account.role;
      if (user) token.sessionVersion = user.sessionVersion ?? account.sessionVersion;
      if ((token.sessionVersion ?? 0) !== account.sessionVersion) return null;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    },
  },
});
